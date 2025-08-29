import React from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";


const ThankYou = () => {

    const navigate = useNavigate();
    return (
        <div className="w-screen h-screen flex">
            <div className="w-fit h-fit py-20 px-16 border-gray-200 shadow-sm border-2 rounded-lg m-auto flex flex-col">
                <h1 className="text-center text-4xl font-bold text-gray-800">Thank You!!</h1>
                <h2 className="text-center text-2xl font-semibold text-gray-800">Your purchase request has been sent Successfully</h2>

                <p className="mt-8 text-center text-sm font-semibold">The purchase order will be enabled once your request is accepted.</p>
                <div className="mx-auto flex w-fit">
                    <div className="my-auto mx-2"><Mail className="my-auto" /></div>
                    <p className="text-xs">An email has been sent regarding your purchase request.<br />  Please check your inbox for further details.</p>
                </div>

                <button onClick={() => navigate('/buyer/trade')} className="border w-fit px-3 py-1 font-normal ml-auto mt-20 border-gray-800 rounded-lg">Purchase Request Status</button>
            </div>
        </div>
    );
};

export default ThankYou;