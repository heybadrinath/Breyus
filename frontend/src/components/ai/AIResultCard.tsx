/**
 * AIResultCard Component - Figma Design Update
 * Two-column layout with metrics panel matching Figma designs
 * Handles both buyer (products/sellers) and seller (buyers) results
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Heart,
  MapPin,
  Phone,
  Mail,
  Building2,
  Eye,
  ShoppingCart,
  Send,
} from 'lucide-react';
import { EnrichedPartner, ProductResult, RiskLevel, SourceType } from '../../types/aiTypes';

interface AIResultCardProps {
  result: EnrichedPartner | ProductResult;
  userRole: 'Buyer' | 'Seller';
  tier: 1 | 2 | 3;
  commodity: string;
  onSaveContact?: (result: EnrichedPartner) => void;
  onRequestOffer?: (result: ProductResult) => void;
  onChat?: (userId: string) => void;
}

/**
 * Type guards using discriminant property
 */
const isEnrichedPartner = (result: EnrichedPartner | ProductResult): result is EnrichedPartner => {
  return result.resultType === 'partner';
};

const isProductResult = (result: EnrichedPartner | ProductResult): result is ProductResult => {
  return result.resultType === 'product';
};

// Risk level color and text mapping
const getRiskDisplay = (risk: RiskLevel): { color: string; barColor: string } => {
  switch (risk) {
    case 'Very Low':
    case 'Low':
      return { color: 'text-green-600', barColor: 'bg-green-500' };
    case 'Medium':
      return { color: 'text-yellow-600', barColor: 'bg-yellow-500' };
    case 'High':
    case 'Very High':
      return { color: 'text-red-600', barColor: 'bg-red-500' };
    default:
      return { color: 'text-gray-600', barColor: 'bg-gray-400' };
  }
};

// Get probability bar color based on value
const getProbabilityColor = (probability: number): string => {
  if (probability >= 80) return 'bg-green-500';
  if (probability >= 50) return 'bg-yellow-500';
  if (probability >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

// Source badge styling
const getSourceBadge = (sourceType: SourceType, tier: number, userRole: 'Buyer' | 'Seller') => {
  if (sourceType === 'platform_trade_history') {
    return {
      label: userRole === 'Buyer' ? 'Previous Seller' : 'Previous Buyer',
      className: 'bg-purple-100 text-purple-700',
    };
  }
  if (sourceType === 'platform_and_ai' || tier === 1) {
    return {
      label: 'Best Match',
      className: 'bg-green-100 text-green-700',
    };
  }
  if (sourceType === 'platform_only' || tier === 2) {
    return {
      label: 'On Platform',
      className: 'bg-blue-100 text-blue-700',
    };
  }
  return {
    label: 'External',
    className: 'bg-gray-100 text-gray-700',
  };
};

// Generate mock price fluctuation (would come from AI in real implementation)
const getPriceFluctuation = (): { value: number; direction: 'up' | 'down' } => {
  const value = Math.floor(Math.random() * 100) + 1;
  const direction = Math.random() > 0.5 ? 'up' : 'down';
  return { value, direction };
};

export const AIResultCard: React.FC<AIResultCardProps> = ({
  result,
  userRole,
  tier,
  commodity,
  onSaveContact,
  onRequestOffer,
  onChat,
}) => {
  const navigate = useNavigate();
  const isPartner = isEnrichedPartner(result);
  const isOnPlatform = result.isOnPlatform;
  const [isWishlisted, setIsWishlisted] = useState(false);

  const priceFluctuation = getPriceFluctuation();
  const sourceBadge = getSourceBadge(result.sourceType, tier, userRole);

  // Get probability/score based on result type
  const probability = isPartner
    ? (result as EnrichedPartner).probability || 0
    : (result as ProductResult).aiMatchScore || 0;

  const riskLevel = isPartner
    ? (result as EnrichedPartner).riskLevel || 'Medium'
    : 'Low'; // Products default to low risk

  const riskDisplay = getRiskDisplay(riskLevel as RiskLevel);

  const handleChat = () => {
    const userId = isPartner ? result.platformUserId : result.userId;
    if (userId && onChat) {
      onChat(userId);
    } else if (userId) {
      navigate(`/${userRole.toLowerCase()}/inbox`, {
        state: { targetUserId: userId },
      });
    }
  };

  const handleRequestOffer = () => {
    if (!isPartner && onRequestOffer) {
      onRequestOffer(result as ProductResult);
    } else if (!isPartner) {
      const productResult = result as ProductResult;
      navigate('/buyer/purchase-request', {
        state: {
          sellerId: productResult.userId,
          productId: productResult._id,
          commodity: commodity,
          suggestedPrice: productResult.price,
        },
      });
    }
  };

  const handleSaveContact = () => {
    setIsWishlisted(!isWishlisted);
    if (isPartner && onSaveContact) {
      onSaveContact(result as EnrichedPartner);
    }
  };

  // Get display values based on result type
  const displayName = isPartner
    ? (result as EnrichedPartner).name
    : (result as ProductResult).name;

  const companyName = isPartner
    ? (result as EnrichedPartner).name
    : (result as ProductResult).sellerName || 'Unknown Company';

  const country = isPartner
    ? (result as EnrichedPartner).country
    : (result as ProductResult).exportLocation || '';

  const price = !isPartner ? (result as ProductResult).price : null;
  const currency = !isPartner ? (result as ProductResult).currency || 'USD' : 'USD';
  const moq = !isPartner ? (result as ProductResult).moq : null;
  const moqUnit = !isPartner ? (result as ProductResult).moqUnit || 'MT' : 'MT';

  const contactEmail = isPartner
    ? (result as EnrichedPartner).contactInfo?.email
    : null;
  const contactPhone = isPartner
    ? (result as EnrichedPartner).contactInfo?.phone
    : null;

  const tradeCount = isPartner ? ((result as EnrichedPartner).tradeCount || 0) : 0;

  // Product image
  const productImage = !isPartner && (result as ProductResult).productImages?.[0]
    ? `${process.env.REACT_APP_BACKEND_URL}/${(result as ProductResult).productImages![0]}`
    : null;

  // Description
  const description = isPartner
    ? (result as EnrichedPartner).matchReason
    : (result as ProductResult).description;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Main Content - Two Column Layout */}
      <div className="flex">
        {/* Left Column - Product/Partner Info */}
        <div className="flex-1 p-4 border-r border-gray-100">
          {/* Header */}
          <div className="mb-3">
            <h3 className="font-bold text-gray-900 text-sm">Product & Price :</h3>
            <p className="font-semibold text-gray-800 mt-1">{displayName.toUpperCase()}</p>
          </div>

          {/* Price & MOQ for Products */}
          {!isPartner && (
            <div className="space-y-1 mb-3">
              {price && (
                <p className="text-sm">
                  <span className="text-red-600 font-medium">Price :</span>{' '}
                  <span className="text-gray-700">{price} {currency} / Kg</span>
                </p>
              )}
              {moq && (
                <p className="text-sm">
                  <span className="text-gray-700 font-medium">MOQ :</span>{' '}
                  <span className="text-gray-600">{moq} {moqUnit}</span>
                </p>
              )}
            </div>
          )}

          {/* Company Info */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">{companyName} :</p>
              {isOnPlatform && (
                <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-300 rounded px-2 py-0.5 hover:bg-gray-50">
                  <Eye className="w-3 h-3" />
                  View Company {userRole === 'Buyer' ? 'Products' : 'Profile'}
                </button>
              )}
            </div>
            {country && (
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <span className="font-medium">Country of Origin:</span> {country}
              </p>
            )}
          </div>

          {/* Contact Info */}
          {(contactPhone || contactEmail) && (
            <div className="space-y-1 mb-3">
              {contactPhone && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <span className="font-medium">Contact number :</span> {contactPhone}
                </p>
              )}
              {contactEmail && (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <span className="font-medium">Mail :</span> {contactEmail}
                </p>
              )}
            </div>
          )}

          {/* Company's Product Description */}
          {description && (
            <div className="bg-gray-50 rounded p-3 mt-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">
                Company's {userRole === 'Buyer' ? 'Product Description' : 'Requirement'} :
              </p>
              <p className="text-xs text-gray-600 line-clamp-3">{description}</p>
            </div>
          )}

          {/* Trade History Badge */}
          {tradeCount > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Completed {tradeCount} trade(s) for this commodity
            </p>
          )}
        </div>

        {/* Right Column - Metrics Panel */}
        <div className="w-[200px] p-4 flex flex-col">
          {/* Image Placeholder or Avatar */}
          <div className="bg-gray-100 rounded-lg h-24 mb-3 flex items-center justify-center overflow-hidden">
            {productImage ? (
              <img
                src={productImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Probability Metric */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-700">
              {userRole === 'Buyer' ? 'Seller Selling' : 'Buyer Buying'} Probability
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium">{probability}%</span>
              <div className={`w-2 h-2 rounded-full ${getProbabilityColor(probability)}`}></div>
            </div>
          </div>

          {/* Price Fluctuation Metric */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-700">Next Month Price Fluctuation</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium">{priceFluctuation.value}%</span>
              <span className={priceFluctuation.direction === 'up' ? 'text-green-500' : 'text-red-500'}>
                {priceFluctuation.direction === 'up' ? '▲' : '▼'}
              </span>
            </div>
          </div>

          {/* Risk Metric */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-gray-700">
              Risk of this {userRole === 'Buyer' ? 'seller' : 'buyer'}
            </span>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${riskDisplay.color}`}>{riskLevel}</span>
              <div className={`w-2 h-2 rounded-full ${riskDisplay.barColor}`}></div>
            </div>
          </div>

          {/* Source Badge */}
          <div className="mb-3">
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${sourceBadge.className}`}>
              {sourceBadge.label}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 mt-auto">
            {/* Wishlist Button */}
            <button
              onClick={handleSaveContact}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 border rounded text-sm transition-colors ${
                isWishlisted
                  ? 'border-red-300 bg-red-50 text-red-600'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              {isWishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}
            </button>

            {/* Chat Button */}
            {isOnPlatform && (
              <button
                onClick={handleChat}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {userRole === 'Buyer' ? 'Chat now' : 'I want to chat'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="px-4 pb-4">
        {isOnPlatform ? (
          userRole === 'Buyer' ? (
            <button
              onClick={handleRequestOffer}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Send Purchase Request
            </button>
          ) : (
            <button
              onClick={handleChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              Request offer to sell
            </button>
          )
        ) : (
          <button
            onClick={handleSaveContact}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            <Heart className="w-4 h-4" />
            Save Contact
          </button>
        )}
      </div>
    </div>
  );
};

export default AIResultCard;
