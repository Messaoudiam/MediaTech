-- Initialize database for MediaTech
-- This script is executed when the database container starts for the first time

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for pg_stat_statements if not exists
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Set timezone
SET timezone = 'Europe/Paris';

-- Performance optimizations for development
ALTER SYSTEM SET shared_buffers = '128MB';
ALTER SYSTEM SET effective_cache_size = '512MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET work_mem = '4MB';

-- Logging configuration
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Apply configuration
SELECT pg_reload_conf();