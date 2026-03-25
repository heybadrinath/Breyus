/**
 * AIResultCard Component - Enhanced UX Version
 * Two-column layout with metrics panel, hover effects, and quick actions
 * Handles both buyer (products/sellers) and seller (buyers) results
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Loader2,
  CheckSquare,
  Square,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Shield,
  ZoomIn,
} from 'lucide-react';
import { EnrichedPartner, ProductResult, RiskLevel, SourceType } from '../../types/aiTypes';
import { createConversationByCompany } from '../../services/inbox.service';

interface AIResultCardProps {
  result: EnrichedPartner | ProductResult;
  userRole: 'Buyer' | 'Seller';
  tier: 1 | 2 | 3;
  commodity: string;
  onSaveContact?: (result: EnrichedPartner | ProductResult) => void;
  onRequestOffer?: (result: ProductResult) => void;
  onChat?: (companyId: string) => Promise<void>;
  // New comparison functionality
  isSelected?: boolean;
  onSelectionChange?: (result: EnrichedPartner | ProductResult, selected: boolean) => void;
  showCompareCheckbox?: boolean;
  // Animation index for staggered entry
  index?: number;
}

/**
 * Type guards using discriminant property
 */
const isEnrichedPartner = (result: EnrichedPartner | ProductResult): result is EnrichedPartner => {
  return result.resultType === 'partner';
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

/**
 * Get price fluctuation from result data
 * Returns the actual AI-provided value, or null if not available
 */
const getPriceFluctuation = (
  result: EnrichedPartner | ProductResult
): { value: number; direction: 'up' | 'down' } | null => {
  // Get priceFluctuation from the result (if available)
  const fluctuation = result.priceFluctuation;

  if (fluctuation === undefined || fluctuation === null) {
    return null; // No data available
  }

  return {
    value: Math.abs(fluctuation),
    direction: fluctuation >= 0 ? 'up' : 'down',
  };
};

export const AIResultCard: React.FC<AIResultCardProps> = ({
  result,
  userRole,
  tier,
  commodity,
  onSaveContact,
  onRequestOffer,
  onChat,
  isSelected = false,
  onSelectionChange,
  showCompareCheckbox = false,
  index = 0,
}) => {
  const navigate = useNavigate();
  const isPartner = isEnrichedPartner(result);
  const isOnPlatform = result.isOnPlatform;
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const priceFluctuation = getPriceFluctuation(result);
  const sourceBadge = getSourceBadge(result.sourceType, tier, userRole);

  // Copy to clipboard helper
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle comparison selection
  const handleSelectionToggle = () => {
    if (onSelectionChange) {
      onSelectionChange(result, !isSelected);
    }
  };

  // Get probability/score based on result type
  // For partners, use probability with matchScore as fallback
  // For products, use probability with aiMatchScore as fallback
  const probability = isPartner
    ? (result as EnrichedPartner).probability ?? (result as EnrichedPartner).matchScore ?? 0
    : (result as ProductResult).probability ?? (result as ProductResult).aiMatchScore ?? 0;

  // For products, use the calculated riskLevel from backend
  const riskLevel = isPartner
    ? (result as EnrichedPartner).riskLevel || 'Medium'
    : (result as ProductResult).riskLevel || 'Medium';

  const riskDisplay = getRiskDisplay(riskLevel as RiskLevel);

  const handleChat = async () => {
    // Get company ID for conversation creation
    const companyId = isPartner
      ? (result as EnrichedPartner).platformCompanyId
      : (result as ProductResult).companyId || (result as ProductResult).sellerCompanyId;

    if (!companyId) {
      console.warn('No company ID available for chat');
      return;
    }

    // If parent provides onChat callback, use it
    if (onChat) {
      await onChat(companyId);
      return;
    }

    // Otherwise, create conversation and navigate
    try {
      setChatLoading(true);
      const conversationResult = await createConversationByCompany(companyId);

      if (conversationResult.conversationId) {
        navigate(`/${userRole.toLowerCase()}/inbox?conversationId=${conversationResult.conversationId}`);
      } else if (conversationResult.status === 'error' && conversationResult.message?.includes('yourself')) {
        alert("You can't chat with yourself.");
      } else {
        // Fallback: navigate to inbox without specific conversation
        navigate(`/${userRole.toLowerCase()}/inbox`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      navigate(`/${userRole.toLowerCase()}/inbox`);
    } finally {
      setChatLoading(false);
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
    // Save contact works for both partners (buyers) and products (sellers)
    if (onSaveContact) {
      onSaveContact(result);
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
    : (result as ProductResult).exportLocation || (result as ProductResult).sellerCountry || '';

  const price = !isPartner ? (result as ProductResult).price : null;
  const currency = !isPartner ? (result as ProductResult).currency || 'USD' : 'USD';
  const moq = !isPartner ? (result as ProductResult).moq : null;
  const moqUnit = !isPartner ? (result as ProductResult).moqUnit || 'MT' : 'MT';

  // Contact info is available for both partners (buyers) and products (sellers)
  const contactEmail = isPartner
    ? (result as EnrichedPartner).contactInfo?.email
    : (result as ProductResult).contactInfo?.email;
  const contactPhone = isPartner
    ? (result as EnrichedPartner).contactInfo?.phone
    : (result as ProductResult).contactInfo?.phone;

  const tradeCount = isPartner ? ((result as EnrichedPartner).tradeCount || 0) : 0;

  // Product image
  const productImage = !isPartner && (result as ProductResult).productImages?.[0]
    ? `${process.env.REACT_APP_BACKEND_URL}/${(result as ProductResult).productImages![0]}`
    : null;

  // Description - For products show product description, for external partners don't show match reason as description
  // matchReason is internal data like "100% probability. High risk." - not suitable as product description
  const description = isPartner
    ? undefined // Don't show matchReason as product description for external sellers
    : (result as ProductResult).description;

  // Card entrance animation variants
  // Cap delay at 0.5s to prevent long waits with many results
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: Math.min(index * 0.1, 0.5),
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative bg-white rounded-xl border overflow-hidden transition-all duration-300 ${
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
            : isHovered
            ? 'border-gray-300 shadow-xl'
            : 'border-gray-200 shadow-sm'
        }`}
      >
        {/* Selection Checkbox - Comparison Feature */}
        {showCompareCheckbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-3 left-3 z-10"
          >
            <button
              onClick={handleSelectionToggle}
              className={`p-1.5 rounded-lg transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/90 text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200'
              }`}
              title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          </motion.div>
        )}

        {/* Quick Actions Overlay - Appears on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-3 right-3 z-10 flex items-center gap-1"
            >
              {contactEmail && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(contactEmail, 'email');
                  }}
                  className="p-1.5 bg-white/95 backdrop-blur rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  title="Copy email"
                >
                  {copiedField === 'email' ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              {contactPhone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(contactPhone, 'phone');
                  }}
                  className="p-1.5 bg-white/95 backdrop-blur rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  title="Copy phone"
                >
                  {copiedField === 'phone' ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Phone className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              {isOnPlatform && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetCompanyId = isPartner
                      ? (result as EnrichedPartner).platformCompanyId
                      : (result as ProductResult).companyId || (result as ProductResult).sellerCompanyId;
                    if (targetCompanyId) {
                      // Navigate to correct profile based on user role
                      const profilePath = userRole === 'Buyer'
                        ? `/buyer/seller-profile/${targetCompanyId}`
                        : `/seller/buyer-profile/${targetCompanyId}`;
                      window.open(profilePath, '_blank');
                    }
                  }}
                  className="p-1.5 bg-white/95 backdrop-blur rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  title="Open profile in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tier Indicator Bar */}
        <div
          className={`h-1 ${
            tier === 1
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : tier === 2
              ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
              : 'bg-gradient-to-r from-gray-300 to-gray-400'
          }`}
        />

        {/* Main Content - Two Column Layout */}
        <div className="flex">
          {/* Left Column - Product/Partner Info */}
          <div className="flex-1 p-4 border-r border-gray-100">
            {/* Header with AI Match Indicator */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-sm">Product & Price</h3>
                {probability >= 80 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded text-xs font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    Top Match
                  </motion.span>
                )}
              </div>
              <motion.p
                className="font-semibold text-gray-800 mt-1"
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {displayName.toUpperCase()}
              </motion.p>
            </div>

            {/* Price & MOQ for Products */}
            {!isPartner && (
              <div className="space-y-1 mb-3">
                {price && (
                  <motion.p
                    className="text-sm flex items-center gap-2"
                    whileHover={{ scale: 1.01 }}
                  >
                    <span className="text-red-600 font-medium">Price:</span>
                    <span className="text-gray-700 font-semibold">{price} {currency} / Kg</span>
                    {priceFluctuation && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${
                          priceFluctuation.direction === 'up'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {priceFluctuation.direction === 'up' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {priceFluctuation.value}%
                      </span>
                    )}
                  </motion.p>
                )}
                {moq && (
                  <p className="text-sm">
                    <span className="text-gray-700 font-medium">MOQ:</span>{' '}
                    <span className="text-gray-600">{moq} {moqUnit}</span>
                  </p>
                )}
              </div>
            )}

            {/* Company Info */}
            <div className="mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <p className="font-semibold text-gray-900 text-sm">{companyName}</p>
                </div>
                {isOnPlatform && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const targetCompanyId = isPartner
                        ? (result as EnrichedPartner).platformCompanyId
                        : (result as ProductResult).companyId || (result as ProductResult).sellerCompanyId;
                      if (targetCompanyId) {
                        // Navigate to correct profile based on user role
                        const profilePath = userRole === 'Buyer'
                          ? `/buyer/seller-profile/${targetCompanyId}`
                          : `/seller/buyer-profile/${targetCompanyId}`;
                        navigate(profilePath);
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 bg-blue-50 rounded-full px-2 py-0.5 hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View {userRole === 'Buyer' ? 'Products' : 'Profile'}
                  </motion.button>
                )}
              </div>
              {country && (
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium">Origin:</span> {country}
                </p>
              )}
            </div>

            {/* Contact Info - Collapsible on hover */}
            {(contactPhone || contactEmail) && (
              <motion.div
                className="space-y-1 mb-3 p-2 bg-gray-50/50 rounded-lg"
                initial={{ opacity: 0.8 }}
                whileHover={{ opacity: 1, backgroundColor: 'rgb(249 250 251)' }}
              >
                {contactPhone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{contactPhone}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(contactPhone, 'phone-inline');
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-opacity"
                    >
                      {copiedField === 'phone-inline' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </p>
                )}
                {contactEmail && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate max-w-[200px]">{contactEmail}</span>
                  </p>
                )}
              </motion.div>
            )}

            {/* Company's Product Description */}
            {description && (
              <motion.div
                className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-3 mt-3 border border-gray-100"
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  {userRole === 'Buyer' ? 'Product Description' : 'Requirement'}
                </p>
                <p className="text-xs text-gray-600 line-clamp-3">{description}</p>
              </motion.div>
            )}

            {/* Trade History Badge */}
            {tradeCount > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-1.5 mt-3 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit"
              >
                <Shield className="w-3 h-3" />
                {tradeCount} verified trade{tradeCount > 1 ? 's' : ''} completed
              </motion.div>
            )}
          </div>

          {/* Right Column - Metrics Panel */}
          <div className="w-[200px] p-4 flex flex-col">
            {/* Image with Preview on Hover */}
            <motion.div
              className="relative bg-gray-100 rounded-lg h-24 mb-3 flex items-center justify-center overflow-hidden cursor-pointer group"
              whileHover={{ scale: 1.02 }}
              onClick={() => productImage && setShowImagePreview(true)}
            >
              {productImage ? (
                <>
                  <img
                    src={productImage}
                    alt={displayName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/30 flex items-center justify-center"
                  >
                    <ZoomIn className="w-6 h-6 text-white" />
                  </motion.div>
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-400 text-3xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Probability Metric with Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">
                  {userRole === 'Buyer' ? 'Selling' : 'Buying'} Probability
                </span>
                <span className="text-xs font-bold">{probability}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${probability}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getProbabilityColor(probability)}`}
                />
              </div>
            </div>

            {/* Price Fluctuation Metric */}
            <div className="flex items-center justify-between mb-2 py-1.5 px-2 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-600">Price Trend</span>
              <div className="flex items-center gap-1">
                {priceFluctuation ? (
                  <span
                    className={`text-xs font-medium flex items-center gap-0.5 ${
                      priceFluctuation.direction === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {priceFluctuation.direction === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {priceFluctuation.value}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">N/A</span>
                )}
              </div>
            </div>

            {/* Risk Metric */}
            <div className="flex items-center justify-between mb-3 py-1.5 px-2 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-600">Risk Level</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${riskDisplay.barColor}`}></div>
                <span className={`text-xs font-medium ${riskDisplay.color}`}>{riskLevel}</span>
              </div>
            </div>

            {/* Source Badge */}
            <motion.div
              className="mb-3"
              whileHover={{ scale: 1.02 }}
            >
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sourceBadge.className}`}>
                {tier === 1 && <Sparkles className="w-3 h-3" />}
                {sourceBadge.label}
              </span>
            </motion.div>

            {/* Action Buttons */}
            <div className="space-y-2 mt-auto">
              {/* Wishlist Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveContact}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all ${
                  isWishlisted
                    ? 'border-red-300 bg-red-50 text-red-600'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Heart className={`w-4 h-4 transition-transform ${isWishlisted ? 'fill-current scale-110' : ''}`} />
                {isWishlisted ? 'Saved' : 'Save'}
              </motion.button>

              {/* Chat Button */}
              {isOnPlatform && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleChat}
                  disabled={chatLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chatLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  {chatLoading ? 'Starting...' : 'Chat'}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Button */}
        <div className="px-4 pb-4">
          {isOnPlatform ? (
            userRole === 'Buyer' ? (
              <motion.button
                whileHover={{ scale: 1.01, boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)' }}
                whileTap={{ scale: 0.99 }}
                onClick={handleRequestOffer}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
              >
                <ShoppingCart className="w-4 h-4" />
                Send Purchase Request
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.01, boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)' }}
                whileTap={{ scale: 0.99 }}
                onClick={handleChat}
                disabled={chatLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {chatLoading ? 'Starting chat...' : 'Request offer to sell'}
              </motion.button>
            )
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSaveContact}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <Heart className="w-4 h-4" />
              Save Contact
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImagePreview && productImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImagePreview(false)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={productImage}
              alt={displayName}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIResultCard;
