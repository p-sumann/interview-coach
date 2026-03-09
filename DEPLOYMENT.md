# Production Deployment — Google Cloud

InterviewPilot runs on a Google Cloud Compute Engine instance with Docker Compose. Deployment is automated via `deploy.sh`.

## Infrastructure Overview

| Component | Service | Details |
|-----------|---------|---------|
| Compute | GCE e2-standard-4 | 4 vCPU, 16GB RAM, Ubuntu 22.04 |
| Container Registry | Artifact Registry | `us-central1-docker.pkg.dev` |
| Reverse Proxy | Nginx | TLS termination, proxies to backend:8000 |
| Domain | Custom domain | `liveapi-hackathon.sumanpaudel.me` |

## Automated Deployment Script

The `deploy.sh` script handles the full build → push → deploy pipeline:

```bash
# Deploy everything
./deploy.sh --all

# Deploy just the agent
./deploy.sh --agent

# Deploy backend + frontend
./deploy.sh --backend --frontend
```

### What the script does:

1. **Builds** Docker images for `linux/amd64` (GCE target architecture)
2. **Pushes** to Google Cloud Artifact Registry
3. **Syncs** docker-compose files and infra configs to the GCE instance
4. **Restarts** services via `gcloud compute ssh`

### Script configuration:

```bash
PROJECT="project-d6320ee8-2d9d-4b08-88d"
REGISTRY="us-central1-docker.pkg.dev/${PROJECT}/interviewpilot"
PROD_HOST="ip-app"          # GCE instance name
PROD_DIR="/home/sumanpaudel/interviewpilot"
```

## Manual Deployment Steps

If you prefer to deploy manually:

```bash
# 1. Build images
docker build --platform linux/amd64 -t ${REGISTRY}/backend:latest ./backend
docker build --platform linux/amd64 -t ${REGISTRY}/agent:latest ./agent
docker build --platform linux/amd64 -t ${REGISTRY}/frontend:latest ./web

# 2. Push to Artifact Registry
docker push ${REGISTRY}/backend:latest
docker push ${REGISTRY}/agent:latest
docker push ${REGISTRY}/frontend:latest

# 3. Deploy on GCE
gcloud compute ssh ip-app --command="
  cd /home/sumanpaudel/interviewpilot &&
  docker compose pull &&
  docker compose up -d
"
```

## Production Docker Compose

The `docker-compose.prod.yml` overrides the dev configuration with:

- **Pre-built images** from Artifact Registry (no source code on server)
- **Gunicorn** with 4 workers for the backend (instead of uvicorn --reload)
- **Resource limits** per service (CPU/memory caps)
- **Log rotation** (50MB max, 5 files per service)
- **Redis** with password auth and AOF persistence
- **Health checks** with retry logic for all services
- **No volume mounts** — all code baked into images

## Environment Variables

Production `.env` on the GCE instance contains:

```env
# Database
POSTGRES_USER=interviewpilot
POSTGRES_PASSWORD=<production-password>
POSTGRES_DB=interviewpilot

# LiveKit
LIVEKIT_URL=wss://<project>.livekit.cloud
LIVEKIT_API_KEY=<key>
LIVEKIT_API_SECRET=<secret>

# Gemini
GOOGLE_API_KEY=<gemini-api-key>

# Frontend
NEXT_PUBLIC_LIVEKIT_URL=wss://<project>.livekit.cloud
NEXT_PUBLIC_API_URL=https://liveapi-hackathon.sumanpaudel.me

# Backend
ENVIRONMENT=production
LOG_LEVEL=info
CORS_ORIGINS=["https://liveapi-hackathon.sumanpaudel.me"]
```

## Nginx Configuration

Nginx runs on the GCE instance as a reverse proxy:

- TLS termination with Let's Encrypt certificates
- Proxies `/api/` requests to the backend container (port 8000)
- Serves the frontend directly (port 3000)
- WebSocket upgrade support for LiveKit connections

## Google Cloud Services Used

1. **Compute Engine** — Hosts all Docker containers (backend, agent, frontend, postgres, redis)
2. **Artifact Registry** — Stores and versions Docker images for each service
3. **Gemini API** (via Google AI Studio key) — Powers the interview agent (Live API), background evaluator (Flash Lite), and scorecard generator

## Verifying Deployment

```bash
# Check all services are healthy
gcloud compute ssh ip-app --command="cd /home/sumanpaudel/interviewpilot && docker compose ps"

# View agent logs
gcloud compute ssh ip-app --command="cd /home/sumanpaudel/interviewpilot && docker compose logs agent --tail=50"

# Check backend health
curl https://liveapi-hackathon.sumanpaudel.me/api/v1/health
```
