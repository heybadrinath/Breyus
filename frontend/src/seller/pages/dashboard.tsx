import React, { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line, ResponsiveContainer, ComposedChart } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { Eye, ShoppingCart, DollarSign, Users } from 'lucide-react';
import { analyticsService, BarGraphData, ScatterGraphData, PieChartData, CountrySalesData, MetricsData, TimeRange } from '../../services/analytics.service';
import TimeRangeSelector from '../../components/analytics/TimeRangeSelector';
import MetricCard from '../../components/analytics/MetricCard';
import { TryBreyusCoreHeader } from '../../components/Header';

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
const NoSalesData = () => (
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
    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Data Available</h3>
    <p className="text-gray-500 text-center">Start trading to see your analytics here.</p>
  </div>
);

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Bargraph ui element with gradient
const Bargraph = ({ data, loading, error }: { data: BarGraphData[], loading: boolean, error: string | null }) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data || data.length === 0) return <NoSalesData />;

  return (
    <ResponsiveContainer height={300} width="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.7}/>
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
          domain={[0, Math.max(...data.map(d => d.storeVisits)) + 5]}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Bar
          dataKey="storeVisits"
          name="Store Visits"
          fill="url(#barGradient)"
          radius={[6, 6, 0, 0]}
          maxBarSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Helper to get currency symbol
const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'JPY': return '¥';
    default: return '$';
  }
};

// Revenue trend chart - uses date labels on X-axis
const Scattergraph = ({ data, loading, error, currency = 'USD' }: { data: ScatterGraphData[], loading: boolean, error: string | null, currency?: string }) => {
  const currencySymbol = getCurrencySymbol(currency);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data || data.length === 0) return <NoSalesData />;

  // Calculate if all values are zero (no revenue data yet)
  const hasData = data.some(d => d.y > 0);
  const maxY = Math.max(...data.map(d => d.y), 100); // Min 100 for scale

  // Smart Y-axis domain to handle spikes: use percentile-based max if there's a huge outlier
  const sortedValues = [...data.map(d => d.y)].sort((a, b) => a - b);
  const p90 = sortedValues[Math.floor(sortedValues.length * 0.9)] || maxY;
  const usePercentileCap = maxY > p90 * 5 && p90 > 0; // If max is 5x the 90th percentile
  const yDomainMax = usePercentileCap ? Math.ceil(maxY * 1.1) : Math.ceil(maxY * 1.2);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-8">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
          <DollarSign className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Revenue Yet</h3>
        <p className="text-gray-500 text-center text-sm max-w-xs">
          Complete trades to see your revenue trends here. Revenue is calculated from completed sales.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer height={300} width="100%">
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
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
          domain={[0, yDomainMax]}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => value >= 1000 ? `${currencySymbol}${(value / 1000).toFixed(0)}K` : `${currencySymbol}${value}`}
          width={70}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
                  <p className="text-sm text-blue-600">
                    Revenue: <span className="font-semibold">{currencySymbol}{payload[0].value?.toLocaleString()}</span>
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="y"
          name="Revenue"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Pie chart ui element - shows new vs returning customers
const COLORS = ['#6366f1', '#a5b4fc'];

const PiChart = ({ data, loading, error }: { data: PieChartData[], loading: boolean, error: string | null }) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data || data.length === 0) return <NoSalesData />;

  // Check if there's real customer data (not just the default 1:1 placeholder)
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasRealData = !(data.length === 2 && data[0].value === 1 && data[1].value === 1);

  if (!hasRealData) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-lg p-8">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Customers Yet</h3>
        <p className="text-gray-500 text-center text-sm max-w-xs">
          When buyers engage with your products, you'll see the distribution of new vs returning customers here.
        </p>
      </div>
    );
  }

  // Custom label renderer that fits within chart bounds
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for tiny slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col h-[300px]">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            labelLine={false}
            label={renderCustomizedLabel}
            stroke="#fff"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value} (${((value / total) * 100).toFixed(1)}%)`,
              props.payload.category
            ]}
            contentStyle={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend below chart for clarity */}
      <div className="flex justify-center gap-6 mt-2">
        {data.map((entry, index) => (
          <div key={entry.category} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-gray-600">
              {entry.category}: <span className="font-medium">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Analytics = () => {
  const [barData, setBarData] = useState<BarGraphData[]>([]);
  const [scatterData, setScatterData] = useState<ScatterGraphData[]>([]);
  const [pieData, setPieData] = useState<PieChartData[]>([]);
  const [countrySalesData, setCountrySalesData] = useState<CountrySalesData[]>([]);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const fetchData = useCallback(async (range: TimeRange) => {
    try {
      setLoading(true);
      setError(null);
      const params = { range };
      const [bar, scatter, pie, country, metricsData] = await Promise.all([
        analyticsService.getBarGraphData(params),
        analyticsService.getScatterGraphData(params),
        analyticsService.getPieChartData(params),
        analyticsService.getCountrySalesData(params),
        analyticsService.getMetricsData(params)
      ]);

      setBarData(bar || []);
      setScatterData(scatter || []);
      setPieData(pie || []);
      setCountrySalesData(country || []);
      setMetrics(metricsData || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
      console.error('Error fetching analytics:', err);
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

  return (
    <>
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
        <TryBreyusCoreHeader />
      </div>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div id="analytics-section" className="max-w-[1600px] mx-auto">
          <div className="px-4 md:px-10 py-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics</h1>
              <p className="text-gray-500 mt-1">Track your sales, revenue, and customer metrics</p>
            </div>
            <div className="mt-4 md:mt-0">
              <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 px-4 md:px-10 mb-8">
            <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6
                            border border-white/50 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]
                            hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)]
                            transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="font-bold text-lg text-gray-800 mb-1">Store Visits</h2>
                <p className="text-sm text-gray-500 mb-6">Visits over selected period</p>
                <Bargraph data={barData} loading={loading} error={error} />
              </div>
            </div>

            <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6
                            border border-white/50 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]
                            hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)]
                            transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="font-bold text-lg text-gray-800 mb-1">Revenue Trend</h2>
                <p className="text-sm text-gray-500 mb-6">Daily revenue over time</p>
                <Scattergraph data={scatterData} loading={loading} error={error} currency={metrics?.currency || 'USD'} />
              </div>
            </div>

            <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6
                            border border-white/50 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]
                            hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)]
                            transition-all duration-300 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="font-bold text-lg text-gray-800 mb-1">Customer Distribution</h2>
                <p className="text-sm text-gray-500 mb-6">New vs returning customers</p>
                <PiChart data={pieData} loading={loading} error={error} />
              </div>
            </div>
          </div>

          {/* Metrics Cards Section */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4 md:px-10 mb-8">
          <MetricCard
            title="Website Views"
            value={metrics?.totalVisits || 0}
            change={metrics?.comparison?.visitsChange}
            changeLabel={getChangeLabel(timeRange)}
            icon={Eye}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <MetricCard
            title="Total Sales"
            value={metrics?.totalSales || 0}
            change={metrics?.comparison?.salesChange}
            changeLabel={getChangeLabel(timeRange)}
            icon={ShoppingCart}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <MetricCard
            title="Revenue"
            value={metrics?.totalRevenue || 0}
            change={metrics?.comparison?.revenueChange}
            changeLabel={getChangeLabel(timeRange)}
            icon={DollarSign}
            iconBgColor="bg-purple-100"
            iconColor="text-purple-600"
            prefix={getCurrencySymbol(metrics?.currency || 'USD')}
          />
          <MetricCard
            title="Customers"
            value={metrics?.totalCustomers || 0}
            change={metrics?.comparison?.customersChange}
            changeLabel={getChangeLabel(timeRange)}
            icon={Users}
            iconBgColor="bg-orange-100"
            iconColor="text-orange-600"
          />
          </div>
          )}

          {/* Sales by country */}
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 mx-4 md:mx-10 mb-8
                          border border-white/50 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)]
                          hover:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)]
                          transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Sales by Country</h2>
                  <p className="text-sm text-gray-500 mt-1">Buyer country distribution</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 shadow-sm">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                </div>
              </div>
              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <ErrorMessage message={error} />
              ) : !countrySalesData || countrySalesData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-600">No country data available</p>
                  <p className="text-sm mt-1 text-gray-400">Complete some trades to see buyer country distribution.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-white/50 backdrop-blur-sm">
                      <tr className="border-b border-gray-100">
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {countrySalesData.map((country, index) => (
                        <tr
                          key={index}
                          className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent
                                     transition-all duration-200 ease-out"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={country.flag}
                                alt={country.country}
                                className="w-8 h-5 rounded shadow-sm object-cover ring-1 ring-gray-100
                                           group-hover:scale-110 transition-transform duration-200"
                              />
                              <span className="font-medium text-gray-800 group-hover:text-gray-900 transition-colors">
                                {country.country}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-semibold text-gray-700 tabular-nums">
                              {country.sales.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-medium text-gray-600 tabular-nums">
                              {country.value}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
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
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const SellerDashboard = () => {
  return <Analytics />;
};

export default SellerDashboard;
