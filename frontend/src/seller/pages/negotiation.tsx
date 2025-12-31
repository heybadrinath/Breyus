import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, DollarSign, MessageSquare, Check, X, Loader2, FileText, Clock, User } from 'lucide-react';
import { getTradeById, submitCounterOffer, acceptTrade, rejectTrade, Trade, Incoterms } from '../../services/trade.service';
import NegotiationHistory from '../../components/NegotiationHistory';
import Sidebar from '../../components/Sidebar';
import TradeSkeleton from '../../components/skeletons/TradeSkeleton';
import { INCOTERM_OPTIONS, getStatusColor } from '../../constants/trade.constants';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const SellerNegotiation: React.FC = () => {
    const { tradeId } = useParams<{ tradeId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [trade, setTrade] = useState<Trade | null>(null);

    // Counter-offer form state
    const [counterPrice, setCounterPrice] = useState('');
    const [counterMessage, setCounterMessage] = useState('');
    const [selectedIncoterm, setSelectedIncoterm] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        if (tradeId) {
            fetchTrade();
        }
    }, [tradeId]);

    const fetchTrade = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getTradeById(tradeId!);
            const tradeData = response.data as Trade;
            setTrade(tradeData);

            // Pre-fill counter-offer with buyer's offer or product price
            if (tradeData.sellerOfferedPrice) {
                setCounterPrice(tradeData.sellerOfferedPrice);
            } else if (tradeData.buyerOfferedPrice) {
                setCounterPrice(tradeData.buyerOfferedPrice);
            } else if (tradeData.product?.price) {
                setCounterPrice(tradeData.product.price);
            }

            if (tradeData.sellerOfferedIncoterms?.selectedIncoterm) {
                setSelectedIncoterm(tradeData.sellerOfferedIncoterms.selectedIncoterm);
            } else if (tradeData.buyerIncoterms?.selectedIncoterm) {
                setSelectedIncoterm(tradeData.buyerIncoterms.selectedIncoterm);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load trade');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitCounter = async () => {
        if (!tradeId) return;

        try {
            setSubmitting(true);
            setError(null);

            const counterOfferData = {
                offeredPrice: counterPrice || undefined,
                offeredIncoterms: selectedIncoterm ? {
                    selectedIncoterm,
                    selectedIncotermData: trade?.buyerIncoterms?.selectedIncotermData || {}
                } as Incoterms : undefined,
                message: counterMessage || undefined
            };

            await submitCounterOffer(tradeId, counterOfferData);
            await fetchTrade();
            alert('Counter-offer submitted successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to submit counter-offer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAccept = async () => {
        if (!tradeId) return;

        if (!window.confirm('Are you sure you want to accept this trade?')) {
            return;
        }

        try {
            setSubmitting(true);
            await acceptTrade(tradeId);
            await fetchTrade();
            alert('Trade accepted successfully!');
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
            alert('Trade rejected');
        } catch (err: any) {
            setError(err.message || 'Failed to reject trade');
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmitCounter = () => {
        if (!trade) return false;
        // Seller can counter when buyer has an offer on the table
        return trade.negotiationStatus === 'pending' || trade.negotiationStatus === 'buyer_responded';
    };

    const canAccept = () => {
        if (!trade) return false;
        // Seller can accept buyer's offer when it's their turn
        return trade.negotiationStatus === 'pending' || trade.negotiationStatus === 'buyer_responded';
    };

    const isWaitingForBuyer = () => {
        if (!trade) return false;
        // Seller is waiting when they've countered and buyer hasn't responded
        return trade.negotiationStatus === 'countered';
    };

    const isClosed = () => {
        if (!trade) return false;
        return trade.negotiationStatus === 'accepted' || trade.negotiationStatus === 'rejected';
    };



    if (loading) {
        return <TradeSkeleton isSeller={true} />;
    }

    if (error && !trade) {
        return (
            <div className="flex h-screen">
                <Sidebar Seller={true} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/seller/trade')}
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
            <Sidebar Seller={true} />

            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="bg-white border-b sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate('/seller/trade')}
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
                        {/* Left Column - Product & Buyer Info */}
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
                                    <div className="mt-3 pt-3 border-t">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Quantity</span>
                                            <span className="font-medium">{trade?.quantity} {trade?.quantityUnit}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Buyer Info Card */}
                            <div className="bg-white rounded-xl shadow-sm border p-4">
                                <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                                    <User className="w-4 h-4" />
                                    Buyer Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Email:</span>
                                        <p className="font-medium">{trade?.buyer?.mail}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Industry:</span>
                                        <p className="font-medium">{trade?.buyerIndustryType || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Market Years:</span>
                                        <p className="font-medium">{trade?.buyerMarketYears || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Trade Experience:</span>
                                        <p className="font-medium">{trade?.tradeYears || 'N/A'} years</p>
                                    </div>
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

                        {/* Middle Column - Counter-Offer Form */}
                        <div className="col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    {isClosed() ? 'Trade Closed' : 'Submit Counter-Offer'}
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
                                ) : (
                                    <>
                                        {/* Buyer's Current Offer */}
                                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-blue-700 font-medium mb-1">Buyer's Current Offer</p>
                                            <p className="text-2xl font-bold text-blue-800">
                                                {trade?.buyerOfferedPrice || trade?.product?.price || 'N/A'}
                                            </p>
                                            {trade?.buyerIncoterms?.selectedIncoterm && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    Incoterm: {trade.buyerIncoterms.selectedIncoterm}
                                                </p>
                                            )}
                                            {trade?.buyerMessage && (
                                                <div className="mt-2 p-2 bg-white rounded text-sm text-gray-600">
                                                    "{trade.buyerMessage}"
                                                </div>
                                            )}
                                        </div>

                                        {/* Counter Price */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your Counter Price
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={counterPrice}
                                                    onChange={(e) => setCounterPrice(e.target.value)}
                                                    placeholder="Enter your price"
                                                    disabled={!canSubmitCounter()}
                                                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                                />
                                            </div>
                                        </div>

                                        {/* Incoterm Selection */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Incoterm
                                            </label>
                                            <select
                                                value={selectedIncoterm}
                                                onChange={(e) => setSelectedIncoterm(e.target.value)}
                                                disabled={!canSubmitCounter()}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                            >
                                                <option value="">Select Incoterm</option>
                                                {INCOTERM_OPTIONS.map((term) => (
                                                    <option key={term} value={term}>{term}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Message */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Message (Optional)
                                            </label>
                                            <textarea
                                                value={counterMessage}
                                                onChange={(e) => setCounterMessage(e.target.value)}
                                                placeholder="Add a message to the buyer..."
                                                disabled={!canSubmitCounter()}
                                                rows={3}
                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleSubmitCounter}
                                                disabled={!canSubmitCounter() || submitting}
                                                className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {submitting ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <MessageSquare className="w-5 h-5" />
                                                )}
                                                Submit Counter-Offer
                                            </button>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleAccept}
                                                    disabled={!canAccept() || submitting}
                                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <Check className="w-5 h-5" />
                                                    Accept Buyer's Offer
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

                                        {isWaitingForBuyer() && (
                                            <p className="text-sm text-yellow-600 mt-4 text-center">
                                                Waiting for buyer's response to your counter-offer.
                                            </p>
                                        )}
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
                        <h3 className="text-lg font-bold mb-4">Reject Trade</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to reject this trade? This action cannot be undone.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (optional)"
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
                                {submitting ? 'Rejecting...' : 'Reject Trade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerNegotiation;
