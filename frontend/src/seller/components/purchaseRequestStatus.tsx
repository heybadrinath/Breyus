import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Check, X, MessageSquare, ArrowRight, Eye, Bot, FileUp, RefreshCw, FileText, CheckCircle, Download, Loader2, AlertTriangle } from "lucide-react";
import { getSellerTrades, acceptTrade, rejectTrade, Trade, DocumentInfo, uploadDocument, downloadPurchaseRequest } from "../../services/trade.service";
import StatusBadge, { getTradeStatusType } from "../../components/StatusBadge";
import TradeDetailsModal from "../../components/TradeDetailsModal";
import TradeCancellationModal from "../../components/TradeCancellationModal";
import ViewDocumentModal from "../../components/ViewDocumentModal";
import DocumentReplaceModal from "../../components/DocumentReplaceModal";
import DocumentUploadModal from "../../components/DocumentUploadModal";
import { useNotifications } from "../../contexts/NotificationContext";
import CompanyAvatar from "../../components/ui/CompanyAvatar";
import ClickableCompanyName from "../../components/ui/ClickableCompanyName";

interface TradeWithExtras extends Omit<Trade, 'purchaseRequestStatus' | 'negotiationStatus'> {
    purchaseRequestStatus?: string;
    negotiationStatus?: string;
    buyerOfferedPrice?: string;
    buyerMessage?: string;
    scoDocument?: DocumentInfo;
    icpoDocument?: DocumentInfo;
    tradePhase?: string;
}

// Phases that should NOT appear in PR Status (they have progressed beyond ICPO)
const ADVANCED_PHASES = ['SPA', 'PAYMENT', 'BOL', 'COMPLETED'];

// PHASE 2 REFACTORING: Cancelled trade 2-day visibility filter
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const shouldShowCancelledTrade = (trade: TradeWithExtras): boolean => {
    // Always show non-cancelled trades (check both tradePhase AND negotiationStatus)
    if (trade.tradePhase !== 'CANCELLED' && trade.negotiationStatus !== 'cancelled' && trade.negotiationStatus !== 'rejected') {
        return true;
    }
    // For cancelled/rejected trades, show only if cancelled within last 2 days
    const cancelledAt = (trade as any).cancelledAt || (trade as any).autoCancelledAt;
    if (!cancelledAt) return true; // No cancellation date, show it
    const cancelledDate = new Date(cancelledAt);
    const twoDaysAgo = new Date(Date.now() - TWO_DAYS_MS);
    return cancelledDate > twoDaysAgo;
};

export const PurchaseRequestStatus = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const [trades, setTrades] = useState<TradeWithExtras[]>([]);
    const [acceptedTrades, setAcceptedTrades] = useState<TradeWithExtras[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedTrade, setSelectedTrade] = useState<TradeWithExtras | null>(null);
    const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);

    // Trade Cancellation Modal state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelModalTrade, setCancelModalTrade] = useState<TradeWithExtras | null>(null);

    // Trade Details Modal state
    const [showTradeDetailsModal, setShowTradeDetailsModal] = useState(false);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

    // View Document Modal state
    const [showViewDocModal, setShowViewDocModal] = useState(false);
    const [viewDocTrade, setViewDocTrade] = useState<TradeWithExtras | null>(null);
    const [viewDocType, setViewDocType] = useState<'sco' | 'icpo'>('sco');

    // Replace Document Modal state
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [replaceDocTrade, setReplaceDocTrade] = useState<TradeWithExtras | null>(null);

    // SCO Upload Modal state
    const [showSCOUploadModal, setShowSCOUploadModal] = useState(false);
    const [scoUploadTradeId, setScoUploadTradeId] = useState<string | null>(null);

    // PR Download state
    const [downloadingPRId, setDownloadingPRId] = useState<string | null>(null);

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

    const handleNavigateToNegotiation = (tradeId: string) => {
        navigate(`/seller/negotiation/${tradeId}`);
    };

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            setLoading(true);
            const response = await getSellerTrades();
            const allTrades = response.data as TradeWithExtras[];

            // Pending trades - use exclusion logic to include recently cancelled trades
            // PHASE 2 REFACTORING: Include cancelled trade 2-day visibility filter
            // Include: pending, countered, buyer_responded, AND recently cancelled (within 2 days)
            const pendingTrades = allTrades.filter((trade) => {
                // First check 2-day visibility for cancelled trades
                if (!shouldShowCancelledTrade(trade)) return false;

                // Exclude advanced phases (SPA, PAYMENT, BOL, COMPLETED)
                if (ADVANCED_PHASES.includes(trade.tradePhase || '')) return false;

                // Include recently cancelled trades (they have tradePhase = 'CANCELLED')
                if (trade.tradePhase === 'CANCELLED' || trade.negotiationStatus === 'cancelled') {
                    return true; // Show cancelled trades in pending section with visual indicator
                }

                // Include normal pending/negotiation trades
                return trade.negotiationStatus !== 'accepted' && trade.negotiationStatus !== 'rejected';
            });
            setTrades(pendingTrades);

            // Accepted trades (for Send SCO button) - only show accepted trades in PR/SCO/ICPO phase
            // Exclude cancelled trades from accepted section
            const accepted = allTrades.filter(
                (trade) => shouldShowCancelledTrade(trade) &&
                trade.negotiationStatus === 'accepted' &&
                trade.tradePhase !== 'CANCELLED' &&
                !ADVANCED_PHASES.includes(trade.tradePhase || '')
            );
            setAcceptedTrades(accepted);
        } catch (err) {
            setError('Failed to fetch trades');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewTradeTerms = (tradeId: string) => {
        setSelectedTradeId(tradeId);
        setShowTradeDetailsModal(true);
    };

    const handleSendSCO = (tradeId: string) => {
        // Open SCO upload modal
        setScoUploadTradeId(tradeId);
        setShowSCOUploadModal(true);
    };

    const handleSCOUpload = async (file: File, notes?: string) => {
        if (!scoUploadTradeId) return;
        await uploadDocument(scoUploadTradeId, 'sco', file, notes);
        setShowSCOUploadModal(false);
        setScoUploadTradeId(null);
        await fetchTrades(); // Refresh to show updated status
    };

    const handleAccept = async (tradeId: string) => {
        try {
            setProcessingId(tradeId);
            await acceptTrade(tradeId);
            await fetchTrades();
        } catch (err) {
            console.error('Failed to accept trade:', err);
            showToast('Failed to accept trade. Please try again.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (trade: TradeWithExtras) => {
        setCancelModalTrade(trade);
        setShowCancelModal(true);
    };

    const handleCancellationComplete = async () => {
        setShowCancelModal(false);
        setCancelModalTrade(null);
        await fetchTrades();
    };

    const openCounterOfferModal = (trade: TradeWithExtras) => {
        setSelectedTrade(trade);
        setShowCounterOfferModal(true);
    };

    // Handle viewing SCO document
    const handleViewSCO = (trade: TradeWithExtras) => {
        setViewDocTrade(trade);
        setViewDocType('sco');
        setShowViewDocModal(true);
    };

    // Handle viewing ICPO document
    const handleViewICPO = (trade: TradeWithExtras) => {
        setViewDocTrade(trade);
        setViewDocType('icpo');
        setShowViewDocModal(true);
    };

    // Handle replacing SCO document
    const handleReplaceSCO = (trade: TradeWithExtras) => {
        setReplaceDocTrade(trade);
        setShowReplaceModal(true);
    };

    // Confirm replace and open SCO upload modal
    const handleConfirmReplace = (reason: string) => {
        if (replaceDocTrade) {
            // Close replace modal and open SCO upload modal
            setShowReplaceModal(false);
            setScoUploadTradeId(replaceDocTrade._id);
            setShowSCOUploadModal(true);
        }
        setReplaceDocTrade(null);
    };

    if (loading) {
        return (
            <div className="border-t-2 border-x-2 rounded-lg my-8 p-8">
                <div className="flex justify-center items-center h-40">
                    <span className="text-gray-500">Loading trades...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border-t-2 border-x-2 rounded-lg my-8 p-8">
                <div className="flex justify-center items-center h-40">
                    <span className="text-red-500">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="border-t-2 border-x-2 rounded-lg my-8">
                <div className="p-8 flex-col flex">
                    <div className="flex">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-700">Purchase Requests</h1>
                            <span className="text-gray-500">Review and respond to incoming trade requests</span>
                        </div>
                        <Filter className="ml-auto cursor-pointer hover:text-gray-600" />
                    </div>
                    <div className="flex mt-8 items-center">
                        <span className="text-gray-600 font-medium">
                            {trades.length} pending request{trades.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {trades.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No pending purchase requests
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2">
                                <th className="text-gray-600 font-medium py-2">Buyer</th>
                                <th className="text-gray-600 font-medium py-2">View Trade</th>
                                <th className="text-gray-600 font-medium py-2">Product</th>
                                <th className="text-gray-600 font-medium py-2">Negotiation</th>
                                <th className="text-gray-600 font-medium py-2">Status</th>
                                <th className="text-gray-600 font-medium py-2">Request AI</th>
                                <th className="text-gray-600 font-medium py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.map((trade) => {
                                // Check if trade is cancelled
                                const isCancelled = trade.tradePhase === 'CANCELLED' || trade.negotiationStatus === 'cancelled';

                                return (
                                    <tr key={trade._id} className={`border-b ${isCancelled ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                                        {/* Buyer */}
                                        <td className="py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <CompanyAvatar
                                                    companyId={(trade.buyer as any)?.company?._id}
                                                    companyName={(trade.buyer as any)?.company?.companyName || trade.buyer?.mail || 'Buyer'}
                                                    profilePicture={(trade.buyer as any)?.company?.profilePicture}
                                                    size="sm"
                                                    clickable={!isCancelled && !!(trade.buyer as any)?.company?._id}
                                                    viewerRole="seller"
                                                />
                                                <ClickableCompanyName
                                                    companyId={isCancelled ? null : (trade.buyer as any)?.company?._id}
                                                    companyName={(trade.buyer as any)?.company?.companyName || trade.buyer?.mail || 'N/A'}
                                                    className={`text-sm ${isCancelled ? 'text-gray-500' : ''}`}
                                                    viewerRole="seller"
                                                />
                                            </div>
                                        </td>
                                        {/* View Trade */}
                                        <td className="py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleViewTradeTerms(trade._id)}
                                                    className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                                >
                                                    <Eye size={14} /> View
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPR(trade._id)}
                                                    disabled={downloadingPRId === trade._id}
                                                    className="text-blue-600 hover:underline text-sm flex items-center gap-1 disabled:opacity-50"
                                                >
                                                    {downloadingPRId === trade._id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Download size={14} />
                                                    )}
                                                    PR
                                                </button>
                                            </div>
                                        </td>
                                        {/* Product */}
                                        <td className="py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={`text-sm font-medium ${isCancelled ? 'text-gray-500 line-through' : ''}`}>
                                                    {(trade.product as any)?.name || 'N/A'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {trade.quantity} {trade.quantityUnit}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Negotiation */}
                                        <td className="py-4 text-center">
                                            {isCancelled ? (
                                                <span className="text-gray-400 text-sm">—</span>
                                            ) : trade.negotiationStatus === 'countered' ? (
                                                <span className="text-gray-500 text-sm">Negotiated</span>
                                            ) : (
                                                <button
                                                    onClick={() => handleNavigateToNegotiation(trade._id)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Negotiate
                                                </button>
                                            )}
                                        </td>
                                        {/* Status */}
                                        <td className="py-4 text-center">
                                            {isCancelled ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                    Cancelled
                                                </span>
                                            ) : (
                                                <StatusBadge
                                                    status={getTradeStatusType(trade)}
                                                    showDot={true}
                                                />
                                            )}
                                        </td>
                                        {/* Request AI */}
                                        <td className="py-4 text-center">
                                            <span className="text-gray-400 text-xs flex items-center gap-1 justify-center">
                                                <Bot size={14} /> Coming soon
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td className="py-4">
                                            {isCancelled ? (
                                                <div className="flex justify-center">
                                                    <span className="text-xs text-gray-400 italic">No actions</span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleAccept(trade._id)}
                                                        disabled={processingId === trade._id}
                                                        className="border-2 border-green-400 rounded-full p-1 hover:bg-green-50 disabled:opacity-50"
                                                        title="Accept"
                                                    >
                                                        <Check className="text-green-400" size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openRejectModal(trade)}
                                                        disabled={processingId === trade._id}
                                                        className="border-2 border-red-400 rounded-full p-1 hover:bg-red-50 disabled:opacity-50"
                                                        title="Reject"
                                                    >
                                                        <X className="text-red-400" size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* Accepted Trades Section - SCO Management */}
                {acceptedTrades.length > 0 && (
                    <div className="p-8 border-t">
                        <h2 className="text-lg font-bold text-gray-700 mb-4">Accepted Trades - SCO Status</h2>

                        {/* Warning banner: trades needing SCO upload */}
                        {(() => {
                            const needingSCO = acceptedTrades.filter(t => !t.scoDocument?.filePath).length;
                            if (needingSCO === 0) return null;
                            return (
                                <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    <span className="text-sm font-medium text-amber-800">
                                        {needingSCO} trade{needingSCO !== 1 ? 's' : ''} need SCO upload
                                    </span>
                                </div>
                            );
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...acceptedTrades]
                                .sort((a, b) => {
                                    // Trades needing SCO appear first
                                    const aNeedsSCO = !a.scoDocument?.filePath ? 0 : 1;
                                    const bNeedsSCO = !b.scoDocument?.filePath ? 0 : 1;
                                    return aNeedsSCO - bNeedsSCO;
                                })
                                .map((trade) => {
                                const hasSCO = trade.scoDocument && trade.scoDocument.filePath;
                                const hasICPO = trade.icpoDocument && trade.icpoDocument.filePath;

                                return (
                                    <div key={trade._id} className={`border rounded-lg p-4 ${hasSCO ? 'bg-blue-50' : 'bg-amber-50 border-amber-300 border-2'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-medium">{(trade.product as any)?.name || 'N/A'}</span>
                                                <p className="text-xs text-gray-500">{trade.buyer?.mail || 'Buyer'}</p>
                                            </div>
                                            <StatusBadge status="accepted" showDot={true} />
                                        </div>
                                        <div className="text-sm text-gray-600 mb-3">
                                            {trade.quantity} {trade.quantityUnit} @ {trade.buyerOfferedPrice || 'N/A'}
                                        </div>

                                        {/* SCO Status Section - PHASE 2: Removed Replace option, only re-upload when rejected */}
                                        {hasSCO ? (
                                            <div className="space-y-2">
                                                {/* SCO Status Badge - shows appropriate status based on document state */}
                                                {trade.scoDocument?.status === 'rejected' ? (
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded border border-red-200">
                                                            <X className="w-4 h-4 text-red-500" />
                                                            <span className="text-sm font-medium text-red-700">SCO Rejected</span>
                                                        </div>
                                                        {/* PHASE 2: Show rejection tracking info */}
                                                        {(() => {
                                                            const tracking = (trade as any).scoRejectionTracking;
                                                            const rejectionCount = tracking?.rejectionCount || 0;
                                                            const maxAttempts = tracking?.maxAttempts || 2;
                                                            const remainingAttempts = maxAttempts - rejectionCount;
                                                            const isLastAttempt = remainingAttempts === 1;

                                                            return (
                                                                <div className={`p-2 rounded border ${isLastAttempt ? 'bg-orange-50 border-orange-300' : 'bg-amber-50 border-amber-200'}`}>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={`text-xs font-medium ${isLastAttempt ? 'text-orange-700' : 'text-amber-700'}`}>
                                                                            {isLastAttempt ? '⚠️ Final Attempt!' : `Attempt ${rejectionCount + 1} of ${maxAttempts}`}
                                                                        </span>
                                                                        <span className={`text-xs ${isLastAttempt ? 'text-orange-600' : 'text-amber-600'}`}>
                                                                            {remainingAttempts} remaining
                                                                        </span>
                                                                    </div>
                                                                    {isLastAttempt && (
                                                                        <p className="text-xs text-orange-600 mt-1">
                                                                            If rejected again, trade will be auto-cancelled
                                                                        </p>
                                                                    )}
                                                                    {tracking?.lastRejectionReason && (
                                                                        <p className="text-xs text-gray-600 mt-1 italic">
                                                                            Reason: {tracking.lastRejectionReason}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : trade.scoDocument?.status === 'approved' ? (
                                                    <div className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span className="text-sm font-medium text-green-700">SCO Approved</span>
                                                        {trade.scoDocument?.uploadedAt && (
                                                            <span className="text-xs text-gray-500 ml-auto">
                                                                {new Date(trade.scoDocument.uploadedAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                                        <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
                                                        <span className="text-sm font-medium text-yellow-700">SCO Under Review</span>
                                                        {trade.scoDocument?.uploadedAt && (
                                                            <span className="text-xs text-gray-500 ml-auto">
                                                                {new Date(trade.scoDocument.uploadedAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* ICPO Status */}
                                                {hasICPO ? (
                                                    <div className="flex items-center gap-2 p-2 bg-white rounded border border-blue-200">
                                                        <FileText className="w-4 h-4 text-blue-500" />
                                                        <span className="text-sm font-medium text-blue-700">ICPO Received</span>
                                                        <button
                                                            onClick={() => handleViewICPO(trade)}
                                                            className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <Eye size={12} /> View
                                                        </button>
                                                    </div>
                                                ) : trade.scoDocument?.status === 'approved' ? (
                                                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                                        <span className="text-sm text-yellow-700">Awaiting Buyer ICPO</span>
                                                    </div>
                                                ) : null}

                                                {/* Action Buttons - PHASE 2: Only show re-upload when rejected */}
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleViewSCO(trade)}
                                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                                                    >
                                                        <Eye size={14} /> View SCO
                                                    </button>
                                                    {/* PHASE 2: Only show re-upload button when document is rejected */}
                                                    {trade.scoDocument?.status === 'rejected' && (
                                                        <button
                                                            onClick={() => handleReplaceSCO(trade)}
                                                            className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-1"
                                                        >
                                                            <RefreshCw size={14} /> Re-upload
                                                        </button>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadPR(trade._id)}
                                                    disabled={downloadingPRId === trade._id}
                                                    className="w-full mt-2 px-3 py-2 text-sm border border-blue-200 text-blue-600 rounded hover:bg-blue-50 flex items-center justify-center gap-1 disabled:opacity-50"
                                                >
                                                    {downloadingPRId === trade._id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Download size={14} />
                                                    )}
                                                    Download PR
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {/* Pending SCO Message */}
                                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-amber-300 mb-2">
                                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                                    <span className="text-sm text-amber-700 font-medium">Upload your SCO to proceed</span>
                                                </div>
                                                <button
                                                    onClick={() => handleSendSCO(trade._id)}
                                                    className="w-full px-4 py-3 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2 shadow-sm"
                                                >
                                                    <FileUp size={18} /> Send SCO
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Trade Details Modal */}
            {selectedTradeId && (
                <TradeDetailsModal
                    tradeId={selectedTradeId}
                    isOpen={showTradeDetailsModal}
                    onClose={() => {
                        setShowTradeDetailsModal(false);
                        setSelectedTradeId(null);
                    }}
                    onNavigateToNegotiation={() => {
                        setShowTradeDetailsModal(false);
                        handleNavigateToNegotiation(selectedTradeId);
                    }}
                />
            )}

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
                    productName={(cancelModalTrade.product as any)?.name || 'Unknown Product'}
                    onCancelled={handleCancellationComplete}
                />
            )}

            {/* View Buyer Terms Modal */}
            {showCounterOfferModal && selectedTrade && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[500px] max-w-[90vw]">
                        <h3 className="text-lg font-semibold mb-4">Buyer's Offer Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-500">Product</label>
                                <p className="font-medium">{(selectedTrade.product as any)?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Quantity</label>
                                <p className="font-medium">{selectedTrade.quantity} {selectedTrade.quantityUnit}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Offered Price</label>
                                <p className="font-medium text-green-600">
                                    {selectedTrade.buyerOfferedPrice || 'No counter-offer'}
                                </p>
                            </div>
                            {selectedTrade.buyerMessage && (
                                <div>
                                    <label className="text-sm text-gray-500">Buyer's Message</label>
                                    <p className="p-3 bg-gray-50 rounded-lg">{selectedTrade.buyerMessage}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => {
                                    setShowCounterOfferModal(false);
                                    setSelectedTrade(null);
                                }}
                                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setShowCounterOfferModal(false);
                                    handleNavigateToNegotiation(selectedTrade._id);
                                }}
                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                            >
                                <ArrowRight size={16} />
                                Negotiate
                            </button>
                            <button
                                onClick={() => handleAccept(selectedTrade._id)}
                                disabled={processingId === selectedTrade._id}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                                Accept Offer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Document Modal */}
            {viewDocTrade && (
                <ViewDocumentModal
                    isOpen={showViewDocModal}
                    onClose={() => {
                        setShowViewDocModal(false);
                        setViewDocTrade(null);
                    }}
                    tradeId={viewDocTrade._id}
                    documentType={viewDocType}
                    document={(viewDocType === 'sco' ? viewDocTrade.scoDocument : viewDocTrade.icpoDocument) as DocumentInfo | null}
                />
            )}

            {/* Replace Document Modal */}
            {replaceDocTrade && (
                <DocumentReplaceModal
                    isOpen={showReplaceModal}
                    onClose={() => {
                        setShowReplaceModal(false);
                        setReplaceDocTrade(null);
                    }}
                    onConfirm={handleConfirmReplace}
                    documentType="sco"
                    currentDocument={replaceDocTrade.scoDocument}
                />
            )}

            {/* SCO Upload Modal */}
            <DocumentUploadModal
                isOpen={showSCOUploadModal}
                onClose={() => {
                    setShowSCOUploadModal(false);
                    setScoUploadTradeId(null);
                }}
                onUpload={handleSCOUpload}
                documentType="sco"
            />
        </>
    );
};
