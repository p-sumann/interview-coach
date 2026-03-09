"""Seniority profiles and adaptive difficulty engine configuration."""

from dataclasses import dataclass

from prompts.loader import load_prompt


@dataclass(frozen=True)
class SeniorityProfile:
    level: str
    yoe_range: str
    initial_theta: float
    question_count: int
    expected_scope: str
    expected_ownership: str
    expected_communication: str
    expected_depth: str
    follow_up_style: str
    interviewer_guidelines: str


def _build_seniority_profiles() -> dict[str, SeniorityProfile]:
    """Build seniority profiles from YAML config + hardcoded non-prompt fields."""
    prompt_data = load_prompt("seniority")["levels"]

    configs: dict[str, dict] = {
        "junior": {"yoe_range": "0-2 years", "initial_theta": 1.5, "question_count": 8},
        "mid": {"yoe_range": "2-5 years", "initial_theta": 2.5, "question_count": 7},
        "senior": {"yoe_range": "5-10 years", "initial_theta": 3.5, "question_count": 6},
        "staff": {"yoe_range": "10+ years", "initial_theta": 4.5, "question_count": 5},
    }

    profiles: dict[str, SeniorityProfile] = {}
    for level, cfg in configs.items():
        prompts = prompt_data[level]
        profiles[level] = SeniorityProfile(
            level=level,
            yoe_range=cfg["yoe_range"],
            initial_theta=cfg["initial_theta"],
            question_count=cfg["question_count"],
            expected_scope=prompts["expected_scope"],
            expected_ownership=prompts["expected_ownership"],
            expected_communication=prompts["expected_communication"],
            expected_depth=prompts["expected_depth"],
            follow_up_style=prompts["follow_up_style"],
            interviewer_guidelines=prompts["interviewer_guidelines"],
        )

    return profiles


SENIORITY_PROFILES: dict[str, SeniorityProfile] = _build_seniority_profiles()


THETA_STEP = 0.5
THETA_MIN = 1.0
THETA_MAX = 5.0


def update_theta(current_theta: float, composite_score: float) -> float:
    """Update difficulty estimate based on response quality."""
    if composite_score > current_theta + THETA_STEP:
        new_theta = current_theta + THETA_STEP
    elif composite_score < current_theta - THETA_STEP:
        new_theta = current_theta - THETA_STEP
    else:
        new_theta = current_theta
    return max(THETA_MIN, min(THETA_MAX, new_theta))
