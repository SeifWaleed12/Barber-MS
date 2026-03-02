import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.cost import Cost

logger = logging.getLogger(__name__)


async def get_costs(
    db: AsyncSession, owner_id: uuid.UUID, month: str, skip: int = 0, limit: int = 100
):
    stmt = (
        select(Cost)
        .where(
            (Cost.owner_id == owner_id) & 
            ((Cost.month == month) | (Cost.month.is_(None)) | (Cost.type == 'fixed'))
        )
        .offset(skip)
        .limit(limit)
        .order_by(Cost.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_cost(
    db: AsyncSession, owner_id: uuid.UUID, type: str, label: str, amount: float, month: str | None = None
) -> Cost:
    cost = Cost(owner_id=owner_id, month=month, type=type, label=label, amount=amount)
    db.add(cost)
    await db.flush()
    await db.refresh(cost)
    return cost


async def get_cost_by_id(
    db: AsyncSession, cost_id: uuid.UUID, owner_id: uuid.UUID
) -> Cost | None:
    stmt = select(Cost).where(Cost.id == cost_id, Cost.owner_id == owner_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def delete_cost(db: AsyncSession, cost: Cost) -> None:
    await db.delete(cost)
    await db.flush()
