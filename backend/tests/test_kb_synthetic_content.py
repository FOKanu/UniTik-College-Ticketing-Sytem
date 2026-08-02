import re
from pathlib import Path
from urllib.parse import urlparse

from app.services.kb_content_parser import (
    CANONICAL_FILES,
    TOTAL_CANONICAL_ENTRIES,
    load_corpus,
    normalize_question,
    validate_corpus,
)

KB_DIR = Path(__file__).parents[2] / "docs" / "knowledge-base"
FOCUSED_FILES = ("registrar.md", "housing.md")
EXPECTED_COUNTS = {
    "academics.md": 30,
    "finance.md": 15,
    "it-support.md": 15,
    "maintenance.md": 15,
    "registrar.md": 55,
    "housing.md": 53,
}
FORBIDDEN = (
    "university of rochester",
    "rochester",
    "rochester.edu",
    "urmc.rochester.edu",
    "lovejoy",
    "fyre",
    "hajim",
    "simon",
    "warner",
    "eastman",
    "eioh",
    "lattimore",
    "monroe county",
    "new york state",
    "00289400",
    "00289401",
    "national student clearinghouse",
    "paradigm",
    "fedex",
    "usps",
    "duo",
)


def test_complete_corpus_counts_ids_and_questions_are_consistent():
    documents = load_corpus(KB_DIR)
    entries = validate_corpus(documents)
    assert len(documents) == len(EXPECTED_COUNTS) == 6
    assert TOTAL_CANONICAL_ENTRIES == sum(EXPECTED_COUNTS.values()) == 183
    assert len(entries) == 183
    assert len({entry.id for entry in entries}) == 183
    assert len({normalize_question(entry.question) for entry in entries}) == 183
    for document in documents:
        filename = Path(document.file_path).name
        department, prefix, count = CANONICAL_FILES[filename]
        assert count == EXPECTED_COUNTS[filename]
        assert document.department == department
        assert len(document.entries) == count
        assert [entry.id for entry in document.entries] == [
            f"{prefix}{index:03d}" for index in range(1, count + 1)
        ]


def test_housing_and_registrar_are_actionable_and_synthetic():
    for filename in FOCUSED_FILES:
        text = (KB_DIR / filename).read_text(encoding="utf-8")
        lowered = text.lower()
        assert not any(marker in lowered for marker in FORBIDDEN)
        assert not re.search(r"\b(ur student|urid|ur id|fice)\b", lowered)
        assert not re.search(
            r"\b(click here|designated phone number|appropriate link|relevant website)\b",
            lowered,
        )
        assert all(domain == "university.example" for domain in re.findall(r"@([\w.-]+)", text))
        assert all(
            urlparse(url.rstrip(".,;:`")).hostname == "portal.university.example"
            for url in re.findall(r"https?://[^\s)]+", text)
        )
        document = next(doc for doc in load_corpus(KB_DIR) if Path(doc.file_path).name == filename)
        for faq in document.entries:
            assert "https://portal.university.example" in faq.answer
            assert (
                "@university.example" in faq.escalation
                or "https://portal.university.example" in faq.escalation
            )
            assert len(faq.related_phrasings) >= 3


def test_every_canonical_document_is_deidentified():
    corpus = "\n".join(
        (KB_DIR / filename).read_text(encoding="utf-8") for filename in CANONICAL_FILES
    ).lower()
    assert not any(marker in corpus for marker in FORBIDDEN)
    assert not re.search(r"\b(ur student|urid|ur id|fice)\b", corpus)


def test_cross_department_workflows_share_canonical_ownership():
    entries = {entry.id: entry for document in load_corpus(KB_DIR) for entry in document.entries}

    transcript_url = "https://portal.university.example/registrar/transcripts"
    for entry_id in ("faq-academics-023", "faq-registrar-020"):
        assert transcript_url in entries[entry_id].answer
        assert "registrar@university.example" in entries[entry_id].escalation

    verification_url = "https://portal.university.example/registrar/enrollment-verification"
    for entry_id in ("faq-academics-021", "faq-registrar-028"):
        assert verification_url in entries[entry_id].answer
        assert "registrar@university.example" in entries[entry_id].escalation

    maintenance_url = "https://portal.university.example/maintenance/housing"
    for entry_id in ("faq-maintenance-012", "faq-housing-046"):
        assert maintenance_url in entries[entry_id].answer
        assert "maintenance@university.example" in entries[entry_id].escalation

    for entry_id in ("faq-maintenance-006", "faq-housing-053"):
        answer = entries[entry_id].answer
        assert "https://portal.university.example" in answer
        assert "https://portal.university.example/support/it" in answer
        assert "deactivate" in answer.lower()
        assert "replacement" in answer.lower()
        assert "it-support@university.example" in entries[entry_id].escalation

    for entry_id in ("faq-it-support-008", "faq-registrar-053"):
        combined = f"{entries[entry_id].question} {entries[entry_id].answer}".lower()
        assert "multi-factor authentication" in combined
        assert "https://portal.university.example/support/it" in entries[entry_id].answer
        assert "it-support@university.example" in entries[entry_id].escalation

    finance_url = "https://portal.university.example/finance"
    for entry_id in ("faq-finance-008", "faq-registrar-054"):
        assert finance_url in entries[entry_id].answer
        assert "finance@university.example" in entries[entry_id].escalation
        assert "third-party" in entries[entry_id].answer.lower()


def test_no_exact_or_near_duplicate_focused_questions():
    documents = load_corpus(KB_DIR)
    questions = [
        normalize_question(entry.question)
        for document in documents
        if Path(document.file_path).name in FOCUSED_FILES
        for entry in document.entries
    ]
    assert len(questions) == len(set(questions))
    token_sets = [set(re.findall(r"[a-z0-9]+", question)) for question in questions]
    for index, left in enumerate(token_sets):
        for right in token_sets[index + 1 :]:
            similarity = len(left & right) / len(left | right)
            assert similarity < 0.85
