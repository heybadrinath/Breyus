const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { handleError } = require('../utils/errorHandler');

// Path to the existing SQLite database file
const DB_PATH = path.join(__dirname, '..', '..', 'breyus.sqlite');

// Get database connection
const getDb = () => {
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err.message);
    }
  });
};

// Execute query with parameters and return results
const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
      db.close();
    });
  });
};

// Execute a query for insert, update, delete operations
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes
        });
      }
      db.close();
    });
  });
};

/**
 * Get feedback summary for a specific product
 */
exports.getProductFeedback = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get product details and review metrics
    const products = await runQuery(`
      SELECT 
        product_id,
        product_name,
        product_image,
        product_description,
        review_count,
        average_rating,
        five_star_count,
        four_star_count,
        three_star_count,
        two_star_count,
        one_star_count
      FROM
        product_review_metrics
      WHERE
        product_id = ?
    `, [productId]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const product = products[0];
    
    // Get individual reviews for the product
    const reviews = await runQuery(`
      SELECT 
        pr.id,
        pr.product_id as productId,
        pr.user_id as userId,
        pr.user_name as userName,
        pr.user_avatar as userAvatar,
        pr.rating,
        pr.content,
        pr.date,
        (SELECT COUNT(*) FROM review_votes WHERE review_id = pr.id AND vote_type = 'helpful') as helpful,
        (SELECT COUNT(*) FROM review_votes WHERE review_id = pr.id AND vote_type = 'not_helpful') as notHelpful
      FROM
        product_reviews pr
      WHERE
        pr.product_id = ?
      ORDER BY
        pr.date DESC
    `, [productId]);
    
    // Get images for all reviews
    const reviewIds = reviews.map(review => review.id);
    let reviewImages = [];
    
    if (reviewIds.length > 0) {
      // SQLite doesn't support array parameters, so we need to build a query with multiple ? placeholders
      const placeholders = reviewIds.map(() => '?').join(',');
      
      reviewImages = await runQuery(`
        SELECT
          review_id as reviewId,
          image_url as imageUrl
        FROM
          review_images
        WHERE
          review_id IN (${placeholders})
      `, reviewIds);
    }
    
    // Add images to reviews
    const reviewsWithImages = reviews.map(review => {
      const images = reviewImages
        .filter(img => img.reviewId === review.id)
        .map(img => img.imageUrl);
      
      return {
        ...review,
        images: images.length > 0 ? images : undefined
      };
    });
    
    // Format response
    const response = {
      productId: product.product_id,
      productName: product.product_name,
      productImage: product.product_image,
      productDescription: product.product_description,
      averageRating: parseFloat(product.average_rating) || 0,
      reviewCount: parseInt(product.review_count) || 0,
      starCounts: [
        parseInt(product.five_star_count) || 0,
        parseInt(product.four_star_count) || 0,
        parseInt(product.three_star_count) || 0,
        parseInt(product.two_star_count) || 0,
        parseInt(product.one_star_count) || 0
      ],
      reviews: reviewsWithImages
    };
    
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Get feedback for all products belonging to a seller
 */
exports.getSellerProductsFeedback = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    // Get all products for the seller with review metrics
    const products = await runQuery(`
      SELECT 
        prm.product_id,
        prm.product_name,
        prm.product_image,
        prm.product_description,
        prm.review_count,
        prm.average_rating,
        prm.five_star_count,
        prm.four_star_count,
        prm.three_star_count,
        prm.two_star_count,
        prm.one_star_count
      FROM
        product_review_metrics prm
      JOIN
        products p ON prm.product_id = p.id
      WHERE
        p.seller_id = ?
    `, [sellerId]);
    
    // Format response
    const response = products.map(product => ({
      productId: product.product_id,
      productName: product.product_name,
      productImage: product.product_image,
      productDescription: product.product_description,
      averageRating: parseFloat(product.average_rating) || 0,
      reviewCount: parseInt(product.review_count) || 0,
      starCounts: [
        parseInt(product.five_star_count) || 0,
        parseInt(product.four_star_count) || 0,
        parseInt(product.three_star_count) || 0,
        parseInt(product.two_star_count) || 0,
        parseInt(product.one_star_count) || 0
      ]
    }));
    
    res.status(200).json(response);
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Add a review to a product
 */
exports.addReview = async (req, res) => {
  const db = getDb();
  
  try {
    // Begin transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    const { productId, rating, content, images } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;
    const userAvatar = req.user.avatar;
    
    // Validate review
    if (!productId || !rating || !content) {
      await new Promise(resolve => db.run('ROLLBACK', resolve));
      return res.status(400).json({ message: 'Product ID, rating, and content are required' });
    }
    
    if (rating < 1 || rating > 5) {
      await new Promise(resolve => db.run('ROLLBACK', resolve));
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Check if product exists
    const products = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM products WHERE id = ?', [productId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (products.length === 0) {
      await new Promise(resolve => db.run('ROLLBACK', resolve));
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user has already reviewed this product
    const existingReviews = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?',
        [productId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    if (existingReviews.length > 0) {
      await new Promise(resolve => db.run('ROLLBACK', resolve));
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    
    // Create review
    const reviewId = uuidv4();
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO product_reviews (
          id, product_id, user_id, user_name, user_avatar, rating, content, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [reviewId, productId, userId, userName, userAvatar, rating, content],
        err => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    // Add images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      for (const imageUrl of images) {
        const imageId = uuidv4();
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO review_images (id, review_id, image_url) VALUES (?, ?, ?)',
            [imageId, reviewId, imageUrl],
            err => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }
    
    // Commit transaction
    await new Promise((resolve, reject) => {
      db.run('COMMIT', err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.status(201).json({ 
      message: 'Review added successfully',
      reviewId
    });
  } catch (error) {
    // Rollback on error
    await new Promise(resolve => db.run('ROLLBACK', resolve));
    handleError(res, error);
  } finally {
    db.close();
  }
};

/**
 * Reply to a review
 */
exports.replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;
    const sellerId = req.user.id;
    
    // Validate input
    if (!reply) {
      return res.status(400).json({ message: 'Reply content is required' });
    }
    
    // Check if review exists and belongs to seller's product
    const reviews = await runQuery(`
      SELECT pr.id
      FROM product_reviews pr
      JOIN products p ON pr.product_id = p.id
      WHERE pr.id = ? AND p.seller_id = ?
    `, [reviewId, sellerId]);
    
    if (reviews.length === 0) {
      return res.status(404).json({ 
        message: 'Review not found or does not belong to one of your products' 
      });
    }
    
    // Check if reply already exists
    const existingReplies = await runQuery(
      'SELECT id FROM review_replies WHERE review_id = ? AND seller_id = ?',
      [reviewId, sellerId]
    );
    
    // Insert or update reply
    if (existingReplies.length > 0) {
      await executeQuery(
        'UPDATE review_replies SET content = ?, updated_at = datetime("now") WHERE id = ?',
        [reply, existingReplies[0].id]
      );
    } else {
      await executeQuery(
        'INSERT INTO review_replies (id, review_id, seller_id, content) VALUES (?, ?, ?, ?)',
        [uuidv4(), reviewId, sellerId, reply]
      );
    }
    
    res.status(200).json({ message: 'Reply submitted successfully' });
  } catch (error) {
    handleError(res, error);
  }
};

/**
 * Vote on a review (helpful/not helpful)
 */
exports.voteOnReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { voteType } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!voteType || !['helpful', 'not_helpful'].includes(voteType)) {
      return res.status(400).json({ message: 'Valid vote type (helpful or not_helpful) is required' });
    }
    
    // Check if review exists
    const reviews = await runQuery('SELECT id FROM product_reviews WHERE id = ?', [reviewId]);
    if (reviews.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    // Check if user has already voted
    const existingVotes = await runQuery(
      'SELECT id, vote_type FROM review_votes WHERE review_id = ? AND user_id = ?',
      [reviewId, userId]
    );
    
    if (existingVotes.length > 0) {
      // Update existing vote if different
      if (existingVotes[0].vote_type !== voteType) {
        await executeQuery(
          'UPDATE review_votes SET vote_type = ?, updated_at = datetime("now") WHERE id = ?',
          [voteType, existingVotes[0].id]
        );
      }
    } else {
      // Create new vote
      await executeQuery(
        'INSERT INTO review_votes (id, review_id, user_id, vote_type) VALUES (?, ?, ?, ?)',
        [uuidv4(), reviewId, userId, voteType]
      );
    }
    
    // Get updated vote counts
    const voteResults = await runQuery(`
      SELECT
        (SELECT COUNT(*) FROM review_votes WHERE review_id = ? AND vote_type = 'helpful') as helpful,
        (SELECT COUNT(*) FROM review_votes WHERE review_id = ? AND vote_type = 'not_helpful') as notHelpful
    `, [reviewId, reviewId]);
    
    res.status(200).json({
      message: 'Vote recorded successfully',
      helpful: voteResults[0].helpful,
      notHelpful: voteResults[0].notHelpful
    });
  } catch (error) {
    handleError(res, error);
  }
}; 