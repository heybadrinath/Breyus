import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/auth/forgot-password`, {
        email
      });

      // If request succeeded (status 200), show OTP input
      if (response.status === 200) {
        setIsOtpSent(true);
        setResendTimer(300);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage || "Unable to send OTP. Please check your email and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword
      });

      if (response.data.success || response.status === 200) {
        setIsPasswordReset(true);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(response.data.message || "Failed to reset password.");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage || "Invalid or expired OTP. Please check your code and try again.");
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
          {isPasswordReset ? (
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your password has been reset successfully. You will be redirected to the login page.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-2">
                {isOtpSent ? "Reset Password" : "Forgot Password"}
              </h2>
              <p className="text-gray-600 mb-6">
                {isOtpSent
                  ? "Enter the OTP sent to your email and create a new password."
                  : "Enter your email to receive a password reset OTP."}
              </p>

              {!isOtpSent ? (
                <form onSubmit={handleRequestOtp} className="w-full">
                  <label className="block text-gray-700">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none"
                    required
                  />

                  {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

                  <button
                    type="submit"
                    className={`mt-6 w-full bg-black text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-800 shadow-md ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="w-full">
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

                  <label className="block mt-3 text-gray-700">New Password</label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="********"
                      className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-4 text-gray-500 hover:text-black"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <label className="block mt-3 text-gray-700">Confirm New Password</label>
                  <div className="relative w-full">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="********"
                      className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black focus:ring-2 focus:ring-black outline-none pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-4 text-gray-500 hover:text-black"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

                  <button
                    type="submit"
                    className="mt-6 w-full bg-black text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-800 shadow-md"
                  >
                    Reset Password
                  </button>

                  <button
                    type="button"
                    className={`mt-4 w-full bg-gray-600 text-white py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:bg-gray-700 shadow-md ${
                      resendTimer > 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={resendTimer > 0}
                    onClick={handleRequestOtp}
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </form>
              )}

              <div className="text-center mt-6">
                <Link to="/login" className="text-blue-500 hover:underline">
                  Back to Login
                </Link>
              </div>
            </>
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

export default ForgotPassword; 