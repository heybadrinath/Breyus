import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    DollarSign,
    MessageSquare,
    Check,
    X,
    Loader2,
    Send,
    ChevronDown,
    ChevronUp,
    Edit,
    Eye
} from 'lucide-react';
import { getTradeById, buyerRespondToCounter, acceptTrade, rejectTrade, Trade, Incoterms as TradeIncoterms } from '../../services/trade.service';
import { createConversationByCompany } from '../../services/inbox.service';
import NegotiationHistory from '../../components/NegotiationHistory';
import Sidebar from '../../components/Sidebar';
import TradeSkeleton from '../../components/skeletons/TradeSkeleton';
import { socketService } from '../../services/socket.service';
import { getMe } from '../../services/auth.service';
import { getStatusColor } from '../../constants/trade.constants';
import { Incoterms } from '../../components/incoterms';
import { IncotermsState, IncotermType, defaultIncotermValues } from '../../types/Incoterms';
import { useNotifications } from '../../contexts/NotificationContext';
import {
    CounterProgressIndicator,
    PriceComparisonCard,
    CompanyInfoCard,
    ProductSpecsCard
} from '../../components/negotiation';

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
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    // Incoterms modal state
    const [showIncotermsModal, setShowIncotermsModal] = useState(false);
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [compareViewMode, setCompareViewMode] = useState<'seller' | 'buyer'>('seller');

    // Incoterms state - seller's terms (for reference) and buyer's selected terms
    const emptyIncotermsState: IncotermsState = {
        selectedIncoterm: '',
        selectedIncotermData: {},
        defaults: defaultIncotermValues
    };
    const [sellerIncotermsState, setSellerIncotermsState] = useState<IncotermsState>(emptyIncotermsState);
    const [buyerIncotermsState, setBuyerIncotermsState] = useState<IncotermsState>(emptyIncotermsState);

    useEffect(() => {
        let isMounted = true;
        const currentTradeId = tradeId;

        const setupSocket = async () => {
            if (!currentTradeId) return;

            try {
                socketService.offTradeUpdate();
                socketService.offNegotiationUpdate();

                const userInfo = await getMe();
                if (userInfo && userInfo.userId && isMounted) {
                    socketService.connectTrade();
                    socketService.joinTrade(userInfo.userId, currentTradeId);
                }

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
                setResponsePrice(String(tradeData.buyerOfferedPrice));
            } else if (tradeData.sellerOfferedPrice) {
                setResponsePrice(String(tradeData.sellerOfferedPrice));
            } else if (tradeData.product?.price) {
                setResponsePrice(String(tradeData.product.price));
            }

            // Initialize seller's incoterms state (for comparison)
            if (tradeData.sellerOfferedIncoterms?.selectedIncoterm) {
                setSellerIncotermsState(prev => ({
                    ...prev,
                    selectedIncoterm: tradeData.sellerOfferedIncoterms!.selectedIncoterm as IncotermType,
                    selectedIncotermData: tradeData.sellerOfferedIncoterms!.selectedIncotermData || {}
                }));
            }

            // Initialize buyer's incoterms state (for selection/editing)
            if (tradeData.buyerIncoterms?.selectedIncoterm) {
                setBuyerIncotermsState(prev => ({
                    ...prev,
                    selectedIncoterm: tradeData.buyerIncoterms!.selectedIncoterm as IncotermType,
                    selectedIncotermData: tradeData.buyerIncoterms!.selectedIncotermData || {}
                }));
            } else if (tradeData.sellerOfferedIncoterms?.selectedIncoterm) {
                // Pre-fill with seller's terms if buyer hasn't selected yet
                setBuyerIncotermsState(prev => ({
                    ...prev,
                    selectedIncoterm: tradeData.sellerOfferedIncoterms!.selectedIncoterm as IncotermType,
                    selectedIncotermData: tradeData.sellerOfferedIncoterms!.selectedIncotermData || {}
                }));
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to load trade';
            setError(errorMessage);
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
                offeredIncoterms: buyerIncotermsState.selectedIncoterm ? {
                    selectedIncoterm: buyerIncotermsState.selectedIncoterm,
                    selectedIncotermData: buyerIncotermsState.selectedIncotermData
                } as TradeIncoterms : undefined,
                message: responseMessage || undefined
            };

            await buyerRespondToCounter(tradeId, responseData);
            await fetchTrade();
            showToast('Response submitted successfully!', 'success');
            setResponseMessage('');
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

    const handleChat = async () => {
        const companyId = trade?.seller?.company?._id;
        if (!companyId) {
            console.error('Chat error: seller company ID not found', {
                seller: trade?.seller,
                company: trade?.seller?.company
            });
            showToast('Unable to chat with seller - company info not available', 'error');
            return;
        }

        try {
            const response = await createConversationByCompany(companyId);
            // Handle different response formats
            if (response.status === 'error') {
                // If conversation already exists, use the returned conversationId
                if (response.conversationId) {
                    navigate(`/buyer/inbox?conversationId=${response.conversationId}`);
                    return;
                }
                throw new Error(response.message || 'Failed to start conversation');
            }
            // Use query params as Inbox reads from location.search
            const conversationId = response.conversationId || response.data;
            if (conversationId) {
                navigate(`/buyer/inbox?conversationId=${conversationId}`);
            } else {
                navigate('/buyer/inbox');
            }
        } catch (err: any) {
            console.error('Failed to start conversation:', err);
            showToast(err.message || 'Failed to start conversation', 'error');
        }
    };

    const canRespond = () => {
        if (!trade) return false;
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

    // Counter tracking info
    const buyerCounterCount = (trade as any)?.buyerCounterCount || 0;
    const maxBuyerCounters = (trade as any)?.maxBuyerCounters || 2;
    const isNegotiationLocked = (trade as any)?.isNegotiationLocked || false;

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
        <div className="flex h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
            <Sidebar Seller={false} />

            <div className="flex-1 overflow-y-auto">
                {/* Glassmorphism Header */}
                <div className="sticky top-0 z-20">
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-white/20" />
                    <div className="relative max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/buyer/trade')}
                                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                        Trade Negotiation
                                    </h1>
                                    <p className="text-sm text-gray-500">
                                        Round {trade?.currentNegotiationRound || 0} • {trade?.product?.name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${getStatusColor(trade?.negotiationStatus)}`}>
                                    {trade?.negotiationStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Counter Progress - Full Width */}
                    {!isClosed() && (
                        <div className="mb-6">
                            <CounterProgressIndicator
                                currentCount={buyerCounterCount}
                                maxCount={maxBuyerCounters}
                                isLocked={isNegotiationLocked}
                                isBuyer={true}
                            />
                        </div>
                    )}

                    {/* Main Grid */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* Left Column - Product & Company Info */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            {/* Product Specs */}
                            <ProductSpecsCard
                                product={trade?.product || null}
                                quantity={trade?.quantity || 0}
                                unit={trade?.quantityUnit || 'Units'}
                                onViewProduct={() => navigate(`/buyer/product-page?id=${trade?.product?._id}`)}
                            />

                            {/* Seller Info */}
                            <CompanyInfoCard
                                company={trade?.seller?.company || null}
                                userEmail={trade?.seller?.mail}
                                onChat={handleChat}
                                onViewProfile={trade?.seller?.company?._id ? () => navigate(`/buyer/seller-profile/${trade?.seller?.company?._id}`) : undefined}
                                label="Seller"
                            />
                        </div>

                        {/* Middle Column - Response Form */}
                        <div className="col-span-12 lg:col-span-5 space-y-6">
                            {/* Price Comparison */}
                            <PriceComparisonCard
                                originalPrice={trade?.product?.price || 0}
                                buyerOffer={trade?.buyerOfferedPrice || null}
                                sellerCounter={trade?.sellerOfferedPrice || null}
                                currency={trade?.product?.currency || 'INR'}
                                isBuyer={true}
                            />

                            {/* Response Form Card */}
                            <div className="relative overflow-hidden rounded-2xl">
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl" />
                                <div className="relative p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                                        {isClosed() ? 'Trade Closed' :
                                         isWaitingForSeller() ? 'Waiting for Seller Response' :
                                         'Your Response'}
                                    </h3>

                                    {isClosed() ? (
                                        <div className={`p-4 rounded-xl ${
                                            trade?.negotiationStatus === 'accepted'
                                                ? 'bg-green-100/50 border border-green-200'
                                                : 'bg-red-100/50 border border-red-200'
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
                                            <div className="p-4 bg-amber-100/50 rounded-xl border border-amber-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                        <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-amber-700">
                                                            Awaiting Seller Response
                                                        </p>
                                                        <p className="text-sm text-amber-600">
                                                            You'll be notified when they respond
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowRejectModal(true)}
                                                disabled={submitting}
                                                className="w-full py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                                Withdraw from Trade
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Seller's Counter-Offer Display */}
                                            <div className="mb-6 p-4 bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-xl border border-purple-200/50">
                                                <p className="text-xs uppercase tracking-wider text-purple-600 mb-1">
                                                    Seller's Counter-Offer
                                                </p>
                                                <p className="text-2xl font-bold text-purple-800">
                                                    {trade?.sellerOfferedPrice || 'No price counter'}
                                                </p>
                                                {trade?.sellerOfferedIncoterms?.selectedIncoterm && (
                                                    <span className="inline-block mt-2 px-2 py-1 bg-purple-200/50 text-purple-700 rounded-lg text-xs font-medium">
                                                        {trade.sellerOfferedIncoterms.selectedIncoterm}
                                                    </span>
                                                )}
                                                {trade?.sellerMessage && (
                                                    <div className="mt-3 p-3 bg-white/50 rounded-lg text-sm text-gray-600 italic">
                                                        "{trade.sellerMessage}"
                                                    </div>
                                                )}
                                            </div>

                                            {/* Response Price Input */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Your Response Price
                                                </label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={responsePrice}
                                                        onChange={(e) => setResponsePrice(e.target.value)}
                                                        placeholder="Enter your price"
                                                        disabled={!canRespond()}
                                                        className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            {/* Incoterm Selection */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Incoterm
                                                </label>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setShowIncotermsModal(true)}
                                                        disabled={!canRespond()}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/50 border border-gray-200 rounded-xl hover:bg-white/80 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all text-sm font-medium text-gray-700"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        {buyerIncotermsState.selectedIncoterm
                                                            ? `Selected: ${buyerIncotermsState.selectedIncoterm}`
                                                            : 'Select Incoterm'}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowCompareModal(true)}
                                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/50 border border-gray-200 rounded-xl hover:bg-white/80 transition-all text-sm font-medium text-gray-700"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Compare
                                                    </button>
                                                </div>
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
                                                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 transition-all"
                                                />
                                            </div>

                                            {/* Actions */}
                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleSubmitResponse}
                                                    disabled={!canRespond() || submitting}
                                                    className="w-full py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-medium hover:from-gray-800 hover:to-gray-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 transition-all"
                                                >
                                                    {submitting ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Send className="w-5 h-5" />
                                                    )}
                                                    Submit Counter-Offer
                                                </button>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={handleAcceptCounter}
                                                        disabled={!canRespond() || submitting}
                                                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 transition-all"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => setShowRejectModal(true)}
                                                        disabled={isClosed() || submitting}
                                                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition-all"
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
                        </div>

                        {/* Right Column - Negotiation History */}
                        <div className="col-span-12 lg:col-span-3">
                            <div className="relative overflow-hidden rounded-2xl sticky top-24">
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl" />
                                <div className="relative">
                                    {/* History Header */}
                                    <button
                                        onClick={() => setShowHistory(!showHistory)}
                                        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/50 transition-colors lg:cursor-default"
                                    >
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />
                                            Negotiation History
                                        </h4>
                                        <div className="lg:hidden">
                                            {showHistory ? (
                                                <ChevronUp className="w-5 h-5 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                    </button>
                                    {/* History Content */}
                                    <div className={`${showHistory ? 'block' : 'hidden'} lg:block`}>
                                        <NegotiationHistory tradeId={tradeId!} compact />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="relative overflow-hidden rounded-2xl w-full max-w-md">
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl" />
                        <div className="relative p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Withdraw from Trade</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Are you sure you want to withdraw from this trade? This action cannot be undone.
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for withdrawal (optional)"
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectReason('');
                                    }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={submitting}
                                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-300 transition-all"
                                >
                                    {submitting ? 'Withdrawing...' : 'Withdraw'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Incoterms Selection Modal */}
            {showIncotermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-[98vw] h-[96vh] mx-auto p-6 relative animate-fade-in flex flex-col">
                        <button
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            onClick={() => setShowIncotermsModal(false)}
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold mb-2 text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                            Select Your Preferred Incoterm
                        </h2>
                        <p className="text-center text-sm text-gray-500 mb-4">
                            Click on an Incoterm checkbox to select it. Cost allocations are standardized and cannot be modified.
                        </p>
                        <div className="flex-1 overflow-y-auto">
                            <Incoterms
                                incoterms={buyerIncotermsState}
                                setIncoterms={setBuyerIncotermsState}
                                readOnly={true}
                            />
                        </div>
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowIncotermsModal(false)}
                                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowIncotermsModal(false)}
                                className="px-6 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-medium hover:from-gray-800 hover:to-gray-700 transition-all"
                            >
                                Confirm Selection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Incoterms Comparison Modal */}
            {showCompareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-[98vw] h-[96vh] mx-auto p-6 relative animate-fade-in flex flex-col">
                        <button
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            onClick={() => setShowCompareModal(false)}
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                            Compare Incoterms
                        </h2>
                        <div className="flex-1 overflow-y-auto">
                            {/* Toggle between Seller's and Buyer's terms */}
                            <div className="flex mx-auto w-fit mb-4 gap-4">
                                <label
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer transition-all ${
                                        compareViewMode === 'seller'
                                            ? 'bg-purple-100 border-2 border-purple-300 font-medium'
                                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                    }`}
                                >
                                    <input
                                        className="accent-purple-600"
                                        name="compareView"
                                        value="seller"
                                        type="radio"
                                        onChange={() => setCompareViewMode('seller')}
                                        checked={compareViewMode === 'seller'}
                                    />
                                    <span>Seller's Terms</span>
                                    {sellerIncotermsState.selectedIncoterm && (
                                        <span className="ml-1 px-2 py-0.5 bg-purple-200 text-purple-700 rounded-lg text-xs font-medium">
                                            {sellerIncotermsState.selectedIncoterm}
                                        </span>
                                    )}
                                </label>
                                <label
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer transition-all ${
                                        compareViewMode === 'buyer'
                                            ? 'bg-blue-100 border-2 border-blue-300 font-medium'
                                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                    }`}
                                >
                                    <input
                                        className="accent-blue-600"
                                        name="compareView"
                                        value="buyer"
                                        type="radio"
                                        onChange={() => setCompareViewMode('buyer')}
                                        checked={compareViewMode === 'buyer'}
                                    />
                                    <span>Your Selected Terms</span>
                                    {buyerIncotermsState.selectedIncoterm && (
                                        <span className="ml-1 px-2 py-0.5 bg-blue-200 text-blue-700 rounded-lg text-xs font-medium">
                                            {buyerIncotermsState.selectedIncoterm}
                                        </span>
                                    )}
                                </label>
                            </div>
                            <p className="text-center text-sm text-gray-500 mb-4">
                                View-only comparison of Incoterm selections
                            </p>
                            {compareViewMode === 'seller' ? (
                                <Incoterms
                                    key={`seller-${sellerIncotermsState.selectedIncoterm}`}
                                    incoterms={sellerIncotermsState}
                                    setIncoterms={() => {}}
                                    readOnly={true}
                                />
                            ) : (
                                <Incoterms
                                    key={`buyer-${buyerIncotermsState.selectedIncoterm}`}
                                    incoterms={buyerIncotermsState}
                                    setIncoterms={() => {}}
                                    readOnly={true}
                                />
                            )}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setShowCompareModal(false)}
                                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuyerNegotiation;
