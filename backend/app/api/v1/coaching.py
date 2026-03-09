import uuid

from fastapi import APIRouter

from app.api.deps import DbSession, RedisClient
from app.schemas.feedback import CoachingNoteCreateRequest, CoachingNoteResponse
from app.services.feedback_service import FeedbackService
from app.services.redis_service import RedisService

router = APIRouter(prefix="/sessions/{session_id}/coaching-notes", tags=["coaching"])


@router.post("", status_code=201, response_model=CoachingNoteResponse)
async def submit_coaching_note(
    session_id: uuid.UUID,
    data: CoachingNoteCreateRequest,
    db: DbSession,
    redis: RedisClient,
) -> CoachingNoteResponse:
    service = FeedbackService(db, RedisService(redis))
    note = await service.submit_coaching_note(session_id, data)
    return CoachingNoteResponse.model_validate(note, from_attributes=True)
