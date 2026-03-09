import json
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feedback import CoachingNote, FeedbackSnapshot
from app.schemas.feedback import CoachingNoteCreateRequest, FeedbackCreateRequest
from app.services.redis_service import RedisService


class FeedbackService:
    def __init__(self, db: AsyncSession, redis_service: RedisService) -> None:
        self._db = db
        self._redis = redis_service

    async def submit_feedback(self, session_id: uuid.UUID, data: FeedbackCreateRequest) -> None:
        snapshot = FeedbackSnapshot(
            id=uuid.uuid4(),
            session_id=session_id,
            confidence=data.confidence,
            pace=data.pace.value,
            filler_words=data.filler_words,
        )
        self._db.add(snapshot)
        await self._db.flush()

        feedback_json = json.dumps(
            {
                "confidence": data.confidence,
                "pace": data.pace.value,
                "fillerWords": data.filler_words,
            }
        )
        await self._redis.set_latest_feedback(str(session_id), feedback_json)
        await self._redis.publish(
            f"feedback:{session_id}",
            {
                "type": "feedback",
                "sessionId": str(session_id),
                "data": data.model_dump(by_alias=True),
            },
        )

    async def submit_coaching_note(self, session_id: uuid.UUID, data: CoachingNoteCreateRequest) -> CoachingNote:
        note = CoachingNote(
            id=uuid.uuid4(),
            session_id=session_id,
            timestamp_seconds=data.timestamp_seconds,
            type=data.type.value,
            message=data.message,
            category=data.category.value,
        )
        self._db.add(note)
        await self._db.flush()

        await self._redis.publish(
            f"coaching:{session_id}",
            {
                "type": "coaching_note",
                "sessionId": str(session_id),
                "data": data.model_dump(by_alias=True),
            },
        )

        return note
