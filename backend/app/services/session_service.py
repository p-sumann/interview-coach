import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import InvalidStateTransitionError, SessionNotFoundError
from app.models.session import InterviewPhase, InterviewSession
from app.schemas.session import SessionCreateRequest
from app.services.redis_service import RedisService

VALID_TRANSITIONS: dict[str, set[str]] = {
    "created": {"connecting", "active", "failed"},
    "connecting": {"active", "failed"},
    "active": {"ending", "failed"},
    "ending": {"completed", "failed"},
    "completed": set(),
    "failed": set(),
}

FULL_INTERVIEW_PHASES = [
    {"phase_number": 1, "phase_type": "hr", "interviewer_name": "Marcus Johnson", "role": "Director of People"},
    {
        "phase_number": 2,
        "phase_type": "behavioral",
        "interviewer_name": "Sarah Chen",
        "role": "Senior Engineering Manager",
    },
    {
        "phase_number": 3,
        "phase_type": "technical",
        "interviewer_name": "Alex Rivera",
        "role": "Staff Software Engineer",
    },
]

DEFAULT_PERSONAS = {
    "hr": {"interviewer_name": "Marcus Johnson", "role": "Director of People"},
    "behavioral": {"interviewer_name": "Sarah Chen", "role": "Senior Engineering Manager"},
    "technical": {"interviewer_name": "Alex Rivera", "role": "Staff Software Engineer"},
}


class SessionService:
    def __init__(self, db: AsyncSession, redis_service: RedisService) -> None:
        self._db = db
        self._redis = redis_service

    async def create_session(self, data: SessionCreateRequest) -> InterviewSession:
        session_id = uuid.uuid4()
        room_name = f"interview-{session_id.hex[:12]}"

        session = InterviewSession(
            id=session_id,
            room_name=room_name,
            status="created",
            candidate_name=data.candidate_name,
            target_role=data.target_role,
            company=data.company,
            experience_level=data.experience_level.value,
            role_type=data.role_type.value,
            primary_language=data.primary_language.value,
            tech_stack=data.tech_stack,
            interview_type=data.interview_type.value,
            user_id=data.user_id,
        )

        persona = DEFAULT_PERSONAS.get(data.interview_type.value, DEFAULT_PERSONAS["hr"])
        session.phases.append(
            InterviewPhase(
                id=uuid.uuid4(),
                phase_number=1,
                phase_type=data.interview_type.value,
                interviewer_name=persona["interviewer_name"],
                role=persona["role"],
            )
        )

        self._db.add(session)
        await self._db.flush()

        await self._redis.set_session_status(str(session_id), "created")

        return session

    async def get_session(self, session_id: uuid.UUID) -> InterviewSession:
        stmt = (
            select(InterviewSession)
            .options(selectinload(InterviewSession.phases))
            .where(InterviewSession.id == session_id)
        )
        result = await self._db.execute(stmt)
        session = result.scalar_one_or_none()
        if session is None:
            raise SessionNotFoundError(str(session_id))
        return session

    async def _transition_status(self, session_id: uuid.UUID, target_status: str) -> InterviewSession:
        session = await self.get_session(session_id)
        valid_targets = VALID_TRANSITIONS.get(session.status, set())
        if target_status not in valid_targets:
            raise InvalidStateTransitionError(session.status, target_status)

        session.status = target_status

        if target_status == "active" and session.started_at is None:
            session.started_at = datetime.now(UTC)
            for phase in session.phases:
                if phase.phase_number == 1:
                    phase.status = "active"
                    phase.started_at = datetime.now(UTC)
                    break

        if target_status in ("ending", "completed"):
            if session.ended_at is None:
                session.ended_at = datetime.now(UTC)
            for phase in session.phases:
                if phase.status == "active":
                    phase.status = "complete"
                    phase.ended_at = datetime.now(UTC)

        await self._db.flush()
        await self._redis.set_session_status(str(session_id), target_status)

        return session

    async def start_session(self, session_id: uuid.UUID) -> InterviewSession:
        return await self._transition_status(session_id, "active")

    async def end_session(self, session_id: uuid.UUID) -> InterviewSession:
        return await self._transition_status(session_id, "ending")

    async def complete_session(self, session_id: uuid.UUID) -> InterviewSession:
        return await self._transition_status(session_id, "completed")

    async def get_session_by_room(self, room_name: str) -> InterviewSession:
        stmt = (
            select(InterviewSession)
            .options(selectinload(InterviewSession.phases))
            .where(InterviewSession.room_name == room_name)
        )
        result = await self._db.execute(stmt)
        session = result.scalar_one_or_none()
        if session is None:
            raise SessionNotFoundError(room_name)
        return session

    async def list_user_sessions(self, user_id: str) -> list[InterviewSession]:
        stmt = (
            select(InterviewSession)
            .options(selectinload(InterviewSession.scorecard))
            .where(InterviewSession.user_id == user_id)
            .order_by(InterviewSession.created_at.desc())
            .limit(50)
        )
        result = await self._db.execute(stmt)
        return list(result.scalars().all())
