import React from "react";
import { PurchaseRequestProgress } from "../components/purchaseRequestProgress";
import TradeStatusProgress from "../components/tradeStatusProgress";

export const PurchaseRequest = () => {
    return (
        <div className="flex flex-col h-screen">
            <PurchaseRequestProgress />
            <div className="flex w-full h-[65%] my-auto px-4">
                {/* Left */}
                <div className=" w-[30%] h-full">
                    <h1 className="  text-xl font-bold ">Trade Status</h1>
                    <div className="flex flex-col border border-gray-300 rounded-lg">
                       <TradeStatusProgress currentStep={6}/>
                    
                    </div>
                </div>


                {/* Right */}
                <div className="bg-red-500 w-full h-full">
                    
                </div>
            </div>
        </div>
    );
}