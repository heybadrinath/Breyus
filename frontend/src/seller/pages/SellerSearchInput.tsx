import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AiAnimation from "../../assets/ai/ai-animation.svg";

const CombinedForm = () => {
  const [step, setStep] = useState(1);
  const [commodity, setCommodity] = useState("");
  const [country, setCountry] = useState("");
  const [port, setPort] = useState("");
  const navigate = useNavigate();

  // Refs for input fields to focus them automatically
  const commodityInputRef = useRef<HTMLInputElement>(null);
  const countryInputRef = useRef<HTMLInputElement>(null);
  const portInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on the current input field
  useEffect(() => {
    if (step === 1 && commodityInputRef.current) {
      commodityInputRef.current.focus();
    } else if (step === 2 && countryInputRef.current) {
      countryInputRef.current.focus();
    } else if (step === 3 && portInputRef.current) {
      portInputRef.current.focus();
    }
  }, [step]);

  // Use onKeyDown instead of onKeyPress for React 18+
  const handleEnterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdvanceStep();
    }
  };

  const handleAdvanceStep = () => {
    if (step === 1) {
      if (!commodity.trim()) {
        alert("Please tell us what commodity you're looking for.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!country.trim()) {
        alert("Please specify the country.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!commodity.trim() || !country.trim()) {
      alert("Please fill all required fields before searching.");
      return;
    }
    // Navigate to results page with search parameters
    // The results page will handle the actual API call
    navigate("/seller/search-result", {
      state: {
        commodity: commodity.trim(),
        country: country.trim(),
        port: port.trim() || undefined,
      }
    });
  };

  const handleUniqueCommodity = () => {
    alert("Unique Commodity button clicked! Add your specific logic here.");
  };

  return (
    <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-10">
      <h1 className="text-center mb-8">
        <span className="font-extrabold text-6xl">Commodity AI :</span> <br />
        <span className="font-bold text-3xl leading-relaxed">Predict - Prosper - Profit</span><br />
        <span className="text-gray-600">Unlock the Future of Smart Commodity Trading</span>
      </h1>

      <div className="relative w-full p-8 border border-gray-300 rounded-lg shadow-md bg-white min-h-[400px] flex flex-col justify-between">
        {/* Questions and Answers */}
        <div className="flex-grow">
          {/* Commodity Question */}
          <div className="flex items-center mb-6 text-xl">
            <span className="w-1/2 text-gray-700 font-medium">What are you looking to buy?</span>
            <div className="w-1/2 text-right">
              {step > 1 ? (
                <span className="text-gray-900 font-semibold">{commodity}</span>
              ) : (
                <input
                  ref={commodityInputRef}
                  type="text"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  onKeyDown={handleEnterPress}
                  placeholder="e.g., Iron"
                  className="w-full px-2 py-1 border-b border-gray-300 focus:outline-none focus:border-blue-500 text-lg text-right"
                />
              )}
            </div>
          </div>

          {/* Country Question */}
          {step >= 2 && (
            <div className="flex items-center mb-6 text-xl">
              <span className="w-1/2 text-gray-700 font-medium">Which country would you prefer to buy from?</span>
              <div className="w-1/2 text-right">
                {step > 2 ? (
                  <span className="text-gray-900 font-semibold">{country}</span>
                ) : (
                  <input
                    ref={countryInputRef}
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    onKeyDown={handleEnterPress}
                    placeholder="e.g., India"
                    className="w-full px-2 py-1 border-b border-gray-300 focus:outline-none focus:border-blue-500 text-lg text-right"
                  />
                )}
              </div>
            </div>
          )}

          {/* Port Question */}
          {step >= 3 && (
            <div className="flex items-center mb-6 text-xl">
              <span className="w-1/2 text-gray-700 font-medium">What's your nearest city or port for delivery?</span>
              <div className="w-1/2 text-right">
                {step > 3 ? (
                  <span className="text-gray-900 font-semibold">{port}</span>
                ) : (
                  <input
                    ref={portInputRef}
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    onKeyDown={handleEnterPress}
                    placeholder="e.g., Mumbai"
                    className="w-full px-2 py-1 border-b border-gray-300 focus:outline-none focus:border-blue-500 text-lg text-right"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Buttons at the bottom */}
        <div className="flex justify-between items-center mt-auto pt-6 border-t border-gray-200">
          {step === 3 ? (
            <>
              <button
                onClick={handleUniqueCommodity}
                className="bg-black text-white text-md px-6 py-3 rounded hover:bg-gray-800"
              >
                🔒 Unique Commodity
              </button>
              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(prevStep => Math.max(1, prevStep - 1))}
                  className="bg-gray-600 text-white text-md px-6 py-3 rounded hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-black text-white text-lg px-10 py-4 rounded hover:bg-gray-800"
                >
                  Search
                </button>
              </div>
            </>
          ) : (
            <div className="flex w-full justify-between">
              {step > 1 && (
                <button
                  onClick={() => setStep(prevStep => prevStep - 1)}
                  className="bg-gray-600 text-white text-md px-6 py-3 rounded hover:bg-gray-700"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleAdvanceStep}
                className={`bg-black text-white text-md px-6 py-3 rounded hover:bg-gray-800 ${step === 1 ? 'ml-auto' : ''}`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnimatedBackground = () => (
  <div className="w-fit mx-auto relative z-0 opacity-20">
    <motion.img
      src={AiAnimation}
      alt="Rotating Icon"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      className="flex h-[90vh] w-[90vh] relative"
    />
  </div>
);

const SellerSearchInput = () => (
  <div className="relative min-h-screen bg-gray-50 overflow-hidden">
    <AnimatedBackground />
    <CombinedForm />
  </div>
);

export default SellerSearchInput;
