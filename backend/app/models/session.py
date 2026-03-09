from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.feedback import CoachingNote, FeedbackSnapshot
    from app.models.scorecard import Scorecard


class InterviewSession(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "interview_sessions"

    room_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="created", index=True)
    current_phase_number: Mapped[int] = mapped_column(Integer, default=1)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)

    # Interview config (flattened)
    candidate_name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_role: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), default="")
    experience_level: Mapped[str] = mapped_column(String(10), nullable=False)
    role_type: Mapped[str] = mapped_column(String(20), nullable=False)
    primary_language: Mapped[str] = mapped_column(String(20), nullable=False)
    tech_stack: Mapped[list] = mapped_column(JSONB, default=list)
    interview_type: Mapped[str] = mapped_column(String(20), nullable=False)

    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    phases: Mapped[list[InterviewPhase]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="InterviewPhase.phase_number",
    )
    scorecard: Mapped[Scorecard | None] = relationship(  # noqa: F821
        back_populates="session",
        cascade="all, delete-orphan",
        uselist=False,
    )
    feedback_snapshots: Mapped[list[FeedbackSnapshot]] = relationship(  # noqa: F821
        back_populates="session",
        cascade="all, delete-orphan",
    )
    coaching_notes: Mapped[list[CoachingNote]] = relationship(  # noqa: F821
        back_populates="session",
        cascade="all, delete-orphan",
    )


class InterviewPhase(UUIDMixin, Base):
    __tablename__ = "interview_phases"
    __table_args__ = (UniqueConstraint("session_id", "phase_number"),)

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    phase_number: Mapped[int] = mapped_column(Integer, nullable=False)
    phase_type: Mapped[str] = mapped_column(String(20), nullable=False)
    interviewer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    question_count: Mapped[int] = mapped_column(Integer, default=0)

    session: Mapped[InterviewSession] = relationship(back_populates="phases")
