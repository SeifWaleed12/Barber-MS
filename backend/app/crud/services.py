import uuid
import logging
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.service import Service

logger = logging.getLogger(__name__)


async def get_services(
    db: AsyncSession, owner_id: uuid.UUID, skip: int = 0, limit: int = 100,
    search: Optional[str] = None,
):
    stmt = (
        select(Service)
        .where(Service.owner_id == owner_id)
    )
    if search:
        stmt = stmt.where(Service.name.ilike(f"%{search}%"))
    stmt = stmt.offset(skip).limit(limit).order_by(Service.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def create_service(
    db: AsyncSession, owner_id: uuid.UUID, name: str, price: float
) -> Service:
    service = Service(owner_id=owner_id, name=name, price=price)
    db.add(service)
    await db.flush()
    await db.refresh(service)
    return service


async def get_service_by_id(
    db: AsyncSession, service_id: uuid.UUID, owner_id: uuid.UUID
) -> Service | None:
    stmt = select(Service).where(
        Service.id == service_id, Service.owner_id == owner_id
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def update_service(
    db: AsyncSession, service: Service, update_data: dict
) -> Service:
    for key, value in update_data.items():
        if value is not None:
            setattr(service, key, value)
    await db.flush()
    await db.refresh(service)
    return service


async def delete_service(db: AsyncSession, service: Service) -> None:
    await db.delete(service)
    await db.flush()
