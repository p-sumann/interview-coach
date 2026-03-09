from __future__ import annotations

import logging
import sys
from contextvars import ContextVar
from typing import TYPE_CHECKING

from loguru import logger

if TYPE_CHECKING:
    from loguru import Record

from app.config import get_settings

# Context var for request-scoped data (request_id, etc.)
request_context: ContextVar[dict[str, str]] = ContextVar("request_context", default={})


def _context_patcher(record: Record) -> None:
    """Inject request context (request_id, etc.) into every log record."""
    ctx = request_context.get()
    record["extra"].update(ctx)


def _dev_format(record: Record) -> str:
    """Rich, readable format for development."""
    ctx = request_context.get()
    req_id = ctx.get("request_id", "")
    req_id_part = f" <dim>│</dim> <cyan>{req_id[:8]}</cyan>" if req_id else ""

    # Extra fields (excluding internal ones)
    extras = {k: v for k, v in record["extra"].items() if k not in ("request_id",)}
    extras_part = ""
    if extras:
        pairs = " ".join(f"<dim>{k}=</dim><yellow>{v}</yellow>" for k, v in extras.items())
        extras_part = f" <dim>│</dim> {pairs}"

    return (
        "<green>{time:HH:mm:ss.SSS}</green>"
        " <level>{level: <8}</level>"
        " <dim>│</dim> <bold>{message}</bold>"
        f"{req_id_part}"
        f"{extras_part}"
        "\n{exception}"
    )


def _json_sink(message: object) -> None:
    """Structured JSON sink for production. Writes directly to stderr to avoid
    loguru re-parsing braces in the JSON output."""
    import json
    from datetime import UTC, datetime

    record: Record = message.record  # type: ignore[union-attr]
    ctx = request_context.get()
    payload = {
        "timestamp": datetime.now(UTC).isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        **ctx,
        **{k: v for k, v in record["extra"].items() if k not in ("request_id",)},
    }
    if record["exception"]:
        payload["exception"] = str(record["exception"])
    sys.stderr.write(json.dumps(payload) + "\n")


class _InterceptHandler(logging.Handler):
    """Route stdlib logging (uvicorn, sqlalchemy, etc.) into loguru."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging() -> None:
    """Configure loguru as the single logging backend."""
    settings = get_settings()
    level = settings.LOG_LEVEL.upper()
    is_dev = settings.ENVIRONMENT != "production"

    # Remove default loguru handler
    logger.remove()

    # Add our handler with the right format
    if is_dev:
        logger.add(
            sys.stderr,
            format=_dev_format,
            level=level,
            colorize=True,
            backtrace=True,
            diagnose=True,
        )
    else:
        logger.add(
            _json_sink,
            level=level,
            colorize=False,
            backtrace=False,
            diagnose=False,
        )

    # Patch all records with request context
    logger.configure(patcher=_context_patcher)

    # Intercept stdlib logging (uvicorn, sqlalchemy, alembic, etc.)
    logging.basicConfig(handlers=[_InterceptHandler()], level=0, force=True)

    # Intercept uvicorn/sqlalchemy into loguru
    for name in ("uvicorn", "uvicorn.error", "sqlalchemy.engine"):
        logging.getLogger(name).handlers = [_InterceptHandler()]
        logging.getLogger(name).propagate = False

    # Disable uvicorn's access log — our AccessLogMiddleware handles it with request IDs
    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.access").propagate = False
