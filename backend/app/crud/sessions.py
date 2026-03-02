import uuid
import logging
from datetime import date
from typing import Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.session import Session
from app.models.employee import Employee

logger = logging.getLogger(__name__)


async def create_session(
    db: AsyncSession,
    owner_id: uuid.UUID,
    employee_id: uuid.UUID,
    session_date: date,
    items: list[dict],
    total_revenue: float,
    discount_id: uuid.UUID | None,
    discount_amount: float,
) -> Session:
    session_obj = Session(
        owner_id=owner_id,
        employee_id=employee_id,
        date=session_date,
        items=items,
        total_revenue=total_revenue,
        discount_id=discount_id,
        discount_amount=discount_amount,
    )
    db.add(session_obj)
    await db.flush()
    await db.refresh(session_obj)
    return session_obj


async def get_sessions(
    db: AsyncSession,
    owner_id: uuid.UUID,
    start: date,
    end: date,
    skip: int = 0,
    limit: int = 100,
):
    stmt = (
        select(
            Session.id,
            Session.owner_id,
            Session.employee_id,
            Session.date,
            Session.items,
            Session.total_revenue,
            Session.discount_amount,
            Session.created_at,
            Employee.name.label("employee_name"),
        )
        .join(Employee, Session.employee_id == Employee.id)
        .where(
            Session.owner_id == owner_id,
            Session.date >= start,
            Session.date <= end,
        )
        .offset(skip)
        .limit(limit)
        .order_by(Session.date.desc(), Session.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.all()


async def get_haircuts(
    db: AsyncSession,
    owner_id: uuid.UUID,
    employee_id: Optional[uuid.UUID] = None,
    filter_date: Optional[date] = None,
    month: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    stmt = (
        select(
            Session.id,
            Session.date,
            Session.items,
            Session.total_revenue,
            Session.discount_amount,
            Employee.name.label("barber_name"),
        )
        .join(Employee, Session.employee_id == Employee.id)
        .where(Session.owner_id == owner_id)
    )
    if employee_id:
        stmt = stmt.where(Session.employee_id == employee_id)
    if filter_date:
        stmt = stmt.where(Session.date == filter_date)
    elif month:
        # If month is provided (e.g., "2024-05"), filter by that month
        year, mon = int(month[:4]), int(month[5:7])
        start_date = date(year, mon, 1)
        if mon == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, mon + 1, 1)
        stmt = stmt.where(Session.date >= start_date, Session.date < end_date)
        
    stmt = stmt.offset(skip).limit(limit).order_by(Session.date.desc(), Session.created_at.desc())
    result = await db.execute(stmt)
    return result.all()


async def get_session_by_id(
    db: AsyncSession, session_id: uuid.UUID, owner_id: uuid.UUID
) -> Session | None:
    stmt = select(Session).where(
        Session.id == session_id, Session.owner_id == owner_id
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def delete_session(db: AsyncSession, session_obj: Session) -> None:
    await db.delete(session_obj)
    await db.flush()
