import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, FlaskConical, Eye, Loader2, FileText } from "lucide-react";
import { getUserTrades, rejectTrade, Trade, uploadICPO } from "../../services/trade.service";
import DocumentUploadModal from "../../components/DocumentUploadModal";
import ViewDocumentModal from "../../components/ViewDocumentModal";
import { createConversation } from "../../services/inbox.service";
import TradeDetailsModal from "../../components/TradeDetailsModal";
import QueryModal from "../../components/QueryModal";
import ReviewTermsModal from "../../components/ReviewTermsModal";
import TradeCancellationModal from "../../components/TradeCancellationModal";
import { useNotifications } from "../../contexts/NotificationContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

// Helper function to construct proper image URL
const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return 'https://via.placeholder.com/128?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    // Ensure path starts with /
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${BACKEND_URL}${path}`;
};

interface DocumentInfo {
    filePath: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
    uploadedAt?: string;
    status?: string;
}

interface TradeWithProduct extends Omit<Trade, 'purchaseRequestStatus' | 'negotiationStatus'> {
    product: {
        _id: string;
        name: string;
        price: string;
        currency: string;
        productImages: string[];
        description?: string;
        productTestReports?: string[];
    };
    purchaseRequestStatus?: string;
    negotiationStatus?: string;
    tradePhase?: string;
    scoDocument?: DocumentInfo;
    icpoDocument?: DocumentInfo;
}

// Phases that should NOT appear in PR Status (they have progressed beyond ICPO)
const ADVANCED_PHASES = ['SPA', 'PAYMENT', 'BOL', 'COMPLETED'];

// Trade Status Step Component
const TradeStatusStep = ({ label, status, isLast }: { label: string; status: 'completed' | 'active' | 'pending'; isLast?: boolean }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'active': return 'text-blue-600';
            default: return 'text-gray-400';
        }
    };

    const getDotColor = () => {
        switch (status) {
            case 'completed': return 'bg-green-600 border-green-600';
            case 'active': return 'bg-blue-600 border-blue-600';
            default: return 'bg-white border-gray-300';
        }
    };

    return (
        <div className="flex items-start">
            <div className="flex flex-col items-center mr-3">
                <div className={`w-3 h-3 rounded-full border-2 ${getDotColor()}`} />
                {!isLast && <div className={`w-0.5 h-8 ${status === 'completed' ? 'bg-green-600' : 'bg-gray-200'}`} />}
            </div>
            <div className={`text-xs ${getStatusColor()} ${status === 'active' ? 'font-semibold' : ''}`}>
                {label}
                {status === 'active' && <span className="block text-[10px] text-gray-400">Awaiting response</span>}
            </div>
        </div>
    );
};

// Get trade status steps based on negotiation status
type StepStatus = 'completed' | 'active' | 'pending';

const getTradeSteps = (trade: TradeWithProduct): { label: string; status: StepStatus }[] => {
    const status = trade.negotiationStatus || 'pending';

    const getStepStatus = (stepIndex: number): StepStatus => {
        // Step 0: Purchase Request Sent - always completed once sent
        if (stepIndex === 0) {
            return status === 'pending' ? 'active' : 'completed';
        }
        // Step 1: Countered
        if (stepIndex === 1) {
            if (status === 'countered') return 'active';
            if (status === 'buyer_responded' || status === 'accepted') return 'completed';
            return 'pending';
        }
        // Step 2: Re-countered
        if (stepIndex === 2) {
            if (status === 'buyer_responded') return 'active';
            if (status === 'accepted') return 'completed';
            return 'pending';
        }
        // Step 3: Accepted/Rejected
        if (stepIndex === 3) {
            if (status === 'accepted' || status === 'rejected') return 'completed';
            return 'pending';
        }
        return 'pending';
    };

    return [
        { label: 'Purchase Request Sent', status: getStepStatus(0) },
        { label: 'Countered', status: getStepStatus(1) },
        { label: 'Re-countered', status: getStepStatus(2) },
        { label: status === 'rejected' ? 'Rejected' : 'Accepted', status: getStepStatus(3) },
    ];
};

// Waiting List Item - matches Figma design
const WaitingListItem = ({
    trade,
    onCancel,
    isProcessing,
    onViewOffer,
    onNavigateToNegotiation,
    onAskQueries,
    onChatWithSeller,
    onViewQualityReport,
    isChatting
}: {
    trade: TradeWithProduct;
    onCancel: (tradeId: string) => void;
    isProcessing: boolean;
    onViewOffer: (tradeId: string) => void;
    onNavigateToNegotiation: (tradeId: string) => void;
    onAskQueries: (trade: TradeWithProduct) => void;
    onChatWithSeller: (trade: TradeWithProduct) => void;
    onViewQualityReport: (trade: TradeWithProduct) => void;
    isChatting: boolean;
}) => {
    const productPrice = parseFloat(trade.product?.price || '0');
    const finalPrice = parseFloat(trade.buyerOfferedPrice || trade.product?.price || '0');
    const discount = productPrice > 0 ? Math.round(((productPrice - finalPrice) / productPrice) * 100) : 0;
    const steps = getTradeSteps(trade);

    const imageUrl = getImageUrl(trade.product?.productImages?.[0]);

    const showRespondButton = trade.negotiationStatus === 'countered';

    return (
        <div className="border rounded-lg p-4 bg-white">
            <div className="flex gap-4">
                {/* Trade Status - Left */}
                <div className="flex-shrink-0 w-40 border-r pr-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-3">Trade Status:</h4>
                    {steps.map((step, index) => (
                        <TradeStatusStep
                            key={index}
                            label={step.label}
                            status={step.status}
                            isLast={index === steps.length - 1}
                        />
                    ))}
                </div>

                {/* Product Info - Center */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{trade.product?.name || 'Unknown Product'}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-lg font-bold">{finalPrice.toLocaleString()} {trade.product?.currency || 'INR'}</span>
                        {discount > 0 && (
                            <>
                                <span className="text-sm text-gray-400 line-through">{productPrice.toLocaleString()} {trade.product?.currency || 'INR'}</span>
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-medium">{discount}% Off</span>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">MOQ: {trade.quantity} {trade.quantityUnit} | Stock: Available</p>

                    <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">Description</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{trade.product?.description || 'No description available'}</p>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <div className="border rounded px-3 py-1.5 text-xs text-gray-600">
                            Quantity: <span className="font-medium">{trade.quantity}</span> {trade.quantityUnit}
                        </div>
                        <button
                            onClick={() => onViewOffer(trade._id)}
                            className="border rounded px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                        >
                            <Eye size={14} /> Submitted Offer
                        </button>
                        <button
                            onClick={() => onAskQueries(trade)}
                            className="border rounded px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                        >
                            <MessageCircle size={14} /> Ask Queries
                        </button>
                        <button
                            onClick={() => onViewQualityReport(trade)}
                            className="border rounded px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                        >
                            <FlaskConical size={14} /> Product Quality Report
                        </button>
                    </div>
                </div>

                {/* Product Image - Right */}
                <div className="flex-shrink-0">
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                        <img
                            alt={trade.product?.name || 'Product'}
                            className="w-full h-full object-cover"
                            src={imageUrl}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=No+Image';
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                {showRespondButton ? (
                    <>
                        <button
                            onClick={() => onCancel(trade._id)}
                            disabled={isProcessing}
                            className="px-6 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Reject Trade'}
                        </button>
                        <button
                            onClick={() => onNavigateToNegotiation(trade._id)}
                            className="px-6 py-2 bg-black text-white text-sm rounded hover:bg-gray-800"
                        >
                            Respond to Counter
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => onCancel(trade._id)}
                            disabled={isProcessing}
                            className="px-6 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Cancel PR'}
                        </button>
                        <button
                            onClick={() => onChatWithSeller(trade)}
                            disabled={isChatting}
                            className="px-6 py-2 border text-sm rounded hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isChatting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <MessageCircle size={16} />
                            )}
                            Chat with seller
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// Accepted Request Item - matches Figma design (right panel)
const AcceptedListItem = ({ trade, onViewSCO, onReviewFinalTerms, onRejectTrade, onProceedToPO, isProcessing }: {
    trade: TradeWithProduct;
    onViewSCO: (trade: TradeWithProduct) => void;
    onReviewFinalTerms: (tradeId: string) => void;
    onRejectTrade: (tradeId: string) => void;
    onProceedToPO: (tradeId: string) => void;
    isProcessing: boolean;
}) => {
    const finalPrice = parseFloat(trade.buyerOfferedPrice || trade.product?.price || '0');
    const productPrice = parseFloat(trade.product?.price || '0');
    const discount = productPrice > 0 ? Math.round(((productPrice - finalPrice) / productPrice) * 100) : 0;
    const imageUrl = getImageUrl(trade.product?.productImages?.[0]);

    const hasSCO = !!trade.scoDocument?.filePath;
    const hasICPO = !!trade.icpoDocument?.filePath;

    return (
        <div className="border rounded-lg p-4 bg-white">
            {/* Header with image */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{trade.product?.name || 'Unknown Product'}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-bold">{finalPrice.toLocaleString()} {trade.product?.currency || 'INR'}</span>
                        {discount > 0 && (
                            <>
                                <span className="text-xs text-gray-400 line-through">{productPrice.toLocaleString()}</span>
                                <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded">{discount}% Off</span>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Quantity: {trade.quantity} {trade.quantityUnit}</p>
                </div>
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                        alt={trade.product?.name || 'Product'}
                        className="w-full h-full object-cover"
                        src={imageUrl}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
                        }}
                    />
                </div>
            </div>

            {/* Status Banner */}
            {!hasSCO && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" />
                    Waiting for seller to upload SCO...
                </div>
            )}
            {hasSCO && hasICPO && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-center gap-1">
                    <Eye size={12} />
                    ICPO sent - Awaiting seller verification
                </div>
            )}

            {/* Info sections */}
            <div className="mt-3 space-y-2">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Seller's Soft Corporate Offer</span>
                    <span className="text-gray-400">Negotiated Terms</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewSCO(trade)}
                        disabled={!hasSCO}
                        className={`flex-1 border rounded px-2 py-1.5 text-xs flex items-center justify-center gap-1 ${
                            hasSCO ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <FileText size={12} /> {hasSCO ? 'View SCO' : 'SCO Pending'}
                    </button>
                    <button
                        onClick={() => onReviewFinalTerms(trade._id)}
                        className="flex-1 border rounded px-2 py-1.5 text-xs hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                        <Eye size={12} /> Review Final Terms
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
                <button
                    onClick={() => onRejectTrade(trade._id)}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
                >
                    {isProcessing ? 'Processing...' : 'Reject Trade'}
                </button>
                <button
                    onClick={() => onProceedToPO(trade._id)}
                    disabled={!hasSCO || hasICPO}
                    className={`flex-1 px-3 py-2 text-xs rounded ${
                        hasICPO
                            ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                            : hasSCO
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {hasICPO ? 'ICPO Sent' : hasSCO ? 'Send ICPO' : 'Awaiting SCO'}
                </button>
            </div>
        </div>
    );
};

export const PurchaseRequestWaitingList = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const [trades, setTrades] = useState<TradeWithProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Query Modal state
    const [showQueryModal, setShowQueryModal] = useState(false);
    const [queryModalProductId, setQueryModalProductId] = useState<string>('');
    const [queryModalProductName, setQueryModalProductName] = useState<string>('');
    // Issue #20 - Use Set to track multiple concurrent chat operations
    const [chattingTradeIds, setChattingTradeIds] = useState<Set<string>>(new Set());

    // Review Terms Modal state
    const [showReviewTermsModal, setShowReviewTermsModal] = useState(false);
    const [reviewTermsTradeId, setReviewTermsTradeId] = useState<string>('');

    // Cancellation Modal state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelModalTrade, setCancelModalTrade] = useState<TradeWithProduct | null>(null);

    // ICPO Upload Modal state
    const [showICPOUploadModal, setShowICPOUploadModal] = useState(false);
    const [icpoUploadTradeId, setIcpoUploadTradeId] = useState<string | null>(null);

    // SCO View Document Modal state
    const [viewDocModalOpen, setViewDocModalOpen] = useState(false);
    const [viewDocInfo, setViewDocInfo] = useState<any>(null);

    const handleViewOffer = (tradeId: string) => {
        setSelectedTradeId(tradeId);
        setShowDetailsModal(true);
    };

    const handleNavigateToNegotiation = (tradeId: string) => {
        navigate(`/buyer/negotiation/${tradeId}`);
    };

    const resolveProductId = (trade: TradeWithProduct) =>
        trade.product?._id || (trade.product as any)?.id || (trade as any)?.productId;

    const resolveProductName = (trade: TradeWithProduct) =>
        trade.product?.name || 'Product';

    const getConversationId = (result: any) => {
        if (!result) return undefined;
        if (typeof result.data === 'string') return result.data;
        if (result.data && typeof result.data === 'object') {
            return (
                result.data._id ||
                result.data.conversationId ||
                result.data.id ||
                result.data.data?._id ||
                result.data.data?.conversationId ||
                result.data.data
            );
        }
        return result.conversationId;
    };

    const handleAskQueries = (trade: TradeWithProduct) => {
        const productId = resolveProductId(trade);
        if (!productId) {
            showToast('Unable to start a query for this product.', 'error');
            return;
        }
        setQueryModalProductId(productId);
        setQueryModalProductName(resolveProductName(trade));
        setShowQueryModal(true);
    };

    const handleChatWithSeller = async (trade: TradeWithProduct) => {
        const productId = resolveProductId(trade);
        if (!productId) {
            showToast('Unable to start chat for this product.', 'error');
            return;
        }
        // Issue #20 - Prevent double-clicks on same trade
        if (chattingTradeIds.has(trade._id)) {
            return;
        }
        try {
            // Issue #20 - Add to Set of chatting trades
            setChattingTradeIds(prev => new Set(prev).add(trade._id));
            const result = await createConversation(productId);
            const conversationId = getConversationId(result);
            if (conversationId) {
                navigate(`/buyer/inbox?conversationId=${conversationId}`);
                return;
            }
            if (result.message?.includes("yourself")) {
                showToast("You can't send a message to yourself.", 'error');
            } else {
                showToast(result.message || 'Failed to create conversation', 'error');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            showToast('Error creating conversation', 'error');
        } finally {
            // Issue #20 - Remove from Set of chatting trades
            setChattingTradeIds(prev => {
                const next = new Set(prev);
                next.delete(trade._id);
                return next;
            });
        }
    };

    const handleViewQualityReport = (trade: TradeWithProduct) => {
        const testReports = trade.product.productTestReports;
        if (testReports && testReports.length > 0) {
            // Open first report in new tab
            const reportUrl = testReports[0].startsWith('http')
                ? testReports[0]
                : `${BACKEND_URL}${testReports[0].startsWith('/') ? '' : '/'}${testReports[0]}`;
            window.open(reportUrl, '_blank');
        } else {
            showToast('No quality reports available for this product.', 'info');
        }
    };

    const handleReviewFinalTerms = (tradeId: string) => {
        setReviewTermsTradeId(tradeId);
        setShowReviewTermsModal(true);
    };

    const handleViewSCO = (trade: TradeWithProduct) => {
        if (trade.scoDocument?.filePath) {
            setViewDocInfo({
                filePath: trade.scoDocument.filePath,
                originalName: trade.scoDocument.originalName || 'SCO Document',
                mimeType: trade.scoDocument.mimeType || 'application/pdf',
                size: trade.scoDocument.size || 0,
                uploadedAt: trade.scoDocument.uploadedAt || new Date().toISOString(),
                status: trade.scoDocument.status || 'uploaded'
            });
            setViewDocModalOpen(true);
        } else {
            showToast('SCO document not available.', 'info');
        }
    };

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            setLoading(true);
            const response = await getUserTrades();
            setTrades(response.data as TradeWithProduct[]);
        } catch (err) {
            setError('Failed to fetch trades');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelTrade = (tradeId: string) => {
        const trade = trades.find(t => t._id === tradeId);
        if (trade) {
            setCancelModalTrade(trade);
            setShowCancelModal(true);
        }
    };

    const handleCancellationComplete = async () => {
        setShowCancelModal(false);
        setCancelModalTrade(null);
        await fetchTrades();
    };

    const handleRejectAcceptedTrade = async (tradeId: string) => {
        if (!window.confirm('Are you sure you want to reject this accepted trade?')) {
            return;
        }

        try {
            setProcessingId(tradeId);
            await rejectTrade(tradeId, 'Rejected by buyer after acceptance');
            await fetchTrades();
        } catch (err) {
            console.error('Failed to reject trade:', err);
            showToast('Failed to reject trade. Please try again.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleProceedToPO = (tradeId: string) => {
        // Open ICPO upload modal
        setIcpoUploadTradeId(tradeId);
        setShowICPOUploadModal(true);
    };

    // Handle ICPO file upload
    const handleICPOUpload = async (file: File, notes?: string) => {
        if (!icpoUploadTradeId) return;

        try {
            await uploadICPO(icpoUploadTradeId, file, notes);
            showToast('ICPO uploaded successfully! The seller will review it.', 'success');
            setShowICPOUploadModal(false);
            setIcpoUploadTradeId(null);
            await fetchTrades();
        } catch (err: any) {
            showToast(err.message || 'Failed to upload ICPO', 'error');
            throw err;
        }
    };

    // Filter trades by status
    // Only show trades that are still in PR/negotiation phase (not advanced to SPA+)
    const pendingTrades = trades.filter(t =>
        t.negotiationStatus !== 'accepted' &&
        t.negotiationStatus !== 'rejected' &&
        t.purchaseRequestStatus !== 'rejected' &&
        !ADVANCED_PHASES.includes(t.tradePhase || '')
    );

    // Only show accepted trades that haven't advanced past ICPO phase
    const acceptedTrades = trades.filter(t =>
        t.negotiationStatus === 'accepted' &&
        !ADVANCED_PHASES.includes(t.tradePhase || '')
    );

    if (loading) {
        return (
            <div className="flex border rounded-lg my-6 w-full p-8">
                <div className="w-full flex items-center justify-center h-40">
                    <Loader2 className="animate-spin mr-2" />
                    <span className="text-gray-500">Loading trade requests...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex border rounded-lg my-6 w-full p-8">
                <div className="w-full flex items-center justify-center h-40">
                    <span className="text-red-500">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-6 my-6 w-full">
            {/* Waiting List - Left */}
            <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Waiting list</h2>
                {pendingTrades.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center text-gray-500 bg-white">
                        No pending trade requests
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingTrades.map((trade) => (
                            <WaitingListItem
                                key={trade._id}
                                trade={trade}
                                onCancel={handleCancelTrade}
                                isProcessing={processingId === trade._id}
                                onViewOffer={handleViewOffer}
                                onNavigateToNegotiation={handleNavigateToNegotiation}
                                onAskQueries={handleAskQueries}
                                onChatWithSeller={handleChatWithSeller}
                                onViewQualityReport={handleViewQualityReport}
                                isChatting={chattingTradeIds.has(trade._id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Accepted Requests - Right */}
            <div className="w-80 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Accepted Requests</h2>
                {acceptedTrades.length === 0 ? (
                    <div className="border rounded-lg p-8 text-center text-gray-500 bg-white">
                        No accepted trades yet
                    </div>
                ) : (
                    <div className="space-y-4">
                        {acceptedTrades.map((trade) => (
                            <AcceptedListItem
                                key={trade._id}
                                trade={trade}
                                onViewSCO={handleViewSCO}
                                onReviewFinalTerms={handleReviewFinalTerms}
                                onRejectTrade={handleRejectAcceptedTrade}
                                onProceedToPO={handleProceedToPO}
                                isProcessing={processingId === trade._id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Trade Details Modal */}
            {selectedTradeId && (
                <TradeDetailsModal
                    tradeId={selectedTradeId}
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedTradeId(null);
                    }}
                    onNavigateToNegotiation={() => {
                        setShowDetailsModal(false);
                        handleNavigateToNegotiation(selectedTradeId);
                    }}
                />
            )}

            {/* Query Modal */}
            <QueryModal
                isOpen={showQueryModal}
                onClose={() => {
                    setShowQueryModal(false);
                    setQueryModalProductId('');
                    setQueryModalProductName('');
                }}
                productId={queryModalProductId}
                productName={queryModalProductName}
                recipientType="seller"
                userRole="Buyer"
            />

            {/* Review Terms Modal */}
            <ReviewTermsModal
                isOpen={showReviewTermsModal}
                onClose={() => {
                    setShowReviewTermsModal(false);
                    setReviewTermsTradeId('');
                }}
                tradeId={reviewTermsTradeId}
                userRole="Buyer"
            />

            {/* Trade Cancellation Modal */}
            {cancelModalTrade && (
                <TradeCancellationModal
                    isOpen={showCancelModal}
                    onClose={() => {
                        setShowCancelModal(false);
                        setCancelModalTrade(null);
                    }}
                    tradeId={cancelModalTrade._id}
                    tradePhase={(cancelModalTrade as any).tradePhase || 'PR'}
                    productName={cancelModalTrade.product?.name || 'Unknown Product'}
                    onCancelled={handleCancellationComplete}
                />
            )}

            {/* ICPO Upload Modal */}
            {showICPOUploadModal && (
                <DocumentUploadModal
                    isOpen={showICPOUploadModal}
                    onClose={() => {
                        setShowICPOUploadModal(false);
                        setIcpoUploadTradeId(null);
                    }}
                    onUpload={handleICPOUpload}
                    documentType="icpo"
                />
            )}

            {/* SCO View Document Modal */}
            {viewDocModalOpen && viewDocInfo && (
                <ViewDocumentModal
                    isOpen={viewDocModalOpen}
                    onClose={() => {
                        setViewDocModalOpen(false);
                        setViewDocInfo(null);
                    }}
                    document={viewDocInfo}
                    documentType="sco"
                />
            )}
        </div>
    );
};
