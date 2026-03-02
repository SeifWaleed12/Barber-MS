"""
Session CRUD tests for BarberOS backend.

Covers creation with revenue validation, discount handling,
date filtering, tenant isolation, and deletion.
"""
import uuid
from datetime import date, timedelta

import pytest

from test.factories.employee_factory import create_employee
from test.factories.service_factory import create_service
from test.factories.session_factory import (
    build_session_payload,
    create_session_in_db,
)
from app.models.discount import Discount

pytestmark = pytest.mark.asyncio


# ─── Helpers ──────────────────────────────────────────────────────

async def _create_discount(db, owner_id, name="10% Off", dtype="percentage", value=10.0):
    d = Discount(id=uuid.uuid4(), owner_id=owner_id, name=name, type=dtype, value=value)
    db.add(d)
    await db.flush()
    await db.refresh(d)
    return d


# ────────────────────────── POST /sessions ─────────────────────────


class TestCreateSession:
    async def test_create_with_valid_data(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id, name="Barber")
        svc = await create_service(db_session, owner_a.id, name="Haircut", price=50)
        payload = build_session_payload(
            employee_id=emp.id,
            services=[
                {
                    "service_id": str(svc.id),
                    "service_name": svc.name,
                    "price": 50.0,
                    "quantity": 2,
                }
            ],
            total_revenue=100.0,
        )
        resp = await client.post(
            "/api/v1/sessions", json=payload, headers=auth_headers_a
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["total_revenue"] == 100.0
        assert data["owner_id"] == str(owner_a.id)

    async def test_total_revenue_must_match_items_sum(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id)
        payload = build_session_payload(
            employee_id=emp.id,
            services=[
                {
                    "service_id": str(uuid.uuid4()),
                    "service_name": "Haircut",
                    "price": 50.0,
                    "quantity": 1,
                }
            ],
            total_revenue=9999.0,  # Mismatched!
        )
        resp = await client.post(
            "/api/v1/sessions", json=payload, headers=auth_headers_a
        )
        assert resp.status_code == 422

    async def test_create_with_discount(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id)
        discount = await _create_discount(db_session, owner_a.id, value=10)
        payload = build_session_payload(
            employee_id=emp.id,
            total_revenue=100.0,
            services=[
                {
                    "service_id": str(uuid.uuid4()),
                    "service_name": "Haircut",
                    "price": 100.0,
                    "quantity": 1,
                }
            ],
            discount_id=discount.id,
        )
        resp = await client.post(
            "/api/v1/sessions", json=payload, headers=auth_headers_a
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["discount_amount"] == 10.0  # 10% of 100
        assert data["final_total"] == 90.0

    async def test_create_with_other_owners_employee_returns_404(
        self, client, db_session, owner_a, owner_b, auth_headers_a
    ):
        emp_b = await create_employee(db_session, owner_b.id, name="B's barber")
        payload = build_session_payload(employee_id=emp_b.id)
        resp = await client.post(
            "/api/v1/sessions", json=payload, headers=auth_headers_a
        )
        assert resp.status_code == 404

    async def test_create_with_nonexistent_employee_returns_404(
        self, client, auth_headers_a
    ):
        payload = build_session_payload(employee_id=uuid.uuid4())
        resp = await client.post(
            "/api/v1/sessions", json=payload, headers=auth_headers_a
        )
        assert resp.status_code == 404

    async def test_create_with_empty_items_returns_422(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id)
        payload = {
            "employee_id": str(emp.id),
            "date": date.today().isoformat(),
            "items": [],
            "total_revenue": 0,
        }
        resp = await client.post(
            "/api/v1/sessions", json=payload, headers=auth_headers_a
        )
        assert resp.status_code == 422

    async def test_create_with_invalid_date_format_returns_422(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id)
        payload = build_session_payload(employee_id=emp.id)
        payload["date"] = "not-a-date"
        resp = await client.post(
            "/api/v1/sessions", json=payload, headers=auth_headers_a
        )
        assert resp.status_code == 422


# ────────────────────────── GET /sessions ──────────────────────────


class TestListSessions:
    async def test_returns_only_current_owners_sessions(
        self, client, db_session, owner_a, owner_b, auth_headers_a
    ):
        emp_a = await create_employee(db_session, owner_a.id)
        emp_b = await create_employee(db_session, owner_b.id)
        today = date.today()
        await create_session_in_db(db_session, owner_a.id, emp_a.id, session_date=today)
        await create_session_in_db(db_session, owner_b.id, emp_b.id, session_date=today)

        resp = await client.get(
            "/api/v1/sessions",
            params={"start": today.isoformat(), "end": today.isoformat()},
            headers=auth_headers_a,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["owner_id"] == str(owner_a.id)

    async def test_filters_by_start_and_end_date(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id)
        today = date.today()
        yesterday = today - timedelta(days=1)
        await create_session_in_db(db_session, owner_a.id, emp.id, session_date=today)
        await create_session_in_db(db_session, owner_a.id, emp.id, session_date=yesterday)

        resp = await client.get(
            "/api/v1/sessions",
            params={"start": today.isoformat(), "end": today.isoformat()},
            headers=auth_headers_a,
        )
        assert len(resp.json()) == 1

    async def test_never_returns_other_owners_sessions(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        emp_a = await create_employee(db_session, owner_a.id)
        today = date.today()
        await create_session_in_db(db_session, owner_a.id, emp_a.id, session_date=today)

        resp = await client.get(
            "/api/v1/sessions",
            params={"start": today.isoformat(), "end": today.isoformat()},
            headers=auth_headers_b,
        )
        assert resp.json() == []


# ────────────────────────── DELETE /sessions/{id} ──────────────────


class TestDeleteSession:
    async def test_delete_own_session_succeeds(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id)
        sess = await create_session_in_db(db_session, owner_a.id, emp.id)
        resp = await client.delete(
            f"/api/v1/sessions/{sess.id}", headers=auth_headers_a
        )
        assert resp.status_code == 200

    async def test_delete_other_owners_session_returns_404(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        emp_a = await create_employee(db_session, owner_a.id)
        sess = await create_session_in_db(db_session, owner_a.id, emp_a.id)
        resp = await client.delete(
            f"/api/v1/sessions/{sess.id}", headers=auth_headers_b
        )
        assert resp.status_code == 404

    async def test_delete_nonexistent_session_returns_404(
        self, client, auth_headers_a
    ):
        resp = await client.delete(
            f"/api/v1/sessions/{uuid.uuid4()}", headers=auth_headers_a
        )
        assert resp.status_code == 404
