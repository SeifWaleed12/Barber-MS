"""
Reports tests for BarberOS backend.

Covers dashboard (today_revenue, today_profit, month_revenue, top_barber)
and monthly report (revenue, total_salaries, costs, net_profit, barber_breakdown).
"""
import uuid
from datetime import date, timedelta

import pytest

from test.factories.employee_factory import create_employee
from test.factories.session_factory import create_session_in_db
from app.models.cost import Cost

pytestmark = pytest.mark.asyncio


# ─── Helper ───────────────────────────────────────────────────────

async def _create_cost(db, owner_id, month, label="Rent", amount=5000.0):
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


# ────────────────────── GET /reports/dashboard ─────────────────────


class TestDashboard:
    async def test_returns_zeros_when_no_sessions(
        self, client, auth_headers_a
    ):
        resp = await client.get("/api/v1/reports/dashboard", headers=auth_headers_a)
        assert resp.status_code == 200
        data = resp.json()
        assert data["today_revenue"] == 0
        assert data["month_revenue"] == 0
        assert data["top_barber"] is None

    async def test_correct_today_revenue(
        self, client, db_session, owner_a, auth_headers_a
    ):
        today = date.today()
        emp = await create_employee(db_session, owner_a.id, salary=3000)
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=today, total_revenue=100.0
        )
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=today, total_revenue=200.0
        )
        resp = await client.get("/api/v1/reports/dashboard", headers=auth_headers_a)
        data = resp.json()
        assert data["today_revenue"] == 300.0

    async def test_correct_month_revenue(
        self, client, db_session, owner_a, auth_headers_a
    ):
        today = date.today()
        first_of_month = today.replace(day=1)
        emp = await create_employee(db_session, owner_a.id, salary=3000)
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=first_of_month, total_revenue=500.0
        )
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=today, total_revenue=300.0
        )
        resp = await client.get("/api/v1/reports/dashboard", headers=auth_headers_a)
        data = resp.json()
        assert data["month_revenue"] == 800.0

    async def test_top_barber_is_correct(
        self, client, db_session, owner_a, auth_headers_a
    ):
        today = date.today()
        first_of_month = today.replace(day=1)
        emp1 = await create_employee(db_session, owner_a.id, name="Ali", salary=3000)
        emp2 = await create_employee(db_session, owner_a.id, name="Hassan", salary=3000)
        # Ali earns 100, Hassan earns 500 → Hassan is top barber
        await create_session_in_db(
            db_session, owner_a.id, emp1.id,
            session_date=today, total_revenue=100.0
        )
        await create_session_in_db(
            db_session, owner_a.id, emp2.id,
            session_date=today, total_revenue=500.0
        )
        resp = await client.get("/api/v1/reports/dashboard", headers=auth_headers_a)
        data = resp.json()
        assert data["top_barber"]["name"] == "Hassan"
        assert data["top_barber"]["revenue"] == 500.0

    async def test_today_profit_accounts_for_costs_and_salaries(
        self, client, db_session, owner_a, auth_headers_a
    ):
        today = date.today()
        month_str = today.strftime("%Y-%m")
        emp = await create_employee(db_session, owner_a.id, salary=3000)
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=today, total_revenue=1000.0
        )
        await _create_cost(db_session, owner_a.id, month_str, amount=6000)
        resp = await client.get("/api/v1/reports/dashboard", headers=auth_headers_a)
        data = resp.json()
        # today_profit = today_revenue - (costs + salaries) / days_in_month
        assert data["today_revenue"] == 1000.0
        # Profit should be less than revenue (costs + salaries deducted daily)
        assert data["today_profit"] < data["today_revenue"]


# ────────────────────── GET /reports/monthly ───────────────────────


class TestMonthlyReport:
    async def test_returns_zeros_when_no_sessions(
        self, client, auth_headers_a
    ):
        resp = await client.get(
            "/api/v1/reports/monthly",
            params={"month": "2025-01"},
            headers=auth_headers_a,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["revenue"] == 0
        assert data["barber_breakdown"] == []

    async def test_correct_revenue_for_given_month(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id, salary=3000)
        target_date = date(2026, 3, 15)
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=target_date, total_revenue=400.0
        )
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=target_date, total_revenue=600.0
        )
        resp = await client.get(
            "/api/v1/reports/monthly",
            params={"month": "2026-03"},
            headers=auth_headers_a,
        )
        data = resp.json()
        assert data["revenue"] == 1000.0

    async def test_total_salaries_matches_employee_salaries(
        self, client, db_session, owner_a, auth_headers_a
    ):
        await create_employee(db_session, owner_a.id, name="A", salary=3000)
        await create_employee(db_session, owner_a.id, name="B", salary=4000)
        resp = await client.get(
            "/api/v1/reports/monthly",
            params={"month": "2026-03"},
            headers=auth_headers_a,
        )
        data = resp.json()
        assert data["total_salaries"] == 7000.0

    async def test_net_profit_formula(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id, salary=2000)
        target_date = date(2026, 3, 10)
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=target_date, total_revenue=10000.0
        )
        await _create_cost(db_session, owner_a.id, "2026-03", amount=1000)
        resp = await client.get(
            "/api/v1/reports/monthly",
            params={"month": "2026-03"},
            headers=auth_headers_a,
        )
        data = resp.json()
        # net_profit = revenue - total_salaries - costs
        assert data["net_profit"] == 10000.0 - 2000.0 - 1000.0

    async def test_barber_breakdown_has_correct_per_barber_totals(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp1 = await create_employee(db_session, owner_a.id, name="Ali", salary=3000)
        emp2 = await create_employee(db_session, owner_a.id, name="Omar", salary=3000)
        target_date = date(2026, 3, 10)
        await create_session_in_db(
            db_session, owner_a.id, emp1.id,
            session_date=target_date, total_revenue=200.0
        )
        await create_session_in_db(
            db_session, owner_a.id, emp1.id,
            session_date=target_date, total_revenue=300.0
        )
        await create_session_in_db(
            db_session, owner_a.id, emp2.id,
            session_date=target_date, total_revenue=150.0
        )
        resp = await client.get(
            "/api/v1/reports/monthly",
            params={"month": "2026-03"},
            headers=auth_headers_a,
        )
        data = resp.json()
        breakdown = {b["name"]: b for b in data["barber_breakdown"]}
        assert breakdown["Ali"]["revenue"] == 500.0
        assert breakdown["Ali"]["sessions_count"] == 2
        assert breakdown["Omar"]["revenue"] == 150.0
        assert breakdown["Omar"]["sessions_count"] == 1

    async def test_invalid_month_format_returns_422(self, client, auth_headers_a):
        resp = await client.get(
            "/api/v1/reports/monthly",
            params={"month": "bad-format"},
            headers=auth_headers_a,
        )
        assert resp.status_code == 422

    async def test_revenue_accounts_for_discounts(
        self, client, db_session, owner_a, auth_headers_a
    ):
        emp = await create_employee(db_session, owner_a.id, salary=1000)
        target_date = date(2026, 3, 10)
        await create_session_in_db(
            db_session, owner_a.id, emp.id,
            session_date=target_date, total_revenue=500.0, discount_amount=50.0
        )
        resp = await client.get(
            "/api/v1/reports/monthly",
            params={"month": "2026-03"},
            headers=auth_headers_a,
        )
        data = resp.json()
        # Revenue should be total_revenue - discount_amount
        assert data["revenue"] == 450.0
