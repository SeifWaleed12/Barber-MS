"""
Cost CRUD tests for BarberOS backend.

Covers creation, reading with month filter, validation,
and tenant isolation between owners.
"""
import uuid

import pytest

from app.models.cost import Cost

pytestmark = pytest.mark.asyncio


# ─── Helper ───────────────────────────────────────────────────────

async def _create_cost(db, owner_id, month="2026-03", label="Rent", amount=5000.0):
    cost = Cost(
        id=uuid.uuid4(),
        owner_id=owner_id,
        month=month,
        label=label,
        amount=amount,
    )
    db.add(cost)
    await db.flush()
    await db.refresh(cost)
    return cost


# ────────────────────────── POST /costs ────────────────────────────


class TestCreateCost:
    async def test_create_with_valid_data(self, client, auth_headers_a, owner_a):
        resp = await client.post(
            "/api/v1/costs",
            json={"month": "2026-03", "label": "Rent", "amount": 5000.0},
            headers=auth_headers_a,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["month"] == "2026-03"
        assert data["label"] == "Rent"
        assert data["amount"] == 5000.0
        assert data["owner_id"] == str(owner_a.id)

    async def test_create_with_invalid_month_format_returns_422(
        self, client, auth_headers_a
    ):
        for bad_month in ["03-2026", "2026/03", "2026-3", "202603", "abcd-ef"]:
            resp = await client.post(
                "/api/v1/costs",
                json={"month": bad_month, "label": "Rent", "amount": 5000},
                headers=auth_headers_a,
            )
            assert resp.status_code == 422, f"Expected 422 for month={bad_month}"

    async def test_create_with_negative_amount_returns_422(
        self, client, auth_headers_a
    ):
        resp = await client.post(
            "/api/v1/costs",
            json={"month": "2026-03", "label": "Rent", "amount": -100},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422

    async def test_create_with_zero_amount_returns_422(
        self, client, auth_headers_a
    ):
        resp = await client.post(
            "/api/v1/costs",
            json={"month": "2026-03", "label": "Rent", "amount": 0},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422


# ────────────────────────── GET /costs ─────────────────────────────


class TestListCosts:
    async def test_returns_only_current_owners_costs(
        self, client, db_session, owner_a, auth_headers_a
    ):
        await _create_cost(db_session, owner_a.id, month="2026-03")
        resp = await client.get(
            "/api/v1/costs",
            params={"month": "2026-03"},
            headers=auth_headers_a,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["owner_id"] == str(owner_a.id)

    async def test_filters_by_month(
        self, client, db_session, owner_a, auth_headers_a
    ):
        await _create_cost(db_session, owner_a.id, month="2026-03")
        await _create_cost(db_session, owner_a.id, month="2026-04")
        resp = await client.get(
            "/api/v1/costs",
            params={"month": "2026-03"},
            headers=auth_headers_a,
        )
        data = resp.json()
        assert len(data) == 1
        assert data[0]["month"] == "2026-03"

    async def test_never_returns_other_owners_costs(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        await _create_cost(db_session, owner_a.id, month="2026-03")
        resp = await client.get(
            "/api/v1/costs",
            params={"month": "2026-03"},
            headers=auth_headers_b,
        )
        assert resp.json() == []


# ────────────────────────── DELETE /costs/{id} ─────────────────────


class TestDeleteCost:
    async def test_delete_own_cost_succeeds(
        self, client, db_session, owner_a, auth_headers_a
    ):
        cost = await _create_cost(db_session, owner_a.id)
        resp = await client.delete(
            f"/api/v1/costs/{cost.id}", headers=auth_headers_a
        )
        assert resp.status_code == 200

    async def test_delete_other_owners_cost_returns_404(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        cost = await _create_cost(db_session, owner_a.id)
        resp = await client.delete(
            f"/api/v1/costs/{cost.id}", headers=auth_headers_b
        )
        assert resp.status_code == 404

    async def test_delete_nonexistent_cost_returns_404(self, client, auth_headers_a):
        resp = await client.delete(
            f"/api/v1/costs/{uuid.uuid4()}", headers=auth_headers_a
        )
        assert resp.status_code == 404
