import React from "react";
import TradeStatusProgress from "./tradeStatusProgress";

export const Negoatation = () => {
    return (
        <div className="flex w-full h-[65%] my-auto px-4">
                {/* Left */}
                <div className=" w-[300px] h-full">
                    <h1 className=" ml-2 text-xl font-bold ">Trade Status</h1>
                    <div className="flex flex-col h-full border border-gray-300 rounded-lg">
                        <TradeStatusProgress currentStep={1} />
                    </div>
                </div>


                {/* Right */}
                <div className=" w-full h-full">
                    <div className="flex flex-col h-full border border-gray-300 rounded-lg mt-7 mx-6">
                        
                    </div>
                </div>
            </div>
    );
}