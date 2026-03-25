import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Filter, Check, X, Loader2, Eye, ArrowRight, Search, Calendar, DollarSign, Ship, Upload, Clock, CheckCircle } from "lucide-react";
import { getUserTrades, getSellerTrades, acceptTrade, rejectTrade, Trade, TradePhase, DocumentInfo } from "../services/trade.service";
import { validateCookie } from "../services/auth.service";
import TradeDetailsModal from "./TradeDetailsModal";
import TradeCancellationModal from "./TradeCancellationModal";
import TrackTrade from "./TrackTrade";
import { Pagination } from "./Pagination";
import { useNotifications } from "../contexts/NotificationContext";
import CompanyAvatar from "./ui/CompanyAvatar";
import ClickableCompanyName from "./ui/ClickableCompanyName";

type OngoingStatusFilter = 'all' | 'pending' | 'countered' | 'buyer_responded' | 'accepted';

// PHASE 2 REFACTORING: Cancelled trade 2-day visibility filter
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const shouldShowCancelledTrade = (trade: any): boolean => {
    // Always show non-cancelled trades
    if (trade.tradePhase !== 'CANCELLED' && trade.negotiationStatus !== 'cancelled') {
        return true;
    }
    // For cancelled trades, show only if cancelled within last 2 days
    const cancelledAt = trade.cancelledAt || trade.autoCancelledAt;
    if (!cancelledAt) return true; // No cancellation date, show it
    const cancelledDate = new Date(cancelledAt);
    const twoDaysAgo = new Date(Date.now() - TWO_DAYS_MS);
    return cancelledDate > twoDaysAgo;
};

interface TradeWithExtras extends Omit<Trade, 'purchaseRequestStatus' | 'negotiationStatus'> {
    product: {
        _id: string;
        name: string;
        price: string;
        currency: string;
        productImages: string[];
    };
    buyer: {
        _id: string;
        mail: string;
    };
    seller: {
        _id: string;
        mail: string;
    };
    purchaseRequestStatus?: string;
    negotiationStatus?: string;
    tradePhase?: TradePhase;
    // Document fields for phase-specific actions
    paymentProof?: DocumentInfo;
    bolDocument?: DocumentInfo;
}

export const OngoingTrades = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useNotifications();
    const [trades, setTrades] = useState<TradeWithExtras[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Get tradeId from URL for tracking view
    const trackingTradeId = searchParams.get('tradeId');

    // Cancellation modal state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelModalTrade, setCancelModalTrade] = useState<TradeWithExtras | null>(null);

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<OngoingStatusFilter>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [filteredTrades, setFilteredTrades] = useState<TradeWithExtras[]>([]);

    const handleViewDetails = (tradeId: string) => {
        setSelectedTradeId(tradeId);
        setShowDetailsModal(true);
    };

    const handleNavigateToNegotiation = (tradeId: string) => {
        const basePath = userRole === 'Seller' ? '/seller' : '/buyer';
        navigate(`${basePath}/negotiation/${tradeId}`);
    };

    // Navigate to trade tracking/progress view
    const handleTrackProgress = (tradeId: string) => {
        // Update URL to include tradeId (stays on ongoing tab)
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', 'ongoing');
        newParams.set('tradeId', tradeId);
        setSearchParams(newParams, { replace: true });
    };

    // Go back from tracking view to list
    const handleBackFromTracking = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('tradeId');
        setSearchParams(newParams, { replace: true });
    };

    useEffect(() => {
        checkRoleAndFetchTrades();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [trades, searchQuery, statusFilter, startDate, endDate, userRole]);

    const checkRoleAndFetchTrades = async () => {
        try {
            setLoading(true);
            // First check user role
            const authResponse = await validateCookie();
            if (authResponse.valid) {
                setUserRole(authResponse.role);
            }

            // Fetch trades based on role
            let response;
            if (authResponse.role === 'Seller') {
                response = await getSellerTrades();
            } else if (authResponse.role === 'Buyer') {
                response = await getUserTrades();
            } else {
                // For "Seller and Buyer", fetch both and merge
                const [sellerRes, buyerRes] = await Promise.all([
                    getSellerTrades(),
                    getUserTrades()
                ]);
                const allTrades = [
                    ...(sellerRes.data as TradeWithExtras[]),
                    ...(buyerRes.data as TradeWithExtras[])
                ];
                // Remove duplicates by _id
                const uniqueTrades = allTrades.filter((trade, index, self) =>
                    index === self.findIndex(t => t._id === trade._id)
                );
                response = { data: uniqueTrades };
            }

            // Filter for ongoing trades - strict phase filtering: only PAYMENT and BOL phases
            // Other phases are shown in their respective tabs (PR Status, PO Status, SPA Status)
            // PHASE 2 REFACTORING: Include cancelled trade 2-day visibility filter
            // Cancelled trades that were in PAYMENT/BOL phase should still appear here for 2 days
            const ongoingTrades = (response.data as TradeWithExtras[]).filter(trade => {
                // First apply 2-day visibility filter for cancelled trades
                if (!shouldShowCancelledTrade(trade)) return false;

                // For cancelled trades, check if they were in PAYMENT or BOL phase
                if (trade.tradePhase === 'CANCELLED' || trade.negotiationStatus === 'cancelled') {
                    // Show cancelled trades that reached PAYMENT or BOL phase
                    const lastPhase = (trade as any).lastActivePhase || (trade as any).phaseBeforeCancellation;
                    return lastPhase === 'PAYMENT' || lastPhase === 'BOL';
                }

                // For active trades, only show accepted trades in PAYMENT or BOL phase
                return trade.negotiationStatus === 'accepted' &&
                       (trade.tradePhase === 'PAYMENT' || trade.tradePhase === 'BOL');
            });
            setTrades(ongoingTrades);
        } catch (err) {
            setError('Failed to fetch ongoing trades');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (tradeId: string) => {
        try {
            setProcessingId(tradeId);
            await acceptTrade(tradeId);
            await checkRoleAndFetchTrades();
        } catch (err) {
            console.error('Failed to accept:', err);
            showToast('Failed to accept. Please try again.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = (tradeId: string) => {
        const trade = trades.find(t => t._id === tradeId);
        if (trade) {
            setCancelModalTrade(trade);
            setShowCancelModal(true);
        }
    };

    const handleCancellationComplete = async () => {
        setShowCancelModal(false);
        setCancelModalTrade(null);
        await checkRoleAndFetchTrades();
    };

    const applyFilters = () => {
        let result = [...trades];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(trade => {
                const counterparty = userRole === 'Seller'
                    ? trade.buyer?.mail
                    : trade.seller?.mail;
                return (
                    counterparty?.toLowerCase().includes(query) ||
                    trade.product?.name?.toLowerCase().includes(query)
                );
            });
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(trade => {
                const status = trade.negotiationStatus || trade.purchaseRequestStatus;
                if (statusFilter === 'accepted') {
                    return status === 'accepted';
                }
                return status === statusFilter;
            });
        }

        // Apply date range filter
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            result = result.filter(trade => {
                const tradeDate = new Date(trade.createdAt);
                return tradeDate >= start;
            });
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(trade => {
                const tradeDate = new Date(trade.createdAt);
                return tradeDate <= end;
            });
        }

        setFilteredTrades(result);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setStartDate('');
        setEndDate('');
    };

    const getStatusBadge = (trade: TradeWithExtras) => {
        // For ongoing trades (PAYMENT/BOL), show phase-specific status
        if (trade.tradePhase === 'PAYMENT') {
            if (trade.paymentProof?.filePath) {
                const status = trade.paymentProof.status;
                if (status === 'approved') {
                    return (
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                            <CheckCircle size={12} />
                            Payment Verified
                        </span>
                    );
                }
                if (status === 'rejected') {
                    return (
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                            <X size={12} />
                            Payment Rejected
                        </span>
                    );
                }
                // uploaded / pending review
                return (
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        <DollarSign size={12} />
                        Payment Proof Uploaded
                    </span>
                );
            }
            return (
                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                    <Clock size={12} />
                    Awaiting Payment
                </span>
            );
        }
        if (trade.tradePhase === 'BOL') {
            if (trade.bolDocument?.filePath) {
                const status = trade.bolDocument.status;
                if (status === 'approved') {
                    return (
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                            <CheckCircle size={12} />
                            BoL Verified
                        </span>
                    );
                }
                if (status === 'rejected') {
                    return (
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                            <X size={12} />
                            BoL Rejected
                        </span>
                    );
                }
                return (
                    <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                        <Ship size={12} />
                        BoL Uploaded
                    </span>
                );
            }
            return (
                <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                    <Clock size={12} />
                    Awaiting BoL
                </span>
            );
        }

        // Fallback for any non-PAYMENT/BOL trades
        if (trade.negotiationStatus === 'accepted' || trade.purchaseRequestStatus === 'accepted') {
            return <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Accepted</span>;
        }
        if (trade.negotiationStatus === 'countered') {
            return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Countered</span>;
        }
        if (trade.negotiationStatus === 'buyer_responded') {
            return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">Buyer Responded</span>;
        }
        return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Pending</span>;
    };

    // Determine if current user can accept based on their role and trade status
    const canUserAccept = (trade: TradeWithExtras) => {
        if (userRole === 'Seller') {
            // Seller can accept when buyer has an offer on the table
            return trade.negotiationStatus === 'pending' || trade.negotiationStatus === 'buyer_responded';
        } else if (userRole === 'Buyer') {
            // Buyer can accept when seller has countered
            return trade.negotiationStatus === 'countered';
        }
        // For "Seller and Buyer", need to check which side of the trade they're on
        // For now, allow accept (they can use the dedicated negotiation page for clarity)
        return true;
    };

    // Get appropriate label for the accept button
    const getAcceptLabel = (trade: TradeWithExtras) => {
        if (userRole === 'Seller') {
            return "Accept Buyer's Offer";
        } else if (userRole === 'Buyer') {
            return "Accept Seller's Offer";
        }
        return "Accept";
    };

    // Get a phase-specific action button for the trade
    const getPhaseActionButton = (trade: TradeWithExtras) => {
        const phase = trade.tradePhase;
        if (!phase) return null;

        if (phase === 'PAYMENT') {
            if (trade.paymentProof?.filePath) {
                const status = trade.paymentProof.status;
                // Seller needs to verify payment proof
                if (isActingAsSeller && (status === 'uploaded' || !status)) {
                    return (
                        <button
                            onClick={() => handleTrackProgress(trade._id)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                            title="Verify Payment Proof"
                        >
                            <DollarSign size={14} />
                            Verify Payment
                        </button>
                    );
                }
                // Payment was rejected - seller waiting for buyer to re-upload
                if (isActingAsSeller && status === 'rejected') {
                    return (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                            <Clock size={12} />
                            Awaiting Re-upload
                        </span>
                    );
                }
                // Buyer: payment submitted, awaiting verification
                if (!isActingAsSeller && (status === 'uploaded' || !status)) {
                    return (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            Awaiting Verification
                        </span>
                    );
                }
                // Buyer: payment was rejected, needs to re-upload
                if (!isActingAsSeller && status === 'rejected') {
                    return (
                        <button
                            onClick={() => handleTrackProgress(trade._id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1.5"
                            title="Re-upload Payment Proof"
                        >
                            <Upload size={14} />
                            Re-upload Payment
                        </button>
                    );
                }
            } else {
                // No payment proof uploaded yet
                if (!isActingAsSeller) {
                    // Buyer needs to upload payment proof
                    return (
                        <button
                            onClick={() => handleTrackProgress(trade._id)}
                            className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 flex items-center gap-1.5"
                            title="Upload Payment Proof"
                        >
                            <Upload size={14} />
                            Upload Payment
                        </button>
                    );
                }
                // Seller waiting for buyer's payment
                return (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        Awaiting Payment
                    </span>
                );
            }
        }

        if (phase === 'BOL') {
            if (trade.bolDocument?.filePath) {
                const status = trade.bolDocument.status;
                // Buyer needs to verify BoL
                if (!isActingAsSeller && (status === 'uploaded' || !status)) {
                    return (
                        <button
                            onClick={() => handleTrackProgress(trade._id)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5"
                            title="Verify Bill of Lading"
                        >
                            <Ship size={14} />
                            Verify BoL
                        </button>
                    );
                }
                // BoL was rejected - buyer waiting for seller to re-upload
                if (!isActingAsSeller && status === 'rejected') {
                    return (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                            <Clock size={12} />
                            Awaiting Re-upload
                        </span>
                    );
                }
                // Seller: BoL submitted, awaiting buyer verification
                if (isActingAsSeller && (status === 'uploaded' || !status)) {
                    return (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            Awaiting Verification
                        </span>
                    );
                }
                // Seller: BoL was rejected, needs to re-upload
                if (isActingAsSeller && status === 'rejected') {
                    return (
                        <button
                            onClick={() => handleTrackProgress(trade._id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 flex items-center gap-1.5"
                            title="Re-upload Bill of Lading"
                        >
                            <Upload size={14} />
                            Re-upload BoL
                        </button>
                    );
                }
                // BoL approved
                if (status === 'approved' && !isActingAsSeller) {
                    return (
                        <button
                            onClick={() => handleTrackProgress(trade._id)}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-1.5"
                            title="Complete Trade"
                        >
                            <CheckCircle size={14} />
                            Complete Trade
                        </button>
                    );
                }
            } else {
                // No BoL uploaded yet
                if (isActingAsSeller) {
                    // Seller needs to upload BoL
                    return (
                        <button
                            onClick={() => handleTrackProgress(trade._id)}
                            className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 flex items-center gap-1.5"
                            title="Upload Bill of Lading"
                        >
                            <Upload size={14} />
                            Upload BoL
                        </button>
                    );
                }
                // Buyer waiting for seller's BoL
                return (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        Awaiting BoL
                    </span>
                );
            }
        }

        return null;
    };

    const totalPages = Math.ceil(filteredTrades.length / entriesPerPage);
    const startIndex = (currentPage - 1) * entriesPerPage;
    const displayedTrades = filteredTrades.slice(startIndex, startIndex + entriesPerPage);
    const hasActiveFilters = searchQuery || statusFilter !== 'all' || startDate || endDate;

    // Reset to page 1 when filters change or entries per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [entriesPerPage, searchQuery, statusFilter, startDate, endDate]);

    // Determine if acting as seller - check URL path for dual-role users
    // This ensures the correct context when userRole is 'Seller and Buyer'
    const isActingAsSeller = userRole === 'Seller' ||
        (userRole === 'Seller and Buyer' && window.location.pathname.startsWith('/seller'));

    // If trackingTradeId is present, show the TrackTrade component
    if (trackingTradeId) {
        return (
            <div className="border-t-2 border-x-2 rounded-lg my-8 p-6">
                <button
                    onClick={handleBackFromTracking}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    <span className="font-medium">Back to Ongoing Trades</span>
                </button>
                <TrackTrade tradeId={trackingTradeId} isSeller={isActingAsSeller} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="border-t-2 border-x-2 rounded-lg my-8 p-8">
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin mr-2" />
                    <span className="text-gray-500">Loading ongoing trades...</span>
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
        <div className="border-t-2 border-x-2 rounded-lg my-8">
            <div className="p-8 flex-col flex">
                <div className="flex items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-700">Ongoing Trades</h1>
                        <span className="text-gray-500">Track and manage your active trade negotiations</span>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`ml-auto p-2 rounded-lg transition-colors ${
                            showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                        }`}
                        title="Toggle filters"
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Section */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search by ${userRole === 'Seller' ? 'buyer' : 'seller'} email or product name...`}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-gray-600 mr-2 self-center">Status:</span>
                            {(['all', 'pending', 'countered', 'buyer_responded', 'accepted'] as OngoingStatusFilter[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === status
                                            ? 'bg-black text-white'
                                            : 'bg-white border text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {status === 'buyer_responded' ? 'Buyer Responded' : status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Date Range Filter */}
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Date Range:</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex mt-4 items-center">
                    <span className="text-gray-600">
                        {filteredTrades.length} of {trades.length} trade{trades.length !== 1 ? 's' : ''}
                        {hasActiveFilters && ' (filtered)'}
                    </span>
                </div>
            </div>

            {filteredTrades.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    {trades.length === 0 ? (
                        'No ongoing trades'
                    ) : (
                        <div>
                            <p>No trades match your filters</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2">
                            <th className="text-gray-600 font-medium py-2">Trade</th>
                            <th className="text-gray-600 font-medium py-2">
                                {userRole === 'Seller' ? 'Buyer' : userRole === 'Buyer' ? 'Seller' : 'Counterparty'}
                            </th>
                            <th className="text-gray-600 font-medium py-2">Product</th>
                            <th className="text-gray-600 font-medium py-2">Negotiation</th>
                            <th className="text-gray-600 font-medium py-2">Status</th>
                            <th className="text-gray-600 font-medium py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTrades.map((trade) => (
                            <tr key={trade._id} className="border-b hover:bg-gray-50">
                                <td className="py-4 text-center">
                                    <button
                                        onClick={() => handleViewDetails(trade._id)}
                                        className="text-[#0076D3] hover:underline"
                                    >
                                        Trade terms
                                    </button>
                                </td>
                                <td className="py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {userRole === 'Seller' ? (
                                            <>
                                                <CompanyAvatar
                                                    companyId={(trade.buyer as any)?.company?._id}
                                                    companyName={(trade.buyer as any)?.company?.companyName || trade.buyer?.mail || 'Buyer'}
                                                    profilePicture={(trade.buyer as any)?.company?.profilePicture}
                                                    size="sm"
                                                    clickable={!!(trade.buyer as any)?.company?._id}
                                                    viewerRole="seller"
                                                />
                                                <ClickableCompanyName
                                                    companyId={(trade.buyer as any)?.company?._id}
                                                    companyName={(trade.buyer as any)?.company?.companyName || trade.buyer?.mail || 'N/A'}
                                                    className="text-sm"
                                                    viewerRole="seller"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <CompanyAvatar
                                                    companyId={(trade.seller as any)?.company?._id}
                                                    companyName={(trade.seller as any)?.company?.companyName || trade.seller?.mail || 'Seller'}
                                                    profilePicture={(trade.seller as any)?.company?.profilePicture}
                                                    size="sm"
                                                    clickable={!!(trade.seller as any)?.company?._id}
                                                    viewerRole="buyer"
                                                />
                                                <ClickableCompanyName
                                                    companyId={(trade.seller as any)?.company?._id}
                                                    companyName={(trade.seller as any)?.company?.companyName || trade.seller?.mail || 'N/A'}
                                                    className="text-sm"
                                                    viewerRole="buyer"
                                                />
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 text-center">
                                    <span className="font-medium">{trade.product?.name || 'N/A'}</span>
                                    <br />
                                    <span className="text-xs text-gray-500">
                                        {trade.quantity} {trade.quantityUnit}
                                    </span>
                                </td>
                                <td className="py-4 text-center">
                                    <button
                                        onClick={() => handleNavigateToNegotiation(trade._id)}
                                        className="text-[#0076D3] hover:underline flex items-center justify-center gap-1 mx-auto"
                                    >
                                        <ArrowRight size={14} />
                                        Check Terms
                                    </button>
                                </td>
                                <td className="py-4 text-center">
                                    {getStatusBadge(trade)}
                                </td>
                                <td className="py-4">
                                    <div className="flex w-full justify-center gap-2 flex-wrap">
                                        {/* Phase-specific action button (Verify Payment, Upload BoL, etc.) */}
                                        {getPhaseActionButton(trade)}
                                        {/* Track Progress button - secondary when phase action exists */}
                                        <button
                                            onClick={() => handleTrackProgress(trade._id)}
                                            className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
                                            title="Track Progress"
                                        >
                                            <Eye size={14} />
                                            Track
                                        </button>
                                        {/* Accept/Reject only shown for trades still in negotiation (shouldn't appear for PAYMENT/BOL) */}
                                        {(trade.negotiationStatus !== 'accepted' || !['PAYMENT', 'BOL'].includes(trade.tradePhase || '')) && (
                                            <>
                                                <button
                                                    onClick={() => handleAccept(trade._id)}
                                                    disabled={processingId === trade._id || !canUserAccept(trade)}
                                                    className="border-2 border-green-400 rounded-full p-1 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={canUserAccept(trade) ? getAcceptLabel(trade) : "Waiting for other party"}
                                                >
                                                    {processingId === trade._id ? (
                                                        <Loader2 className="text-green-400 animate-spin" size={18} />
                                                    ) : (
                                                        <Check className="text-green-400" size={18} />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(trade._id)}
                                                    disabled={processingId === trade._id}
                                                    className="border-2 rounded-full p-1 border-red-400 hover:bg-red-50 disabled:opacity-50"
                                                    title="Reject/Withdraw"
                                                >
                                                    <X className="text-red-400" size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Pagination */}
            {filteredTrades.length > 0 && (
                <div className="px-8 pb-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        showEntrySelector={true}
                        entriesPerPage={entriesPerPage}
                        onEntriesChange={setEntriesPerPage}
                        totalEntries={filteredTrades.length}
                    />
                </div>
            )}

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
        </div>
    );
};
