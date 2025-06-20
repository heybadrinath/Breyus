import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import authService from "../services/auth.service";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(300); // 5 minutes timer

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOtpSent && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpSent, resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("password") ? value.replace(/\s/g, "") : value,
    }));
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!validatePassword(formData.password)) {
      setError(
        "Password must be at least 8 characters, include an uppercase letter, a number, and a special character."
      );
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("https://breyus.com/backend/auth/register", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: "buyer",
      });

      if (response.data.success) {
        setIsOtpSent(true);
        setResendTimer(300);
      } else {
        setError(response.data.message || "Failed to register.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Error during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authService.verifyRegistrationOtp(formData.email, otp);

      if (response.success) {
        console.log("Registration successful, user logged in automatically");
        navigate("/buyer/homepage");
      } else {
        setError(response.message || "Invalid OTP. Please try again.");
      }
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setError(err.response?.data?.message || "Error verifying OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-white text-black">
      {/* Left Section - Sign In Form */}
      <div className="w-1/2 h-full flex flex-col justify-center items-center bg-white px-16 shadow-lg">
        <div className="absolute top-6 left-8 flex items-center">
          <img src="/Logo.png" alt="Breyus Logo" className="h-10 w-10 mr-2" />
          <h2 className="text-2xl font-bold">Breyus</h2>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">{isOtpSent ? "Verify OTP" : "Sign Up"}</h2>
          <p className="text-gray-600 mb-6">
            {isOtpSent ? "Enter the OTP sent to your email." : "Fill in the details to continue."}
          </p>

          {!isOtpSent ? (
            <form onSubmit={handleRegister} className="w-full">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black"
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black"
                    required
                  />
                </div>
              </div>

              <label className="block text-gray-700 mt-3">E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black"
                required
              />

              <label className="block text-gray-700 mt-3">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="********"
                  className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              <label className="block text-gray-700 mt-3">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="********"
                  className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

              <button
                type="submit"
                className={`mt-6 w-full py-3 rounded-full ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white"}`}
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="w-full">
              <label className="block text-gray-700 mt-3">Enter OTP</label>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Write OTP Here"
                className="w-full border border-gray-400 p-3 rounded mt-1 bg-white text-black"
                required
              />

              {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

              <button
                type="submit"
                className={`mt-6 w-full py-3 rounded-full ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white"}`}
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={handleRegister}
                disabled={resendTimer > 0}
                className="mt-3 text-gray-600 text-sm"
              >
                Resend OTP ({resendTimer}s)
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-gray-600">
            Already have an account?{" "}
            <Link to="/buyer/signin" className="text-blue-600">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right Section - Image */}
      <div className="w-1/2 h-full hidden lg:flex items-center justify-center">
        <img src="/assets/side-photo.png" alt="Side Illustration" className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

export default Signup;