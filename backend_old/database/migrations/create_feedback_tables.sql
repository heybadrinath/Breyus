-- Create product_reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    content TEXT NOT NULL,
    date TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for product_reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_date ON product_reviews(date);

-- Create review_images table for product review images
CREATE TABLE IF NOT EXISTS review_images (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE
);

-- Create index for review_images
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);

-- Create review_votes table for tracking helpful/not helpful votes
CREATE TABLE IF NOT EXISTS review_votes (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure each user can only vote once per review
    UNIQUE (user_id, review_id)
);

-- Create indexes for review_votes
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_vote_type ON review_votes(vote_type);

-- Create review_replies table for seller responses to reviews
CREATE TABLE IF NOT EXISTS review_replies (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (review_id) REFERENCES product_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- One reply per review from the seller
    UNIQUE (seller_id, review_id)
);

-- Create indexes for review_replies
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_seller_id ON review_replies(seller_id);

-- Create a view to get aggregate review metrics by product
CREATE VIEW IF NOT EXISTS product_review_metrics AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.productImage AS product_image,
    p.detailedDescription AS product_description,
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