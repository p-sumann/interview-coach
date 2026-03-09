from app.schemas.common import (
    CamelModel,
    ExperienceLevelEnum,
    InterviewTypeEnum,
    LegacyRoleType,
    PrimaryLanguageEnum,
)


class InterviewConfigSchema(CamelModel):
    candidate_name: str
    target_role: str
    company: str = ""
    experience_level: ExperienceLevelEnum
    role_type: LegacyRoleType
    primary_language: PrimaryLanguageEnum
    tech_stack: list[str] = []
    interview_type: InterviewTypeEnum
