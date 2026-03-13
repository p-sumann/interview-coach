"""Standalone interview agents (single mode): HR, Behavioral, Technical."""

import json
import logging

from livekit.agents.llm import function_tool

from agents.base import BaseInterviewAgent, RunCtx, handle_end_interview
from config.personas import PERSONAS

logger = logging.getLogger("interview.agents.standalone")


async def _end_interview(context: RunCtx) -> str:
    """Common method for ending standalone interviews. Announce ending first."""
    context.disallow_interruptions()
    return await handle_end_interview(context, phases_completed=1)


# ---------------------------------------------------------------------------
# Dummy tool for testing tool calling with Gemini 12-2025.
# Ask "what's the weather in Tokyo?" during a session to trigger it.
# Remove this once tool calling is confirmed working.
# ---------------------------------------------------------------------------
_DUMMY_WEATHER = {
    "Tokyo": {"temp_c": 22, "condition": "Partly cloudy", "humidity": 65},
    "New York": {"temp_c": 15, "condition": "Sunny", "humidity": 45},
    "London": {"temp_c": 12, "condition": "Rainy", "humidity": 80},
    "San Francisco": {"temp_c": 18, "condition": "Foggy", "humidity": 72},
}


async def _check_weather(city: str) -> str:
    """Return dummy weather data for testing tool calls."""
    data = _DUMMY_WEATHER.get(city)
    if data:
        logger.info("[TOOL TEST] check_weather called for %s -> %s", city, data)
        return json.dumps({"city": city, **data})
    logger.info("[TOOL TEST] check_weather called for unknown city: %s", city)
    return json.dumps({"city": city, "error": f"No weather data for {city}. Try Tokyo, New York, London, or San Francisco."})


class HRInterviewAgent(BaseInterviewAgent):
    """Standalone HR interview agent."""

    def __init__(
        self,
        config: dict,
        chat_ctx=None,
        phase_info: str = "",
    ) -> None:
        super().__init__(
            persona=PERSONAS["hr"],
            config=config,
            chat_ctx=chat_ctx,
            phase_info=phase_info,
        )

    @function_tool()
    async def end_interview(
        self,
        context: RunCtx,
        reason: str = "all_questions_done",
    ) -> str:
        """End the interview session. Call this when all questions are done.
        Announce that the interview is ending before calling this.

        Args:
            reason: Why the interview is ending (e.g. 'all_questions_done',
                    'candidate_requested', 'time_limit'). Defaults to 'all_questions_done'.
        """
        return await _end_interview(context)

    @function_tool()
    async def check_weather(self, context: RunCtx, city: str) -> str:
        """Check current weather for a city. This is a test tool.

        Args:
            city: The city name to check weather for (e.g. 'Tokyo', 'New York').
        """
        return await _check_weather(city)


class BehavioralInterviewAgent(BaseInterviewAgent):
    """Standalone behavioral interview agent."""

    def __init__(
        self,
        config: dict,
        chat_ctx=None,
        phase_info: str = "",
    ) -> None:
        super().__init__(
            persona=PERSONAS["behavioral"],
            config=config,
            chat_ctx=chat_ctx,
            phase_info=phase_info,
        )

    @function_tool()
    async def end_interview(
        self,
        context: RunCtx,
        reason: str = "all_questions_done",
    ) -> str:
        """End the interview session. Call this when all questions are done.
        Announce that the interview is ending before calling this.

        Args:
            reason: Why the interview is ending (e.g. 'all_questions_done',
                    'candidate_requested', 'time_limit'). Defaults to 'all_questions_done'.
        """
        return await _end_interview(context)

    @function_tool()
    async def check_weather(self, context: RunCtx, city: str) -> str:
        """Check current weather for a city. This is a test tool.

        Args:
            city: The city name to check weather for (e.g. 'Tokyo', 'New York').
        """
        return await _check_weather(city)


class TechnicalInterviewAgent(BaseInterviewAgent):
    """Standalone technical interview agent."""

    def __init__(
        self,
        config: dict,
        chat_ctx=None,
        phase_info: str = "",
    ) -> None:
        super().__init__(
            persona=PERSONAS["technical"],
            config=config,
            chat_ctx=chat_ctx,
            phase_info=phase_info,
        )

    @function_tool()
    async def end_interview(
        self,
        context: RunCtx,
        reason: str = "all_questions_done",
    ) -> str:
        """End the interview session. Call this when all questions are done.
        Announce that the interview is ending before calling this.

        Args:
            reason: Why the interview is ending (e.g. 'all_questions_done',
                    'candidate_requested', 'time_limit'). Defaults to 'all_questions_done'.
        """
        return await _end_interview(context)

    @function_tool()
    async def check_weather(self, context: RunCtx, city: str) -> str:
        """Check current weather for a city. This is a test tool.

        Args:
            city: The city name to check weather for (e.g. 'Tokyo', 'New York').
        """
        return await _check_weather(city)
