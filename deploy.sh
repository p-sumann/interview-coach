#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# InterviewPilot — Deploy to production
# ============================================================
# Usage:
#   ./deploy.sh              # Deploy backend + agent
#   ./deploy.sh --all        # Deploy backend + agent + frontend
#   ./deploy.sh --agent      # Deploy agent only
#   ./deploy.sh --backend    # Deploy backend only
# ============================================================

# --- Configuration (edit these or set as env vars) ---
PROJECT="${PROJECT:-project-d6320ee8-2d9d-4b08-88d}"
REGISTRY="${REGISTRY:-us-central1-docker.pkg.dev/${PROJECT}/interviewpilot}"
PROD_HOST="${PROD_HOST:-ip-app}"
PROD_DIR="${PROD_DIR:-/home/sumanpaudel/interviewpilot}"
TAG="${TAG:-latest}"
PLATFORM="${PLATFORM:-linux/amd64}"

# --- Parse args ---
DEPLOY_BACKEND=false
DEPLOY_AGENT=false
DEPLOY_FRONTEND=false

case "${1:-}" in
  --all)      DEPLOY_BACKEND=true; DEPLOY_AGENT=true; DEPLOY_FRONTEND=true ;;
  --agent)    DEPLOY_AGENT=true ;;
  --backend)  DEPLOY_BACKEND=true ;;
  --frontend) DEPLOY_FRONTEND=true ;;
  *)          DEPLOY_BACKEND=true; DEPLOY_AGENT=true ;;  # default: backend + agent
esac

echo "==> Registry: $REGISTRY"
echo "==> Tag: $TAG"
echo "==> Host: $PROD_HOST:$PROD_DIR"
echo ""

# --- Build & push images ---
if $DEPLOY_BACKEND; then
  echo "==> Building backend..."
  docker build --platform "$PLATFORM" -t "$REGISTRY/backend:$TAG" ./backend
  echo "==> Pushing backend..."
  docker push "$REGISTRY/backend:$TAG"
fi

if $DEPLOY_AGENT; then
  echo "==> Building agent..."
  docker build --platform "$PLATFORM" -t "$REGISTRY/agent:$TAG" ./agent
  echo "==> Pushing agent..."
  docker push "$REGISTRY/agent:$TAG"
fi

if $DEPLOY_FRONTEND; then
  echo "==> Building frontend..."
  docker build --platform "$PLATFORM" -t "$REGISTRY/frontend:$TAG" ./web
  echo "==> Pushing frontend..."
  docker push "$REGISTRY/frontend:$TAG"
fi

# --- Sync compose files + infra to server ---
echo ""
echo "==> Syncing compose files and infra to server..."
rsync -avz --relative \
  docker-compose.yml \
  docker-compose.prod.yml \
  infra/ \
  "$PROD_HOST:$PROD_DIR/"

# --- Deploy on server ---
echo ""
echo "==> Deploying on server..."

SERVICES=""
$DEPLOY_BACKEND  && SERVICES="$SERVICES backend"
$DEPLOY_AGENT    && SERVICES="$SERVICES agent"
$DEPLOY_FRONTEND && SERVICES="$SERVICES frontend"

ssh "$PROD_HOST" bash -s <<REMOTE
  set -euo pipefail
  cd "$PROD_DIR"
  export REGISTRY="$REGISTRY"
  export TAG="$TAG"

  echo "  -> Pulling images..."
  docker compose -f docker-compose.yml -f docker-compose.prod.yml pull $SERVICES

  echo "  -> Restarting services..."
  docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d $SERVICES

  echo "  -> Waiting for health checks..."
  sleep 5
  docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
REMOTE

echo ""
echo "==> Deploy complete!"
