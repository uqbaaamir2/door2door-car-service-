from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

bearer_scheme = HTTPBearer(auto_error=False)


def authenticate_admin(username: str, password: str) -> str | None:
    if username == settings.admin_username and password == settings.admin_password:
        return settings.admin_token
    return None


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or credentials.credentials != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )
    return credentials.credentials


# Customer authentication helpers. Uses a signed, expiring token without adding
# another dependency to the existing backend.
import base64
import hashlib
import hmac
import json
import secrets
import time

from .config import settings


_PASSWORD_ITERATIONS = 310_000


def hash_customer_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        _PASSWORD_ITERATIONS,
    )
    return f"{base64.urlsafe_b64encode(salt).decode().rstrip('=')}.{base64.urlsafe_b64encode(digest).decode().rstrip('=')}"


def verify_customer_password(password: str, stored: str) -> bool:
    try:
        salt_b64, digest_b64 = stored.split(".", 1)
        salt = base64.urlsafe_b64decode(salt_b64 + "=" * (-len(salt_b64) % 4))
        expected = base64.urlsafe_b64decode(digest_b64 + "=" * (-len(digest_b64) % 4))
        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            _PASSWORD_ITERATIONS,
        )
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _sign_customer_payload(payload: bytes) -> str:
    signature = hmac.new(
        settings.customer_auth_secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).digest()
    return base64.urlsafe_b64encode(signature).decode().rstrip("=")


def create_customer_token(customer_id: int) -> str:
    payload = json.dumps(
        {"sub": customer_id, "exp": int(time.time()) + 60 * 60 * 24 * 7},
        separators=(",", ":"),
    ).encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload).decode().rstrip("=")
    return f"{encoded}.{_sign_customer_payload(encoded.encode('utf-8'))}"


def get_customer_id_from_token(token: str) -> int | None:
    try:
        encoded, signature = token.split(".", 1)
        expected = _sign_customer_payload(encoded.encode("utf-8"))
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(
            base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)).decode("utf-8")
        )
        if int(payload["exp"]) < int(time.time()):
            return None
        return int(payload["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError, ValueError):
        return None


def require_customer(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> int:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer login required",
        )
    customer_id = get_customer_id_from_token(credentials.credentials)
    if customer_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired customer session",
        )
    return customer_id
