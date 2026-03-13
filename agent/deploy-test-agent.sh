#!/usr/bin/env bash
# ============================================================
# Deploy the test tool-calling agent to Google Cloud Run
# ============================================================
# Usage:
#   chmod +x deploy-test-agent.sh
#   ./deploy-test-agent.sh
#
# Prerequisites:
#   - gcloud CLI authenticated (gcloud auth login)
#   - A GCP project set (gcloud config set project YOUR_PROJECT)
#   - Your .env or .env.local has LIVEKIT_URL, LIVEKIT_API_KEY,
#     LIVEKIT_API_SECRET, GOOGLE_API_KEY
#   - lk CLI installed (brew install livekit-cli)
# ============================================================
set -euo pipefail

# --- Config ---
SERVICE_NAME="test-tool-agent"
REGION="${GCP_REGION:-us-central1}"
PROJECT=$(gcloud config get-value project 2>/dev/null)

if [[ -z "$PROJECT" ]]; then
    echo "ERROR: No GCP project set. Run: gcloud config set project YOUR_PROJECT"
    exit 1
fi

echo "=== Deploying test-tool-agent to Cloud Run ==="
echo "Project:  $PROJECT"
echo "Region:   $REGION"
echo "Service:  $SERVICE_NAME"
echo ""

# --- Load env vars from .env / .env.local ---
load_env() {
    local file="$1"
    if [[ -f "$file" ]]; then
        echo "Loading env from $file"
        set -a
        # shellcheck disable=SC1090
        source "$file"
        set +a
    fi
}

# Load from repo root first, then agent dir
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
load_env "$SCRIPT_DIR/../.env"
load_env "$SCRIPT_DIR/../.env.local"
load_env "$SCRIPT_DIR/.env"
load_env "$SCRIPT_DIR/.env.local"

# --- Validate required env vars ---
REQUIRED_VARS=(LIVEKIT_URL LIVEKIT_API_KEY LIVEKIT_API_SECRET GOOGLE_API_KEY)
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo "ERROR: $var is not set. Check your .env files."
        exit 1
    fi
done

echo ""
echo "LIVEKIT_URL: $LIVEKIT_URL"
echo "GOOGLE_API_KEY: ${GOOGLE_API_KEY:0:10}..."
echo ""

# --- Enable required APIs (idempotent) ---
echo "Enabling Cloud Run & Artifact Registry APIs..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com --quiet

# --- Create Artifact Registry repo if it doesn't exist ---
REPO_NAME="interview-pilot"
AR_REPO="${REGION}-docker.pkg.dev/${PROJECT}/${REPO_NAME}"

if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
    echo "Creating Artifact Registry repo: $REPO_NAME"
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --quiet
fi

# --- Configure Docker auth ---
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# --- Build & push ---
IMAGE="${AR_REPO}/${SERVICE_NAME}:latest"
echo ""
echo "Building image: $IMAGE"
echo ""

docker build \
    -f Dockerfile.test \
    --target production \
    --platform linux/amd64 \
    -t "$IMAGE" \
    .

echo ""
echo "Pushing image..."
docker push "$IMAGE"

# --- Deploy to Cloud Run ---
echo ""
echo "Deploying to Cloud Run..."

# LiveKit agent is a long-lived worker that connects outbound to LiveKit Cloud.
# Cloud Run needs a listening port for health checks — the agent's built-in
# HTTP server handles this on $PORT (8080).
# no-cpu-throttling keeps the agent alive between requests (required for
# persistent WebSocket connections to LiveKit).
gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --memory=2Gi \
    --cpu=2 \
    --min-instances=1 \
    --max-instances=1 \
    --timeout=900 \
    --no-cpu-throttling \
    --cpu-boost \
    --port=8081 \
    --set-env-vars="\
LIVEKIT_URL=${LIVEKIT_URL},\
LIVEKIT_API_KEY=${LIVEKIT_API_KEY},\
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET},\
GOOGLE_API_KEY=${GOOGLE_API_KEY},\
LK_GOOGLE_DEBUG=1,\
PYTHONUNBUFFERED=1" \
    --quiet

echo ""
echo "========================================="
echo "  Deployment complete!"
echo "========================================="
echo ""
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)" 2>/dev/null)
echo "Service URL: $SERVICE_URL"
echo ""
echo "--- Stream logs ---"
echo "  gcloud run logs tail $SERVICE_NAME --region=$REGION"
echo ""
echo "--- Generate a token for https://meet.livekit.io ---"
ROOM_NAME="test-weather-$(date +%s)"
echo ""
echo "  lk token create \\"
echo "    --api-key $LIVEKIT_API_KEY \\"
echo "    --api-secret $LIVEKIT_API_SECRET \\"
echo "    --join --room $ROOM_NAME \\"
echo "    --identity user-suman \\"
echo "    --valid-for 1h \\"
echo "    --agent-name test-agent"
echo ""
echo "Then go to: https://meet.livekit.io"
echo "  - Paste your LiveKit URL: $LIVEKIT_URL"
echo "  - Paste the generated token"
echo "  - Click Connect"
echo "  - Say: 'what's the weather in Tokyo?'"
echo ""
echo "--- Cleanup ---"
echo "  gcloud run services delete $SERVICE_NAME --region=$REGION --quiet"
