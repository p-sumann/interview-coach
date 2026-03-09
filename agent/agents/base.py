"""Base interview agent and background transcript evaluator.

The dashboard/coaching feedback is driven by a background evaluator that watches
transcript events, NOT by a Gemini tool call. This eliminates the tool call
round-trip from Gemini's audio pipeline, letting it respond ~1-2s faster.
"""

from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass, field

from google import genai  # type: ignore[attr-defined]
from livekit import rtc
from livekit.agents import Agent  # noqa: F401 — re-exported via subclasses
from livekit.agents.voice import RunContext

from config.personas import InterviewerPersona
from config.seniority import update_theta
from core.api_client import BackendAPIClient
from core.scorecard import generate_scorecard
from prompts import build_system_prompt
from prompts.loader import load_prompt

logger = logging.getLogger("interview-agent")

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
EVALUATOR_MODEL = "gemini-3.1-flash-lite-preview"


EVALUATOR_SYSTEM_PROMPT = """\
You evaluate interview candidate responses. Given the interviewer's question and \
the candidate's answer, return ONLY valid JSON (no markdown):
{"confidence":70,"pace":"good","filler_words":0,"response_quality":3,"topics":"topic1,topic2","observation":"Brief coaching note","observation_category":"content"}

Fields:
- confidence: 0-100. High (80+) = specific examples, clear structure, decisive language. \
Medium (50-79) = general answers, some hedging. Low (<50) = vague, lots of "I think", rambling.
- pace: "slow" (long pauses, halting), "good" (natural rhythm), or "fast" (rushing, no pauses)
- filler_words: count of um, uh, like, you know, basically, actually, sort of, kind of, right, so (at start of sentences)
- response_quality: 1-5. Score based on: specificity (real examples vs generalities), \
structure (STAR format, clear reasoning), depth (surface vs insightful), relevance (addresses the question).
- topics: comma-separated technical/behavioral topics demonstrated
- observation: one actionable coaching note (max 20 words). Be specific about what they said. \
Good: "Strong STAR example about the migration project". Bad: "Good answer". \
For improvements: "Add specific metrics — how much did latency improve?"
- observation_category: "content" (what they said), "delivery" (how they said it), \
"communication" (structure/clarity), or "technical" (technical accuracy)

If the candidate's text is just a greeting, small talk, or too short to evaluate, return:
{"skip": true}"""


# ---------------------------------------------------------------------------
# Session-level shared state
# ---------------------------------------------------------------------------


@dataclass
class InterviewUserData:
    """Mutable state shared across all agents in a session."""

    session_id: str = ""
    config: dict = field(default_factory=dict)
    api: BackendAPIClient | None = None

    # Room reference for data channels
    room: rtc.Room | None = None

    # Adaptive engine state
    current_theta: float = 2.5
    theta_path: list[float] = field(default_factory=list)
    question_count: int = 0
    covered_topics: set[str] = field(default_factory=set)
    weak_areas: list[str] = field(default_factory=list)

    # Observations and feedback history for scorecard
    observations: list[dict] = field(default_factory=list)
    feedback_history: list[dict] = field(default_factory=list)

    # Transcript for scorecard (captured from conversation_item_added events)
    transcript: list[dict] = field(default_factory=list)

    # Timing
    started_at: float = 0.0
    phases_completed: int = 0
    interview_ended: bool = False

    # Track last agent question for background evaluator
    last_agent_question: str = ""

    async def send_feedback(self, payload: dict) -> None:
        """Send feedback data to the frontend via LiveKit data channel (topic='feedback')."""
        try:
            if not self.room:
                logger.warning("Room not available for data channel")
                return

            data = json.dumps(payload).encode()
            await self.room.local_participant.publish_data(
                data,
                reliable=True,
                topic="feedback",
            )
            logger.debug("Sent feedback via data channel: %s", payload.get("type"))
        except Exception as e:
            logger.warning("Data channel send failed: %s", e)

    async def send_rpc(self, action: str, payload: dict) -> None:
        """Send control events to the frontend via data channel (topic='events').

        Uses publish_data instead of perform_rpc to avoid round-trip latency.
        """
        try:
            if not self.room:
                logger.warning("Room not available for data channel")
                return

            data = json.dumps({"action": action, **payload}).encode()
            await self.room.local_participant.publish_data(
                data,
                reliable=True,
                topic="events",
            )
            logger.debug("Sent event via data channel: action=%s", action)
        except Exception as e:
            logger.warning("Event send failed (action=%s): %s", action, e)


RunCtx = RunContext[InterviewUserData]


# ---------------------------------------------------------------------------
# Background transcript evaluator (replaces Gemini tool call)
# ---------------------------------------------------------------------------

_eval_client: genai.Client | None = None


def _get_eval_client() -> genai.Client:
    """Lazy-init a shared Gemini client for the background evaluator."""
    global _eval_client
    if _eval_client is None:
        _eval_client = genai.Client(api_key=GOOGLE_API_KEY)
    return _eval_client


async def evaluate_response_background(
    userdata: InterviewUserData,
    agent_question: str,
    candidate_answer: str,
) -> None:
    """Evaluate a candidate response in the background using Gemini Flash Lite.

    This runs completely outside Gemini Realtime's pipeline — no tool call
    overhead, no blocking the audio stream.
    """
    try:
        client = _get_eval_client()
        user_prompt = f"Question: {agent_question}\n\nCandidate's answer: {candidate_answer}"

        response = await client.aio.models.generate_content(
            model=EVALUATOR_MODEL,
            contents=user_prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=EVALUATOR_SYSTEM_PROMPT,
                temperature=0.1,
            ),
        )

        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[: text.rfind("```")]
            text = text.strip()

        result = json.loads(text)

        # Skip non-substantive responses (greetings, small talk)
        if result.get("skip"):
            return

        elapsed = int(time.time() - userdata.started_at) if userdata.started_at else 0
        response_quality = result.get("response_quality", 3)
        confidence = result.get("confidence", 50)
        pace = result.get("pace", "good")
        filler_words = result.get("filler_words", 0)
        topics = result.get("topics", "")
        observation = result.get("observation", "")
        observation_category = result.get("observation_category", "content")

        # Update adaptive difficulty
        userdata.current_theta = update_theta(userdata.current_theta, response_quality)
        userdata.theta_path.append(userdata.current_theta)
        userdata.question_count += 1
        topic_list = [t.strip() for t in topics.split(",") if t.strip()]
        userdata.covered_topics.update(topic_list)

        # Build feedback & observation
        feedback_data = {
            "confidence": confidence,
            "pace": pace,
            "fillerWords": filler_words,
        }
        userdata.feedback_history.append(feedback_data)

        note_type = "suggestion" if response_quality < 3 else "positive"
        obs = {
            "timestampSeconds": elapsed,
            "type": note_type,
            "message": observation,
            "category": observation_category,
        }
        userdata.observations.append(obs)

        # Send to frontend via data channel
        await userdata.send_feedback(
            {
                "type": "feedback",
                "data": {
                    "confidence": confidence,
                    "pace": pace,
                    "filler_words": filler_words,
                },
            }
        )
        await userdata.send_feedback(
            {
                "type": "coaching_note",
                "data": {
                    "note_type": note_type,
                    "message": observation,
                    "category": observation_category,
                },
            }
        )

        # Persist to backend
        if userdata.api:
            try:
                await userdata.api.post_feedback(userdata.session_id, feedback_data)
            except Exception as e:
                logger.warning("Failed to persist feedback: %s", e)
            try:
                await userdata.api.post_coaching_note(userdata.session_id, obs)
            except Exception as e:
                logger.warning("Failed to persist coaching note: %s", e)

        logger.debug("Background evaluation complete: quality=%d", response_quality)

    except Exception as e:
        logger.warning("Background evaluation failed: %s", e)


# ---------------------------------------------------------------------------
# Base interview agent (no tools — Gemini just interviews naturally)
# ---------------------------------------------------------------------------


class BaseInterviewAgent(Agent):
    """Base class for all interview agents. No function tools — Gemini
    focuses purely on the conversation without tool call overhead."""

    def __init__(
        self,
        persona: InterviewerPersona,
        config: dict,
        phase_info: str = "",
        chat_ctx=None,
    ) -> None:
        self.persona = persona
        self._config = config

        instructions = build_system_prompt(
            config=config,
            persona=persona,
            phase_info=phase_info,
        )

        kwargs: dict = {"instructions": instructions}
        if chat_ctx is not None:
            kwargs["chat_ctx"] = chat_ctx

        super().__init__(**kwargs)

    async def on_enter(self) -> None:
        """Called when this agent becomes the active agent.

        On initial session start we skip the greeting — the entrypoint
        calls generate_reply() AFTER session.start() completes so the
        Gemini realtime connection is fully established first.

        Handoff greetings (subsequent agents) call generate_reply here
        since Gemini is already connected.
        """
        userdata: InterviewUserData = self.session.userdata
        if userdata.started_at == 0.0:
            userdata.started_at = time.time()

        # Skip greeting on initial enter — entrypoint handles it after
        # session.start() so Gemini is fully connected.
        if not getattr(userdata, "_initial_greeting_done", False):
            return

        # Handoff greeting (Gemini already connected, generate_reply works)
        candidate_name = self._config.get("candidate_name", "there")
        agent_prompts = load_prompt("agents")["on_enter"]
        instructions = agent_prompts["single"].format(
            candidate_name=candidate_name,
            persona_name=self.persona.name,
        )
        await self.session.generate_reply(instructions=instructions)


# ---------------------------------------------------------------------------
# Shared end-interview logic
# ---------------------------------------------------------------------------


async def handle_end_interview(context: RunCtx, phases_completed: int) -> str:
    """Common logic for ending an interview and triggering scorecard generation."""
    userdata = context.userdata
    if userdata.interview_ended:
        return "Interview has already ended."
    userdata.interview_ended = True
    duration = int(time.time() - userdata.started_at) if userdata.started_at else 0

    # Notify frontend via RPC
    await userdata.send_rpc(
        "interviewEnded",
        {
            "sessionId": userdata.session_id,
        },
    )

    # Update session status to "ending"
    if userdata.api:
        try:
            await userdata.api.update_session_status(userdata.session_id, "end")
        except Exception as e:
            logger.warning("Failed to update session status: %s", e)

    # Generate scorecard via Gemini
    logger.info("Generating scorecard for session %s", userdata.session_id)
    try:
        scorecard_data = await generate_scorecard(
            config=userdata.config,
            observations=userdata.observations,
            feedback_history=userdata.feedback_history,
            theta_path=userdata.theta_path,
            duration_seconds=duration,
            questions_count=userdata.question_count,
            phases_completed=phases_completed,
            transcript=userdata.transcript,
        )
    except Exception as e:
        logger.error("Scorecard generation failed for session %s: %s", userdata.session_id, e)
        await userdata.send_rpc(
            "scorecardFailed",
            {
                "sessionId": userdata.session_id,
                "error": str(e),
            },
        )
        return "Interview complete. Scorecard generation failed — please try again later."

    # Post scorecard to backend
    if userdata.api:
        try:
            await userdata.api.post_scorecard(userdata.session_id, scorecard_data)
            logger.info("Scorecard posted for session %s", userdata.session_id)
        except Exception as e:
            logger.warning("Failed to post scorecard: %s", e)

    # Notify frontend that scorecard is ready
    await userdata.send_rpc(
        "scorecardReady",
        {
            "sessionId": userdata.session_id,
        },
    )

    return "Interview complete. Scorecard has been generated and saved."
