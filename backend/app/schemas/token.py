import uuid

from pydantic import Field

from app.schemas.common import CamelModel


class TokenRequest(CamelModel):
    room_name: str = Field(min_length=1, max_length=200)
    participant_name: str = Field(min_length=1, max_length=200)
    session_id: uuid.UUID | None = None


class TokenResponse(CamelModel):
    token: str
    url: str
