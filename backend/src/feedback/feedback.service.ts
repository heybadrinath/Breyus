import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

// Database result interfaces
interface ProductMetric {
  product_id: string;
  product_name: string;
  product_image: string;
  product_description: string;
  review_count: string;
  average_rating: string;
  five_star_count: string;
  four_star_count: string;
  three_star_count: string;
  two_star_count: string;
  one_star_count: string;
}

interface ReviewResult {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  content: string;
  date: string;
  helpful: number;
  notHelpful: number;
}

interface ReviewImage {
  reviewId: string;
  imageUrl: string;
}

interface ReviewReply {
  id: string;
  content: string;
}

interface ReviewVote {
  id: string;
  vote_type: string;
}

interface VoteResult {
  helpful: number;
  notHelpful: number;
}

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  private db: sqlite3.Database;
  
  constructor(private configService: ConfigService) {
    // Path to the existing SQLite database file
    const dbPath = this.configService.get<string>('DB_PATH', path.join(__dirname, '..', '..', 'breyus.sqlite'));
    this.logger.log(`Connecting to SQLite database at: ${dbPath}`);
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        this.logger.error(`Error connecting to SQLite database: ${err.message}`);
        throw err;
      }
      this.logger.log('Connected to the SQLite database.');
    });
  }
  
  // Execute query with parameters and return results
  private async runQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          this.logger.error(`Database query error: ${err.message}`);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }
  
  // Execute a query for insert, update, delete operations
  private async executeQuery(query: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }
  
  // Begin a transaction
  private async beginTransaction(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  // Commit a transaction
  private async commitTransaction(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  // Rollback a transaction
  private async rollbackTransaction(): Promise<void> {
    return new Promise((resolve) => {
      this.db.run('ROLLBACK', (err) => {
        if (err) this.logger.error(`Error rolling back transaction: ${err.message}`);
        resolve();
      });
    });
  }
  
  // Get feedback summary for a specific product
  async getProductFeedback(productId: string) {
    try {
      // Get product details and review metrics
      const products = await this.runQuery<ProductMetric>(`
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
        throw new NotFoundException('Product not found');
      }
      
      const product = products[0];
      
      // Get individual reviews for the product
      const reviews = await this.runQuery<ReviewResult>(`
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
      let reviewImages: ReviewImage[] = [];
      
      if (reviewIds.length > 0) {
        // SQLite doesn't support array parameters, so we need to build a query with multiple ? placeholders
        const placeholders = reviewIds.map(() => '?').join(',');
        
        reviewImages = await this.runQuery<ReviewImage>(`
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
      return {
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
    } catch (error) {
      this.logger.error(`Error getting product feedback: ${error.message}`);
      throw error;
    }
  }
  
  // Get feedback for all products belonging to a seller
  async getSellerProductsFeedback(sellerId: string) {
    try {
      // Get all products for the seller with review metrics
      const products = await this.runQuery<ProductMetric>(`
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
      return products.map(product => ({
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
    } catch (error) {
      this.logger.error(`Error getting seller products feedback: ${error.message}`);
      throw error;
    }
  }
  
  // Add a review to a product
  async addReview(productId: string, userId: string, userName: string, userAvatar: string, rating: number, content: string, images: string[] = []) {
    try {
      // Validate input
      if (!productId || !rating || !content) {
        throw new BadRequestException('Product ID, rating, and content are required');
      }
      
      if (rating < 1 || rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }
      
      await this.beginTransaction();
      
      // Check if product exists
      const products = await this.runQuery('SELECT id FROM products WHERE id = ?', [productId]);
      if (products.length === 0) {
        await this.rollbackTransaction();
        throw new NotFoundException('Product not found');
      }
      
      // Check if user has already reviewed this product
      const existingReviews = await this.runQuery(
        'SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ?',
        [productId, userId]
      );
      
      if (existingReviews.length > 0) {
        await this.rollbackTransaction();
        throw new BadRequestException('You have already reviewed this product');
      }
      
      // Create review
      const reviewId = uuidv4();
      await this.executeQuery(
        `INSERT INTO product_reviews (
          id, product_id, user_id, user_name, user_avatar, rating, content, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [reviewId, productId, userId, userName, userAvatar, rating, content]
      );
      
      // Add images if provided
      if (images && images.length > 0) {
        for (const imageUrl of images) {
          const imageId = uuidv4();
          await this.executeQuery(
            'INSERT INTO review_images (id, review_id, image_url) VALUES (?, ?, ?)',
            [imageId, reviewId, imageUrl]
          );
        }
      }
      
      await this.commitTransaction();
      
      return { 
        reviewId,
        message: 'Review added successfully'
      };
    } catch (error) {
      await this.rollbackTransaction();
      this.logger.error(`Error adding review: ${error.message}`);
      throw error;
    }
  }
  
  // Reply to a review
  async replyToReview(reviewId: string, sellerId: string, reply: string) {
    try {
      // Validate input
      if (!reply) {
        throw new BadRequestException('Reply content is required');
      }
      
      // Check if review exists and belongs to seller's product
      const reviews = await this.runQuery(`
        SELECT pr.id
        FROM product_reviews pr
        JOIN products p ON pr.product_id = p.id
        WHERE pr.id = ? AND p.seller_id = ?
      `, [reviewId, sellerId]);
      
      if (reviews.length === 0) {
        throw new NotFoundException('Review not found or does not belong to one of your products');
      }
      
      // Check if reply already exists
      const existingReplies = await this.runQuery<ReviewReply>(
        'SELECT id FROM review_replies WHERE review_id = ? AND seller_id = ?',
        [reviewId, sellerId]
      );
      
      // Insert or update reply
      if (existingReplies.length > 0) {
        await this.executeQuery(
          'UPDATE review_replies SET content = ?, updated_at = datetime("now") WHERE id = ?',
          [reply, existingReplies[0].id]
        );
      } else {
        await this.executeQuery(
          'INSERT INTO review_replies (id, review_id, seller_id, content) VALUES (?, ?, ?, ?)',
          [uuidv4(), reviewId, sellerId, reply]
        );
      }
      
      return { message: 'Reply submitted successfully' };
    } catch (error) {
      this.logger.error(`Error replying to review: ${error.message}`);
      throw error;
    }
  }
  
  // Vote on a review (helpful/not helpful)
  async voteOnReview(reviewId: string, userId: string, voteType: 'helpful' | 'not_helpful') {
    try {
      // Validate input
      if (!voteType || !['helpful', 'not_helpful'].includes(voteType)) {
        throw new BadRequestException('Valid vote type (helpful or not_helpful) is required');
      }
      
      // Check if review exists
      const reviews = await this.runQuery('SELECT id FROM product_reviews WHERE id = ?', [reviewId]);
      if (reviews.length === 0) {
        throw new NotFoundException('Review not found');
      }
      
      // Check if user has already voted
      const existingVotes = await this.runQuery<ReviewVote>(
        'SELECT id, vote_type FROM review_votes WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
      );
      
      if (existingVotes.length > 0) {
        // Update existing vote if different
        if (existingVotes[0].vote_type !== voteType) {
          await this.executeQuery(
            'UPDATE review_votes SET vote_type = ?, updated_at = datetime("now") WHERE id = ?',
            [voteType, existingVotes[0].id]
          );
        }
      } else {
        // Create new vote
        await this.executeQuery(
          'INSERT INTO review_votes (id, review_id, user_id, vote_type) VALUES (?, ?, ?, ?)',
          [uuidv4(), reviewId, userId, voteType]
        );
      }
      
      // Get updated vote counts
      const voteResults = await this.runQuery<VoteResult>(`
        SELECT
          (SELECT COUNT(*) FROM review_votes WHERE review_id = ? AND vote_type = 'helpful') as helpful,
          (SELECT COUNT(*) FROM review_votes WHERE review_id = ? AND vote_type = 'not_helpful') as notHelpful
      `, [reviewId, reviewId]);
      
      return {
        message: 'Vote recorded successfully',
        helpful: voteResults[0].helpful,
        notHelpful: voteResults[0].notHelpful
      };
    } catch (error) {
      this.logger.error(`Error voting on review: ${error.message}`);
      throw error;
    }
  }
} 