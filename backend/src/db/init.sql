-- Flagship Database Initialization
-- This script runs automatically when the Postgres container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create environment enum
CREATE TYPE environment AS ENUM ('prod', 'staging', 'development');

-- Feature Flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    environment environment NOT NULL DEFAULT 'development',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on key for fast lookups (hot path)
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for development
INSERT INTO feature_flags (key, description, enabled, rollout_percentage, environment)
VALUES
    ('checkout_redesign', 'New checkout flow with improved UX', true, 50, 'staging'),
    ('dark_mode', 'Enable dark mode theme', true, 100, 'development'),
    ('new_pricing_page', 'Updated pricing page layout', false, 0, 'prod')
ON CONFLICT (key) DO NOTHING;
