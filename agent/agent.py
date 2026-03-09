"""InterviewPilot — LiveKit AI Agent entrypoint.

This is the main entrypoint for the LiveKit agent that powers the interview
experience. It connects to LiveKit rooms, uses Gemini Live API for real-time
voice + text, and routes to the appropriate agent(s) based on interview type.
"""

import asyncio
import json
import logging
import time
import uuid

from dotenv import load_dotenv
from google.genai import types as gemini_types
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    APIConnectOptions,
    CloseEvent,
    ConversationItemAddedEvent,
    ErrorEvent,
    JobContext,
    JobProcess,
    cli,
    room_io,
)
from livekit.agents.llm import ChatMessage
from livekit.agents.voice.agent_session import SessionConnectOptions
from livekit.plugins import google, silero

from agents import (
    BehavioralInterviewAgent,
    HRInterviewAgent,
    InterviewUserData,
    TechnicalInterviewAgent,
)
from agents.base import evaluate_response_background
from config import PERSONAS, SENIORITY_PROFILES
from prompts.loader import load_prompt
from core import BackendAPIClient, configure_logging
from core.gemini_tool_call_fix import patch_realtime_session
from core.scorecard import generate_scorecard

load_dotenv()
load_dotenv(".env.local")

configure_logging()
logger = logging.getLogger("interview-agent")

# Max interview duration in seconds per type
_MAX_DURATION: dict[str, int] = {
    "hr": 300,  # 5 min
    "behavioral": 600,  # 10 min
    "technical": 600,  # 10 min
}

REQUIRED_METADATA_FIELDS = {"session_id", "interview_type"}

server = AgentServer(
    shutdown_process_timeout=30.0,
    # Keep 1 warmed process ready in dev so VAD is preloaded before jobs arrive.
    # Prevents "no warmed process available" delays on first connect.
    num_idle_processes=1,
    initialize_process_timeout=30.0,
)


def prewarm(proc: JobProcess) -> None:
    """Preload VAD model once per process for faster connections."""
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


_DEFAULT_CONFIG: dict[str, str | list[str]] = {
    "session_id": "",
    "interview_type": "behavioral",
    "experience_level": "mid",
    "role_type": "backend",
    "primary_language": "python",
    "candidate_name": "Candidate",
    "target_role": "Software Engineer",
    "tech_stack": [],
}


async def _parse_room_config(ctx: JobContext) -> dict:
    """Extract interview configuration from room metadata, with multi-source fallback.

    Priority order:
    1. Job dispatch metadata (RoomAgentDispatch.metadata → ctx.job.metadata) — most reliable
    2. Room metadata (RoomConfiguration.metadata → ctx.room.metadata)
    3. Backend API lookup by room name (/sessions/by-room/{room_name})
    4. Default config values (dev/console mode)
    """
    metadata: dict = {}

    # Source 1: Job dispatch metadata (set via RoomAgentDispatch.metadata in token)
    job_metadata_raw = getattr(ctx.job, "metadata", None) or ""
    if job_metadata_raw:
        try:
            metadata = json.loads(job_metadata_raw)
            if REQUIRED_METADATA_FIELDS <= metadata.keys():
                logger.info("Using job dispatch metadata (session_id=%s)", metadata.get("session_id"))
                return _finalize_config(metadata)
        except json.JSONDecodeError:
            logger.warning("Invalid job dispatch metadata JSON: %s", job_metadata_raw[:100])

    # Source 2: Room metadata (set via RoomConfiguration.metadata in token)
    room_metadata_raw = ctx.room.metadata or ""
    if room_metadata_raw:
        try:
            metadata = json.loads(room_metadata_raw)
            if REQUIRED_METADATA_FIELDS <= metadata.keys():
                logger.info("Using room metadata (session_id=%s)", metadata.get("session_id"))
                return _finalize_config(metadata)
        except json.JSONDecodeError:
            logger.warning("Invalid room metadata JSON: %s", room_metadata_raw[:100])

    # Source 3: Backend API lookup by room name
    logger.warning(
        "Room metadata missing fields: %s — trying backend lookup",
        REQUIRED_METADATA_FIELDS - metadata.keys(),
    )
    try:
        from core.api_client import BackendAPIClient
        client = BackendAPIClient()
        session_data = await client.get_session_by_room(ctx.room.name)
        await client.close()
        metadata = {
            "session_id": session_data.get("id", ""),
            "interview_type": session_data.get("interviewType", ""),
            "experience_level": session_data.get("experienceLevel", ""),
            "role_type": session_data.get("roleType", ""),
            "primary_language": session_data.get("primaryLanguage", ""),
            "candidate_name": session_data.get("candidateName", ""),
            "target_role": session_data.get("targetRole", ""),
            "tech_stack": session_data.get("techStack", []),
        }
        logger.info(
            "Fetched session config from backend for room %s: session_id=%s",
            ctx.room.name,
            metadata["session_id"],
        )
        return _finalize_config(metadata)
    except Exception as e:
        logger.warning("Backend lookup failed for room %s: %s — using defaults", ctx.room.name, e)

    # Source 4: Defaults (dev/console mode)
    return _finalize_config(metadata)


def _finalize_config(metadata: dict) -> dict:
    """Merge metadata with defaults and validate session_id."""
    config = {**_DEFAULT_CONFIG, **metadata}

    # Ensure session_id is a valid UUID (generate one for console/dev mode)
    sid = config.get("session_id", "")
    try:
        uuid.UUID(sid)
        config["_session_from_metadata"] = True
    except (ValueError, AttributeError):
        config["session_id"] = str(uuid.uuid4())
        config["_session_from_metadata"] = False
        logger.info("Generated dev session_id: %s", config["session_id"])

    return config


def _build_initial_agent(config: dict) -> Agent:
    """Route to the correct agent based on interview type."""
    interview_type = config.get("interview_type", "behavioral")

    if interview_type == "hr":
        return HRInterviewAgent(config=config)
    elif interview_type == "technical":
        return TechnicalInterviewAgent(config=config)
    else:
        return BehavioralInterviewAgent(config=config)


def _get_initial_theta(config: dict) -> float:
    """Get the initial theta based on seniority level."""
    seniority = config.get("experience_level", "mid")
    profile = SENIORITY_PROFILES.get(seniority)
    if profile:
        return profile.initial_theta
    return 2.5


def _get_voice(config: dict) -> str:
    """Get the Gemini voice for the session based on persona."""
    interview_type = config.get("interview_type", "behavioral")
    persona = PERSONAS.get(interview_type)
    if persona:
        return persona.voice
    return "Puck"


def _get_persona_name(config: dict) -> str:
    """Get the persona name for the session based on interview type."""
    interview_type = config.get("interview_type", "behavioral")
    persona = PERSONAS.get(interview_type)
    if persona:
        return persona.name
    return "Your Interviewer"


@server.rtc_session(agent_name="interview-agent")
async def entrypoint(ctx: JobContext) -> None:
    """Main RTC session entrypoint — called when a user joins an interview room."""
    # Connect first so room metadata (set via token RoomConfiguration) is populated
    await ctx.connect()

    config = await _parse_room_config(ctx)
    session_id = config["session_id"]
    interview_type = config["interview_type"]

    logger.info(
        "Starting interview session",
        extra={
            "session_id": session_id,
            "interview_type": interview_type,
            "room": ctx.room.name,
        },
    )

    # Initialize backend API client
    api_client = BackendAPIClient()

    # Build shared session state (room wired in for RPC after session.start)
    userdata = InterviewUserData(
        session_id=session_id,
        config=config,
        api=api_client,
        room=ctx.room,
        current_theta=_get_initial_theta(config),
    )

    # Build the initial agent
    initial_agent = _build_initial_agent(config)

    # Create the agent session with Gemini Live (audio only, no video to model)
    voice = _get_voice(config)

    # More resilient connection options for Gemini Realtime (transient 1011 errors)
    gemini_conn_options = APIConnectOptions(max_retry=5, retry_interval=2.0, timeout=15.0)

    session = AgentSession[InterviewUserData](
        userdata=userdata,
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.5-flash-native-audio-preview-09-2025",
            voice=voice,
            language="en-US",
            input_audio_transcription=gemini_types.AudioTranscriptionConfig(),
            proactivity=True,
            enable_affective_dialog=True,
            context_window_compression=gemini_types.ContextWindowCompressionConfig(
                sliding_window=gemini_types.SlidingWindow(
                    # Cap conversation context to prevent latency growth.
                    # System instructions are excluded from this limit.
                    # ~4k tokens ≈ last 2-3 Q&A exchanges for Gemini audio.
                    # Combined with periodic context resets every 3 turns.
                    target_tokens=4096,
                ),
            ),
            # Gemini VAD tuning for interviews:
            # - LOW start sensitivity: prevent agent self-interruption from
            #   background noise, breathing, or "mm-hmm" sounds during agent speech
            # - LOW end sensitivity + 3s silence: let candidates pause to think
            #   without the agent jumping in prematurely
            realtime_input_config=gemini_types.RealtimeInputConfig(
                automatic_activity_detection=gemini_types.AutomaticActivityDetection(
                    start_of_speech_sensitivity=gemini_types.StartSensitivity.START_SENSITIVITY_LOW,
                    end_of_speech_sensitivity=gemini_types.EndSensitivity.END_SENSITIVITY_LOW,
                    silence_duration_ms=3000,
                ),
            ),
            session_resumption=gemini_types.SessionResumptionConfig(transparent=True),
            conn_options=gemini_conn_options,
        ),
        vad=ctx.proc.userdata["vad"],
        # Send transcripts immediately instead of syncing to audio playback timing.
        # This removes the delay between speech and text appearing in the UI.
        use_tts_aligned_transcript=False,
        # Interview-tuned turn detection: candidates pause while thinking,
        # so require longer silence and more words before interrupting.
        min_endpointing_delay=3.0,
        min_interruption_duration=1.0,
        min_interruption_words=3,
        conn_options=SessionConnectOptions(
            llm_conn_options=gemini_conn_options,
            max_unrecoverable_errors=5,
        ),
    )

    # -- Error handling: notify frontend on all errors --
    @session.on("error")
    def _on_error(ev: ErrorEvent) -> None:
        source_name = type(ev.source).__name__
        recoverable = ev.error.recoverable

        if recoverable:
            logger.warning(
                "Recoverable error from %s: %s",
                source_name,
                ev.error,
                extra={"session_id": session_id},
            )
        else:
            logger.error(
                "Unrecoverable error from %s: %s",
                source_name,
                ev.error,
                extra={"session_id": session_id},
            )

        async def _notify_error() -> None:
            try:
                await userdata.send_rpc(
                    "agentError",
                    {
                        "sessionId": session_id,
                        "source": source_name,
                        "recoverable": recoverable,
                        "message": str(ev.error),
                    },
                )
            except Exception:
                logger.debug("Failed to send error RPC to frontend")

        asyncio.create_task(_notify_error())

    # -- Transcript logging + background evaluation --
    transcript_logger = logging.getLogger("interview-agent.transcript")

    @session.on("conversation_item_added")
    def _on_transcript(ev: ConversationItemAddedEvent) -> None:
        msg = ev.item
        if not isinstance(msg, ChatMessage):
            return
        text = msg.text_content
        if not text:
            return
        role = msg.role.upper() if isinstance(msg.role, str) else str(msg.role).split(".")[-1].upper()
        metrics = msg.metrics

        # Store transcript for scorecard generation
        elapsed = int(time.time() - userdata.started_at) if userdata.started_at > 0 else 0
        userdata.transcript.append(
            {
                "role": role.lower(),
                "text": text,
                "timestamp": elapsed,
            }
        )

        # Track last agent question for background evaluation
        if role == "ASSISTANT":
            userdata.last_agent_question = text
        elif role == "USER" and userdata.last_agent_question:
            # Fire background evaluation — runs outside Gemini's pipeline
            asyncio.create_task(
                evaluate_response_background(
                    userdata=userdata,
                    agent_question=userdata.last_agent_question,
                    candidate_answer=text,
                )
            )

        # Log built-in metrics when available (not populated by Gemini Realtime)
        parts = []
        metric_keys = ("e2e_latency", "transcription_delay", "end_of_turn_delay", "llm_node_ttft", "tts_node_ttfb")
        for key in metric_keys:
            val = metrics.get(key)  # type: ignore[literal-required]
            if val:
                parts.append(f"{key}: {val * 1000:.0f}ms")
        suffix = f" ({', '.join(parts)})" if parts else ""
        transcript_logger.info("[%s]%s %s", role, suffix, text)

    # -- Shutdown callback: generate scorecard if not already done, then cleanup --
    async def _on_shutdown() -> None:
        if not userdata.interview_ended and userdata.started_at > 0:
            userdata.interview_ended = True
            duration = int(time.time() - userdata.started_at)
            logger.info(
                "Shutdown: generating scorecard (end_interview tool was not called)",
                extra={"session_id": session_id},
            )

            try:
                await api_client.update_session_status(session_id, "end")
            except Exception as e:
                # 409 Conflict is expected — frontend already called /end
                if "409" not in str(e):
                    logger.warning("Failed to update session status on shutdown: %s", e)

            try:
                scorecard_data = await generate_scorecard(
                    config=userdata.config,
                    observations=userdata.observations,
                    feedback_history=userdata.feedback_history,
                    theta_path=userdata.theta_path,
                    duration_seconds=duration,
                    questions_count=userdata.question_count,
                    phases_completed=max(userdata.phases_completed, 1),
                    transcript=userdata.transcript,
                )
                await api_client.post_scorecard(session_id, scorecard_data)
                logger.info("Scorecard generated on shutdown for session %s", session_id)
            except Exception as e:
                logger.error("Scorecard generation on shutdown failed: %s", e, extra={"session_id": session_id})

        await api_client.close()
        logger.info("Shutdown complete, resources cleaned up", extra={"session_id": session_id})

    ctx.add_shutdown_callback(_on_shutdown)

    # -- Cancel timeout on session close --
    timeout_task: asyncio.Task[None] | None = None

    @session.on("close")
    def _on_close(_ev: CloseEvent) -> None:
        if timeout_task and not timeout_task.done():
            timeout_task.cancel()

    # -- Session timeout: prevent runaway interviews --
    async def _enforce_timeout() -> None:
        max_seconds = _MAX_DURATION.get(interview_type, 1800)
        await asyncio.sleep(max_seconds)
        logger.warning("Session timeout reached (%ds)", max_seconds, extra={"session_id": session_id})
        try:
            payload = json.dumps({"type": "interview_timeout", "sessionId": session_id}).encode()
            if session.room_io and session.room_io.room:
                await session.room_io.room.local_participant.publish_data(payload, reliable=True)
        except Exception:
            logger.warning("Failed to publish timeout event", extra={"session_id": session_id})

    # Start the session (video stays in UI but is not sent to Gemini)
    await session.start(
        room=ctx.room,
        agent=initial_agent,
        room_options=room_io.RoomOptions(
            video_input=False,
            close_on_disconnect=True,
            delete_room_on_close=True,
        ),
    )

    # Apply Gemini tool call audio gating workaround (prevents 1008/1011 errors)
    # See: https://discuss.ai.google.dev/t/114644/56
    if session._activity and session._activity._rt_session:  # type: ignore[attr-defined]
        patch_realtime_session(session._activity._rt_session)  # type: ignore[attr-defined]

    timeout_task = asyncio.create_task(_enforce_timeout())

    # Update session status to active via backend
    try:
        await api_client.update_session_status(session_id, "start")
    except Exception as e:
        logger.warning("Failed to update session to active: %s", e)

    # Initial greeting — called HERE (not in on_enter) so the Gemini
    # realtime connection is fully established after session.start().
    # Small delay to let the WebSocket fully stabilize.
    await asyncio.sleep(1.0)

    candidate_name = config.get("candidate_name", "there")
    agent_prompts = load_prompt("agents")["on_enter"]
    greeting_instructions = agent_prompts["single"].format(
        candidate_name=candidate_name,
        persona_name=_get_persona_name(config),
    )

    try:
        await session.generate_reply(instructions=greeting_instructions)
    except Exception as e:
        logger.warning("Initial greeting generate_reply failed: %s — agent will respond when candidate speaks", e)

    # Mark initial greeting done so future handoffs use on_enter() greeting
    userdata._initial_greeting_done = True  # type: ignore[attr-defined]


if __name__ == "__main__":
    cli.run_app(server)
