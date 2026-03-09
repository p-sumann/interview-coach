#!/bin/bash
set -e

echo "==> InterviewPilot Backend Starting..."

# ---- Wait for PostgreSQL (using Python/asyncpg, no pg_isready needed) ----
if [ -n "$DATABASE_URL" ]; then
    echo "==> Waiting for PostgreSQL..."

    python -c "
import asyncio, asyncpg, sys, time

async def wait():
    url = '$DATABASE_URL'.replace('postgresql+asyncpg://', 'postgresql://')
    for i in range(30):
        try:
            conn = await asyncpg.connect(url)
            await conn.close()
            return
        except Exception:
            print(f'    Waiting for PostgreSQL... ({i+1}/30)')
            await asyncio.sleep(1)
    print('ERROR: PostgreSQL not available after 30 attempts')
    sys.exit(1)

asyncio.run(wait())
"

    echo "==> PostgreSQL is ready."
fi

# ---- Run Alembic Migrations ----
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "==> Running Alembic migrations..."
    alembic upgrade head
    echo "==> Migrations complete."
else
    echo "==> Skipping migrations (RUN_MIGRATIONS=false)"
fi

# ---- Start Application ----
echo "==> Starting application..."
exec "$@"
