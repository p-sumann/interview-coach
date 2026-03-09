import uuid

from fastapi import APIRouter

from app.api.deps import DbSession, RedisClient
from app.schemas.feedback import FeedbackCreateRequest
from app.services.feedback_service import FeedbackService
from app.services.redis_service import RedisService

router = APIRouter(prefix="/sessions/{session_id}/feedback", tags=["feedback"])


@router.post("", status_code=201)
async def submit_feedback(
    session_id: uuid.UUID,
    data: FeedbackCreateRequest,
    db: DbSession,
    redis: RedisClient,
) -> dict:
    service = FeedbackService(db, RedisService(redis))
    await service.submit_feedback(session_id, data)
    return {"status": "ok"}
