import React, { useState } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';
import { cancelTrade, TradePhase } from '../services/trade.service';

interface TradeCancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    tradeId: string;
    tradePhase: TradePhase;
    productName: string;
    onCancelled: () => void;
}

export const TradeCancellationModal: React.FC<TradeCancellationModalProps> = ({
    isOpen,
    onClose,
    tradeId,
    tradePhase,
    productName,
    onCancelled,
}) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Determine if reason is required based on trade phase
    const requiresReason = tradePhase === 'SCO';
    const canCancel = ['PR', 'SCO'].includes(tradePhase);

    const handleCancel = async () => {
        if (requiresReason && !reason.trim()) {
            setError('A cancellation reason is required at this stage');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await cancelTrade(tradeId, reason || undefined);
            onCancelled();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to cancel trade');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <h2 className="text-lg font-semibold text-gray-800">Cancel Trade</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isLoading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {!canCancel ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-700 font-medium">Cannot Cancel Trade</p>
                            <p className="text-red-600 text-sm mt-1">
                                This trade has progressed beyond the cancellation stage.
                                Please contact support if you need assistance.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600">
                                Are you sure you want to cancel the trade for{' '}
                                <span className="font-semibold">{productName}</span>?
                            </p>

                            {/* Phase-specific messaging */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex gap-2">
                                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-blue-700 text-sm">
                                            {tradePhase === 'PR' ? (
                                                'This trade is in the negotiation phase. You can cancel freely without penalty.'
                                            ) : tradePhase === 'SCO' ? (
                                                'This trade has been accepted and SCO has been uploaded. A reason for cancellation is required.'
                                            ) : (
                                                'Trade cancellation information.'
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Reason input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for cancellation
                                    {requiresReason && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter your reason for cancellation..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                    maxLength={500}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500 mt-1 text-right">
                                    {reason.length}/500 characters
                                </p>
                            </div>

                            {/* Warning */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <p className="text-orange-700 text-sm">
                                    <strong>Warning:</strong> This action cannot be undone. The other party will be notified of the cancellation.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        {canCancel ? 'Keep Trade' : 'Close'}
                    </button>
                    {canCancel && (
                        <button
                            onClick={handleCancel}
                            disabled={isLoading || (requiresReason && !reason.trim())}
                            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Cancelling...
                                </>
                            ) : (
                                'Cancel Trade'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TradeCancellationModal;
