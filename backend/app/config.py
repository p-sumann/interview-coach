from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "InterviewPilot API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+asyncpg://interviewpilot:interviewpilot_dev@localhost:5432/interviewpilot"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20
    DATABASE_POOL_PRE_PING: bool = True
    DATABASE_CONNECT_TIMEOUT: int = 10
    DATABASE_STATEMENT_TIMEOUT_MS: int = 30000

    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_SOCKET_TIMEOUT: float = 5.0
    REDIS_SOCKET_CONNECT_TIMEOUT: float = 5.0
    REDIS_RETRY_ON_TIMEOUT: bool = True
    REDIS_HEALTH_CHECK_INTERVAL: int = 30

    LIVEKIT_URL: str = ""
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""

    GOOGLE_API_KEY: str = ""

    RUN_MIGRATIONS: bool = True

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    CORS_ALLOW_METHODS: list[str] = ["GET", "POST", "OPTIONS"]
    CORS_ALLOW_HEADERS: list[str] = ["Content-Type", "Authorization", "X-Request-ID"]

    TRUSTED_HOSTS: list[str] = ["*"]

    RATE_LIMIT_DEFAULT: str = "1000/minute"
    RATE_LIMIT_TOKEN: str = "1000/minute"
    RATE_LIMIT_SESSION_CREATE: str = "1000/minute"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
