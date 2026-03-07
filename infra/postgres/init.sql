-- InterviewPilot PostgreSQL Initialization
-- Runs ONLY on first database creation (empty volume).
-- Alembic handles all schema migrations after this.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
