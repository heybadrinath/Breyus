import React from "react";
import { Header, Leftnavdash } from "../seller/components";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter, Line, ResponsiveContainer, ComposedChart } from 'recharts';
import "../seller/css/dashboard.css";
import "../seller/css/components.css";



// dummy data 
let username = "Demo user"

type BarGraphDataType = { week: string; storeVisits: number };
type ScatterGraphDataType = { x: number, y: number };

// bargraph data 
const Bardata: BarGraphDataType[] = [
  { week: 'M', storeVisits: 40 },
  { week: 'T', storeVisits: 30 },
  { week: 'W', storeVisits: 20 },
  { week: 'TH', storeVisits: 27 },
  { week: 'F', storeVisits: 18 },
  { week: 'SN', storeVisits: 32 }
];
// scatter graph data
const Scatterdata: ScatterGraphDataType[] = [
  { x: 1, y: 40 },
  { x: 2, y: 30 },
  { x: 3, y: 20 },
  { x: 4, y: 27 },
  { x: 5, y: 18 },
  { x: 6, y: 32 },
  { x: 8, y: 33 },
  { x: 9, y: 55}
];


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
    <ResponsiveContainer  height={300} width="100%">
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="x" name="Day" />
        <YAxis type="number" dataKey="y" name="Value" domain={[0, Math.max(...data.map(d => d.y)) + 10]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />

        {/* Line Chart */}
        <Line type="monotone" dataKey="y" stroke="#71DE5F" dot={false} strokeWidth={3} />

        {/* Scatter Points */}
        <Scatter name="Data Points" data={data} fill="#1A8208" />
      </ComposedChart>
    </ResponsiveContainer>
  );
};


const Analytics = () => {
  return (
    <div id="analytics-section">

      <div id="analytics-header">
        <h1>Analytics</h1>
        <p>Check the sales ,value and bounce rate by country</p>
      </div>

      <div id="analytics-graph" className="my-10">

        <div className="shadow-2xl rounded-md mx-2 pl-1 pr-10 pb-2 pt-4 bg-gray-50">
          <h2 className="mx-10">In-Store Visits</h2>
          <p className="mx-10 my-0 mb-8">Last Campaign Performance</p>
          <Bargraph data={Bardata}/>
        </div>

        <div className="shadow-2xl rounded-md mx-2 pl-1 pr-10 pb-2 pt-4 bg-white">
          <h2 className="mx-10">Daily Sales</h2>
          <p className="mx-10 my-0 mb-8">(+15%) increase in todays sales</p>
          <Scattergraph data={Scatterdata}/>
        </div>

        <div className="shadow-2xl rounded-md mx-2 pl-1 pr-10 pb-2 pt-4 bg-white">
          <h2 className="mx-10">Completed Tasks</h2>
          <p className="mx-10 my-0 mb-8">Last Campaign Performance</p>
          <Scattergraph data={Scatterdata}/>
        </div>

        

      </div>


    </div>
  );
};




const SellerDashboard = () => {
  return (
    <div className="layout">
      <Leftnavdash username={username} />
      <div id="right-section">
        <Header />
        <Analytics />



      </div>
    </div>
  );
};

export default SellerDashboard;
