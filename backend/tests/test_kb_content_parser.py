import json
from copy import deepcopy
from pathlib import Path

import pytest

from app.services.kb_content_parser import (
    CANONICAL_FILES,
    TOTAL_CANONICAL_ENTRIES,
    load_corpus,
    normalize_question,
    parse_knowledge_base_document,
    validate_corpus,
)
from app.services.kb_embedding import build_context_blob

CORPUS_DIR = Path(__file__).resolve().parents[2] / "docs" / "knowledge-base"


def canonical_text():
    return (CORPUS_DIR / "finance_EN.md").read_text(encoding="utf-8")


def test_all_canonical_files_parse_to_derived_unique_entry_total():
    documents = load_corpus(CORPUS_DIR)
    entries = validate_corpus(documents)
    assert [len(document.entries) for document in documents] == [
        spec[2] for spec in CANONICAL_FILES.values()
    ]
    identities = {(entry.id, entry.language) for entry in entries}
    assert len(entries) == len(identities) == TOTAL_CANONICAL_ENTRIES


def test_verified_question_normalization_is_preserved():
    assert normalize_question("  Where   IS this?!  ") == "where is this"
    assert normalize_question("Can I use ‘quotes’ and “doubles”?") == (
        "can i use 'quotes' and \"doubles\""
    )
    assert normalize_question("punctuation, inside stays.") == "punctuation, inside stays"


@pytest.mark.parametrize(
    ("mutator", "message"),
    [
        (
            lambda text: text.replace(
                "department: Finance", "department: Finance\ndepartment: Finance"
            ),
            "duplicate",
        ),
        (lambda text: text.replace("audience: Student\n", ""), "missing"),
        (lambda text: text.replace("audience: Student", "audience:"), "must not be empty"),
        (
            lambda text: text.replace(
                "source: team-synthetic-data", "source: team-synthetic-data\nextra: value"
            ),
            "unknown",
        ),
        (lambda text: text.removeprefix("---\n"), "opening"),
        (lambda text: text.replace("# Finance", "unexpected preamble"), "unexpected text"),
        (
            lambda text: text.replace("### Question", "stray text\n### Question", 1),
            "unexpected text",
        ),
        (lambda text: text.replace("### Question", "### Unknown", 1), "unknown FAQ subsection"),
        (
            lambda text: text.replace("### Answer", "### Question\n\nDuplicate\n\n### Answer", 1),
            "duplicate",
        ),
        (
            lambda text: text.replace("### Escalation", "### Escalation removed", 1),
            "unknown FAQ subsection",
        ),
        (lambda text: text.replace("- Tuition due date", "not a bullet", 1), "malformed bullet"),
    ],
)
def test_malformed_markdown_fails(mutator, message):
    with pytest.raises(ValueError, match=message):
        parse_knowledge_base_document(mutator(canonical_text()), "finance.md")


def test_duplicate_id_fails():
    text = canonical_text().replace("faq-finance-002", "faq-finance-001", 1)
    with pytest.raises(ValueError, match="duplicate FAQ ID"):
        parse_knowledge_base_document(text, "finance.md")


def test_sequential_gap_and_duplicate_normalized_question_fail():
    documents = load_corpus(CORPUS_DIR)
    gap = deepcopy(documents)
    gap[0].entries[1].id = "faq-academics-003"
    with pytest.raises(ValueError, match="sequential ID"):
        validate_corpus(gap)

    duplicate = deepcopy(documents)
    duplicate[2].entries[0].question = duplicate[0].entries[0].question + "?!"
    with pytest.raises(ValueError, match="duplicate normalized question"):
        validate_corpus(duplicate)


def test_unexpected_filename_and_document_count_fail():
    documents = load_corpus(CORPUS_DIR)
    with pytest.raises(ValueError, match=f"exactly {len(CANONICAL_FILES)} documents"):
        validate_corpus(documents[:-1])
    unexpected = deepcopy(documents)
    unexpected[0].file_path = "unexpected.md"
    with pytest.raises(ValueError, match="unexpected canonical filename"):
        validate_corpus(unexpected)


def test_context_blob_is_deterministic_with_exact_field_order():
    entry = load_corpus(CORPUS_DIR)[0].entries[0]
    first = build_context_blob(entry)
    assert first == build_context_blob(entry)
    assert list(json.loads(first)) == [
        "id",
        "department",
        "audience",
        "language",
        "question",
        "relatedPhrasings",
        "keywords",
        "answer",
        "escalation",
    ]
