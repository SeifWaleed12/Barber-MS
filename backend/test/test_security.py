"""
Security tests for BarberOS backend.

Critical tests verifying tenant isolation, SQL injection resistance,
XSS handling, password hashing, and JWT secret protection.
"""
import uuid

import pytest
from sqlalchemy import select, text

from test.factories.employee_factory import create_employee
from test.factories.service_factory import create_service
from test.factories.session_factory import create_session_in_db
from app.models.user import User
from app.models.cost import Cost
from app.models.discount import Discount
from datetime import date

pytestmark = pytest.mark.asyncio


# ─── Helpers ──────────────────────────────────────────────────────

async def _create_cost(db, owner_id, month="2026-03", label="Rent", amount=5000.0):
    cost = Cost(
        id=uuid.uuid4(), owner_id=owner_id, month=month, label=label, amount=amount
    )
    db.add(cost)
    await db.flush()
    await db.refresh(cost)
    return cost


async def _create_discount(db, owner_id, name="10% Off", dtype="percentage", value=10.0):
    d = Discount(id=uuid.uuid4(), owner_id=owner_id, name=name, type=dtype, value=value)
    db.add(d)
    await db.flush()
    await db.refresh(d)
    return d


# ─────────────── Tenant Isolation (Owner A vs Owner B) ────────────


class TestTenantIsolation:
    """
    The most critical tests.
    Owner B must NEVER see, modify, or delete Owner A's data.
    """

    async def test_owner_b_cannot_list_owner_a_employees(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        await create_employee(db_session, owner_a.id, name="Secret Barber")
        resp = await client.get("/api/v1/employees", headers=auth_headers_b)
        assert resp.json() == []

    async def test_owner_b_cannot_list_owner_a_sessions(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        emp = await create_employee(db_session, owner_a.id)
        today = date.today()
        await create_session_in_db(
            db_session, owner_a.id, emp.id, session_date=today
        )
        resp = await client.get(
            "/api/v1/sessions",
            params={"start": today.isoformat(), "end": today.isoformat()},
            headers=auth_headers_b,
        )
        assert resp.json() == []

    async def test_owner_b_cannot_update_owner_a_employee(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        emp = await create_employee(db_session, owner_a.id, name="A's Barber")
        resp = await client.put(
            f"/api/v1/employees/{emp.id}",
            json={"name": "Hijacked"},
            headers=auth_headers_b,
        )
        assert resp.status_code == 404

    async def test_owner_b_cannot_delete_owner_a_employee(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        emp = await create_employee(db_session, owner_a.id, name="A's Barber")
        resp = await client.delete(
            f"/api/v1/employees/{emp.id}", headers=auth_headers_b
        )
        assert resp.status_code == 404

    async def test_owner_b_cannot_delete_owner_a_session(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        emp = await create_employee(db_session, owner_a.id)
        sess = await create_session_in_db(db_session, owner_a.id, emp.id)
        resp = await client.delete(
            f"/api/v1/sessions/{sess.id}", headers=auth_headers_b
        )
        assert resp.status_code == 404

    async def test_owner_b_cannot_delete_owner_a_cost(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        cost = await _create_cost(db_session, owner_a.id)
        resp = await client.delete(
            f"/api/v1/costs/{cost.id}", headers=auth_headers_b
        )
        assert resp.status_code == 404

    async def test_owner_b_cannot_see_owner_a_services(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        await create_service(db_session, owner_a.id, name="Premium Cut")
        resp = await client.get("/api/v1/services", headers=auth_headers_b)
        assert resp.json() == []

    async def test_owner_b_reports_show_zeros_for_owner_a_data(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        emp = await create_employee(db_session, owner_a.id, salary=5000)
        today = date.today()
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=today, total_revenue=10000
        )
        # Owner B's dashboard should show zeros
        resp = await client.get("/api/v1/reports/dashboard", headers=auth_headers_b)
        data = resp.json()
        assert data["today_revenue"] == 0
        assert data["month_revenue"] == 0

    async def test_no_endpoint_returns_other_owners_owner_id(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        """Verify no response body for Owner B contains Owner A's id."""
        await create_employee(db_session, owner_a.id, name="A's")
        await create_service(db_session, owner_a.id, name="A's svc")

        owner_a_id_str = str(owner_a.id)

        # Check employees
        resp = await client.get("/api/v1/employees", headers=auth_headers_b)
        assert owner_a_id_str not in resp.text

        # Check services
        resp = await client.get("/api/v1/services", headers=auth_headers_b)
        assert owner_a_id_str not in resp.text


# ─────────────── SQL Injection ────────────────────────────────────


class TestSQLInjection:
    async def test_sql_injection_in_email_returns_422_not_500(self, client):
        injections = [
            "' OR 1=1 --",
            "'; DROP TABLE users; --",
            "admin@test.com' UNION SELECT * FROM users--",
        ]
        for payload in injections:
            resp = await client.post(
                "/api/v1/auth/login",
                json={"email": payload, "password": "anything"},
            )
            assert resp.status_code == 422, (
                f"SQL injection '{payload}' returned {resp.status_code} instead of 422"
            )

    async def test_sql_injection_in_name_fields_is_sanitized(
        self, client, auth_headers_a
    ):
        malicious = "'; DROP TABLE employees; --"
        resp = await client.post(
            "/api/v1/employees",
            json={"name": malicious, "salary": 3000},
            headers=auth_headers_a,
        )
        # Should be saved as plain text, not executed
        assert resp.status_code == 201
        assert resp.json()["name"] == malicious

    async def test_sql_injection_in_search_param(
        self, client, auth_headers_a
    ):
        resp = await client.get(
            "/api/v1/employees",
            params={"search": "'; DROP TABLE employees; --"},
            headers=auth_headers_a,
        )
        # Should not crash
        assert resp.status_code == 200


# ─────────────── XSS ─────────────────────────────────────────────


class TestXSS:
    async def test_script_tag_in_name_saved_as_plain_text(
        self, client, auth_headers_a
    ):
        xss_payload = "<script>alert(1)</script>"
        resp = await client.post(
            "/api/v1/employees",
            json={"name": xss_payload, "salary": 3000},
            headers=auth_headers_a,
        )
        assert resp.status_code == 201
        data = resp.json()
        # Saved as-is (plain text), never executed
        assert data["name"] == xss_payload

    async def test_xss_in_service_name(self, client, auth_headers_a):
        xss = "<img src=x onerror=alert(1)>"
        resp = await client.post(
            "/api/v1/services",
            json={"name": xss, "price": 50},
            headers=auth_headers_a,
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == xss


# ─────────────── Password Hashing ─────────────────────────────────


class TestPasswordSecurity:
    async def test_passwords_are_bcrypt_hashed_in_database(
        self, db_session, owner_a
    ):
        """Verify stored password starts with bcrypt prefix."""
        stmt = select(User).where(User.id == owner_a.id)
        result = await db_session.execute(stmt)
        user = result.scalar_one()
        assert user.password.startswith("$2b$") or user.password.startswith("$2a$"), (
            f"Password does not appear to be bcrypt hashed: {user.password[:20]}..."
        )

    async def test_password_is_never_plain_text(self, db_session, owner_a):
        stmt = select(User).where(User.id == owner_a.id)
        result = await db_session.execute(stmt)
        user = result.scalar_one()
        assert user.password != "Password123!"


# ─────────────── JWT Secret Protection ────────────────────────────


class TestJWTSecretProtection:
    async def test_jwt_secret_never_in_login_response(self, client, owner_a):
        from app.core.config import settings
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "owner_a@test.com", "password": "Password123!"},
        )
        assert settings.SECRET_KEY not in resp.text

    async def test_jwt_secret_never_in_employee_response(
        self, client, auth_headers_a
    ):
        from app.core.config import settings
        resp = await client.post(
            "/api/v1/employees",
            json={"name": "Test", "salary": 3000},
            headers=auth_headers_a,
        )
        assert settings.SECRET_KEY not in resp.text

    async def test_jwt_secret_never_in_error_response(self, client):
        from app.core.config import settings
        resp = await client.get("/api/v1/employees")
        assert settings.SECRET_KEY not in resp.text
