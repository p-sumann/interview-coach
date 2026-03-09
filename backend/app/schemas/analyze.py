from app.schemas.common import CamelModel


class AnalyzeRequest(CamelModel):
    """Request to analyze a chunk of user speech in real-time."""

    user_text: str
    agent_question: str = ""


class AnalyzeResponse(CamelModel):
    """Real-time speech analysis result."""

    filler_words: list[str]
    filler_count: int
    repeated_words: list[str]
    relevance_note: str
    coaching_tip: str
