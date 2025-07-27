import React from "react";
import TradeStatusProgress from "./tradeStatusProgress";
import { Edit, Timer } from "lucide-react";

export const Negoatation = () => {
    return (
        <div className="flex w-full h-[75%] my-auto px-8">
            {/* Left */}
            <div className=" w-[300px] h-full">
                <h1 className=" ml-2 text-xl font-bold ">Trade Status</h1>
                <div className="flex flex-col h-full border border-gray-300 rounded-lg">
                    <TradeStatusProgress currentStep={1} />
                </div>
            </div>


            {/* Right */}
            <div className=" w-full h-full border border-gray-300 rounded-lg mt-7 mx-6">
                <div className=" grid grid-cols-2">
                    {/* Right section -> Left Section */}
                    <div id="left" className="flex flex-col h-full py-8 px-12">
                        <h3 className="font-extrabold text-xl mb-2">Incoterms: </h3>
                        <button className="flex border-2 px-8 py-2 w-fit rounded-lg transition-all delay-50 hover:border-gray-400 hover:scale-[1.02]"> <Edit className="inline mr-2 h-5 w-5 my-auto" /> Edit Incoterms</button>

                        <h3 className="font-extrabold text-xl mb-2 mt-6">Negotiated Incoterms: </h3>
                        <button className="flex border px-8 py-2 w-fit rounded-lg border-gray-400 transition-all delay-50 hover:border-gray-400 hover:scale-[1.02]"> <Edit className="inline mr-2 h-5 w-5 my-auto" /> Countered Terms</button>

                        <h3 className="font-extrabold text-xl mb-2 mt-6">Additional Message: </h3>
                        <textarea className="flex h-[18vh] border-2 accent-black" />

                        <div className="flex justify-between mt-6">
                            <div>
                                <h3 className="font-extrabold text-xl mb-2">Current Price: </h3>
                                <div className="flex border-2 px-8 py-2 w-full rounded-lg transition-all delay-50 hover:border-gray-400 hover:scale-[1.02]" >2000</div>
                            </div>

                            <div>
                                <h3 className="font-extrabold text-xl mb-2">Make counter offer: </h3>
                                <input className="flex border-2 px-8 py-2 w-[full] rounded-lg transition-all delay-50 hover:border-gray-400 hover:scale-[1.02]" />
                            </div>

                        </div>


                    </div>
                    {/* Right section -> Right Section */}
                    <div id="right" className="flex flex-col h-full py-8 px-12">
                        {/* Product infromation  */}
                        <div className="grid grid-cols-2 border-2 rounded-lg p-4">
                            <div className="flex flex-col w-fit h-fit">
                                <h3 className="font-bold text-lg">Product Information</h3>
                                <h3 className="font-bold text-lg">Grapes</h3>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-gray-900">1,14,400 INR</span>
                                        <span className="text-sm text-gray-500 line-through">1,30,000 INR</span>
                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-medium">12% OFF</span>
                                    </div>
                                    <div className="flex">
                                        <p className="text-xs text-gray-600">MOQ: 10 tons</p>
                                        <span className="text-xs text-gray-500 ml-auto">Stock: 100000 tons</span>
                                    </div>
                                </div>
                                <div className=" px-2 py-2 mt-auto mb-6 flex flex-row border-2 rounded-lg">
                                    <div className="w-full !border-0 !rounded-r-none text-xs"> 100 </div>
                                    <span className="my-auto mx-2 text-xs">tons</span>
                                </div>
                            </div>
                            <div className="h-fit w-fit ml-auto">
                                <img alt="Grapes" className=" rounded-xl  ml-auto h-[200px]" src="http://localhost:5000/backend/uploads/product-images/1752429680987-grapes-2.webp"></img>
                            </div>
                        </div>

                        {/* Coming soon  */}
                        <div className="text-gray-200 text-xl font-bold h-full w-full border rounded-lg flex flex-col justify-center items-center my-4">
                            coming Soon
                            <Timer className="mt-3" height={100} width={100}/>
                        </div>
                    </div>


                </div>
                {/* Buttons */}
                <div className="mt-8 mb-2 flex justify-between mx-8">
                    <button
                        type="button"
                        className=" bg-gradient-to-r from-[#e7e7e7] to-[#ffffff] border-2 text-black px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-[#e1e2e4] hover:to-[#f8fafc] hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Back to Product Page
                    </button>
                    <button

                        type="button"
                        className=" bg-gradient-to-r ml-auto from-[#e7e7e7] to-[#ffffff] border-2 text-black px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-[#e1e2e4] hover:to-[#f8fafc] hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Skip Counter Offer
                    </button>
                    <button

                        type="button"
                        className=" ml-8 bg-gradient-to-r from-[#5e5959] to-[black] text-white px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-gray-600 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Counter Offer
                    </button>
                </div>
            </div>

        </div>
    );
}

