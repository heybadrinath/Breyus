import React from 'react';
import { Check, Circle, FileText, Package, ScrollText, Ship } from 'lucide-react';

export type TradeStage = 'PR' | 'PO' | 'SPA' | 'BOL' | 'COMPLETED';

interface HorizontalTradeProgressProps {
    currentStage: TradeStage;
    completedStages?: TradeStage[];
    size?: 'sm' | 'md' | 'lg';
    showLabels?: boolean;
    className?: string;
}

interface StageInfo {
    key: TradeStage;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ReactNode;
}

const stages: StageInfo[] = [
    {
        key: 'PR',
        label: 'Purchase Request',
        shortLabel: 'PR',
        description: 'Request submitted',
        icon: <FileText className="w-4 h-4" />
    },
    {
        key: 'PO',
        label: 'Purchase Order',
        shortLabel: 'PO',
        description: 'Order confirmed',
        icon: <Package className="w-4 h-4" />
    },
    {
        key: 'SPA',
        label: 'Sales Agreement',
        shortLabel: 'SPA',
        description: 'Agreement signed',
        icon: <ScrollText className="w-4 h-4" />
    },
    {
        key: 'BOL',
        label: 'Bill of Lading',
        shortLabel: 'BoL',
        description: 'Shipment released',
        icon: <Ship className="w-4 h-4" />
    }
];

const stageOrder: Record<TradeStage, number> = {
    'PR': 0,
    'PO': 1,
    'SPA': 2,
    'BOL': 3,
    'COMPLETED': 4
};

export const HorizontalTradeProgress: React.FC<HorizontalTradeProgressProps> = ({
    currentStage,
    completedStages = [],
    size = 'md',
    showLabels = true,
    className = ''
}) => {
    const currentIndex = stageOrder[currentStage];

    const isStageCompleted = (stage: TradeStage) => {
        return completedStages.includes(stage) || stageOrder[stage] < currentIndex;
    };

    const isCurrentStage = (stage: TradeStage) => {
        return stageOrder[stage] === currentIndex && currentStage !== 'COMPLETED';
    };

    const isPendingStage = (stage: TradeStage) => {
        return stageOrder[stage] > currentIndex;
    };

    const sizeClasses = {
        sm: {
            circle: 'w-6 h-6',
            icon: 'w-3 h-3',
            text: 'text-xs',
            gap: 'gap-1'
        },
        md: {
            circle: 'w-10 h-10',
            icon: 'w-4 h-4',
            text: 'text-sm',
            gap: 'gap-2'
        },
        lg: {
            circle: 'w-12 h-12',
            icon: 'w-5 h-5',
            text: 'text-base',
            gap: 'gap-3'
        }
    };

    const sizes = sizeClasses[size];

    return (
        <div className={`w-full ${className}`}>
            <div className="flex items-center justify-between relative">
                {/* Connecting Line (background) */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" style={{ left: '10%', right: '10%' }} />

                {/* Connecting Line (progress) */}
                <div
                    className="absolute top-1/2 h-0.5 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500"
                    style={{
                        left: '10%',
                        width: currentStage === 'COMPLETED'
                            ? '80%'
                            : `${Math.max(0, (currentIndex / (stages.length - 1)) * 80)}%`
                    }}
                />

                {/* Stage Circles */}
                {stages.map((stage, index) => {
                    const completed = isStageCompleted(stage.key);
                    const current = isCurrentStage(stage.key);
                    const pending = isPendingStage(stage.key);

                    return (
                        <div
                            key={stage.key}
                            className={`flex flex-col items-center z-10 ${sizes.gap}`}
                        >
                            {/* Circle */}
                            <div
                                className={`
                                    ${sizes.circle} rounded-full flex items-center justify-center
                                    transition-all duration-300 border-2
                                    ${completed
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : current
                                            ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                                            : 'bg-white border-gray-300 text-gray-400'
                                    }
                                `}
                            >
                                {completed ? (
                                    <Check className={sizes.icon} />
                                ) : (
                                    stage.icon
                                )}
                            </div>

                            {/* Labels */}
                            {showLabels && (
                                <div className="text-center mt-1">
                                    <p className={`
                                        font-medium ${sizes.text}
                                        ${completed
                                            ? 'text-green-600'
                                            : current
                                                ? 'text-blue-600'
                                                : 'text-gray-400'
                                        }
                                    `}>
                                        {size === 'sm' ? stage.shortLabel : stage.label}
                                    </p>
                                    {size !== 'sm' && (
                                        <p className={`text-xs text-gray-500 mt-0.5`}>
                                            {completed ? 'Completed' : current ? 'In Progress' : 'Pending'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Helper function to determine trade stage from trade phase
export const getTradeStageFromPhase = (tradePhase?: string): TradeStage => {
    switch (tradePhase) {
        case 'PURCHASE_REQUEST':
        case 'NEGOTIATION':
            return 'PR';
        case 'SCO_UPLOADED':
        case 'ICPO_UPLOADED':
        case 'PURCHASE_ORDER':
            return 'PO';
        case 'SPA_UPLOADED':
        case 'SPA_SIGNED':
        case 'PAYMENT_UPLOADED':
            return 'SPA';
        case 'BOL_UPLOADED':
            return 'BOL';
        case 'COMPLETED':
            return 'COMPLETED';
        default:
            return 'PR';
    }
};

// Compact version for table cells or small spaces
export const CompactTradeProgress: React.FC<{
    currentStage: TradeStage;
    className?: string;
}> = ({ currentStage, className = '' }) => {
    const currentIndex = stageOrder[currentStage];

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {stages.map((stage, index) => {
                const completed = stageOrder[stage.key] < currentIndex;
                const current = stageOrder[stage.key] === currentIndex && currentStage !== 'COMPLETED';

                return (
                    <React.Fragment key={stage.key}>
                        {/* Dot */}
                        <div
                            className={`
                                w-2 h-2 rounded-full transition-all
                                ${completed
                                    ? 'bg-green-500'
                                    : current
                                        ? 'bg-blue-500 animate-pulse'
                                        : 'bg-gray-300'
                                }
                            `}
                            title={stage.label}
                        />
                        {/* Connector line */}
                        {index < stages.length - 1 && (
                            <div
                                className={`
                                    w-3 h-0.5
                                    ${completed ? 'bg-green-500' : 'bg-gray-300'}
                                `}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// Vertical version for sidebars
export const VerticalTradeProgress: React.FC<{
    currentStage: TradeStage;
    completedStages?: TradeStage[];
    showDescriptions?: boolean;
    className?: string;
}> = ({ currentStage, completedStages = [], showDescriptions = true, className = '' }) => {
    const currentIndex = stageOrder[currentStage];

    const isStageCompleted = (stage: TradeStage) => {
        return completedStages.includes(stage) || stageOrder[stage] < currentIndex;
    };

    const isCurrentStage = (stage: TradeStage) => {
        return stageOrder[stage] === currentIndex && currentStage !== 'COMPLETED';
    };

    return (
        <div className={`space-y-0 ${className}`}>
            {stages.map((stage, index) => {
                const completed = isStageCompleted(stage.key);
                const current = isCurrentStage(stage.key);

                return (
                    <div key={stage.key} className="relative">
                        {/* Vertical Line */}
                        {index < stages.length - 1 && (
                            <div
                                className={`
                                    absolute left-4 top-8 w-0.5 h-8
                                    ${completed ? 'bg-green-500' : 'bg-gray-200'}
                                `}
                            />
                        )}

                        {/* Stage Row */}
                        <div className="flex items-start gap-3 pb-8">
                            {/* Circle */}
                            <div
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                    border-2 transition-all
                                    ${completed
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : current
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-white border-gray-300 text-gray-400'
                                    }
                                `}
                            >
                                {completed ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    stage.icon
                                )}
                            </div>

                            {/* Text */}
                            <div>
                                <p className={`
                                    font-medium text-sm
                                    ${completed
                                        ? 'text-green-600'
                                        : current
                                            ? 'text-blue-600'
                                            : 'text-gray-500'
                                    }
                                `}>
                                    {stage.label}
                                </p>
                                {showDescriptions && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {completed ? 'Completed' : current ? 'In Progress' : stage.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default HorizontalTradeProgress;
