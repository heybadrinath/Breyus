import React, { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter, Line, ResponsiveContainer, ComposedChart } from 'recharts';
import { PieChart, Pie, Cell, Label, Sector } from 'recharts';
import { Eye, ShoppingCart, DollarSign, Users } from 'lucide-react';
import { analyticsService, BarGraphData, ScatterGraphData, PieChartData, CountrySalesData, MetricsData, TimeRange } from '../../services/analytics.service';
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

// Scatter graph ui element with area fill
const Scattergraph = ({ data, loading, error }: { data: ScatterGraphData[], loading: boolean, error: string | null }) => {
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data || data.length === 0) return <NoSalesData />;

  const maxY = Math.max(...data.map(d => d.y), 10);

  return (
    <ResponsiveContainer height={300} width="100%">
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          type="number"
          dataKey="x"
          name="Day"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Value"
          domain={[0, maxY + 10]}
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="y"
          name="Revenue"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
        />
        <Scatter name="Data Points" data={data} fill="#1d4ed8" opacity={0.8} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Pie chart ui element
const COLORS = ['#6366f1', '#a5b4fc'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#fff"
        strokeWidth={2}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.category} ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey + 18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const PiChart = ({ data, loading, error }: { data: PieChartData[], loading: boolean, error: string | null }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data || data.length === 0) return <NoSalesData />;

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          onMouseEnter={onPieEnter}
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.7} />
          ))}
          <Label
            value="Customer Distribution"
            position="center"
            fill="#8F85FF"
            fontSize={14}
            fontWeight={500}
          />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
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
    <div id="analytics-section">
      <div className="mx-10 pl-1 pr-10 pb-2 pt-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-black text-4xl">Analytics</h1>
          <p className="text-gray-500">Track your sales, revenue, and customer metrics</p>
        </div>
        <div className="mt-4 md:mt-0">
          <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mx-4 md:mx-10 my-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-800 mb-1">Store Visits</h2>
          <p className="text-sm text-gray-500 mb-6">Visits over selected period</p>
          <Bargraph data={barData} loading={loading} error={error} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-800 mb-1">Revenue Trend</h2>
          <p className="text-sm text-gray-500 mb-6">Daily revenue over time</p>
          <Scattergraph data={scatterData} loading={loading} error={error} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-800 mb-1">Customer Distribution</h2>
          <p className="text-sm text-gray-500 mb-6">New vs returning customers</p>
          <PiChart data={pieData} loading={loading} error={error} />
        </div>
      </div>

      {/* Metrics Cards Section */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mx-4 md:mx-10 my-8">
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
            prefix="$"
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
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 m-4 md:m-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Sales by Country</h2>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : !countrySalesData || countrySalesData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No country data available for the selected period.</p>
            <p className="text-sm mt-2">Complete some trades to see buyer country distribution.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Country</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600">Sales</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600">Value</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600">Share</th>
                </tr>
              </thead>
              <tbody>
                {countrySalesData.map((country, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={country.flag}
                          alt={country.country}
                          className="w-8 h-5 rounded shadow-sm object-cover"
                        />
                        <span className="font-medium text-gray-800">{country.country}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{country.sales.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{country.value}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
  );
};

const SellerDashboard = () => {
  return <Analytics />;
};

export default SellerDashboard;
