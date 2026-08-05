"""Rule-based ticket department/category classification.

This is a placeholder for the eventual AI/LLM classifier — see
app/services/chat.py and app/services/kb.py for the existing AI/RAG work.
Until that lands, routing is a simple keyword-count heuristic.

NEG-6 requires never presenting a low-confidence guess as a confident
classification, so `classify_ticket` returns an all-None result on ties or
no keyword matches rather than guessing a department.
"""

import re
from dataclasses import dataclass

DEPARTMENT_KEYWORDS: dict[str, list[str]] = {
    "IT": [
        "wifi",
        "login",
        "password",
        "portal",
        "account",
        "network",
        "vpn",
        "email",
        "software",
        "computer",
    ],
    "Maintenance": [
        "leak",
        "heater",
        "broken",
        "repair",
        "facility",
        "electricity",
        "plumbing",
        "room",
        "furniture",
        "air conditioning",
    ],
    "Finance": [
        "tuition",
        "payment",
        "invoice",
        "refund",
        "fee",
        "scholarship",
        "bill",
        "transfer",
        "financial aid",
    ],
    "Academics": [
        "exam",
        "grade",
        "course",
        "professor",
        "registration",
        "curriculum",
        "class",
        "transcript",
        "credit",
    ],
}

_PATTERNS: dict[str, list[re.Pattern]] = {
    dept: [re.compile(rf"\b{re.escape(kw)}\b") for kw in keywords]
    for dept, keywords in DEPARTMENT_KEYWORDS.items()
}


@dataclass
class ClassificationResult:
    department: str | None
    category: str | None
    classification_source: str | None  # "rule-engine" or None


def classify_ticket(subject: str, description: str) -> ClassificationResult:
    text = f"{subject} {description}".lower()
    best_department: str | None = None
    best_count = 0
    tie = False
    for department, patterns in _PATTERNS.items():
        count = sum(1 for p in patterns if p.search(text))
        if count == 0:
            continue
        if count > best_count:
            best_department, best_count, tie = department, count, False
        elif count == best_count:
            tie = True
    if best_department is None or tie:
        return ClassificationResult(None, None, None)
    return ClassificationResult(best_department, best_department.lower(), "rule-engine")
