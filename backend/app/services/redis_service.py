import json

from redis.asyncio import Redis


class RedisService:
    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    async def cache_set(self, key: str, value: str, ttl_seconds: int) -> None:
        await self._redis.set(key, value, ex=ttl_seconds)

    async def cache_get(self, key: str) -> str | None:
        return await self._redis.get(key)

    async def cache_delete(self, key: str) -> None:
        await self._redis.delete(key)

    async def publish(self, channel: str, message: dict) -> None:
        await self._redis.publish(channel, json.dumps(message))

    async def set_session_status(self, session_id: str, status: str) -> None:
        await self.cache_set(f"session:{session_id}:status", status, ttl_seconds=3600)

    async def get_session_status(self, session_id: str) -> str | None:
        return await self.cache_get(f"session:{session_id}:status")

    async def set_latest_feedback(self, session_id: str, feedback_json: str) -> None:
        await self.cache_set(f"session:{session_id}:feedback:latest", feedback_json, ttl_seconds=30)

    async def get_latest_feedback(self, session_id: str) -> str | None:
        return await self.cache_get(f"session:{session_id}:feedback:latest")

    async def cache_scorecard(self, session_id: str, scorecard_json: str) -> None:
        await self.cache_set(f"scorecard:{session_id}", scorecard_json, ttl_seconds=86400)

    async def get_cached_scorecard(self, session_id: str) -> str | None:
        return await self.cache_get(f"scorecard:{session_id}")
