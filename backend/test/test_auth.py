"""
Authentication tests for BarberOS backend.

Covers login flow, JWT token validation, protected endpoint access,
and brute-force resilience.
"""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.core.config import settings
from app.core.security import create_access_token

pytestmark = pytest.mark.asyncio


# ────────────────────────────── Login ──────────────────────────────


class TestLoginSuccess:
    async def test_login_correct_credentials(self, client, owner_a):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "owner_a@test.com", "password": "Password123!"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_jwt_contains_correct_owner_id(self, client, owner_a):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "owner_a@test.com", "password": "Password123!"},
        )
        token = resp.json()["access_token"]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == str(owner_a.id)

    async def test_login_token_expiry_is_1440_minutes(self, client, owner_a):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "owner_a@test.com", "password": "Password123!"},
        )
        token = resp.json()["access_token"]
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        # Should expire ~1440 minutes from now (±30 seconds tolerance)
        expected = datetime.now(timezone.utc) + timedelta(minutes=1440)
        assert abs((exp - expected).total_seconds()) < 30


class TestLoginFailures:
    async def test_login_wrong_password(self, client, owner_a):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "owner_a@test.com", "password": "WrongPassword!"},
        )
        assert resp.status_code == 401

    async def test_login_nonexistent_email(self, client):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@test.com", "password": "Password123!"},
        )
        assert resp.status_code == 401

    async def test_login_empty_email(self, client):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "", "password": "Password123!"},
        )
        assert resp.status_code == 422

    async def test_login_empty_password(self, client, owner_a):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "owner_a@test.com", "password": ""},
        )
        assert resp.status_code == 422

    async def test_login_malformed_email(self, client):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "not-an-email", "password": "Password123!"},
        )
        assert resp.status_code == 422


# ─────────────── Protected endpoint access ────────────────────────


class TestProtectedEndpoints:
    """Verify that protected endpoints reject invalid/missing tokens."""

    PROTECTED_URL = "/api/v1/employees"

    async def test_no_token_returns_401_or_403(self, client):
        """HTTPBearer scheme returns 403 when no credentials provided."""
        resp = await client.get(self.PROTECTED_URL)
        assert resp.status_code in (401, 403)

    async def test_expired_token_returns_401(self, client, owner_a):
        expired_token = create_access_token(
            data={"sub": str(owner_a.id)},
            expires_delta=timedelta(minutes=-1),
        )
        resp = await client.get(
            self.PROTECTED_URL,
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert resp.status_code == 401

    async def test_tampered_token_returns_401(self, client, owner_a):
        token = create_access_token(data={"sub": str(owner_a.id)})
        tampered = token[:-5] + "XXXXX"
        resp = await client.get(
            self.PROTECTED_URL,
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert resp.status_code == 401

    async def test_malformed_token_returns_error(self, client):
        resp = await client.get(
            self.PROTECTED_URL,
            headers={"Authorization": "Bearer not.a.jwt"},
        )
        assert resp.status_code in (401, 403)

    async def test_token_with_wrong_secret(self, client, owner_a):
        bad_token = jwt.encode(
            {"sub": str(owner_a.id), "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            "wrong-secret-key",
            algorithm=settings.ALGORITHM,
        )
        resp = await client.get(
            self.PROTECTED_URL,
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert resp.status_code == 401

    async def test_token_with_nonexistent_user_id(self, client):
        fake_token = create_access_token(data={"sub": str(uuid.uuid4())})
        resp = await client.get(
            self.PROTECTED_URL,
            headers={"Authorization": f"Bearer {fake_token}"},
        )
        assert resp.status_code == 401


# ─────────────── Brute force ──────────────────────────────────────


class TestBruteForce:
    async def test_20_rapid_wrong_password_attempts(self, client, owner_a):
        """App must not crash under 20 rapid wrong-password attempts."""
        for _ in range(20):
            resp = await client.post(
                "/api/v1/auth/login",
                json={"email": "owner_a@test.com", "password": "wrong!"},
            )
            assert resp.status_code == 401
        # Verify the app still works after brute force
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "owner_a@test.com", "password": "Password123!"},
        )
        assert resp.status_code == 200
