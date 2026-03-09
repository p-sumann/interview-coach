"""System prompt builder — assembles interview prompts from YAML templates and question banks."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from config.personas import InterviewerPersona

from config.questions import (
    format_questions_for_prompt,
    get_behavioral_questions,
    get_hr_questions,
    get_system_design_questions,
    get_technical_questions,
)
from config.seniority import SENIORITY_PROFILES, SeniorityProfile
from prompts.loader import load_prompt


def _get_seniority_profile(level: str) -> SeniorityProfile:
    return SENIORITY_PROFILES.get(level, SENIORITY_PROFILES["mid"])


def _build_role_focus(role_type: str) -> str:
    """Get role-specific focus areas from YAML config."""
    prompt_data = load_prompt("interview")
    focuses: dict[str, str] = prompt_data["role_focuses"]
    return focuses.get(role_type, focuses["backend"])


def _detect_role_mismatch(target_role: str, role_type: str) -> str:
    """Return bridging context when target_role and role_type diverge, or empty string."""
    prompt_data = load_prompt("interview")
    target_role_map: dict[str, str] = prompt_data["target_role_to_role_type"]
    role_labels: dict[str, str] = prompt_data["role_labels"]

    expected = target_role_map.get(target_role.lower(), "")
    if not expected or expected == role_type:
        return ""

    bg_label = role_labels.get(role_type, role_type)
    target_label = role_labels.get(expected, target_role)

    return (
        f"The candidate has a {bg_label} background but is targeting a {target_role} role "
        f"(typically {target_label}). Frame your questions around {target_role} responsibilities "
        f"and expectations, while acknowledging their {bg_label} experience as a transferable "
        f"strength. Probe how they'd apply their existing skills to the new domain."
    )


# Seniority-aware question counts to keep prompts lean for simpler interviews.
_QUESTION_COUNTS: dict[str, dict[str, int]] = {
    "junior": {"hr": 3, "behavioral": 3, "tech": 2, "design": 1},
    "mid":    {"hr": 4, "behavioral": 4, "tech": 3, "design": 2},
    "senior": {"hr": 5, "behavioral": 4, "tech": 3, "design": 2},
    "staff":  {"hr": 5, "behavioral": 4, "tech": 3, "design": 3},
}

# Domain-specialist roles where the system_design question bank contains the
# role-specific questions (ML pipelines, data warehousing, etc.).  For these
# roles we load more domain questions and fewer generic language questions so
# the interviewer asks relevant questions rather than "explain decorators".
_DOMAIN_SPECIALIST_ROLES = {"data", "ai_ml"}
_DOMAIN_SPECIALIST_COUNTS: dict[str, dict[str, int]] = {
    "junior": {"tech": 1, "design": 2},
    "mid":    {"tech": 1, "design": 3},
    "senior": {"tech": 1, "design": 3},
    "staff":  {"tech": 1, "design": 3},
}


def _load_questions_section(interview_type: str, config: dict) -> str:
    """Load questions from the question banks based on interview type and config."""
    seniority = config.get("experience_level", "mid")
    primary_language = config.get("primary_language", "python")
    role_type = config.get("role_type", "backend")
    counts = _QUESTION_COUNTS.get(seniority, _QUESTION_COUNTS["mid"])
    max_follow_ups = 1 if seniority == "junior" else 2

    if interview_type == "hr":
        questions = get_hr_questions(seniority, count=counts["hr"])
        return format_questions_for_prompt(questions, max_follow_ups=max_follow_ups)

    if interview_type == "behavioral":
        questions = get_behavioral_questions(seniority, count=counts["behavioral"])
        return format_questions_for_prompt(questions, max_follow_ups=max_follow_ups)

    if interview_type == "technical":
        # Domain-specialist roles get more domain questions, fewer generic language ones
        if role_type in _DOMAIN_SPECIALIST_ROLES:
            dc = _DOMAIN_SPECIALIST_COUNTS.get(seniority, _DOMAIN_SPECIALIST_COUNTS["mid"])
            tech_qs = get_technical_questions(primary_language, seniority, count=dc["tech"], role_type=role_type)
            design_qs = get_system_design_questions(role_type, seniority, count=dc["design"])
        else:
            tech_qs = get_technical_questions(primary_language, seniority, count=counts["tech"], role_type=role_type)
            design_qs = get_system_design_questions(role_type, seniority, count=counts["design"])
        return format_questions_for_prompt(tech_qs + design_qs, max_follow_ups=max_follow_ups)

    return ""


def build_system_prompt(
    config: dict,
    persona: InterviewerPersona,
    phase_info: str = "",
) -> str:
    """Build the complete adaptive system prompt for an interviewer agent."""
    prompt_data = load_prompt("interview")
    template: str = prompt_data["instructions"]

    seniority = config.get("experience_level", "mid")
    profile = _get_seniority_profile(seniority)
    role_type = config.get("role_type", "backend")
    primary_language = config.get("primary_language", "python")
    tech_stack = config.get("tech_stack", [])
    candidate_name = config.get("candidate_name", "Candidate")
    target_role = config.get("target_role", "Software Engineer")
    company = config.get("company", "")
    interview_type = config.get("interview_type", "behavioral")

    company_context = f" at {company}" if company else ""
    tech_stack_str = ", ".join(tech_stack) if tech_stack else "not specified"
    role_focus = _build_role_focus(role_type)
    role_mismatch = _detect_role_mismatch(target_role, role_type)

    # Build optional sections
    phase_section = ""
    if phase_info:
        phase_section = f"\n=== PHASE INFO ===\n{phase_info}\n"

    role_alignment_section = ""
    if role_mismatch:
        role_alignment_section = f"\n=== ROLE ALIGNMENT ===\n{role_mismatch}\n"

    questions_section = _load_questions_section(interview_type, config)
    questions_block = ""
    if questions_section:
        preamble = prompt_data["question_bank_preamble"]
        questions_block = f"\n=== QUESTION BANK ===\n{preamble}\n{questions_section}"

    return template.format(
        persona_name=persona.name,
        persona_role=persona.role,
        persona_style=persona.style,
        interview_type=interview_type,
        target_role=target_role,
        company_context=company_context,
        candidate_name=candidate_name,
        seniority=seniority,
        yoe_range=profile.yoe_range,
        role_type=role_type,
        primary_language=primary_language,
        tech_stack_str=tech_stack_str,
        role_focus=role_focus,
        phase_section=phase_section,
        role_alignment_section=role_alignment_section,
        questions_block=questions_block,
        interviewer_guidelines=profile.interviewer_guidelines,
        expected_scope=profile.expected_scope,
        expected_ownership=profile.expected_ownership,
        expected_communication=profile.expected_communication,
        expected_depth=profile.expected_depth,
        initial_theta=profile.initial_theta,
        follow_up_style=profile.follow_up_style,
        question_count=profile.question_count,
    )
