from livekit.api import AccessToken, RoomAgentDispatch, RoomConfiguration, VideoGrants

from app.config import get_settings


class TokenService:
    def __init__(self) -> None:
        self._settings = get_settings()

    async def generate_token(
        self,
        room_name: str,
        participant_name: str,
        agent_name: str = "interview-agent",
        room_metadata: str | None = None,
    ) -> tuple[str, str]:
        # Pass metadata via BOTH RoomAgentDispatch.metadata (becomes ctx.job.metadata
        # in the agent — most reliable) AND RoomConfiguration.metadata (becomes
        # ctx.room.metadata — may not propagate in all LiveKit SDK versions).
        room_config = RoomConfiguration(
            agents=[
                RoomAgentDispatch(
                    agent_name=agent_name,
                    metadata=room_metadata or "",
                ),
            ],
        )
        if room_metadata:
            room_config.metadata = room_metadata

        token = (
            AccessToken(
                api_key=self._settings.LIVEKIT_API_KEY,
                api_secret=self._settings.LIVEKIT_API_SECRET,
            )
            .with_identity(participant_name)
            .with_name(participant_name)
            .with_grants(
                VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                    can_publish_data=True,
                )
            )
            .with_room_config(room_config)
        )

        return token.to_jwt(), self._settings.LIVEKIT_URL
