from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    from app.models.session import InterviewSession


class Scorecard(UUIDMixin, Base):
    __tablename__ = "scorecards"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    interview_type: Mapped[str] = mapped_column(String(20), nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    overall_summary: Mapped[str] = mapped_column(Text, nullable=False)
    strengths: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    improvements: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    config_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Relationships
    session: Mapped[InterviewSession] = relationship(back_populates="scorecard")  # noqa: F821
    categories: Mapped[list[CategoryScore]] = relationship(
        back_populates="scorecard",
        cascade="all, delete-orphan",
    )
    phase_scores: Mapped[list[PhaseScore]] = relationship(
        back_populates="scorecard",
        cascade="all, delete-orphan",
    )
    key_moments: Mapped[list[KeyMoment]] = relationship(
        back_populates="scorecard",
        cascade="all, delete-orphan",
    )
    analytics: Mapped[SessionAnalytics | None] = relationship(
        back_populates="scorecard",
        cascade="all, delete-orphan",
        uselist=False,
    )
    level_calibration: Mapped[LevelCalibration | None] = relationship(
        back_populates="scorecard",
        cascade="all, delete-orphan",
        uselist=False,
    )


class CategoryScore(UUIDMixin, Base):
    __tablename__ = "category_scores"

    scorecard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scorecards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    scorecard: Mapped[Scorecard] = relationship(back_populates="categories")


class PhaseScore(UUIDMixin, Base):
    __tablename__ = "phase_scores"

    scorecard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scorecards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    phase_type: Mapped[str] = mapped_column(String(20), nullable=False)
    interviewer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    highlights: Mapped[list] = mapped_column(JSONB, default=list)

    scorecard: Mapped[Scorecard] = relationship(back_populates="phase_scores")


class KeyMoment(UUIDMixin, Base):
    __tablename__ = "key_moments"

    scorecard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scorecards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    timestamp_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    scorecard: Mapped[Scorecard] = relationship(back_populates="key_moments")


class SessionAnalytics(UUIDMixin, Base):
    __tablename__ = "session_analytics"

    scorecard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scorecards.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    speaking_time_pct: Mapped[float] = mapped_column(Float, nullable=False)
    avg_confidence: Mapped[float] = mapped_column(Float, nullable=False)
    filler_word_count: Mapped[int] = mapped_column(Integer, nullable=False)
    filler_word_breakdown: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    questions_answered: Mapped[int] = mapped_column(Integer, nullable=False)
    phases_completed: Mapped[int] = mapped_column(Integer, nullable=False)

    scorecard: Mapped[Scorecard] = relationship(back_populates="analytics")


class LevelCalibration(UUIDMixin, Base):
    __tablename__ = "level_calibrations"

    scorecard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scorecards.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    selected_level: Mapped[str] = mapped_column(String(10), nullable=False)
    calibrated_level: Mapped[str] = mapped_column(String(10), nullable=False)
    theta_path: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    strongest_area: Mapped[str] = mapped_column(String(255), nullable=False)
    growth_area: Mapped[str] = mapped_column(String(255), nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)

    scorecard: Mapped[Scorecard] = relationship(back_populates="level_calibration")
