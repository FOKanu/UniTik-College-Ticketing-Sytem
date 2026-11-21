"""Generate the Q&A retrieval regression set from the live KB corpus.

For every FAQ entry, emit one golden test case per 'Related phrasing' (a paraphrase
of the question). Each case records the query, the FAQ it should retrieve, its
department, and the expected answer. Re-run this whenever the corpus changes.

    python -m tests.data.build_qa_regression_set
"""
import json
from pathlib import Path

from app.services.kb_content_parser import load_corpus, validate_corpus

CONTENT_DIR = Path(__file__).resolve().parents[2].parent / "docs" / "knowledge-base"
OUT = Path(__file__).resolve().parent / "qa_regression_set.jsonl"


def main() -> None:
    docs = load_corpus(CONTENT_DIR)
    entries = validate_corpus(docs)

    cases = []
    for e in entries:
        # the exact question itself
        cases.append({
            "query": e.question,
            "expected_faq_id": e.id,
            "expected_department": e.department,
            "expected_answer": e.answer,
            "query_type": "question",
        })
        # each paraphrase
        for phrasing in e.related_phrasings:
            cases.append({
                "query": phrasing,
                "expected_faq_id": e.id,
                "expected_department": e.department,
                "expected_answer": e.answer,
                "query_type": "related_phrasing",
            })

    with OUT.open("w", encoding="utf-8") as f:
        for c in cases:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")

    print(f"Wrote {len(cases)} golden cases from {len(entries)} FAQ entries -> {OUT.name}")
    from collections import Counter
    print("By department:", dict(Counter(c["expected_department"] for c in cases)))


if __name__ == "__main__":
    main()
