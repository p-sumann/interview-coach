"""HTTP client for communicating with the FastAPI backend."""

import asyncio
import logging
import os

import httpx

logger = logging.getLogger("interview-agent.api")

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
API_PREFIX = "/api/v1"

MAX_RETRIES = 2
RETRY_BACKOFF_BASE = 0.3  # seconds


class BackendAPIClient:
    """Async HTTP client for the InterviewPilot FastAPI backend."""

    def __init__(self, base_url: str | None = None) -> None:
        self._base_url = (base_url or BACKEND_URL) + API_PREFIX
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=httpx.Timeout(5.0, connect=3.0),
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
        )

    async def close(self) -> None:
        try:
            await self._client.aclose()
        except Exception as e:
            logger.warning("Error closing HTTP client: %s", e)

    async def _retry_request(self, method: str, url: str, **kwargs) -> httpx.Response:
        """Execute an HTTP request with exponential backoff retry."""
        last_exc: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                resp = await self._client.request(method, url, **kwargs)
                resp.raise_for_status()
                return resp
            except (httpx.ConnectError, httpx.TimeoutException) as e:
                last_exc = e
            except httpx.HTTPStatusError as e:
                if e.response.status_code < 500:
                    raise  # Don't retry 4xx errors
                last_exc = e
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF_BASE * (2**attempt)
                logger.warning(
                    "Request %s %s failed (attempt %d/%d): %s. Retrying in %.1fs",
                    method,
                    url,
                    attempt + 1,
                    MAX_RETRIES,
                    last_exc,
                    wait,
                )
                await asyncio.sleep(wait)
        logger.error("Request %s %s failed after %d attempts: %s", method, url, MAX_RETRIES, last_exc)
        raise last_exc  # type: ignore[misc]

    # -- Session endpoints --

    async def create_session(self, config: dict) -> dict:
        """Create a new session via POST /sessions.

        The backend expects camelCase fields (CamelModel with alias_generator).
        """
        payload = {
            "candidateName": config.get("candidate_name", "Candidate"),
            "targetRole": config.get("target_role", "Software Engineer"),
            "company": config.get("company", ""),
            "experienceLevel": config.get("experience_level", "mid"),
            "roleType": config.get("role_type", "backend"),
            "primaryLanguage": config.get("primary_language", "python"),
            "techStack": config.get("tech_stack", []),
            "interviewType": config.get("interview_type", "behavioral"),
        }
        resp = await self._retry_request("POST", "/sessions", json=payload)
        return resp.json()

    async def update_session_status(self, session_id: str, action: str) -> dict:
        """Start or end a session via POST /sessions/{id}/start or /end."""
        resp = await self._retry_request("POST", f"/sessions/{session_id}/{action}")
        return resp.json()

    async def get_session(self, session_id: str) -> dict:
        resp = await self._retry_request("GET", f"/sessions/{session_id}")
        return resp.json()

    async def get_session_by_room(self, room_name: str) -> dict:
        """Look up session config by LiveKit room name."""
        resp = await self._retry_request("GET", f"/sessions/by-room/{room_name}")
        return resp.json()

    # -- Feedback endpoints --

    async def post_feedback(self, session_id: str, data: dict) -> None:
        """Submit a real-time feedback snapshot."""
        try:
            await self._retry_request("POST", f"/sessions/{session_id}/feedback", json=data)
        except (httpx.HTTPError, httpx.TimeoutException) as e:
            logger.warning("Failed to post feedback after retries: %s", e)

    async def post_coaching_note(self, session_id: str, data: dict) -> None:
        """Submit a coaching observation note."""
        try:
            await self._retry_request("POST", f"/sessions/{session_id}/coaching-notes", json=data)
        except (httpx.HTTPError, httpx.TimeoutException) as e:
            logger.warning("Failed to post coaching note after retries: %s", e)

    # -- Scorecard endpoints --

    async def post_scorecard(self, session_id: str, data: dict) -> dict:
        """Submit the generated scorecard."""
        resp = await self._retry_request("POST", f"/sessions/{session_id}/scorecard", json=data)
        return resp.json()
