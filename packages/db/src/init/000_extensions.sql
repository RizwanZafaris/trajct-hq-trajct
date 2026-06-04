-- Runs at container startup via docker-entrypoint-initdb.d/
-- Enables pgvector extension and creates the vectors schema.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE SCHEMA IF NOT EXISTS vectors;
