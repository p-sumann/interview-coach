"""Workaround for Gemini Live API tool call race condition.

When Gemini sends a tool_call, the session rejects all sendRealtimeInput calls
(audio, activityStart, activityEnd). If the client continues streaming mic audio
while the tool call is pending, the server responds with 1008/1011 and closes
the WebSocket.

This module monkey-patches the LiveKit Google Realtime session to gate all
realtime input between receiving a tool_call and sending the tool response.

See: https://discuss.ai.google.dev/t/114644/56
"""

import logging
from typing import Any

from google.genai import types  # type: ignore[attr-defined]

logger = logging.getLogger("interview-agent.gemini-fix")


def patch_realtime_session(rt_session: Any) -> None:
    """Patch a LiveKit Google RealtimeSession to gate audio during tool calls.

    Must be called after the session is created but before audio starts flowing.
    """
    rt_session._tool_call_pending = False

    # Store original methods
    original_send_client_event = rt_session._send_client_event
    original_handle_tool_calls = rt_session._handle_tool_calls

    def _patched_send_client_event(event: Any) -> None:
        """Drop realtime input (audio/activity) while a tool call is pending."""
        if rt_session._tool_call_pending and isinstance(event, types.LiveClientRealtimeInput):
            return  # Skip — Gemini rejects input during tool calls
        # Ungate when tool response is sent
        if rt_session._tool_call_pending and isinstance(event, types.LiveClientToolResponse):
            rt_session._tool_call_pending = False
            logger.debug("Tool response sent, resuming audio input")
        original_send_client_event(event)

    def _patched_handle_tool_calls(tool_call: Any) -> None:
        """Set the gate flag before forwarding tool calls."""
        rt_session._tool_call_pending = True
        logger.debug("Tool call received, gating audio input")
        original_handle_tool_calls(tool_call)

    rt_session._send_client_event = _patched_send_client_event
    rt_session._handle_tool_calls = _patched_handle_tool_calls
    logger.info("Gemini tool call audio gating patch applied")
