import React from "react";
import { SortHeader } from "../components/Header";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
    DotProps,
    AreaChart,
    Area,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from "recharts";

// demo data 
let sales = 230220;
let salesIncrease = 55;
let customers = 3.200;
let customersIncrease = 12;
let Revenue = 34000;
let revenueincrease = 35;
let AvereageRevenue = 1.200;
let AvereageRevenueIncrease = 213;

// sales graph components with data

// Demo data for the sales graph
const salesData = [
    { name: "Page A", pv: 2400, uv: 4000 },
    { name: "Page B", pv: 1398, uv: 3000 },
    { name: "Page C", pv: 9800, uv: 2000 },
    { name: "Page D", pv: 3908, uv: 2780 },
    { name: "Page E", pv: 4800, uv: 1890 },
    { name: "Page F", pv: 3800, uv: 2390 },
    { name: "Page G", pv: 4300, uv: 3490 }
];

// Custom dot for highlighting a point
const CustomDot = (props: DotProps & { index?: number; dataKey?: string }) => {
    const { cx, cy, index, dataKey } = props;
    // Highlight the second point (Page B) for demo
    if (index === 1 && dataKey === "pv") {
        return (
            <circle cx={cx} cy={cy} r={8} fill="#8884d8" stroke="#fff" strokeWidth={2} />
        );
    }
    return <circle cx={cx} cy={cy} r={4} fill="#8884d8" />;
};

interface SalesGraphProps {
    className?: string;
}

const SalesGraph: React.FC<SalesGraphProps> = ({ className = "" }) => (
    <div className={`bg-white rounded-xl shadow p-6 my-8 w-full max-w-2xl mx-auto ${className}`}>
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={salesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                    contentStyle={{ borderRadius: 8, boxShadow: "0 2px 8px #0001" }}
                    formatter={(value: number, name: string) => [`${value}`, name.toUpperCase()]}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="pv"
                    stroke="#8884d8"
                    strokeWidth={2}
                    activeDot={<CustomDot dataKey="pv" />}
                    dot={{ r: 4 }}
                />
                <Line
                    type="monotone"
                    dataKey="uv"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center mt-2 text-sm text-gray-500">
            <span className="flex items-center mr-4">
                <span className="inline-block w-3 h-3 rounded-full bg-[#8884d8] mr-1"></span> pv
            </span>
            <span className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#82ca9d] mr-1"></span> uv
            </span>
        </div>
    </div>
);

interface SalesAreaGraphProps {
    className?: string;
}

const SalesAreaGraph: React.FC<SalesAreaGraphProps> = ({ className = "" }) => (
    <div className={`bg-white rounded-xl shadow p-6 my-8 w-full max-w-2xl mx-auto ${className}`}>
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={salesData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                    contentStyle={{ borderRadius: 8, boxShadow: "0 2px 8px #0001" }}
                    formatter={(value: number, name: string) => [`${value}`, name.toUpperCase()]}
                />
                <Area
                    type="monotone"
                    dataKey="pv"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    activeDot={{ r: 6 }}
                />
            </AreaChart>
        </ResponsiveContainer>
        <div className="flex justify-center mt-2 text-sm text-gray-500">
            <span className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-[#82ca9d] mr-1"></span> pv
            </span>
        </div>
    </div>
);

/**
 * Radar graph for current orders by commodity
 */
const currentOrdersData = [
    { commodity: "Wheat", orders: 120 },
    { commodity: "Rice", orders: 95 },
    { commodity: "Corn", orders: 80 },
    { commodity: "Soybean", orders: 60 },
    { commodity: "Barley", orders: 45 },
    { commodity: "Oats", orders: 30 }
];

interface CurrentOrdersRadarGraphProps {
    className?: string;
}

const CurrentOrdersRadarGraph: React.FC<CurrentOrdersRadarGraphProps> = ({ className = "" }) => (
    <div className={`bg-white rounded-xl shadow p-6 my-8 w-full max-w-xl mx-auto ${className}`}>
        <h2 className="font-bold text-lg mb-4">Current Orders</h2>
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={currentOrdersData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="commodity" />
                <PolarRadiusAxis />
                <Radar
                    name="Orders"
                    dataKey="orders"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                />
                <Tooltip
                    contentStyle={{ borderRadius: 8, boxShadow: "0 2px 8px #0001" }}
                    formatter={(value: number) => [`${value}`, "Orders"]}
                />
            </RadarChart>
        </ResponsiveContainer>
    </div>
);

const Sales = () => {
    return (
        <>
            <SortHeader />
            <div className="flex flex-col m-4">
                <div className="flex flex-col m-4">
                    <h1 className="font-extrabold text-4xl">Sales</h1>
                    <p className="text-[#353535]">Check the sales, value and bounce rate by country</p>
                </div>


                {/* Sales section  */}
                <div className="flex">
                    <div className="shadow-lg p-4 rounded-lg w-full mx-8 border-[#cccccc] border-2">
                        <p className="text-[#353535]">Sales</p>
                        <h1 className=" text-[#353535] text-3xl">{"$" + sales.toLocaleString()}</h1>
                        <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
                        <p className="text-[#acabab]"> <span className=" text-[#71DE5F]  " >+{salesIncrease + "%"}</span> than last month</p>
                    </div>

                    <div className="shadow-lg p-4 rounded-lg w-full mx-8 border-[#cccccc] border-2">
                        <p className="text-[#353535]">Customers</p>
                        <h1 className=" text-[#353535] text-3xl">{"$" + customers.toLocaleString()}</h1>
                        <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
                        <p className="text-[#acabab]"> <span className=" text-[#71DE5F]  " >+{customersIncrease + "%"}</span> since last month</p>
                    </div>

                    <div className="shadow-lg p-4 rounded-lg w-full mx-8 border-[#cccccc] border-2">
                        <p className="text-[#353535]">Revenue</p>
                        <h1 className=" text-[#353535] text-3xl">{"$" + Revenue.toLocaleString()}</h1>
                        <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
                        <p className="text-[#acabab]"> <span className=" text-[#71DE5F]  " >+{revenueincrease + "%"}</span> than last month</p>
                    </div>

                    <div className="shadow-lg p-4 rounded-lg w-full mx-8 border-[#cccccc] border-2">
                        <p className="text-[#353535]">Average Revenue</p>
                        <h1 className=" text-[#353535] text-3xl">{"$" + AvereageRevenue.toLocaleString()}</h1>
                        <hr className="border-0 h-[1.5px] bg-gradient-to-r from-[#ECECEC] via-[#00000080] to-[#ECECEC]" />
                        <p className="text-[#acabab]"> <span className=" text-[#71DE5F]  " >+{"$" + AvereageRevenueIncrease}</span> than last week</p>
                    </div>
                </div>
                {/* Insert the SalesGraph component here */}
                <div className="flex m-4">
                    <SalesGraph className="my-4" />
                    <SalesAreaGraph className="my-4" />
                </div>

                {/* Sales by Country and Current Orders Radar Graph */}
                <div className="flex flex-col md:flex-row m-4 w-full bg-white rounded-xl shadow-lg p-6">
                    {/* Sales by Country Table */}
                    <div className="md:w-1/2 w-full md:mr-4 mb-6 md:mb-0 flex flex-col justify-start">
                        <div>
                            <h2 className="font-bold text-2xl mb-1">Sales by Country</h2>
                            <p className="text-gray-400 text-sm mb-2">
                                Check the sales, value and bounce rate by country.
                            </p>
                        </div>
                        <div className="overflow-y-scroll max-h-96 px-6 py-2">
                            <table className="w-full text-left mt-0">
                                <thead>
                                    <tr className="text-gray-400 text-sm">
                                        <th className="pb-2 text-left">Country</th>
                                        <th className="pb-2 text-right">Number of Sales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Example row, you can map your data here */}
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 font-medium text-gray-700 text-left">United States</td>
                                        <td className="py-2 font-semibold text-black text-right">29.09%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Current Orders Radar Graph */}
                    <div className="md:w-1/2 w-full md:ml-4 flex flex-col items-center justify-center">
                        <CurrentOrdersRadarGraph className="my-4 w-full" />
                    </div>
                </div>

            </div>
        </>
    );
};

export default Sales;