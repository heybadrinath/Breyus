import React, { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";

// image imports
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
      {/* <div id="login-signup-btn" className="flex">
        <Button onClick={() => navigate("/buyer/signup")} className=" md:text-sm md:px-6">
          Sign Up
        </Button>
        <Button
          onClick={() => navigate("/buyer/signin")}
          className="bg-black text-white lg:text-sm md:px-6"
        >
          Login In
        </Button>
      </div> */}
    </div>
  );
};

const TradeSearchBox = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!query.trim()) return;
    navigate("/buyer/ai-product", { state: { query } });
  };

  return (
    <div className="relative w-full max-w-xl my-4">
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search People who you want to trade with?"
        className="w-full h-[200px] resize-none overflow-y-auto px-4 py-6 pr-20 border border-gray-300 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none "
      />
      <button
        onClick={handleSearch}
        className="absolute bottom-4 right-6 bg-black text-white text-sm px-4 py-1 rounded hover:bg-gray-800"
      >
        Search
      </button>
    </div>
  );
};

const Section = () => {
  return (
    <div className="absolute top-[30%] left-[35%]">
      <h1 className="text-center">
        <span className="font-extrabold text-7xl">Commodity AI :</span> <br />
        <span className="font-bold text-4xl leading-relaxed">
          Predict - Prosper - Profit
        </span>{" "}
        <br />
        <span className="text-gray-600">Unlock the Future of Smart Commodity Trading</span> <br />
      </h1>
      <TradeSearchBox />
    </div>
  );
};

export default () => (
  <div>
    <Navbar />
    <AnimatedBackground />
    <Section />
  </div>
);

// Components

type ButtonProps = {
  onClick?: () => void;
  className?: string;
  children: ReactNode;
};

const Button: React.FC<ButtonProps> = ({ onClick, className = "", children }) => (
  <button
    onClick={onClick}
    className={`${className} px-12 py-3 mx-6 my-2 border-gray-300 border rounded-xl font-semibold transition-all hover:scale-105`}
  >
    {children}
  </button>
);

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
