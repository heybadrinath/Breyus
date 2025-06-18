-- Migration: Add missing address fields to user_details table
-- Date: 2024-06-18

-- Add missing address fields (only the ones that don't exist)
ALTER TABLE user_details ADD COLUMN Country varchar;
ALTER TABLE user_details ADD COLUMN State varchar;
ALTER TABLE user_details ADD COLUMN City varchar;

-- Add indexes for better performance on address queries
CREATE INDEX IF NOT EXISTS idx_user_details_Country ON user_details(Country);
CREATE INDEX IF NOT EXISTS idx_user_details_State ON user_details(State);
CREATE INDEX IF NOT EXISTS idx_user_details_City ON user_details(City); 