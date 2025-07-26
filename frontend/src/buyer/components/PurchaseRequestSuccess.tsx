import React from "react";


const PurchaseRequestSuccess: React.FC = () => (
    <div>
        <div className="w-full flex flex-col items-center min-h-screen bg-gray-50 py-12 h-100vh">

            <div className="w-full max-w-4xl my-auto h-full">
                <div className="w-fit rounded-xl shadow-xl p-10 mt-[-60px] h-[50vh] min-h-[400px] w-max-[900px] z-10 relative bg-white flex flex-col items-center">
                    <h1 className="text-4xl font-bold text-center mb-4">Thank you!!</h1>
                    <h2 className="text-2xl font-semibold text-center mb-6">
                        Your purchase request has been sent Successfully
                    </h2>
                    <div className="text-center mb-8">
                        <div className="font-semibold mb-2">
                            The purchase order will be enabled once your request is accepted.
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-700">
                            <span>
                                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path d="M2 6.5A2.5 2.5 0 014.5 4h15A2.5 2.5 0 0122 6.5v11a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 17.5v-11z" stroke="#222" strokeWidth="1.5" />
                                    <path d="M2 7l10 7 10-7" stroke="#222" strokeWidth="1.5" />
                                </svg>
                            </span>
                            <span>
                                An email has been sent to your registered account regarding your purchase request. Please check your inbox for further details.
                            </span>
                        </div>
                    </div>
                    <div className="flex w-full justify-between mt-auto ">
                        <button className="border border-black px-6 py-2 rounded shadow" type="button">
                            Ask queries
                        </button>
                        <button className="border border-black px-6 py-2 rounded shadow" type="button" onClick={() => window.location.href = "/buyer/trade"}>
                            Check Status
                        </button>
                    </div>
                </div>
            </div>
        </div>

    </div>
);

export default PurchaseRequestSuccess;
