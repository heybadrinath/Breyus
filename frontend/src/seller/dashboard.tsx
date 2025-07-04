import React, { useEffect, useState } from "react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter, Line, ResponsiveContainer, ComposedChart } from 'recharts';
// import "../seller/css/components.css";
// import { PieChart, Pie, Cell, Label, Sector } from 'recharts';
// import NoSalesData from "./components/NoSalesData";
// import { analyticsService, BarGraphData, ScatterGraphData, PieChartData, CountrySalesData, MetricsData } from './services/analytics.service';

// // Loading component
// const LoadingSpinner = () => (
//   <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg p-8">
//     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
//     <p className="mt-4 text-gray-600">Loading data...</p>
//   </div>
// );

// // Error component
// const ErrorMessage = ({ message }: { message: string }) => (
//   <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 rounded-lg p-8">
//     <svg 
//       className="w-16 h-16 text-red-500 mb-4" 
//       fill="none" 
//       stroke="currentColor" 
//       viewBox="0 0 24 24"
//     >
//       <path 
//         strokeLinecap="round" 
//         strokeLinejoin="round" 
//         strokeWidth={2} 
//         d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
//       />
//     </svg>
//     <h3 className="text-xl font-semibold text-red-600 mb-2">Error</h3>
//     <p className="text-gray-600 text-center">{message}</p>
//   </div>
// );

// // Bargraph ui element
// const Bargraph = ({ data, loading, error }: { data: BarGraphData[], loading: boolean, error: string | null }) => {
//   if (loading) return <LoadingSpinner />;
//   if (error) return <ErrorMessage message={error} />;
//   if (!data || data.length === 0) return <NoSalesData />;

//   return (
//     <ResponsiveContainer height={300} width="100%">
//       <BarChart data={data}>
//         <CartesianGrid strokeDasharray="3 3" />
//         <XAxis dataKey="date" />
//         <YAxis domain={[0, Math.max(...data.map(d => d.storeVisits)) + 5]} />
//         <Tooltip />
//         <Legend />
//         <Bar dataKey="storeVisits" fill="#71DE5F" radius={[8, 8, 0, 0]} />
//       </BarChart>
//     </ResponsiveContainer>
//   );
// };

// // Scatter graph ui element
// const Scattergraph = ({ data, loading, error }: { data: ScatterGraphData[], loading: boolean, error: string | null }) => {
//   if (loading) return <LoadingSpinner />;
//   if (error) return <ErrorMessage message={error} />;
//   if (!data || data.length === 0) return <NoSalesData />;

//   return (
//     <ResponsiveContainer height={300} width="100%">
//       <ComposedChart data={data}>
//         <CartesianGrid strokeDasharray="3 3" />
//         <XAxis type="number" dataKey="x" name="Day" />
//         <YAxis type="number" dataKey="y" name="Value" domain={[0, Math.max(...data.map(d => d.y)) + 10]} />
//         <Tooltip cursor={{ strokeDasharray: '3 3' }} />
//         <Legend />
//         <Line type="monotone" dataKey="y" stroke="#71DE5F" dot={false} strokeWidth={3} />
//         <Scatter name="Data Points" data={data} fill="#1A8208" />
//       </ComposedChart>
//     </ResponsiveContainer>
//   );
// };

// // Pie chart ui element
// const COLORS = ['#8F85FF', '#B7B1E9'];

// const renderActiveShape = (props: any) => {
//   const RADIAN = Math.PI / 180;
//   const {
//     cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
//     fill, payload, percent, value
//   } = props;

//   const sin = Math.sin(-RADIAN * midAngle);
//   const cos = Math.cos(-RADIAN * midAngle);
//   const sx = cx + (outerRadius + 10) * cos;
//   const sy = cy + (outerRadius + 10) * sin;
//   const mx = cx + (outerRadius + 30) * cos;
//   const my = cy + (outerRadius + 30) * sin;
//   const ex = mx + (cos >= 0 ? 1 : -1) * 22;
//   const ey = my;
//   const textAnchor = cos >= 0 ? 'start' : 'end';

//   return (
//     <g>
//       <Sector
//         cx={cx}
//         cy={cy}
//         innerRadius={innerRadius}
//         outerRadius={outerRadius}
//         startAngle={startAngle}
//         endAngle={endAngle}
//         fill={fill}
//         stroke="#fff"
//         strokeWidth={2}
//       />
//       <Sector
//         cx={cx}
//         cy={cy}
//         innerRadius={outerRadius + 4}
//         outerRadius={outerRadius + 8}
//         startAngle={startAngle}
//         endAngle={endAngle}
//         fill={fill}
//       />
//       <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
//       <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.category} ${value}`}</text>
//       <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey + 18} textAnchor={textAnchor} fill="#999">
//         {`(${(percent * 100).toFixed(2)}%)`}
//       </text>
//     </g>
//   );
// };

// const PiChart = ({ data, loading, error }: { data: PieChartData[], loading: boolean, error: string | null }) => {
//   const [activeIndex, setActiveIndex] = React.useState(0);

//   if (loading) return <LoadingSpinner />;
//   if (error) return <ErrorMessage message={error} />;
//   if (!data || data.length === 0) return <NoSalesData />;

//   const onPieEnter = (_: any, index: number) => {
//     setActiveIndex(index);
//   };

//   return (
//     <ResponsiveContainer width="100%" height={300}>
//       <PieChart>
//         <Pie
//           activeIndex={activeIndex}
//           activeShape={renderActiveShape}
//           data={data}
//           cx="50%"
//           cy="50%"
//           innerRadius={60}
//           outerRadius={80}
//           fill="#8884d8"
//           dataKey="value"
//           onMouseEnter={onPieEnter}
//           stroke="none"
//         >
//           {data.map((entry, index) => (
//             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.7} />
//           ))}
//           <Label
//             value="Customer Distribution"
//             position="center"
//             fill="#8F85FF"
//             fontSize={18}
//             fontWeight={500}
//           />
//         </Pie>
//       </PieChart>
//     </ResponsiveContainer>
//   );
// };

// const Analytics = () => {
//   const [barData, setBarData] = useState<BarGraphData[]>([]);
//   const [scatterData, setScatterData] = useState<ScatterGraphData[]>([]);
//   const [pieData, setPieData] = useState<PieChartData[]>([]);
//   const [countrySalesData, setCountrySalesData] = useState<CountrySalesData[]>([]);
//   const [metrics, setMetrics] = useState<MetricsData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const [bar, scatter, pie, country, metricsData] = await Promise.all([
//           analyticsService.getBarGraphData(),
//           analyticsService.getScatterGraphData(),
//           analyticsService.getPieChartData(),
//           analyticsService.getCountrySalesData(),
//           analyticsService.getMetricsData()
//         ]);

//         setBarData(bar || []);
//         setScatterData(scatter || []);
//         setPieData(pie || []);
//         setCountrySalesData(country || []);
//         setMetrics(metricsData || null);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
//         console.error('Error fetching analytics:', err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   return (
//     <div id="analytics-section">
//       <div className="mx-10 pl-1 pr-10 pb-2 pt-4">
//         <h1 className="font-black text-4xl">Analytics</h1>
//         <p>Check the sales, value and bounce rate by country</p>
//       </div>

//       {/* graph section div */}
//       <div className="my-10 mx-auto flex flex-col xl:flex-row">
//         <div className="shadow-2xl w-full md:w-[60%] md:mx-auto rounded-md my-4 xl:mx-8 pl-1 pr-10 pb-2 pt-4 bg-gray-50">
//           <h2 className="mx-10 font-bold text-2xl">In-Store Visits</h2>
//           <p className="mx-10 my-0 mb-8">Last Campaign Performance</p>
//           <Bargraph data={barData} loading={loading} error={error} />
//         </div>

//         <div className="shadow-2xl w-full md:w-[60%] md:mx-auto rounded-md my-4 xl:mx-8 pl-1 pr-10 pb-2 pt-4 bg-white">
//           <h2 className="mx-10 font-bold text-2xl">Daily Sales</h2>
//           <p className="mx-10 my-0 mb-8">(+15%) increase in todays sales</p>
//           <Scattergraph data={scatterData} loading={loading} error={error} />
//         </div>

//         <div className="shadow-2xl w-full md:w-[60%] md:mx-auto rounded-md my-4 xl:mx-8 pl-1 pr-10 pb-2 pt-4 bg-white">
//           <h2 className="mx-10 font-bold text-2xl">Customer Distribution</h2>
//           <p className="mx-10 my-0 mb-8">Customer categories</p>
//           <PiChart data={pieData} loading={loading} error={error} />
//         </div>
//       </div>

//       {/* analytics data in numbers */}
//       {metrics && !loading && !error && (
//         <div className="flex mx-4 my-8">
//           <div className="p-4 mx-10 w-full shadow-lg rounded-lg bg-gray-50">
//             <p className="text-[#353535] text-xs">Website Views</p>
//             <p className="text-[#353535] text-3xl">{metrics.totalVisits.toLocaleString()}</p>
//             <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
//             <p className="text-[#CCCCCC]">Total store visits</p>
//           </div>

//           <div className="p-4 mx-10 w-full shadow-lg rounded-lg bg-gray-50">
//             <p className="text-[#353535] text-xs">Total Sales</p>
//             <p className="text-3xl">{metrics.totalSales.toLocaleString()}</p>
//             <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
//             <p className="text-[#CCCCCC]">Total sales count</p>
//           </div>

//           <div className="p-4 mx-10 w-full shadow-lg rounded-lg bg-gray-50">
//             <p className="text-[#353535] text-xs">Revenue</p>
//             <p className="text-3xl">${metrics.totalRevenue.toLocaleString()}</p>
//             <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
//             <p className="text-[#CCCCCC]">Total revenue</p>
//           </div>

//           <div className="p-4 mx-10 w-full shadow-lg rounded-lg bg-gray-50">
//             <p className="text-[#353535] text-xs">Customers</p>
//             <p className="text-3xl">{metrics.totalCustomers.toLocaleString()}</p>
//             <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
//             <p className="text-[#CCCCCC]">Total customers</p>
//           </div>
//         </div>
//       )}

//       {/* Sales by country */}
//       <div className="p-8 rounded-lg shadow-lg flex flex-col m-10">
//         <h2 className="text-2xl font-bold mb-4">Sales by Country</h2>
//         {loading ? (
//           <LoadingSpinner />
//         ) : error ? (
//           <ErrorMessage message={error} />
//         ) : !countrySalesData || countrySalesData.length === 0 ? (
//           <NoSalesData />
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full bg-white">
//               <thead>
//                 <tr>
//                   <th className="py-2 px-4 border-b">Country</th>
//                   <th className="py-2 px-4 border-b">Sales</th>
//                   <th className="py-2 px-4 border-b">Value</th>
//                   <th className="py-2 px-4 border-b">Bounce</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {countrySalesData.map((country, index) => (
//                   <tr key={index}>
//                     <td className="py-2 px-4 border-b">
//                       <div className="flex items-center">
//                         <img src={country.flag} alt={country.country} className="w-6 h-4 mr-2" />
//                         {country.country}
//                       </div>
//                     </td>
//                     <td className="py-2 px-4 border-b">{country.sales.toLocaleString()}</td>
//                     <td className="py-2 px-4 border-b">{country.value}</td>
//                     <td className="py-2 px-4 border-b">{country.bounce}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

const SellerDashboard = () => {
  // return <Analytics />;
  return <></>;
};

export default SellerDashboard;