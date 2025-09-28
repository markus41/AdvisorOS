-- Initialize CPA Platform Database
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create additional databases for testing
CREATE DATABASE cpa_platform_test;
CREATE DATABASE cpa_platform_shadow;

-- Grant permissions to the user for all databases
GRANT ALL PRIVILEGES ON DATABASE cpa_platform TO cpa_user;
GRANT ALL PRIVILEGES ON DATABASE cpa_platform_test TO cpa_user;
GRANT ALL PRIVILEGES ON DATABASE cpa_platform_shadow TO cpa_user;

-- Create extensions that might be needed
\c cpa_platform;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c cpa_platform_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c cpa_platform_shadow;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";