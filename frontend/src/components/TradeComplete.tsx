import React from "react";
import { useNavigate } from "react-router-dom";

interface TradeCompleteProps {
    isSeller: boolean;
}

const TradeComplete: React.FC<TradeCompleteProps> = ({ isSeller }) => {
    const navigate = useNavigate();

    const handleExplore = () => {
        if (isSeller) {
            navigate('/seller/dashboard');
        } else {
            navigate('/buyer/homepage');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-12 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Thank you!!
                </h1>
                <p className="text-xl text-gray-700 mb-6">
                    for trading with us, leverage more ai and smart trading now
                </p>
                <p className="text-gray-600 mb-12">
                    {isSeller
                        ? "If any inquiry from buyer regarding bill of lading you can clarify here through our chat box"
                        : "If any inquiry Verify your Bill of lading with seller through our chat box"
                    }
                </p>
                <button
                    onClick={handleExplore}
                    className="px-8 py-3 bg-[#0076D3] text-white rounded-lg hover:bg-[#0066b8] transition-colors font-medium"
                >
                    {isSeller ? "Explore more buyers" : "Explore new trades"}
                </button>
            </div>
        </div>
    );
};

export default TradeComplete;
