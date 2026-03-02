"""Factory helpers for building Session payloads and DB records."""
import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.session import Session as SessionModel


def build_session_payload(
    employee_id: uuid.UUID,
    services: list[dict] | None = None,
    session_date: str | None = None,
    total_revenue: float | None = None,
    discount_id: uuid.UUID | None = None,
) -> dict:
    """
    Build a valid SessionCreate JSON payload.

    Parameters
    ----------
    services : list of dicts with keys service_id, service_name, price, quantity
    total_revenue : if None, calculated from services automatically
    """
    if services is None:
        services = [
            {
                "service_id": str(uuid.uuid4()),
                "service_name": "Haircut",
                "price": 50.0,
                "quantity": 1,
            }
        ]

    if total_revenue is None:
        total_revenue = sum(s["price"] * s["quantity"] for s in services)

    payload: dict = {
        "employee_id": str(employee_id),
        "date": session_date or date.today().isoformat(),
        "items": services,
        "total_revenue": total_revenue,
    }
    if discount_id is not None:
        payload["discount_id"] = str(discount_id)
    return payload


async def create_session_in_db(
    db: AsyncSession,
    owner_id: uuid.UUID,
    employee_id: uuid.UUID,
    *,
    session_date: date | None = None,
    total_revenue: float = 50.0,
    discount_amount: float = 0.0,
    items: list[dict] | None = None,
) -> SessionModel:
    """Insert a session directly into the DB (bypasses API validation)."""
    if items is None:
        items = [
            {
                "service_id": str(uuid.uuid4()),
                "service_name": "Haircut",
                "price": total_revenue,
                "quantity": 1,
            }
        ]
    session_obj = SessionModel(
        id=uuid.uuid4(),
        owner_id=owner_id,
        employee_id=employee_id,
        date=session_date or date.today(),
        items=items,
        total_revenue=total_revenue,
        discount_amount=discount_amount,
    )
    db.add(session_obj)
    await db.flush()
    await db.refresh(session_obj)
    return session_obj


async def create_sessions_batch(
    db: AsyncSession,
    owner_id: uuid.UUID,
    employee_id: uuid.UUID,
    count: int = 10,
    session_date: date | None = None,
    revenue_each: float = 50.0,
) -> list[SessionModel]:
    """Create `count` sessions with the same employee."""
    sessions = []
    for _ in range(count):
        s = await create_session_in_db(
            db,
            owner_id,
            employee_id,
            session_date=session_date,
            total_revenue=revenue_each,
        )
        sessions.append(s)
    return sessions
