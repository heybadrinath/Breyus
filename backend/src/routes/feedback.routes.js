const express = require('express');
const router = express.Router();
const { isAuth, isSeller } = require('../middleware/auth');
const feedbackController = require('../controllers/feedback.controller');

// Get feedback for a specific product
router.get('/products/:productId', isAuth, feedbackController.getProductFeedback);

// Get feedback for all products of a seller
router.get('/seller/products', isAuth, isSeller, feedbackController.getSellerProductsFeedback);

// Add a review to a product
router.post('/products/:productId/review', isAuth, feedbackController.addReview);

// Reply to a review (seller only)
router.post('/reviews/:reviewId/reply', isAuth, isSeller, feedbackController.replyToReview);

// Vote on a review (helpful/not helpful)
router.post('/reviews/:reviewId/vote', isAuth, feedbackController.voteOnReview);

module.exports = router; 