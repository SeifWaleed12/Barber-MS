"""
Shared fixtures for BarberOS backend tests.

Uses SQLite (in-memory) with monkey-patched PostgreSQL types.
Provides per-test cleanup, two owner accounts, and auth helpers.
"""
import os
import sys
import uuid
import json
import asyncio
from pathlib import Path
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy import String, Text, TypeDecorator, event
from sqlalchemy.dialects import postgresql

# ── Load .env.test BEFORE any app imports ────────────────────────
_backend_dir = Path(__file__).resolve().parent.parent
_env_test = _backend_dir / ".env.test"
from dotenv import load_dotenv  # noqa: E402
load_dotenv(str(_env_test), override=True)

if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))


# ── Monkey-patch PostgreSQL types for SQLite ─────────────────────
class _SQLiteUUID(TypeDecorator):
    """UUID stored as CHAR(36) in SQLite."""
    impl = String(36)
    cache_ok = True

    def __init__(self, *args, **kwargs):
        kwargs.pop("as_uuid", None)
        super().__init__()

    def process_bind_param(self, value, dialect):
        if value is not None:
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return uuid.UUID(value) if not isinstance(value, uuid.UUID) else value
        return value


class _SQLiteJSON(TypeDecorator):
    """JSONB stored as TEXT in SQLite."""
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value) if not isinstance(value, str) else value
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value) if isinstance(value, str) else value
        return value


postgresql.UUID = _SQLiteUUID
postgresql.JSONB = _SQLiteJSON


from app.core.config import settings            # noqa: E402
from app.core.database import Base, get_db       # noqa: E402
from app.core.security import hash_password, create_access_token  # noqa: E402
from app.main import app                         # noqa: E402
from app.models.user import User                 # noqa: E402
from app.models.employee import Employee         # noqa: E402
from app.models.service import Service           # noqa: E402
from app.models.session import Session as SessionModel  # noqa: E402
from app.models.cost import Cost                 # noqa: E402
from app.models.discount import Discount         # noqa: E402


# ── Remove server_defaults that use PG functions ─────────────────
# SQLite doesn't support gen_random_uuid() or text("0") as server defaults
for table in Base.metadata.tables.values():
    for column in table.columns:
        if column.server_default is not None:
            column.server_default = None


# ── Engine for tests ─────────────────────────────────────────────
_db_url = settings.DATABASE_URL

# Use in-memory SQLite with shared cache for cross-connection visibility
if "sqlite" in _db_url:
    _db_url = "sqlite+aiosqlite:///:memory:?cache=shared"

test_engine = create_async_engine(
    _db_url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in _db_url else {},
    pool_pre_ping=False if "sqlite" in _db_url else True,
)
TestSessionFactory = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


# ── Event-loop fixture ───────────────────────────────────────────
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ── Create tables once per test session ──────────────────────────
@pytest_asyncio.fixture(scope="session", autouse=True)
async def _setup_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


# ── Per-test cleanup: delete all data after each test ────────────
@pytest_asyncio.fixture(autouse=True)
async def _cleanup_tables():
    """Delete all rows from all tables after each test."""
    yield
    async with TestSessionFactory() as session:
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()


# ── DB session shared per test ───────────────────────────────────
@pytest_asyncio.fixture()
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionFactory() as session:
        yield session
        await session.commit()


# ── Override get_db to use the test session factory ──────────────
@pytest_asyncio.fixture()
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()


# ── Helper: create a user directly in the DB ─────────────────────
async def _create_user(db: AsyncSession, email: str, password: str, shop: str) -> User:
    user = User(
        id=uuid.uuid4(),
        email=email,
        password=hash_password(password),
        shop_name=shop,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


def _make_auth_headers(user: User) -> dict:
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


# ── Owner A ──────────────────────────────────────────────────────
@pytest_asyncio.fixture()
async def owner_a(db_session: AsyncSession) -> User:
    return await _create_user(
        db_session, "owner_a@test.com", "Password123!", "Shop A"
    )


@pytest_asyncio.fixture()
async def auth_headers_a(owner_a: User) -> dict:
    return _make_auth_headers(owner_a)


# ── Owner B ──────────────────────────────────────────────────────
@pytest_asyncio.fixture()
async def owner_b(db_session: AsyncSession) -> User:
    return await _create_user(
        db_session, "owner_b@test.com", "Password456!", "Shop B"
    )


@pytest_asyncio.fixture()
async def auth_headers_b(owner_b: User) -> dict:
    return _make_auth_headers(owner_b)
