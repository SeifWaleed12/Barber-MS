"""
Service CRUD tests for BarberOS backend.

Covers creation, reading, updating, deleting, validation,
and tenant isolation between owners.
"""
import uuid

import pytest

from test.factories.service_factory import create_service

pytestmark = pytest.mark.asyncio


# ────────────────────────── GET /services ──────────────────────────


class TestListServices:
    async def test_returns_only_current_owners_services(
        self, client, db_session, owner_a, auth_headers_a
    ):
        await create_service(db_session, owner_a.id, name="Haircut")
        await create_service(db_session, owner_a.id, name="Beard Trim")
        resp = await client.get("/api/v1/services", headers=auth_headers_a)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert all(s["owner_id"] == str(owner_a.id) for s in data)

    async def test_never_returns_other_owners_services(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        await create_service(db_session, owner_a.id, name="A's Service")
        resp = await client.get("/api/v1/services", headers=auth_headers_b)
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_search_filters_by_name(
        self, client, db_session, owner_a, auth_headers_a
    ):
        await create_service(db_session, owner_a.id, name="Premium Haircut")
        await create_service(db_session, owner_a.id, name="Beard Trim")
        resp = await client.get(
            "/api/v1/services",
            params={"search": "Premium"},
            headers=auth_headers_a,
        )
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Premium Haircut"


# ────────────────────────── POST /services ─────────────────────────


class TestCreateService:
    async def test_create_with_valid_data(self, client, auth_headers_a, owner_a):
        resp = await client.post(
            "/api/v1/services",
            json={"name": "Haircut", "price": 50.0},
            headers=auth_headers_a,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Haircut"
        assert data["price"] == 50.0
        assert data["owner_id"] == str(owner_a.id)

    async def test_create_with_price_zero_returns_422(self, client, auth_headers_a):
        resp = await client.post(
            "/api/v1/services",
            json={"name": "Free Service", "price": 0},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422

    async def test_create_with_negative_price_returns_422(self, client, auth_headers_a):
        resp = await client.post(
            "/api/v1/services",
            json={"name": "Bad Service", "price": -10},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422

    async def test_create_with_missing_name_returns_422(self, client, auth_headers_a):
        resp = await client.post(
            "/api/v1/services",
            json={"price": 50},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422

    async def test_create_with_empty_name_returns_422(self, client, auth_headers_a):
        resp = await client.post(
            "/api/v1/services",
            json={"name": "", "price": 50},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422


# ────────────────────────── PUT /services/{id} ─────────────────────


class TestUpdateService:
    async def test_update_correctly(
        self, client, db_session, owner_a, auth_headers_a
    ):
        svc = await create_service(db_session, owner_a.id, name="Old")
        resp = await client.put(
            f"/api/v1/services/{svc.id}",
            json={"name": "Updated", "price": 75},
            headers=auth_headers_a,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"
        assert resp.json()["price"] == 75.0

    async def test_update_other_owners_service_returns_404(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        svc = await create_service(db_session, owner_a.id, name="A's Service")
        resp = await client.put(
            f"/api/v1/services/{svc.id}",
            json={"name": "Hijacked"},
            headers=auth_headers_b,
        )
        assert resp.status_code == 404

    async def test_update_nonexistent_id_returns_404(self, client, auth_headers_a):
        resp = await client.put(
            f"/api/v1/services/{uuid.uuid4()}",
            json={"name": "Ghost"},
            headers=auth_headers_a,
        )
        assert resp.status_code == 404


# ────────────────────────── DELETE /services/{id} ──────────────────


class TestDeleteService:
    async def test_delete_own_service_succeeds(
        self, client, db_session, owner_a, auth_headers_a
    ):
        svc = await create_service(db_session, owner_a.id, name="To Delete")
        resp = await client.delete(
            f"/api/v1/services/{svc.id}", headers=auth_headers_a
        )
        assert resp.status_code == 200

    async def test_delete_other_owners_service_returns_404(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        svc = await create_service(db_session, owner_a.id, name="A's Service")
        resp = await client.delete(
            f"/api/v1/services/{svc.id}", headers=auth_headers_b
        )
        assert resp.status_code == 404

    async def test_delete_nonexistent_id_returns_404(self, client, auth_headers_a):
        resp = await client.delete(
            f"/api/v1/services/{uuid.uuid4()}", headers=auth_headers_a
        )
        assert resp.status_code == 404
