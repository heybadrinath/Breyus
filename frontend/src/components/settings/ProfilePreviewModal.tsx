/**
 * ProfilePreviewModal
 * Displays a preview of how the company profile appears to other users
 * Shows the same layout as the seller-profile page in read-only mode
 */

import React from 'react';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  BadgeCheck,
  Package,
  Sparkles,
  Eye,
} from 'lucide-react';
import { CompanyProfile } from '../../services/company.service';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile | null;
  userEmail: string;
  /** Optional: Override role detection. Uses profile.role if not provided */
  userRole?: 'buyer' | 'seller';
}

const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  isOpen,
  onClose,
  profile,
  userEmail,
  userRole,
}) => {
  if (!isOpen || !profile) return null;

  // Determine if user is a seller (sellers have Products tab, buyers don't)
  const isSeller = userRole === 'seller' || profile.role === 'seller';

  // Get profile image URL
  const getProfileImage = () => {
    if (profile.profilePicture) {
      return `${process.env.REACT_APP_BACKEND_URL}/${profile.profilePicture}`;
    }
    return null;
  };

  // Get banner image URL
  const getBannerImage = () => {
    if (profile.bannerImage) {
      return `${process.env.REACT_APP_BACKEND_URL}/${profile.bannerImage}`;
    }
    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-50 rounded-2xl overflow-hidden shadow-2xl">
        {/* Preview Badge */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg">
          <Eye className="w-4 h-4" />
          Preview Mode
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Banner Section - Blue for sellers, Emerald for buyers */}
          <div className={`relative h-40 bg-gradient-to-r ${isSeller ? 'from-blue-600 to-blue-800' : 'from-emerald-600 to-teal-700'}`}>
            {getBannerImage() && (
              <img
                src={getBannerImage()!}
                alt="Company Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          <div className="px-6 pb-6">
            {/* Profile Header */}
            <div className="relative -mt-12 mb-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-100/50 p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar - Blue for sellers, Emerald for buyers */}
                  <div className="flex-shrink-0">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${isSeller ? 'from-blue-500 to-blue-700' : 'from-emerald-500 to-teal-600'} flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg overflow-hidden`}>
                      {getProfileImage() ? (
                        <img
                          src={getProfileImage()!}
                          alt={profile.companyName || 'Company'}
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
                      <h1 className="text-xl font-bold text-gray-900">
                        {profile.companyName || 'Company Name'}
                      </h1>
                      {/* Placeholder for KYC verification badge */}
                    </div>
                    <p className="text-gray-600 mb-2">
                      {profile.primaryEmail || userEmail}
                    </p>
                    {profile.companyAddress && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {profile.companyAddress}
                      </p>
                    )}
                  </div>

                  {/* Placeholder Buttons (Disabled) */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-start opacity-50 pointer-events-none">
                    <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg">
                      Chat Now
                    </button>
                    <button className="flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg">
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Preview */}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-100/50">
              {/* Tab Header - Products tab only shown for sellers */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <div className={`${isSeller ? 'flex-1' : 'flex-1'} py-4 px-6 text-center font-medium border-b-2 ${isSeller ? 'border-blue-600 text-blue-600' : 'border-emerald-600 text-emerald-600'}`}>
                    <Building2 className="w-4 h-4 inline-block mr-2" />
                    Information
                  </div>
                  {isSeller && (
                    <div className="flex-1 py-4 px-6 text-center font-medium border-b-2 border-transparent text-gray-500">
                      <Package className="w-4 h-4 inline-block mr-2" />
                      Products
                    </div>
                  )}
                  <div className="flex-1 py-4 px-6 text-center font-medium border-b-2 border-transparent text-gray-500">
                    <Sparkles className="w-4 h-4 inline-block mr-2" />
                    {isSeller ? 'Emerging Interest' : 'Buying Interests'}
                  </div>
                </nav>
              </div>

              {/* Information Tab Content */}
              <div className="p-6">
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
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded"
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
                          <p className="text-blue-600">{profile.websiteUrl}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

                    {(profile.primaryEmail || userEmail) && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Primary Email</p>
                          <p className="text-blue-600">{profile.primaryEmail || userEmail}</p>
                        </div>
                      </div>
                    )}

                    {profile.alternativeSalesEmail && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Sales Email</p>
                          <p className="text-blue-600">{profile.alternativeSalesEmail}</p>
                        </div>
                      </div>
                    )}

                    {profile.companyMobile && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-blue-600">{profile.companyMobile}</p>
                        </div>
                      </div>
                    )}

                    {profile.whatsappContact && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">WhatsApp</p>
                          <p className="text-blue-600">{profile.whatsappContact}</p>
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

                {/* Empty state message for incomplete profiles */}
                {!profile.companyName && !profile.primaryEmail && !profile.companyAddress && (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Complete your profile to see how it appears to others</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePreviewModal;
