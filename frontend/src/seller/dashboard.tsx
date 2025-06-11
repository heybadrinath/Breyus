import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter, Line, ResponsiveContainer, ComposedChart } from 'recharts';
import "../seller/css/components.css";
import { PieChart, Pie, Cell, Label, Sector } from 'recharts';
import NoSalesData from "./components/NoSalesData";

type BarGraphDataType = { week: string; storeVisits: number };
type ScatterGraphDataType = { x: number, y: number };
type CountrySalesDataType = {
  country: string;
  flag: string;
  sales: number;
  value: string;
  bounce: string;
};

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

// Country sales data
const countrySalesData: CountrySalesDataType[] = [
  {
    country: "United States",
    flag: "https://flagcdn.com/w40/us.png",
    sales: 2500,
    value: "$230,900",
    bounce: "29.09%"
  },
  {
    country: "Germany",
    flag: "https://flagcdn.com/w40/de.png",
    sales: 1200,
    value: "$230,900",
    bounce: "29.09%"
  },
  {
    country: "United Kingdom",
    flag: "https://flagcdn.com/w40/gb.png",
    sales: 1800,
    value: "$180,500",
    bounce: "25.45%"
  },
  {
    country: "France",
    flag: "https://flagcdn.com/w40/fr.png",
    sales: 950,
    value: "$150,200",
    bounce: "32.15%"
  }
];

// Dummy data for Pie Chart
const pieData = [
  { name: 'New Customers', value: 300 },
  { name: 'Returning Customers', value: 100 }
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

// Pie chart ui element
const COLORS = ['#8F85FF', '#B7B1E9'];

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
      {/* <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#8F85FF" fontSize={18}>
        Group B
      </text> */}
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
      {/* <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none"/> */}
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`FV ${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey + 18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const PiChart = ({ data }: { data: typeof pieData }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

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
              value="Group B"
              position="center"
              fill="#8F85FF"
              fontSize={18}
              fontWeight={500}
            />
          </Pie>
        </PieChart>
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
          <PiChart data={pieData} />
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
            {countrySalesData.map((row, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="px-4 py-2 flex items-center gap-2">
                  <img src={row.flag} alt={`${row.country} Flag`} className="w-6 h-4" />
                  {row.country}
                </td>
                <td className="px-4 py-2">{row.sales.toLocaleString()}</td>
                <td className="px-4 py-2">{row.value}</td>
                <td className="px-4 py-2">{row.bounce}</td>
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
  <Analytics/>
  
  );
};

export default SellerDashboard;