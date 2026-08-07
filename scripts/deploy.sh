#!/usr/bin/env bash
#
# Deployment on the EC2 instance. Run by AWS SSM (AWS-RunShellScript document)
# invoked from the workflow's "deploy" job.
#
# It can also be run by hand on the instance for debugging:
#   sudo APP_IMAGE=lysanderpr/entertainments:1.4.0 GIT_SHA=main bash deploy.sh
#
# Variables injected by the workflow before this script:
#   APP_IMAGE  image with the exact version tag to deploy
#   GIT_SHA    commit the infrastructure files are downloaded from
#
# NOTE: SSM runs as root, not as ubuntu. That is why every path is absolute:
# "~" would point to /root and the .env would not be found.

set -euo pipefail

APP_DIR=/home/ubuntu/entertainment-catalog
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yaml"
COMPOSE="docker compose -f $COMPOSE_FILE"
RAW_BASE="https://raw.githubusercontent.com/Lysander-PR/entertainment-catalog"

: "${APP_IMAGE:?APP_IMAGE is missing}"
: "${GIT_SHA:?GIT_SHA is missing}"
export APP_IMAGE

echo "==> Deploying $APP_IMAGE (commit $GIT_SHA)"

cd "$APP_DIR"

# The .env is maintained by hand on the server; the pipeline never
# touches it. If it does not exist, the apps would start without configuration
# and Zod validation would fail with a much less clear error than this one.
if [ ! -f "$APP_DIR/.env" ]; then
  echo "ERROR: $APP_DIR/.env does not exist" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Infrastructure files, pinned to the exact commit
# ---------------------------------------------------------------------------
# No SSH means no SCP. Since the repository is public, the instance downloads
# them from raw.githubusercontent.com using the SHA instead of a branch: that
# way the deployment is reproducible and does not depend on whatever is in main
# right now.
#
# IF THE REPO BECOMES PRIVATE THIS STOPS WORKING (404). In that case they would
# have to be uploaded to S3 from the runner or embedded in the SSM command.
echo "==> Downloading infrastructure files"
for f in docker-compose.prod.yaml nginx.conf; do
  curl -fsSL "$RAW_BASE/$GIT_SHA/$f" -o "$APP_DIR/$f.new"
  mv "$APP_DIR/$f.new" "$APP_DIR/$f"
  # Keep them editable by ubuntu: SSM runs as root and otherwise they could not
  # be modified when connecting over SSH.
  chown ubuntu:ubuntu "$APP_DIR/$f"
done

# ---------------------------------------------------------------------------
# 2. Pull the new image
# ---------------------------------------------------------------------------
echo "==> Pulling the image"
$COMPOSE pull

# ---------------------------------------------------------------------------
# 3. Dependencies before the migrations
# ---------------------------------------------------------------------------
# --wait waits for the postgres healthcheck (pg_isready). Without this, the
# migration would try to connect before Postgres accepts connections.
echo "==> Starting postgres and redis"
$COMPOSE up -d --wait postgres redis

# ---------------------------------------------------------------------------
# 4. Migrations
# ---------------------------------------------------------------------------
# In production synchronize:false and migrationsRun:false, so they have to be
# applied explicitly. An ephemeral container with the NEW image is used (--rm)
# and without dependencies (--no-deps, they are already up). It inherits the
# .env and the compose network.
#
# This runs BEFORE starting the replicas: if it ran after, the old and new
# replicas would coexist against different schemas.
echo "==> Applying migrations"
$COMPOSE run --rm --no-deps app1 \
  node node_modules/typeorm/cli.js migration:run -d dist/config/typeorm.config.js

# ---------------------------------------------------------------------------
# 5. Replicas and nginx
# ---------------------------------------------------------------------------
echo "==> Starting the application"
$COMPOSE up -d --wait

# ---------------------------------------------------------------------------
# 6. Smoke check, from inside the instance
# ---------------------------------------------------------------------------
# It is done on localhost and not from the GitHub runner on purpose: that way it
# works the same even if port 80 is not open to the internet.
# /api serves the Swagger UI and responds 200 without authentication.
echo "==> Checking that the API responds"
for i in $(seq 1 10); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost/api || true)
  if [ "$code" = "200" ]; then
    echo "OK: the API responds 200"
    break
  fi
  echo "attempt $i: HTTP $code"
  if [ "$i" = "10" ]; then
    echo "ERROR: the API did not respond 200 after the deployment" >&2
    $COMPOSE logs --tail=40 app1 nginx >&2
    exit 1
  fi
  sleep 6
done

# ---------------------------------------------------------------------------
# 7. Cleanup
# ---------------------------------------------------------------------------
# Images from previous versions pile up and fill the EBS disk. The second to
# last one is kept in case a quick rollback is needed.
echo "==> Pruning unused images"
docker image prune -f

echo "==> Deployment finished: $APP_IMAGE"
$COMPOSE ps
