-- Setup script for local PostgreSQL installation
-- Run this script as the postgres superuser to set up the CPA platform database

-- Create the application user
CREATE USER cpa_user WITH PASSWORD 'secure_dev_password';

-- Create the main database
CREATE DATABASE cpa_platform OWNER cpa_user;

-- Create test database
CREATE DATABASE cpa_platform_test OWNER cpa_user;

-- Create shadow database for Prisma migrations
CREATE DATABASE cpa_platform_shadow OWNER cpa_user;

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE cpa_platform TO cpa_user;
GRANT ALL PRIVILEGES ON DATABASE cpa_platform_test TO cpa_user;
GRANT ALL PRIVILEGES ON DATABASE cpa_platform_shadow TO cpa_user;

-- Connect to the main database and create extensions
\c cpa_platform;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO cpa_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cpa_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cpa_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cpa_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cpa_user;

-- Connect to test database and set up extensions
\c cpa_platform_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL ON SCHEMA public TO cpa_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cpa_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cpa_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cpa_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cpa_user;

-- Connect to shadow database and set up extensions
\c cpa_platform_shadow;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
GRANT ALL ON SCHEMA public TO cpa_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cpa_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cpa_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cpa_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cpa_user;

-- Show completion message
\echo ''
\echo 'Database setup completed successfully!'
\echo 'Connection string: postgresql://cpa_user:secure_dev_password@localhost:5432/cpa_platform'
\echo ''