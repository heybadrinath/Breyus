import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Check, X, Loader2, Eye, FileUp, FileText, Search, Calendar, CheckCircle, Clock } from "lucide-react";
import { getSellerTrades, verifyDocument, uploadSCO, Trade, DocumentInfo } from "../../services/trade.service";
import TradeDetailsModal from "../../components/TradeDetailsModal";
import ViewDocumentModal from "../../components/ViewDocumentModal";
import DocumentUploadModal from "../../components/DocumentUploadModal";
import SelectField from "../../components/SelectField";
import { useNotifications } from "../../contexts/NotificationContext";

type POStatusFilter = 'all' | 'received' | 'pending' | 'cancelled';

interface TradeWithProduct extends Omit<Trade, 'purchaseOrderStatus' | 'purchaseRequestStatus' | 'negotiationStatus'> {
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
    purchaseOrderStatus?: string;
    purchaseRequestStatus?: string;
    negotiationStatus?: string;
    scoDocument?: DocumentInfo;
    icpoDocument?: DocumentInfo;
    spaDocument?: DocumentInfo;
    tradePhase?: string;
}

export const PurchaseOrderStatus = () => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
    const [trades, setTrades] = useState<TradeWithProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // View Document Modal state
    const [showDocModal, setShowDocModal] = useState(false);
    const [viewDocTrade, setViewDocTrade] = useState<TradeWithProduct | null>(null);
    const [viewDocType, setViewDocType] = useState<'sco' | 'icpo'>('icpo');

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<POStatusFilter>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [filteredTrades, setFilteredTrades] = useState<TradeWithProduct[]>([]);

    // SCO Upload Modal state
    const [scoUploadModalOpen, setScoUploadModalOpen] = useState(false);
    const [scoUploadTradeId, setScoUploadTradeId] = useState<string | null>(null);

    const handleNavigateToNegotiation = (tradeId: string) => {
        navigate(`/seller/negotiation/${tradeId}`);
    };

    // Handle viewing ICPO document (using trade data directly)
    const handleViewICPO = (trade: TradeWithProduct) => {
        setViewDocTrade(trade);
        setViewDocType('icpo');
        setShowDocModal(true);
    };

    // Handle viewing SCO document
    const handleViewSCO = (trade: TradeWithProduct) => {
        setViewDocTrade(trade);
        setViewDocType('sco');
        setShowDocModal(true);
    };

    const handleUploadSPA = (tradeId: string) => {
        // Navigate to trade page with SPA Status tab active
        navigate('/seller/trade', { state: { activeTab: 2, uploadSPA: tradeId } });
    };

    // Handle opening SCO upload modal
    const handleOpenSCOUpload = (tradeId: string) => {
        setScoUploadTradeId(tradeId);
        setScoUploadModalOpen(true);
    };

    // Handle SCO file upload
    const handleSCOUpload = async (file: File, notes?: string) => {
        if (!scoUploadTradeId) return;

        try {
            await uploadSCO(scoUploadTradeId, file, notes);
            showToast('SCO uploaded successfully! The buyer will review it.', 'success');
            setScoUploadModalOpen(false);
            setScoUploadTradeId(null);
            await fetchTrades(false);
        } catch (err: any) {
            showToast(err.message || 'Failed to upload SCO', 'error');
            throw err;
        }
    };

    const applyFilters = useCallback(() => {
        let result = [...trades];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(trade =>
                trade.buyer?.mail?.toLowerCase().includes(query) ||
                trade.product?.name?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            result = result.filter(trade => {
                const isCancelled = trade.purchaseOrderStatus === 'cancelled' || trade.negotiationStatus === 'rejected' || trade.icpoDocument?.status === 'rejected';
                const isApproved = trade.icpoDocument?.status === 'approved';

                if (statusFilter === 'cancelled') return isCancelled;
                if (statusFilter === 'received') return isApproved;
                if (statusFilter === 'pending') return !isCancelled && !isApproved;
                return true;
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
    }, [trades, searchQuery, statusFilter, startDate, endDate]);

    useEffect(() => {
        fetchTrades();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const fetchTrades = async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const response = await getSellerTrades();
            const acceptedTrades = (response.data as TradeWithProduct[]).filter(
                trade => trade.purchaseRequestStatus === 'accepted' || trade.negotiationStatus === 'accepted'
            );
            // Strict phase filtering: PO tab shows only SCO and ICPO phases
            const poTrades = acceptedTrades.filter(trade =>
                trade.tradePhase === 'SCO' || trade.tradePhase === 'ICPO'
            );
            setTrades(poTrades);
        } catch (err) {
            setError('Failed to fetch purchase orders');
            console.error(err);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setStartDate('');
        setEndDate('');
    };

    const handleAcceptICPO = async (tradeId: string) => {
        try {
            setProcessingId(tradeId);
            await verifyDocument(tradeId, 'icpo', 'approved');
            await fetchTrades(false); // Don't show loading spinner on refresh
            showToast('ICPO approved successfully', 'success');
        } catch (err) {
            console.error('Failed to approve ICPO:', err);
            showToast('Failed to approve ICPO. Please try again.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectICPO = async (tradeId: string) => {
        const reason = window.prompt('Reason for rejection (optional):');
        if (reason === null) return; // User cancelled

        try {
            setProcessingId(tradeId);
            await verifyDocument(tradeId, 'icpo', 'rejected', reason || undefined);
            await fetchTrades(false); // Don't show loading spinner on refresh
            showToast('ICPO rejected', 'info');
        } catch (err) {
            console.error('Failed to reject ICPO:', err);
            showToast('Failed to reject ICPO. Please try again.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // Handler for ICPO verification from modal view (matches ViewDocumentModal's onVerify signature)
    const handleVerifyICPOFromModal = async (status: 'approved' | 'rejected', notes?: string) => {
        if (!viewDocTrade) return;

        try {
            await verifyDocument(viewDocTrade._id, 'icpo', status, notes);
            showToast(
                status === 'approved'
                    ? 'ICPO approved successfully! Trade will advance to SPA phase.'
                    : 'ICPO rejected. The buyer will be notified.',
                status === 'approved' ? 'success' : 'info'
            );
            await fetchTrades(false);
        } catch (err: any) {
            showToast(err.message || 'Failed to verify ICPO', 'error');
            throw err;
        }
    };

    const displayedTrades = filteredTrades.slice(0, entriesPerPage);
    const hasActiveFilters = searchQuery || statusFilter !== 'all' || startDate || endDate;

    if (loading) {
        return (
            <div className="border-t-2 border-x-2 rounded-lg my-8 p-8">
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin mr-2" />
                    <span className="text-gray-500">Loading purchase orders...</span>
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
                        <h1 className="text-2xl font-bold text-gray-700">Purchase Orders</h1>
                        <span className="text-gray-500">Manage accepted trades and purchase orders</span>
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
                                placeholder="Search by buyer email or product name..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-gray-600 mr-2 self-center">Status:</span>
                            {(['all', 'received', 'pending', 'cancelled'] as POStatusFilter[]).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === status
                                            ? 'bg-black text-white'
                                            : 'bg-white border text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
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
                    <SelectField
                        id="entries"
                        value={entriesPerPage}
                        className="select-field--sm w-fit"
                        onValueChange={(value) => setEntriesPerPage(Number(value))}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                    </SelectField>
                    <label className="ml-2 text-gray-500" htmlFor="entries">entries per page</label>
                    <span className="ml-auto text-gray-600">
                        {filteredTrades.length} of {trades.length} order{trades.length !== 1 ? 's' : ''}
                        {hasActiveFilters && ' (filtered)'}
                    </span>
                </div>
            </div>

            {filteredTrades.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    {trades.length === 0 ? (
                        'No purchase orders found'
                    ) : (
                        <div>
                            <p>No purchase orders match your filters</p>
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
                            <th className="text-gray-600 font-medium py-2">Buyer</th>
                            <th className="text-gray-600 font-medium py-2">Product</th>
                            <th className="text-gray-600 font-medium py-2">SCO Status</th>
                            <th className="text-gray-600 font-medium py-2">ICPO Status</th>
                            <th className="text-gray-600 font-medium py-2">Actions</th>
                            <th className="text-gray-600 font-medium py-2">SPA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTrades.map((trade) => {
                            const isCancelled = trade.purchaseOrderStatus === 'cancelled' || trade.negotiationStatus === 'rejected' || trade.icpoDocument?.status === 'rejected';
                            const isICPOApproved = trade.icpoDocument?.status === 'approved';
                            const hasSCO = trade.scoDocument && trade.scoDocument.filePath;
                            const hasICPO = trade.icpoDocument && trade.icpoDocument.filePath;
                            // Check if trade has advanced beyond ICPO phase
                            const isInSPAOrHigher = ['SPA', 'PAYMENT', 'BOL', 'COMPLETED'].includes(trade.tradePhase || '');

                            return (
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
                                    {/* Product */}
                                    <td className="py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-medium">{trade.product?.name || 'N/A'}</span>
                                            <span className="text-xs text-gray-500">
                                                {trade.quantity} {trade.quantityUnit}
                                            </span>
                                        </div>
                                    </td>
                                    {/* SCO Status */}
                                    <td className="py-4 text-center">
                                        {hasSCO ? (
                                            <div className="flex flex-col items-center gap-1">
                                                {trade.scoDocument?.status === 'rejected' ? (
                                                    <>
                                                        <div className="flex items-center gap-1 text-red-600">
                                                            <X size={14} />
                                                            <span className="text-sm font-medium">SCO Rejected</span>
                                                        </div>
                                                        {trade.scoDocument?.verificationNotes && (
                                                            <span className="text-xs text-red-500 max-w-[120px] truncate" title={trade.scoDocument.verificationNotes}>
                                                                "{trade.scoDocument.verificationNotes}"
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenSCOUpload(trade._id)}
                                                            className="mt-1 px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 flex items-center gap-1"
                                                        >
                                                            <FileUp size={12} /> Re-upload SCO
                                                        </button>
                                                    </>
                                                ) : trade.scoDocument?.status === 'approved' ? (
                                                    <>
                                                        <div className="flex items-center gap-1 text-green-600">
                                                            <CheckCircle size={14} />
                                                            <span className="text-sm font-medium">SCO Approved</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleViewSCO(trade)}
                                                            className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                                        >
                                                            <Eye size={12} /> View
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-1 text-blue-600">
                                                            <Clock size={14} />
                                                            <span className="text-sm font-medium">Pending Review</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleViewSCO(trade)}
                                                            className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                                        >
                                                            <Eye size={12} /> View
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1 text-yellow-600">
                                                <Clock size={14} />
                                                <span className="text-sm">Pending Upload</span>
                                            </div>
                                        )}
                                    </td>
                                    {/* ICPO Status */}
                                    <td className="py-4 text-center">
                                        {hasICPO ? (
                                            <div className="flex flex-col items-center gap-1">
                                                {isICPOApproved ? (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle size={14} />
                                                        <span className="text-sm font-medium">ICPO Approved</span>
                                                    </div>
                                                ) : isCancelled ? (
                                                    <div className="flex items-center gap-1 text-red-600">
                                                        <X size={14} />
                                                        <span className="text-sm font-medium">ICPO Rejected</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-blue-600">
                                                        <FileText size={14} />
                                                        <span className="text-sm font-medium">ICPO Received</span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleViewICPO(trade)}
                                                    className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                                                >
                                                    <Eye size={12} /> View ICPO
                                                </button>
                                            </div>
                                        ) : hasSCO ? (
                                            <div className="flex items-center justify-center gap-1 text-yellow-600">
                                                <Clock size={14} className="animate-pulse" />
                                                <span className="text-sm">Awaiting Buyer</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Upload SCO first</span>
                                        )}
                                    </td>
                                    {/* Actions */}
                                    <td className="py-4">
                                        {isICPOApproved || isInSPAOrHigher ? (
                                            <div className="flex items-center justify-center gap-1 text-green-600">
                                                <CheckCircle size={16} />
                                                <span className="text-sm font-medium">Approved</span>
                                            </div>
                                        ) : hasICPO && !isCancelled ? (
                                            <div className="flex w-full justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAcceptICPO(trade._id)}
                                                    disabled={processingId === trade._id}
                                                    className="border-2 border-green-400 rounded-full p-1 hover:bg-green-50 disabled:opacity-50"
                                                    title="Approve ICPO"
                                                >
                                                    {processingId === trade._id ? (
                                                        <Loader2 className="text-green-400 animate-spin" size={18} />
                                                    ) : (
                                                        <Check className="text-green-400" size={18} />
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRejectICPO(trade._id)}
                                                    disabled={processingId === trade._id}
                                                    className="border-2 rounded-full p-1 border-red-400 hover:bg-red-50 disabled:opacity-50"
                                                    title="Reject ICPO"
                                                >
                                                    <X className="text-red-400" size={18} />
                                                </button>
                                            </div>
                                        ) : isCancelled ? (
                                            <span className="text-red-500 text-xs">Rejected</span>
                                        ) : !hasSCO || trade.scoDocument?.status === 'rejected' ? (
                                            <button
                                                onClick={() => handleOpenSCOUpload(trade._id)}
                                                className={`px-3 py-1.5 text-xs rounded flex items-center gap-1 mx-auto ${
                                                    trade.scoDocument?.status === 'rejected'
                                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                        : 'bg-black text-white hover:bg-gray-800'
                                                }`}
                                            >
                                                <FileUp size={12} /> {trade.scoDocument?.status === 'rejected' ? 'Re-upload SCO' : 'Upload SCO'}
                                            </button>
                                        ) : trade.scoDocument?.status !== 'approved' ? (
                                            <span className="text-blue-500 text-xs text-center block">Awaiting Buyer Review</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs text-center block">Waiting for ICPO</span>
                                        )}
                                    </td>
                                    {/* SPA */}
                                    <td className="py-4 text-center">
                                        {trade.spaDocument?.filePath ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-1 text-green-600">
                                                    <CheckCircle size={14} />
                                                    <span className="text-sm font-medium">SPA Uploaded</span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {trade.spaDocument.status === 'approved' ? '✓ Signed' : 'Pending signature'}
                                                </span>
                                            </div>
                                        ) : (isICPOApproved || isInSPAOrHigher) ? (
                                            <button
                                                onClick={() => handleUploadSPA(trade._id)}
                                                className="px-3 py-1.5 border-2 border-blue-500 text-blue-500 text-sm rounded hover:bg-blue-50 flex items-center gap-1 justify-center mx-auto"
                                            >
                                                <FileUp size={14} /> Upload SPA
                                            </button>
                                        ) : !isICPOApproved && hasICPO && !isCancelled ? (
                                            <span className="text-gray-400 text-xs">Approve ICPO first</span>
                                        ) : isCancelled ? (
                                            <span className="text-red-400 text-xs">Trade cancelled</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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

            {/* View Document Modal */}
            {viewDocTrade && (
                <ViewDocumentModal
                    isOpen={showDocModal}
                    onClose={() => {
                        setShowDocModal(false);
                        setViewDocTrade(null);
                    }}
                    tradeId={viewDocTrade._id}
                    documentType={viewDocType}
                    document={(viewDocType === 'sco' ? viewDocTrade.scoDocument : viewDocTrade.icpoDocument) as DocumentInfo | null}
                    canVerify={
                        viewDocType === 'icpo' &&
                        viewDocTrade.icpoDocument?.status !== 'approved' &&
                        viewDocTrade.icpoDocument?.status !== 'rejected'
                    }
                    onVerify={viewDocType === 'icpo' ? handleVerifyICPOFromModal : undefined}
                />
            )}

            {/* SCO Upload Modal */}
            {scoUploadModalOpen && (
                <DocumentUploadModal
                    isOpen={scoUploadModalOpen}
                    onClose={() => {
                        setScoUploadModalOpen(false);
                        setScoUploadTradeId(null);
                    }}
                    onUpload={handleSCOUpload}
                    documentType="sco"
                />
            )}
        </div>
    );
};
