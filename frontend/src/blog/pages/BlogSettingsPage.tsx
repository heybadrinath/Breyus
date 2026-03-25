import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Building2,
  Key,
  Loader2,
  Check,
  LogOut,
  Shield,
  Pencil,
  Eye,
  EyeOff,
  Bell,
  Camera,
  Image,
  X,
  Upload,
} from 'lucide-react';
import { useBlogAuth } from '../context/BlogAuthContext';
import { blogAuthService, blogPostsService, writerDashboardService } from '../services/blog-portal.service';
import { BlogLayout } from '../components/layout/BlogLayout';

/**
 * BlogSettingsPage - User settings page for blog portal
 *
 * Features:
 * - Profile display (name, email, company)
 * - Writer profile section (avatar, banner upload) - only for writers
 * - Newsletter subscription toggle (enable/disable)
 * - Password change functionality
 * - Account section with logout
 */
export function BlogSettingsPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, logout, isAuthenticated, refreshUser } = useBlogAuth();

  // Profile upload state
  const [writerAvatar, setWriterAvatar] = useState<string | null>(null);
  const [writerBanner, setWriterBanner] = useState<string | null>(null);
  const [writerBio, setWriterBio] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Newsletter state
  const [newsletterEnabled, setNewsletterEnabled] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [newsletterToggling, setNewsletterToggling] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');

  // Logout state
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Initialize writer profile data
  useEffect(() => {
    if (user?.isWriter) {
      setWriterAvatar(user.writerAvatar || null);
      setWriterBanner(user.writerBanner || null);
      setWriterBio(user.writerBio || '');
    }
  }, [user]);

  // Fetch newsletter status on mount
  useEffect(() => {
    const fetchNewsletterStatus = async () => {
      if (!user?.email) return;
      try {
        const status = await blogPostsService.getNewsletterStatus(user.email);
        setNewsletterEnabled(status.isSubscribed);
      } catch (err) {
        console.error('Error fetching newsletter status:', err);
      } finally {
        setNewsletterLoading(false);
      }
    };

    if (isAuthenticated && user?.email) {
      fetchNewsletterStatus();
    } else {
      setNewsletterLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  // Handle image upload (avatar or banner)
  const handleImageUpload = async (
    file: File,
    type: 'avatar' | 'banner'
  ) => {
    if (type === 'avatar') {
      setIsUploadingAvatar(true);
    } else {
      setIsUploadingBanner(true);
    }

    try {
      const result = await writerDashboardService.uploadImage(file);
      if (type === 'avatar') {
        setWriterAvatar(result.url);
      } else {
        setWriterBanner(result.url);
      }
      setProfileMessage({ type: 'success', text: `${type === 'avatar' ? 'Profile photo' : 'Banner'} uploaded! Click "Save Profile" to apply changes.` });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err?.response?.data?.message || `Failed to upload ${type}`,
      });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    } finally {
      if (type === 'avatar') {
        setIsUploadingAvatar(false);
      } else {
        setIsUploadingBanner(false);
      }
    }
  };

  // Handle file input change
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setProfileMessage({ type: 'error', text: 'File size must be less than 5MB' });
        setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
        return;
      }
      handleImageUpload(file, type);
    }
  };

  // Save writer profile
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage({ type: '', text: '' });

    try {
      // Build updates object - include null values to clear fields
      const updates: { writerAvatar?: string | null; writerBanner?: string | null; writerBio?: string } = {};

      // Always send avatar state (including null to clear)
      updates.writerAvatar = writerAvatar;
      // Always send banner state (including null to clear)
      updates.writerBanner = writerBanner;
      // Send bio (empty string if cleared)
      updates.writerBio = writerBio || '';

      await writerDashboardService.updateProfile(updates);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save profile',
      });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 4000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle newsletter toggle
  const handleNewsletterToggle = async () => {
    if (!user?.email || newsletterToggling) return;

    setNewsletterToggling(true);
    setNewsletterMessage('');

    try {
      const newState = !newsletterEnabled;
      const result = await blogPostsService.toggleNewsletter(user.email, newState);
      setNewsletterEnabled(newState);
      setNewsletterMessage(result.message);
      setTimeout(() => setNewsletterMessage(''), 4000);
    } catch (err: any) {
      setNewsletterMessage(err?.response?.data?.message || 'Failed to update preference.');
      setTimeout(() => setNewsletterMessage(''), 4000);
    } finally {
      setNewsletterToggling(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);

    try {
      await blogAuthService.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/blog');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <BlogLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#B8860B]" />
        </div>
      </BlogLayout>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <BlogLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sign in required
            </h2>
            <p className="text-gray-600 mb-4">
              Please sign in to access your settings.
            </p>
            <Link
              to="/blog/login"
              className="inline-flex items-center px-4 py-2 bg-[#1A1A2E] text-white rounded-lg hover:bg-[#2a2a4e]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </BlogLayout>
    );
  }

  return (
    <BlogLayout>
      <div className="min-h-screen bg-gray-50/50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to="/blog"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Blog
            </Link>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">Account Settings</h1>
            <p className="text-gray-500">Manage your blog account preferences</p>
          </div>

          {/* Writer Profile Section - Only for Writers */}
          {user?.isWriter && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-6">
                <Camera className="h-5 w-5 text-[#B8860B] mr-2" />
                <h2 className="text-lg font-semibold text-[#1A1A2E]">Writer Profile</h2>
              </div>

              {/* Profile Message */}
              {profileMessage.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  profileMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {profileMessage.type === 'success' && <Check className="h-4 w-4 inline mr-2" />}
                  {profileMessage.text}
                </div>
              )}

              {/* Banner Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Banner
                </label>
                <div className="relative">
                  <div className="w-full h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4A] border-2 border-dashed border-gray-300 hover:border-[#B8860B] transition-colors cursor-pointer group">
                    {writerBanner ? (
                      <>
                        <img
                          src={writerBanner}
                          alt="Profile Banner"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-medium">Change Banner</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWriterBanner(null);
                          }}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-[#B8860B] transition-colors"
                      >
                        {isUploadingBanner ? (
                          <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                          <>
                            <Image className="h-8 w-8 mb-2" />
                            <span className="text-sm">Click to upload banner (1200x300 recommended)</span>
                          </>
                        )}
                      </div>
                    )}
                    {writerBanner && (
                      <div
                        onClick={() => bannerInputRef.current?.click()}
                        className="absolute inset-0 cursor-pointer"
                      />
                    )}
                  </div>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileChange(e, 'banner')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4A] border-2 border-dashed border-gray-300 hover:border-[#B8860B] transition-colors cursor-pointer group flex items-center justify-center"
                    >
                      {writerAvatar ? (
                        <>
                          <img
                            src={writerAvatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                        </>
                      ) : isUploadingAvatar ? (
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      ) : (
                        <User className="h-10 w-10 text-white/50" />
                      )}
                    </div>
                    {writerAvatar && (
                      <button
                        onClick={() => setWriterAvatar(null)}
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      Upload a profile photo. Square images work best (400x400 or larger).
                    </p>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                    </button>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={writerBio}
                  onChange={(e) => setWriterBio(e.target.value)}
                  placeholder="Tell readers about yourself..."
                  maxLength={1000}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 outline-none transition-all resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{writerBio.length}/1000 characters</p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="w-full py-3 bg-[#B8860B] text-white rounded-lg font-medium hover:bg-[#9A7209] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSavingProfile ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          )}

          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-[#B8860B] mr-2" />
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Profile</h2>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Company */}
              {user?.companyName && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium text-gray-900">{user.companyName}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Status Badges */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Account Status</p>
                    <div className="flex gap-2 mt-1">
                      {user?.isBrèyusMember && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#B8860B]/10 text-[#B8860B]">
                          Breyus Member
                        </span>
                      )}
                      {user?.isWriter && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Pencil className="h-3 w-3 mr-1" />
                          Writer
                        </span>
                      )}
                      {!user?.isBrèyusMember && !user?.isWriter && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Blog Reader
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter Preferences Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-[#B8860B] mr-2" />
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Email Preferences</h2>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex-1 mr-4">
                <p className="font-medium text-gray-900">Weekly Newsletter</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Receive a weekly digest of the latest commodity trading insights, market analysis, and featured articles.
                </p>
              </div>

              {/* Toggle Switch */}
              {newsletterLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400 flex-shrink-0" />
              ) : (
                <button
                  onClick={handleNewsletterToggle}
                  disabled={newsletterToggling}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#B8860B]/20 flex-shrink-0 ${
                    newsletterEnabled ? 'bg-[#B8860B]' : 'bg-gray-200'
                  } ${newsletterToggling ? 'opacity-50' : ''}`}
                  role="switch"
                  aria-checked={newsletterEnabled}
                  aria-label="Toggle newsletter subscription"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${
                      newsletterEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Status Message */}
            {newsletterMessage && (
              <p className={`mt-2 text-sm ${
                newsletterEnabled ? 'text-green-600' : 'text-gray-500'
              }`}>
                {newsletterMessage}
              </p>
            )}
          </div>

          {/* Password Change Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <Key className="h-5 w-5 text-[#B8860B] mr-2" />
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Change Password</h2>
            </div>

            {/* Password Error */}
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {passwordError}
              </div>
            )}

            {/* Password Success */}
            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center">
                <Check className="h-4 w-4 mr-2" />
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-3 bg-[#1A1A2E] text-white rounded-lg font-medium hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isChangingPassword ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          </div>

          {/* Account Actions Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <LogOut className="h-5 w-5 text-[#B8860B] mr-2" />
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Account</h2>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full py-3 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-red-200"
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </>
              )}
            </button>

            {user?.isWriter && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to="/blog/writer"
                  className="block w-full py-3 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 text-center border border-purple-200"
                >
                  <Pencil className="h-5 w-5 mr-2 inline" />
                  Go to Writer Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </BlogLayout>
  );
}

export default BlogSettingsPage;
