"""
SSO stub — pending IT confirmation of the university's Microsoft/Entra ID SSO interface.

Open issue: OI-01. The source system, access method, and authentication protocol
are not confirmed yet, so this module intentionally does NOT:
  - validate any token against Microsoft/Entra
  - create or look up real users
  - get imported by anything outside app/api/v1/auth.py

When OI-01 is resolved, replace the body of `login_with_sso` with the real
OpenID Connect / MSAL exchange, then wire it into app/services/auth.py behind
a feature flag (e.g. settings.sso_enabled) so local/dev auth keeps working
without it.
"""

from app.core.exceptions import AppError
from app.schemas.auth import SsoLoginRequest


async def login_with_sso(data: SsoLoginRequest) -> None:
    raise AppError(
        f"SSO login via '{data.provider}' is not implemented yet (blocked on OI-01)",
        status_code=501,
    )