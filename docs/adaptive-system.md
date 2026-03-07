# InterviewPilot — Adaptive & Dynamic Interview Coaching System
## Complete System Design for Intelligent Difficulty Calibration

---

## The Problem

Current AI interview tools (Micro1, Mercor, etc.) are static. They ask the same type of questions regardless of whether the candidate is a fresh grad or a Staff engineer with 15 years of experience. A junior who mentions "microservices scaling at 1B QPS" sounds out of depth. A senior who gives a surface-level answer about a HashMap gets pegged as junior. The interview experience should be fundamentally different based on who's sitting in the chair.

**Our system must adapt across 4 dimensions simultaneously:**

```
                    ┌─────────────────────────────┐
                    │   ADAPTIVE DIMENSIONS        │
                    ├──────────────┬───────────────┤
                    │              │               │
    ┌───────────────┤  1. SENIORITY │  2. ROLE     │
    │               │  (Experience  │  (What they  │
    │               │   Level)      │   build)     │
    │               ├──────────────┼───────────────┤
    │               │              │               │
    │               │  3. LANGUAGE/ │  4. REAL-TIME│
    │               │  TECH STACK   │  PERFORMANCE │
    │               │  (What they   │  (How they're│
    │               │   code with)  │   doing NOW) │
    │               │              │               │
    │               └──────────────┴───────────────┘
    │
    └──→  These 4 dimensions combine to produce a UNIQUE
          interview experience for every single candidate
```

---

## Dimension 1: Seniority Levels

### The Ladder

Based on extensive research into how FAANG companies evaluate candidates at different levels, here's the seniority matrix that drives the entire system:

```
┌─────────┬────────────────────────────────────────────────────────┐
│ LEVEL   │ WHAT'S EVALUATED                                       │
├─────────┼────────────────────────────────────────────────────────┤
│         │                                                        │
│ JUNIOR  │ • Can they write working code?                         │
│ (0-2yr) │ • Do they understand basic data structures?            │
│ L3-L4   │ • Can they communicate their thought process?          │
│         │ • Scope: individual tasks, small features              │
│         │ • Behavioral: "Tell me about a project you worked on"  │
│         │ • System Design: basic client-server, simple API       │
│         │ • Follow-ups: guided, interviewer drives               │
│         │                                                        │
├─────────┼────────────────────────────────────────────────────────┤
│         │                                                        │
│ MID     │ • Does the code handle edge cases?                     │
│ (2-5yr) │ • Can they make and justify design decisions?          │
│ L4-L5   │ • Do they think about maintainability?                 │
│         │ • Scope: features end-to-end, small team               │
│         │ • Behavioral: "How did you handle a conflict?"         │
│         │ • System Design: HLD + LLD, scalability basics         │
│         │ • Follow-ups: "What if traffic doubles?"               │
│         │                                                        │
├─────────┼────────────────────────────────────────────────────────┤
│         │                                                        │
│ SENIOR  │ • Is the code readable, maintainable, production-ready?│
│ (5-10yr)│ • Can they navigate ambiguity and drive decisions?     │
│ L5-L6   │ • Do they discuss trade-offs proactively?              │
│         │ • Scope: cross-team projects, org-level impact         │
│         │ • Behavioral: complex multi-stakeholder stories        │
│         │ • System Design: distributed systems, sharding,        │
│         │   consistency, caching at scale                        │
│         │ • Follow-ups: "Why not X? Convince me."                │
│         │                                                        │
├─────────┼────────────────────────────────────────────────────────┤
│         │                                                        │
│ STAFF+  │ • Can they simplify complex problems elegantly?        │
│ (10+yr) │ • Do they see what others miss?                        │
│ L6-L7+  │ • Can they influence technical direction?              │
│         │ • Scope: org-wide architecture, multi-year strategy    │
│         │ • Behavioral: driving consensus across orgs,           │
│         │   making hard calls with incomplete data               │
│         │ • System Design: candidate drives the interview,       │
│         │   depth over breadth, operational concerns,            │
│         │   elegance and simplicity valued over complexity       │
│         │ • Follow-ups: "What would you cut?"                    │
│         │                                                        │
└─────────┴────────────────────────────────────────────────────────┘
```

### How Seniority Changes the Interview

The same topic (e.g., "Design a URL shortener") produces radically different interviews:

**Junior:**
- Interviewer provides constraints upfront
- Focus on: basic API design, database schema, simple request flow
- Acceptable answer: monolith with PostgreSQL, basic CRUD
- Follow-up: "What HTTP method would you use for creating a short URL?"

**Mid:**
- Interviewer provides partial constraints, expects clarifying questions
- Focus on: API design + caching + basic scaling
- Acceptable answer: load balancer, read replicas, Redis cache
- Follow-up: "What happens if your cache goes down?"

**Senior:**
- Interviewer gives vague prompt, expects candidate to drive
- Focus on: distributed systems, consistency models, hash collision handling
- Acceptable answer: sharding strategy, eventual consistency, CDN layer
- Follow-up: "Why not consistent hashing here? Convince me."

**Staff+:**
- Interviewer gives the broadest possible prompt
- Focus on: candidate identifies what's actually hard, cuts complexity everywhere else
- Expected behavior: "How many URLs are we talking about? 10M? Let's keep this simple — in-memory with periodic persistence would work fine."
- Follow-up: "What breaks first at 100x scale?"

### Behavioral Seniority Calibration

Based on how Meta evaluates behavioral interviews at different levels:

| Signal | Junior | Mid | Senior | Staff+ |
|--------|--------|-----|--------|--------|
| **Scope of Impact** | Personal task | Team feature | Cross-team project | Org-wide initiative |
| **Ownership** | Assigned work | Self-directed feature | Identified & drove ambiguous project | Created new direction |
| **Conflict** | Peer disagreement | Technical debate with team | Cross-team consensus with stakeholders | Organizational alignment with competing interests |
| **Communication** | Clear explanation | Structured narrative | Persuasive with trade-offs | Influential across senior leadership |
| **Growth** | Learning new technology | Developing team-level skills | Skill that impacts multiple teams | Skill that shapes org capability |
| **Follow-ups** | "What did you learn?" | "What would you do differently?" | "How did you influence without authority?" | "How did you know this was the right bet?" |

---

## Dimension 2: Role-Based Adaptation

Different engineering roles get fundamentally different questions, even within the same interview type.

### Role Taxonomy

```
┌────────────────────────────────────────────────────────────┐
│                    ENGINEERING ROLES                       │
├────────────────┬─────────────────┬─────────────────────────┤
│  BACKEND       │  FRONTEND       │  FULLSTACK              │
│  ┌──────────┐  │  ┌──────────┐  │  ┌──────────┐            │
│  │ API      │  │  │ React/   │  │  │ Both     │            │
│  │ Systems  │  │  │ Vue/     │  │  │ sides +  │            │
│  │ Data     │  │  │ Angular  │  │  │ integra- │            │
│  │ Infra    │  │  │ Browser  │  │  │ tion     │            │
│  └──────────┘  │  └──────────┘  │  └──────────┘            │
├────────────────┼─────────────────┼─────────────────────────┤
│  DATA/ML       │  DEVOPS/SRE     │  MOBILE                 │
│  ┌──────────┐  │  ┌──────────┐  │  ┌──────────┐            │
│  │ Pipelines│  │  │ CI/CD    │  │  │ iOS /    │            │
│  │ Models   │  │  │ K8s      │  │  │ Android  │            │
│  │ Training │  │  │ Monitor  │  │  │ Platform │            │
│  │ Serving  │  │  │ Scale    │  │  │ specific │            │
│  └──────────┘  │  └──────────┘  │  └──────────┘            │
└────────────────┴─────────────────┴─────────────────────────┘
```

### Role-Specific Question Banks

Each role has its own question universe. The system selects from the appropriate bank based on the role selected during setup.

**Backend Engineer:**

| Seniority | System Design Topics | Technical Concepts |
|-----------|--------------------|--------------------|
| Junior | REST API design, basic CRUD, SQL schema | HTTP methods, SQL vs NoSQL basics, authentication |
| Mid | Rate limiter, URL shortener, chat system | Caching strategies, message queues, DB indexing |
| Senior | Distributed cache, search engine, payment system | Sharding, consistency models, distributed transactions |
| Staff+ | Global-scale data platform, multi-region architecture | CAP theorem trade-offs at scale, operational concerns |

**Frontend Engineer:**

| Seniority | System Design Topics | Technical Concepts |
|-----------|--------------------|--------------------|
| Junior | Component architecture, state management | DOM, CSS layout, event handling, React basics |
| Mid | Design system, real-time collaborative UI | Performance optimization, bundle splitting, a11y |
| Senior | Micro-frontend architecture, offline-first apps | Web workers, service workers, virtualization |
| Staff+ | Cross-platform design system, performance at scale | Build infrastructure, rendering strategies |

**Data/ML Engineer:**

| Seniority | System Design Topics | Technical Concepts |
|-----------|--------------------|--------------------|
| Junior | Basic ETL pipeline, simple model serving | SQL, pandas, basic ML concepts, feature engineering |
| Mid | Recommendation system, anomaly detection pipeline | Feature stores, model evaluation, A/B testing |
| Senior | Real-time ML platform, large-scale training infra | Distributed training, model monitoring, data lineage |
| Staff+ | End-to-end ML platform strategy, cost optimization | MLOps at scale, model governance, org-wide impact |

**DevOps/SRE:**

| Seniority | System Design Topics | Technical Concepts |
|-----------|--------------------|--------------------|
| Junior | CI/CD pipeline, basic monitoring | Docker, Linux, shell scripting, basic networking |
| Mid | Container orchestration, centralized logging | K8s architecture, Terraform, alerting strategies |
| Senior | Multi-region deployment, disaster recovery | SLO/SLA design, chaos engineering, capacity planning |
| Staff+ | Platform engineering strategy, cost optimization | Org-wide reliability standards, vendor strategy |

---

## Dimension 3: Language & Tech Stack Specificity

The interviewer adapts technical questions to the candidate's stated language and stack.

### Language-Specific Technical Depth

When a candidate says "I primarily work with Python," the system should ask Python-specific questions at the right depth:

**Python Developer — By Seniority:**

| Level | What Gets Asked |
|-------|----------------|
| Junior | "What's the difference between a list and a tuple?" "How does Python handle memory?" |
| Mid | "Explain the GIL. How does it affect concurrent Python?" "When would you choose asyncio vs threading?" |
| Senior | "Walk me through how you'd optimize a Python service handling 10K req/s" "How do you profile and fix memory leaks in production Python?" |
| Staff+ | "When would you move away from Python for a service? What's the decision framework?" "How do you build a Python monorepo for 50 developers?" |

**Java Developer — By Seniority:**

| Level | What Gets Asked |
|-------|----------------|
| Junior | "Explain the difference between interface and abstract class" "What is garbage collection?" |
| Mid | "Walk me through JVM memory model. How do you tune GC?" "When would you use CompletableFuture vs traditional threading?" |
| Senior | "Design a high-throughput Java service with < 5ms p99 latency" "How do you handle distributed transactions across microservices?" |
| Staff+ | "Your Java monolith serves 500M users. What's your migration strategy?" "How do you evaluate Kotlin vs Java for your org's future?" |

**Go Developer — By Seniority:**

| Level | What Gets Asked |
|-------|----------------|
| Junior | "How do goroutines differ from OS threads?" "Explain channels and their use cases" |
| Mid | "How would you implement graceful shutdown in a Go service?" "Walk me through Go's garbage collector" |
| Senior | "Design a high-concurrency Go service with connection pooling and circuit breaking" |
| Staff+ | "When is Go the wrong choice? What's your decision framework for language selection?" |

**JavaScript/TypeScript Developer — By Seniority:**

| Level | What Gets Asked |
|-------|----------------|
| Junior | "Explain the event loop" "What's the difference between let, const, and var?" |
| Mid | "How does V8 optimize hot code paths?" "Explain TypeScript's type system strengths and limitations" |
| Senior | "Design a real-time collaborative editor with conflict resolution in Node.js" |
| Staff+ | "How do you manage a shared TypeScript monorepo across 20 teams?" |

### Framework-Specific Adaptation

If the candidate mentions specific frameworks, the system incorporates them:

```
Candidate says: "I work with Django and FastAPI"
→ System asks about ASGI vs WSGI, Django ORM N+1 problems,
  FastAPI dependency injection, Pydantic validation patterns

Candidate says: "I use Spring Boot"
→ System asks about Spring DI, bean scopes, AOP,
  Spring Security filter chains, JPA entity relationships

Candidate says: "I build with React and Next.js"
→ System asks about RSC, server actions, hydration,
  state management patterns, rendering strategies
```

---

## Dimension 4: Real-Time Performance Adaptation (The Adaptive Engine)

This is the most novel part. The system calibrates difficulty in real-time based on how the candidate is performing, inspired by Computerized Adaptive Testing (CAT) from psychometrics.

### The Concept: LLM-Driven Adaptive Testing

Traditional CAT uses Item Response Theory (IRT) with pre-calibrated item banks. We can't do that — our "items" are open-ended interview questions evaluated by an LLM, not multiple-choice answers. Instead, we use a **prompt-engineered adaptive loop** where the LLM itself acts as both interviewer and calibrator.

### The Adaptive Algorithm

```
┌─────────────────────────────────────────────────────────────┐
│              ADAPTIVE DIFFICULTY ENGINE                       │
│                                                              │
│  ┌──────────────┐                                            │
│  │ Initial      │ ← Set by: seniority selection + role       │
│  │ Difficulty   │   (e.g., Senior Backend = Level 3/5)       │
│  │ θ₀ = 3.0    │                                            │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐    ┌──────────────────────────────────┐    │
│  │ Ask Question │───→│ Candidate Responds               │    │
│  │ at level θₙ  │    │ (audio → transcript)             │    │
│  └──────────────┘    └──────────┬───────────────────────┘    │
│                                 │                            │
│                                 ▼                            │
│                      ┌──────────────────────────────────┐    │
│                      │ LLM Evaluates Response            │    │
│                      │ (internal tool call, silent)       │    │
│                      │                                    │    │
│                      │ Dimensions scored:                 │    │
│                      │  • Technical depth (1-5)           │    │
│                      │  • Communication clarity (1-5)     │    │
│                      │  • Problem-solving approach (1-5)  │    │
│                      │  • Seniority signal (1-5)          │    │
│                      │                                    │    │
│                      │ Composite: avg → response_quality  │    │
│                      └──────────┬───────────────────────┘    │
│                                 │                            │
│                                 ▼                            │
│                      ┌──────────────────────────────────┐    │
│                      │ Update Difficulty Estimate         │    │
│                      │                                    │    │
│                      │ if response_quality > θₙ + 0.5:   │    │
│                      │   θₙ₊₁ = θₙ + 0.5  (harder)      │    │
│                      │ elif response_quality < θₙ - 0.5: │    │
│                      │   θₙ₊₁ = θₙ - 0.5  (easier)      │    │
│                      │ else:                              │    │
│                      │   θₙ₊₁ = θₙ        (stay)        │    │
│                      │                                    │    │
│                      │ Clamp: 1.0 ≤ θ ≤ 5.0              │    │
│                      └──────────┬───────────────────────┘    │
│                                 │                            │
│                                 ▼                            │
│                      ┌──────────────────────────────────┐    │
│                      │ Select Next Question               │    │
│                      │ from bank at level θₙ₊₁           │    │
│                      │                                    │    │
│                      │ Also considers:                    │    │
│                      │  • Topics not yet covered          │    │
│                      │  • Time remaining                  │    │
│                      │  • Candidate's weak areas          │    │
│                      └──────────────────────────────────┘    │
│                                                              │
│  Loop continues until time runs out or all topics covered    │
└─────────────────────────────────────────────────────────────┘
```

### Implementation: The Evaluation Tool

The agent uses a silent function tool to internally evaluate each response:

```python
@function_tool()
async def evaluate_response(
    self,
    ctx: RunContext,
    technical_depth: int,
    communication_clarity: int,
    problem_solving: int,
    seniority_signal: int,
    topics_demonstrated: list[str],
    gaps_identified: list[str],
):
    """Silently evaluate the candidate's response on multiple dimensions.
    Call this after EVERY candidate response. Do NOT mention this
    evaluation to the candidate.

    Args:
        technical_depth: 1-5 (1=surface, 5=expert)
        communication_clarity: 1-5 (1=unclear, 5=crystal)
        problem_solving: 1-5 (1=no structure, 5=elegant)
        seniority_signal: 1-5 (1=intern, 5=principal)
        topics_demonstrated: Topics the candidate showed knowledge in
        gaps_identified: Topics where candidate was weak or uncertain
    """
    composite = (technical_depth + communication_clarity
                + problem_solving + seniority_signal) / 4

    # Update internal difficulty estimate
    self.current_theta = self._update_theta(composite)

    # Track topic coverage
    self.covered_topics.update(topics_demonstrated)
    self.weak_areas.extend(gaps_identified)

    # Persist to backend
    await self.api.post_evaluation(self.session_id, {
        "question_number": self.question_count,
        "technical_depth": technical_depth,
        "communication_clarity": communication_clarity,
        "problem_solving": problem_solving,
        "seniority_signal": seniority_signal,
        "composite_score": composite,
        "current_theta": self.current_theta,
        "topics_demonstrated": topics_demonstrated,
        "gaps_identified": gaps_identified,
    })

    return f"Evaluated. Theta: {self.current_theta:.1f}"
```

### Difficulty Levels in Practice

| θ Level | Difficulty | Question Style | Follow-up Style |
|---------|-----------|---------------|-----------------|
| 1.0 | Entry | Guided, concrete, foundational | "Can you explain what X means?" |
| 2.0 | Junior | Practical, implementation-focused | "What edge cases would you handle?" |
| 3.0 | Mid | Open-ended, design-oriented | "What if the requirements change to Y?" |
| 4.0 | Senior | Ambiguous, trade-off heavy | "Why not Z? Convince me." |
| 5.0 | Staff+ | Strategic, breadth + depth | "What breaks first? What would you cut?" |

### Adaptive Behavior Examples

**Scenario A: Candidate claims Senior but answers like Junior**

```
Setup: Senior Backend, Python, 7 YoE → θ₀ = 3.5

Q1 (θ=3.5): "Design a rate limiter for a distributed API"
A1: "I'd use a counter in Redis..."
   → Shallow answer, no mention of sliding window vs fixed,
     no distributed concerns
   → evaluate_response(tech=2, comm=3, ps=2, seniority=2)
   → composite = 2.25, θ drops to 3.0

Q2 (θ=3.0): "How would you handle the case where Redis goes down?"
A2: "Um... I guess we'd... fail open?"
   → No fallback strategy, no circuit breaker
   → evaluate_response(tech=2, comm=2, ps=2, seniority=1.5)
   → composite = 1.9, θ drops to 2.5

Q3 (θ=2.5): "Let's step back. Can you walk me through how
              a basic token bucket algorithm works?"
   → System automatically downleveled to foundations
   → Coaching note: "Candidate may be at Mid level despite
     Senior experience claim"
```

**Scenario B: Candidate claims Mid but performs like Senior**

```
Setup: Mid Frontend, TypeScript, 4 YoE → θ₀ = 2.5

Q1 (θ=2.5): "How would you optimize a React app that's slow?"
A1: Discusses profiling, React DevTools, useMemo/useCallback,
    bundle analysis, code splitting, Web Vitals
   → evaluate_response(tech=4, comm=4, ps=4, seniority=4)
   → composite = 4.0, θ jumps to 3.0

Q2 (θ=3.0): "Design a component library that 5 teams will use"
A2: Discusses monorepo, Storybook, versioning strategy,
    tree-shaking, accessibility requirements, migration path
   → evaluate_response(tech=4.5, comm=4, ps=4, seniority=4.5)
   → composite = 4.25, θ jumps to 3.5

Q3 (θ=3.5): "Now, what if one team needs to break the design
              system for a critical deadline? How do you handle
              that tension?"
   → System escalated to senior-level organizational question
   → Coaching note: "Candidate performing above stated level —
     consider targeting Senior roles"
```

---

## The Combined Prompt Architecture

### How All 4 Dimensions Feed Into the System Prompt

```python
def build_adaptive_system_prompt(
    config: InterviewConfig,
    persona: InterviewerPersona,
    seniority_profile: SeniorityProfile,
    role_profile: RoleProfile,
    tech_stack: TechStackProfile,
) -> str:
    return f"""
You are {persona.name}, a {persona.role} conducting a mock
{config.interview_type} interview.

CANDIDATE PROFILE:
- Name: {config.candidate_name}
- Target Role: {config.role}
- Company: {config.company}
- Seniority: {config.seniority} ({seniority_profile.yoe_range})
- Role Type: {config.role_type} ({role_profile.description})
- Primary Language: {config.primary_language}
- Tech Stack: {', '.join(config.tech_stack)}

═══ SENIORITY CALIBRATION ═══
{seniority_profile.interviewer_guidelines}

WHAT TO EXPECT AT {config.seniority.upper()} LEVEL:
- Scope: {seniority_profile.expected_scope}
- Ownership: {seniority_profile.expected_ownership}
- Communication: {seniority_profile.expected_communication}
- Technical Depth: {seniority_profile.expected_depth}

QUESTION SELECTION RULES:
- Start at difficulty θ = {seniority_profile.initial_theta}
- Use evaluate_response() after EVERY answer
- If candidate consistently scores above θ+0.5, increase difficulty
- If candidate consistently scores below θ-0.5, decrease difficulty
- Never tell the candidate you're adjusting difficulty
- Track which topics you've covered, don't repeat

═══ ROLE-SPECIFIC FOCUS ═══
{role_profile.focus_areas_prompt}

For {config.role_type} roles, prioritize questions about:
{chr(10).join(f'- {area}' for area in role_profile.priority_topics)}

═══ LANGUAGE/STACK-SPECIFIC ═══
The candidate uses {config.primary_language}. When asking technical
questions, frame them in terms of {config.primary_language} idioms,
patterns, and ecosystem.

Language-specific topics to explore:
{tech_stack.language_topics_prompt}

Framework knowledge to probe (if relevant):
{tech_stack.framework_topics_prompt}

═══ ADAPTIVE BEHAVIOR RULES ═══
1. After each response, silently call evaluate_response()
2. Based on the composite score, adjust your next question
3. If a candidate struggles on a topic, probe ONE more time
   at a slightly lower level before moving on
4. If a candidate excels, push further into that topic
5. Cover breadth first (3-4 topics), then depth on strongest
6. For {config.seniority}: {seniority_profile.follow_up_style}
7. Time budget: {config.duration_minutes} min,
   ~{seniority_profile.question_count} questions

═══ COACHING (SILENT) ═══
- Use send_feedback() every 30-60 seconds for dashboard metrics
- Use log_observation() for notable moments
- Special observations for adaptive insights:
  * "Candidate performing above/below stated level"
  * "Strong in X, weak in Y — recommend focused practice"
  * "Level calibration suggests [junior/mid/senior/staff]"
"""
```

---

## Updated Data Models

### InterviewConfig (Extended)

```python
class InterviewConfig(BaseModel):
    # Basic
    role: str                    # "Senior Software Engineer"
    company: str = ""
    interview_type: Literal["hr", "behavioral", "technical", "mock"]
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    duration_minutes: int = 15
    candidate_name: str = "Candidate"

    # NEW: Seniority
    seniority: Literal["junior", "mid", "senior", "staff"] = "mid"
    years_of_experience: Optional[int] = None

    # NEW: Role Type
    role_type: Literal[
        "backend", "frontend", "fullstack",
        "data_ml", "devops_sre", "mobile",
    ] = "backend"

    # NEW: Tech Stack
    primary_language: Literal[
        "python", "java", "javascript", "typescript",
        "go", "rust", "cpp", "csharp", "ruby", "kotlin", "swift",
    ] = "python"
    tech_stack: list[str] = []    # ["Django", "PostgreSQL", "Redis"]
    frameworks: list[str] = []    # auto-populated or user-selected
```

### SeniorityProfile

```python
@dataclass
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

SENIORITY_PROFILES = {
    "junior": SeniorityProfile(
        level="junior",
        yoe_range="0-2 years",
        initial_theta=1.5,
        question_count=8,
        expected_scope="Individual tasks and small features",
        expected_ownership="Works on assigned tasks with guidance",
        expected_communication="Can explain their code and thinking",
        expected_depth="Understands fundamentals, may miss edge cases",
        follow_up_style="Guide them gently. If they're stuck, give hints. Ask 'What would you try next?'",
        interviewer_guidelines="""
            Be encouraging and patient. These candidates may be nervous.
            Focus on foundational knowledge. Don't expect awareness of
            distributed systems or organizational dynamics.
            Probe for learning ability and curiosity.
            It's OK if answers are simple — look for correct reasoning.
        """,
    ),
    "mid": SeniorityProfile(
        level="mid",
        yoe_range="2-5 years",
        initial_theta=2.5,
        question_count=7,
        expected_scope="Features end-to-end, team-level impact",
        expected_ownership="Self-directed on assigned projects",
        expected_communication="Structured, uses frameworks (STAR)",
        expected_depth="Solid fundamentals, beginning to think about scale",
        follow_up_style="Push for specifics. 'What metrics did that improve?' 'What would break first?'",
        interviewer_guidelines="""
            Expect practical knowledge. They should know how to build
            things that work in production. Push for depth on their
            claimed expertise. Probe for trade-off awareness.
            They may not have org-level stories — that's OK.
        """,
    ),
    "senior": SeniorityProfile(
        level="senior",
        yoe_range="5-10 years",
        initial_theta=3.5,
        question_count=6,
        expected_scope="Cross-team projects, org-level impact",
        expected_ownership="Identifies and drives ambiguous projects",
        expected_communication="Persuasive, discusses trade-offs naturally",
        expected_depth="Deep in specialty, broad enough to architect systems",
        follow_up_style="Challenge assumptions. 'Why not X?' 'What's the failure mode?' 'Convince me this scales.'",
        interviewer_guidelines="""
            Expect them to drive the conversation. Don't spoon-feed
            requirements — give ambiguous prompts and see how they
            clarify. Probe for leadership: "How did you get alignment?"
            "Who pushed back?" Trade-offs should be second nature.
            Watch for signs they're actually mid-level in disguise.
        """,
    ),
    "staff": SeniorityProfile(
        level="staff",
        yoe_range="10+ years",
        initial_theta=4.5,
        question_count=5,
        expected_scope="Org-wide architecture, multi-year strategy",
        expected_ownership="Creates new directions, influences without authority",
        expected_communication="Peer-level with senior leadership",
        expected_depth="Expert in multiple areas, knows when NOT to build",
        follow_up_style="Treat them as a peer. 'What would you cut?' 'Where does this not need to scale?' 'What's the 3-year view?'",
        interviewer_guidelines="""
            These candidates should teach YOU something. The best signal
            is when they simplify a complex problem elegantly. Don't
            waste time on basics — they should be assumed knowledge.
            Focus on: depth in the hardest parts, organizational
            influence, simplicity as a design principle, and ability
            to identify what's actually important vs. noise.
            Staff candidates who over-engineer are red flags.
        """,
    ),
}
```

---

## Frontend: Updated Setup Page

The setup form now has significantly more inputs to capture all 4 dimensions:

```
┌──────────────────────────────────────────────────────────────┐
│  ◉ InterviewPilot                                            │
│  "Your AI interview coach that adapts to YOU"                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  Your Name       [ Suman                        ]    │    │
│  │                                                      │    │
│  │  Target Role     [ Senior Software Engineer     ▼]   │    │
│  │  Company         [ Google                       ]    │    │
│  │                                                      │    │
│  │  Experience Level                                    │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │    │
│  │  │ Junior │ │  Mid   │ │ Senior │ │ Staff+ │        │    │
│  │  │ 0-2 yr │ │ 2-5 yr │ │5-10 yr │ │ 10+ yr │        │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘        │    │
│  │                                                      │    │
│  │  Role Type                                           │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                   │    │
│  │  │Backend │ │Frontend│ │Fullstk │                   │    │
│  │  └────────┘ └────────┘ └────────┘                   │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐                   │    │
│  │  │Data/ML │ │DevOps  │ │ Mobile │                   │    │
│  │  └────────┘ └────────┘ └────────┘                   │    │
│  │                                                      │    │
│  │  Primary Language                                    │    │
│  │  [ Python ▼]                                         │    │
│  │                                                      │    │
│  │  Tech Stack (optional, comma-separated)              │    │
│  │  [ Django, PostgreSQL, Redis, Docker           ]     │    │
│  │                                                      │    │
│  │  Interview Type                                      │    │
│  │  ┌──────┐ ┌────────┐ ┌──────────┐ ┌────────┐        │    │
│  │  │  HR  │ │Behavior│ │Technical │ │ Mock🎯 │        │    │
│  │  └──────┘ └────────┘ └──────────┘ └────────┘        │    │
│  │                                                      │    │
│  │  🎥 Camera Preview                                   │    │
│  │  ┌──────────────────────────────────────────┐        │    │
│  │  │                                          │        │    │
│  │  └──────────────────────────────────────────┘        │    │
│  │                                                      │    │
│  │  [ 🎤 Start Interview →                         ]    │    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Scorecard: Level Calibration Output

The most powerful output of the adaptive system is the **Level Calibration** — telling the candidate where they actually performed, not just what they claimed.

```
┌──────────────────────────────────────────────────────────┐
│  LEVEL CALIBRATION                                        │
│                                                          │
│  You selected: Senior (5-10 yr)                          │
│  Your performance calibrates to: Senior ✓                │
│                                                          │
│  ○────────●─────────○──────────○                         │
│  Junior   Mid    SENIOR    Staff+                        │
│                   ▲ you                                  │
│                                                          │
│  Your adaptive difficulty path:                          │
│  Q1: θ=3.5 → Q2: θ=3.5 → Q3: θ=4.0 → Q4: θ=4.0       │
│  → Q5: θ=3.5 → Q6: θ=4.0                               │
│                                                          │
│  Strongest area: System Design (Senior+)                 │
│  Growth area: Behavioral storytelling (Mid level)         │
│                                                          │
│  Recommendation:                                         │
│  "Your technical depth is solidly Senior and pushing     │
│   toward Staff. Focus on structuring your behavioral     │
│   responses with more concrete metrics and multi-team    │
│   impact examples to match your technical caliber."      │
└──────────────────────────────────────────────────────────┘
```

---

## Summary: What Makes This System Unique

| Feature | Static Systems (Micro1, etc.) | InterviewPilot Adaptive |
|---------|------------------------------|------------------------|
| Difficulty | Fixed per interview type | Dynamic, calibrated per response |
| Seniority | Same questions for all | Fundamentally different questions per level |
| Role awareness | Generic SWE questions | Role-specific (backend vs frontend vs ML) |
| Language | Language-agnostic | Language and framework-specific probing |
| Feedback timing | After interview only | Real-time during + comprehensive after |
| Level calibration | None | "You perform at X level" insight |
| Follow-ups | Scripted or none | Adaptive — harder if you're doing well, supportive if struggling |
| Body language | Not assessed | Vision-based real-time coaching |

This creates an interview coach that genuinely **knows** who it's talking to and adjusts accordingly — just like the best human interviewers do.