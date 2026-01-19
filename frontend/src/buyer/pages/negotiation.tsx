import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, DollarSign, MessageSquare, Check, X, Loader2, FileText, User, Building } from 'lucide-react';
import { getTradeById, buyerRespondToCounter, acceptTrade, rejectTrade, Trade, Incoterms } from '../../services/trade.service';
import NegotiationHistory from '../../components/NegotiationHistory';
import Sidebar from '../../components/Sidebar';
import TradeSkeleton from '../../components/skeletons/TradeSkeleton';
import { socketService } from '../../services/socket.service';
import { getMe } from '../../services/auth.service';
import { INCOTERM_OPTIONS, getStatusColor } from '../../constants/trade.constants';
import SelectField from '../../components/SelectField';
import { useNotifications } from '../../contexts/NotificationContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

const BuyerNegotiation: React.FC = () => {
    const { tradeId } = useParams<{ tradeId: string }>();
    const navigate = useNavigate();
    const { showToast } = useNotifications();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trade, setTrade] = useState<Trade | null>(null);

    // Response form state
    const [responsePrice, setResponsePrice] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [selectedIncoterm, setSelectedIncoterm] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        let isMounted = true;
        // Issue #6 - Store current tradeId to avoid stale closure issues
        const currentTradeId = tradeId;

        const setupSocket = async () => {
            if (!currentTradeId) return;

            try {
                // Issue #6 - Clear existing listeners BEFORE setting up new ones
                // This prevents accumulation of stale listeners
                socketService.offTradeUpdate();
                socketService.offNegotiationUpdate();

                // 1. Connect and Join Trade Room
                const userInfo = await getMe();
                if (userInfo && userInfo.userId && isMounted) {
                    socketService.connectTrade();
                    socketService.joinTrade(userInfo.userId, currentTradeId);
                }

                // 2. Setup Listeners with current tradeId captured in closure
                socketService.onTradeUpdate((data) => {
                    if (data.tradeId === currentTradeId && isMounted) {
                        fetchTrade();
                    }
                });

                socketService.onNegotiationUpdate((data) => {
                    if (data.tradeId === currentTradeId && isMounted) {
                        fetchTrade();
                    }
                });

            } catch (err) {
                console.error("Failed to setup socket:", err);
            }
        };

        if (currentTradeId) {
            fetchTrade();
            setupSocket();
        }

        return () => {
            isMounted = false;
            // Cleanup: remove listeners and leave trade
            if (currentTradeId) {
                socketService.leaveTrade(currentTradeId);
            }
            socketService.offTradeUpdate();
            socketService.offNegotiationUpdate();
        };
    }, [tradeId]);

    const fetchTrade = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTradeById(tradeId!);
            const tradeData = response.data as Trade;
            setTrade(tradeData);

            // Pre-fill response with current offer or seller's counter
            if (tradeData.buyerOfferedPrice) {
                setResponsePrice(tradeData.buyerOfferedPrice);
            } else if (tradeData.sellerOfferedPrice) {
                setResponsePrice(tradeData.sellerOfferedPrice);
            } else if (tradeData.product?.price) {
                setResponsePrice(tradeData.product.price);
            }

            if (tradeData.buyerIncoterms?.selectedIncoterm) {
                setSelectedIncoterm(tradeData.buyerIncoterms.selectedIncoterm);
            } else if (tradeData.sellerOfferedIncoterms?.selectedIncoterm) {
                setSelectedIncoterm(tradeData.sellerOfferedIncoterms.selectedIncoterm);
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to load trade';
            setError(errorMessage);
            // Issue #13 - Show error toast so user knows something went wrong
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitResponse = async () => {
        if (!tradeId) return;

        try {
            setSubmitting(true);
            setError(null);

            const responseData = {
                offeredPrice: responsePrice || undefined,
                offeredIncoterms: selectedIncoterm ? {
                    selectedIncoterm,
                    selectedIncotermData: trade?.sellerOfferedIncoterms?.selectedIncotermData || trade?.buyerIncoterms?.selectedIncotermData || {}
                } as Incoterms : undefined,
                message: responseMessage || undefined
            };

            await buyerRespondToCounter(tradeId, responseData);
            await fetchTrade();
            showToast('Response submitted successfully!', 'success');
        } catch (err: any) {
            setError(err.message || 'Failed to submit response');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAcceptCounter = async () => {
        if (!tradeId) return;

        if (!window.confirm('Are you sure you want to accept the seller\'s offer?')) {
            return;
        }

        try {
            setSubmitting(true);
            await acceptTrade(tradeId);
            await fetchTrade();
            showToast('Trade accepted successfully!', 'success');
        } catch (err: any) {
            setError(err.message || 'Failed to accept trade');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!tradeId) return;

        try {
            setSubmitting(true);
            await rejectTrade(tradeId, rejectReason);
            setShowRejectModal(false);
            await fetchTrade();
            showToast('Trade rejected', 'info');
        } catch (err: any) {
            setError(err.message || 'Failed to reject trade');
        } finally {
            setSubmitting(false);
        }
    };

    const canRespond = () => {
        if (!trade) return false;
        // Buyer can respond when seller has countered
        return trade.negotiationStatus === 'countered';
    };

    const isClosed = () => {
        if (!trade) return false;
        return trade.negotiationStatus === 'accepted' || trade.negotiationStatus === 'rejected';
    };

    const isWaitingForSeller = () => {
        if (!trade) return false;
        return trade.negotiationStatus === 'pending' || trade.negotiationStatus === 'buyer_responded';
    };

    if (loading) {
        return <TradeSkeleton isSeller={false} />;
    }

    if (error && !trade) {
        return (
            <div className="flex h-screen">
                <Sidebar Seller={false} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/buyer/trade')}
                            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Back to Trades
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar Seller={false} />

            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="bg-white border-b sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/buyer/trade')}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Trade Negotiation</h1>
                                    <p className="text-sm text-gray-500">
                                        Round {trade?.currentNegotiationRound || 0} - {trade?.product?.name}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(trade?.negotiationStatus)}`}>
                                {trade?.negotiationStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-6">
                        {/* Left Column - Product & Seller Info */}
                        <div className="col-span-1 space-y-6">
                            {/* Product Card */}
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="aspect-video bg-gray-100">
                                    {trade?.product?.productImages?.[0] ? (
                                        <img
                                            src={`${BACKEND_URL}${trade.product.productImages[0]}`}
                                            alt={trade.product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-800">{trade?.product?.name}</h3>
                                    <p className="text-2xl font-bold text-green-600 mt-1">
                                        {trade?.product?.price} {trade?.product?.currency || 'INR'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Listed Price</p>
                                    <div className="mt-3 pt-3 border-t">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Your Quantity</span>
                                            <span className="font-medium">{trade?.quantity} {trade?.quantityUnit}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seller Info Card */}
                            <div className="bg-white rounded-xl shadow-sm border p-4">
                                <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                                    <Building className="w-4 h-4" />
                                    Seller Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Email:</span>
                                        <p className="font-medium">{trade?.seller?.mail}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Your Offer Summary */}
                            <div className="bg-white rounded-xl shadow-sm border p-4">
                                <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                                    <User className="w-4 h-4" />
                                    Your Initial Offer
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Offered Price:</span>
                                        <p className="font-bold text-green-600">{trade?.buyerOfferedPrice || trade?.product?.price}</p>
                                    </div>
                                    {trade?.buyerIncoterms?.selectedIncoterm && (
                                        <div>
                                            <span className="text-gray-500">Incoterm:</span>
                                            <p className="font-medium">{trade.buyerIncoterms.selectedIncoterm}</p>
                                        </div>
                                    )}
                                    {trade?.buyerMessage && (
                                        <div>
                                            <span className="text-gray-500">Your Message:</span>
                                            <p className="text-gray-600 italic">"{trade.buyerMessage}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Terms */}
                            <div className="bg-white rounded-xl shadow-sm border p-4">
                                <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                                    <FileText className="w-4 h-4" />
                                    Payment Terms
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                            {trade?.paymentMethod?.type?.toUpperCase()}
                                        </span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                            {trade?.paymentMethod?.method}
                                        </span>
                                    </div>
                                    {trade?.paymentMethod?.percentage && (
                                        <p className="text-gray-600">Advance: {trade.paymentMethod.percentage}%</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Response Form */}
                        <div className="col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    {isClosed() ? 'Trade Closed' :
                                     isWaitingForSeller() ? 'Waiting for Seller' :
                                     'Respond to Counter-Offer'}
                                </h3>

                                {isClosed() ? (
                                    <div className={`p-4 rounded-lg ${
                                        trade?.negotiationStatus === 'accepted' ? 'bg-green-50' : 'bg-red-50'
                                    }`}>
                                        <p className={`font-medium ${
                                            trade?.negotiationStatus === 'accepted' ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                            This trade has been {trade?.negotiationStatus}.
                                        </p>
                                        {trade?.rejectionReason && (
                                            <p className="text-sm text-gray-600 mt-2">
                                                Reason: {trade.rejectionReason}
                                            </p>
                                        )}
                                    </div>
                                ) : isWaitingForSeller() ? (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-yellow-50 rounded-lg">
                                            <p className="font-medium text-yellow-700">
                                                Waiting for the seller to respond to your offer.
                                            </p>
                                            <p className="text-sm text-yellow-600 mt-2">
                                                You'll be notified when the seller responds.
                                            </p>
                                        </div>
                                        {/* Allow buyer to withdraw even while waiting */}
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            disabled={submitting}
                                            className="w-full py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <X className="w-5 h-5" />
                                            Withdraw from Trade
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Seller's Counter-Offer */}
                                        <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                                            <p className="text-sm text-purple-700 font-medium mb-1">Seller's Counter-Offer</p>
                                            <p className="text-2xl font-bold text-purple-800">
                                                {trade?.sellerOfferedPrice || 'No price counter'}
                                            </p>
                                            {trade?.sellerOfferedIncoterms?.selectedIncoterm && (
                                                <p className="text-sm text-purple-600 mt-1">
                                                    Incoterm: {trade.sellerOfferedIncoterms.selectedIncoterm}
                                                </p>
                                            )}
                                            {trade?.sellerMessage && (
                                                <div className="mt-2 p-2 bg-white rounded text-sm text-gray-600">
                                                    "{trade.sellerMessage}"
                                                </div>
                                            )}
                                        </div>

                                        {/* Response Price */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your Response Price
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={responsePrice}
                                                    onChange={(e) => setResponsePrice(e.target.value)}
                                                    placeholder="Enter your price"
                                                    disabled={!canRespond()}
                                                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                />
                                            </div>
                                        </div>

                                        {/* Incoterm Selection */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Incoterm
                                            </label>
                                            <SelectField
                                                value={selectedIncoterm}
                                                onValueChange={(value) => setSelectedIncoterm(String(value))}
                                                disabled={!canRespond()}
                                                wrapperClassName="w-full"
                                                className="disabled:bg-gray-100"
                                            >
                                                <option value="">Select Incoterm</option>
                                                {INCOTERM_OPTIONS.map((term) => (
                                                    <option key={term} value={term}>{term}</option>
                                                ))}
                                            </SelectField>
                                        </div>

                                        {/* Message */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Message (Optional)
                                            </label>
                                            <textarea
                                                value={responseMessage}
                                                onChange={(e) => setResponseMessage(e.target.value)}
                                                placeholder="Add a message to the seller..."
                                                disabled={!canRespond()}
                                                rows={3}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleSubmitResponse}
                                                disabled={!canRespond() || submitting}
                                                className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {submitting ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <MessageSquare className="w-5 h-5" />
                                                )}
                                                Submit Response
                                            </button>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleAcceptCounter}
                                                    disabled={!canRespond() || submitting}
                                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <Check className="w-5 h-5" />
                                                    Accept Seller's Offer
                                                </button>
                                                <button
                                                    onClick={() => setShowRejectModal(true)}
                                                    disabled={isClosed() || submitting}
                                                    className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <X className="w-5 h-5" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Negotiation History */}
                        <div className="col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <NegotiationHistory tradeId={tradeId!} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Withdraw from Trade</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to withdraw from this trade? This action cannot be undone.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for withdrawal (optional)"
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg mb-4 resize-none"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={submitting}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                            >
                                {submitting ? 'Withdrawing...' : 'Withdraw'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyerNegotiation;
