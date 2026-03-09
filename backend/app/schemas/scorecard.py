import uuid

from app.schemas.common import (
    CamelModel,
    CoachingNoteTypeEnum,
    ExperienceLevelEnum,
    InterviewTypeEnum,
)
from app.schemas.config import InterviewConfigSchema


class CategoryScoreSchema(CamelModel):
    name: str
    score: int
    description: str


class KeyMomentSchema(CamelModel):
    id: str
    timestamp: int
    type: CoachingNoteTypeEnum
    message: str


class SessionAnalyticsSchema(CamelModel):
    speaking_time_pct: float
    avg_confidence: float
    filler_word_count: int
    filler_word_breakdown: dict[str, int]
    questions_answered: int
    phases_completed: int


class PhaseScoreSchema(CamelModel):
    phase_type: InterviewTypeEnum
    interviewer_name: str
    score: int
    summary: str
    highlights: list[str]


class LevelCalibrationSchema(CamelModel):
    selected_level: ExperienceLevelEnum
    calibrated_level: ExperienceLevelEnum
    theta_path: list[float]
    strongest_area: str
    growth_area: str
    recommendation: str


class ScorecardResponse(CamelModel):
    session_id: uuid.UUID
    interview_type: InterviewTypeEnum
    overall_score: int
    overall_summary: str
    categories: list[CategoryScoreSchema]
    strengths: list[str]
    improvements: list[str]
    key_moments: list[KeyMomentSchema]
    analytics: SessionAnalyticsSchema
    phase_scores: list[PhaseScoreSchema]
    level_calibration: LevelCalibrationSchema
    generated_at: str
    config: InterviewConfigSchema
    duration_seconds: int


class ScorecardCreateRequest(CamelModel):
    overall_score: int
    overall_summary: str
    categories: list[CategoryScoreSchema]
    strengths: list[str]
    improvements: list[str]
    key_moments: list[KeyMomentSchema]
    analytics: SessionAnalyticsSchema
    phase_scores: list[PhaseScoreSchema]
    level_calibration: LevelCalibrationSchema
    duration_seconds: int
