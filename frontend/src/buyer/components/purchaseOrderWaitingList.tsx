import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, FlaskConical, Eye, Loader2, X, Clock, CheckCircle, AlertCircle, Pen } from "lucide-react";
import { getUserTrades, Trade, cancelTrade, rejectTrade } from "../../services/trade.service";
import ViewDocumentModal from "../../components/ViewDocumentModal";
import ReviewTermsModal from "../../components/ReviewTermsModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

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

const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return 'https://via.placeholder.com/128?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${BACKEND_URL}${path}`;
};

// Trade Status Progress Component (Vertical) - Updated with accurate SCO/ICPO states
const TradeStatusProgress = ({ trade }: { trade: TradeWithProduct }) => {
    const hasSCO = !!trade.scoDocument?.filePath;
    const hasICPO = !!trade.icpoDocument?.filePath;
    const icpoApproved = trade.icpoDocument?.status === 'approved';
    const icpoRejected = trade.icpoDocument?.status === 'rejected';

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
                sublabel: hasSCO ? "SCO Received" : "Waiting for seller",
                status: hasSCO ? 'completed' : 'current',
                color: hasSCO ? 'text-green-600' : 'text-yellow-600'
            },
            {
                label: "Your ICPO",
                sublabel: hasICPO
                    ? (icpoApproved ? "Verified" : icpoRejected ? "Rejected - Re-upload" : "Sent - Awaiting verification")
                    : (hasSCO ? "Ready to upload" : "Waiting for SCO first"),
                status: hasICPO
                    ? (icpoApproved ? 'completed' : icpoRejected ? 'rejected' : 'pending')
                    : (hasSCO ? 'current' : 'pending'),
                color: hasICPO
                    ? (icpoApproved ? 'text-green-600' : icpoRejected ? 'text-red-600' : 'text-yellow-600')
                    : (hasSCO ? 'text-blue-600' : 'text-gray-400')
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
    } else if (!hasICPO || icpoRejected) {
        message = icpoRejected
            ? "Your ICPO was rejected. Please re-upload with corrections."
            : "SCO Received! Click PROCEED to upload your ICPO";
        bgColor = icpoRejected ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200";
        textColor = icpoRejected ? "text-red-700" : "text-blue-700";
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
    onViewICPO
}: {
    trade: TradeWithProduct;
    onCancel: (tradeId: string) => void;
    onProceed: (tradeId: string) => void;
    onViewSCO: (trade: TradeWithProduct) => void;
    onViewICPO: (trade: TradeWithProduct) => void;
}) => {
    const productPrice = parseFloat(trade.product?.price || '0');
    const finalPrice = parseFloat(trade.buyerOfferedPrice || trade.product?.price || '0');
    const discount = productPrice > 0 ? Math.round(((productPrice - finalPrice) / productPrice) * 100) : 0;
    const imageUrl = getImageUrl(trade.product?.productImages?.[0]);

    const hasSCO = !!trade.scoDocument?.filePath;
    const hasICPO = !!trade.icpoDocument?.filePath;
    const icpoRejected = trade.icpoDocument?.status === 'rejected';
    const icpoApproved = trade.icpoDocument?.status === 'approved';

    // FIXED: PROCEED only enables if SCO exists AND (no ICPO or ICPO was rejected)
    const canProceed = trade.negotiationStatus === 'accepted' &&
                       hasSCO && // SCO must exist!
                       (!hasICPO || icpoRejected);

    // Show different button text based on state
    const getButtonText = () => {
        if (hasICPO && icpoApproved) return 'ICPO VERIFIED';
        if (hasICPO && !icpoRejected) return 'ICPO SENT';
        if (icpoRejected) return 'RE-UPLOAD ICPO';
        return 'PROCEED';
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
                                    hasSCO ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full ${hasSCO ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    SCO: {hasSCO ? 'Received' : 'Pending'}
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
                            <button className="flex items-center gap-1 py-2 px-4 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                                <MessageCircle size={16} />
                                Ask Queries
                            </button>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center gap-3 mt-4">
                        <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                            <span className="text-sm text-gray-600">Quantity:</span>
                            <span className="text-sm font-medium">{trade.quantity}</span>
                            <span className="text-xs text-gray-500">{trade.quantityUnit}</span>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                            <Eye size={16} />
                            <span className="text-sm">Submitted Offer</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                            <FlaskConical size={16} />
                            <span className="text-sm">Product Quality Report</span>
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
                    <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                        <MessageCircle size={16} />
                        Chat with seller
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
                        {!canProceed && !hasICPO && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {!hasSCO ? "Waiting for seller's SCO" : "Loading..."}
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
    const finalPrice = parseFloat(trade.buyerOfferedPrice || trade.product?.price || '0');
    const productPrice = parseFloat(trade.product?.price || '0');
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

    // Review Terms Modal state
    const [showReviewTermsModal, setShowReviewTermsModal] = useState(false);
    const [reviewTermsTradeId, setReviewTermsTradeId] = useState<string>('');

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
        navigate(`/buyer/icpo-upload?tradeId=${tradeId}`);
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
            setViewDocModalOpen(true);
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
            alert('SPA document not available yet.');
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
            alert('Failed to reject trade. Please try again.');
        }
    };

    const handleSignSPA = (tradeId: string) => {
        // Navigate to SPA Status tab with the trade ID
        navigate(`/buyer/trade?tab=spa&tradeId=${tradeId}`);
    };

    // Filter trades
    const waitingTrades = trades.filter(t =>
        t.negotiationStatus === 'accepted' &&
        (!t.tradePhase || t.tradePhase === 'PR' || t.tradePhase === 'SCO' || t.tradePhase === 'ICPO')
    );

    const spaReadyTrades = trades.filter(t =>
        t.tradePhase === 'SPA' ||
        (t.icpoDocument?.status === 'approved')
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
            <div className="flex gap-6">
                {/* Left: Waiting List */}
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Waiting list ({waitingTrades.length})
                    </h2>
                    {waitingTrades.length === 0 ? (
                        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
                            No pending purchase orders
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
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Trade Review Panel (SPA Ready) */}
                <div className="w-[380px] flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Trade Review Panel ({spaReadyTrades.length})
                    </h2>
                    {spaReadyTrades.length === 0 ? (
                        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
                            No orders in review
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {spaReadyTrades.map((trade) => (
                                <AcceptedRequestItem
                                    key={trade._id}
                                    trade={trade}
                                    onViewSPA={handleViewSPA}
                                    onReviewTerms={handleReviewTerms}
                                    onRejectTrade={handleRejectTrade}
                                    onSignSPA={handleSignSPA}
                                />
                            ))}
                        </div>
                    )}
                </div>
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
                    }}
                    document={viewDocInfo}
                    documentType={viewDocType}
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
        </div>
    );
};
