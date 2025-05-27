-- Add seller_id column to analytics tables if it doesn't exist.
-- Note: ALTER TABLE ADD COLUMN will error if the column already exists.
-- This script is intended to be run to ensure the column is present before creating indexes.

BEGIN TRANSACTION;

-- Attempt to add seller_id to store_visits
-- We can't use IF NOT EXISTS directly with ADD COLUMN in older SQLite, so this might error if run multiple times.
-- A more robust way involves PRAGMA table_info and conditional execution, which is complex for a simple SQL script.
ALTER TABLE store_visits ADD COLUMN seller_id TEXT;

-- Attempt to add seller_id to analytics_sales
ALTER TABLE analytics_sales ADD COLUMN seller_id TEXT;

-- Attempt to add seller_id to tasks
ALTER TABLE tasks ADD COLUMN seller_id TEXT;

COMMIT; 