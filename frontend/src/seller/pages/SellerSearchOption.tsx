import React, { ReactNode, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import AiAnimation from "../../assets/ai/ai-animation.svg";
import BreyusLogo from "../../assets/Logos/full-logo.svg";

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <div className="border-b border-gray-200 px-2 py-2 flex">
      <div id="logo" className="my-auto">
        <img className="h-auto w-[180px]" src={BreyusLogo} alt="Breyus" />
      </div>
      <div
        id="nav"
        className="flex w-fit justify-between my-auto mx-auto font-[500] xl:text-lg lg:text-md md:text-sm"
      >
        <Link className="mx-4 text-black my-auto" to={"/features"}>
          Features
        </Link>
        <Link className="mx-4 text-black my-auto" to={"/impact"}>
          Impact
        </Link>
        <Link className="mx-4 text-black my-auto" to={"/contact-us"}> {/* Corrected typo: conact us to contact-us */}
          Contact Us
        </Link>
      </div>
      <div className="flex my-auto">
        <button className="px-4 py-2 mr-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100">Sign Up</button>
        <button className="px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800">Login</button>
      </div>
    </div>
  );
};

const PortInputBox = ({ commodity, country }: { commodity: string; country: string }) => {
  const [port, setPort] = useState("");
  const navigate = useNavigate();

  const handleNext = async () => {
    if (!port.trim()) {
      alert("Please enter a port to proceed.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/aiz.px", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commodity, country, port }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        navigate("/buyer/ai-result", { state: { result: null, error: `Backend error: ${errorText}` } });
        return;
      }
      const result = await response.json();
      navigate("/buyer/ai-result", { state: { result, error: null } });
    } catch (err) {
      navigate("/buyer/ai-result", { state: { result: null, error: `Network error: ${err}`} });
    }
  };

  return (
    <div className="relative w-full max-w-xl my-4">
      <textarea
        value={port}
        onChange={e => setPort(e.target.value)}
        placeholder="Enter nearest port"
        className="w-full h-[200px] resize-none overflow-y-auto px-4 py-6 pr-20 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none "
      />
      <button
        onClick={handleNext}
        className="absolute bottom-4 right-6 bg-black text-white text-sm px-4 py-1 rounded hover:bg-gray-800"
      >
        Next
      </button>
    </div>
  );
};

// This component will be the initial content seen on the landing page
const HomePageContent = () => {
  const navigate = useNavigate();

  const handleSearchBuyerForProduct = () => {
    // Navigate to the page where user inputs commodity and country for buyer search
    navigate("/buyer/ai");
  };

  const handleSearchAnyBuyer = () => {
    // Navigate to the seller search inputs page
    navigate("/seller/search-input");
  };

  return (
    <div className="absolute top-[30%] left-1/2 -translate-x-1/2 text-center w-full max-w-2xl">
      <h1 className="text-center">
        <span className="font-extrabold text-7xl">Commodity AI :</span> <br />
        <span className="font-bold text-4xl leading-relaxed">
          Predict - Prosper - Profit
        </span>{" "}
        <br />
        <span className="text-gray-600">Unlock the Future of Smart Commodity Trading</span>
      </h1>
      <div className="mt-8 p-6 bg-white rounded-lg shadow-lg flex flex-col items-center space-y-4">
        <button
          onClick={handleSearchBuyerForProduct}
          className="w-full max-w-md bg-black text-white py-4 rounded-md text-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Search Buyer for your product
        </button>
        <button
          onClick={handleSearchAnyBuyer}
          className="w-full max-w-md bg-black text-white py-4 rounded-md text-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Search any Buyer
        </button>
      </div>
    </div>
  );
};

const Section = ({ commodity, country }: { commodity: string; country: string }) => {
  return (
    <div className="absolute top-[30%] left-1/2 -translate-x-1/2 text-center w-full max-w-2xl">
      <h1 className="text-center">
        <span className="font-extrabold text-7xl">Commodity AI :</span> <br />
        <span className="font-bold text-4xl leading-relaxed">
          Predict - Prosper - Profit
        </span>{" "}
        <br />
        <span className="text-gray-600">Country: {country}</span> <br />
        <span className="text-gray-600">Commodity: {commodity}</span> <br />
        <span className="text-gray-600">Enter your nearest port below</span> <br />
      </h1>
      <PortInputBox commodity={commodity} country={country} />
    </div>
  );
};

const AnimatedBackground = () => (
  <div className="w-fit mx-auto relative">
    <motion.img
      src={AiAnimation}
      alt="Rotating Icon"
      animate={{ rotate: 360 }}
      transition={{
        repeat: Infinity,
        duration: 0,
        ease: "linear",
      }}
      className="flex h-[90vh] w-[90vh] relative"
    />
  </div>
);

const PortPage = () => {
  const location = useLocation();
  const { commodity, country } = location.state || {};

  // Handle cases where commodity or country might be missing (e.g., direct navigation)
  if (!commodity || !country) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500">Error: Commodity or Country not provided. Please go back.</p>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">Go to Home Page</Link>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <AnimatedBackground />
      <Section commodity={commodity} country={country} />
    </div>
  );
};

// This will be your main landing page component
const SellerSearchOption = () => {
  return (
    <div>
      <Navbar />
      <AnimatedBackground />
      <HomePageContent />
    </div>
  );
};

export default SellerSearchOption;