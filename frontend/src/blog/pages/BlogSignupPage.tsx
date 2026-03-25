import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Eye, EyeOff, ArrowRight, Loader2, Check, Building2 } from 'lucide-react';
import { useBlogAuth } from '../context/BlogAuthContext';
import { blogAuthService } from '../services/blog-portal.service';

/**
 * BlogSignupPage - Split-screen editorial signup
 *
 * Layout:
 * - Left: Dark earth brown with giant "Join the Traders" headline
 * - Right: Paper texture with signup form
 *
 * Features:
 * - Breyus member detection with redirect prompt
 * - Area of interest selection
 * - Mobile responsive (stacks vertically)
 */
export function BlogSignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signup } = useBlogAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/blog', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    areaOfInterest: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBreyusMember, setIsBreyusMember] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Check if email is a Breyus member
  const checkEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;

    setCheckingEmail(true);
    try {
      const result = await blogAuthService.checkEmail(email);
      setIsBreyusMember(result.isBrèyusMember);
    } catch {
      setIsBreyusMember(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Check email when it changes
    if (name === 'email') {
      const timer = setTimeout(() => checkEmail(value), 500);
      return () => clearTimeout(timer);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        areaOfInterest: formData.areaOfInterest,
      });
      // Redirect handled by useEffect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-split-container">
      {/* Left Side - Branding */}
      <div className="auth-split-branding hidden md:flex">
        {/* Giant Headline */}
        <h1 className="auth-giant-headline">
          Join the<br />Global<br />Trade<br />Community
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
      <div className="auth-split-form overflow-y-auto">
        <div className="w-full max-w-md py-8 px-4 sm:px-6 lg:px-0">
          {/* Mobile Header (hidden on desktop) */}
          <div className="md:hidden text-center mb-6">
            <Link to="/blog" className="inline-flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-[#1A1A2E]">Breyus</span>
              <span className="text-lg text-gray-400">Blog</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6">
            <Link to="/blog" className="hidden md:inline-flex items-center space-x-2 mb-4">
              <span className="text-2xl font-bold text-[#1A1A2E]">Breyus</span>
              <span className="text-lg text-gray-400">Blog</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Create Your Account</h1>
            <p className="text-gray-500 mt-1">Join the Breyus Blog community</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium animate-fadeIn">
              {error}
            </div>
          )}

          {/* Breyus Member Notice */}
          {isBreyusMember && (
            <div className="mb-4 p-5 bg-[#B8860B]/10 border border-[#B8860B]/20 rounded-lg animate-fadeIn">
              <div className="flex items-start space-x-3">
                <div className="h-10 w-10 rounded-lg bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[#1A1A2E] font-bold text-lg">
                    Great news! You have a Breyus account!
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    As a Breyus member, you get instant access to ALL content with no password needed.
                  </p>
                  <Link
                    to="/blog/login"
                    className="inline-flex items-center mt-3 btn-editorial-accent !py-2 !px-4 group"
                  >
                    Continue with Breyus
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Signup Form */}
          <div className="animate-fadeIn">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-11 w-11 rounded-lg bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1A1A2E]">New Reader Account</h2>
                <p className="text-sm text-gray-400">Fill in your details below</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    required
                    className="input-editorial w-full"
                  />
                  {checkingEmail && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    required
                    className="input-editorial w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                    className="input-editorial w-full"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your Company (optional)"
                  className="input-editorial w-full"
                />
              </div>

              {/* Area of Interest */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area of Interest
                </label>
                <select
                  name="areaOfInterest"
                  value={formData.areaOfInterest}
                  onChange={handleChange}
                  className="input-editorial w-full"
                >
                  <option value="">Select an area</option>
                  <option value="commodities">Commodities Trading</option>
                  <option value="market-analysis">Market Analysis</option>
                  <option value="sustainability">Sustainability</option>
                  <option value="technology">Technology</option>
                  <option value="general">General Interest</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  className="input-editorial w-full"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-editorial disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-5 text-center">
              <span className="text-gray-400">Already have an account?</span>{' '}
              <Link to="/blog/login" className="text-[#B8860B] hover:text-[#9A7209] font-semibold transition-colors">
                Sign in
              </Link>
            </div>

            {/* Benefits */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="space-y-2">
                {['Access public articles and content', 'Like and comment on posts', 'Save articles for later'].map((text, i) => (
                  <div key={i} className="flex items-center space-x-3 text-sm text-gray-500">
                    <div className="h-5 w-5 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-sage-600" />
                    </div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-[#B8860B]/10 rounded-lg border border-[#B8860B]/20">
                <p className="text-sm text-gray-600">
                  💡 Want member-only content?{' '}
                  <a href="/onboarding" className="font-bold text-[#B8860B] hover:underline">
                    Become a Breyus member →
                  </a>
                </p>
              </div>
            </div>
          </div>

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

export default BlogSignupPage;
