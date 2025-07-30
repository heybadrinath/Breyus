import React from "react";

export const TradeTabs = () => {
    return (
        <div className="flex border-b-2">
            <div className="flex gap-x-16 h-12 mx-auto text-xl font-bold text-gray-400">
                <button className="border-b-[3px] border-gray-700 text-gray-700">Purchase Request Status</button>
                <button>Purchase Order Status</button>
                <button>Ongoing Trades</button>
                <button>History</button>
            </div>
        </div>
    );
}