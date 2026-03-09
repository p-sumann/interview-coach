import asyncio
import subprocess
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.router import api_router
from app.config import Settings, get_settings
from app.core.exceptions import (
    InvalidStateTransitionError,
    ScorecardNotFoundError,
    ScorecardNotReadyError,
    SessionNotFoundError,
)
from app.core.logging import setup_logging
from app.db.engine import close_engine, get_engine
from app.middleware.access_log import AccessLogMiddleware
from app.middleware.rate_limit import limiter
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.redis.client import close_redis, get_redis
from app.seed import seed_if_empty


def _print_banner(settings: Settings) -> None:
    """Print a branded startup banner like CLI tools do."""
    s = settings
    is_prod = s.ENVIRONMENT == "production"
    env_color = "red" if is_prod else "green"
    banner = f"""
<bold><blue>
  ╭──────────────────────────────────────────────╮
  │                                              │
  │   InterviewPilot API                         │
  │   v{s.APP_VERSION:<41s} │
  │                                              │
  ╰──────────────────────────────────────────────╯
</blue></bold>
  <dim>Environment</dim> → <{env_color}>{s.ENVIRONMENT}</{env_color}>
  <dim>Log Level</dim>   → {s.LOG_LEVEL}
  <dim>Docs</dim>        → {"http://localhost:{8000}/docs"}
  <dim>Database</dim>    → <dim>{"connected" if True else "pending"}</dim>
  <dim>Redis</dim>       → <dim>{"connected" if True else "pending"}</dim>
"""
    logger.opt(raw=True, colors=True).info(banner + "\n")


async def run_migrations() -> None:
    settings = get_settings()
    if not settings.RUN_MIGRATIONS:
        logger.info("Migrations skipped (RUN_MIGRATIONS=false)")
        return
    logger.info("Running database migrations...")
    result = await asyncio.to_thread(
        subprocess.run,
        ["alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("Migration failed: {}", result.stderr)
        raise RuntimeError(f"Alembic migration failed: {result.stderr}")
    logger.success("Migrations complete")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    settings = get_settings()
    setup_logging()
    _print_banner(settings)
    get_engine()
    get_redis()
    await run_migrations()
    if settings.ENVIRONMENT != "production":
        await seed_if_empty()
    logger.success("Ready to accept connections")
    yield
    logger.info("Shutting down...")
    await close_engine()
    await close_redis()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    settings = get_settings()
    is_production = settings.ENVIRONMENT == "production"

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json",
    )

    # Middleware registration order: Starlette LIFO — last added = outermost
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )
    app.add_middleware(SecurityHeadersMiddleware)
    if is_production:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.TRUSTED_HOSTS)
    app.add_middleware(AccessLogMiddleware)
    app.add_middleware(RequestIDMiddleware)

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    @app.exception_handler(SessionNotFoundError)
    async def session_not_found_handler(request: Request, exc: SessionNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(InvalidStateTransitionError)
    async def invalid_transition_handler(request: Request, exc: InvalidStateTransitionError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"detail": str(exc)})

    @app.exception_handler(ScorecardNotFoundError)
    async def scorecard_not_found_handler(request: Request, exc: ScorecardNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(ScorecardNotReadyError)
    async def scorecard_not_ready_handler(request: Request, exc: ScorecardNotReadyError) -> JSONResponse:
        return JSONResponse(status_code=202, content={"detail": str(exc), "status": "generating"})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.opt(exception=exc).error("Unhandled exception on {}", request.url.path)
        detail = str(exc) if settings.DEBUG else "Internal server error"
        return JSONResponse(status_code=500, content={"detail": detail})

    app.include_router(api_router)

    return app


app = create_app()
