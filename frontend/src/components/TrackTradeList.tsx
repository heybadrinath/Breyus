import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Loader2, Eye, ArrowRight, Clock } from 'lucide-react';
import { getUserTrades, getSellerTrades, Trade, TradePhase } from '../services/trade.service';
import TrackTrade from './TrackTrade';
import { getImageUrl } from '../utils/imageUtils';
import CompanyAvatar from './ui/CompanyAvatar';
import ClickableCompanyName from './ui/ClickableCompanyName';

interface TrackTradeListProps {
    isSeller: boolean;
    initialTradeId?: string | null;
}

const PHASE_LABELS: Record<TradePhase, string> = {
    'PR': 'Purchase Request',
    'SCO': 'Awaiting SCO',
    'ICPO': 'Awaiting ICPO',
    'SPA': 'Awaiting SPA',
    'PAYMENT': 'Awaiting Payment',
    'BOL': 'Awaiting BoL',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
};

const TrackTradeList: React.FC<TrackTradeListProps> = ({ isSeller, initialTradeId }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get tradeId from URL or prop
    const urlTradeId = searchParams.get('tradeId');
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(initialTradeId || urlTradeId || null);

    // Update selectedTradeId when URL changes
    useEffect(() => {
        if (urlTradeId && urlTradeId !== selectedTradeId) {
            setSelectedTradeId(urlTradeId);
        }
    }, [urlTradeId]);

    useEffect(() => {
        fetchTrades();
    }, [isSeller]);

    const fetchTrades = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = isSeller ? await getSellerTrades() : await getUserTrades();
            const allTrades = response.data as Trade[];

            // Filter for accepted trades that are in progress (not rejected, and not just pending negotiation)
            const trackableTrades = allTrades.filter(trade =>
                trade.negotiationStatus === 'accepted' &&
                (trade as any).tradePhase !== 'COMPLETED'
            );

            setTrades(trackableTrades);
        } catch (err: any) {
            setError(err.message || 'Failed to load trades');
        } finally {
            setLoading(false);
        }
    };

    const getPhaseLabel = (trade: Trade): string => {
        const phase = (trade as any).tradePhase as TradePhase || 'PR';
        return PHASE_LABELS[phase] || phase;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading trades...</span>
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

    const handleBackToList = () => {
        setSelectedTradeId(null);
        // Clear tradeId from URL
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('tradeId');
        setSearchParams(newParams, { replace: true });
    };

    const handleSelectTrade = (tradeId: string) => {
        setSelectedTradeId(tradeId);
        // Update URL with tradeId
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tradeId', tradeId);
        setSearchParams(newParams, { replace: true });
    };

    // If a trade is selected, show the full tracking view
    if (selectedTradeId) {
        return (
            <div>
                <button
                    onClick={handleBackToList}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Back to list
                </button>
                <TrackTrade tradeId={selectedTradeId} isSeller={isSeller} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-bold text-gray-800">Track Your Trades</h2>
                <p className="text-sm text-gray-500">
                    {trades.length} active trade{trades.length !== 1 ? 's' : ''} in progress
                </p>
            </div>

            {/* Content */}
            <div className="p-4">
                {trades.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No active trades to track</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Accepted trades will appear here for tracking
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {trades.map((trade) => (
                            <div
                                key={trade._id}
                                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => handleSelectTrade(trade._id)}
                            >
                                {/* Product Image */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {trade.product?.productImages?.[0] ? (
                                        <img
                                            src={getImageUrl(trade.product.productImages[0])}
                                            alt={trade.product.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Trade Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-800 truncate">
                                        {trade.product?.name || 'Unknown Product'}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                        <span>
                                            {trade.quantity} {trade.quantityUnit}
                                        </span>
                                        <span className="text-green-600 font-medium">
                                            {trade.buyerOfferedPrice || trade.product?.price} {trade.product?.currency}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        {isSeller ? (
                                            <>
                                                Buyer:{' '}
                                                <ClickableCompanyName
                                                    companyId={(trade.buyer as any)?.company?._id}
                                                    companyName={(trade.buyer as any)?.company?.companyName || trade.buyer?.mail || 'N/A'}
                                                    className="text-xs"
                                                    viewerRole="seller"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                Seller:{' '}
                                                <ClickableCompanyName
                                                    companyId={(trade.seller as any)?.company?._id}
                                                    companyName={(trade.seller as any)?.company?.companyName || trade.seller?.mail || 'N/A'}
                                                    className="text-xs"
                                                    viewerRole="buyer"
                                                />
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Current Phase */}
                                <div className="flex-shrink-0">
                                    <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                        <Clock className="w-3 h-3" />
                                        {getPhaseLabel(trade)}
                                    </span>
                                </div>

                                {/* Action */}
                                <button
                                    className="p-2 hover:bg-gray-200 rounded-lg flex-shrink-0"
                                    title="Track Trade"
                                >
                                    <Eye className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackTradeList;
