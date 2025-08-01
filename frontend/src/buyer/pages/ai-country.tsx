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
        <Link className="mx-4 text-black my-auto" to={"/conact us"}>
          Contact Us
        </Link>
      </div>
    </div>
  );
};

const CountryInputBox = ({ commodity }: { commodity: string }) => {
  const [country, setCountry] = useState("");
  const navigate = useNavigate();

  const handleNext = () => {
    if (!country.trim()) {
      alert("Please enter a country to proceed."); // User feedback for empty input
      return;
    }
    navigate("/buyer/ai-port", { state: { commodity, country } });
  };

  return (
    <div className="relative w-full max-w-xl my-4">
      <textarea
        value={country}
        onChange={e => setCountry(e.target.value)}
        placeholder="Enter country"
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

const Section = ({ commodity }: { commodity: string }) => {
  return (
    <div className="absolute top-[30%] left-[35%]">
      <h1 className="text-center">
        <span className="font-extrabold text-7xl">Commodity AI :</span> <br />
        <span className="font-bold text-4xl leading-relaxed">
          Predict - Prosper - Profit
        </span>{" "}
        <br />
        <span className="text-gray-600">Commodity: {commodity}</span> <br />
        <span className="text-gray-600">Enter your country below</span> <br />
      </h1>
      <CountryInputBox commodity={commodity} />
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

const CountryPage = () => {
  const location = useLocation();
  const commodity = location.state?.commodity || "";

  // Handle case where commodity might be missing (e.g., direct navigation)
  if (!commodity) {
    // You could redirect to the commodity input page or show an error
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500">Error: Commodity not provided. Please go back and enter it.</p>
        <Link to="/buyer/ai" className="mt-4 text-blue-600 hover:underline">Go to Commodity Input</Link>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <AnimatedBackground />
      <Section commodity={commodity} />
    </div>
  );
};

export default CountryPage;