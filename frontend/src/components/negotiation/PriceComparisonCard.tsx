import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight, DollarSign } from 'lucide-react';

interface PriceComparisonProps {
    originalPrice: number | string;
    buyerOffer: number | string | null;
    sellerCounter: number | string | null;
    currency?: string;
    isBuyer: boolean;
}

/**
 * PriceComparisonCard
 *
 * Clean visual comparison of prices showing original, buyer's offer,
 * and seller's counter with percentage differences.
 */
const PriceComparisonCard: React.FC<PriceComparisonProps> = ({
    originalPrice,
    buyerOffer,
    sellerCounter,
    currency = 'INR',
    isBuyer
}) => {
    const parsePrice = (price: number | string | null): number => {
        if (price === null || price === undefined) return 0;
        return typeof price === 'string' ? parseFloat(price) || 0 : price;
    };

    const original = parsePrice(originalPrice);
    const buyer = parsePrice(buyerOffer);
    const seller = parsePrice(sellerCounter);

    const formatPrice = (price: number): string => {
        if (price === 0) return '—';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(price);
    };

    const calculateDiff = (from: number, to: number): number => {
        if (from === 0 || to === 0) return 0;
        return ((to - from) / from) * 100;
    };

    const buyerDiff = calculateDiff(original, buyer);
    const gap = buyer > 0 && seller > 0 ? Math.abs(seller - buyer) : 0;
    const gapPercent = buyer > 0 && seller > 0 ? Math.abs(calculateDiff(buyer, seller)) : 0;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    Price Comparison
                </h4>
            </div>

            <div className="p-5">
                {/* Price Flow */}
                <div className="grid grid-cols-3 gap-3">
                    {/* Listed Price */}
                    <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                            Listed
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                            {formatPrice(original)}
                        </p>
                    </div>

                    {/* Buyer Offer */}
                    <div className={`text-center p-4 rounded-xl border ${
                        isBuyer
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-purple-50 border-purple-200'
                    }`}>
                        <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${
                            isBuyer ? 'text-blue-600' : 'text-purple-600'
                        }`}>
                            {isBuyer ? 'Your Offer' : "Buyer's Offer"}
                        </p>
                        <p className={`text-lg font-bold ${
                            isBuyer ? 'text-blue-700' : 'text-purple-700'
                        }`}>
                            {buyer > 0 ? formatPrice(buyer) : '—'}
                        </p>
                        {buyer > 0 && buyerDiff !== 0 && (
                            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                buyerDiff < 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {buyerDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                {Math.abs(buyerDiff).toFixed(1)}%
                            </div>
                        )}
                    </div>

                    {/* Seller Counter */}
                    <div className={`text-center p-4 rounded-xl border ${
                        !isBuyer
                            ? 'bg-blue-50 border-blue-200'
                            : seller > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'
                    }`}>
                        <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${
                            !isBuyer ? 'text-blue-600' : seller > 0 ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                            {!isBuyer ? 'Your Counter' : "Seller's Counter"}
                        </p>
                        <p className={`text-lg font-bold ${
                            !isBuyer ? 'text-blue-700' : seller > 0 ? 'text-orange-700' : 'text-gray-400'
                        }`}>
                            {seller > 0 ? formatPrice(seller) : '—'}
                        </p>
                    </div>
                </div>

                {/* Gap Analysis */}
                {buyer > 0 && seller > 0 && gap > 0 && (
                    <div className="mt-5 pt-5 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-600 font-medium">Negotiation Gap</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${
                                    gapPercent < 5 ? 'text-green-600' : gapPercent < 15 ? 'text-amber-600' : 'text-red-600'
                                }`}>
                                    {formatPrice(gap)}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    gapPercent < 5
                                        ? 'bg-green-100 text-green-700'
                                        : gapPercent < 15
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-red-100 text-red-700'
                                }`}>
                                    {gapPercent.toFixed(1)}% apart
                                </span>
                            </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                                    gapPercent < 5
                                        ? 'bg-gradient-to-r from-green-400 to-green-500'
                                        : gapPercent < 15
                                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                        : 'bg-gradient-to-r from-red-400 to-red-500'
                                }`}
                                style={{ width: `${Math.max(5, Math.min(100, 100 - gapPercent * 2))}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">
                            {gapPercent < 5 ? '🎉 Almost there!' : gapPercent < 15 ? 'Getting closer...' : 'Keep negotiating'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriceComparisonCard;
