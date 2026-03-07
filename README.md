# InterviewPilot

AI-powered interview practice coach that sees you, hears you, and coaches you in real time. Built on Gemini Live API's native audio+vision and delivered over LiveKit's WebRTC infrastructure.

## What It Does

InterviewPilot conducts realistic mock interviews with adaptive difficulty calibration. It watches your body language via webcam, listens to your spoken answers, and provides real-time coaching feedback — all through natural voice conversation with distinct AI interviewer personas.

**Four interview modes:**

- **HR** — Culture fit, motivation, and soft skills with Marcus (Charon voice)
- **Behavioral** — STAR-format deep dives with Sarah (Kore voice)
- **Technical** — System design and coding concepts with Alex (Puck voice)
- **Mock (Full Round)** — All three interviewers in sequence with live handoffs

**Key capabilities:**

- Vision-based body language analysis (posture, eye contact, gestures)
- Vocal intelligence (pace, filler words, confidence)
- Adaptive difficulty engine (theta-based IRT, adjusts per answer)
- Real-time coaching dashboard with live metrics
- Post-interview scorecard with timestamped feedback and level calibration

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js    │────▶│   FastAPI    │────▶│  PostgreSQL  │
│   Frontend   │     │   Backend    │     │  + Redis     │
│  (LiveKit    │     │  (Sessions,  │     │              │
│   React SDK) │     │   Feedback,  │     └──────────────┘
└──────┬───────┘     │   Scorecards)│
       │             └──────────────┘
       │ WebRTC
       ▼
┌──────────────┐     ┌──────────────┐
│   LiveKit    │────▶│  AI Agent    │
│   Cloud      │     │  (Gemini     │
│   (SFU)      │     │   Live API)  │
└──────────────┘     └──────────────┘
```

## Monorepo Structure

```
interviewpilot/
├── web/                  # Next.js 16 frontend (TypeScript, Tailwind 4, shadcn/ui)
│   └── src/
│       ├── app/          # App Router pages (landing, setup, interview, scorecard)
│       ├── components/   # UI components (interview/, scorecard/, landing/, setup/, shared/)
│       ├── hooks/        # Custom React hooks (session, timer, simulation)
│       └── lib/          # API client, types, constants, utilities
│
├── backend/              # FastAPI backend (Python 3.13, async)
│   ├── app/
│   │   ├── api/v1/       # REST endpoints (sessions, feedback, scorecards, coaching)
│   │   ├── models/       # SQLAlchemy models (session, feedback, scorecard)
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # Business logic layer
│   │   ├── middleware/    # Rate limiting, request ID, security headers, access logs
│   │   ├── db/           # Async engine + session management
│   │   └── redis/        # Redis client for real-time pub/sub
│   └── alembic/          # Database migrations
│
├── agent/                # LiveKit AI Agent (Python, Gemini Live API)
│   ├── agents/           # Interview agent classes (HR, Behavioral, Technical, Mock)
│   ├── core/             # Personas, seniority profiles, adaptive engine
│   ├── config/           # Agent configuration
│   └── question_banks/   # JSON Q&A banks per language and level
│
├── infra/                # Infrastructure configs
│   └── postgres/         # Init SQL scripts
│
├── docs/                 # Project documentation
│   ├── architecture.md   # System design and architecture overview
│   ├── adaptive-system.md # Adaptive difficulty calibration design
│   ├── interview-modes.md # Interview mode specifications
│   └── frontend.md       # Frontend design specification
│
├── docker-compose.yml        # Development stack
├── docker-compose.prod.yml   # Production overrides
└── .env.example              # Environment variable template
```

## Prerequisites

- **Docker & Docker Compose** (v2.20+)
- **pnpm** (v9+) — for frontend development
- **uv** (v0.5+) — for Python dependency management
- **LiveKit Cloud account** — [livekit.io](https://livekit.io)
- **Google AI Studio API key** — for Gemini Live API

## Quick Start

1. **Clone and configure environment:**

```bash
cp .env.example .env
# Edit .env with your LiveKit and Google API keys
```

2. **Start infrastructure (Postgres + Redis):**

```bash
docker compose up -d postgres redis
```

3. **Start the backend:**

```bash
docker compose up -d backend
```

4. **Start the AI agent:**

```bash
docker compose --profile agent up -d agent
```

5. **Start the frontend (local dev):**

```bash
cd web
pnpm install
pnpm dev
```

Or run everything via Docker:

```bash
docker compose --profile agent --profile frontend up -d
```

Visit `http://localhost:3000` to start an interview.

## Development

**Backend:**

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

**Frontend:**

```bash
cd web
pnpm install
pnpm dev
```

**Agent:**

```bash
cd agent
uv sync
uv run python agent.py dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/sessions` | Create interview session |
| GET | `/api/v1/sessions/{id}` | Get session details |
| POST | `/api/v1/sessions/{id}/start` | Start session |
| POST | `/api/v1/sessions/{id}/end` | End session |
| POST | `/api/v1/feedback` | Submit real-time feedback |
| POST | `/api/v1/coaching/note` | Log coaching observation |
| GET | `/api/v1/scorecards/{session_id}` | Get scorecard |
| POST | `/api/v1/token` | Generate LiveKit token |
| GET | `/api/v1/health` | Health check |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Recharts |
| Backend | FastAPI, SQLAlchemy (async), Alembic, Pydantic v2, structlog |
| AI Agent | LiveKit Agents SDK, Gemini 2.5 Flash (Live API), Silero VAD |
| Database | PostgreSQL 16, Redis 7 |
| Realtime | LiveKit Cloud (WebRTC SFU), LiveKit data channels |
| Infrastructure | Docker Compose, uv (Python), pnpm (Node) |

## License

Private — all rights reserved.
