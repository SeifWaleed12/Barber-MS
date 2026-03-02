"""
Employee CRUD tests for BarberOS backend.

Covers creation, reading, updating, deleting, validation,
and tenant isolation between owners.
"""
import uuid

import pytest

from test.factories.employee_factory import create_employee

pytestmark = pytest.mark.asyncio


# ────────────────────────── GET /employees ─────────────────────────


class TestListEmployees:
    async def test_returns_only_current_owners_employees(
        self, client, db_session, owner_a, auth_headers_a
    ):
        await create_employee(db_session, owner_a.id, name="Ali")
        await create_employee(db_session, owner_a.id, name="Hassan")
        resp = await client.get("/api/v1/employees", headers=auth_headers_a)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert all(e["owner_id"] == str(owner_a.id) for e in data)

    async def test_never_returns_other_owners_employees(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        await create_employee(db_session, owner_a.id, name="Owner A's barber")
        resp = await client.get("/api/v1/employees", headers=auth_headers_b)
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_search_filters_by_name(
        self, client, db_session, owner_a, auth_headers_a
    ):
        await create_employee(db_session, owner_a.id, name="Ahmed")
        await create_employee(db_session, owner_a.id, name="Mohamed")
        resp = await client.get(
            "/api/v1/employees", params={"search": "Ahmed"}, headers=auth_headers_a
        )
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Ahmed"


# ────────────────────────── POST /employees ────────────────────────


class TestCreateEmployee:
    async def test_create_with_valid_data(self, client, auth_headers_a, owner_a):
        resp = await client.post(
            "/api/v1/employees",
            json={"name": "New Barber", "phone": "01099988877", "salary": 3000.0},
            headers=auth_headers_a,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "New Barber"
        assert data["salary"] == 3000.0
        assert data["owner_id"] == str(owner_a.id)

    async def test_create_assigns_correct_owner_id(self, client, auth_headers_a, owner_a):
        resp = await client.post(
            "/api/v1/employees",
            json={"name": "Barber X", "salary": 2000.0},
            headers=auth_headers_a,
        )
        assert resp.json()["owner_id"] == str(owner_a.id)

    async def test_create_with_salary_saves_correctly(self, client, auth_headers_a):
        resp = await client.post(
            "/api/v1/employees",
            json={"name": "Paid Barber", "salary": 4500.50},
            headers=auth_headers_a,
        )
        assert resp.status_code == 201
        assert resp.json()["salary"] == 4500.50

    async def test_create_with_zero_salary_returns_422(self, client, auth_headers_a):
        resp = await client.post(
            "/api/v1/employees",
            json={"name": "Barber", "salary": 0},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422

    async def test_create_with_negative_salary_returns_422(self, client, auth_headers_a):
        resp = await client.post(
            "/api/v1/employees",
            json={"name": "Barber", "salary": -500},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422

    async def test_create_with_empty_name_returns_422(self, client, auth_headers_a):
        resp = await client.post(
            "/api/v1/employees",
            json={"name": "", "salary": 3000},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422

    async def test_create_with_name_exceeding_100_chars_returns_422(
        self, client, auth_headers_a
    ):
        resp = await client.post(
            "/api/v1/employees",
            json={"name": "A" * 101, "salary": 3000},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422

    async def test_create_with_missing_required_fields_returns_422(
        self, client, auth_headers_a
    ):
        resp = await client.post(
            "/api/v1/employees",
            json={"phone": "01099988877"},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422


# ────────────────────────── PUT /employees/{id} ────────────────────


class TestUpdateEmployee:
    async def test_update_correctly(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id, name="Old Name")
        resp = await client.put(
            f"/api/v1/employees/{emp.id}",
            json={"name": "New Name", "salary": 5000.0},
            headers=auth_headers_a,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "New Name"
        assert data["salary"] == 5000.0

    async def test_update_other_owners_employee_returns_404(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        emp = await create_employee(db_session, owner_a.id, name="A's Barber")
        resp = await client.put(
            f"/api/v1/employees/{emp.id}",
            json={"name": "Hijacked"},
            headers=auth_headers_b,
        )
        assert resp.status_code == 404

    async def test_update_nonexistent_id_returns_404(self, client, auth_headers_a):
        resp = await client.put(
            f"/api/v1/employees/{uuid.uuid4()}",
            json={"name": "Ghost"},
            headers=auth_headers_a,
        )
        assert resp.status_code == 404


# ────────────────────────── DELETE /employees/{id} ─────────────────


class TestDeleteEmployee:
    async def test_delete_own_employee_succeeds(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id, name="To Delete")
        resp = await client.delete(
            f"/api/v1/employees/{emp.id}", headers=auth_headers_a
        )
        assert resp.status_code == 200

    async def test_delete_other_owners_employee_returns_404(
        self, client, db_session, owner_a, owner_b, auth_headers_b
    ):
        emp = await create_employee(db_session, owner_a.id, name="A's Barber")
        resp = await client.delete(
            f"/api/v1/employees/{emp.id}", headers=auth_headers_b
        )
        assert resp.status_code == 404

    async def test_delete_nonexistent_id_returns_404(self, client, auth_headers_a):
        resp = await client.delete(
            f"/api/v1/employees/{uuid.uuid4()}", headers=auth_headers_a
        )
        assert resp.status_code == 404
