import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUtils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CompanyAvatarProps {
  companyId?: string | null;
  companyName: string;
  profilePicture?: string | null;
  size?: AvatarSize;
  clickable?: boolean;
  className?: string;
  /** Override automatic role detection - 'buyer' navigates to seller profile, 'seller' navigates to buyer profile */
  viewerRole?: 'buyer' | 'seller';
}

const sizeMap: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs' },
  sm: { container: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-12 h-12', text: 'text-lg' },
  xl: { container: 'w-16 h-16', text: 'text-xl' },
};

/**
 * CompanyAvatar - A reusable avatar component for displaying company profile pictures
 *
 * Features:
 * - Displays profile image when available
 * - Falls back to gradient circle with company initial when no image
 * - Supports 5 size presets (xs, sm, md, lg, xl)
 * - Optionally clickable to navigate to company profile
 * - Role-aware: buyers see seller profiles, sellers see buyer profiles
 * - Handles image loading errors gracefully
 */
const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
  companyId,
  companyName,
  profilePicture,
  size = 'md',
  clickable = false,
  className = '',
  viewerRole,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);

  const { container: sizeClass, text: textClass } = sizeMap[size];
  const initial = companyName?.charAt(0)?.toUpperCase() || '?';
  const imageUrl = getImageUrl(profilePicture);
  const hasValidImage = profilePicture && !imageError;

  // Determine viewer role from URL if not explicitly provided
  const detectedRole = viewerRole || (location.pathname.startsWith('/seller') ? 'seller' : 'buyer');

  const handleClick = (e: React.MouseEvent) => {
    if (clickable && companyId) {
      e.stopPropagation();
      // Buyers view seller profiles, sellers view buyer profiles
      const profilePath = detectedRole === 'seller'
        ? `/seller/buyer-profile/${companyId}`
        : `/buyer/seller-profile/${companyId}`;
      navigate(profilePath);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const cursorClass = clickable && companyId ? 'cursor-pointer hover:ring-2 hover:ring-blue-300 hover:ring-offset-1' : '';

  return (
    <div
      onClick={handleClick}
      className={`
        ${sizeClass}
        rounded-full
        flex items-center justify-center
        flex-shrink-0
        overflow-hidden
        transition-all duration-200
        ${cursorClass}
        ${className}
      `}
      title={clickable && companyId ? `View ${companyName}'s profile` : companyName}
    >
      {hasValidImage ? (
        <img
          src={imageUrl}
          alt={`${companyName} profile`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className={`
          w-full h-full
          bg-gradient-to-br from-blue-500 to-indigo-600
          flex items-center justify-center
          text-white font-semibold
          ${textClass}
        `}>
          {initial}
        </div>
      )}
    </div>
  );
};

export default CompanyAvatar;
