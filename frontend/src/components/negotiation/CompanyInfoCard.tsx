import React from 'react';
import { Building2, MapPin, CheckCircle, Clock, MessageSquare, ExternalLink } from 'lucide-react';

interface CompanyInfoProps {
    company: {
        _id?: string;
        name?: string;
        address?: {
            city?: string;
            state?: string;
            country?: string;
        };
        isKycVerified?: boolean;
        createdAt?: string;
    } | null;
    userEmail?: string;
    onChat: () => void;
    onViewProfile?: () => void;
    label: string; // "Seller" or "Buyer"
}

/**
 * CompanyInfoCard
 *
 * Clean, light design for displaying company details with
 * KYC verification badge, location, and prominent chat button.
 */
const CompanyInfoCard: React.FC<CompanyInfoProps> = ({
    company,
    userEmail,
    onChat,
    onViewProfile,
    label
}) => {
    const getTimeOnPlatform = (): string => {
        if (!company?.createdAt) return 'New on Breyus';
        const created = new Date(company.createdAt);
        const now = new Date();
        const years = Math.floor((now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        const months = Math.floor((now.getTime() - created.getTime()) / (30.44 * 24 * 60 * 60 * 1000));

        if (years >= 1) return `${years}+ year${years > 1 ? 's' : ''} on Breyus`;
        if (months >= 1) return `${months} month${months > 1 ? 's' : ''} on Breyus`;
        return 'New on Breyus';
    };

    const getLocation = (): string => {
        if (!company?.address) return 'Location not available';
        const { city, state, country } = company.address;
        const parts = [city, state, country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Location not available';
    };

    const getInitial = (): string => {
        if (company?.name) return company.name.charAt(0).toUpperCase();
        if (userEmail) return userEmail.charAt(0).toUpperCase();
        return 'C';
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        {label} Details
                    </h4>
                    {company?.isKycVerified && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 border border-green-200 rounded-full">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs font-semibold text-green-700">
                                Verified
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Company Identity */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                        {getInitial()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-lg truncate">
                            {company?.name || 'Company Name'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                            {userEmail || 'Email not available'}
                        </p>
                    </div>
                </div>

                {/* Info Items */}
                <div className="space-y-3 mb-5">
                    {/* Location */}
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-gray-600 truncate">{getLocation()}</span>
                    </div>

                    {/* Time on Platform */}
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-gray-600">{getTimeOnPlatform()}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={onChat}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-blue-500/25"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat with {label}
                    </button>
                    {onViewProfile && company?._id && (
                        <button
                            onClick={onViewProfile}
                            className="flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyInfoCard;
