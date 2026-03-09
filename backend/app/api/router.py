from fastapi import APIRouter

from app.api.v1.coaching import router as coaching_router
from app.api.v1.feedback import router as feedback_router
from app.api.v1.health import router as health_router
from app.api.v1.scorecards import router as scorecards_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.token import router as token_router
from app.api.v1.analyze import router as analyze_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(sessions_router)
api_router.include_router(scorecards_router)
api_router.include_router(feedback_router)
api_router.include_router(coaching_router)
api_router.include_router(token_router)
api_router.include_router(analyze_router)
