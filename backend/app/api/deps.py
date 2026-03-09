from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.redis.client import get_redis as _get_redis


async def get_db() -> AsyncGenerator[AsyncSession]:
    async for session in get_async_session():
        yield session


def get_redis_client() -> Redis:
    return _get_redis()


DbSession = Annotated[AsyncSession, Depends(get_db)]
RedisClient = Annotated[Redis, Depends(get_redis_client)]
