-- Seed data for store_visits
-- ADJUST DATES TO BE RECENT & REPLACE seller_id below with the actual logged-in seller's ID
-- You can get the seller ID by calling GET /analytics/debug/user while logged in
-- CURRENT SELLER_ID: 37eb01fc-58b0-426f-9334-8a21f0d9cea5
DELETE FROM store_visits;

-- Spread data across a full week for better visualization
INSERT INTO store_visits (seller_id, visit_date, visit_time, visitor_count, source) VALUES
-- Monday data
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-19', '09:00:00', 12, 'web'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-19', '14:30:00', 8, 'mobile'),
-- Tuesday data  
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-20', '10:15:00', 18, 'web'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-20', '16:00:00', 6, 'direct'),
-- Wednesday data
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-21', '11:30:00', 15, 'web'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-21', '15:45:00', 10, 'mobile'),
-- Thursday data
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-22', '08:30:00', 20, 'web'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-22', '17:00:00', 4, 'direct'),
-- Friday data
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-23', '09:45:00', 25, 'web'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-23', '13:20:00', 12, 'mobile'),
-- Saturday data
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-24', '10:00:00', 14, 'web'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-24', '16:30:00', 8, 'mobile');

-- Seed data for analytics_sales
DELETE FROM analytics_sales;

-- Spread sales data across the same week
INSERT INTO analytics_sales (seller_id, sale_date, sale_time, amount, product_name, customer_id, payment_method) VALUES
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-19', '10:05:00', 19.99, 'Wireless Mouse', 101, 'card'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-19', '14:35:00', 299.00, 'Gaming Keyboard', 102, 'online'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-20', '09:20:00', 49.50, 'USB-C Hub', 103, 'card'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-20', '11:10:00', 9.99, 'Screen Cleaner', 101, 'cash'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-21', '16:05:00', 75.00, 'Bluetooth Speaker', 104, 'online'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-22', '10:33:00', 150.00, 'External SSD 1TB', 105, 'card'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-22', '15:45:00', 35.75, 'USB Cable Pack', 106, 'card'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-23', '09:15:00', 89.99, 'Wireless Headphones', 107, 'online'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-23', '13:10:00', 12.75, 'Laptop Stand', 102, 'card'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', '2025-05-24', '11:30:00', 65.50, 'Webcam HD', 108, 'card');

-- Seed data for tasks
DELETE FROM tasks;

INSERT INTO tasks (seller_id, task_name, task_type, status, assigned_date, due_date, priority) VALUES
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', 'Process Order #1001', 'order_processing', 'completed', '2025-05-19', '2025-05-20', 'high'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', 'Update Inventory Levels', 'inventory', 'in_progress', '2025-05-20', '2025-05-25', 'medium'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', 'Follow up with Customer X', 'customer_service', 'pending', '2025-05-21', '2025-05-22', 'high'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', 'Launch Summer Sale', 'marketing', 'pending', '2025-05-21', '2025-05-26', 'medium'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', 'Restock Product Z', 'inventory', 'cancelled', '2025-05-18', '2025-05-19', 'low'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', 'Resolve Payment Issue #204', 'customer_service', 'in_progress', '2025-05-22', '2025-05-23', 'high'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', 'Prepare Monthly Report', 'order_processing', 'pending', '2025-05-23', '2025-05-30', 'medium'),
('37eb01fc-58b0-426f-9334-8a21f0d9cea5', 'Customer Support Training', 'customer_service', 'completed', '2025-05-20', '2025-05-21', 'low'); 