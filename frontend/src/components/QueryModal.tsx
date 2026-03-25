import React, { useState } from 'react';
import { X, Loader2, Send, MessageCircle } from 'lucide-react';
import { createConversation, sendMessage } from '../services/inbox.service';
import { useNavigate } from 'react-router-dom';

interface QueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName?: string;
  recipientType: 'seller' | 'buyer';
  userRole?: 'Buyer' | 'Seller';
}

export const QueryModal: React.FC<QueryModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  recipientType,
  userRole = 'Buyer'
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter your query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create or get existing conversation
      if (!productId) {
        throw new Error('Missing product reference');
      }
      const conversationResult = await createConversation(productId);

      // Extract conversation ID from various response formats
      let conversationId: string | undefined;
      if (conversationResult.status === 'success') {
        const data = conversationResult.data;
        if (typeof data === 'string') {
          conversationId = data;
        } else if (data && typeof data === 'object') {
          conversationId =
            data._id ||
            data.conversationId ||
            data.id ||
            data.data?._id ||
            data.data?.conversationId ||
            data.data;
        }
      }
      // Fallback: check if conversationId is directly on the result (for existing conversations)
      if (!conversationId && conversationResult.conversationId) {
        conversationId = conversationResult.conversationId;
      }

      if (!conversationId) {
        throw new Error(conversationResult.message || 'Failed to create conversation');
      }

      // Send the message using HTTP API (guarantees message is saved before navigation)
      const messageResult = await sendMessage(conversationId, query);
      if (messageResult.status !== 'success') {
        throw new Error('Failed to send message');
      }

      // Navigate to inbox with the conversation
      const basePath = userRole === 'Seller' ? '/seller/Inbox' : '/buyer/inbox';
      navigate(`${basePath}?conversationId=${conversationId}`);

      onClose();
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send query');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQuery('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Ask {recipientType === 'seller' ? 'Seller' : 'Buyer'}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4">
          {productName && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-500">Product: </span>
              <span className="text-sm font-medium">{productName}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Query
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Type your question for the ${recipientType}...`}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Query
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QueryModal;
