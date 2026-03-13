#!/usr/bin/env bash
# ============================================================
# Deploy the test tool-calling agent to GCE (ip-agent VM)
# ============================================================
# Usage:
#   chmod +x deploy-test-gce.sh
#   ./deploy-test-gce.sh
# ============================================================
set -euo pipefail

# --- Config ---
VM_NAME="ip-agent"
ZONE="us-central1-a"
REGION="us-central1"
PROJECT=$(gcloud config get-value project 2>/dev/null)
IMAGE_NAME="test-tool-agent"
AR_REPO="${REGION}-docker.pkg.dev/${PROJECT}/interview-pilot"
IMAGE="${AR_REPO}/${IMAGE_NAME}:latest"

# --- Load env vars ---
load_env() {
    local file="$1"
    if [[ -f "$file" ]]; then
        echo "Loading env from $file"
        set -a
        source "$file"
        set +a
    fi
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
load_env "$SCRIPT_DIR/../.env"
load_env "$SCRIPT_DIR/../.env.local"
load_env "$SCRIPT_DIR/.env"
load_env "$SCRIPT_DIR/.env.local"

# --- Validate ---
REQUIRED_VARS=(LIVEKIT_URL LIVEKIT_API_KEY LIVEKIT_API_SECRET GOOGLE_API_KEY)
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo "ERROR: $var is not set."
        exit 1
    fi
done

echo "=== Deploying test-tool-agent to GCE ($VM_NAME) ==="
echo "Project: $PROJECT"
echo "VM:      $VM_NAME ($ZONE)"
echo "Image:   $IMAGE"
echo ""

# --- Build & push image (reuse Artifact Registry) ---
echo "Building image..."
docker build \
    -f Dockerfile.test \
    --target production \
    --platform linux/amd64 \
    -t "$IMAGE" \
    .

echo "Pushing image..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
docker push "$IMAGE"

# --- Deploy to VM via SSH ---
echo ""
echo "Deploying to $VM_NAME..."

gcloud compute ssh "$VM_NAME" --zone="$ZONE" --command="
    # Auth to Artifact Registry
    docker-credential-gcr configure-docker --registries=${REGION}-docker.pkg.dev 2>/dev/null || true

    # Stop old container if running
    docker rm -f test-tool-agent 2>/dev/null || true

    # Pull latest
    docker pull ${IMAGE}

    # Run the agent
    docker run -d \
        --name test-tool-agent \
        --restart unless-stopped \
        -e LIVEKIT_URL='${LIVEKIT_URL}' \
        -e LIVEKIT_API_KEY='${LIVEKIT_API_KEY}' \
        -e LIVEKIT_API_SECRET='${LIVEKIT_API_SECRET}' \
        -e GOOGLE_API_KEY='${GOOGLE_API_KEY}' \
        -e LK_GOOGLE_DEBUG=1 \
        -e PYTHONUNBUFFERED=1 \
        ${IMAGE}

    echo ''
    echo 'Container started. Checking logs...'
    sleep 3
    docker logs test-tool-agent 2>&1 | tail -20
"

echo ""
echo "========================================="
echo "  Deployed to GCE!"
echo "========================================="
echo ""
echo "--- Tail logs ---"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE --command='docker logs -f test-tool-agent'"
echo ""
echo "--- Generate token ---"
ROOM_NAME="test-weather-\$(date +%s)"
echo "  lk token create \\"
echo "    --api-key $LIVEKIT_API_KEY \\"
echo "    --api-secret $LIVEKIT_API_SECRET \\"
echo "    --join --room $ROOM_NAME \\"
echo "    --identity user-suman \\"
echo "    --valid-for 1h \\"
echo "    --agent-name test-agent"
echo ""
echo "Then: https://meet.livekit.io"
echo "  - URL: $LIVEKIT_URL"
echo "  - Paste the token"
echo ""
echo "--- Cleanup ---"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE --command='docker rm -f test-tool-agent'"
