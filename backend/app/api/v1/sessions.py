import uuid

from fastapi import APIRouter, Query, Request

from app.api.deps import DbSession, RedisClient
from app.config import get_settings
from app.middleware.rate_limit import limiter
from app.schemas.session import SessionCreateRequest, SessionListItem, SessionResponse
from app.services.redis_service import RedisService
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _get_session_service(db: DbSession, redis: RedisClient) -> SessionService:
    return SessionService(db, RedisService(redis))


@router.post("", status_code=201, response_model=SessionResponse)
@limiter.limit(get_settings().RATE_LIMIT_SESSION_CREATE)
async def create_session(
    request: Request,
    data: SessionCreateRequest,
    db: DbSession,
    redis: RedisClient,
) -> SessionResponse:
    service = _get_session_service(db, redis)
    session = await service.create_session(data)
    return SessionResponse.model_validate(session, from_attributes=True)


@router.get("", response_model=list[SessionListItem])
async def list_sessions(
    db: DbSession,
    redis: RedisClient,
    user_id: str = Query(..., alias="userId", min_length=1, max_length=36),
) -> list[SessionListItem]:
    service = _get_session_service(db, redis)
    sessions = await service.list_user_sessions(user_id)
    items: list[SessionListItem] = []
    for s in sessions:
        score = s.scorecard.overall_score if s.scorecard else None
        item = SessionListItem.model_validate(s, from_attributes=True)
        item.overall_score = score
        items.append(item)
    return items


@router.get("/by-room/{room_name}", response_model=SessionResponse)
async def get_session_by_room(
    room_name: str,
    db: DbSession,
    redis: RedisClient,
) -> SessionResponse:
    service = _get_session_service(db, redis)
    session = await service.get_session_by_room(room_name)
    return SessionResponse.model_validate(session, from_attributes=True)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: uuid.UUID,
    db: DbSession,
    redis: RedisClient,
) -> SessionResponse:
    service = _get_session_service(db, redis)
    session = await service.get_session(session_id)
    return SessionResponse.model_validate(session, from_attributes=True)


@router.post("/{session_id}/start", response_model=SessionResponse)
async def start_session(
    session_id: uuid.UUID,
    db: DbSession,
    redis: RedisClient,
) -> SessionResponse:
    service = _get_session_service(db, redis)
    session = await service.start_session(session_id)
    return SessionResponse.model_validate(session, from_attributes=True)


@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: uuid.UUID,
    db: DbSession,
    redis: RedisClient,
) -> SessionResponse:
    service = _get_session_service(db, redis)
    session = await service.end_session(session_id)
    return SessionResponse.model_validate(session, from_attributes=True)
