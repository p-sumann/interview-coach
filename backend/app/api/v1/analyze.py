import uuid

from fastapi import APIRouter

from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services.analyze_service import AnalyzeService

router = APIRouter(prefix="/sessions/{session_id}/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze_speech(
    session_id: uuid.UUID,
    data: AnalyzeRequest,
) -> AnalyzeResponse:
    service = AnalyzeService()
    return await service.analyze_speech(data)
