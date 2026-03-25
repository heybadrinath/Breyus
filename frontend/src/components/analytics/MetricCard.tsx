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

// Detect accent color from iconBgColor prop for gradient
const getGradientClass = (iconBgColor?: string): string => {
    if (!iconBgColor) return 'from-blue-500/8 to-transparent';
    if (iconBgColor.includes('blue')) return 'from-blue-500/8 to-transparent';
    if (iconBgColor.includes('green')) return 'from-green-500/8 to-transparent';
    if (iconBgColor.includes('purple')) return 'from-purple-500/8 to-transparent';
    if (iconBgColor.includes('orange')) return 'from-orange-500/8 to-transparent';
    if (iconBgColor.includes('cyan')) return 'from-cyan-500/8 to-transparent';
    if (iconBgColor.includes('emerald')) return 'from-emerald-500/8 to-transparent';
    if (iconBgColor.includes('indigo')) return 'from-indigo-500/8 to-transparent';
    if (iconBgColor.includes('pink')) return 'from-pink-500/8 to-transparent';
    return 'from-blue-500/8 to-transparent';
};

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
        if (changeValue > 0) return 'text-emerald-600';
        if (changeValue < 0) return 'text-red-500';
        return 'text-gray-500';
    };

    const getChangeBgColor = (changeValue: number): string => {
        if (changeValue > 0) return 'bg-emerald-50';
        if (changeValue < 0) return 'bg-red-50';
        return 'bg-gray-50';
    };

    const getChangeIcon = (changeValue: number) => {
        if (changeValue > 0) return TrendingUp;
        if (changeValue < 0) return TrendingDown;
        return Minus;
    };

    const ChangeIcon = change !== undefined ? getChangeIcon(change) : null;
    const gradientClass = getGradientClass(iconBgColor);

    return (
        <div className="group relative bg-white rounded-2xl p-5
                        border border-gray-100
                        shadow-sm hover:shadow-xl
                        hover:-translate-y-1
                        transition-all duration-300 ease-out
                        overflow-hidden">
            {/* Subtle corner gradient accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradientClass} opacity-50 group-hover:opacity-80 transition-opacity duration-300 rounded-bl-full`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    {Icon && (
                        <div className={`p-2.5 rounded-xl ${iconBgColor}
                                        group-hover:scale-110
                                        transition-transform duration-300 ease-out
                                        shadow-sm`}>
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">
                        {prefix}{formatValue(value)}{suffix}
                    </p>

                    {change !== undefined && (
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                                            ${getChangeBgColor(change)} ${getChangeColor(change)}`}>
                                {ChangeIcon && <ChangeIcon className="h-3.5 w-3.5" />}
                                {change > 0 ? '+' : ''}{change}%
                            </span>
                            <span className="text-xs text-gray-400">{changeLabel}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MetricCard;
