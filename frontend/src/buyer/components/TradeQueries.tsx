import React from "react";

interface TradeQueriesProps {
    handlestep: (step: number) => void;
    currentStep: number;
}


export const TradeQueries: React.FC<TradeQueriesProps> = ({ handlestep, currentStep }) => {
    return (
        <div className="flex flex-col my-auto mx-auto w-[50%]">
            <h1 className="text-3xl font-semibold text-black mb-3">Trade Queries</h1>
            <div className="flex flex-col w-full border-2 rounded-lg px-8 py-6 gap-y-3" >
                <div>
                    <label className="block font-medium">Which industry uses your product?</label>
                    <input
                        type="text"
                        name="industry"
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        How long have you been in the market? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="marketYears"
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        What is your market capture?
                    </label>
                    <input
                        type="text"
                        name="marketcapture"
                        className="border p-2 mt-2 w-full rounded"
                        placeholder='  %'
                    />
                </div>

                <div className="flex flex-col w-full">
                    <label className="block font-medium">
                        How many potential years this this "Company Name" trade be? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="yearsTrade"
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>


                <div>
                    <label className="block font-medium">
                        How are you using this product?
                    </label>
                    <input
                        type="number"
                        name="sellerMarketYears"
                        className="border p-2 mt-2 w-full rounded"
                    />
                </div>

                <div className="mt-8 flex justify-between">
                    <button
                        onClick={() => handlestep(currentStep - 1)}
                        type="button"
                        className=" bg-gradient-to-r from-[#e7e7e7] to-[#ffffff] border-2 text-black px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-[#e1e2e4] hover:to-[#f8fafc] hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => handlestep(currentStep + 1)}
                        type="button"
                        className=" ml-auto bg-gradient-to-r from-[#5e5959] to-[black] text-white px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-gray-600 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Next
                    </button>
                </div>

            </div>
        </div>
    )
}