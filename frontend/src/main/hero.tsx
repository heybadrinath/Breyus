import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-6">Welcome to Breyus</h1>
      <div className="space-x-4">
        <button
          onClick={() => navigate("/buyer/signin")}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg"
        >
          I'm a Buyer
        </button>
        <button
          onClick={() => navigate("/seller/signin")}
          className="px-6 py-2 bg-green-500 text-white rounded-lg"
        >
          I'm a Seller
        </button>
      </div>
    </div>
  );
};

export default Hero;
