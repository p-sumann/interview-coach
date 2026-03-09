"""Real-time speech analysis using Gemini Flash for lightweight LLM feedback."""

import json
import logging

from google import genai  # type: ignore[attr-defined]

from app.config import get_settings
from app.prompts.loader import load_prompt
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse

logger = logging.getLogger("interviewpilot.analyze")

ANALYZE_MODEL = "gemini-3.1-flash-lite-preview"
SYSTEM_PROMPT = load_prompt("analyze")["system_prompt"]


class AnalyzeService:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    async def analyze_speech(self, data: AnalyzeRequest) -> AnalyzeResponse:
        user_prompt = f"Question: {data.agent_question}\n\nCandidate's speech:\n{data.user_text}"

        try:
            response = await self._client.aio.models.generate_content(
                model=ANALYZE_MODEL,
                contents=user_prompt,
                config=genai.types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.1,
                ),
            )

            text = response.text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                if text.endswith("```"):
                    text = text[: text.rfind("```")]
                text = text.strip()

            result = json.loads(text)

            return AnalyzeResponse(
                filler_words=result.get("fillerWords", []),
                filler_count=result.get("fillerCount", 0),
                repeated_words=result.get("repeatedWords", []),
                relevance_note=result.get("relevanceNote", ""),
                coaching_tip=result.get("coachingTip", ""),
            )

        except Exception as e:
            logger.warning("Speech analysis failed: %s", e)
            return AnalyzeResponse(
                filler_words=[],
                filler_count=0,
                repeated_words=[],
                relevance_note="",
                coaching_tip="",
            )
