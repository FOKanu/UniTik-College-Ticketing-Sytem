import re
from pathlib import Path

from app.services.kb_content_parser import (
    CANONICAL_FILES,
    TOTAL_CANONICAL_ENTRIES,
    load_corpus,
    normalize_question,
    validate_corpus,
)

KB_DIR = Path(__file__).parents[2] / "docs" / "knowledge-base"
FOCUSED_FILES = ("registrar.md", "housing.md")
FORBIDDEN = (
    "university of rochester",
    "rochester.edu",
    "urmc.rochester.edu",
    "lovejoy hall",
    "fyre",
    "national student clearinghouse",
    "paradigm",
    "fedex",
    "usps",
    "duo",
)


def test_complete_corpus_counts_ids_and_questions_are_consistent():
    documents = load_corpus(KB_DIR)
    entries = validate_corpus(documents)
    assert len(documents) == len(CANONICAL_FILES)
    assert len(entries) == TOTAL_CANONICAL_ENTRIES
    assert len({entry.id for entry in entries}) == TOTAL_CANONICAL_ENTRIES
    assert len({normalize_question(entry.question) for entry in entries}) == TOTAL_CANONICAL_ENTRIES
    for document in documents:
        filename = Path(document.file_path).name
        department, prefix, count = CANONICAL_FILES[filename]
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
        assert not re.search(r"\bur student\b", lowered)
        assert not re.search(
            r"\b(click here|designated phone number|appropriate link|relevant website)\b",
            lowered,
        )
        assert all(domain == "university.example" for domain in re.findall(r"@([\w.-]+)", text))
        assert all("university.example" in url for url in re.findall(r"https?://[^\s)]+", text))
        document = next(doc for doc in load_corpus(KB_DIR) if Path(doc.file_path).name == filename)
        for faq in document.entries:
            assert "https://portal.university.example" in faq.answer
            assert (
                "@university.example" in faq.escalation
                or "https://portal.university.example" in faq.escalation
            )
            assert len(faq.related_phrasings) >= 3


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
