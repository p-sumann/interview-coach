# InterviewPilot — Claude Code Project Context

## What This Project Is

InterviewPilot is a real-time AI interview coaching platform. It conducts mock interviews via voice conversation (Gemini Live API over LiveKit WebRTC), watches the candidate via webcam, provides real-time coaching feedback, and generates a post-interview scorecard.

## Monorepo Layout

- `web/` — Next.js 16 frontend (TypeScript, Tailwind 4, shadcn/ui, React 19)
- `backend/` — FastAPI backend (Python 3.13, async SQLAlchemy, Alembic, Redis)
- `agent/` — LiveKit AI Agent (Python, Gemini Live API, adaptive interview engine)
- `infra/` — Infrastructure configs (Postgres init scripts)
- `docs/` — Design specifications and architecture documents

## Key Architecture Decisions

- **Monorepo with Docker Compose** — three services (web, backend, agent) plus Postgres and Redis
- **Real-time communication** via LiveKit data channels (not REST polling) for feedback and coaching notes
- **Adaptive difficulty engine** uses Item Response Theory (theta parameter) to adjust question difficulty per candidate response
- **Multi-agent handoff** for mock interviews — HR → Behavioral → Technical with distinct Gemini voice personas
- **Question banks** in `agent/question_banks/` provide JSON context for the AI agent across 5 languages and 4 levels

## Coding Conventions

### Python (backend + agent)
- Python 3.13, managed with `uv`
- Async everywhere (asyncpg, aiohttp, async SQLAlchemy)
- Pydantic v2 for schemas, structlog for logging
- Alembic for database migrations
- Type hints required on all function signatures

### TypeScript (web)
- Next.js App Router with Server Components where possible
- shadcn/ui for all UI components (installed via CLI, lives in `src/components/ui/`)
- Tailwind CSS 4 for styling (no CSS modules)
- pnpm as package manager
- LiveKit React SDK for real-time features

### General
- Docker Compose for local dev, `.env` for configuration
- All API endpoints under `/api/v1/`
- Frontend talks to backend via REST, agent talks to backend via internal HTTP
- Real-time data flows through LiveKit data channels to the frontend

## Common Tasks

- **Add a new API endpoint**: Create route in `backend/app/api/v1/`, add schema in `backend/app/schemas/`, add service in `backend/app/services/`, register in `backend/app/api/router.py`
- **Add a new UI component**: Create in `web/src/components/{section}/`, use shadcn/ui primitives from `web/src/components/ui/`
- **Modify the AI agent**: Agent classes in `agent/agents/`, personas in `agent/core/`, prompts built dynamically in `agent/prompts.py`
- **Add question bank content**: Add to JSON files in `agent/question_banks/`
- **Database migration**: `cd backend && uv run alembic revision --autogenerate -m "description"` then `uv run alembic upgrade head`

## Environment Variables

See `.env.example` at repo root. Key variables:
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` — LiveKit Cloud
- `GOOGLE_API_KEY` — Gemini Live API
- `POSTGRES_*` — Database credentials
- `NEXT_PUBLIC_LIVEKIT_URL`, `NEXT_PUBLIC_API_URL` — Frontend public config

## Do Not

- Do not commit `.env` files
- Do not modify `web/src/components/ui/` manually (managed by shadcn CLI)
- Do not add `node_modules/` or `.venv/` to version control
- Do not use synchronous database calls in the backend (everything is async)
