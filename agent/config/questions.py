"""Dynamic question bank loader — reads JSON files from question_banks/."""

import json
import logging
import random
from pathlib import Path
from typing import Any

logger = logging.getLogger("interview-agent.questions")

_QUESTION_BANKS_DIR = Path(__file__).parent.parent / "question_banks"

# Cache loaded banks in memory (loaded once per process)
_cache: dict[str, dict[str, Any]] = {}


def _load_bank(filename: str) -> dict[str, Any]:
    """Load a single question bank JSON file, with caching."""
    if filename in _cache:
        return _cache[filename]

    path = _QUESTION_BANKS_DIR / filename
    if not path.exists():
        logger.warning("Question bank not found: %s", path)
        return {}

    with open(path) as f:
        data = json.load(f)

    _cache[filename] = data
    return data


def get_technical_questions(
    language: str,
    seniority: str,
    count: int = 5,
    role_type: str = "",
) -> list[dict[str, Any]]:
    """Get technical questions for a specific language and seniority level.

    For ML/AI roles, loads the dedicated ml_ai question bank instead of the
    generic language bank so candidates get ML-specific technical questions.

    Returns a random sample of `count` questions with their follow_ups and evaluation criteria.
    """
    # Route ML/AI roles to the dedicated ML question bank
    ml_role_types = {"ml_ai", "ml", "ai", "data_science", "machine_learning"}
    if role_type.lower().replace(" ", "_") in ml_role_types:
        bank = _load_bank("ml_ai.json")
        if bank:
            levels = bank.get("levels", {})
            level_data = levels.get(seniority, levels.get("mid", {}))
            questions = level_data.get("questions", [])
            if questions:
                return random.sample(questions, min(count, len(questions)))

    bank = _load_bank(f"{language.lower()}.json")
    if not bank:
        return []

    levels = bank.get("levels", {})
    level_data = levels.get(seniority, levels.get("mid", {}))
    questions = level_data.get("questions", [])

    if not questions:
        return []

    return random.sample(questions, min(count, len(questions)))


def get_behavioral_questions(seniority: str, count: int = 4) -> list[dict[str, Any]]:
    """Get behavioral interview questions for a seniority level."""
    bank = _load_bank("behavioral.json")
    if not bank:
        return []

    levels = bank.get("levels", {})
    level_data = levels.get(seniority, levels.get("mid", {}))
    questions = level_data.get("questions", [])

    if not questions:
        return []

    return random.sample(questions, min(count, len(questions)))


def get_hr_questions(seniority: str, count: int = 4) -> list[dict[str, Any]]:
    """Get HR interview questions for a seniority level."""
    bank = _load_bank("hr.json")
    if not bank:
        return []

    levels = bank.get("levels", {})
    level_data = levels.get(seniority, levels.get("mid", {}))
    questions = level_data.get("questions", [])

    if not questions:
        return []

    return random.sample(questions, min(count, len(questions)))


def get_system_design_questions(role_type: str, seniority: str, count: int = 3) -> list[dict[str, Any]]:
    """Get system design questions for a role type and seniority level."""
    bank = _load_bank("system_design.json")
    if not bank:
        return []

    roles = bank.get("roles", {})
    role_data = roles.get(role_type, roles.get("backend", {}))
    levels = role_data.get("levels", {})
    level_data = levels.get(seniority, levels.get("mid", {}))
    questions = level_data.get("questions", [])

    if not questions:
        return []

    return random.sample(questions, min(count, len(questions)))


def format_questions_for_prompt(
    questions: list[dict[str, Any]],
    max_follow_ups: int = 2,
    role_context: str = "",
) -> str:
    """Format questions into a voice-friendly prompt section.

    Only includes the question text, follow-ups, and category — NOT the expected
    answers (so the agent evaluates naturally, not by comparing to a rubric).
    """
    if not questions:
        ctx = f" for {role_context}" if role_context else ""
        return f"Use your expertise to generate appropriate questions{ctx} at this level."

    lines: list[str] = []
    for i, q in enumerate(questions, 1):
        lines.append(f"Question {i}: {q['question']}")
        if q.get("category"):
            lines.append(f"  Category: {q['category']}")
        if q.get("follow_ups") and max_follow_ups > 0:
            follow_ups = ", ".join(q["follow_ups"][:max_follow_ups])
            lines.append(f"  Follow-up ideas: {follow_ups}")
        lines.append("")

    return "\n".join(lines)
