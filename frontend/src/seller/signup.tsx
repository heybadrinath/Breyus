import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Signup = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "password" || name === "confirmPassword") {
      setFormData({ ...formData, [name]: value.replace(/\s/g, "") });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (error) setError("");
  };

  const validatePassword = (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!validatePassword(formData.password)) {
      setError("Password does not meet requirements!");
      return;
    }

    setShowOTP(true);
    setResendTimer(300); // Start 5-minute cooldown for resend OTP
  };

  return (
    <div className="flex h-screen w-screen bg-white text-black">
      {/* Left: Form Section */}
      <div className="w-1/2 h-full flex flex-col justify-center items-center bg-white px-16 shadow-lg">
        <div className="absolute top-6 left-8 flex items-center">
          <Link to="#">
            <img src="/Logo.png" alt="Breyus Logo" className="h-10 w-10 mr-2" />
          </Link>
          <h2 className="text-2xl font-bold">Breyus</h2>
        </div>

        <div className="w-full max-w-md">
          {!showOTP ? (
            <>
              <h2 className="text-3xl font-bold mb-2">Sign Up</h2>
              <p className="text-gray-600 mb-6">Fill the fields to continue.</p>

              <form onSubmit={handleSubmit} className="w-full">
                <label className="block text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your Company Name"
                  className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none"
                  required
                />

                <label className="block mt-3 text-gray-700">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none"
                  required
                />

                <label className="block mt-2 text-gray-700">Password</label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="8+ chars, 1 uppercase, 1 number, 1 special char"
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

                <label className="block mt-3 text-gray-700">Confirm Password</label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-4 text-gray-500 hover:text-black"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>

                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

                <button
                  type="submit"
                  className="mt-6 w-full bg-black text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-800 shadow-md"
                >
                  Sign Up
                </button>
              </form>

              <p className="mt-6 text-gray-500 text-center">
                Already have an account?{" "}
                <Link to="/seller/signin" className="text-black font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* OTP Verification Section */}
              <h2 className="text-3xl font-bold mb-2">Verify OTP</h2>
              <p className="text-gray-600 mb-6">Enter the OTP sent to your email.</p>

              <label className="block text-gray-700">OTP</label>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none"
                required
              />

              <button
                type="button"
                onClick={() => console.log("OTP Verified:", otp)}
                className="mt-3 w-full bg-gray-700 text-white py-2 rounded-full text-sm font-semibold transition-all duration-300 hover:bg-gray-800 shadow-md"
              >
                Verify OTP
              </button>

              {resendTimer > 0 ? (
                <p className="mt-3 text-gray-500 text-center">
                  Resend OTP in {resendTimer} sec
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setResendTimer(300)}
                  className="mt-2 text-black font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right: Image Section */}
      <div className="w-1/2 h-full">
        <img src="/assets/side-photo2.png" alt="Side Art" className="w-full h-full object-auto" />
      </div>
    </div>
  );
};

export default Signup;
