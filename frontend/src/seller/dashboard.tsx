import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter, Line, ResponsiveContainer, ComposedChart } from 'recharts';
import "../seller/css/components.css";
import { PieChart, Pie, Cell, Label, Sector } from 'recharts';
import { getDashboardAnalytics, DashboardAnalyticsData, DailyStoreVisitData, DailySaleData, TaskStatusDistributionData } from "../services/analytics.service"; // Corrected path

type BarGraphDataType = { week: string; storeVisits: number };
type ScatterGraphDataType = { x: number; y: number; date: string; time: string; productName?: string };
type PieChartDataType = { name: string; value: number };

// Bargraph ui element
const Bargraph = ({ data }: { data: BarGraphDataType[] }) => {
  if (!data || data.length === 0) return <p className="text-center p-4">No visit data available for the selected period.</p>;
  return (
    <ResponsiveContainer height={300} width="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis allowDecimals={false} domain={[0, Math.max(...data.map(d => d.storeVisits), 0) + 5]} />
        <Tooltip />
        <Legend />
        <Bar 
          dataKey="storeVisits" 
          fill="#71DE5F" 
          radius={[8, 8, 0, 0]} 
          name="Store Visits"
          animationBegin={0}
          animationDuration={1500}
          isAnimationActive={true}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Scatter graph ui element
const Scattergraph = ({ data }: { data: ScatterGraphDataType[] }) => {
  if (!data || data.length === 0) return <p className="text-center p-4">No sales data available for the selected period.</p>;
  
  const customTooltipFormatter = (value: any, name: string, item: any) => {
    if (item && item.payload) {
      const dataPoint = item.payload as ScatterGraphDataType;
      if (name === 'y') {
        return [
          `Amount: ${dataPoint.y.toFixed(2)}`,
          `Product: ${dataPoint.productName || 'N/A'}`,
          `Date: ${dataPoint.date}`,
          `Time: ${dataPoint.time}`
        ];
      }
    }
    return [value, name];
  };

  return (
    <ResponsiveContainer height={300} width="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name="Day Index" allowDecimals={false} />
        <YAxis type="number" dataKey="y" name="Amount" domain={[0, Math.max(...data.map(d => d.y), 0) + 10]} />
        <Tooltip formatter={customTooltipFormatter} />
        <Legend />
        <Line 
          dataKey="y" 
          type="monotone" 
          stroke="#71DE5F" 
          dot={false} 
          strokeWidth={3} 
          name="Sales Trend"
          animationBegin={0}
          animationDuration={2000}
          isAnimationActive={true}
        />
        <Scatter 
          name="Individual Sales" 
          dataKey="y" 
          fill="#1A8208"
          animationBegin={500}
          animationDuration={1000}
          isAnimationActive={true}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Pie chart ui element
const COLORS = ['#8F85FF', '#B7B1E9', '#71DE5F', '#FFBB28', '#FF8042', '#00C49F'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  // const sx = cx + (outerRadius + 10) * cos;
  // const sy = cy + (outerRadius + 10) * sin;
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
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.name}: ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey + 18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

const PiChart = ({ data }: { data: PieChartDataType[] }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  if (!data || data.length === 0) return <p className="text-center p-4">No task data available for the selected period.</p>;

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
          animationBegin={0}
          animationDuration={1200}
          isAnimationActive={true}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          {data.length > 0 && data[activeIndex] && (
             <Label
                value={`${data[activeIndex].name}`}
                position="centerTop" // Display name above percentage
                fill="#333"
                fontSize={16}
                fontWeight={500}
                dy={-10} // Adjust position slightly
             />
          )}
          {data.length > 0 && data[activeIndex] && (
            <Label
                value={`${(data.reduce((sum, entry) => sum + entry.value, 0) === 0 ? 0 : (data[activeIndex].value / data.reduce((sum, entry) => sum + entry.value, 0) * 100)).toFixed(1)}%`}
                position="centerBottom" // Display percentage below name
                fill="#666"
                fontSize={14}
                dy={10} // Adjust position slightly
            />
          )}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<DashboardAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDashboardAnalytics(days);
        setAnalyticsData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  const transformedBarData: BarGraphDataType[] = analyticsData?.dailyVisits.map((visit: DailyStoreVisitData) => ({
    week: visit.dayName,
    storeVisits: visit.visits,
  })) || [];

  const transformedScatterData: ScatterGraphDataType[] = analyticsData?.dailySales.map((sale: DailySaleData, index: number) => ({
    x: index + 1, 
    y: sale.amount,
    date: sale.date,
    time: sale.time,
    productName: sale.productName
  })) || [];

  const transformedPieData: PieChartDataType[] = analyticsData?.tasksDistribution.map((task: TaskStatusDistributionData) => ({
    name: task.status,
    value: task.count,
  })) || [];

  if (loading) return <div className="p-10 text-center text-xl">Loading analytics dashboard...</div>;
  if (error) return <div className="p-10 text-center text-red-600 text-lg">Error: {error}</div>;
  if (!analyticsData) return <div className="p-10 text-center text-xl">No analytics data to display.</div>

  return (
    <div id="analytics-section" className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-black text-3xl md:text-4xl mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Overview of your store performance for the selected period.</p>
        <div className="my-4">
          <label htmlFor="days-select" className="mr-2 font-medium">Select Period:</label>
          <select 
            id="days-select"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="shadow-xl rounded-lg p-6 bg-white">
            <h2 className="font-bold text-xl mb-1">Store Visits</h2>
            <p className="text-sm text-gray-500 mb-4">Daily visits</p>
            <Bargraph data={transformedBarData} />
          </div>

          <div className="shadow-xl rounded-lg p-6 bg-white">
            <h2 className="font-bold text-xl mb-1">Daily Sales</h2>
            <p className="text-sm text-gray-500 mb-4">Sales trend and individual sales</p>
            <Scattergraph data={transformedScatterData} />
          </div>

          <div className="shadow-xl rounded-lg p-6 bg-white">
            <h2 className="font-bold text-xl mb-1">Tasks Status</h2>
            <p className="text-sm text-gray-500 mb-4">Distribution of task statuses</p>
            <PiChart data={transformedPieData} />
          </div>
      </div>
      {/* Summary statistics boxes can be added here if data is available */}
    </div>
  );
};

export const SellerDashboard = () => {
  return <Analytics />;
};

export default SellerDashboard;