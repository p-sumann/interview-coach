import uuid

from pydantic import Field

from app.schemas.common import (
    CamelModel,
    CoachingCategoryEnum,
    CoachingNoteTypeEnum,
    PaceLevelEnum,
)


class FeedbackCreateRequest(CamelModel):
    confidence: float = Field(ge=0.0, le=100.0)
    pace: PaceLevelEnum
    filler_words: int = Field(ge=0)


class CoachingNoteCreateRequest(CamelModel):
    timestamp_seconds: int = Field(ge=0)
    type: CoachingNoteTypeEnum
    message: str = Field(min_length=1, max_length=2000)
    category: CoachingCategoryEnum


class CoachingNoteResponse(CamelModel):
    id: uuid.UUID
    timestamp_seconds: int
    type: CoachingNoteTypeEnum
    message: str
    category: CoachingCategoryEnum

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
    }
