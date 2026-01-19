import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Filter, Check, X, Loader2, Eye, ArrowRight, Search, Calendar } from "lucide-react";
import { getUserTrades, getSellerTrades, acceptTrade, rejectTrade, Trade, TradePhase } from "../services/trade.service";
import { validateCookie } from "../services/auth.service";
import TradeDetailsModal from "./TradeDetailsModal";
import TradeCancellationModal from "./TradeCancellationModal";
import TrackTrade from "./TrackTrade";
import { Pagination } from "./Pagination";
import { useNotifications } from "../contexts/NotificationContext";

type OngoingStatusFilter = 'all' | 'pending' | 'countered' | 'buyer_responded' | 'accepted';

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
            const ongoingTrades = (response.data as TradeWithExtras[]).filter(
                trade => trade.negotiationStatus === 'accepted' &&
                         (trade.tradePhase === 'PAYMENT' || trade.tradePhase === 'BOL')
            );
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
                                    <span className="text-sm">
                                        {userRole === 'Seller'
                                            ? trade.buyer?.mail || 'N/A'
                                            : trade.seller?.mail || 'N/A'}
                                    </span>
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
                                        {/* Track Progress button - primary action for ongoing trades */}
                                        <button
                                            onClick={() => handleTrackProgress(trade._id)}
                                            className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 flex items-center gap-1.5"
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
