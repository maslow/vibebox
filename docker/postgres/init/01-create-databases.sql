-- VibeBox PostgreSQL Initialization Script
-- This script runs automatically when the PostgreSQL container is first created
-- It creates the necessary databases for Logto, VibeBox, and Happy Server

-- Create Logto database (for authentication service)
CREATE DATABASE logto;

-- Create VibeBox database (main application database)
CREATE DATABASE vibebox;

-- Create Happy database (for self-hosted Happy Server)
CREATE DATABASE happy;

-- Grant privileges (optional, postgres user already has all privileges)
-- GRANT ALL PRIVILEGES ON DATABASE logto TO postgres;
-- GRANT ALL PRIVILEGES ON DATABASE vibebox TO postgres;
-- GRANT ALL PRIVILEGES ON DATABASE happy TO postgres;

-- Display created databases
SELECT datname FROM pg_database WHERE datname IN ('logto', 'vibebox', 'happy');
