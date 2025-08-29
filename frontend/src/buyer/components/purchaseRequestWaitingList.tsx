import React from "react";
import { AcademicCapIcon } from "@heroicons/react/24/outline"
import TradeStatusProgress from "./tradeStatusProgress"
import { MessageCircle, FlaskConical, Eye } from "lucide-react"
import { useState } from "react";


const WL = () => {

    interface TradeDetails {
        productName: string;
        productImage: string;
        productPrice: number;
        productSalePrice: number;
        productPriceUnit: string;
        productQuantity: number;
        productQuantityUnit: string;
        productDescription: string;
        productStock: number;
        productStockUnit: string;
        productMoq: number;
        productMoqUnit: string;
    }

    const [TradeDetails, setTradeDetails] = useState<TradeDetails>({
        productName: "Grapes",
        productImage: "http://localhost:5000/backend/uploads/product-images/1752429680987-grapes-2.webp",
        productPrice: 100,
        productSalePrice: 70,
        productPriceUnit: "INR",
        productQuantity: 10,
        productQuantityUnit: "tons",
        productDescription: "This is the description of the product for the product",
        productStock: 100000,
        productStockUnit: "tons",
        productMoq: 10,
        productMoqUnit: "tons"
    });
    
    return (
        <div className="flex border-2 w-full rounded-lg">
            <div className="flex flex-col border-r-2 w-[350px]"><TradeStatusProgress currentStep={3} /></div>
            <div className="flex p-3 w-full flex-col">
                <div className="flex">
                    {/* left */}
                    <div className="w-full flex flex-col">
                        <h1 className="text-lg font-bold text-black">{TradeDetails.productName}</h1>
                        <div className="flex flex-col w-fit gap-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-gray-900">{TradeDetails.productSalePrice.toLocaleString() + ' ' + TradeDetails.productPriceUnit}</span>
                                <span className="text-sm text-gray-500 line-through">{TradeDetails.productPrice.toLocaleString() + ' ' + TradeDetails.productPriceUnit}</span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-medium">{Math.round(((TradeDetails.productPrice - TradeDetails.productSalePrice) / TradeDetails.productPrice) * 100)}% OFF</span>
                            </div>
                            <div className="flex">
                                <p className="text-xs text-gray-600">MOQ: {TradeDetails.productMoq.toLocaleString() + ' ' + TradeDetails.productMoqUnit}</p>
                                <span className="text-xs text-gray-500 ml-4">Stock: {TradeDetails.productStock.toLocaleString() + ' ' + TradeDetails.productQuantityUnit}</span>
                            </div>
                        </div>
                        <h1 className="text-lg font-bold text-black mt-3 mb-1">Description</h1>
                        <div className="w-[80%] border-2 h-full rounded-lg overflow-y-scroll p-2 text-sm text-gray-500" >
                            {TradeDetails.productDescription}
                        </div>



                    </div>
                    {/* right */}
                    <div className="w-fit flex flex-col justify-center align-center gap-2">
                        <img alt="Grapes" className=" rounded-xl w-[380px]" src={TradeDetails.productImage}></img>
                        <button className="flex py-2 px-3 justify-center text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                            <MessageCircle size={18} className="inline mr-2" />
                            Ask Queries
                        </button>
                        <button className="flex py-2 px-3 justify-center text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                            Cancel Trade Request
                        </button>

                    </div>
                </div>
                {/* lower buttons and quantity */}
                <div className="flex w-full gap-x-5 my-5">
                    <div className=" px-2 py-3 flex flex-row border-2 rounded-lg w-[60%]">
                        <div className="w-full !border-0 !rounded-r-none text-sm text-center"> {TradeDetails.productQuantity.toLocaleString() + ' ' + TradeDetails.productQuantityUnit} </div>
                    </div>
                    <button className="w-[80%] border-2 rounded-lg my-auto py-2">
                        <Eye size={18} className="inline mr-2 my-auto" />
                        Submitted Offer
                    </button>
                    <button className="w-full border-2 rounded-lg my-auto py-2">
                        <FlaskConical size={18} className="inline mr-2" />
                        Product Quality Report
                    </button>
                </div>
            </div>
        </div>
    )
}



const AcceptedList = () => {
    return (
        <div className="flex p-3 w-full flex-col border-2 rounded-lg">
            <div className="flex">
                {/* left */}
                <div className="w-full flex flex-col">
                    <h1 className="text-lg font-bold text-black">{"Grapes"}</h1>
                    <div className="flex flex-col w-fit gap-y-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-gray-900">1,14,400 INR</span>
                            <span className="text-sm text-gray-500 line-through">1,30,000 INR</span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-medium">12% OFF</span>
                        </div>
                        <div className="flex">
                            <p className="text-xs text-gray-600">Quantity: 10 tons</p>
                        </div>

                    </div>
                    {/* View Terms and review negoatiated terms buttons */}
                    <div className="flex w-full mt-3">
                        <div className="flex flex-col">
                            <span className="text-xs mx-auto mb-2">Previous terms</span>
                            <button className="w-fit border-2 px-2 rounded-lg my-auto py-2 text-xs">
                                <Eye size={18} className="inline mr-2 my-auto" />
                                View Terms
                            </button>
                        </div>
                        <div className="ml-auto mr-2 flex flex-col">
                            <span className="text-xs mx-auto mb-2">Negotiated terms</span>
                            <button className="w-fit px-2 border-2 rounded-lg py-2 text-xs">
                                <Eye size={18} className="inline mr-2 my-auto" />
                                Review Negotiated Terms
                            </button>
                        </div>

                    </div>
                </div>

                {/* right */}
                <div className="w-fit flex flex-col justify-center align-center">
                    <img alt="Grapes" className=" rounded-xl w-[300px]" src="http://localhost:5000/backend/uploads/product-images/1752429680987-grapes-2.webp"></img>
                </div>
            </div>
            {/* lower buttons and quantity */}
            <div className="flex w-full gap-x-5 my-5 justify-between">
                <button className="w-fit px-12 border-2 rounded-lg my-auto py-2">
                    Reject Trade
                </button>
                <button className="w-fit px-12 border-2 rounded-lg my-auto py-2 bg-black text-white">
                    Proceed to PO
                </button>
            </div>
        </div>
    );
}




export const PurchaseRequestWaitingList = () => {
    return (
        <div className="flex border-2 rounded-lg my-6 h-full w-full p-4 gap-3">
            {/* Products under waiting list */}
            <div className="w-full h-full flex flex-col border rounded-lg p-3 overflow-y-scroll gap-y-3" id="waiting">
                <h1 className="text-xl font-bold text-black">Waiting List</h1>
                <WL />

            </div>

            {/* Products accepted */}
            <div className="flex w-[65%] h-full flex-col border rounded-lg p-3 gap-y-3 overflow-y-scroll" id="accepted">
                <h1 className="text-xl font-bold text-black">Trade Review Panel</h1>
                <AcceptedList />
                <AcceptedList />

            </div>
        </div>
    )
}