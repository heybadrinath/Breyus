import React, { useState, useEffect } from 'react';
import { Clock, User, DollarSign, MessageSquare, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { getNegotiationHistory, NegotiationHistoryEntry, NegotiationHistoryResponse } from '../services/trade.service';

interface NegotiationHistoryProps {
    tradeId: string;
    onClose?: () => void;
}

const NegotiationHistory: React.FC<NegotiationHistoryProps> = ({ tradeId, onClose }) => {
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'countered':
                return 'bg-blue-100 text-blue-800';
            case 'buyer_responded':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'accepted':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <ArrowRight className="w-5 h-5 text-blue-600" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500">{error}</p>
                <button
                    onClick={fetchHistory}
                    className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!historyData) {
        return <div className="p-8 text-center text-gray-500">No history available</div>;
    }

    return (
        <div className="bg-white rounded-lg">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">Negotiation History</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(historyData.negotiationStatus)}`}>
                        {historyData.negotiationStatus.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    Round {historyData.currentRound} of negotiation
                </p>
            </div>

            {/* Current Offers Summary */}
            <div className="p-4 bg-gray-50 border-b">
                <div className="grid grid-cols-2 gap-4">
                    {/* Buyer's Current Offer */}
                    <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Buyer's Offer</span>
                        </div>
                        {historyData.buyerCurrentOffer.price ? (
                            <>
                                <p className="text-lg font-bold text-green-600">
                                    {historyData.buyerCurrentOffer.price}
                                </p>
                                {historyData.buyerCurrentOffer.incoterms?.selectedIncoterm && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Incoterm: {historyData.buyerCurrentOffer.incoterms.selectedIncoterm}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">No offer yet</p>
                        )}
                    </div>

                    {/* Seller's Current Offer */}
                    <div className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-gray-700">Seller's Offer</span>
                        </div>
                        {historyData.sellerCurrentOffer.price ? (
                            <>
                                <p className="text-lg font-bold text-green-600">
                                    {historyData.sellerCurrentOffer.price}
                                </p>
                                {historyData.sellerCurrentOffer.incoterms?.selectedIncoterm && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Incoterm: {historyData.sellerCurrentOffer.incoterms.selectedIncoterm}
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm text-gray-400">No counter-offer yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="p-4 max-h-96 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Timeline</h3>

                {historyData.history.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No negotiation rounds yet</p>
                ) : (
                    <div className="space-y-4">
                        {historyData.history.map((entry, index) => (
                            <div
                                key={index}
                                className={`relative pl-8 pb-4 ${
                                    index !== historyData.history.length - 1 ? 'border-l-2 border-gray-200' : ''
                                }`}
                            >
                                {/* Timeline dot */}
                                <div className={`absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full ${
                                    entry.party === 'buyer' ? 'bg-blue-500' : 'bg-purple-500'
                                }`} />

                                {/* Entry card */}
                                <div className={`bg-white rounded-lg border p-4 ml-4 ${
                                    entry.party === 'buyer' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-purple-500'
                                }`}>
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                entry.party === 'buyer' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                                {entry.party.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Round {entry.round}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(entry.timestamp)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-2">
                                        {entry.offeredPrice && (
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-green-500" />
                                                <span className="font-semibold text-green-600">
                                                    {entry.offeredPrice}
                                                </span>
                                            </div>
                                        )}

                                        {entry.offeredIncoterms?.selectedIncoterm && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">Incoterm:</span>{' '}
                                                {entry.offeredIncoterms.selectedIncoterm}
                                            </div>
                                        )}

                                        {entry.message && (
                                            <div className="flex items-start gap-2 mt-2 p-2 bg-gray-50 rounded">
                                                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                                                <p className="text-sm text-gray-600">{entry.message}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {onClose && (
                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default NegotiationHistory;
