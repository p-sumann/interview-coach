"""Post-interview scorecard generation using Gemini 3 Flash."""

import asyncio
import json
import logging
import os

from google import genai  # type: ignore[attr-defined]

from prompts.loader import load_prompt

logger = logging.getLogger("interview-agent.scorecard")

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
SCORECARD_MODEL = "gemini-3-flash-preview"


def _format_transcript(transcript: list[dict]) -> str:
    """Format transcript list into readable text for the prompt."""
    if not transcript:
        return "(no transcript captured)"

    lines = []
    for entry in transcript:
        role = entry.get("role", "unknown").upper()
        text = entry.get("text", "")
        ts = entry.get("timestamp", 0)
        lines.append(f"[{ts}s] {role}: {text}")
    return "\n".join(lines)


async def generate_scorecard(
    config: dict,
    observations: list[dict],
    feedback_history: list[dict],
    theta_path: list[float],
    duration_seconds: int,
    questions_count: int,
    phases_completed: int,
    transcript: list[dict] | None = None,
) -> dict:
    """Generate a scorecard using Gemini text model."""
    prompt_data = load_prompt("scorecard")
    system_prompt: str = prompt_data["instructions"]
    user_template: str = prompt_data["user_prompt"]

    client = genai.Client(api_key=GOOGLE_API_KEY)

    # If no questions were tracked via tool calls, count from transcript
    effective_questions = questions_count
    if effective_questions == 0 and transcript:
        effective_questions = sum(1 for t in transcript if t.get("role") == "assistant")

    user_prompt = user_template.format(
        candidate_name=config.get("candidate_name", "Candidate"),
        target_role=config.get("target_role", "Software Engineer"),
        company=config.get("company", ""),
        experience_level=config.get("experience_level", "mid"),
        role_type=config.get("role_type", "backend"),
        primary_language=config.get("primary_language", "python"),
        interview_type=config.get("interview_type", "behavioral"),
        duration_seconds=duration_seconds,
        theta_path=json.dumps(theta_path) if theta_path else "[initial]",
        observations_count=len(observations),
        observations=json.dumps(observations, indent=2) if observations else "(none — evaluate from transcript)",
        feedback_count=len(feedback_history),
        feedback_history=json.dumps(feedback_history, indent=2)
        if feedback_history
        else "(none — evaluate from transcript)",
        questions_count=effective_questions,
        phases_completed=max(phases_completed, 1),
        transcript=_format_transcript(transcript or []),
    )

    max_retries = 2
    last_exc: Exception | None = None

    for attempt in range(max_retries + 1):
        try:
            response = await client.aio.models.generate_content(
                model=SCORECARD_MODEL,
                contents=user_prompt,
                config=genai.types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.3,
                ),
            )

            text = response.text.strip()
            # Strip markdown code fences if present
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                if text.endswith("```"):
                    text = text[: text.rfind("```")]
                text = text.strip()

            scorecard_data = json.loads(text)
            scorecard_data["durationSeconds"] = duration_seconds
            return scorecard_data

        except Exception as e:
            last_exc = e
            if attempt < max_retries:
                logger.warning("Scorecard generation attempt %d failed: %s. Retrying...", attempt + 1, e)
                await asyncio.sleep(1.0 * (attempt + 1))
            else:
                logger.exception("Failed to generate scorecard after %d attempts", max_retries + 1)

    logger.error("Scorecard generation failed permanently: %s", last_exc)
    raise RuntimeError(f"Scorecard generation failed after {max_retries + 1} attempts: {last_exc}") from last_exc
