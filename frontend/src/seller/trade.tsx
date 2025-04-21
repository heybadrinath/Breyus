import React, { ReactNode } from "react";
import "../seller/css/trade.css";


const Trade = () => {
    return (
        <div className="p-6 mx-16">
            {/* Search and Tabs */}
            <div className="flex flex-col space-y-4 mb-6">
                <div className="flex items-center space-x-2">
                    <div className="flex items-center border rounded-md px-3 py-2 w-full">
                        <span className="text-gray-400 mr-2">🔍</span>
                        <input
                            type="text"
                            placeholder="Search all the trades"
                            className="w-full focus:outline-none"
                        />
                    </div>
                    <button className="border rounded-md px-4 py-2 bg-white text-gray-700">Search trades</button>
                </div>

                <div className="flex space-x-6 border-b">
                    <button className="pb-2 border-b-2 border-black text-black font-semibold">Purchase Request Status</button>
                    <button className="pb-2 text-gray-500">Purchase Order Status</button>
                    <button className="pb-2 text-gray-500">Ongoing Trades</button>
                    <button className="pb-2 text-gray-500">Track Trade</button>
                    <button className="pb-2 text-gray-500">Trade history</button>
                </div>
            </div>

            {/* Purchase Request Title */}
            <div className="bg-white p-4 rounded-md shadow-sm">
                <h2 className="text-lg font-bold">Purchase Request</h2>
                <p className="text-sm text-gray-500">Check whether the things are thier or not</p>

                {/* Entries per page and Buttons */}
                <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center space-x-2">
                        <select className="border rounded-md px-3 py-1 focus:outline-none">
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                        </select>
                        <span className="text-gray-500">entries per page</span>
                    </div>
                    <div className="flex space-x-2">
                        <select className="mx-3 border-[1px] text-black border-black px-6 py-2 bg-transparent my-3 rounded-md w-fit"><option disabled value={""} selected>Filter</option></select>
                        <button className="mx-3 border-[1px] text-blue-500 border-blue-500 px-6 py-2 my-3 rounded-md w-fit">Export CSV File</button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto mt-">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr className="bg-gray-100 text-gray-600 text-sm">
                                <th className="py-6 px-4 text-left">ID</th>
                                <th className="py-6 px-4 text-left">Trade</th>
                                <th className="py-6 px-4 text-left">Buyer</th>
                                <th className="py-6 px-4 text-left">Product</th>
                                <th className="py-6 px-4 text-left">Negotiation</th>
                                <th className="py-6 px-4 text-left">Request Analysis</th>
                                <th className="py-6 px-4 text-left">Request</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="py-6 px-4">123344823</td>
                                <td className="py-6 px-4 text-blue-500 underline cursor-pointer">Trade terms</td>
                                <td className="py-6 px-4 flex items-center space-x-2">
                                    <div className="w-4 h-4 bg-black rounded-full"></div>
                                    <span>Max Sharma</span>
                                </td>
                                <td className="py-6 px-4">xxxxxx</td>
                                <td className="py-6 px-4 flex items-center">
                                    <span className="text-red-500 text-2xl">•</span>
                                    <span className="ml-2 text-gray-700 text-sm">Negotiation</span>
                                </td>
                                <td className="py-6 px-4 text-blue-500 underline cursor-pointer">Check INCO-TERMS</td>
                                <td className="py-6 px-4 flex items-center space-x-2">
                                    <button className="border-[1px] text-blue-500 border-blue-500 px-6 py-2 rounded-md w-fit">Accept</button>
                                    <button className="border-[1px] text-red-500 border-red-500 px-6 py-2 rounded-md w-fit">Reject</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    );
};

export default Trade;