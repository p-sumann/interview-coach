import uuid
from datetime import UTC, datetime

from loguru import logger
from sqlalchemy import select

from app.db.engine import get_session_factory
from app.models.feedback import CoachingNote, FeedbackSnapshot
from app.models.scorecard import (
    CategoryScore,
    KeyMoment,
    LevelCalibration,
    PhaseScore,
    Scorecard,
    SessionAnalytics,
)
from app.models.session import InterviewPhase, InterviewSession
from app.redis.client import get_redis
from app.services.redis_service import RedisService

SEED_SESSION_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
SEED_SCORECARD_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
ACTIVE_SESSION_ID = uuid.UUID("00000000-0000-0000-0000-000000000010")
PENDING_SESSION_ID = uuid.UUID("00000000-0000-0000-0000-000000000020")


async def seed_if_empty() -> None:
    """Seed the database with demo data for development. Only runs in non-production environments."""
    factory = get_session_factory()
    async with factory() as db:
        existing = await db.execute(select(InterviewSession).where(InterviewSession.id == SEED_SESSION_ID))
        if existing.scalar_one_or_none() is not None:
            logger.info("Seed skipped — data already exists")
            return

        logger.info("Seeding development data...")

        redis_service = RedisService(get_redis())
        now = datetime.now(UTC)

        # ---- 1. Completed mock interview (Suman @ Google) ----
        session = InterviewSession(
            id=SEED_SESSION_ID,
            room_name="interview-seed-demo-01",
            status="completed",
            current_phase_number=3,
            candidate_name="Suman",
            target_role="Senior Software Engineer",
            company="Google",
            experience_level="senior",
            role_type="backend",
            primary_language="python",
            tech_stack=["Django", "PostgreSQL", "Redis", "Docker"],
            interview_type="mock",
            started_at=now,
            ended_at=now,
        )
        session.phases = [
            InterviewPhase(
                id=uuid.uuid4(),
                phase_number=1,
                phase_type="hr",
                interviewer_name="Marcus Johnson",
                role="Director of People",
                status="complete",
                started_at=now,
                ended_at=now,
                question_count=3,
            ),
            InterviewPhase(
                id=uuid.uuid4(),
                phase_number=2,
                phase_type="behavioral",
                interviewer_name="Sarah Chen",
                role="Senior Engineering Manager",
                status="complete",
                started_at=now,
                ended_at=now,
                question_count=4,
            ),
            InterviewPhase(
                id=uuid.uuid4(),
                phase_number=3,
                phase_type="technical",
                interviewer_name="Alex Rivera",
                role="Staff Software Engineer",
                status="complete",
                started_at=now,
                ended_at=now,
                question_count=3,
            ),
        ]
        db.add(session)
        await db.flush()

        # ---- 2. Feedback snapshots ----
        for fb in [
            {"confidence": 72, "pace": "good", "filler_words": 3},
            {"confidence": 75, "pace": "good", "filler_words": 4},
            {"confidence": 68, "pace": "fast", "filler_words": 6},
            {"confidence": 80, "pace": "good", "filler_words": 7},
            {"confidence": 74, "pace": "good", "filler_words": 9},
            {"confidence": 78, "pace": "good", "filler_words": 10},
            {"confidence": 71, "pace": "fast", "filler_words": 12},
        ]:
            db.add(FeedbackSnapshot(id=uuid.uuid4(), session_id=SEED_SESSION_ID, **fb))

        # ---- 3. Coaching notes ----
        for note in [
            {
                "timestamp_seconds": 15,
                "type": "positive",
                "message": "Great energy and enthusiasm in your introduction",
                "category": "communication",
            },
            {
                "timestamp_seconds": 40,
                "type": "positive",
                "message": "Strong alignment between your experience and the target role",
                "category": "content",
            },
            {
                "timestamp_seconds": 60,
                "type": "suggestion",
                "message": "Try to pause briefly before answering to gather your thoughts",
                "category": "communication",
            },
            {
                "timestamp_seconds": 75,
                "type": "positive",
                "message": "Excellent STAR format — specific metrics (99.2% accuracy, 10 languages)",
                "category": "content",
            },
            {
                "timestamp_seconds": 125,
                "type": "positive",
                "message": "Great example of leadership at scale — 5 teams, 50M daily calls",
                "category": "content",
            },
            {
                "timestamp_seconds": 150,
                "type": "suggestion",
                "message": "Speaking pace increased slightly under pressure — try to slow down",
                "category": "communication",
            },
            {
                "timestamp_seconds": 165,
                "type": "positive",
                "message": "Data-driven approach to handling pushback — strong senior signal",
                "category": "technical",
            },
            {
                "timestamp_seconds": 230,
                "type": "positive",
                "message": "Good clarifying questions before diving into system design",
                "category": "technical",
            },
            {
                "timestamp_seconds": 235,
                "type": "concern",
                "message": "Could elaborate more on trade-offs between consistency models",
                "category": "technical",
            },
        ]:
            db.add(CoachingNote(id=uuid.uuid4(), session_id=SEED_SESSION_ID, **note))

        # ---- 4. Scorecard ----
        scorecard = Scorecard(
            id=SEED_SCORECARD_ID,
            session_id=SEED_SESSION_ID,
            interview_type="mock",
            overall_score=78,
            overall_summary=(
                "Strong performance with room for improvement in delivery confidence."
                " Technical depth is solid at Senior level, with particularly impressive system design thinking."
            ),
            strengths=[
                "Used STAR format effectively in behavioral questions",
                "Clear communication of technical architecture decisions",
                "Good use of specific metrics and numbers in examples",
                "Strong system design thinking with scalability awareness",
                "Professional and composed throughout the interview",
            ],
            improvements=[
                "Hesitated and used filler words when thinking through answers",
                "Speaking pace increased noticeably under pressure (2:34-3:12)",
                "Could expand more on system design trade-offs and alternatives",
                "Filler words increased during technical questions",
                "Consider pausing before answering instead of rushing in",
            ],
            duration_seconds=872,
            generated_at=now,
            config_snapshot={
                "candidateName": "Suman",
                "targetRole": "Senior Software Engineer",
                "company": "Google",
                "experienceLevel": "senior",
                "roleType": "backend",
                "primaryLanguage": "python",
                "techStack": ["Django", "PostgreSQL", "Redis", "Docker"],
                "interviewType": "mock",
            },
        )
        scorecard.categories = [
            CategoryScore(
                id=uuid.uuid4(),
                name="Communication",
                score=82,
                description="Clear, structured responses with good STAR usage",
            ),
            CategoryScore(
                id=uuid.uuid4(),
                name="Technical",
                score=75,
                description="Solid system design, could elaborate on trade-offs",
            ),
            CategoryScore(
                id=uuid.uuid4(),
                name="Vocal Delivery",
                score=68,
                description="Vocal delivery confident, occasional hesitation under pressure",
            ),
            CategoryScore(
                id=uuid.uuid4(), name="Overall Presence", score=80, description="Professional demeanor, confident tone"
            ),
        ]
        scorecard.phase_scores = [
            PhaseScore(
                id=uuid.uuid4(),
                phase_type="hr",
                interviewer_name="Marcus Johnson",
                score=82,
                summary="Strong culture fit, clear motivation and career alignment",
                highlights=["Articulated career goals clearly", "Good cultural awareness and company research"],
            ),
            PhaseScore(
                id=uuid.uuid4(),
                phase_type="behavioral",
                interviewer_name="Sarah Chen",
                score=76,
                summary="Good STAR format usage but needs more quantitative metrics",
                highlights=["Strong leadership example at scale", "Data-driven conflict resolution approach"],
            ),
            PhaseScore(
                id=uuid.uuid4(),
                phase_type="technical",
                interviewer_name="Alex Rivera",
                score=74,
                summary="Solid system design thinking with good clarifying questions",
                highlights=[
                    "Good scaling approach for rate limiter",
                    "Could elaborate more on trade-offs and failure modes",
                ],
            ),
        ]
        scorecard.key_moments = [
            KeyMoment(
                id=uuid.uuid4(),
                timestamp_seconds=75,
                type="positive",
                message="Great example of adaptability — rearchitected NLP pipeline for 10 languages in 3 weeks",
            ),
            KeyMoment(
                id=uuid.uuid4(),
                timestamp_seconds=125,
                type="positive",
                message="Strong leadership story — led migration affecting 50M daily API calls across 5 teams",
            ),
            KeyMoment(
                id=uuid.uuid4(),
                timestamp_seconds=165,
                type="positive",
                message="Recovered well with data-driven approach to handling ML team pushback",
            ),
            KeyMoment(
                id=uuid.uuid4(),
                timestamp_seconds=230,
                type="positive",
                message="Good clarifying questions before system design — shows senior-level thinking",
            ),
            KeyMoment(
                id=uuid.uuid4(),
                timestamp_seconds=250,
                type="concern",
                message="Could have elaborated more on Redis failure modes and fallback strategies",
            ),
        ]
        scorecard.analytics = SessionAnalytics(
            id=uuid.uuid4(),
            speaking_time_pct=68,
            avg_confidence=74,
            filler_word_count=12,
            filler_word_breakdown={"um": 5, "uh": 4, "like": 3},
            questions_answered=8,
            phases_completed=3,
        )
        scorecard.level_calibration = LevelCalibration(
            id=uuid.uuid4(),
            selected_level="senior",
            calibrated_level="senior",
            theta_path=[3.5, 3.5, 4.0, 4.0, 3.5, 4.0],
            strongest_area="System Design (Senior+)",
            growth_area="Behavioral storytelling (Mid level)",
            recommendation=(
                "Your technical depth is solidly Senior and pushing toward Staff."
                " Focus on structuring your behavioral responses with more concrete metrics"
                " and multi-team impact examples to match your technical caliber."
            ),
        )
        db.add(scorecard)

        # ---- 5. Active session (Jane Doe @ Meta) ----
        active_session = InterviewSession(
            id=ACTIVE_SESSION_ID,
            room_name="interview-seed-active-01",
            status="active",
            current_phase_number=1,
            candidate_name="Jane Doe",
            target_role="Staff Software Engineer",
            company="Meta",
            experience_level="staff",
            role_type="fullstack",
            primary_language="typescript",
            tech_stack=["React", "Node.js", "GraphQL", "Kubernetes"],
            interview_type="technical",
            started_at=now,
        )
        active_session.phases = [
            InterviewPhase(
                id=uuid.uuid4(),
                phase_number=1,
                phase_type="technical",
                interviewer_name="Alex Rivera",
                role="Staff Software Engineer",
                status="active",
                started_at=now,
                question_count=2,
            ),
        ]
        db.add(active_session)

        # ---- 6. Pending session (Bob Smith @ Stripe) ----
        pending_session = InterviewSession(
            id=PENDING_SESSION_ID,
            room_name="interview-seed-pending-01",
            status="created",
            current_phase_number=1,
            candidate_name="Bob Smith",
            target_role="Mid-Level Backend Engineer",
            company="Stripe",
            experience_level="mid",
            role_type="backend",
            primary_language="go",
            tech_stack=["Go", "gRPC", "PostgreSQL"],
            interview_type="behavioral",
        )
        pending_session.phases = [
            InterviewPhase(
                id=uuid.uuid4(),
                phase_number=1,
                phase_type="behavioral",
                interviewer_name="Sarah Chen",
                role="Senior Engineering Manager",
                status="pending",
            ),
        ]
        db.add(pending_session)

        await db.commit()

        # Cache in Redis
        await redis_service.set_session_status(str(SEED_SESSION_ID), "completed")
        await redis_service.set_session_status(str(ACTIVE_SESSION_ID), "active")
        await redis_service.set_session_status(str(PENDING_SESSION_ID), "created")

        logger.success("Seed complete — 3 sessions created")
