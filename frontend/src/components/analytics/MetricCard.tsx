import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: LucideIcon;
    iconBgColor?: string;
    iconColor?: string;
    prefix?: string;
    suffix?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    change,
    changeLabel = 'vs last period',
    icon: Icon,
    iconBgColor = 'bg-blue-100',
    iconColor = 'text-blue-600',
    prefix = '',
    suffix = '',
}) => {
    const formatValue = (val: string | number): string => {
        if (typeof val === 'number') {
            if (val >= 1000000) {
                return `${(val / 1000000).toFixed(1)}M`;
            }
            if (val >= 1000) {
                return `${(val / 1000).toFixed(1)}K`;
            }
            return val.toLocaleString();
        }
        return val;
    };

    const getChangeColor = (changeValue: number): string => {
        if (changeValue > 0) return 'text-green-600';
        if (changeValue < 0) return 'text-red-600';
        return 'text-gray-500';
    };

    const getChangeBgColor = (changeValue: number): string => {
        if (changeValue > 0) return 'bg-green-50';
        if (changeValue < 0) return 'bg-red-50';
        return 'bg-gray-50';
    };

    const getChangeIcon = (changeValue: number) => {
        if (changeValue > 0) return TrendingUp;
        if (changeValue < 0) return TrendingDown;
        return Minus;
    };

    const ChangeIcon = change !== undefined ? getChangeIcon(change) : null;

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {Icon && (
                    <div className={`p-2 rounded-lg ${iconBgColor}`}>
                        <Icon className={`h-4 w-4 ${iconColor}`} />
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-bold text-gray-900">
                        {prefix}{formatValue(value)}{suffix}
                    </p>

                    {change !== undefined && (
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getChangeBgColor(change)} ${getChangeColor(change)}`}>
                                {ChangeIcon && <ChangeIcon className="h-3 w-3" />}
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                            <span className="text-xs text-gray-500">{changeLabel}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MetricCard;
