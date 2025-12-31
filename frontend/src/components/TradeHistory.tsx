import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    CheckCircle,
    XCircle,
    Package,
    Calendar,
    DollarSign,
    Eye,
    Loader2,
    ChevronDown,
    MessageCircle,
    Star,
    Truck,
    FileText,
    ShoppingBag,
    ExternalLink
} from 'lucide-react';
import { getUserTrades, getSellerTrades, Trade, downloadInvoice } from '../services/trade.service';
import TradeDetailsModal from './TradeDetailsModal';
import FeedbackModal, { FeedbackType, FeedbackData } from './FeedbackModal';
import QueryModal from './QueryModal';
import { createFeedback, hasUserLeftFeedback } from '../services/feedback.service';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

interface TradeHistoryProps {
    isSeller: boolean;
}

interface TradeWithExtras extends Trade {
    tradePhase?: string;
    completedAt?: string;
    deliveredAt?: string;
    shippingAddress?: string;
    orderNumber?: string;
}

type FilterStatus = 'all' | 'rejected' | 'completed';

const TradeHistory: React.FC<TradeHistoryProps> = ({ isSeller }) => {
    const navigate = useNavigate();
    const [trades, setTrades] = useState<TradeWithExtras[]>([]);
    const [filteredTrades, setFilteredTrades] = useState<TradeWithExtras[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Feedback modal state
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackTradeId, setFeedbackTradeId] = useState<string | null>(null);
    const [feedbackType, setFeedbackType] = useState<FeedbackType>('seller');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackLeft, setFeedbackLeft] = useState<Record<string, { seller: boolean; delivery: boolean }>>({});

    // Query modal state
    const [showQueryModal, setShowQueryModal] = useState(false);
    const [queryProductId, setQueryProductId] = useState<string | null>(null);
    const [queryProductName, setQueryProductName] = useState<string>('');

    // Expanded trade cards
    const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

    // Invoice download state
    const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

    useEffect(() => {
        fetchTrades();
    }, [isSeller]);

    useEffect(() => {
        applyFilters();
    }, [trades, searchQuery, statusFilter]);

    const fetchTrades = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = isSeller ? await getSellerTrades() : await getUserTrades();
            const allTrades = response.data as TradeWithExtras[];

            // Filter for completed/rejected trades (history only)
            const historicalTrades = allTrades.filter(trade =>
                trade.negotiationStatus === 'rejected' ||
                trade.tradePhase === 'COMPLETED'
            );

            setTrades(historicalTrades);

            // Check feedback status for completed trades (buyer only)
            if (!isSeller) {
                const completedTrades = historicalTrades.filter(t => t.tradePhase === 'COMPLETED');
                const feedbackStatus: Record<string, { seller: boolean; delivery: boolean }> = {};

                for (const trade of completedTrades) {
                    try {
                        const [sellerCheck, deliveryCheck] = await Promise.all([
                            hasUserLeftFeedback(trade._id, 'seller'),
                            hasUserLeftFeedback(trade._id, 'delivery')
                        ]);
                        feedbackStatus[trade._id] = {
                            seller: sellerCheck.data?.hasLeftFeedback || false,
                            delivery: deliveryCheck.data?.hasLeftFeedback || false
                        };
                    } catch {
                        feedbackStatus[trade._id] = { seller: false, delivery: false };
                    }
                }
                setFeedbackLeft(feedbackStatus);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load trade history');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...trades];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(trade =>
                trade.product?.name?.toLowerCase().includes(query) ||
                trade.buyer?.mail?.toLowerCase().includes(query) ||
                trade.seller?.mail?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'completed') {
                result = result.filter(trade => trade.tradePhase === 'COMPLETED');
            } else if (statusFilter === 'rejected') {
                result = result.filter(trade => trade.negotiationStatus === 'rejected');
            }
        }

        setFilteredTrades(result);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatLongDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleViewDetails = (tradeId: string) => {
        setSelectedTradeId(tradeId);
        setShowDetailsModal(true);
    };

    const handleAskProductDoubt = (productId: string, productName: string) => {
        setQueryProductId(productId);
        setQueryProductName(productName);
        setShowQueryModal(true);
    };

    const handleLeaveFeedback = (tradeId: string, type: FeedbackType) => {
        setFeedbackTradeId(tradeId);
        setFeedbackType(type);
        setShowFeedbackModal(true);
    };

    const handleFeedbackSubmit = async (data: FeedbackData) => {
        setFeedbackSubmitting(true);
        try {
            await createFeedback(data);
            // Update local state
            if (feedbackTradeId) {
                setFeedbackLeft(prev => ({
                    ...prev,
                    [feedbackTradeId]: {
                        ...prev[feedbackTradeId],
                        [data.feedbackType]: true
                    }
                }));
            }
            setShowFeedbackModal(false);
            setFeedbackTradeId(null);
        } catch (err) {
            console.error('Failed to submit feedback:', err);
            alert('Failed to submit feedback. Please try again.');
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const handleBuyAgain = (productId: string) => {
        navigate(`/buyer/product-page?id=${productId}`);
    };

    const handleViewProduct = (productId: string) => {
        navigate(`/buyer/product-page?id=${productId}`);
    };

    const handleDownloadInvoice = async (tradeId: string) => {
        setDownloadingInvoice(tradeId);
        try {
            await downloadInvoice(tradeId);
        } catch (err) {
            console.error('Failed to download invoice:', err);
            alert('Failed to download invoice. Please try again.');
        } finally {
            setDownloadingInvoice(null);
        }
    };

    const calculateTotalAmount = (trade: TradeWithExtras) => {
        const price = parseFloat(trade.buyerOfferedPrice || trade.product?.price || '0');
        const qty = parseFloat(trade.quantity || '1');
        return (price * qty).toFixed(2);
    };

    const generateOrderNumber = (tradeId: string) => {
        return `ORD-${tradeId.slice(-8).toUpperCase()}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading trade history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">{error}</p>
                <button
                    onClick={fetchTrades}
                    className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Trade History</h2>
                        <p className="text-sm text-gray-500">
                            {filteredTrades.length} trade{filteredTrades.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg transition-colors ${
                            showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'
                        }`}
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                {/* Search and Filters */}
                {showFilters && (
                    <div className="mt-4 space-y-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by product name, buyer, or seller..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex gap-2">
                            {(['all', 'rejected', 'completed'] as FilterStatus[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === status
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {filteredTrades.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No trades found</p>
                        {searchQuery || statusFilter !== 'all' ? (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                }}
                                className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                            >
                                Clear filters
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTrades.map((trade) => {
                            const isCompleted = trade.tradePhase === 'COMPLETED';
                            const isRejected = trade.negotiationStatus === 'rejected';
                            const isExpanded = expandedTradeId === trade._id;
                            const hasLeftSellerFeedback = feedbackLeft[trade._id]?.seller || false;
                            const hasLeftDeliveryFeedback = feedbackLeft[trade._id]?.delivery || false;

                            return (
                                <div key={trade._id} className="border rounded-lg overflow-hidden">
                                    {/* Black Header Bar */}
                                    <div className="bg-gray-900 text-white px-4 py-3">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                                <div>
                                                    <span className="text-gray-400 uppercase text-xs">Order Placed</span>
                                                    <p className="font-medium">{formatDate(trade.createdAt)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 uppercase text-xs">Total</span>
                                                    <p className="font-medium">
                                                        {trade.product?.currency || 'USD'} {calculateTotalAmount(trade)}
                                                    </p>
                                                </div>
                                                <div className="hidden md:block">
                                                    <span className="text-gray-400 uppercase text-xs">Ship To</span>
                                                    <p className="font-medium">{trade.buyer?.mail || 'Buyer'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="text-right">
                                                    <span className="text-gray-400 uppercase text-xs">Order #</span>
                                                    <p className="font-medium">{generateOrderNumber(trade._id)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetails(trade._id)}
                                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                    >
                                                        <Eye size={14} /> View order details
                                                    </button>
                                                    <span className="text-gray-600">|</span>
                                                    <button
                                                        onClick={() => handleDownloadInvoice(trade._id)}
                                                        disabled={downloadingInvoice === trade._id}
                                                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 disabled:opacity-50"
                                                    >
                                                        {downloadingInvoice === trade._id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <FileText size={14} />
                                                        )}
                                                        Invoice
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="p-4">
                                        <div className="flex gap-4">
                                            {/* Left: Product Info */}
                                            <div className="flex-1">
                                                {/* Status Banner */}
                                                {isCompleted && (
                                                    <div className="flex items-center gap-2 text-green-600 mb-3">
                                                        <CheckCircle className="w-5 h-5" />
                                                        <span className="font-medium">
                                                            Delivered {trade.completedAt ? formatLongDate(trade.completedAt) : ''}
                                                        </span>
                                                    </div>
                                                )}
                                                {isRejected && (
                                                    <div className="flex items-center gap-2 text-red-600 mb-3">
                                                        <XCircle className="w-5 h-5" />
                                                        <span className="font-medium">
                                                            Rejected {trade.rejectedAt ? formatLongDate(trade.rejectedAt) : ''}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Product Card */}
                                                <div className="flex gap-4">
                                                    {/* Product Image */}
                                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                        {trade.product?.productImages?.[0] ? (
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
                                                                <Package className="w-8 h-8 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-800 text-lg">
                                                            {trade.product?.name || 'Unknown Product'}
                                                        </h3>
                                                        <p className="text-gray-500 text-sm mt-1">
                                                            {trade.quantity} {trade.quantityUnit} @ {trade.buyerOfferedPrice || trade.product?.price} {trade.product?.currency}
                                                        </p>
                                                        {trade.rejectionReason && (
                                                            <p className="text-red-500 text-sm mt-2">
                                                                Reason: {trade.rejectionReason}
                                                            </p>
                                                        )}

                                                        {/* Bottom Action Buttons (for completed trades, buyer only) */}
                                                        {isCompleted && !isSeller && (
                                                            <div className="flex gap-2 mt-4">
                                                                <button
                                                                    onClick={() => handleBuyAgain(trade.product._id)}
                                                                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg text-sm flex items-center gap-1"
                                                                >
                                                                    <ShoppingBag size={14} /> Buy it again
                                                                </button>
                                                                <button
                                                                    onClick={() => handleViewProduct(trade.product._id)}
                                                                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm flex items-center gap-1"
                                                                >
                                                                    <ExternalLink size={14} /> View your item
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Action Buttons (for completed trades, buyer only) */}
                                            {isCompleted && !isSeller && (
                                                <div className="w-48 flex flex-col gap-2 border-l pl-4">
                                                    <button
                                                        onClick={() => handleAskProductDoubt(trade.product._id, trade.product?.name || 'Product')}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                                                    >
                                                        <MessageCircle size={14} /> Ask Product Doubt
                                                    </button>

                                                    {hasLeftSellerFeedback ? (
                                                        <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-center gap-2">
                                                            <CheckCircle size={14} /> Seller Feedback Left
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleLeaveFeedback(trade._id, 'seller')}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                                                        >
                                                            <Star size={14} /> Leave Seller Feedback
                                                        </button>
                                                    )}

                                                    {hasLeftDeliveryFeedback ? (
                                                        <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-center gap-2">
                                                            <CheckCircle size={14} /> Delivery Feedback Left
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleLeaveFeedback(trade._id, 'delivery')}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                                                        >
                                                            <Truck size={14} /> Leave Delivery Feedback
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Minimal View Action (for rejected trades or seller view) */}
                                            {(isRejected || isSeller) && (
                                                <div className="flex items-start">
                                                    <button
                                                        onClick={() => handleViewDetails(trade._id)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-5 h-5 text-gray-600" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
                />
            )}

            {/* Feedback Modal */}
            {feedbackTradeId && (
                <FeedbackModal
                    isOpen={showFeedbackModal}
                    onClose={() => {
                        setShowFeedbackModal(false);
                        setFeedbackTradeId(null);
                    }}
                    onSubmit={handleFeedbackSubmit}
                    feedbackType={feedbackType}
                    tradeId={feedbackTradeId}
                />
            )}

            {/* Query Modal */}
            {queryProductId && (
                <QueryModal
                    isOpen={showQueryModal}
                    onClose={() => {
                        setShowQueryModal(false);
                        setQueryProductId(null);
                        setQueryProductName('');
                    }}
                    productId={queryProductId}
                    productName={queryProductName}
                    recipientType="seller"
                    userRole="Buyer"
                />
            )}
        </div>
    );
};

export default TradeHistory;
