import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { login, validateOtp } from '../services/login.service';


const Login: React.FC = () => {
  const navigate = useNavigate();
  // Add this useEffect to check login status on mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch(
          process.env.REACT_APP_BACKEND_URL + "/auth/validate-cookie",
          { credentials: "include" }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            if (data.role === "Seller and Buyer") {
              navigate("/select-role");
            } else if (data.role === "Buyer") {
              navigate("/buyer/homepage");
            } else if (data.role === "Seller") {
              navigate("/seller/dashboard");
            }
          }
        }
      } catch (err) {
        // Not logged in or error, do nothing
      }
    };
    checkLoginStatus();
  }, [navigate]);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(300); // 5 minutes timer

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOtpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpSent, resendTimer]);

  //logic to handle form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "password" ? value.replace(/\s/g, "") : value,
    }));
    if (error) setError("");
  };

  //logic to handle login services

  const handlelogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await login(formData.email, formData.password);
      setIsOtpSent(true);
      setResendTimer(300);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleverifyOtp = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await validateOtp(formData.email, otp);
      setIsOtpSent(true);
      if (response.role === "Buyer") {
        navigate('/buyer/homepage');
      } else if (response.role === "Seller") {
        navigate('/seller/dashboard');
      } else {
        navigate('/select-role');
      }
      // navigate('/');
      // console.log("OTP Validation Response: ", response.role);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Login failed. Please try again. ");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen bg-white text-black">
      {/* Left Section */}
      <div className="w-1/2 h-full flex flex-col justify-center items-center bg-white px-16 shadow-lg">
        <div className="absolute top-6 left-8 flex items-center">
          <img src="/Logo.png" alt="Breyus Logo" className="h-10 w-10 mr-2" />
          <h2 className="text-2xl font-bold">Breyus</h2>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">{isOtpSent ? "Enter OTP" : "Sign In"}</h2>
          <p className="text-gray-600 mb-6">
            {isOtpSent ? "We've sent an OTP to your email." : "Fill the fields to continue."}
          </p>

          {!isOtpSent ? (
            // login form
            <form onSubmit={(e) => e.preventDefault()} className="w-full">
              <label className="block text-gray-700">E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none"
                required
              />

              <label className="block mt-3 text-gray-700">Password</label>
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="********"
                  className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-4 text-gray-500 hover:text-black"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

              <div className="text-right text-sm mt-2">
                <Link to="/buyer/forgot-password" className="text-gray-500 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className={`mt-6 w-full bg-black text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-800 shadow-md ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handlelogin}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </button>

              {/* Don't have an account? Sign up */}
              <div className="text-center text-sm mt-4">
                Don't have an account?{" "}
                <Link to="/onboarding" className="text-blue-500 hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          ) : (
            // otp form
            <form onSubmit={(e) => { e.preventDefault() }} className="w-full">
              <label className="block text-gray-700">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none"
                maxLength={6}
                required
              />

              {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

              <button
                type="submit"
                className="mt-4 w-full bg-green-600 text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-green-700 shadow-md"
                onClick={handleverifyOtp}
              >
                Verify OTP
              </button>

              <button
                type="button"
                className={`mt-4 w-full bg-gray-600 text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-700 shadow-md ${resendTimer > 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                disabled={resendTimer > 0}
              // onClick={handleSendOtp}
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Right Section (Image) */}
      <div className="w-1/2 h-full hidden lg:flex items-center justify-center">
        <img src="/assets/side-photo.png" alt="Side Illustration" className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

export { Login };
