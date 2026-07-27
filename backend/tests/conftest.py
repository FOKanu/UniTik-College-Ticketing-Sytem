import os

import pytest

INTEGRATION = os.getenv("INTEGRATION_TESTS") == "1"

integration = pytest.mark.skipif(
    not INTEGRATION,
    reason="Integration tests require Postgres (INTEGRATION_TESTS=1)",
)
