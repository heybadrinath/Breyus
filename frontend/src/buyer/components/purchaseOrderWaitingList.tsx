import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, FlaskConical, Eye, Loader2, X, Clock, CheckCircle, AlertCircle, Pen, Download } from "lucide-react";
import { getUserTrades, Trade, cancelTrade, rejectTrade, verifyDocument, uploadICPO, downloadPurchaseRequest, downloadPurchaseOrder } from "../../services/trade.service";
import { createConversation, sendMessage } from "../../services/inbox.service";
import ViewDocumentModal from "../../components/ViewDocumentModal";
import DocumentUploadModal from "../../components/DocumentUploadModal";
import ReviewTermsModal from "../../components/ReviewTermsModal";
import QueryModal from "../../components/QueryModal";
import TradeDetailsModal from "../../components/TradeDetailsModal";
import { useNotifications } from "../../contexts/NotificationContext";
import { getImageUrl } from "../../utils/imageUtils";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

// ========================
// PHASE 2 REFACTORING: Cancelled Trade Visibility
// ========================
// Show cancelled trades for 2 days after cancellation, then hide them
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const shouldShowCancelledTrade = (trade: any): boolean => {
    if (trade.tradePhase !== 'CANCELLED' && trade.negotiationStatus !== 'cancelled') {
        return true; // Not cancelled, always show
    }
    const cancelledAt = trade.cancelledAt || trade.autoCancelledAt;
    if (!cancelledAt) return true;
    const cancelledDate = new Date(cancelledAt);
    const twoDaysAgo = new Date(Date.now() - TWO_DAYS_MS);
    return cancelledDate > twoDaysAgo;
};

interface DocumentInfo {
    filePath: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
    uploadedAt?: string;
    status?: string;
    version?: number;
}

interface TradeWithProduct extends Omit<Trade, 'purchaseOrderStatus' | 'purchaseRequestStatus' | 'negotiationStatus'> {
    product: {
        _id: string;
        name: string;
        price: string;
        currency: string;
        productImages: string[];
        description?: string;
        moq?: string;
        stock?: string;
    };
    purchaseOrderStatus?: string;
    purchaseRequestStatus?: string;
    negotiationStatus?: string;
    tradePhase?: string;
    scoDocument?: DocumentInfo;
    icpoDocument?: DocumentInfo;
    spaDocument?: DocumentInfo & {
        sellerSignature?: string;
        sellerSignedAt?: string;
        buyerSignature?: string;
        buyerSignedAt?: string;
    };
    scoSubmittedAt?: string;
    icpoSubmittedAt?: string;
}


// Trade Status Progress Component (Vertical) - Updated with accurate SCO/ICPO states
const TradeStatusProgress = ({ trade }: { trade: TradeWithProduct }) => {
    const hasSCO = !!trade.scoDocument?.filePath;
    const hasICPO = !!trade.icpoDocument?.filePath;
    const scoApproved = trade.scoDocument?.status === 'approved';
    const scoRejected = trade.scoDocument?.status === 'rejected';
    const icpoApproved = trade.icpoDocument?.status === 'approved';
    const icpoRejected = trade.icpoDocument?.status === 'rejected';

    // PHASE 2: Get rejection tracking info
    const getSCOTrackingInfo = () => {
        const tracking = (trade as any).scoRejectionTracking;
        if (!tracking) return null;
        const rejectionCount = tracking.rejectionCount || 0;
        const maxAttempts = tracking.maxAttempts || 2;
        const remainingAttempts = maxAttempts - rejectionCount;
        return { rejectionCount, maxAttempts, remainingAttempts, isLastAttempt: remainingAttempts === 1 };
    };

    const getICPOTrackingInfo = () => {
        const tracking = (trade as any).icpoRejectionTracking;
        if (!tracking) return null;
        const rejectionCount = tracking.rejectionCount || 0;
        const maxAttempts = tracking.maxAttempts || 2;
        const remainingAttempts = maxAttempts - rejectionCount;
        return { rejectionCount, maxAttempts, remainingAttempts, isLastAttempt: remainingAttempts === 1 };
    };

    // Determine SCO step status and sublabel
    const getSCOStepInfo = () => {
        if (!hasSCO) return { sublabel: "Waiting for seller", status: 'current', color: 'text-yellow-600' };
        if (scoRejected) {
            const tracking = getSCOTrackingInfo();
            const attemptInfo = tracking
                ? (tracking.isLastAttempt ? "⚠️ FINAL" : `(${tracking.rejectionCount + 1}/${tracking.maxAttempts})`)
                : "";
            return { sublabel: `Rejected ${attemptInfo} - Re-upload`, status: 'rejected', color: 'text-red-600' };
        }
        if (scoApproved) return { sublabel: "Approved", status: 'completed', color: 'text-green-600' };
        return { sublabel: "Pending your review", status: 'pending', color: 'text-blue-600' };
    };

    // Determine ICPO step sublabel with tracking info
    const getICPOSublabel = () => {
        if (hasICPO) {
            if (icpoApproved) return "Verified";
            if (icpoRejected) {
                const tracking = getICPOTrackingInfo();
                const attemptInfo = tracking
                    ? (tracking.isLastAttempt ? "⚠️ FINAL" : `(${tracking.rejectionCount + 1}/${tracking.maxAttempts})`)
                    : "";
                return `Rejected ${attemptInfo} - Re-upload`;
            }
            return "Sent - Awaiting verification";
        }
        if (scoApproved) return "Ready to upload";
        if (hasSCO) return "Approve SCO first";
        return "Waiting for SCO first";
    };

    const scoStep = getSCOStepInfo();

    const getSteps = () => {
        return [
            {
                label: "Trade Accepted",
                sublabel: "Negotiation complete",
                status: 'completed',
                color: 'text-green-600'
            },
            {
                label: "Seller SCO",
                sublabel: scoStep.sublabel,
                status: scoStep.status,
                color: scoStep.color
            },
            {
                label: "Your ICPO",
                sublabel: getICPOSublabel(),
                status: hasICPO
                    ? (icpoApproved ? 'completed' : icpoRejected ? 'rejected' : 'pending')
                    : (scoApproved ? 'current' : 'pending'),
                color: hasICPO
                    ? (icpoApproved ? 'text-green-600' : icpoRejected ? 'text-red-600' : 'text-yellow-600')
                    : (scoApproved ? 'text-blue-600' : 'text-gray-400')
            },
            {
                label: "SPA & Completion",
                sublabel: icpoApproved ? "Ready to proceed" : "After ICPO verification",
                status: icpoApproved ? 'current' : 'pending',
                color: icpoApproved ? 'text-blue-600' : 'text-gray-400'
            }
        ];
    };

    const steps = getSteps();

    const getStepDotColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'current': return 'bg-blue-500';
            case 'pending': return 'bg-gray-300';
            case 'rejected': return 'bg-red-500';
            default: return 'bg-gray-300';
        }
    };

    return (
        <div className="p-4 min-w-[200px]">
            <h3 className="font-bold text-gray-900 mb-4">Trade Status:</h3>
            <div className="relative">
                {steps.map((step, index) => (
                    <div key={index} className="flex items-start mb-4 last:mb-0">
                        <div className="flex flex-col items-center mr-3">
                            <div className={`w-3 h-3 rounded-full ${getStepDotColor(step.status)}`} />
                            {index < steps.length - 1 && (
                                <div className={`w-0.5 h-8 ${
                                    step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-sm font-medium ${step.color}`}>
                                {step.label}
                            </span>
                            <span className="text-xs text-gray-500">{step.sublabel}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Phase Message Banner - Shows clear actionable message
const PhaseMessageBanner = ({ trade }: { trade: TradeWithProduct }) => {
    const hasSCO = !!trade.scoDocument?.filePath;
    const hasICPO = !!trade.icpoDocument?.filePath;
    const scoApproved = trade.scoDocument?.status === 'approved';
    const scoRejected = trade.scoDocument?.status === 'rejected';
    const icpoRejected = trade.icpoDocument?.status === 'rejected';
    const icpoApproved = trade.icpoDocument?.status === 'approved';

    let message = '';
    let bgColor = '';
    let textColor = '';
    let Icon = Clock;

    if (!hasSCO) {
        message = "Waiting for seller to upload SCO (Soft Corporate Offer)";
        bgColor = "bg-yellow-50 border-yellow-200";
        textColor = "text-yellow-700";
        Icon = Clock;
    } else if (scoRejected) {
        // SCO was rejected - waiting for seller to re-upload (with rejection tracking)
        const tracking = (trade as any).scoRejectionTracking;
        const rejectionCount = tracking?.rejectionCount || 0;
        const maxAttempts = tracking?.maxAttempts || 2;
        const remainingAttempts = maxAttempts - rejectionCount;
        const isLastAttempt = remainingAttempts === 1;

        message = isLastAttempt
            ? `⚠️ SCO rejected (FINAL ATTEMPT for seller). Waiting for revised SCO - trade will auto-cancel if rejected again.`
            : `SCO rejected (Attempt ${rejectionCount + 1}/${maxAttempts}). Waiting for seller to upload revised SCO.`;
        bgColor = isLastAttempt ? "bg-orange-50 border-orange-300" : "bg-red-50 border-red-200";
        textColor = isLastAttempt ? "text-orange-700" : "text-red-700";
        Icon = AlertCircle;
    } else if (!scoApproved) {
        // SCO exists but not yet approved - buyer needs to review
        message = "SCO Received! Review and approve the SCO to proceed.";
        bgColor = "bg-blue-50 border-blue-200";
        textColor = "text-blue-700";
        Icon = CheckCircle;
    } else if (!hasICPO || icpoRejected) {
        // SCO approved, now ICPO phase - with rejection tracking
        const tracking = (trade as any).icpoRejectionTracking;
        const rejectionCount = tracking?.rejectionCount || 0;
        const maxAttempts = tracking?.maxAttempts || 2;
        const remainingAttempts = maxAttempts - rejectionCount;
        const isLastAttempt = remainingAttempts === 1;

        if (icpoRejected) {
            message = isLastAttempt
                ? `⚠️ FINAL ATTEMPT! ICPO rejected. Re-upload carefully - trade will auto-cancel if rejected again.`
                : `ICPO rejected (Attempt ${rejectionCount + 1}/${maxAttempts}). Please re-upload with corrections.`;
            bgColor = isLastAttempt ? "bg-orange-50 border-orange-300" : "bg-red-50 border-red-200";
            textColor = isLastAttempt ? "text-orange-700" : "text-red-700";
        } else {
            message = "SCO Approved! Click PROCEED to upload your ICPO";
            bgColor = "bg-green-50 border-green-200";
            textColor = "text-green-700";
        }
        Icon = icpoRejected ? AlertCircle : CheckCircle;
    } else if (icpoApproved) {
        message = "ICPO Verified! Proceed to SPA phase";
        bgColor = "bg-green-50 border-green-200";
        textColor = "text-green-700";
        Icon = CheckCircle;
    } else {
        message = "ICPO Sent - Awaiting seller verification";
        bgColor = "bg-yellow-50 border-yellow-200";
        textColor = "text-yellow-700";
        Icon = Clock;
    }

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${bgColor}`}>
            <Icon className={`w-4 h-4 flex-shrink-0 ${textColor}`} />
            <span className={`text-sm font-medium ${textColor}`}>{message}</span>
        </div>
    );
};

// Waiting List Item Component
const POWaitingListItem = ({
    trade,
    onCancel,
    onProceed,
    onViewSCO,
    onViewICPO,
    onAskQueries,
    onViewSubmittedOffer,
    onViewProductQuality,
    onChatWithSeller,
    onDownloadPR,
    onDownloadPO,
    isDownloadingPR,
    isDownloadingPO,
    isChattingWithSeller
}: {
    trade: TradeWithProduct;
    onCancel: (tradeId: string) => void;
    onProceed: (tradeId: string) => void;
    onViewSCO: (trade: TradeWithProduct) => void;
    onViewICPO: (trade: TradeWithProduct) => void;
    onAskQueries: (trade: TradeWithProduct) => void;
    onViewSubmittedOffer: (tradeId: string) => void;
    onViewProductQuality: (trade: TradeWithProduct) => void;
    onChatWithSeller: (trade: TradeWithProduct) => Promise<void>;
    onDownloadPR: (tradeId: string) => void;
    onDownloadPO: (tradeId: string) => void;
    isDownloadingPR: boolean;
    isDownloadingPO: boolean;
    isChattingWithSeller: boolean;
}) => {
    const productPrice = parseFloat(String(trade.product?.price || '0'));
    const finalPrice = parseFloat(String(trade.buyerOfferedPrice || trade.product?.price || '0'));
    const discount = productPrice > 0 ? Math.round(((productPrice - finalPrice) / productPrice) * 100) : 0;
    const imageUrl = getImageUrl(trade.product?.productImages?.[0]);

    const hasSCO = !!trade.scoDocument?.filePath;
    const hasICPO = !!trade.icpoDocument?.filePath;
    const scoApproved = trade.scoDocument?.status === 'approved';
    const scoRejected = trade.scoDocument?.status === 'rejected';
    const icpoRejected = trade.icpoDocument?.status === 'rejected';
    const icpoApproved = trade.icpoDocument?.status === 'approved';

    // FIXED: PROCEED only enables if SCO is APPROVED (not just exists) AND (no ICPO or ICPO was rejected)
    const canProceed = trade.negotiationStatus === 'accepted' &&
                       scoApproved && // SCO must be approved, not just uploaded!
                       (!hasICPO || icpoRejected);

    // Show different button text based on state
    const getButtonText = () => {
        if (hasICPO && icpoApproved) return 'ICPO VERIFIED';
        if (hasICPO && !icpoRejected) return 'ICPO SENT';
        if (icpoRejected) return 'RE-UPLOAD ICPO';
        if (!hasSCO) return 'AWAITING SCO';
        if (scoRejected) return 'SCO REJECTED';
        if (!scoApproved) return 'REVIEW SCO';
        return 'PROCEED';
    };

    // Get tooltip text for disabled button
    const getTooltipText = () => {
        if (!hasSCO) return "Waiting for seller's SCO";
        if (scoRejected) return "Waiting for seller to re-upload SCO";
        if (!scoApproved) return "Review and approve the SCO first";
        return "";
    };

    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            {/* Phase Message Banner */}
            <div className="p-3 border-b bg-gray-50">
                <PhaseMessageBanner trade={trade} />
            </div>

            <div className="flex">
                {/* Left: Trade Status */}
                <div className="border-r bg-gray-50">
                    <TradeStatusProgress trade={trade} />
                </div>

                {/* Right: Product Details */}
                <div className="flex-1 p-4">
                    <div className="flex gap-4">
                        {/* Product Info */}
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                {trade.product?.name || 'Unknown Product'}
                            </h2>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-xl font-bold text-gray-900">
                                    {finalPrice.toLocaleString()} {trade.product?.currency || 'INR'}
                                </span>
                                {discount > 0 && (
                                    <>
                                        <span className="text-sm text-gray-500 line-through">
                                            {productPrice.toLocaleString()} {trade.product?.currency || 'INR'}
                                        </span>
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                                            {discount}% OFF
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 mb-3">
                                <span>Quantity: {trade.quantity} {trade.quantityUnit}</span>
                            </div>

                            {/* Document Status Badges */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {/* SCO Status Badge */}
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    scoRejected
                                        ? 'bg-red-100 text-red-700'
                                        : scoApproved
                                            ? 'bg-green-100 text-green-700'
                                            : hasSCO
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full ${
                                        scoRejected
                                            ? 'bg-red-500'
                                            : scoApproved
                                                ? 'bg-green-500'
                                                : hasSCO
                                                    ? 'bg-blue-500'
                                                    : 'bg-yellow-500'
                                    }`} />
                                    SCO: {scoRejected ? 'Rejected' : scoApproved ? 'Approved' : hasSCO ? 'Pending Review' : 'Pending'}
                                    {/* PHASE 2: Show SCO rejection tracking */}
                                    {scoRejected && (() => {
                                        const tracking = (trade as any).scoRejectionTracking;
                                        const rejectionCount = tracking?.rejectionCount || 0;
                                        const maxAttempts = tracking?.maxAttempts || 2;
                                        const isLastAttempt = (maxAttempts - rejectionCount) === 1;
                                        return (
                                            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${isLastAttempt ? 'bg-orange-200 text-orange-800' : 'bg-red-200 text-red-800'}`}>
                                                {isLastAttempt ? '⚠️' : `${rejectionCount + 1}/${maxAttempts}`}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* ICPO Status Badge */}
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    hasICPO
                                        ? (icpoRejected ? 'bg-red-100 text-red-700' : icpoApproved ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full ${
                                        hasICPO
                                            ? (icpoRejected ? 'bg-red-500' : icpoApproved ? 'bg-green-500' : 'bg-blue-500')
                                            : 'bg-gray-400'
                                    }`} />
                                    ICPO: {hasICPO ? (icpoRejected ? 'Rejected' : icpoApproved ? 'Verified' : 'Sent') : 'Not Uploaded'}
                                    {/* PHASE 2: Show ICPO rejection tracking */}
                                    {icpoRejected && (() => {
                                        const tracking = (trade as any).icpoRejectionTracking;
                                        const rejectionCount = tracking?.rejectionCount || 0;
                                        const maxAttempts = tracking?.maxAttempts || 2;
                                        const isLastAttempt = (maxAttempts - rejectionCount) === 1;
                                        return (
                                            <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${isLastAttempt ? 'bg-orange-200 text-orange-800' : 'bg-red-200 text-red-800'}`}>
                                                {isLastAttempt ? '⚠️' : `${rejectionCount + 1}/${maxAttempts}`}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* View Document Buttons */}
                            <div className="flex gap-2 mb-4">
                                {hasSCO && (
                                    <button
                                        onClick={() => onViewSCO(trade)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 text-blue-600 border-blue-200"
                                    >
                                        <Eye size={14} />
                                        View SCO
                                    </button>
                                )}
                                {hasICPO && (
                                    <button
                                        onClick={() => onViewICPO(trade)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 text-blue-600 border-blue-200"
                                    >
                                        <Eye size={14} />
                                        View ICPO
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Product Image */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-48 h-32 rounded-xl overflow-hidden bg-gray-100">
                                <img
                                    alt={trade.product?.name || 'Product'}
                                    className="w-full h-full object-cover"
                                    src={imageUrl}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/192x128?text=Product';
                                    }}
                                />
                            </div>
                            <button
                                onClick={() => onAskQueries(trade)}
                                className="flex items-center gap-1 py-2 px-4 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                <MessageCircle size={16} />
                                Ask Queries
                            </button>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                        <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                            <span className="text-sm text-gray-600">Quantity:</span>
                            <span className="text-sm font-medium">{trade.quantity}</span>
                            <span className="text-xs text-gray-500">{trade.quantityUnit}</span>
                        </div>
                        <button
                            onClick={() => onViewSubmittedOffer(trade._id)}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            <Eye size={16} />
                            <span className="text-sm">Submitted Offer</span>
                        </button>
                        <button
                            onClick={() => onViewProductQuality(trade)}
                            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            <FlaskConical size={16} />
                            <span className="text-sm">Product Quality Report</span>
                        </button>
                        <button
                            onClick={() => onDownloadPR(trade._id)}
                            disabled={isDownloadingPR}
                            className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                        >
                            {isDownloadingPR ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            <span className="text-sm">Download PR</span>
                        </button>
                        <button
                            onClick={() => onDownloadPO(trade._id)}
                            disabled={isDownloadingPO}
                            className="flex items-center gap-2 px-4 py-2 border border-green-200 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50"
                        >
                            {isDownloadingPO ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            <span className="text-sm">Download PO</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
                <button
                    onClick={() => onCancel(trade._id)}
                    className="px-6 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                    Cancel Trade
                </button>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onChatWithSeller(trade)}
                        disabled={isChattingWithSeller}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                    >
                        {isChattingWithSeller ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <MessageCircle size={16} />
                        )}
                        {isChattingWithSeller ? 'Opening chat...' : 'Chat with seller'}
                    </button>
                    <div className="relative group">
                        <button
                            onClick={() => canProceed && onProceed(trade._id)}
                            disabled={!canProceed}
                            className={`px-8 py-2 rounded-lg text-sm font-medium transition-colors ${
                                canProceed
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : (hasICPO && !icpoRejected)
                                        ? 'bg-blue-100 text-blue-600 cursor-default'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {getButtonText()}
                        </button>
                        {/* Tooltip for disabled state */}
                        {!canProceed && !hasICPO && getTooltipText() && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {getTooltipText()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Accepted Request Item Component (for right panel - SPA ready trades)
const AcceptedRequestItem = ({
    trade,
    onViewSPA,
    onReviewTerms,
    onRejectTrade,
    onSignSPA
}: {
    trade: TradeWithProduct;
    onViewSPA: (trade: TradeWithProduct) => void;
    onReviewTerms: (tradeId: string) => void;
    onRejectTrade: (tradeId: string) => void;
    onSignSPA: (tradeId: string) => void;
}) => {
    const finalPrice = parseFloat(String(trade.buyerOfferedPrice || trade.product?.price || '0'));
    const productPrice = parseFloat(String(trade.product?.price || '0'));
    const discount = productPrice > 0 ? Math.round(((productPrice - finalPrice) / productPrice) * 100) : 0;
    const imageUrl = getImageUrl(trade.product?.productImages?.[0]);

    return (
        <div className="bg-white border rounded-lg p-4">
            <div className="flex gap-3 mb-4">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{trade.product?.name || 'Unknown Product'}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-lg font-bold text-gray-900">
                            {finalPrice.toLocaleString()} {trade.product?.currency || 'INR'}
                        </span>
                        {discount > 0 && (
                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                {discount}% OFF
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Quantity: {trade.quantity} {trade.quantityUnit}</p>
                </div>
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                        alt={trade.product?.name || 'Product'}
                        className="w-full h-full object-cover"
                        src={imageUrl}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96x80?text=Product';
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>Sale and Purchase Agreement</span>
                <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={12} />
                    ICPO Verified
                </span>
            </div>

            <div className="flex gap-2 mb-3">
                <button
                    onClick={() => onViewSPA(trade)}
                    disabled={!trade.spaDocument?.filePath}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                        trade.spaDocument?.filePath
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    <Eye size={14} />
                    {trade.spaDocument?.filePath ? 'View SPA' : 'SPA Pending'}
                </button>
                <button
                    onClick={() => onReviewTerms(trade._id)}
                    className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-1"
                >
                    <Eye size={14} />
                    Review Terms
                </button>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onRejectTrade(trade._id)}
                    className="flex-1 py-2 px-3 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200"
                >
                    Reject Trade
                </button>
                <button
                    onClick={() => onSignSPA(trade._id)}
                    disabled={!trade.spaDocument?.filePath}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                        trade.spaDocument?.filePath
                            ? 'bg-black text-white hover:bg-gray-800'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    <Pen size={14} />
                    Sign SPA
                </button>
            </div>
        </div>
    );
};

// Cancel Modal Component
const CancelModal = ({
    isOpen,
    onClose,
    onConfirm,
    loading
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    loading: boolean;
}) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Cancel Trade?</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                    Are you sure you want to cancel this trade? This action cannot be undone.
                </p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for cancellation (optional)"
                    className="w-full border rounded-lg p-3 text-sm mb-4 resize-none"
                    rows={3}
                />
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                        disabled={loading}
                    >
                        Keep Trade
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Trade'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const PurchaseOrderWaitingList = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const [trades, setTrades] = useState<TradeWithProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);

    // View Document Modal state
    const [viewDocModalOpen, setViewDocModalOpen] = useState(false);
    const [viewDocType, setViewDocType] = useState<'sco' | 'icpo'>('sco');
    const [viewDocInfo, setViewDocInfo] = useState<any>(null);
    const [viewDocTradeId, setViewDocTradeId] = useState<string | null>(null);

    // Review Terms Modal state
    const [showReviewTermsModal, setShowReviewTermsModal] = useState(false);
    const [reviewTermsTradeId, setReviewTermsTradeId] = useState<string>('');

    // ICPO Upload Modal state
    const [icpoUploadModalOpen, setIcpoUploadModalOpen] = useState(false);
    const [icpoUploadTradeId, setIcpoUploadTradeId] = useState<string | null>(null);

    // Query Modal state
    const [showQueryModal, setShowQueryModal] = useState(false);
    const [queryTrade, setQueryTrade] = useState<TradeWithProduct | null>(null);

    // Trade Details Modal state (for viewing submitted offer)
    const [showTradeDetailsModal, setShowTradeDetailsModal] = useState(false);
    const [detailsTradeId, setDetailsTradeId] = useState<string | null>(null);

    // Document download states
    const [downloadingPRId, setDownloadingPRId] = useState<string | null>(null);
    const [downloadingPOId, setDownloadingPOId] = useState<string | null>(null);

    // Chat loading state
    const [chattingWithSellerId, setChattingWithSellerId] = useState<string | null>(null);

    const handleDownloadPR = async (tradeId: string) => {
        setDownloadingPRId(tradeId);
        try {
            await downloadPurchaseRequest(tradeId);
        } catch (err) {
            console.error('Failed to download purchase request:', err);
            showToast('Failed to download purchase request. Please try again.', 'error');
        } finally {
            setDownloadingPRId(null);
        }
    };

    const handleDownloadPO = async (tradeId: string) => {
        setDownloadingPOId(tradeId);
        try {
            await downloadPurchaseOrder(tradeId);
        } catch (err) {
            console.error('Failed to download purchase order:', err);
            showToast('Failed to download purchase order. Please try again.', 'error');
        } finally {
            setDownloadingPOId(null);
        }
    };

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            setLoading(true);
            const response = await getUserTrades();
            // Filter for trades that have been accepted (PR accepted, now in PO phase)
            const acceptedTrades = (response.data as TradeWithProduct[]).filter(
                trade => trade.purchaseRequestStatus === 'accepted' || trade.negotiationStatus === 'accepted'
            );
            setTrades(acceptedTrades);
        } catch (err) {
            setError('Failed to fetch purchase orders');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (tradeId: string) => {
        setSelectedTradeId(tradeId);
        setCancelModalOpen(true);
    };

    const handleConfirmCancel = async (reason: string) => {
        if (!selectedTradeId) return;
        try {
            setCancelLoading(true);
            await cancelTrade(selectedTradeId, reason);
            setCancelModalOpen(false);
            setSelectedTradeId(null);
            fetchTrades();
        } catch (err) {
            console.error('Failed to cancel trade:', err);
        } finally {
            setCancelLoading(false);
        }
    };

    const handleProceed = (tradeId: string) => {
        // Open ICPO upload modal instead of navigating to dedicated page
        setIcpoUploadTradeId(tradeId);
        setIcpoUploadModalOpen(true);
    };

    // Handle ICPO file upload
    const handleICPOUpload = async (file: File, notes?: string) => {
        if (!icpoUploadTradeId) return;

        try {
            await uploadICPO(icpoUploadTradeId, file, notes);
            showToast('ICPO uploaded successfully! The seller will review it.', 'success');
            setIcpoUploadModalOpen(false);
            setIcpoUploadTradeId(null);
            await fetchTrades();
        } catch (err: any) {
            showToast(err.message || 'Failed to upload ICPO', 'error');
            throw err;
        }
    };

    // Handle Ask Queries button
    const handleAskQueries = (trade: TradeWithProduct) => {
        setQueryTrade(trade);
        setShowQueryModal(true);
    };

    // Handle View Submitted Offer button
    const handleViewSubmittedOffer = (tradeId: string) => {
        setDetailsTradeId(tradeId);
        setShowTradeDetailsModal(true);
    };

    // Handle View Product Quality Report button
    const handleViewProductQuality = (trade: TradeWithProduct) => {
        const productId = trade.product?._id;
        if (productId) {
            navigate(`/buyer/product-page?id=${productId}&tab=quality`);
        } else {
            showToast('Product information not available', 'warning');
        }
    };

    // Handle Chat with Seller button - finds existing or creates new conversation
    const handleChatWithSeller = async (trade: TradeWithProduct) => {
        const productId = trade.product?._id;
        if (!productId) {
            showToast('Product information not available', 'warning');
            return;
        }

        setChattingWithSellerId(trade._id);
        try {
            // Create conversation (or get existing one) - the backend handles both cases
            const result = await createConversation(productId);
            const conversationId = result.conversationId;

            if (conversationId) {
                // Navigate to inbox with the conversation
                navigate(`/buyer/inbox?conversationId=${conversationId}`);
            } else {
                showToast('Failed to open chat. Please try again.', 'error');
            }
        } catch (err) {
            console.error('Failed to start chat:', err);
            showToast('Failed to start chat with seller', 'error');
        } finally {
            setChattingWithSellerId(null);
        }
    };

    const handleViewSCO = (trade: TradeWithProduct) => {
        if (trade.scoDocument) {
            setViewDocType('sco');
            setViewDocInfo({
                filePath: trade.scoDocument.filePath,
                originalName: trade.scoDocument.originalName || 'SCO Document',
                mimeType: trade.scoDocument.mimeType || 'application/pdf',
                size: trade.scoDocument.size || 0,
                uploadedAt: trade.scoDocument.uploadedAt || new Date().toISOString(),
                status: trade.scoDocument.status || 'uploaded'
            });
            setViewDocTradeId(trade._id);
            setViewDocModalOpen(true);
        }
    };

    // Handle SCO verification (approve/reject)
    const handleVerifySCO = async (status: 'approved' | 'rejected', notes?: string) => {
        if (!viewDocTradeId) return;

        try {
            await verifyDocument(viewDocTradeId, 'sco', status, notes);
            showToast(
                status === 'approved'
                    ? 'SCO approved successfully! You can now upload your ICPO.'
                    : 'SCO rejected. The seller will be notified.',
                status === 'approved' ? 'success' : 'info'
            );
            await fetchTrades();
        } catch (err: any) {
            showToast(err.message || 'Failed to verify SCO', 'error');
            throw err;
        }
    };

    const handleViewICPO = (trade: TradeWithProduct) => {
        if (trade.icpoDocument) {
            setViewDocType('icpo');
            setViewDocInfo({
                filePath: trade.icpoDocument.filePath,
                originalName: trade.icpoDocument.originalName || 'ICPO Document',
                mimeType: trade.icpoDocument.mimeType || 'application/pdf',
                size: trade.icpoDocument.size || 0,
                uploadedAt: trade.icpoDocument.uploadedAt || new Date().toISOString(),
                status: trade.icpoDocument.status || 'uploaded'
            });
            setViewDocModalOpen(true);
        }
    };

    const handleViewSPA = (trade: TradeWithProduct) => {
        if (trade.spaDocument?.filePath) {
            const spaUrl = trade.spaDocument.filePath.startsWith('http')
                ? trade.spaDocument.filePath
                : `${BACKEND_URL}${trade.spaDocument.filePath.startsWith('/') ? '' : '/'}${trade.spaDocument.filePath}`;
            window.open(spaUrl, '_blank');
        } else {
            showToast('SPA document not available yet.', 'warning');
        }
    };

    const handleReviewTerms = (tradeId: string) => {
        setReviewTermsTradeId(tradeId);
        setShowReviewTermsModal(true);
    };

    const handleRejectTrade = async (tradeId: string) => {
        if (!window.confirm('Are you sure you want to reject this trade?')) {
            return;
        }
        try {
            await rejectTrade(tradeId, 'Buyer rejected after review');
            fetchTrades();
        } catch (err) {
            console.error('Failed to reject trade:', err);
            showToast('Failed to reject trade. Please try again.', 'error');
        }
    };

    const handleSignSPA = (tradeId: string) => {
        // Navigate to SPA Status tab with the trade ID
        navigate(`/buyer/trade?tab=spa&tradeId=${tradeId}`);
    };

    // Filter trades
    // Strict phase filtering: PO tab shows only SCO and ICPO phases
    // PHASE 2 REFACTORING: Include cancelled trade 2-day visibility filter
    const waitingTrades = trades.filter(t =>
        shouldShowCancelledTrade(t) &&
        t.negotiationStatus === 'accepted' &&
        (t.tradePhase === 'SCO' || t.tradePhase === 'ICPO')
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <span className="text-red-500">{error}</span>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Purchase Order Status - SCO/ICPO phase trades */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Purchase Order Status ({waitingTrades.length})
                </h2>
                {waitingTrades.length === 0 ? (
                    <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
                        No trades in SCO/ICPO phase. Once a trade is accepted, it will appear here.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {waitingTrades.map((trade) => (
                            <POWaitingListItem
                                key={trade._id}
                                trade={trade}
                                onCancel={handleCancel}
                                onProceed={handleProceed}
                                onViewSCO={handleViewSCO}
                                onViewICPO={handleViewICPO}
                                onAskQueries={handleAskQueries}
                                onViewSubmittedOffer={handleViewSubmittedOffer}
                                onViewProductQuality={handleViewProductQuality}
                                onChatWithSeller={handleChatWithSeller}
                                onDownloadPR={handleDownloadPR}
                                onDownloadPO={handleDownloadPO}
                                isDownloadingPR={downloadingPRId === trade._id}
                                isDownloadingPO={downloadingPOId === trade._id}
                                isChattingWithSeller={chattingWithSellerId === trade._id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            <CancelModal
                isOpen={cancelModalOpen}
                onClose={() => {
                    setCancelModalOpen(false);
                    setSelectedTradeId(null);
                }}
                onConfirm={handleConfirmCancel}
                loading={cancelLoading}
            />

            {/* View Document Modal */}
            {viewDocModalOpen && viewDocInfo && (
                <ViewDocumentModal
                    isOpen={viewDocModalOpen}
                    onClose={() => {
                        setViewDocModalOpen(false);
                        setViewDocInfo(null);
                        setViewDocTradeId(null);
                    }}
                    document={viewDocInfo}
                    documentType={viewDocType}
                    tradeId={viewDocTradeId || undefined}
                    canVerify={viewDocType === 'sco' && viewDocInfo?.status !== 'approved' && viewDocInfo?.status !== 'rejected'}
                    onVerify={viewDocType === 'sco' ? handleVerifySCO : undefined}
                />
            )}

            {/* Review Terms Modal */}
            {showReviewTermsModal && reviewTermsTradeId && (
                <ReviewTermsModal
                    isOpen={showReviewTermsModal}
                    onClose={() => {
                        setShowReviewTermsModal(false);
                        setReviewTermsTradeId('');
                    }}
                    tradeId={reviewTermsTradeId}
                />
            )}

            {/* ICPO Upload Modal */}
            {icpoUploadModalOpen && (
                <DocumentUploadModal
                    isOpen={icpoUploadModalOpen}
                    onClose={() => {
                        setIcpoUploadModalOpen(false);
                        setIcpoUploadTradeId(null);
                    }}
                    onUpload={handleICPOUpload}
                    documentType="icpo"
                />
            )}

            {/* Query Modal */}
            {showQueryModal && queryTrade && (
                <QueryModal
                    isOpen={showQueryModal}
                    onClose={() => {
                        setShowQueryModal(false);
                        setQueryTrade(null);
                    }}
                    productId={queryTrade.product?._id || ''}
                    productName={queryTrade.product?.name || 'Unknown Product'}
                    recipientType="seller"
                    userRole="Buyer"
                />
            )}

            {/* Trade Details Modal */}
            {showTradeDetailsModal && detailsTradeId && (
                <TradeDetailsModal
                    isOpen={showTradeDetailsModal}
                    onClose={() => {
                        setShowTradeDetailsModal(false);
                        setDetailsTradeId(null);
                    }}
                    tradeId={detailsTradeId}
                    onNavigateToNegotiation={() => {
                        setShowTradeDetailsModal(false);
                        navigate(`/buyer/negotiation/${detailsTradeId}`);
                    }}
                />
            )}
        </div>
    );
};
