/**
 * Buyer Profile Page
 * Allows sellers to view buyer company profiles with 2 tabs:
 * - Information: Company details, contact info
 * - Interests: Buyer's commodity interests (what they want to purchase)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  Share2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Check,
  BadgeCheck,
  Package,
  Sparkles,
  Heart,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { getBuyerPublicProfile, PublicCompanyProfile } from '../../services/company.service';
import { createConversationByCompany } from '../../services/inbox.service';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  checkIsFavouriteCompany,
  addFavouriteCompany,
  removeFavouriteCompany,
} from '../../services/wishlist.service';
import { getImageUrl } from '../../utils/imageUtils';

type TabType = 'information' | 'interests';

const BuyerProfile: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  // State
  const [profile, setProfile] = useState<PublicCompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('information');
  const [copied, setCopied] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Favourite state
  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);

  // Fetch company profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!companyId) {
        setError('Company ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getBuyerPublicProfile(companyId);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [companyId]);

  // Check favourite status on mount
  useEffect(() => {
    const checkFavourite = async () => {
      if (!companyId) return;
      try {
        const result = await checkIsFavouriteCompany(companyId);
        setIsFavourite(result);
      } catch (err) {
        // Silently fail
        console.log('Could not check favourite status');
      }
    };
    checkFavourite();
  }, [companyId]);

  // Handle favourite toggle
  const handleFavouriteToggle = async () => {
    if (!companyId || favouriteLoading) return;

    setFavouriteLoading(true);
    try {
      if (isFavourite) {
        await removeFavouriteCompany(companyId);
        setIsFavourite(false);
        showToast('Removed from favourites', 'success');
      } else {
        await addFavouriteCompany(companyId);
        setIsFavourite(true);
        showToast('Added to favourites', 'success');
      }
    } catch (err) {
      showToast(
        isFavourite
          ? 'Failed to remove from favourites'
          : 'Failed to add to favourites',
        'error'
      );
    } finally {
      setFavouriteLoading(false);
    }
  };

  // Handle Chat Now button - navigates to seller inbox
  const handleChatNow = async () => {
    if (!companyId || chatLoading) return;

    try {
      setChatLoading(true);
      const result = await createConversationByCompany(companyId);

      if (result.status === 'success') {
        navigate(`/seller/inbox?conversationId=${result.conversationId}`);
      } else if (result.message === 'Conversation already exists' && result.conversationId) {
        navigate(`/seller/inbox?conversationId=${result.conversationId}`);
      } else if (
        result.message === "You can't send a message to yourself" ||
        (result.message && result.message.toLowerCase().includes('yourself'))
      ) {
        showToast("You can't chat with yourself.", 'error');
      } else {
        showToast(result.message || 'Failed to start conversation', 'error');
      }
    } catch (err) {
      showToast('Error starting conversation', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Share button
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = profile?.companyName || 'Buyer Profile';

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out ${shareTitle} on Breyus`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  // Get profile image URL
  const getProfileImage = () => {
    return getImageUrl(profile?.profilePicture, undefined);
  };

  // Get banner image URL
  const getBannerImage = () => {
    return getImageUrl(profile?.bannerImage, undefined);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading buyer profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Not Found</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const bannerImage = getBannerImage();
  const profileImage = getProfileImage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="relative h-48 bg-gradient-to-r from-emerald-600 to-teal-700">
        {bannerImage && (
          <img
            src={bannerImage}
            alt="Company Banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {/* Buyer Badge */}
        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 shadow-sm">
          <ShoppingBag className="w-4 h-4" />
          Buyer
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={profile.companyName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    profile.companyName?.charAt(0)?.toUpperCase() || 'C'
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.companyName}</h1>
                  {profile.isKycVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <BadgeCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{profile.primaryEmail}</p>
                {profile.companyAddress && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.companyAddress}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                <button
                  onClick={handleFavouriteToggle}
                  disabled={favouriteLoading}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                    isFavourite
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                >
                  {favouriteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart
                      className={`w-4 h-4 ${isFavourite ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  )}
                </button>
                <button
                  onClick={handleChatNow}
                  disabled={chatLoading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4" />
                  {chatLoading ? 'Starting...' : 'Chat Now'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-100/50 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('information')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                  activeTab === 'information'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4 inline-block mr-2" />
                Information
              </button>
              <button
                onClick={() => setActiveTab('interests')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                  activeTab === 'interests'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Sparkles className="w-4 h-4 inline-block mr-2" />
                Buying Interests
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Information Tab */}
            {activeTab === 'information' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h3>

                  {profile.founderName && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Founder</p>
                        <p className="text-gray-900">{profile.founderName}</p>
                      </div>
                    </div>
                  )}

                  {profile.taxId && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Tax ID</p>
                        <p className="text-gray-900">{profile.taxId}</p>
                      </div>
                    </div>
                  )}

                  {profile.tradeType && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Trade Type</p>
                        <p className="text-gray-900 capitalize">{profile.tradeType}</p>
                      </div>
                    </div>
                  )}

                  {profile.mainLineBusiness && profile.mainLineBusiness.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Main Line of Business</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {profile.mainLineBusiness.map((item, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm rounded"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {profile.websiteUrl && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <a
                          href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline"
                        >
                          {profile.websiteUrl}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

                  {profile.primaryEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Primary Email</p>
                        <a href={`mailto:${profile.primaryEmail}`} className="text-emerald-600 hover:underline">
                          {profile.primaryEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.alternativeSalesEmail && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Alternative Email</p>
                        <a href={`mailto:${profile.alternativeSalesEmail}`} className="text-emerald-600 hover:underline">
                          {profile.alternativeSalesEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.companyMobile && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <a href={`tel:${profile.companyMobile}`} className="text-emerald-600 hover:underline">
                          {profile.companyMobile}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.whatsappContact && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">WhatsApp</p>
                        <a
                          href={`https://wa.me/${profile.whatsappContact.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline"
                        >
                          {profile.whatsappContact}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.companyAddress && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-900">{profile.companyAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interests Tab */}
            {activeTab === 'interests' && (
              <div>
                {profile.tradeDetails?.emergingInterest ? (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-100 rounded-lg">
                        <Sparkles className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Commodities of Interest</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          This buyer is looking to purchase the following commodities:
                        </p>
                        <p className="text-gray-700 whitespace-pre-wrap">{profile.tradeDetails.emergingInterest}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Buying Interests Listed</h3>
                    <p className="text-gray-600">
                      This buyer hasn't specified any commodity interests yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerProfile;
