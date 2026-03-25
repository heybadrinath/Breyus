import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface ClickableCompanyNameProps {
  companyId?: string | null;
  companyName: string;
  className?: string;
  /** Override automatic role detection - 'buyer' navigates to seller profile, 'seller' navigates to buyer profile */
  viewerRole?: 'buyer' | 'seller';
}

/**
 * ClickableCompanyName - A wrapper component that makes company names navigable
 *
 * Behavior:
 * - If companyId exists: Renders as a clickable link (blue, underline on hover)
 * - If no companyId: Renders as plain text
 * - Role-aware: buyers see seller profiles, sellers see buyer profiles
 * - Prevents event propagation to avoid triggering parent click handlers
 */
const ClickableCompanyName: React.FC<ClickableCompanyNameProps> = ({
  companyId,
  companyName,
  className = '',
  viewerRole,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine viewer role from URL if not explicitly provided
  const detectedRole = viewerRole || (location.pathname.startsWith('/seller') ? 'seller' : 'buyer');

  const handleClick = (e: React.MouseEvent) => {
    if (companyId) {
      e.stopPropagation();
      e.preventDefault();
      // Buyers view seller profiles, sellers view buyer profiles
      const profilePath = detectedRole === 'seller'
        ? `/seller/buyer-profile/${companyId}`
        : `/buyer/seller-profile/${companyId}`;
      navigate(profilePath);
    }
  };

  if (!companyId) {
    return <span className={className}>{companyName}</span>;
  }

  return (
    <span
      onClick={handleClick}
      className={`
        text-blue-600
        hover:text-blue-800
        hover:underline
        cursor-pointer
        transition-colors duration-150
        ${className}
      `}
      title={`View ${companyName}'s profile`}
    >
      {companyName}
    </span>
  );
};

export default ClickableCompanyName;
