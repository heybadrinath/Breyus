import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import axios from "axios";

const Signin: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpVisible, setOtpVisible] = useState(false); // 👈 Added extra state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "password" ? value.replace(/\s/g, "") : value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/auth/send-otp", {
        email: formData.email,
        password: formData.password,
      });

      console.log("Send OTP Response:", response.data); // Debugging

      if (response.data.success) {
        setIsOtpSent(true);
        setOtpVisible(true); // 👈 Ensure OTP input appears
        setResendTimer(300); // 5-minute timer
      } else {
        setError(response.data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setError("Error sending OTP. Please try again.");
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/auth/verify-otp", {
        email: formData.email,
        otp,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
      } else {
        setError(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Error verifying OTP. Please try again.");
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  return (
    <div className="flex h-screen w-screen bg-white text-black">
      {/* Left Section */}
      <div className="w-1/2 h-full flex flex-col justify-center items-center bg-white px-16 shadow-lg">
        {/* Logo */}
        <div className="absolute top-6 left-8 flex items-center">
          <img src="/Logo.png" alt="Breyus Logo" className="h-10 w-10 mr-2" />
          <h2 className="text-2xl font-bold">Breyus</h2>
        </div>

        {/* Sign-In Form */}
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">Sign In</h2>
          <p className="text-gray-600 mb-6">Fill the fields to continue.</p>

          {!isOtpSent ? (
            <form onSubmit={handleSubmit} className="w-full">
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
                <Link to="/forgot-password" className="text-gray-500 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="mt-6 w-full bg-black text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-800 shadow-md"
              >
                Send OTP
              </button>
            </form>
          ) : null}

          {otpVisible && (
            <form onSubmit={handleOtpSubmit} className="w-full">
              <h3 className="text-xl font-semibold mb-2">Enter OTP</h3>
              <p className="text-gray-600 mb-4">We've sent an OTP to your email.</p>

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

              <p className="mt-3 text-sm text-gray-500 text-center">
                Didn't receive an OTP?{" "}
                <button
                  type="button"
                  className={`font-semibold ${
                    resendTimer > 0 ? "text-gray-400 cursor-not-allowed" : "text-blue-600 hover:underline"
                  }`}
                  onClick={handleSubmit}
                  disabled={resendTimer > 0}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                </button>
              </p>
            </form>
          )}

          <p className="mt-6 text-gray-500 text-center">
            Don't have an account?{" "}
            <Link to="/buyer/signup" className="text-black font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-1/2 h-full">
        <img src="/assets/side-photo.png" alt="Side Art" className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

export default Signin;
