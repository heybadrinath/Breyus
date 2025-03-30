import React from "react";
import { Header, Leftnavdash } from "../seller/components";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter, Line, ResponsiveContainer, ComposedChart } from 'recharts';
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
  { x: 9, y: 55 }
];

// Analytics dummy data
let websiteViews = 281;
let websiteViewsincrease = 55;
let todayUsers = 2300;
let todayUsersincrease = 5;
let revenue = 34000;
let revenueincrease = 35;
let followers = 2910;
let followersincrease = 10;


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

      <div className="mx-10 pl-1 pr-10 pb-2 pt-4">
        <h1 className=" font-black text-4xl  ">Analytics</h1>
        <p>Check the sales ,value and bounce rate by country</p>
      </div>

      {/* graph section div  */}
      <div className=" my-10  mx-auto flex flex-col xl:flex-row ">

        <div className="shadow-2xl w-full md:w-[60%] md:mx-auto rounded-md  my-4 xl:mx-8  pl-1 pr-10 pb-2 pt-4 bg-gray-50">
          <h2 className="mx-10 font-bold text-2xl ">In-Store Visits</h2>
          <p className="mx-10 my-0 mb-8">Last Campaign Performance</p>
          <Bargraph data={Bardata} />
        </div>

        <div className="shadow-2xl w-full md:w-[60%] md:mx-auto rounded-md  my-4 xl:mx-8  pl-1 pr-10 pb-2 pt-4 bg-white">
          <h2 className="mx-10 font-bold text-2xl ">Daily Sales</h2>
          <p className="mx-10 my-0 mb-8">(+15%) increase in todays sales</p>
          <Scattergraph data={Scatterdata} />
        </div>

        <div className="shadow-2xl w-full md:w-[60%] md:mx-auto rounded-md  my-4 xl:mx-8  pl-1 pr-10 pb-2 pt-4 bg-white">
          <h2 className="mx-10 font-bold text-2xl ">Completed Tasks</h2>
          <p className="mx-10 my-0 mb-8">Last Campaign Performance</p>
          <Scattergraph data={Scatterdata} />
        </div>
      </div>

      {/* analytics data in numbers */}

      {/* Website views  */}
      <div className="flex mx-4 my-8">
        <div className="p-4  mx-10 w-full shadow-lg rounded-lg bg-gray-50 ">
          <p className="text-[#353535] text-xs" >Website Views</p>
          <p className="text-[#353535] text-3xl">{websiteViews.toLocaleString()}</p>

          <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />

          <p className="text-[#CCCCCC]"> <span className=" text-[#71DE5F]  " >+{websiteViewsincrease + "%"}</span> than last week</p>
        </div>

        {/* Today Users  */}
        <div className="p-4  mx-10 w-full shadow-lg rounded-lg bg-gray-50 ">
          <p className="text-[#353535] text-xs" >Today users</p>
          <p className="text-[#353535] text-3xl">{todayUsers.toLocaleString()}</p>

          <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />

          <p className="text-[#CCCCCC]"> <span className=" text-[#71DE5F]  " >+{todayUsersincrease + "%"}</span> than last week</p>
        </div>

        {/* Revenue  */}
        <div className="p-4  mx-10 w-full shadow-lg rounded-lg bg-gray-50 ">
          <p className="text-[#353535] text-xs" >Revenue</p>
          <p className="text-[#353535] text-3xl">{revenue.toLocaleString()}</p>

          <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />

          <p className="text-[#CCCCCC]"> <span className=" text-[#71DE5F]  " >+{revenueincrease + "%"}</span> than last week</p>
        </div>

        {/* Followers  */}
        <div className="p-4  mx-10 w-full shadow-lg rounded-lg bg-gray-50 ">
          <p className="text-[#353535] text-xs" >Followers</p>
          <p className="text-[#353535] text-3xl">{followers.toLocaleString()}</p>

          <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />

          <p className="text-[#CCCCCC]"> <span className=" text-[#71DE5F]  " >+{followersincrease + "%"}</span> than last week</p>
        </div>

      </div>

      {/* Sales by country */}
      <div className="p-8 rounded-lg shadow-lg flex flex-col m-10">
        <h1 className="text-3xl font-bold ">Sales by Country</h1>
        <p className=" text-default text-[#CCCCCC]" >Check the sales, value and bounce rate by country.</p>


        {/* Table  */}
        <table className="text-left my-6 xl:w-[60%] md:w-[80%]">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-gray-200 text-gray-400 uppercase text-sm">
            <th className="px-4 py-2">Country</th>
            <th className="px-4 py-2">Sales</th>
            <th className="px-4 py-2">Values</th>
            <th className="px-4 py-2">Bounce</th>
          </tr>
        </thead>

        {/* Countries wise data  */}
        <tbody>
          {/* Row 1 */}
          <tr className="border-b border-gray-200">
            <td className="px-4 py-2 flex items-center gap-2">
              <img src="https://flagcdn.com/w40/us.png" alt="US Flag" className="w-6 h-4" />
              United States
            </td>
            <td className="px-4 py-2">2500</td>
            <td className="px-4 py-2">$230,900</td>
            <td className="px-4 py-2">29.09%</td>
          </tr>

          {/* Row 2 */}
          <tr className="border-b border-gray-200">
            <td className="px-4 py-2 flex items-center gap-2">
              <img src="https://flagcdn.com/w40/de.png" alt="Germany Flag" className="w-6 h-4" />
              Germany
            </td>
            <td className="px-4 py-2">1200</td>
            <td className="px-4 py-2">$230,900</td>
            <td className="px-4 py-2">29.09%</td>
          </tr>
        </tbody>
      </table>


      </div>


    </div>
  );
};




const SellerDashboard = () => {
  return (
    <div className="layout">
      <Leftnavdash username={username} />
      <div id="right-section" className=" overflow-scroll h-max ">
        <Header />
        <Analytics />
      </div>
    </div>
  );
};

export default SellerDashboard;
