import React, { useEffect, useState, useCallback } from "react";
import { SortHeader } from "../../components/Header";
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
    PolarRadiusAxis
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

// Revenue Line Chart Component
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

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-1">Revenue Trend</h2>
            <p className="text-sm text-gray-500 mb-6">Revenue over selected period</p>
            <ResponsiveContainer width="100%" height={300}>
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
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${currency}${value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`}
                    />
                    <Tooltip content={<CustomTooltip currency={currency} />} />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stroke="#8884d8"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#8884d8' }}
                        activeDot={{ r: 6, fill: '#8884d8', stroke: '#fff', strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// Volume Area Chart Component
interface VolumeAreaChartProps {
    data: TimeSeriesData[];
    loading: boolean;
    error: string | null;
}

const VolumeAreaChart: React.FC<VolumeAreaChartProps> = ({ data, loading, error }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!data || data.length === 0) return <NoDataMessage title="No Volume Data" subtitle="Complete some trades to see volume trends." />;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-1">Volume Trend</h2>
            <p className="text-sm text-gray-500 mb-6">Trade volume over selected period</p>
            <ResponsiveContainer width="100%" height={300}>
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
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString()}
                    />
                    <Tooltip content={<CustomTooltip currency="" />} />
                    <Area
                        type="monotone"
                        dataKey="volume"
                        name="Volume"
                        stroke="#82ca9d"
                        fill="url(#volumeGradient)"
                        strokeWidth={2}
                        activeDot={{ r: 6, fill: '#82ca9d', stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

// Top Products Radar Chart Component
interface TopProductsRadarChartProps {
    data: TopProductData[];
    loading: boolean;
    error: string | null;
}

const TopProductsRadarChart: React.FC<TopProductsRadarChartProps> = ({ data, loading, error }) => {
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} />;
    if (!data || data.length === 0) return <NoDataMessage title="No Product Data" subtitle="Complete some trades to see top products." />;

    // Transform data for radar chart - use trade count as the metric
    const radarData = data.map(product => ({
        product: product.productName.length > 15 ? product.productName.substring(0, 12) + '...' : product.productName,
        fullName: product.productName,
        tradeCount: product.tradeCount,
        totalValue: product.totalValue,
    }));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="font-bold text-lg text-gray-800 mb-1">Top Products</h2>
            <p className="text-sm text-gray-500 mb-4">Products by trade count</p>
            <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                        dataKey="product"
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 'auto']}
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
                        contentStyle={{ borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
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
            <div className="text-center py-8 text-gray-500">
                <p>No country data available for the selected period.</p>
                <p className="text-sm mt-2">Complete some trades to see delivery destinations.</p>
            </div>
        );
    }

    return (
        <div className="overflow-y-auto max-h-80">
            <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                        <th className="pb-3 text-sm font-semibold text-gray-600">Country</th>
                        <th className="pb-3 text-right text-sm font-semibold text-gray-600">Sales</th>
                        <th className="pb-3 text-right text-sm font-semibold text-gray-600">Value</th>
                        <th className="pb-3 text-right text-sm font-semibold text-gray-600">Share</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((country, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={country.flag}
                                        alt={country.country}
                                        className="w-7 h-5 rounded shadow-sm object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                    <span className="font-medium text-gray-800">{country.country}</span>
                                </div>
                            </td>
                            <td className="py-3 text-right text-gray-700">{country.sales.toLocaleString()}</td>
                            <td className="py-3 text-right text-gray-700">{country.value}</td>
                            <td className="py-3 text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
            <SortHeader />
            <div className="flex flex-col p-4 md:p-8">
                {/* Header with Time Range and Export */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <h1 className="font-extrabold text-4xl text-gray-900">Sales</h1>
                        <p className="text-gray-500 mt-1">Track your sales performance, revenue, and customer metrics</p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <ExportButtons timeRange={timeRange} loading={loading} />
                        <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
                    </div>
                </div>

                {/* Metrics Cards */}
                {!loading && !error && salesMetrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-bold text-lg text-gray-800 mb-1">Sales by Country</h2>
                        <p className="text-sm text-gray-500 mb-4">Delivery destinations for your trades</p>
                        <CountryTable
                            data={countrySalesData}
                            loading={loading}
                            error={error}
                        />
                    </div>
                    <TopProductsRadarChart
                        data={topProducts}
                        loading={loading}
                        error={error}
                    />
                </div>
            </div>
        </>
    );
};

export default Sales;
