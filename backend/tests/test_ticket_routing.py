from app.services.ticket_routing import ClassificationResult, classify_ticket


def test_classify_ticket_clear_it_match():
    result = classify_ticket(
        "Cannot connect to campus wifi",
        "My laptop keeps dropping the wifi connection and I can't log into the portal.",
    )
    assert result.department == "IT"
    assert result.category == "it"
    assert result.classification_source == "rule-engine"


def test_classify_ticket_clear_finance_match():
    result = classify_ticket(
        "Tuition invoice looks wrong",
        "My tuition invoice shows an incorrect fee and I need a refund.",
    )
    assert result.department == "Finance"
    assert result.category == "finance"
    assert result.classification_source == "rule-engine"


def test_classify_ticket_no_match_returns_all_none():
    result = classify_ticket(
        "My pet hamster escaped",
        "He got out of his cage again and I can't find him anywhere.",
    )
    assert result == ClassificationResult(None, None, None)


def test_classify_ticket_tie_returns_all_none():
    # "account" (IT) and "refund" (Finance) each match exactly once — a tie,
    # so NEG-6 requires returning None rather than guessing between them.
    result = classify_ticket(
        "Need help",
        "I want to check my account and also ask about a refund.",
    )
    assert result == ClassificationResult(None, None, None)


def test_classify_ticket_account_word_boundary_regression():
    # Regression: the original TypeScript classifier matched keywords as
    # substrings, so a short "ac" (air conditioning) keyword would falsely
    # match inside "account" and misroute IT tickets to Maintenance. The
    # word-boundary regex here must not reproduce that — "account" alone
    # should only ever match the IT keyword "account" itself.
    result = classify_ticket(
        "Can't log into my account",
        "I can't access my student account online and need my password reset.",
    )
    assert result.department == "IT"
    assert result.classification_source == "rule-engine"
