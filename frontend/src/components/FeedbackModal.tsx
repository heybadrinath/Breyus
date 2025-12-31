import React, { useState } from 'react';
import { X, Loader2, Star, Send } from 'lucide-react';

export type FeedbackType = 'seller' | 'delivery' | 'product';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
  feedbackType: FeedbackType;
  recipientName?: string;
  productName?: string;
  onSubmit?: (data: FeedbackData) => Promise<void>;
}

export interface FeedbackData {
  tradeId: string;
  feedbackType: FeedbackType;
  rating: number;
  comment: string;
}

const feedbackTypeConfig: Record<FeedbackType, {
  title: string;
  description: string;
  ratingLabel: string;
  commentPlaceholder: string;
}> = {
  seller: {
    title: 'Leave Seller Feedback',
    description: 'Share your experience with this seller',
    ratingLabel: 'How would you rate this seller?',
    commentPlaceholder: 'Tell us about your experience with this seller...'
  },
  delivery: {
    title: 'Leave Delivery Feedback',
    description: 'Share your experience with the delivery',
    ratingLabel: 'How would you rate the delivery?',
    commentPlaceholder: 'Tell us about the delivery experience (timing, packaging, condition)...'
  },
  product: {
    title: 'Leave Product Feedback',
    description: 'Share your experience with this product',
    ratingLabel: 'How would you rate this product?',
    commentPlaceholder: 'Tell us about the product quality, specifications, etc...'
  }
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  tradeId,
  feedbackType,
  recipientName,
  productName,
  onSubmit
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const config = feedbackTypeConfig[feedbackType];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit({
          tradeId,
          feedbackType,
          rating,
          comment
        });
      }
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const StarRating = () => (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setRating(value)}
          onMouseEnter={() => setHoveredRating(value)}
          onMouseLeave={() => setHoveredRating(0)}
          className="p-1 transition-transform hover:scale-110 focus:outline-none"
          disabled={loading}
        >
          <Star
            className={`w-8 h-8 ${
              value <= (hoveredRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );

  const getRatingText = (rating: number) => {
    const texts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return texts[rating] || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">{config.title}</h2>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 fill-green-500 text-green-500" />
            </div>
            <h3 className="text-lg font-medium text-green-700 mb-2">Thank you!</h3>
            <p className="text-gray-500">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            {/* Product/Recipient Info */}
            {(recipientName || productName) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                {feedbackType === 'seller' && recipientName && (
                  <p><span className="text-gray-500">Seller: </span><span className="font-medium">{recipientName}</span></p>
                )}
                {productName && (
                  <p><span className="text-gray-500">Product: </span><span className="font-medium">{productName}</span></p>
                )}
              </div>
            )}

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                {config.ratingLabel}
              </label>
              <StarRating />
              {rating > 0 && (
                <p className="text-center mt-2 text-sm font-medium text-yellow-600">
                  {getRatingText(rating)}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={config.commentPlaceholder}
                className="w-full h-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
