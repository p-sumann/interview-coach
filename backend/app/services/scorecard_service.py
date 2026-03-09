import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ScorecardNotFoundError, ScorecardNotReadyError
from app.models.scorecard import (
    CategoryScore,
    KeyMoment,
    LevelCalibration,
    PhaseScore,
    Scorecard,
    SessionAnalytics,
)
from app.models.session import InterviewSession
from app.schemas.common import (
    CoachingNoteTypeEnum,
    ExperienceLevelEnum,
    InterviewTypeEnum,
)
from app.schemas.config import InterviewConfigSchema
from app.schemas.scorecard import (
    CategoryScoreSchema,
    KeyMomentSchema,
    LevelCalibrationSchema,
    PhaseScoreSchema,
    ScorecardCreateRequest,
    ScorecardResponse,
    SessionAnalyticsSchema,
)
from app.services.redis_service import RedisService


class ScorecardService:
    def __init__(self, db: AsyncSession, redis_service: RedisService) -> None:
        self._db = db
        self._redis = redis_service

    async def get_scorecard(self, session_id: uuid.UUID) -> ScorecardResponse:
        cached = await self._redis.get_cached_scorecard(str(session_id))
        if cached:
            return ScorecardResponse.model_validate_json(cached)

        stmt = (
            select(Scorecard)
            .options(
                selectinload(Scorecard.categories),
                selectinload(Scorecard.phase_scores),
                selectinload(Scorecard.key_moments),
                selectinload(Scorecard.analytics),
                selectinload(Scorecard.level_calibration),
            )
            .where(Scorecard.session_id == session_id)
        )
        result = await self._db.execute(stmt)
        scorecard = result.scalar_one_or_none()

        if scorecard is None:
            session_stmt = select(InterviewSession.status).where(InterviewSession.id == session_id)
            session_result = await self._db.execute(session_stmt)
            status = session_result.scalar_one_or_none()
            if status == "ending":
                raise ScorecardNotReadyError(str(session_id))
            raise ScorecardNotFoundError(str(session_id))

        response = self._to_response(scorecard)

        await self._redis.cache_scorecard(
            str(session_id),
            response.model_dump_json(by_alias=True),
        )

        return response

    async def create_scorecard(
        self,
        session_id: uuid.UUID,
        data: ScorecardCreateRequest,
        session: InterviewSession,
    ) -> ScorecardResponse:
        scorecard = Scorecard(
            id=uuid.uuid4(),
            session_id=session_id,
            interview_type=session.interview_type,
            overall_score=data.overall_score,
            overall_summary=data.overall_summary,
            strengths=data.strengths,
            improvements=data.improvements,
            duration_seconds=data.duration_seconds,
            generated_at=datetime.now(UTC),
            config_snapshot={
                "candidateName": session.candidate_name,
                "targetRole": session.target_role,
                "company": session.company,
                "experienceLevel": session.experience_level,
                "roleType": session.role_type,
                "primaryLanguage": session.primary_language,
                "techStack": session.tech_stack,
                "interviewType": session.interview_type,
            },
        )

        for cat in data.categories:
            scorecard.categories.append(
                CategoryScore(id=uuid.uuid4(), name=cat.name, score=cat.score, description=cat.description)
            )

        for ps in data.phase_scores:
            scorecard.phase_scores.append(
                PhaseScore(
                    id=uuid.uuid4(),
                    phase_type=ps.phase_type.value,
                    interviewer_name=ps.interviewer_name,
                    score=ps.score,
                    summary=ps.summary,
                    highlights=ps.highlights,
                )
            )

        for km in data.key_moments:
            scorecard.key_moments.append(
                KeyMoment(
                    id=uuid.uuid4(),
                    timestamp_seconds=km.timestamp,
                    type=km.type.value,
                    message=km.message,
                )
            )

        analytics = data.analytics
        scorecard.analytics = SessionAnalytics(
            id=uuid.uuid4(),
            speaking_time_pct=analytics.speaking_time_pct,
            avg_confidence=analytics.avg_confidence,
            filler_word_count=analytics.filler_word_count,
            filler_word_breakdown=analytics.filler_word_breakdown,
            questions_answered=analytics.questions_answered,
            phases_completed=analytics.phases_completed,
        )

        cal = data.level_calibration
        scorecard.level_calibration = LevelCalibration(
            id=uuid.uuid4(),
            selected_level=cal.selected_level.value,
            calibrated_level=cal.calibrated_level.value,
            theta_path=cal.theta_path,
            strongest_area=cal.strongest_area,
            growth_area=cal.growth_area,
            recommendation=cal.recommendation,
        )

        self._db.add(scorecard)

        session.status = "completed"

        await self._db.flush()

        response = self._to_response(scorecard)
        await self._redis.cache_scorecard(
            str(session_id),
            response.model_dump_json(by_alias=True),
        )
        await self._redis.set_session_status(str(session_id), "completed")

        return response

    def _to_response(self, scorecard: Scorecard) -> ScorecardResponse:
        if scorecard.analytics:
            analytics = SessionAnalyticsSchema(
                speaking_time_pct=scorecard.analytics.speaking_time_pct,
                avg_confidence=scorecard.analytics.avg_confidence,
                filler_word_count=scorecard.analytics.filler_word_count,
                filler_word_breakdown=scorecard.analytics.filler_word_breakdown,
                questions_answered=scorecard.analytics.questions_answered,
                phases_completed=scorecard.analytics.phases_completed,
            )
        else:
            analytics = SessionAnalyticsSchema(
                speaking_time_pct=0,
                avg_confidence=0,
                filler_word_count=0,
                filler_word_breakdown={},
                questions_answered=0,
                phases_completed=0,
            )

        if scorecard.level_calibration:
            level_calibration = LevelCalibrationSchema(
                selected_level=ExperienceLevelEnum(scorecard.level_calibration.selected_level),
                calibrated_level=ExperienceLevelEnum(scorecard.level_calibration.calibrated_level),
                theta_path=scorecard.level_calibration.theta_path,
                strongest_area=scorecard.level_calibration.strongest_area,
                growth_area=scorecard.level_calibration.growth_area,
                recommendation=scorecard.level_calibration.recommendation,
            )
        else:
            level_calibration = LevelCalibrationSchema(
                selected_level=ExperienceLevelEnum.JUNIOR,
                calibrated_level=ExperienceLevelEnum.JUNIOR,
                theta_path=[],
                strongest_area="",
                growth_area="",
                recommendation="",
            )

        return ScorecardResponse(
            session_id=scorecard.session_id,
            interview_type=InterviewTypeEnum(scorecard.interview_type),
            overall_score=scorecard.overall_score,
            overall_summary=scorecard.overall_summary,
            categories=[
                CategoryScoreSchema(name=c.name, score=c.score, description=c.description) for c in scorecard.categories
            ],
            strengths=scorecard.strengths,
            improvements=scorecard.improvements,
            key_moments=[
                KeyMomentSchema(
                    id=str(km.id),
                    timestamp=km.timestamp_seconds,
                    type=CoachingNoteTypeEnum(km.type),
                    message=km.message,
                )
                for km in scorecard.key_moments
            ],
            analytics=analytics,
            phase_scores=[
                PhaseScoreSchema(
                    phase_type=InterviewTypeEnum(ps.phase_type),
                    interviewer_name=ps.interviewer_name,
                    score=ps.score,
                    summary=ps.summary,
                    highlights=ps.highlights,
                )
                for ps in scorecard.phase_scores
            ],
            level_calibration=level_calibration,
            generated_at=scorecard.generated_at.isoformat(),
            config=InterviewConfigSchema.model_validate(scorecard.config_snapshot),
            duration_seconds=scorecard.duration_seconds,
        )
