import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, User, Eye, EyeOff, ArrowRight, Check, Loader2, UserCircle, X } from 'lucide-react';
import { useBlogAuth } from '../context/BlogAuthContext';
import { blogAuthService } from '../services/blog-portal.service';

/**
 * BlogLoginPage - Split-screen editorial login with SSO support
 *
 * Layout:
 * - Left: Dark earth brown with giant "Trusted by Traders Worldwide" headline
 * - Right: Paper texture with login form
 *
 * SSO Flow (NEW):
 * - On load, check for active Breyus session
 * - If found, show profile preview with "Yes, that's me" / "Not me" buttons
 * - "Yes, that's me" = instant login without OTP
 * - "Not me" = show normal login tabs
 *
 * Two login flows:
 * 1. "I'm a Breyus Member" - OTP-based login (no password needed)
 * 2. "I'm a New Reader" - Standard email/password login
 */
export function BlogLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, loginWithBreyusOtp, loginWithSSO } = useBlogAuth();

  // SSO State
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [ssoProfile, setSsoProfile] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    avatar?: string;
  } | null>(null);
  const [showSsoPreview, setShowSsoPreview] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/blog';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Check for active Breyus session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const result = await blogAuthService.checkBreyusSession();
        if (result.hasSession && result.profile) {
          setSsoProfile(result.profile);
          setShowSsoPreview(true);
        }
      } catch (error) {
        // Session check failed, show normal login
        console.debug('No active Breyus session');
      } finally {
        setIsCheckingSession(false);
      }
    };

    if (!isAuthenticated) {
      checkSession();
    } else {
      setIsCheckingSession(false);
    }
  }, [isAuthenticated]);

  // State
  const [activeTab, setActiveTab] = useState<'breyus' | 'reader'>('breyus');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'login'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset state when switching tabs
  useEffect(() => {
    setEmail('');
    setPassword('');
    setOtp('');
    setStep('email');
    setError('');
    setSuccess('');
  }, [activeTab]);

  // Handle SSO "Yes, that's me" click
  const handleSsoConfirm = async () => {
    setIsLoading(true);
    setError('');

    try {
      await loginWithSSO();
      // Redirect handled by useEffect
    } catch (err: any) {
      setError(err.response?.data?.message || 'SSO login failed. Please try again.');
      setShowSsoPreview(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle SSO "Not me" click
  const handleSsoDecline = () => {
    setShowSsoPreview(false);
    setSsoProfile(null);
  };

  // Handle Breyus member OTP request
  const handleBreyusOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await blogAuthService.requestBreyusOtp({ email });
      setSuccess('OTP sent to your email!');
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Breyus OTP verification
  const handleBreyusOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginWithBreyusOtp({ email, otp });
      // Redirect handled by useEffect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reader login
  const handleReaderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      // Redirect handled by useEffect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="auth-split-container">
        <div className="auth-split-branding hidden md:flex" />
        <div className="auth-split-form">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-gray-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-split-container">
      {/* Left Side - Branding */}
      <div className="auth-split-branding hidden md:flex">
        {/* Giant Headline */}
        <h1 className="auth-giant-headline">
          Trusted by<br />Traders<br />Worldwide
        </h1>

        {/* Stats */}
        <div className="auth-stats">
          <div className="auth-stat">
            <div className="auth-stat-number">500+</div>
            <div className="auth-stat-label">Active Traders</div>
          </div>
          <div className="auth-stat">
            <div className="auth-stat-number">50+</div>
            <div className="auth-stat-label">Countries</div>
          </div>
        </div>

        {/* Back to blog link */}
        <Link
          to="/blog"
          className="absolute bottom-8 left-8 text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          ← Back to Blog
        </Link>
      </div>

      {/* Right Side - Form */}
      <div className="auth-split-form">
        <div className="w-full max-w-md">
          {/* Mobile Header (hidden on desktop) */}
          <div className="md:hidden text-center mb-8">
            <Link to="/blog" className="inline-flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-[#1A1A2E]">Breyus</span>
              <span className="text-lg text-gray-400">Blog</span>
            </Link>
          </div>

          {/* SSO Profile Preview */}
          {showSsoPreview && ssoProfile && (
            <div className="animate-fadeIn">
              <div className="mb-8">
                <Link to="/blog" className="hidden md:inline-flex items-center space-x-2 mb-6">
                  <span className="text-2xl font-bold text-[#1A1A2E]">Breyus</span>
                  <span className="text-lg text-gray-400">Blog</span>
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Welcome Back!</h1>
                <p className="text-gray-500 mt-1">We found your Breyus account</p>
              </div>

              {/* Profile Card */}
              <div className="relative bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-4">
                  {ssoProfile.avatar ? (
                    <img
                      src={ssoProfile.avatar}
                      alt={`${ssoProfile.firstName}'s avatar`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B8860B] to-[#9A7209] flex items-center justify-center">
                      <UserCircle className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#1A1A2E]">
                      {ssoProfile.firstName} {ssoProfile.lastName}
                    </h2>
                    <p className="text-gray-600 text-sm">{ssoProfile.email}</p>
                    {ssoProfile.companyName && (
                      <p className="text-gray-400 text-sm">{ssoProfile.companyName}</p>
                    )}
                  </div>
                </div>

                {/* Verified Badge */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <Check className="w-3 h-3" />
                    Breyus Member
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium animate-fadeIn">
                  {error}
                </div>
              )}

              {/* SSO Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSsoConfirm}
                  disabled={isLoading}
                  className="w-full btn-editorial disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Yes, that's me — Continue
                    </>
                  )}
                </button>

                <button
                  onClick={handleSsoDecline}
                  disabled={isLoading}
                  className="w-full py-3 px-4 text-gray-600 hover:text-[#1A1A2E] font-medium transition-colors flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Not me — Use different account
                </button>
              </div>

              {/* Benefits */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="space-y-2">
                  {['Instant login — no OTP required', 'Access member-only content', 'Your reading history synced'].map((text, i) => (
                    <div key={i} className="flex items-center space-x-3 text-sm text-gray-500">
                      <div className="h-5 w-5 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-sage-600" />
                      </div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Regular Login Form (when no SSO or user declined) */}
          {!showSsoPreview && (
            <>
              {/* Header */}
              <div className="mb-8">
                <Link to="/blog" className="hidden md:inline-flex items-center space-x-2 mb-6">
                  <span className="text-2xl font-bold text-[#1A1A2E]">Breyus</span>
                  <span className="text-lg text-gray-400">Blog</span>
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Welcome Back</h1>
                <p className="text-gray-500 mt-1">Access exclusive content and features</p>
              </div>

              {/* Tab Selector */}
              <div className="flex mb-6 bg-gray-50 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('breyus')}
                  className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-semibold transition-all duration-200 ${
                    activeTab === 'breyus'
                      ? 'bg-white text-[#1A1A2E] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Breyus Member
                </button>
                <button
                  onClick={() => setActiveTab('reader')}
                  className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-semibold transition-all duration-200 ${
                    activeTab === 'reader'
                      ? 'bg-white text-[#1A1A2E] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="h-4 w-4 mr-2" />
                  New Reader
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium animate-fadeIn">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-4 bg-sage-50 border border-sage-200 rounded-lg text-sage-700 text-sm font-medium animate-fadeIn">
                  {success}
                </div>
              )}

              {/* Breyus Member Form */}
              {activeTab === 'breyus' && (
                <div className="animate-fadeIn">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-11 w-11 rounded-lg bg-[#1A1A2E] flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#1A1A2E]">I'm a Breyus Member</h2>
                      <p className="text-sm text-gray-400">Quick login with OTP</p>
                    </div>
                  </div>

                  {step === 'email' && (
                    <form onSubmit={handleBreyusOtpRequest} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@company.com"
                          required
                          className="input-editorial w-full"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full btn-editorial disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            Send OTP
                            <ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {step === 'otp' && (
                    <form onSubmit={handleBreyusOtpVerify} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter OTP
                        </label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          maxLength={6}
                          required
                          className="input-editorial w-full text-center text-2xl tracking-[0.5em] font-bold"
                        />
                        <p className="text-sm text-gray-400 mt-2 text-center">
                          We sent a 6-digit code to <span className="font-medium text-gray-600">{email}</span>
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || otp.length < 6}
                        className="w-full btn-editorial disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            Verify & Login
                            <Check className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStep('email');
                          setOtp('');
                          setSuccess('');
                        }}
                        className="w-full py-2.5 text-gray-500 hover:text-gray-700 font-medium transition-colors"
                      >
                        Use different email
                      </button>
                    </form>
                  )}

                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="space-y-2">
                      {['No password needed', 'Instant access to member-only content', 'Same account as your Breyus platform'].map((text, i) => (
                        <div key={i} className="flex items-center space-x-3 text-sm text-gray-500">
                          <div className="h-5 w-5 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-sage-600" />
                          </div>
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* New Reader Form */}
              {activeTab === 'reader' && (
                <div className="animate-fadeIn">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-11 w-11 rounded-lg bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#1A1A2E]">I'm a New Reader</h2>
                      <p className="text-sm text-gray-400">Login or create an account</p>
                    </div>
                  </div>

                  <form onSubmit={handleReaderLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="input-editorial w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                          className="input-editorial w-full pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Link
                        to="/blog/forgot-password"
                        className="text-sm text-[#B8860B] hover:text-[#9A7209] font-medium transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full btn-editorial disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        'Login'
                      )}
                    </button>
                  </form>

                  <div className="mt-5 text-center">
                    <span className="text-gray-400">Don't have an account?</span>{' '}
                    <Link to="/blog/signup" className="text-[#B8860B] hover:text-[#9A7209] font-semibold transition-colors">
                      Sign up
                    </Link>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-gray-500" />
                      </div>
                      <span>Access public blogs, like & comment</span>
                    </div>
                    <div className="mt-4 p-3 bg-[#B8860B]/10 rounded-lg border border-[#B8860B]/20">
                      <p className="text-sm text-gray-600">
                        Want member-only content?{' '}
                        <a href="/onboarding" className="font-bold text-[#B8860B] hover:underline">
                          Become a Breyus member →
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Mobile back link */}
          <div className="mt-8 text-center md:hidden">
            <Link
              to="/blog"
              className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              ← Back to Blog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlogLoginPage;
