# InterviewPilot — 4 Interview Modes Spec
## Addendum to Backend Design Spec

---

## The 4 Modes

```
┌──────────────────────────────────────────────────────────────┐
│                    INTERVIEW MODES                            │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│              │              │              │                 │
│   🤝 HR      │  🧠 Behavioral│  💻 Technical │  🎯 Mock        │
│              │              │              │  (Full Round)   │
│  Single      │  Single      │  Single      │  Multi-agent    │
│  Agent       │  Agent       │  Agent       │  Handoff        │
│              │              │              │                 │
│  ~10 min     │  ~15 min     │  ~20 min     │  ~30 min        │
│              │              │              │                 │
│  Culture fit │  STAR-based  │  System      │  HR (5 min) →   │
│  Motivation  │  Situation   │  design,     │  Behavioral     │
│  Soft skills │  Conflict    │  Coding      │   (10 min) →    │
│  Career      │  Leadership  │  concepts    │  Technical      │
│  goals       │  Teamwork    │  Problem     │   (15 min)      │
│              │              │  solving     │                 │
│  Voice:      │  Voice:      │  Voice:      │  All 3 voices   │
│  Charon      │  Kore        │  Puck        │  + transitions  │
│              │              │              │                 │
└──────────────┴──────────────┴──────────────┴─────────────────┘
```

---

## How Each Mode Works

### Mode 1: HR Interview (Single Agent)
- **Persona:** Marcus Johnson, Director of People
- **Voice:** Charon (warm, professional)
- **Focus:** Culture fit, motivation, career goals, soft skills
- **Questions:** 5-7 questions
- **Duration:** ~10 minutes
- **Prompt style:** Conversational, create a comfortable atmosphere, assess communication clarity and enthusiasm
- **Evaluation focus:** Cultural alignment, communication skills, motivation

### Mode 2: Behavioral Interview (Single Agent)
- **Persona:** Sarah Chen, Senior Engineering Manager
- **Voice:** Kore (warm but thorough)
- **Focus:** STAR-format questions, leadership, conflict resolution, teamwork
- **Questions:** 5-8 questions with follow-ups
- **Duration:** ~15 minutes
- **Prompt style:** Push for specifics, follow up when answers lack metrics, probe for depth
- **Evaluation focus:** Structured thinking, leadership evidence, self-awareness

### Mode 3: Technical Interview (Single Agent)
- **Persona:** Alex Rivera, Staff Software Engineer
- **Voice:** Puck (rigorous, conversational)
- **Focus:** System design, coding concepts, architecture, problem-solving
- **Questions:** 4-6 questions with deep follow-ups
- **Duration:** ~20 minutes
- **Prompt style:** Challenge assumptions, probe for depth, discuss trade-offs
- **Evaluation focus:** Technical depth, problem-solving approach, system thinking
- **Note:** For the hackathon this is verbal only (no code editor). The agent discusses coding concepts and asks the candidate to explain approaches verbally. A code editor panel is a future feature.

### Mode 4: Mock Interview — Full Round (Multi-Agent Handoff) ⭐
- **The showpiece feature for the hackathon**
- **Three agents in sequence within one session:**

```
┌─────────────────────────────────────────────────────────┐
│                    MOCK (FULL ROUND)                      │
│                                                          │
│  Phase 1: HR Warmup (5 min)                              │
│  ┌────────────────────────────────────────────────┐      │
│  │  Agent: HRAgent (Marcus, Charon voice)         │      │
│  │  3-4 quick questions: intro, motivation, goals │      │
│  │  When done → calls handoff_to_behavioral()     │──┐   │
│  └────────────────────────────────────────────────┘  │   │
│                                                      │   │
│  "Thank you! Let me bring in my colleague            │   │
│   Sarah for the behavioral portion."                 │   │
│                                                      │   │
│  Phase 2: Behavioral Deep Dive (10 min)              ▼   │
│  ┌────────────────────────────────────────────────┐      │
│  │  Agent: BehavioralAgent (Sarah, Kore voice)    │      │
│  │  4-5 STAR questions with follow-ups            │      │
│  │  Has context from HR round via chat_ctx        │      │
│  │  When done → calls handoff_to_technical()      │──┐   │
│  └────────────────────────────────────────────────┘  │   │
│                                                      │   │
│  "Great answers! Now Alex will take over             │   │
│   for the technical discussion."                     │   │
│                                                      │   │
│  Phase 3: Technical Assessment (15 min)              ▼   │
│  ┌────────────────────────────────────────────────┐      │
│  │  Agent: TechnicalAgent (Alex, Puck voice)      │      │
│  │  3-4 technical questions                       │      │
│  │  Has context from both prior rounds            │      │
│  │  When done → calls end_interview()             │      │
│  └────────────────────────────────────────────────┘      │
│                                                          │
│  Combined scorecard from all 3 phases                    │
└─────────────────────────────────────────────────────────┘
```

---

## Multi-Agent Handoff Implementation

### Agent Definitions

```python
# personas.py — Updated with all 4 modes

from dataclasses import dataclass
from typing import Optional

@dataclass
class InterviewerPersona:
    name: str
    role: str
    voice: str
    style: str
    question_count: int
    focus_areas: list[str]
    evaluation_criteria: list[str]

PERSONAS = {
    "hr": InterviewerPersona(
        name="Marcus Johnson",
        role="Director of People",
        voice="Charon",
        style="""You assess culture fit, motivation, and soft skills.
        Ask about teamwork, conflict resolution, career goals.
        Be conversational and create a comfortable atmosphere.
        Note communication clarity and enthusiasm.""",
        question_count=6,
        focus_areas=["culture_fit", "motivation", "career_goals",
                     "communication", "soft_skills"],
        evaluation_criteria=["Cultural Alignment", "Communication Skills",
                           "Motivation & Drive", "Self-Awareness"],
    ),
    "behavioral": InterviewerPersona(
        name="Sarah Chen",
        role="Senior Engineering Manager",
        voice="Kore",
        style="""You are warm but thorough. Ask behavioral questions
        using the STAR method. Follow up when answers lack specifics.
        Push for concrete metrics and outcomes. You genuinely want
        the candidate to do well.""",
        question_count=6,
        focus_areas=["leadership", "conflict_resolution", "teamwork",
                     "problem_solving", "adaptability"],
        evaluation_criteria=["Structured Thinking", "Leadership Evidence",
                           "Self-Awareness", "Impact & Results"],
    ),
    "technical": InterviewerPersona(
        name="Alex Rivera",
        role="Staff Software Engineer",
        voice="Puck",
        style="""You are technically rigorous but conversational.
        Ask about system design, algorithms, and architecture.
        Probe for depth — don't accept surface-level answers.
        Challenge assumptions. But be encouraging when they show
        strong reasoning.""",
        question_count=5,
        focus_areas=["system_design", "algorithms", "architecture",
                     "problem_solving", "technical_depth"],
        evaluation_criteria=["Technical Depth", "Problem-Solving Approach",
                           "System Thinking", "Communication of Ideas"],
    ),
}

# Mock mode uses all three in sequence with reduced question counts
MOCK_PHASES = [
    {"type": "hr",         "questions": 3, "duration_hint": "5 minutes"},
    {"type": "behavioral", "questions": 4, "duration_hint": "10 minutes"},
    {"type": "technical",  "questions": 3, "duration_hint": "15 minutes"},
]
```

### Multi-Agent Handoff (Mock Mode)

```python
# interview_agent.py — Mock mode with handoffs

from livekit.agents import Agent, function_tool, RunContext
from personas import PERSONAS, MOCK_PHASES
from prompts import build_system_prompt

class HRAgent(Agent):
    """Phase 1 of mock interview — HR warmup."""

    def __init__(self, session_id: str, config: dict, api_client):
        persona = PERSONAS["hr"]
        self.session_id = session_id
        self.api = api_client
        self.config = config

        super().__init__(
            instructions=build_system_prompt(
                config=config,
                persona=persona,
                mode="mock",
                phase_info="Phase 1 of 3: HR Warmup (ask 3-4 questions, ~5 min)",
            ),
        )

    @function_tool()
    async def send_feedback(self, ctx: RunContext, metric: str,
                           score: float, note: str = ""):
        """Send real-time feedback to coaching dashboard."""
        # ... same as before, includes RPC to frontend ...

    @function_tool()
    async def log_observation(self, ctx: RunContext, category: str,
                             severity: str, message: str):
        """Log coaching observation."""
        # ... same as before ...

    @function_tool()
    async def handoff_to_behavioral(self, ctx: RunContext):
        """Hand off to the behavioral interviewer.
        Call this when you've completed your HR questions (3-4 questions).
        Announce the transition naturally to the candidate."""

        # Notify frontend of phase change
        payload = json.dumps({
            "type": "phase_change",
            "phase": 2,
            "phase_name": "Behavioral",
            "interviewer": "Sarah Chen",
        })
        for p in ctx.session.room.remote_participants.values():
            await p.perform_rpc("phase_change", payload)

        # Create next agent with conversation context
        behavioral_agent = BehavioralAgent(
            session_id=self.session_id,
            config=self.config,
            api_client=self.api,
            chat_ctx=ctx.session.chat_ctx,  # preserve context
        )
        return behavioral_agent


class BehavioralAgent(Agent):
    """Phase 2 of mock interview — Behavioral deep dive."""

    def __init__(self, session_id, config, api_client, chat_ctx=None):
        persona = PERSONAS["behavioral"]
        self.session_id = session_id
        self.api = api_client
        self.config = config

        super().__init__(
            instructions=build_system_prompt(
                config=config,
                persona=persona,
                mode="mock",
                phase_info="Phase 2 of 3: Behavioral (ask 4-5 questions, ~10 min). "
                           "You're taking over from the HR interviewer. "
                           "Introduce yourself briefly and transition smoothly.",
            ),
            chat_ctx=chat_ctx,  # carries over conversation history
        )

    @function_tool()
    async def send_feedback(self, ctx: RunContext, metric: str,
                           score: float, note: str = ""):
        """Send real-time feedback to coaching dashboard."""
        # ... same tool ...

    @function_tool()
    async def log_observation(self, ctx: RunContext, category: str,
                             severity: str, message: str):
        """Log coaching observation."""
        # ... same tool ...

    @function_tool()
    async def handoff_to_technical(self, ctx: RunContext):
        """Hand off to the technical interviewer.
        Call this when you've completed behavioral questions.
        Announce the transition naturally."""

        payload = json.dumps({
            "type": "phase_change",
            "phase": 3,
            "phase_name": "Technical",
            "interviewer": "Alex Rivera",
        })
        for p in ctx.session.room.remote_participants.values():
            await p.perform_rpc("phase_change", payload)

        technical_agent = TechnicalAgent(
            session_id=self.session_id,
            config=self.config,
            api_client=self.api,
            chat_ctx=ctx.session.chat_ctx,
        )
        return technical_agent


class TechnicalAgent(Agent):
    """Phase 3 of mock interview — Technical assessment."""

    def __init__(self, session_id, config, api_client, chat_ctx=None):
        persona = PERSONAS["technical"]
        self.session_id = session_id
        self.api = api_client
        self.config = config

        super().__init__(
            instructions=build_system_prompt(
                config=config,
                persona=persona,
                mode="mock",
                phase_info="Phase 3 of 3: Technical (ask 3-4 questions, ~15 min). "
                           "You're the final interviewer. Introduce yourself "
                           "and transition smoothly from the behavioral round.",
            ),
            chat_ctx=chat_ctx,
        )

    @function_tool()
    async def send_feedback(self, ctx: RunContext, metric: str,
                           score: float, note: str = ""):
        """Send real-time feedback to coaching dashboard."""
        # ...

    @function_tool()
    async def log_observation(self, ctx: RunContext, category: str,
                             severity: str, message: str):
        """Log coaching observation."""
        # ...

    @function_tool()
    async def end_interview(self, ctx: RunContext):
        """End the full mock interview. Call this when all technical
        questions are done. This triggers the combined scorecard."""
        payload = json.dumps({
            "type": "interview_ended",
            "session_id": self.session_id,
        })
        for p in ctx.session.room.remote_participants.values():
            await p.perform_rpc("interview_ended", payload)

        await self.api.trigger_scorecard(self.session_id)
        await self.api.update_session_status(self.session_id, "ending")
        return "Interview complete. Combined scorecard being generated."
```

### Entrypoint: Route to Correct Agent(s)

```python
@server.rtc_session(agent_name="interview-agent")
async def entrypoint(ctx: JobContext):
    room_metadata = json.loads(ctx.room.metadata or "{}")
    config = room_metadata
    session_id = config.get("session_id", ctx.room.name)
    interview_type = config.get("interview_type", "behavioral")

    api_client = BackendAPIClient()

    # Route to correct agent based on interview type
    if interview_type == "mock":
        # Mock mode: start with HR agent, it will handoff to others
        initial_agent = HRAgent(
            session_id=session_id,
            config=config,
            api_client=api_client,
        )
    elif interview_type == "hr":
        initial_agent = HRInterviewAgent(  # standalone HR
            session_id=session_id, config=config, api_client=api_client,
        )
    elif interview_type == "behavioral":
        initial_agent = BehavioralInterviewAgent(  # standalone
            session_id=session_id, config=config, api_client=api_client,
        )
    elif interview_type == "technical":
        initial_agent = TechnicalInterviewAgent(  # standalone
            session_id=session_id, config=config, api_client=api_client,
        )
    else:
        initial_agent = BehavioralInterviewAgent(
            session_id=session_id, config=config, api_client=api_client,
        )

    # Choose voice based on initial agent's persona
    voice = initial_agent.persona.voice if hasattr(initial_agent, 'persona') \
            else "Puck"

    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-2.5-flash-native-audio-preview-12-2025",
            voice=voice,
            proactivity=True,
            enable_affective_dialog=True,
        ),
        vad=ctx.proc.userdata["vad"],
    )

    await session.start(
        room=ctx.room,
        agent=initial_agent,
        room_input_options=RoomInputOptions(video_enabled=True),
    )
    await ctx.connect()
    await api_client.update_session_status(session_id, "active")
    await session.generate_reply()
```

---

## Updated Data Models

### InterviewConfig (Updated)

```python
class InterviewConfig(BaseModel):
    role: str
    company: str = ""
    interview_type: Literal["hr", "behavioral", "technical", "mock"]
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    duration_minutes: int = 15      # auto-set based on type
    candidate_name: str = "Candidate"

    @model_validator(mode="after")
    def set_default_duration(self):
        if self.duration_minutes == 15:  # default not overridden
            duration_map = {
                "hr": 10,
                "behavioral": 15,
                "technical": 20,
                "mock": 30,
            }
            self.duration_minutes = duration_map.get(
                self.interview_type, 15
            )
        return self
```

### InterviewSession (Updated)

```python
class InterviewSession(BaseModel):
    id: str
    config: InterviewConfig
    room_name: str
    status: Literal[
        "created", "connecting", "active",
        "ending", "completed", "failed"
    ] = "created"
    current_phase: Optional[InterviewPhase] = None  # NEW
    phases: list[InterviewPhase] = []                # NEW
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class InterviewPhase(BaseModel):
    """Tracks each phase in a mock interview."""
    phase_number: int                # 1, 2, 3
    phase_type: str                  # "hr", "behavioral", "technical"
    interviewer_name: str            # "Marcus Johnson"
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    question_count: int = 0
```

### Scorecard (Updated for Mock Mode)

```python
class Scorecard(BaseModel):
    session_id: str
    interview_type: str              # "hr", "behavioral", "technical", "mock"
    overall_score: int
    overall_summary: str

    # Per-phase scores (for mock mode, 3 phases; for others, 1 phase)
    phase_scores: list[PhaseScore]

    # Combined analysis
    categories: list[CategoryScore]
    strengths: list[str]
    improvements: list[str]
    key_moments: list[KeyMoment]
    analytics: SessionAnalytics
    generated_at: datetime
    pdf_url: Optional[str] = None

class PhaseScore(BaseModel):
    """Score for one phase of the interview."""
    phase_type: str                  # "hr", "behavioral", "technical"
    interviewer_name: str
    score: int                       # 0-100
    summary: str
    highlights: list[str]

class SessionAnalytics(BaseModel):
    total_duration_seconds: float
    speaking_time_pct: float         # candidate's share
    avg_confidence: float
    avg_eye_contact: float
    filler_word_count: int
    filler_word_breakdown: dict      # {"um": 5, "uh": 3, "like": 4}
    questions_answered: int
    phases_completed: int            # 1 for single, 3 for mock
```

---

## Frontend Changes for 4 Modes

### Setup Page — Updated Type Selection

```
Interview Type:

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  🤝 HR    │  │ 🧠 Behav. │  │ 💻 Tech.  │  │ 🎯 Mock  │
│           │  │           │  │           │  │  (Full)  │
│  ~10 min  │  │  ~15 min  │  │  ~20 min  │  │  ~30 min │
│           │  │           │  │           │  │          │
│  Culture  │  │  STAR     │  │  System   │  │  All 3   │
│  fit &    │  │  method,  │  │  design,  │  │  rounds  │
│  soft     │  │  leader-  │  │  coding,  │  │  combined│
│  skills   │  │  ship     │  │  concepts │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

Each card is selectable (radio-style), with a brief description and estimated duration. Mock gets a special "Recommended" badge or star indicator.

### Interview Room — Phase Indicator (Mock Mode)

When in Mock mode, the header shows a phase progress bar:

```
┌──────────────────────────────────────────────────────────┐
│  ◉ InterviewPilot    Mock Interview · Google   ⏱ 14:32  │
│                                                          │
│  Phase: ●━━━━━━━━━━━○━━━━━━━━━━━○                       │
│         HR (done)    Behavioral    Technical              │
│         Marcus ✓     Sarah ◄       Alex                  │
│                      (current)                           │
└──────────────────────────────────────────────────────────┘
```

Components needed:
- `PhaseProgressBar.tsx` — horizontal stepper showing 3 phases
- `PhaseTransition.tsx` — animated overlay during handoff: "Now speaking with Sarah Chen, Senior Engineering Manager"

### Interview Room — Video Panel Update

The left video panel shows current interviewer info:

```
┌──────────────┐
│  Your Camera  │
│              │
│  🎤 ████░░░  │  ← audio viz
│              │
│  ┌──────────┐│
│  │ 🤝 Phase 1││
│  │ Marcus J. ││  ← changes per phase
│  │ HR        ││
│  └──────────┘│
│              │
│  Q 2 of ~3   │
└──────────────┘
```

### Scorecard — Mock Mode Shows Phase Breakdown

For single modes, the scorecard is straightforward.
For Mock mode, the scorecard includes a tab/section per phase:

```
┌──────────────────────────────────────────────────────┐
│  OVERALL: 78/100                                      │
│                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │
│  │ 🤝 HR        │ │ 🧠 Behavioral│ │ 💻 Technical │    │
│  │   82/100     │ │   76/100     │ │   74/100     │    │
│  │   Marcus J.  │ │   Sarah C.   │ │   Alex R.    │    │
│  │              │ │              │ │              │    │
│  │ "Strong      │ │ "Good STAR   │ │ "Solid       │    │
│  │  culture     │ │  format but  │ │  system      │    │
│  │  fit..."     │ │  needs more  │ │  design      │    │
│  │              │ │  metrics"    │ │  thinking"   │    │
│  └─────────────┘ └─────────────┘ └─────────────┘    │
│                                                      │
│  [Combined Strengths / Improvements / Key Moments]    │
└──────────────────────────────────────────────────────┘
```

---

## Voice Switching During Handoff

A critical detail: when agents hand off in Mock mode, **the Gemini voice needs to change** too (Charon → Kore → Puck). LiveKit's RealtimeModel is configured per-session, but since handoffs transfer session control from one agent to another, the voice persona is carried by the system prompt's personality rather than switching the underlying TTS voice.

**Practical approach for hackathon:**
- Use a single Gemini voice (Puck) across all phases
- Differentiate personas through prompt engineering (speaking style, tone, vocabulary)
- The affective dialog feature adapts tone naturally
- In the prompt, instruct each persona to subtly shift communication style

**Stretch goal (if Gemini supports mid-session voice change):**
- Switch voice parameter during handoff
- This may require creating a new RealtimeModel instance — needs testing

---

## Session State Machine

```
                    ┌──────────┐
                    │ CREATED  │
                    └────┬─────┘
                         │ user connects
                    ┌────▼─────┐
                    │CONNECTING│
                    └────┬─────┘
                         │ agent joins
                    ┌────▼─────┐
              ┌─────│  ACTIVE  │─────┐
              │     └────┬─────┘     │
              │          │           │
         (mock only)     │      (error/disconnect)
              │          │           │
        ┌─────▼──────┐   │     ┌────▼─────┐
        │PHASE_CHANGE│   │     │  FAILED  │
        │ (HR→Behav  │   │     └──────────┘
        │  →Tech)    │   │
        └─────┬──────┘   │
              │          │
              └──────────┤
                         │ end_interview() called
                    ┌────▼─────┐
                    │ ENDING   │ ← scorecard generating
                    └────┬─────┘
                         │ scorecard ready
                    ┌────▼─────┐
                    │COMPLETED │
                    └──────────┘
```

---

## Complete Interview Type Config

```python
# constants.py

INTERVIEW_TYPE_CONFIGS = {
    "hr": {
        "display_name": "HR Interview",
        "icon": "🤝",
        "description": "Culture fit, motivation, career goals, and soft skills",
        "default_duration": 10,
        "phases": 1,
        "persona": "hr",
        "question_range": [5, 7],
    },
    "behavioral": {
        "display_name": "Behavioral Interview",
        "icon": "🧠",
        "description": "STAR-format questions on leadership, teamwork, and problem-solving",
        "default_duration": 15,
        "phases": 1,
        "persona": "behavioral",
        "question_range": [5, 8],
    },
    "technical": {
        "display_name": "Technical Interview",
        "icon": "💻",
        "description": "System design, coding concepts, architecture, and problem-solving",
        "default_duration": 20,
        "phases": 1,
        "persona": "technical",
        "question_range": [4, 6],
    },
    "mock": {
        "display_name": "Mock Interview (Full Round)",
        "icon": "🎯",
        "description": "Complete interview simulation: HR → Behavioral → Technical with panel handoff",
        "default_duration": 30,
        "phases": 3,
        "persona": None,  # uses all three
        "question_range": [10, 14],  # total across all phases
        "badge": "Recommended",
    },
}
```

---

## Summary of Changes from Previous Spec

| Area | Before | After |
|------|--------|-------|
| Interview types | Single `interview_type` enum | 4 explicit modes with distinct configs |
| Agent architecture | Single `InterviewAgent` class | Base `InterviewAgent` + 3 persona subclasses + Mock multi-agent |
| Handoff | Not implemented | LiveKit native handoff via tool return |
| Voice | Single voice per session | Per-persona voice (or prompt-driven personality shift) |
| Scorecard | Single analysis | Phase-aware: single-phase for modes 1-3, three-phase breakdown for Mock |
| Frontend setup | Radio buttons | Visual cards with icons, descriptions, durations |
| Frontend interview | Static header | Phase progress bar + persona badge (Mock mode) |
| Session model | Simple status | Status + current phase + phases list |
| Duration | Fixed | Auto-set per interview type |