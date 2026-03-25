import React, { useState, useEffect } from 'react';
import {
    Clock,
    User,
    DollarSign,
    MessageSquare,
    CheckCircle,
    XCircle,
    ArrowRight,
    Loader2,
    FileText,
    TrendingUp,
    TrendingDown,
    RefreshCw
} from 'lucide-react';
import { getNegotiationHistory, NegotiationHistoryEntry, NegotiationHistoryResponse } from '../services/trade.service';

interface NegotiationHistoryProps {
    tradeId: string;
    onClose?: () => void;
    compact?: boolean; // For embedded view in negotiation page
}

/**
 * NegotiationHistory Component
 *
 * Displays the complete timeline of negotiation rounds between buyer and seller.
 * Features clean, light design with:
 * - Current offers summary with visual comparison
 * - Timeline with party-specific color coding
 * - Price change indicators showing negotiation direction
 * - Compact mode for embedded views
 */
const NegotiationHistory: React.FC<NegotiationHistoryProps> = ({ tradeId, onClose, compact = false }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [historyData, setHistoryData] = useState<NegotiationHistoryResponse['data'] | null>(null);

    useEffect(() => {
        fetchHistory();
    }, [tradeId]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getNegotiationHistory(tradeId);
            setHistoryData(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to load negotiation history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateFull = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'accepted':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    border: 'border-green-200',
                    icon: <CheckCircle className="w-3.5 h-3.5" />
                };
            case 'rejected':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-700',
                    border: 'border-red-200',
                    icon: <XCircle className="w-3.5 h-3.5" />
                };
            case 'countered':
                return {
                    bg: 'bg-blue-100',
                    text: 'text-blue-700',
                    border: 'border-blue-200',
                    icon: <ArrowRight className="w-3.5 h-3.5" />
                };
            case 'buyer_responded':
                return {
                    bg: 'bg-purple-100',
                    text: 'text-purple-700',
                    border: 'border-purple-200',
                    icon: <ArrowRight className="w-3.5 h-3.5" />
                };
            default:
                return {
                    bg: 'bg-amber-100',
                    text: 'text-amber-700',
                    border: 'border-amber-200',
                    icon: <Clock className="w-3.5 h-3.5" />
                };
        }
    };

    const getPriceChangeIndicator = (current: number | null, previous: number | null) => {
        if (!current || !previous) return null;
        if (current > previous) {
            return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
        } else if (current < previous) {
            return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                <span className="text-sm text-gray-500">Loading history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button
                    onClick={fetchHistory}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    if (!historyData) {
        return (
            <div className="p-8 text-center">
                <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No history available</p>
            </div>
        );
    }

    const statusConfig = getStatusConfig(historyData.negotiationStatus);

    // Compact mode - only show timeline
    if (compact) {
        return (
            <div className="p-4 max-h-80 overflow-y-auto">
                {historyData.history.length === 0 ? (
                    <div className="text-center py-8">
                        <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No negotiation rounds yet</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-200" />

                        <div className="space-y-4">
                            {historyData.history.map((entry, index) => {
                                const isBuyer = entry.party === 'buyer';
                                const partyColor = isBuyer ? 'blue' : 'purple';

                                return (
                                    <div key={index} className="relative pl-10">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-1 top-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                                            isBuyer ? 'bg-blue-500' : 'bg-purple-500'
                                        }`}>
                                            <User className="w-2.5 h-2.5 text-white" />
                                        </div>

                                        {/* Entry card */}
                                        <div className={`bg-white border rounded-xl p-3 shadow-sm border-l-3 ${
                                            isBuyer ? 'border-l-blue-500' : 'border-l-purple-500'
                                        }`}>
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                    isBuyer ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                    {entry.party.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    R{entry.round}
                                                </span>
                                            </div>

                                            {/* Price */}
                                            {entry.offeredPrice && (
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {entry.offeredPrice}
                                                    </span>
                                                    {index > 0 && getPriceChangeIndicator(
                                                        parseFloat(String(entry.offeredPrice).replace(/[^0-9.-]+/g, '')),
                                                        parseFloat(String(historyData.history[index - 1]?.offeredPrice || '0').replace(/[^0-9.-]+/g, ''))
                                                    )}
                                                </div>
                                            )}

                                            {/* Incoterm */}
                                            {entry.offeredIncoterms?.selectedIncoterm && (
                                                <span className="inline-block text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                    {entry.offeredIncoterms.selectedIncoterm}
                                                </span>
                                            )}

                                            {/* Message */}
                                            {entry.message && (
                                                <p className="text-xs text-gray-500 mt-2 italic line-clamp-2">
                                                    "{entry.message}"
                                                </p>
                                            )}

                                            {/* Timestamp */}
                                            <p className="text-xs text-gray-400 mt-2">
                                                {formatDate(entry.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Full mode - with header and offers summary
    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        Negotiation History
                    </h3>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
                        {statusConfig.icon}
                        {historyData.negotiationStatus.replace('_', ' ').toUpperCase()}
                    </div>
                </div>
                <p className="text-xs text-gray-500">
                    Round {historyData.currentRound} of negotiation
                </p>
            </div>

            {/* Current Offers Summary */}
            <div className="p-4 bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                    {/* Buyer's Current Offer */}
                    <div className="p-3 bg-white border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Buyer</span>
                        </div>
                        {historyData.buyerCurrentOffer.price ? (
                            <>
                                <p className="text-lg font-bold text-gray-900">
                                    {historyData.buyerCurrentOffer.price}
                                </p>
                                {historyData.buyerCurrentOffer.incoterms?.selectedIncoterm && (
                                    <span className="inline-block text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded mt-1">
                                        {historyData.buyerCurrentOffer.incoterms.selectedIncoterm}
                                    </span>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No offer yet</p>
                        )}
                    </div>

                    {/* Seller's Current Offer */}
                    <div className="p-3 bg-white border border-purple-100 rounded-xl">
                        <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-purple-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">Seller</span>
                        </div>
                        {historyData.sellerCurrentOffer.price ? (
                            <>
                                <p className="text-lg font-bold text-gray-900">
                                    {historyData.sellerCurrentOffer.price}
                                </p>
                                {historyData.sellerCurrentOffer.incoterms?.selectedIncoterm && (
                                    <span className="inline-block text-xs px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded mt-1">
                                        {historyData.sellerCurrentOffer.incoterms.selectedIncoterm}
                                    </span>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-400 italic">No counter yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="p-4 max-h-80 overflow-y-auto">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Timeline
                </h4>

                {historyData.history.length === 0 ? (
                    <div className="text-center py-8">
                        <Clock className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No negotiation rounds yet</p>
                        <p className="text-xs text-gray-400 mt-1">Activity will appear here</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" />

                        <div className="space-y-4">
                            {historyData.history.map((entry, index) => {
                                const isBuyer = entry.party === 'buyer';
                                const isLatest = index === historyData.history.length - 1;

                                return (
                                    <div key={index} className="relative pl-12">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-1.5 top-2 w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
                                            isBuyer ? 'bg-blue-500' : 'bg-purple-500'
                                        } ${isLatest ? 'ring-2 ring-offset-2 ring-blue-200' : ''}`}>
                                            <User className="w-3 h-3 text-white" />
                                        </div>

                                        {/* Entry card */}
                                        <div className={`bg-white border rounded-xl p-4 shadow-sm transition-all hover:shadow-md ${
                                            isBuyer ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-purple-500'
                                        } ${isLatest ? 'ring-1 ring-blue-100' : ''}`}>
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                        isBuyer ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                        {entry.party.toUpperCase()}
                                                    </span>
                                                    <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">
                                                        Round {entry.round}
                                                    </span>
                                                    {isLatest && (
                                                        <span className="text-xs font-medium text-green-600 px-2 py-0.5 bg-green-50 rounded-full">
                                                            Latest
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="space-y-2">
                                                {entry.offeredPrice && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                                                            <DollarSign className="w-4 h-4 text-green-600" />
                                                        </div>
                                                        <span className="text-lg font-bold text-gray-900">
                                                            {entry.offeredPrice}
                                                        </span>
                                                        {index > 0 && getPriceChangeIndicator(
                                                            parseFloat(String(entry.offeredPrice).replace(/[^0-9.-]+/g, '')),
                                                            parseFloat(String(historyData.history[index - 1]?.offeredPrice || '0').replace(/[^0-9.-]+/g, ''))
                                                        )}
                                                    </div>
                                                )}

                                                {entry.offeredIncoterms?.selectedIncoterm && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500">Incoterm:</span>
                                                        <span className="inline-block text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded-lg">
                                                            {entry.offeredIncoterms.selectedIncoterm}
                                                        </span>
                                                    </div>
                                                )}

                                                {entry.message && (
                                                    <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-gray-600 italic">"{entry.message}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs text-gray-400">
                                                    {formatDateFull(entry.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - only shown when onClose is provided */}
            {onClose && (
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default NegotiationHistory;
