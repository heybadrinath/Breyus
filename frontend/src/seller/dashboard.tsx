import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter, Line, ResponsiveContainer, ComposedChart } from 'recharts';
import "../seller/css/components.css";
import axios from 'axios';

type BarGraphDataType = { week: string; storeVisits: number };
type ScatterGraphDataType = { x: number, y: number };
type BackendAnalyticsType = {
  store_visits: BarGraphDataType[];
  daily_sales: ScatterGraphDataType[];
  website_views: number;
  website_views_increase: number;
  today_users: number;
  today_users_increase: number;
  revenue: number;
  revenue_increase: number;
  followers: number;
  followers_increase: number;
  country_sales: {
    country: string;
    sales: number;
    value: number;
    bounce: number;
    flagUrl: string;
  }[];
};

type FrontendAnalyticsType = {
  storeVisits: BarGraphDataType[];
  dailySales: ScatterGraphDataType[];
  websiteViews: number;
  websiteViewsIncrease: number;
  todayUsers: number;
  todayUsersIncrease: number;
  revenue: number;
  revenueIncrease: number;
  followers: number;
  followersIncrease: number;
  countrySales: {
    country: string;
    sales: number;
    value: number;
    bounce: number;
    flagUrl: string;
  }[];
};

// Bargraph ui element
const Bargraph = ({ data }: { data: BarGraphDataType[] }) => {
  return (
    <ResponsiveContainer height={300} width="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis domain={[0, Math.max(...data.map(d => d.storeVisits)) + 5]} />
        <Tooltip />
        <Legend />
        <Bar dataKey="storeVisits" fill="#71DE5F" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Scatter graph ui element
const Scattergraph = ({ data }: { data: ScatterGraphDataType[] }) => {
  return (
    <ResponsiveContainer height={300} width="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name="Day" />
        <YAxis type="number" dataKey="y" name="Value" domain={[0, Math.max(...data.map(d => d.y)) + 10]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Line type="monotone" dataKey="y" stroke="#71DE5F" dot={false} strokeWidth={3} />
        <Scatter name="Data Points" data={data} fill="#1A8208" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<FrontendAnalyticsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:5000/analytics');
        const data = response.data;
        
        // Handle JSON strings from SQLite if they come as strings
        let storeVisits = [];
        let dailySales = [];
        let countrySales = [];
        
        try {
          if (data.store_visits) {
            storeVisits = typeof data.store_visits === 'string' 
              ? JSON.parse(data.store_visits) 
              : data.store_visits;
          }
        } catch (e) {
          console.error('Error parsing store_visits:', e);
          storeVisits = [];
        }
        
        try {
          if (data.daily_sales) {
            dailySales = typeof data.daily_sales === 'string' 
              ? JSON.parse(data.daily_sales) 
              : data.daily_sales;
          }
        } catch (e) {
          console.error('Error parsing daily_sales:', e);
          dailySales = [];
        }
        
        try {
          if (data.country_sales) {
            countrySales = typeof data.country_sales === 'string' 
              ? JSON.parse(data.country_sales) 
              : data.country_sales;
          }
        } catch (e) {
          console.error('Error parsing country_sales:', e);
          countrySales = [];
        }
        
        // Create a properly typed object with default values for all properties
        const processedData: FrontendAnalyticsType = {
          storeVisits: storeVisits || [],
          dailySales: dailySales || [],
          websiteViews: data.website_views || 0,
          websiteViewsIncrease: data.website_views_increase || 0,
          todayUsers: data.today_users || 0, 
          todayUsersIncrease: data.today_users_increase || 0,
          revenue: data.revenue || 0,
          revenueIncrease: data.revenue_increase || 0,
          followers: data.followers || 0,
          followersIncrease: data.followers_increase || 0,
          countrySales: countrySales || []
        };
        
        setAnalyticsData(processedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading analytics...</div>;
  }

  if (error || !analyticsData) {
    return <div className="text-red-500 text-center p-4">{error || 'No data available'}</div>;
  }

  return (
    <div id="analytics-section">
      <div className="mx-10 pl-1 pr-10 pb-2 pt-4">
        <h1 className="font-black text-4xl">Analytics</h1>
        <p>Check the sales, value and bounce rate by country</p>
      </div>

      {/* graph section div  */}
      <div className="my-10 mx-auto flex flex-col xl:flex-row">
        <div className="shadow-2xl w-full md:w-[60%] md:mx-auto rounded-md my-4 xl:mx-8 pl-1 pr-10 pb-2 pt-4 bg-gray-50">
          <h2 className="mx-10 font-bold text-2xl">In-Store Visits</h2>
          <p className="mx-10 my-0 mb-8">Last Campaign Performance</p>
          <Bargraph data={analyticsData.storeVisits} />
        </div>

        <div className="shadow-2xl w-full md:w-[60%] md:mx-auto rounded-md my-4 xl:mx-8 pl-1 pr-10 pb-2 pt-4 bg-white">
          <h2 className="mx-10 font-bold text-2xl">Daily Sales</h2>
          <p className="mx-10 my-0 mb-8">(+15%) increase in todays sales</p>
          <Scattergraph data={analyticsData.dailySales} />
        </div>

        <div className="shadow-2xl w-full md:w-[60%] md:mx-auto rounded-md my-4 xl:mx-8 pl-1 pr-10 pb-2 pt-4 bg-white">
          <h2 className="mx-10 font-bold text-2xl">Completed Tasks</h2>
          <p className="mx-10 my-0 mb-8">Last Campaign Performance</p>
          <Scattergraph data={analyticsData.dailySales} />
        </div>
      </div>

      {/* analytics data in numbers */}
      <div className="flex mx-4 my-8">
        <div className="p-4 mx-10 w-full shadow-lg rounded-lg bg-gray-50">
          <p className="text-[#353535] text-xs">Website Views</p>
          <p className="text-[#353535] text-3xl">{analyticsData.websiteViews ? analyticsData.websiteViews.toLocaleString() : '0'}</p>
          <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
          <p className="text-[#CCCCCC]">
            <span className="text-[#71DE5F]">+{analyticsData.websiteViewsIncrease || 0}%</span> than last week
          </p>
        </div>

        <div className="p-4 mx-10 w-full shadow-lg rounded-lg bg-gray-50">
          <p className="text-[#353535] text-xs">Today users</p>
          <p className="text-[#353535] text-3xl">{analyticsData.todayUsers ? analyticsData.todayUsers.toLocaleString() : '0'}</p>
          <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
          <p className="text-[#CCCCCC]">
            <span className="text-[#71DE5F]">+{analyticsData.todayUsersIncrease || 0}%</span> than last week
          </p>
        </div>

        <div className="p-4 mx-10 w-full shadow-lg rounded-lg bg-gray-50">
          <p className="text-[#353535] text-xs">Revenue</p>
          <p className="text-[#353535] text-3xl">${analyticsData.revenue ? analyticsData.revenue.toLocaleString() : '0'}</p>
          <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
          <p className="text-[#CCCCCC]">
            <span className="text-[#71DE5F]">+{analyticsData.revenueIncrease || 0}%</span> than last week
          </p>
        </div>

        <div className="p-4 mx-10 w-full shadow-lg rounded-lg bg-gray-50">
          <p className="text-[#353535] text-xs">Followers</p>
          <p className="text-[#353535] text-3xl">{analyticsData.followers ? analyticsData.followers.toLocaleString() : '0'}</p>
          <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
          <p className="text-[#CCCCCC]">
            <span className="text-[#71DE5F]">+{analyticsData.followersIncrease || 0}%</span> than last week
          </p>
        </div>
      </div>

      {/* Sales by country */}
      <div className="p-8 rounded-lg shadow-lg flex flex-col m-10">
        <h1 className="text-3xl font-bold">Sales by Country</h1>
        <p className="text-default text-[#CCCCCC]">Check the sales, value and bounce rate by country.</p>

        <table className="text-left my-6 xl:w-[60%] md:w-[80%]">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 uppercase text-sm">
              <th className="px-4 py-2">Country</th>
              <th className="px-4 py-2">Sales</th>
              <th className="px-4 py-2">Values</th>
              <th className="px-4 py-2">Bounce</th>
            </tr>
          </thead>
          <tbody>
            {analyticsData.countrySales && analyticsData.countrySales.map((country, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="px-4 py-2 flex items-center gap-2">
                  <img src={country.flagUrl} alt={`${country.country} Flag`} className="w-6 h-4" />
                  {country.country}
                </td>
                <td className="px-4 py-2">{country.sales}</td>
                <td className="px-4 py-2">${country.value ? country.value.toLocaleString() : '0'}</td>
                <td className="px-4 py-2">{country.bounce}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SellerDashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <Analytics />
    </div>
  );
};

export default SellerDashboard;
