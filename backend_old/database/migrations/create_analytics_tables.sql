-- This script assumes tables (store_visits, analytics_sales, tasks) are created by TypeORM synchronize:true
-- It will only add indexes and triggers.

-- Create indexes for store_visits
-- Ensure the 'users' table and these analytics tables exist before running this script (e.g., by starting the NestJS app with synchronize:true).

CREATE INDEX IF NOT EXISTS idx_store_visits_seller_id ON store_visits(seller_id);
CREATE INDEX IF NOT EXISTS idx_store_visits_visit_date ON store_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_store_visits_source ON store_visits(source);

-- Create indexes for analytics_sales
CREATE INDEX IF NOT EXISTS idx_analytics_sales_seller_id ON analytics_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sales_sale_date ON analytics_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_analytics_sales_product_name ON analytics_sales(product_name);
CREATE INDEX IF NOT EXISTS idx_analytics_sales_payment_method ON analytics_sales(payment_method);


-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_seller_id ON tasks(seller_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_date ON tasks(assigned_date);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- Trigger to update 'updated_at' timestamp for tasks table
CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
    UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
