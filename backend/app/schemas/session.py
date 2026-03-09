import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.common import (
    CamelModel,
    ExperienceLevelEnum,
    InterviewTypeEnum,
    LegacyRoleType,
    PrimaryLanguageEnum,
    RoleTypeEnum,
    SessionStatusEnum,
)


class SessionCreateRequest(CamelModel):
    candidate_name: str = Field(min_length=1, max_length=200)
    target_role: str = Field(min_length=1, max_length=200)
    company: str = Field(default="", max_length=200)
    experience_level: ExperienceLevelEnum
    role_type: RoleTypeEnum
    primary_language: PrimaryLanguageEnum
    tech_stack: list[str] = Field(default=[], max_length=20)
    interview_type: InterviewTypeEnum
    user_id: str | None = Field(default=None, max_length=36)


class InterviewPhaseResponse(CamelModel):
    phase_number: int
    phase_type: InterviewTypeEnum
    interviewer_name: str
    role: str
    status: str


class SessionResponse(CamelModel):
    id: uuid.UUID
    room_name: str
    status: SessionStatusEnum
    current_phase_number: int
    candidate_name: str
    target_role: str
    company: str
    experience_level: ExperienceLevelEnum
    role_type: LegacyRoleType
    primary_language: PrimaryLanguageEnum
    tech_stack: list[str]
    interview_type: InterviewTypeEnum
    phases: list[InterviewPhaseResponse]
    created_at: datetime
    started_at: datetime | None = None
    ended_at: datetime | None = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }


class SessionListItem(CamelModel):
    """Lightweight session summary for history listings."""

    id: uuid.UUID
    status: SessionStatusEnum
    interview_type: InterviewTypeEnum
    target_role: str
    experience_level: ExperienceLevelEnum
    candidate_name: str
    created_at: datetime
    started_at: datetime | None = None
    ended_at: datetime | None = None
    overall_score: int | None = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }
