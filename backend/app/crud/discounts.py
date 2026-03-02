import uuid
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.discount import Discount

logger = logging.getLogger(__name__)


async def get_discounts(
    db: AsyncSession, owner_id: uuid.UUID, skip: int = 0, limit: int = 100
):
    stmt = (
        select(Discount)
        .where(Discount.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .order_by(Discount.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_discount(
    db: AsyncSession, owner_id: uuid.UUID, name: str, type: str, value: float
) -> Discount:
    discount = Discount(owner_id=owner_id, name=name, type=type, value=value)
    db.add(discount)
    await db.flush()
    await db.refresh(discount)
    return discount


async def get_discount_by_id(
    db: AsyncSession, discount_id: uuid.UUID, owner_id: uuid.UUID
) -> Discount | None:
    stmt = select(Discount).where(
        Discount.id == discount_id, Discount.owner_id == owner_id
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def update_discount(
    db: AsyncSession, discount: Discount, update_data: dict
) -> Discount:
    for key, value in update_data.items():
        if value is not None:
            setattr(discount, key, value)
    await db.flush()
    await db.refresh(discount)
    return discount


async def delete_discount(db: AsyncSession, discount: Discount) -> None:
    await db.delete(discount)
    await db.flush()
