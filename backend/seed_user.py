"""
One-time script to seed a test user into the database.
Run from the backend directory: python seed_user.py
"""
import asyncio
import uuid
from sqlalchemy import select
from app.core.database import async_session_factory
from app.core.security import hash_password
from app.models.user import User


async def seed():
    async with async_session_factory() as session:
        # Check if user already exists
        stmt = select(User).where(User.email == "admin@barberos.com")
        result = await session.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            print(f"⚠️  User already exists: {existing.email} (id: {existing.id})")
            return

        user = User(
            email="admin@barberos.com",
            password=hash_password("admin123"),
            shop_name="BarberOS Demo Shop",
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"✅ User created!")
        print(f"   Email:    admin@barberos.com")
        print(f"   Password: admin123")
        print(f"   Shop:     BarberOS Demo Shop")
        print(f"   ID:       {user.id}")


if __name__ == "__main__":
    asyncio.run(seed())
