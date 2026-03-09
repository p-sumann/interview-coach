"""Interviewer persona definitions for all 4 interview modes."""

from dataclasses import dataclass

from prompts.loader import load_prompt


@dataclass(frozen=True)
class InterviewerPersona:
    name: str
    role: str
    voice: str
    style: str
    question_count: int
    focus_areas: tuple[str, ...]
    evaluation_criteria: tuple[str, ...]


def _build_personas() -> dict[str, InterviewerPersona]:
    """Build persona instances from YAML config + hardcoded non-prompt fields."""
    prompt_data = load_prompt("personas")["personas"]

    return {
        "hr": InterviewerPersona(
            name="Marcus Johnson",
            role="Director of People",
            voice="Charon",
            style=prompt_data["hr"]["style"],
            question_count=6,
            focus_areas=tuple(prompt_data["hr"]["focus_areas"]),
            evaluation_criteria=tuple(prompt_data["hr"]["evaluation_criteria"]),
        ),
        "behavioral": InterviewerPersona(
            name="Sarah Chen",
            role="Senior Engineering Manager",
            voice="Kore",
            style=prompt_data["behavioral"]["style"],
            question_count=6,
            focus_areas=tuple(prompt_data["behavioral"]["focus_areas"]),
            evaluation_criteria=tuple(prompt_data["behavioral"]["evaluation_criteria"]),
        ),
        "technical": InterviewerPersona(
            name="Alex Rivera",
            role="Staff Software Engineer",
            voice="Puck",
            style=prompt_data["technical"]["style"],
            question_count=5,
            focus_areas=tuple(prompt_data["technical"]["focus_areas"]),
            evaluation_criteria=tuple(prompt_data["technical"]["evaluation_criteria"]),
        ),
    }


PERSONAS: dict[str, InterviewerPersona] = _build_personas()


INTERVIEW_TYPE_CONFIGS: dict[str, dict] = {
    "hr": {
        "display_name": "HR Interview",
        "default_duration": 5,
        "phases": 1,
        "persona": "hr",
    },
    "behavioral": {
        "display_name": "Behavioral Interview",
        "default_duration": 10,
        "phases": 1,
        "persona": "behavioral",
    },
    "technical": {
        "display_name": "Technical Interview",
        "default_duration": 15,
        "phases": 1,
        "persona": "technical",
    },
}
