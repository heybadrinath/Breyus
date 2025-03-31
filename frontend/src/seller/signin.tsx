import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import authService from "../services/auth.service";

const Signin: React.FC = () => {
  const navigate = useNavigate();
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "password" ? value.replace(/\s/g, "") : value,
    }));
    if (error) setError("");
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/auth/send-otp", {
        email: formData.email,
        password: formData.password,
        role: "seller",
      });

      if (response.data.message === "OTP sent successfully") {
        setIsOtpSent(true);
        setResendTimer(300);
      } else {
        setError(response.data.message || "Failed to send OTP.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error sending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Verifying OTP for:", formData.email);
      const response = await axios.post("http://localhost:5000/auth/verify-otp", {
        email: formData.email,
        otp,
      });

      console.log("OTP verification response:", response.data);
      if (response.data.success) {
        // Store user information and token
        if (response.data.token) {
          authService.setToken(response.data.token);
          console.log("Token stored in localStorage");
        } else {
          console.error("No token received from server");
          setError("Authentication failed: No token received");
          setIsLoading(false);
          return;
        }
        
        // Get user data from response, ensure it has a role
        const userData = response.data.user || {};
        
        if (!userData.role) {
          console.warn("No role in user data, defaulting to seller role");
          userData.role = "seller";
        }
        
        console.log("Setting user data:", userData);
        authService.setUser(userData);
        
        // Check localStorage after setting values
        console.log("After storing - localStorage check:", {
          token: localStorage.getItem('token') ? 'exists' : 'missing',
          user: localStorage.getItem('user')
        });
        
        // Check authentication status before redirect
        const isAuth = authService.isAuthenticated();
        const hasRole = authService.hasRole("seller");
        console.log("Authentication check before redirect:", { isAuth, hasRole });
        
        if (!isAuth || !hasRole) {
          console.error("Authentication validation failed after login");
          setError("Authentication failed after login. Please try again.");
          setIsLoading(false);
          return;
        }
        
        console.log("Authentication successful, redirecting to dashboard");
        navigate("/seller/dashboard");
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err: any) {
      console.error("OTP verification error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Error verifying OTP.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <form onSubmit={handleSendOtp} className="w-full">
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
                <Link to="/seller/forgot-password" className="text-gray-500 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className={`mt-6 w-full bg-black text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-800 shadow-md ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </button>

              {/* Don't have an account? Sign up */}
              <div className="text-center text-sm mt-4">
                Don't have an account?{" "}
                <Link to="/seller/signup" className="text-blue-500 hover:underline">
                  Sign up
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="w-full">
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
              >
                Verify OTP
              </button>

              <button
                type="button"
                className={`mt-4 w-full bg-gray-600 text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-700 shadow-md ${
                  resendTimer > 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={resendTimer > 0}
                onClick={handleSendOtp}
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

export default Signin;
