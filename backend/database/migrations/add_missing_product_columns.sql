-- Add missing columns to products table that exist in the entity but not in database
-- This migration addresses the missing preferred_buyer_revenue_range and related columns

ALTER TABLE products ADD COLUMN preferred_buyer_revenue_range TEXT;
ALTER TABLE products ADD COLUMN potential_years_to_trade VARCHAR(255);
ALTER TABLE products ADD COLUMN industry_using_product VARCHAR(255);
ALTER TABLE products ADD COLUMN years_in_market VARCHAR(255);
ALTER TABLE products ADD COLUMN buyer_market_duration VARCHAR(255);
ALTER TABLE products ADD COLUMN buyer_market_capture DECIMAL(5,2);
ALTER TABLE products ADD COLUMN market_capture DECIMAL(5,2);
ALTER TABLE products ADD COLUMN primaryImage TEXT;
