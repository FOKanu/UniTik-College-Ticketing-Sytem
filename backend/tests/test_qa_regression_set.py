"""Integrity checks for the Q&A retrieval regression set.

Does not run retrieval (that lands later) — it guarantees the golden set stays
consistent with the corpus: every case points to a real FAQ, with the right
department and answer. Regenerate with tests/data/build_qa_regression_set.py.

FAQ IDs are shared across languages; identity is (id, language) — see
kb_content_parser.validate_corpus.
"""

import json
from pathlib import Path

from app.services.kb_content_parser import load_corpus, validate_corpus

DATA = Path(__file__).resolve().parent / "data" / "qa_regression_set.jsonl"
CONTENT_DIR = Path(__file__).resolve().parents[2] / "docs" / "knowledge-base"


def _load_cases():
    lines = DATA.read_text(encoding="utf-8").splitlines()
    return [json.loads(line) for line in lines if line.strip()]


def _entries_by_identity():
    """Map (faq_id, language) → entry. IDs alone are not unique across EN/DE."""
    return {(e.id, e.language): e for e in validate_corpus(load_corpus(CONTENT_DIR))}


def test_regression_set_is_non_empty():
    assert len(_load_cases()) > 0


def test_every_case_points_to_a_real_faq():
    entries = _entries_by_identity()
    for case in _load_cases():
        language = case.get("expected_language")
        assert language, f"case missing expected_language: {case.get('query')!r}"
        key = (case["expected_faq_id"], language)
        entry = entries.get(key)
        assert entry is not None, f"unknown FAQ identity: {key}"
        assert case["expected_department"] == entry.department
        assert case["expected_answer"] == entry.answer


def test_queries_are_present_and_unique_enough():
    cases = _load_cases()
    assert all(c["query"].strip() for c in cases), "empty query in regression set"
    # every (id, language) FAQ should be covered by at least its own question
    covered = {(c["expected_faq_id"], c["expected_language"]) for c in cases}
    assert len(covered) == len(_entries_by_identity())
