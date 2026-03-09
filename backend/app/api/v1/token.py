from __future__ import annotations

import json
import uuid
from typing import TYPE_CHECKING

from fastapi import APIRouter, Request
from loguru import logger

from app.api.deps import DbSession, RedisClient
from app.config import get_settings
from app.middleware.rate_limit import limiter
from app.schemas.token import TokenRequest, TokenResponse
from app.services.redis_service import RedisService
from app.services.session_service import SessionService
from app.services.token_service import TokenService

if TYPE_CHECKING:
    from app.models.session import InterviewSession

router = APIRouter(tags=["token"])


@router.post("/token", response_model=TokenResponse)
@limiter.limit(get_settings().RATE_LIMIT_TOKEN)
async def generate_token(
    request: Request,
    data: TokenRequest,
    db: DbSession,
    redis: RedisClient,
) -> TokenResponse:
    # If session_id is provided, fetch session config and embed as room metadata
    room_metadata: str | None = None
    if data.session_id:
        service = SessionService(db, RedisService(redis))
        session = await service.get_session(data.session_id)
        room_metadata = _build_room_metadata(session, data.session_id)
        logger.debug(f"Token room_metadata for session {data.session_id}: {room_metadata[:120]}")
    else:
        logger.debug("Token generated without session_id — no room metadata embedded")

    token_service = TokenService()
    jwt_token, url = await token_service.generate_token(
        data.room_name,
        data.participant_name,
        room_metadata=room_metadata,
    )
    return TokenResponse(token=jwt_token, url=url)


def _build_room_metadata(session: InterviewSession, session_id: str | uuid.UUID) -> str:
    """Build JSON metadata string from a session ORM object for the agent."""
    return json.dumps(
        {
            "session_id": str(session_id),
            "interview_type": session.interview_type,
            "experience_level": session.experience_level,
            "role_type": session.role_type,
            "primary_language": session.primary_language,
            "candidate_name": session.candidate_name,
            "target_role": session.target_role,
            "tech_stack": session.tech_stack or [],
        }
    )
