"""Integrity checks for the Q&A retrieval regression set.

Does not run retrieval (that lands later) — it guarantees the golden set stays
consistent with the corpus: every case points to a real FAQ, with the right
department and answer. Regenerate with tests/data/build_qa_regression_set.py.
"""
import json
from pathlib import Path

from app.services.kb_content_parser import load_corpus, validate_corpus

DATA = Path(__file__).resolve().parent / "data" / "qa_regression_set.jsonl"
CONTENT_DIR = Path(__file__).resolve().parents[2] / "docs" / "knowledge-base"


def _load_cases():
    return [json.loads(line) for line in DATA.read_text(encoding="utf-8").splitlines() if line.strip()]


def _entries_by_id():
    return {e.id: e for e in validate_corpus(load_corpus(CONTENT_DIR))}


def test_regression_set_is_non_empty():
    assert len(_load_cases()) > 0


def test_every_case_points_to_a_real_faq():
    entries = _entries_by_id()
    for case in _load_cases():
        entry = entries.get(case["expected_faq_id"])
        assert entry is not None, f"unknown FAQ id: {case['expected_faq_id']}"
        assert case["expected_department"] == entry.department
        assert case["expected_answer"] == entry.answer


def test_queries_are_present_and_unique_enough():
    cases = _load_cases()
    assert all(c["query"].strip() for c in cases), "empty query in regression set"
    # every FAQ should be covered by at least its own question
    covered = {c["expected_faq_id"] for c in cases}
    assert len(covered) == len(_entries_by_id())
