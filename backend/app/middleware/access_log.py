import time

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

SKIP_PATHS = {"/api/v1/health", "/api/v1/ready"}


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.url.path in SKIP_PATHS or request.method == "OPTIONS":
            return await call_next(request)

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        status = response.status_code
        client = request.client.host if request.client else "-"
        method = request.method
        path = request.url.path

        logger.info(f"{method} {path} {status} {duration_ms}ms {client}")
        return response
