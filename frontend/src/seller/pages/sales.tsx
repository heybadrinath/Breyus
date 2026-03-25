import React, { useEffect, useState, useCallback } from "react";
import { TryBreyusCoreHeader } from "../../components/Header";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    AreaChart,
    Area,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    BarChart,
    Bar
} from "recharts";
import { Download, FileText, ShoppingCart, DollarSign, Users, TrendingUp, Package } from 'lucide-react';
import {
    analyticsService,
    SalesMetricsData,
    TopProductData,
    TimeSeriesData,
    CountrySalesData,
    TimeRange
} from '../../services/analytics.service';
import TimeRangeSelector from '../../components/analytics/TimeRangeSelector';
import MetricCard from '../../components/analytics/MetricCard';

// Loading component
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600">Loading data...</p>
    </div>
);

// Error component
const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg p-8">
        <svg
            className="w-16 h-16 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
        <h3 className="text-xl font-semibold text-red-600 mb-2">Error</h3>
        <p className="text-gray-600 text-center">{message}</p>
    </div>
);

// No data component
const NoDataMessage = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg p-8">
        <svg
            className="w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
        </svg>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">{title}</h3>
        <p className="text-gray-500 text-center">{subtitle}</p>
    </div>
);

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, currency }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: <span className="font-semibold">
                            {entry.name === 'Revenue' ? `${currency}${entry.value.toLocaleString()}` : entry.value.toLocaleString()}
                        </span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Revenue Line Chart Component with smart Y-axis scaling
interface RevenueLineChartProps {
    data: TimeSeriesData[];
    loading: boolean;
    error: string | null;
    currency: string;
}

const RevenueLineChart: React.FC<RevenueLineChartProps> = ({ data, loading, error, currency }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!data || data.length === 0) return <NoDataMessage title="No Revenue Data" subtitle="Complete some trades to see revenue trends." />;

    // Check if there's any actual revenue data
    const hasRevenue = data.some(d => d.revenue > 0);
    const revenues = data.map(d => d.revenue);
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues.filter(r => r > 0), 0);

    // Smart domain calculation: handle outliers gracefully
    // If max is more than 10x median non-zero value, use log-friendly scale
    const nonZeroRevenues = revenues.filter(r => r > 0).sort((a, b) => a - b);
    const medianRevenue = nonZeroRevenues.length > 0
        ? nonZeroRevenues[Math.floor(nonZeroRevenues.length / 2)]
        : maxRevenue;

    // Calculate a reasonable Y-axis max that shows variation
    let yMax = maxRevenue * 1.1;
    if (maxRevenue > medianRevenue * 10 && medianRevenue > 0) {
        // There's a huge spike - still show it but note in subtitle
        yMax = maxRevenue * 1.1;
    }
    if (yMax < 100) yMax = 100; // Minimum scale

    if (!hasRevenue) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-lg text-gray-800 mb-1">Revenue Trend</h2>
                <p className="text-sm text-gray-500 mb-6">Revenue over selected period</p>
                <div className="flex flex-col items-center justify-center h-[240px] bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-lg">
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                        <DollarSign className="w-7 h-7 text-purple-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-1">No Revenue Yet</h3>
                    <p className="text-gray-500 text-center text-sm max-w-xs">
                        Complete trades to start tracking revenue. Only completed sales contribute to this chart.
                    </p>
                </div>
            </div>
        );
    }

    const formatYAxis = (value: number): string => {
        if (value >= 1000000) return `${currency}${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${currency}${(value / 1000).toFixed(0)}K`;
        return `${currency}${value}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-1">Revenue Trend</h2>
            <p className="text-sm text-gray-500 mb-6">
                Revenue over selected period
                {maxRevenue > medianRevenue * 10 && medianRevenue > 0 && (
                    <span className="ml-2 text-xs text-purple-600">(includes {formatYAxis(maxRevenue)} peak)</span>
                )}
            </p>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, yMax]}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatYAxis}
                        width={70}
                    />
                    <Tooltip content={<CustomTooltip currency={currency} />} />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#8884d8"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#8884d8', stroke: '#fff', strokeWidth: 1 }}
                        activeDot={{ r: 6, fill: '#8884d8', stroke: '#fff', strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// Volume Area Chart Component with smart Y-axis scaling
interface VolumeAreaChartProps {
    data: TimeSeriesData[];
    loading: boolean;
    error: string | null;
}

const VolumeAreaChart: React.FC<VolumeAreaChartProps> = ({ data, loading, error }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!data || data.length === 0) return <NoDataMessage title="No Volume Data" subtitle="Complete some trades to see volume trends." />;

    // Check if there's any actual volume data
    const hasVolume = data.some(d => d.volume > 0);
    const volumes = data.map(d => d.volume);
    const maxVolume = Math.max(...volumes);

    // Smart domain calculation similar to revenue chart
    const nonZeroVolumes = volumes.filter(v => v > 0).sort((a, b) => a - b);
    const medianVolume = nonZeroVolumes.length > 0
        ? nonZeroVolumes[Math.floor(nonZeroVolumes.length / 2)]
        : maxVolume;

    let yMax = maxVolume * 1.1;
    if (yMax < 10) yMax = 10; // Minimum scale for volume

    if (!hasVolume) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-lg text-gray-800 mb-1">Volume Trend</h2>
                <p className="text-sm text-gray-500 mb-6">Trade volume over selected period</p>
                <div className="flex flex-col items-center justify-center h-[240px] bg-gradient-to-br from-gray-50 to-green-50/30 rounded-lg">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                        <Package className="w-7 h-7 text-green-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-1">No Volume Yet</h3>
                    <p className="text-gray-500 text-center text-sm max-w-xs">
                        Complete trades to start tracking volume. This shows quantity of goods traded over time.
                    </p>
                </div>
            </div>
        );
    }

    const formatYAxis = (value: number): string => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-1">Volume Trend</h2>
            <p className="text-sm text-gray-500 mb-6">
                Trade volume over selected period
                {maxVolume > medianVolume * 10 && medianVolume > 0 && (
                    <span className="ml-2 text-xs text-green-600">(includes {formatYAxis(maxVolume)} peak)</span>
                )}
            </p>
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, yMax]}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatYAxis}
                        width={50}
                    />
                    <Tooltip
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
                                        <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
                                        <p className="text-sm text-green-600">
                                            Volume: <span className="font-semibold">{payload[0].value?.toLocaleString()} units</span>
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="volume"
                        name="Volume"
                        stroke="#82ca9d"
                        fill="url(#volumeGradient)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#82ca9d', stroke: '#fff', strokeWidth: 1 }}
                        activeDot={{ r: 6, fill: '#82ca9d', stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// Top Products Chart Component - uses bar chart for 1-2 products, radar for 3+
interface TopProductsRadarChartProps {
    data: TopProductData[];
    loading: boolean;
    error: string | null;
}

const TopProductsRadarChart: React.FC<TopProductsRadarChartProps> = ({ data, loading, error }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
                <h2 className="font-bold text-lg text-gray-800 mb-1">Top Products</h2>
                <p className="text-sm text-gray-500 mb-4">Products by trade count</p>
                <div className="flex flex-col items-center justify-center h-[240px] bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-lg">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                        <Package className="w-7 h-7 text-indigo-500" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-1">No Product Data</h3>
                    <p className="text-gray-500 text-center text-sm max-w-xs">
                        Complete trades to see which products perform best. This helps identify your top sellers.
                    </p>
                </div>
            </div>
        );
    }

    // Transform data for chart
    const chartData = data.map(product => ({
        product: product.productName.length > 20 ? product.productName.substring(0, 18) + '...' : product.productName,
        fullName: product.productName,
        tradeCount: product.tradeCount,
        totalValue: product.totalValue,
    }));

    const maxTrades = Math.max(...chartData.map(d => d.tradeCount));

    // Use horizontal bar chart for 1-2 products (radar looks bad with few points)
    if (data.length < 3) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
                <h2 className="font-bold text-lg text-gray-800 mb-1">Top Products</h2>
                <p className="text-sm text-gray-500 mb-4">Products by trade count</p>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                        <XAxis
                            type="number"
                            domain={[0, Math.max(maxTrades * 1.2, 5)]}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="product"
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            width={100}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                            formatter={(value: number, name: string, props: any) => [
                                `${value} trades`,
                                props.payload.fullName
                            ]}
                            labelFormatter={(label) => ''}
                        />
                        <Bar
                            dataKey="tradeCount"
                            fill="#8884d8"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
                {data.length === 1 && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                        Trade more products to see comparison
                    </p>
                )}
            </div>
        );
    }

    // Use radar chart for 3+ products
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="font-bold text-lg text-gray-800 mb-1">Top Products</h2>
            <p className="text-sm text-gray-500 mb-4">Products by trade count</p>
            <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                        dataKey="product"
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, maxTrades * 1.2]}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                    />
                    <Radar
                        name="Trade Count"
                        dataKey="tradeCount"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.5}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        formatter={(value: number, name: string, props: any) => [
                            `${value} trades`,
                            props.payload.fullName
                        ]}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

// Country Sales Table Component
interface CountryTableProps {
    data: CountrySalesData[];
    loading: boolean;
    error: string | null;
}

const CountryTable: React.FC<CountryTableProps> = ({ data, loading, error }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                </div>
                <p className="font-medium text-gray-600">No country data available</p>
                <p className="text-sm mt-1 text-gray-400">Complete some trades to see delivery destinations.</p>
            </div>
        );
    }

    return (
        <div className="overflow-y-auto max-h-80 scrollbar-thin">
            <table className="w-full text-left">
                <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                    <tr className="border-b border-gray-100">
                        <th className="pb-3 pt-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</th>
                        <th className="pb-3 pt-1 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales</th>
                        <th className="pb-3 pt-1 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="pb-3 pt-1 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Share</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.map((country, index) => (
                        <tr
                            key={index}
                            className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent
                                       transition-all duration-200 ease-out"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <td className="py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            src={country.flag}
                                            alt={country.country}
                                            className="w-8 h-5 rounded shadow-sm object-cover ring-1 ring-gray-100
                                                       group-hover:scale-110 transition-transform duration-200"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <span className="font-medium text-gray-800 group-hover:text-gray-900 transition-colors">
                                        {country.country}
                                    </span>
                                </div>
                            </td>
                            <td className="py-3.5 text-right">
                                <span className="font-semibold text-gray-700 tabular-nums">
                                    {country.sales.toLocaleString()}
                                </span>
                            </td>
                            <td className="py-3.5 text-right">
                                <span className="font-medium text-gray-600 tabular-nums">
                                    {country.value}
                                </span>
                            </td>
                            <td className="py-3.5 text-right">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                                                 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700
                                                 backdrop-blur-sm border border-blue-100/50
                                                 group-hover:from-blue-500/20 group-hover:to-indigo-500/20
                                                 transition-all duration-200">
                                    {country.percentage}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Export Buttons Component
interface ExportButtonsProps {
    timeRange: TimeRange;
    loading: boolean;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ timeRange, loading }) => {
    const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

    const handleExportCsv = async () => {
        setExporting('csv');
        try {
            const blob = await analyticsService.exportCsv({ range: timeRange });
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `breyus-analytics-${timeRange}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error exporting CSV:', error);
        } finally {
            setExporting(null);
        }
    };

    const handleExportPdf = async () => {
        setExporting('pdf');
        try {
            const html = await analyticsService.exportPdf({ range: timeRange });
            if (html) {
                // Open in new window for printing
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    printWindow.focus();
                    // Give the window time to render before printing
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                }
            }
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleExportCsv}
                disabled={loading || exporting !== null}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                    {exporting === 'csv' ? 'Exporting...' : 'CSV'}
                </span>
            </button>
            <button
                onClick={handleExportPdf}
                disabled={loading || exporting !== null}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                    {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
                </span>
            </button>
        </div>
    );
};

// Main Sales Page Component
const Sales = () => {
    const [salesMetrics, setSalesMetrics] = useState<SalesMetricsData | null>(null);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
    const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
    const [countrySalesData, setCountrySalesData] = useState<CountrySalesData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');

    const fetchData = useCallback(async (range: TimeRange) => {
        try {
            setLoading(true);
            setError(null);
            const params = { range };

            const [metrics, timeSeries, products, countries] = await Promise.all([
                analyticsService.getSalesMetrics(params),
                analyticsService.getTimeSeries(params),
                analyticsService.getTopProducts(params),
                analyticsService.getCountrySalesData(params),
            ]);

            setSalesMetrics(metrics);
            setTimeSeriesData(timeSeries || []);
            setTopProducts(products || []);
            setCountrySalesData(countries || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch sales data');
            console.error('Error fetching sales data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(timeRange);
    }, [timeRange, fetchData]);

    const handleTimeRangeChange = (range: TimeRange) => {
        setTimeRange(range);
    };

    const getChangeLabel = (range: TimeRange): string => {
        switch (range) {
            case '7d': return 'vs previous week';
            case '30d': return 'vs previous month';
            case '90d': return 'vs previous quarter';
            case '1y': return 'vs previous year';
            default: return 'vs previous period';
        }
    };

    const getCurrencySymbol = (currency: string): string => {
        switch (currency) {
            case 'INR': return '₹';
            case 'EUR': return '€';
            case 'GBP': return '£';
            default: return '$';
        }
    };

    const currencySymbol = salesMetrics ? getCurrencySymbol(salesMetrics.currency) : '$';

    return (
        <>
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
                <TryBreyusCoreHeader />
            </div>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
                <div className="flex flex-col p-4 md:p-8 max-w-[1600px] mx-auto">
                    {/* Header with Time Range and Export */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales</h1>
                            <p className="text-gray-500 mt-1">Track your sales performance, revenue, and customer metrics</p>
                        </div>
                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                            <ExportButtons timeRange={timeRange} loading={loading} />
                            <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
                        </div>
                    </div>

                    {/* Metrics Cards */}
                    {!loading && !error && salesMetrics && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                        <MetricCard
                            title="Total Sales"
                            value={salesMetrics.totalSales}
                            change={salesMetrics.comparison.salesChange}
                            changeLabel={getChangeLabel(timeRange)}
                            icon={ShoppingCart}
                            iconBgColor="bg-blue-100"
                            iconColor="text-blue-600"
                        />
                        <MetricCard
                            title="Total Revenue"
                            value={salesMetrics.totalRevenue}
                            change={salesMetrics.comparison.revenueChange}
                            changeLabel={getChangeLabel(timeRange)}
                            icon={DollarSign}
                            iconBgColor="bg-green-100"
                            iconColor="text-green-600"
                            prefix={currencySymbol}
                        />
                        <MetricCard
                            title="Average Order Value"
                            value={salesMetrics.averageOrderValue}
                            change={salesMetrics.comparison.averageOrderChange}
                            changeLabel={getChangeLabel(timeRange)}
                            icon={TrendingUp}
                            iconBgColor="bg-purple-100"
                            iconColor="text-purple-600"
                            prefix={currencySymbol}
                        />
                        <MetricCard
                            title="Total Customers"
                            value={salesMetrics.totalCustomers}
                            change={salesMetrics.comparison.customersChange}
                            changeLabel={getChangeLabel(timeRange)}
                            icon={Users}
                            iconBgColor="bg-orange-100"
                            iconColor="text-orange-600"
                        />
                    </div>
                )}

                {/* Secondary Metrics */}
                {!loading && !error && salesMetrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                        <MetricCard
                            title="Total Volume"
                            value={salesMetrics.totalVolume}
                            change={salesMetrics.comparison.volumeChange}
                            changeLabel={getChangeLabel(timeRange)}
                            icon={Package}
                            iconBgColor="bg-cyan-100"
                            iconColor="text-cyan-600"
                        />
                        <MetricCard
                            title="New Customers"
                            value={salesMetrics.newCustomers}
                            icon={Users}
                            iconBgColor="bg-emerald-100"
                            iconColor="text-emerald-600"
                        />
                        <MetricCard
                            title="Returning Customers"
                            value={salesMetrics.returningCustomers}
                            icon={Users}
                            iconBgColor="bg-indigo-100"
                            iconColor="text-indigo-600"
                        />
                    </div>
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <RevenueLineChart
                        data={timeSeriesData}
                        loading={loading}
                        error={error}
                        currency={currencySymbol}
                    />
                    <VolumeAreaChart
                        data={timeSeriesData}
                        loading={loading}
                        error={error}
                    />
                </div>

                {/* Country Sales and Radar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl
                                    border border-white/50 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]
                                    p-6 overflow-hidden group hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)]
                                    transition-all duration-300">
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="font-bold text-lg text-gray-800">Sales by Country</h2>
                                    <p className="text-sm text-gray-500">Delivery destinations for your trades</p>
                                </div>
                                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                                    </svg>
                                </div>
                            </div>
                            <CountryTable
                                data={countrySalesData}
                                loading={loading}
                                error={error}
                            />
                        </div>
                    </div>
                    <TopProductsRadarChart
                        data={topProducts}
                        loading={loading}
                        error={error}
                    />
                </div>
            </div>
            </div>
        </>
    );
};

export default Sales;
