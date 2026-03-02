"""Factory helpers for creating Employee instances in tests."""
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.employee import Employee


async def create_employee(
    db: AsyncSession,
    owner_id: uuid.UUID,
    *,
    name: str = "Test Barber",
    phone: str | None = "01012345678",
    salary: float = 3000.0,
) -> Employee:
    employee = Employee(
        id=uuid.uuid4(),
        owner_id=owner_id,
        name=name,
        phone=phone,
        salary=salary,
    )
    db.add(employee)
    await db.flush()
    await db.refresh(employee)
    return employee


async def create_employees_batch(
    db: AsyncSession,
    owner_id: uuid.UUID,
    count: int = 10,
    salary: float = 3000.0,
) -> list[Employee]:
    """Create `count` employees with unique names."""
    employees = []
    for i in range(count):
        emp = await create_employee(
            db, owner_id, name=f"Barber {i+1}", salary=salary
        )
        employees.append(emp)
    return employees
