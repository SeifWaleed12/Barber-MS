"""Factory helpers for creating Service instances in tests."""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.service import Service


async def create_service(
    db: AsyncSession,
    owner_id: uuid.UUID,
    *,
    name: str = "Haircut",
    price: float = 50.0,
) -> Service:
    service = Service(
        id=uuid.uuid4(),
        owner_id=owner_id,
        name=name,
        price=price,
    )
    db.add(service)
    await db.flush()
    await db.refresh(service)
    return service


async def create_services_batch(
    db: AsyncSession,
    owner_id: uuid.UUID,
    count: int = 5,
) -> list[Service]:
    """Create `count` services with unique names and prices."""
    services = []
    for i in range(count):
        svc = await create_service(
            db, owner_id, name=f"Service {i+1}", price=30.0 + i * 10
        )
        services.append(svc)
    return services
