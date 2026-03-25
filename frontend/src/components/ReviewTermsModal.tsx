import React, { useState, useEffect } from 'react';
import { X, Loader2, FileText, ArrowRight, DollarSign, MapPin, CreditCard, Package } from 'lucide-react';
import { getTradeById, Trade, getNegotiationHistory } from '../services/trade.service';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUtils';

interface ReviewTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeId: string;
  userRole?: 'Buyer' | 'Seller';
}

interface NegotiationEntry {
  round: number;
  initiatedBy: 'buyer' | 'seller';
  price: string;
  incoterms?: {
    type: string;
    location: string;
  };
  message?: string;
  timestamp: string;
}

export const ReviewTermsModal: React.FC<ReviewTermsModalProps> = ({
  isOpen,
  onClose,
  tradeId,
  userRole = 'Buyer'
}) => {
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tradeId) {
      fetchTradeDetails();
    }
  }, [isOpen, tradeId]);

  const fetchTradeDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTradeById(tradeId);
      setTrade(response.data as Trade);
    } catch (err) {
      setError('Failed to load trade details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleNavigateToNegotiation = () => {
    const basePath = userRole === 'Seller' ? '/seller' : '/buyer';
    navigate(`${basePath}/negotiation/${tradeId}`);
    onClose();
  };

  const formatCurrency = (amount?: string | number, currency?: string) => {
    // Handle undefined, null, empty string, or 0
    if (amount === undefined || amount === null || amount === '') return 'N/A';
    // Convert to number for formatting
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'N/A';
    return `${currency || 'USD'} ${numAmount.toLocaleString()}`;
  };

  const formatIncoterms = (incoterms?: { selectedIncoterm?: string; selectedIncotermData?: Record<string, 'Buyer' | 'Seller'> }) => {
    if (!incoterms || !incoterms.selectedIncoterm) return 'N/A';
    return incoterms.selectedIncoterm;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C4A962]" />
            <h2 className="text-lg font-bold text-gray-800">Review Final Terms</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#C4A962]" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              {error}
            </div>
          ) : trade ? (
            <div className="space-y-4">
              {/* Product Info */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {trade.product.productImages?.[0] ? (
                      <img
                        src={getImageUrl(trade.product.productImages[0])}
                        alt={trade.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Product';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{trade.product.name}</h3>
                    <p className="text-sm text-gray-500">
                      Quantity: {trade.quantity} {trade.quantityUnit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {/* Buyer Offer */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-blue-600 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Buyer's Offer
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500">Price</span>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        {formatCurrency(trade.buyerOfferedPrice, trade.product.currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Incoterms</span>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {formatIncoterms(trade.buyerIncoterms)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Payment Method</span>
                      <p className="font-medium flex items-center gap-1">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        {trade.paymentMethod?.type || 'N/A'}
                      </p>
                    </div>
                    {trade.buyerMessage && (
                      <div>
                        <span className="text-xs text-gray-500">Message</span>
                        <p className="text-sm text-gray-700 italic">"{trade.buyerMessage}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seller Counter (if exists) */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Seller's Counter
                  </h4>
                  {trade.sellerOfferedPrice ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-gray-500">Price</span>
                        <p className="font-medium flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          {formatCurrency(trade.sellerOfferedPrice, trade.product.currency)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Incoterms</span>
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {formatIncoterms(trade.sellerOfferedIncoterms)}
                        </p>
                      </div>
                      {trade.sellerMessage && (
                        <div>
                          <span className="text-xs text-gray-500">Message</span>
                          <p className="text-sm text-gray-700 italic">"{trade.sellerMessage}"</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      No counter offer yet
                    </div>
                  )}
                </div>
              </div>

              {/* Final Agreed Terms (if accepted) */}
              {trade.negotiationStatus === 'accepted' && (
                <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-700 mb-3">Agreed Terms</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500">Final Price</span>
                      <p className="font-medium text-green-700">
                        {formatCurrency(
                          trade.sellerOfferedPrice || trade.buyerOfferedPrice,
                          trade.product.currency
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Incoterms</span>
                      <p className="font-medium text-green-700">
                        {formatIncoterms(trade.sellerOfferedIncoterms || trade.buyerIncoterms)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Status</span>
                      <p className="font-medium text-green-700">Accepted</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {trade.selectedAddress && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">Shipping Address</h4>
                  <p className="text-sm text-gray-600">
                    {trade.selectedAddress.fullName}<br />
                    {trade.selectedAddress.streetName}, {trade.selectedAddress.city}<br />
                    {trade.selectedAddress.state}, {trade.selectedAddress.country} - {trade.selectedAddress.pincode}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 flex-shrink-0 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          {trade && trade.negotiationStatus !== 'accepted' && (
            <button
              onClick={handleNavigateToNegotiation}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#16162a] transition-colors"
            >
              Go to Negotiation
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewTermsModal;
