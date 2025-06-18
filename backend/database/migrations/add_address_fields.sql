-- Migration: Add address fields to user_details table
-- Date: 2024-06-18

-- Add new address fields to user_details table
ALTER TABLE user_details ADD COLUMN contactPhone varchar;
ALTER TABLE user_details ADD COLUMN Country varchar;
ALTER TABLE user_details ADD COLUMN State varchar;
ALTER TABLE user_details ADD COLUMN City varchar;
ALTER TABLE user_details ADD COLUMN fullAddress varchar;

-- Add indexes for better performance on address queries
CREATE INDEX IF NOT EXISTS idx_user_details_contactPhone ON user_details(contactPhone);
CREATE INDEX IF NOT EXISTS idx_user_details_country ON user_details(Country);
CREATE INDEX IF NOT EXISTS idx_user_details_state ON user_details(State);
CREATE INDEX IF NOT EXISTS idx_user_details_city ON user_details(City); 