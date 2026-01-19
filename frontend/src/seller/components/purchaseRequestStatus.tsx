import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Check, X, MessageSquare, ArrowRight, Eye, Bot, FileUp, RefreshCw, FileText, CheckCircle } from "lucide-react";
import { getSellerTrades, acceptTrade, rejectTrade, Trade, DocumentInfo, uploadDocument } from "../../services/trade.service";
import StatusBadge, { getTradeStatusType } from "../../components/StatusBadge";
import TradeDetailsModal from "../../components/TradeDetailsModal";
import TradeCancellationModal from "../../components/TradeCancellationModal";
import ViewDocumentModal from "../../components/ViewDocumentModal";
import DocumentReplaceModal from "../../components/DocumentReplaceModal";
import DocumentUploadModal from "../../components/DocumentUploadModal";
import { useNotifications } from "../../contexts/NotificationContext";

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

            // Pending trades - exclude trades in advanced phases
            const pendingTrades = allTrades.filter(
                (trade) => (trade.purchaseRequestStatus === 'pending' || trade.negotiationStatus === 'pending' || trade.negotiationStatus === 'buyer_responded' || trade.negotiationStatus === 'countered') &&
                !ADVANCED_PHASES.includes(trade.tradePhase || '')
            );
            setTrades(pendingTrades);

            // Accepted trades (for Send SCO button) - only show trades in SCO/ICPO phase, not SPA+
            const accepted = allTrades.filter(
                (trade) => trade.negotiationStatus === 'accepted' &&
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
                            {trades.map((trade) => (
                                <tr key={trade._id} className="border-b hover:bg-gray-50">
                                    {/* Buyer */}
                                    <td className="py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {trade.buyer?.mail?.charAt(0).toUpperCase() || 'B'}
                                                </span>
                                            </div>
                                            <span className="text-sm">{trade.buyer?.mail || 'N/A'}</span>
                                        </div>
                                    </td>
                                    {/* View Trade */}
                                    <td className="py-4 text-center">
                                        <button
                                            onClick={() => handleViewTradeTerms(trade._id)}
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1 justify-center"
                                        >
                                            <Eye size={14} /> View Trade
                                        </button>
                                    </td>
                                    {/* Product */}
                                    <td className="py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-medium">
                                                {(trade.product as any)?.name || 'N/A'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {trade.quantity} {trade.quantityUnit}
                                            </span>
                                        </div>
                                    </td>
                                    {/* Negotiation */}
                                    <td className="py-4 text-center">
                                        {trade.negotiationStatus === 'countered' ? (
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
                                        <StatusBadge
                                            status={getTradeStatusType(trade)}
                                            showDot={true}
                                        />
                                    </td>
                                    {/* Request AI */}
                                    <td className="py-4 text-center">
                                        <span className="text-gray-400 text-xs flex items-center gap-1 justify-center">
                                            <Bot size={14} /> Coming soon
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td className="py-4">
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Accepted Trades Section - SCO Management */}
                {acceptedTrades.length > 0 && (
                    <div className="p-8 border-t">
                        <h2 className="text-lg font-bold text-gray-700 mb-4">Accepted Trades - SCO Status</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {acceptedTrades.map((trade) => {
                                const hasSCO = trade.scoDocument && trade.scoDocument.filePath;
                                const hasICPO = trade.icpoDocument && trade.icpoDocument.filePath;

                                return (
                                    <div key={trade._id} className={`border rounded-lg p-4 ${hasSCO ? 'bg-blue-50' : 'bg-green-50'}`}>
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

                                        {/* SCO Status Section */}
                                        {hasSCO ? (
                                            <div className="space-y-2">
                                                {/* SCO Sent Badge */}
                                                <div className="flex items-center gap-2 p-2 bg-white rounded border border-green-200">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span className="text-sm font-medium text-green-700">SCO Sent</span>
                                                    {trade.scoDocument?.uploadedAt && (
                                                        <span className="text-xs text-gray-500 ml-auto">
                                                            {new Date(trade.scoDocument.uploadedAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>

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
                                                ) : (
                                                    <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                                        <span className="text-sm text-yellow-700">Awaiting Buyer ICPO</span>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleViewSCO(trade)}
                                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center gap-1"
                                                    >
                                                        <Eye size={14} /> View SCO
                                                    </button>
                                                    <button
                                                        onClick={() => handleReplaceSCO(trade)}
                                                        className="flex-1 px-3 py-2 text-sm border border-orange-300 text-orange-600 rounded hover:bg-orange-50 flex items-center justify-center gap-1"
                                                    >
                                                        <RefreshCw size={14} /> Replace
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {/* Pending SCO Message */}
                                                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-200 mb-2">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                    <span className="text-sm text-blue-700">Upload your SCO to proceed</span>
                                                </div>
                                                <button
                                                    onClick={() => handleSendSCO(trade._id)}
                                                    className="w-full px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 flex items-center justify-center gap-2"
                                                >
                                                    <FileUp size={16} /> Send SCO
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
