import uuid
import logging
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.employee import Employee

logger = logging.getLogger(__name__)


async def get_employees(
    db: AsyncSession, owner_id: uuid.UUID, skip: int = 0, limit: int = 100,
    search: Optional[str] = None,
):
    stmt = (
        select(Employee)
        .where(Employee.owner_id == owner_id)
    )
    if search:
        stmt = stmt.where(Employee.name.ilike(f"%{search}%"))
    stmt = stmt.offset(skip).limit(limit).order_by(Employee.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_employee(
    db: AsyncSession, owner_id: uuid.UUID, name: str, phone: str | None, salary: float
) -> Employee:
    employee = Employee(
        owner_id=owner_id,
        name=name,
        phone=phone,
        salary=salary,
    )
    db.add(employee)
    await db.flush()
    await db.refresh(employee)
    return employee


async def get_employee_by_id(
    db: AsyncSession, employee_id: uuid.UUID, owner_id: uuid.UUID
) -> Employee | None:
    stmt = select(Employee).where(
        Employee.id == employee_id, Employee.owner_id == owner_id
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def update_employee(
    db: AsyncSession, employee: Employee, update_data: dict,
) -> Employee:
    for key, value in update_data.items():
        if value is not None:
            setattr(employee, key, value)
    await db.flush()
    await db.refresh(employee)
    return employee


async def delete_employee(db: AsyncSession, employee: Employee) -> None:
    await db.delete(employee)
    await db.flush()
