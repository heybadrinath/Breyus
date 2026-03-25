import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Loader2, Check, Key } from 'lucide-react';
import { blogAuthService } from '../services/blog-portal.service';

/**
 * BlogForgotPasswordPage - Password reset flow for blog portal users
 *
 * Two-step flow:
 * 1. Enter email to receive OTP
 * 2. Enter OTP and new password to reset
 */
export function BlogForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle email submission
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await blogAuthService.forgotPassword(email);
      setSuccess('OTP sent to your email!');
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await blogAuthService.resetPassword(email, otp, newPassword);
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/blog/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/blog" className="inline-flex items-center space-x-2 mb-4">
            <span className="text-3xl font-bold text-[#1A1A2E]">Breyus</span>
            <span className="text-xl text-gray-500">Blog</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-1">
            {step === 'email'
              ? "Enter your email to receive a reset code"
              : "Enter the code and your new password"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center">
            <Check className="h-4 w-4 mr-2" />
            {success}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          {step === 'email' ? (
            /* Step 1: Email */
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 outline-none transition-all"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#1A1A2E] text-white rounded-lg font-medium hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          ) : (
            /* Step 2: OTP + New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reset Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 outline-none transition-all text-center text-2xl tracking-widest"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 outline-none transition-all"
                  />
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full py-3 bg-[#1A1A2E] text-white rounded-lg font-medium hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Reset Password'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setSuccess('');
                }}
                className="w-full py-2 text-gray-600 hover:text-gray-900"
              >
                Use different email
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <Link
              to="/blog/login"
              className="inline-flex items-center text-[#B8860B] hover:text-[#9A7209] font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>

        {/* Back to Blog */}
        <div className="mt-6 text-center">
          <Link to="/blog" className="text-gray-500 hover:text-gray-700">
            ← Back to Blog
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BlogForgotPasswordPage;
