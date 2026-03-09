from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
    )


class InterviewTypeEnum(StrEnum):
    HR = "hr"
    BEHAVIORAL = "behavioral"
    TECHNICAL = "technical"
    MOCK = "mock"


class ExperienceLevelEnum(StrEnum):
    JUNIOR = "junior"
    MID = "mid"
    SENIOR = "senior"
    STAFF = "staff"


class RoleTypeEnum(StrEnum):
    BACKEND = "backend"
    FRONTEND = "frontend"
    FULLSTACK = "fullstack"
    AI_ML = "ai_ml"
    DATA = "data"


# Map legacy role type values to their replacements.
_LEGACY_ROLE_TYPES: dict[str, str] = {
    "data_ml": "ai_ml",
    "devops": "backend",
    "mobile": "backend",
}


def _migrate_role_type(v: str) -> str:
    return _LEGACY_ROLE_TYPES.get(v, v)


LegacyRoleType = Annotated[RoleTypeEnum, BeforeValidator(_migrate_role_type)]


class PrimaryLanguageEnum(StrEnum):
    PYTHON = "python"
    JAVA = "java"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    GO = "go"


class SessionStatusEnum(StrEnum):
    CREATED = "created"
    CONNECTING = "connecting"
    ACTIVE = "active"
    ENDING = "ending"
    COMPLETED = "completed"
    FAILED = "failed"


class PhaseStatusEnum(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETE = "complete"


class PaceLevelEnum(StrEnum):
    SLOW = "slow"
    GOOD = "good"
    FAST = "fast"


class CoachingNoteTypeEnum(StrEnum):
    POSITIVE = "positive"
    SUGGESTION = "suggestion"
    CONCERN = "concern"


class CoachingCategoryEnum(StrEnum):
    DELIVERY = "delivery"
    CONTENT = "content"
    COMMUNICATION = "communication"
    TECHNICAL = "technical"
