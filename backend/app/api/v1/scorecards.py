import uuid

from fastapi import APIRouter

from app.api.deps import DbSession, RedisClient
from app.schemas.scorecard import ScorecardCreateRequest, ScorecardResponse
from app.services.redis_service import RedisService
from app.services.scorecard_service import ScorecardService
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions/{session_id}/scorecard", tags=["scorecards"])


@router.get("", response_model=ScorecardResponse)
async def get_scorecard(
    session_id: uuid.UUID,
    db: DbSession,
    redis: RedisClient,
) -> ScorecardResponse:
    service = ScorecardService(db, RedisService(redis))
    return await service.get_scorecard(session_id)


@router.post("", status_code=201, response_model=ScorecardResponse)
async def create_scorecard(
    session_id: uuid.UUID,
    data: ScorecardCreateRequest,
    db: DbSession,
    redis: RedisClient,
) -> ScorecardResponse:
    redis_service = RedisService(redis)
    session_service = SessionService(db, redis_service)
    session = await session_service.get_session(session_id)

    scorecard_service = ScorecardService(db, redis_service)
    return await scorecard_service.create_scorecard(session_id, data, session)
