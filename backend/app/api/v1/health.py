from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DbSession, RedisClient
from app.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(db: DbSession, redis: RedisClient) -> dict:
    settings = get_settings()
    db_status = "connected"
    redis_status = "connected"

    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    try:
        await redis.ping()  # type: ignore[misc]
    except Exception:
        redis_status = "error"

    return {
        "status": "healthy" if db_status == "connected" and redis_status == "connected" else "degraded",
        "database": db_status,
        "redis": redis_status,
        "version": settings.APP_VERSION,
    }


@router.get("/ready")
async def readiness_check(db: DbSession, redis: RedisClient) -> dict:
    await db.execute(text("SELECT 1"))
    await redis.ping()  # type: ignore[misc]
    return {"status": "ready"}
