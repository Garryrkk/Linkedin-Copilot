from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from core.config import settings
from db.models import Base
import structlog

logger = structlog.get_logger()

# Convert sync URL to async
async_url = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
)

engine = create_async_engine(
    async_url,
    echo=settings.DEBUG,
    poolclass=NullPool,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("database_initialized")


async def get_db():
    """Dependency for FastAPI routes."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()