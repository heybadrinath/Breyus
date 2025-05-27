-- Fix column name mismatches by dropping and recreating the view
-- This ensures the view uses the correct column names from the products table

-- Drop the existing view if it exists
DROP VIEW IF EXISTS product_review_metrics;

-- Recreate the view with correct column names
CREATE VIEW product_review_metrics AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.productImage AS product_image,        -- Correct: matches Product entity
    p.detailedDescription AS product_description,  -- Correct: matches Product entity
    COUNT(pr.id) AS review_count,
    COALESCE(AVG(pr.rating), 0) AS average_rating,
    SUM(CASE WHEN pr.rating = 5 THEN 1 ELSE 0 END) AS five_star_count,
    SUM(CASE WHEN pr.rating = 4 THEN 1 ELSE 0 END) AS four_star_count,
    SUM(CASE WHEN pr.rating = 3 THEN 1 ELSE 0 END) AS three_star_count,
    SUM(CASE WHEN pr.rating = 2 THEN 1 ELSE 0 END) AS two_star_count,
    SUM(CASE WHEN pr.rating = 1 THEN 1 ELSE 0 END) AS one_star_count
FROM
    products p
LEFT JOIN
    product_reviews pr ON p.id = pr.product_id
GROUP BY
    p.id, p.name, p.productImage, p.detailedDescription; 