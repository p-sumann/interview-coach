"""Minimal test agent — just a friendly assistant with a check_weather tool.

Usage:
    # 12 model (default for this test):
    python test_tool_agent.py console

    # 09 model:
    GEMINI_REALTIME_MODEL=gemini-2.5-flash-native-audio-preview-09-2025 python test_tool_agent.py console

    # With full Gemini WebSocket debug logging:
    LK_GOOGLE_DEBUG=1 python test_tool_agent.py console

Say "what's the weather in Tokyo?" to trigger the tool call.
Say "what time is it in Tokyo?" to trigger the second tool.
"""

import json
import logging
import os

from dotenv import load_dotenv
from google.genai import types as gemini_types
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    APIConnectOptions,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    room_io,
)
from livekit.agents.llm import function_tool
from livekit.plugins import google, silero

load_dotenv()
load_dotenv(".env.local")

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)-5s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("test-agent")


def prewarm(proc: JobProcess) -> None:
    """Preload VAD model once per process for faster connections."""
    proc.userdata["vad"] = silero.VAD.load()


server = AgentServer(
    num_idle_processes=0,
    host="0.0.0.0",
)
server.setup_fnc = prewarm

# ---------------------------------------------------------------------------
# Dummy weather data
# ---------------------------------------------------------------------------
WEATHER_DB = {
    "tokyo": {"temp_c": 22, "condition": "Partly cloudy", "humidity": 65},
    "new york": {"temp_c": 15, "condition": "Sunny", "humidity": 45},
    "london": {"temp_c": 12, "condition": "Rainy", "humidity": 80},
    "san francisco": {"temp_c": 18, "condition": "Foggy", "humidity": 72},
    "kathmandu": {"temp_c": 28, "condition": "Clear", "humidity": 40},
}


# ---------------------------------------------------------------------------
# Agent with tools
# ---------------------------------------------------------------------------
class WeatherAgent(Agent):
    """A simple assistant that can check the weather."""

    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are a friendly assistant. You can check the weather for cities "
                "using the check_weather tool. When the user asks about weather, "
                "ALWAYS use the tool — don't make up data. After getting the result, "
                "tell the user the weather in a natural, conversational way. "
                "Keep responses short and casual."
            ),
        )

    @function_tool()
    async def check_weather(self, context: RunContext, city: str) -> str:
        """Check the current weather for a given city.

        Args:
            city: The name of the city to check weather for (e.g. 'Tokyo', 'New York').
        """
        key = city.lower().strip()
        data = WEATHER_DB.get(key)

        if data:
            result = {"city": city, **data}
            logger.info(">>> TOOL CALLED: check_weather(%s) -> %s", city, result)
            return json.dumps(result)

        result = {
            "city": city,
            "error": f"No data for '{city}'. Available: {', '.join(WEATHER_DB.keys())}",
        }
        logger.info(">>> TOOL CALLED: check_weather(%s) -> %s", city, result)
        return json.dumps(result)

    @function_tool()
    async def get_time(self, context: RunContext, timezone: str = "UTC") -> str:
        """Get the current time in a given timezone. This is a second test tool.

        Args:
            timezone: The timezone to check (e.g. 'UTC', 'JST', 'EST'). Defaults to 'UTC'.
        """
        import datetime

        offsets = {"UTC": 0, "JST": 9, "EST": -5, "PST": -8, "CET": 1, "IST": 5}
        offset = offsets.get(timezone.upper(), 0)
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=offset)))
        result = {"timezone": timezone, "time": now.strftime("%H:%M:%S"), "date": now.strftime("%Y-%m-%d")}
        logger.info(">>> TOOL CALLED: get_time(%s) -> %s", timezone, result)
        return json.dumps(result)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
@server.rtc_session(agent_name="test-agent")
async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect()

    gemini_model = "gemini-2.5-flash-native-audio-preview-12-2025"
    logger.info("=== Test Agent Starting ===")
    logger.info("Model: %s", gemini_model)
    logger.info("LK_GOOGLE_DEBUG: %s", os.getenv("LK_GOOGLE_DEBUG", "0"))
    logger.info("===========================")

    conn_opts = APIConnectOptions(max_retry=3, retry_interval=2.0, timeout=15.0)

    realtime_kwargs: dict = dict(
        model=gemini_model,
        voice="Puck",
        language="en-US",
        input_audio_transcription=gemini_types.AudioTranscriptionConfig(),
        realtime_input_config=gemini_types.RealtimeInputConfig(
            automatic_activity_detection=gemini_types.AutomaticActivityDetection(
                start_of_speech_sensitivity=gemini_types.StartSensitivity.START_SENSITIVITY_HIGH,
                end_of_speech_sensitivity=gemini_types.EndSensitivity.END_SENSITIVITY_HIGH,
                silence_duration_ms=500,
            ),
        ),
        conn_options=conn_opts,
    )

    # realtime_kwargs["enable_affective_dialog"] = True

    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(**realtime_kwargs),
        vad=ctx.proc.userdata["vad"],
        aec_warmup_duration=1.0,
    )

    # Log every transcript event
    @session.on("conversation_item_added")
    def _on_item(ev):
        msg = ev.item
        text = getattr(msg, "text_content", None)
        role = getattr(msg, "role", "?")
        if text:
            logger.info("[TRANSCRIPT] %s: %s", str(role).split(".")[-1].upper(), text)

    @session.on("error")
    def _on_error(ev):
        logger.error("[SESSION ERROR] source=%s error=%s", type(ev.source).__name__, ev.error)

    logger.info("Starting session...")
    await session.start(
        room=ctx.room,
        agent=WeatherAgent(),
        room_options=room_io.RoomOptions(
            video_input=False,
            close_on_disconnect=True,
            delete_room_on_close=True,
        ),
    )
    logger.info("Session started, sending greeting...")

    try:
        await session.generate_reply(
            instructions="Say hi! Tell the user you can check the weather and time. Keep it to one sentence."
        )
        logger.info("Greeting delivered!")
    except Exception as e:
        logger.error("Greeting failed: %s", e)


if __name__ == "__main__":
    cli.run_app(server)
