import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface CounterProgressProps {
    currentCount: number;
    maxCount: number;
    isLocked: boolean;
    isBuyer: boolean;
}

/**
 * CounterProgressIndicator
 *
 * Displays the buyer's counter progress with visual indicators.
 * Clean, light design that integrates well with the negotiation page.
 */
const CounterProgressIndicator: React.FC<CounterProgressProps> = ({
    currentCount,
    maxCount,
    isLocked,
    isBuyer
}) => {
    const remaining = maxCount - currentCount;
    const isLastCounter = remaining === 1;
    const isExhausted = remaining <= 0 || isLocked;

    // Progress steps
    const renderProgressSteps = () => {
        const steps = [];
        for (let i = 0; i < maxCount; i++) {
            const isUsed = i < currentCount;
            const isCurrent = i === currentCount - 1;

            steps.push(
                <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center">
                        <div
                            className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                                transition-all duration-300 border-2
                                ${isUsed
                                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white border-gray-200 text-gray-400'
                                }
                                ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                            `}
                        >
                            {isUsed ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                        </div>
                        <span className={`text-xs mt-1.5 font-medium ${isUsed ? 'text-blue-600' : 'text-gray-400'}`}>
                            Counter {i + 1}
                        </span>
                    </div>
                    {i < maxCount - 1 && (
                        <div
                            className={`
                                w-16 h-1 mx-2 rounded-full -mt-5
                                ${i < currentCount - 1 ? 'bg-blue-500' : 'bg-gray-200'}
                            `}
                        />
                    )}
                </div>
            );
        }
        return steps;
    };

    // Final offer state (for seller when negotiation is locked)
    if (isExhausted && !isBuyer) {
        return (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-700">
                            Final Offer Received
                        </h3>
                        <p className="text-sm text-red-600/80">
                            The buyer has used all counter opportunities. You can only Accept or Reject this offer.
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold">
                        FINAL
                    </div>
                </div>
            </div>
        );
    }

    // Last counter warning (for buyer)
    if (isLastCounter && isBuyer) {
        return (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800">Final Counter Opportunity</h3>
                            <p className="text-sm text-amber-600">Your next response will be your last offer</p>
                        </div>
                    </div>
                    <span className="px-4 py-1.5 bg-amber-500 text-white rounded-full text-sm font-bold shadow-lg shadow-amber-500/30">
                        1 Left
                    </span>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                    {renderProgressSteps()}
                </div>
            </div>
        );
    }

    // Normal progress (for buyer)
    if (isBuyer) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-800">Counter Progress</h3>
                        <p className="text-sm text-gray-500">Track your negotiation attempts</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600">{remaining}</span>
                        <span className="text-sm text-gray-500">of {maxCount} remaining</span>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                    {renderProgressSteps()}
                </div>
            </div>
        );
    }

    // Seller view of buyer's progress (not exhausted)
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-gray-800">Buyer's Counter Progress</h3>
                    <p className="text-sm text-gray-500">Buyer has used {currentCount} of {maxCount} counters</p>
                </div>
                <span className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                    {remaining} remaining
                </span>
            </div>
            <div className="flex items-center justify-center gap-2">
                {renderProgressSteps()}
            </div>
        </div>
    );
};

export default CounterProgressIndicator;
