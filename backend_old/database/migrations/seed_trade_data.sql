-- Seed data for trades table
-- This will create sample trade requests for testing the trade management system

-- First, let's check what users and products exist
-- REPLACE the user IDs and product IDs below with actual ones from your database

-- Sample trade requests - ADJUST IDs based on your actual data
-- You can get seller ID by calling GET /analytics/debug/user while logged in as seller
-- CURRENT SELLER_ID: 37eb01fc-58b0-426f-9334-8a21f0d9cea5

DELETE FROM trades;

-- Create sample trade requests
INSERT INTO trades (
  id,
  buyer_id,
  seller_id,
  product_id,
  status,
  trade_type,
  offered_price,
  counter_offer_price,
  quantity,
  buyer_message,
  seller_message,
  rejection_reason,
  trade_terms,
  shipping_details,
  expires_at,
  accepted_at,
  completed_at,
  final_price,
  is_urgent,
  counter_offer_count,
  created_at,
  updated_at
) VALUES

-- Pending urgent trade request
(
  '550e8400-e29b-41d4-a716-446655440001',
  'buyer-uuid-1', -- Replace with actual buyer ID
  '37eb01fc-58b0-426f-9334-8a21f0d9cea5', -- Replace with actual seller ID
  'product-uuid-1', -- Replace with actual product ID
  'pending',
  'purchase_request',
  89.99,
  NULL,
  5,
  'Urgent! Need this product ASAP for a client project. Can pay immediately upon acceptance.',
  NULL,
  NULL,
  '{"delivery_terms": "express", "payment_method": "wire_transfer"}',
  '{"address": "123 Business St, NYC", "delivery_type": "express"}',
  datetime('now', '+24 hours'),
  NULL,
  NULL,
  NULL,
  1, -- urgent
  0,
  datetime('now', '-2 hours'),
  datetime('now', '-2 hours')
),

-- Regular pending trade request
(
  '550e8400-e29b-41d4-a716-446655440002',
  'buyer-uuid-2', -- Replace with actual buyer ID
  '37eb01fc-58b0-426f-9334-8a21f0d9cea5',
  'product-uuid-2', -- Replace with actual product ID
  'pending',
  'bulk_order',
  45.50,
  NULL,
  10,
  'Looking for bulk pricing on this item. Regular customer, always pay on time.',
  NULL,
  NULL,
  '{"bulk_discount": "requested", "payment_terms": "30_days"}',
  '{"address": "456 Commerce Ave, LA", "delivery_type": "standard"}',
  datetime('now', '+22 hours'),
  NULL,
  NULL,
  NULL,
  0, -- not urgent
  0,
  datetime('now', '-5 hours'),
  datetime('now', '-5 hours')
),

-- Counter offered trade
(
  '550e8400-e29b-41d4-a716-446655440003',
  'buyer-uuid-3', -- Replace with actual buyer ID
  '37eb01fc-58b0-426f-9334-8a21f0d9cea5',
  'product-uuid-3', -- Replace with actual product ID
  'counter_offered',
  'purchase_request',
  120.00,
  135.00,
  3,
  'Interested in this product. Is there room for negotiation on price?',
  'Thanks for your interest! I can offer this at $135 each for quantity of 3. This includes premium packaging.',
  NULL,
  '{"warranty": "1_year", "premium_packaging": true}',
  '{"address": "789 Trade Blvd, Chicago", "delivery_type": "standard"}',
  datetime('now', '+20 hours'),
  NULL,
  NULL,
  NULL,
  0,
  1,
  datetime('now', '-1 days'),
  datetime('now', '-3 hours')
),

-- Accepted trade
(
  '550e8400-e29b-41d4-a716-446655440004',
  'buyer-uuid-4', -- Replace with actual buyer ID
  '37eb01fc-58b0-426f-9334-8a21f0d9cea5',
  'product-uuid-4', -- Replace with actual product ID
  'accepted',
  'purchase_request',
  75.00,
  NULL,
  2,
  'Great product! Ready to purchase at listed price.',
  'Excellent! Processing your order now. Will ship within 24 hours.',
  NULL,
  '{"payment_method": "credit_card", "shipping": "expedited"}',
  '{"address": "321 Market St, Seattle", "delivery_type": "expedited"}',
  datetime('now', '+18 hours'),
  datetime('now', '-1 hours'),
  NULL,
  75.00,
  0,
  0,
  datetime('now', '-2 days'),
  datetime('now', '-1 hours')
),

-- Rejected trade
(
  '550e8400-e29b-41d4-a716-446655440005',
  'buyer-uuid-5', -- Replace with actual buyer ID
  '37eb01fc-58b0-426f-9334-8a21f0d9cea5',
  'product-uuid-5', -- Replace with actual product ID
  'rejected',
  'purchase_request',
  25.00,
  NULL,
  50,
  'Bulk order request. Can you match this price for 50 units?',
  NULL,
  'Unfortunately, the offered price is below our cost. Minimum price for this quantity would be $35 per unit.',
  '{"minimum_order": 50, "bulk_pricing": true}',
  '{"address": "654 Industrial Dr, Houston", "delivery_type": "freight"}',
  datetime('now', '+16 hours'),
  NULL,
  NULL,
  NULL,
  0,
  0,
  datetime('now', '-3 days'),
  datetime('now', '-1 days')
),

-- Expired trade
(
  '550e8400-e29b-41d4-a716-446655440006',
  'buyer-uuid-6', -- Replace with actual buyer ID
  '37eb01fc-58b0-426f-9334-8a21f0d9cea5',
  'product-uuid-6', -- Replace with actual product ID
  'expired',
  'purchase_request',
  99.99,
  NULL,
  1,
  'Interested in this item. Please let me know if available.',
  NULL,
  NULL,
  '{"payment_method": "paypal"}',
  '{"address": "987 Consumer Lane, Miami", "delivery_type": "standard"}',
  datetime('now', '-2 hours'), -- Already expired
  NULL,
  NULL,
  NULL,
  0,
  0,
  datetime('now', '-3 days'),
  datetime('now', '-3 days')
),

-- Another pending trade (recent)
(
  '550e8400-e29b-41d4-a716-446655440007',
  'buyer-uuid-7', -- Replace with actual buyer ID
  '37eb01fc-58b0-426f-9334-8a21f0d9cea5',
  'product-uuid-7', -- Replace with actual product ID
  'pending',
  'spot_trade',
  67.50,
  NULL,
  8,
  'Saw your product online. Quick question about specifications before I commit to purchase.',
  NULL,
  NULL,
  '{"specifications_query": true}',
  '{"address": "147 Retail Rd, Denver", "delivery_type": "standard"}',
  datetime('now', '+23 hours'),
  NULL,
  NULL,
  NULL,
  0,
  0,
  datetime('now', '-30 minutes'),
  datetime('now', '-30 minutes')
);

-- Note: You'll need to replace the buyer_id and product_id values with actual UUIDs from your users and products tables
-- You can find these by running:
-- SELECT id, email FROM users WHERE role = 'buyer' LIMIT 10;
-- SELECT id, name FROM products WHERE sellerId = '37eb01fc-58b0-426f-9334-8a21f0d9cea5' LIMIT 10; 