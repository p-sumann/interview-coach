"""Standalone interview agents (single mode): HR, Behavioral, Technical."""

from livekit.agents.llm import function_tool

from agents.base import BaseInterviewAgent, RunCtx, handle_end_interview
from config.personas import PERSONAS


async def _end_interview(context: RunCtx) -> str:
    """Common method for ending standalone interviews. Announce ending first."""
    context.disallow_interruptions()
    return await handle_end_interview(context, phases_completed=1)


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
    async def end_interview(self, context: RunCtx) -> str:
        """End the interview. Call this when all questions are done.
        Announce that the interview is ending before calling this."""
        return await _end_interview(context)


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
    async def end_interview(self, context: RunCtx) -> str:
        """End the interview. Call this when all questions are done.
        Announce that the interview is ending before calling this."""
        return await _end_interview(context)


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
    async def end_interview(self, context: RunCtx) -> str:
        """End the interview. Call this when all questions are done.
        Announce that the interview is ending before calling this."""
        return await _end_interview(context)
