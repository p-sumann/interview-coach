"""Logging configuration — JSON structured in production, human-readable in dev."""

import json
import logging
import os


class _JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data: dict = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        session_id = getattr(record, "session_id", None)
        if session_id is not None:
            log_data["session_id"] = session_id
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)


def configure_logging() -> None:
    """Set up the interview-agent logger with environment-appropriate formatting."""
    is_prod = os.environ.get("ENVIRONMENT", "development") == "production"
    handler = logging.StreamHandler()
    if is_prod:
        handler.setFormatter(_JSONFormatter())
    else:
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s"))
    root = logging.getLogger("interview-agent")
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    root.propagate = False
