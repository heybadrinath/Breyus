import React, { useState } from "react";
import { Loader2, Edit2, Check, X, CheckCircle, Eye } from "lucide-react";
import { CompanyProfile, updateCompanyProfile } from "../../services/company.service";
import ContactInfoSection from "./ContactInfoSection";
import BankInfoSection from "./BankInfoSection";
import ProfileHeader from "./ProfileHeader";
import ProfilePreviewModal from "./ProfilePreviewModal";

interface MyDetailsTabProps {
    profile: CompanyProfile | null;
    userEmail: string;
    onUpdate: (profile: CompanyProfile) => void;
}

const MyDetailsTab: React.FC<MyDetailsTabProps> = ({ profile, userEmail, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [formData, setFormData] = useState({
        companyName: profile?.companyName || '',
        companyAddress: profile?.companyAddress || '',
        taxId: profile?.taxId || '',
        websiteUrl: profile?.websiteUrl || '',
        founderName: profile?.founderName || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const startEditing = () => {
        setFormData({
            companyName: profile?.companyName || '',
            companyAddress: profile?.companyAddress || '',
            taxId: profile?.taxId || '',
            websiteUrl: profile?.websiteUrl || '',
            founderName: profile?.founderName || '',
        });
        setIsEditing(true);
        setError(null);
        setSuccessMessage(null);
    };

    const cancelEdit = () => {
        setFormData({
            companyName: profile?.companyName || '',
            companyAddress: profile?.companyAddress || '',
            taxId: profile?.taxId || '',
            websiteUrl: profile?.websiteUrl || '',
            founderName: profile?.founderName || '',
        });
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const updatedProfile = await updateCompanyProfile(formData);
            onUpdate(updatedProfile);
            setSuccessMessage('Company information updated successfully');
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving company info:', err);
            setError('Failed to update company information. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const VerifiedBadge = () => (
        <CheckCircle className="h-4 w-4 text-green-500 inline ml-1" />
    );

    return (
        <div className="w-full">
            {/* Profile Header with Picture and Banner */}
            <ProfileHeader profile={profile} userEmail={userEmail} onUpdate={onUpdate} />

            {/* Account Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Account Overview</h3>
                    <button
                        onClick={() => setShowPreviewModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        Preview Profile
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-medium">{profile?.role || 'Not set'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Trade Type</p>
                        <p className="font-medium capitalize">{profile?.tradeType || 'Not set'}</p>
                    </div>
                    {profile?.mainLineBusiness && profile.mainLineBusiness.length > 0 && (
                        <div className="col-span-2">
                            <p className="text-sm text-gray-500">Business Categories</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile.mainLineBusiness.map((category, index) => (
                                    <span
                                        key={index}
                                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                                    >
                                        {category}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Company Information</h3>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    <Check className="h-4 w-4" />
                                )}
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={cancelEdit}
                                disabled={isSaving}
                                className="flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={startEditing}
                            className="flex items-center gap-1 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                            <Edit2 className="h-4 w-4" />
                            Edit
                        </button>
                    )}
                </div>

                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">
                            Company Name
                            {profile?.companyName && <VerifiedBadge />}
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter company name"
                            />
                        ) : (
                            <p className="font-medium">{profile?.companyName || 'Not set'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-500 mb-1">
                            Company Website
                            {profile?.websiteUrl && <VerifiedBadge />}
                        </label>
                        {isEditing ? (
                            <input
                                type="url"
                                name="websiteUrl"
                                value={formData.websiteUrl}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://example.com"
                            />
                        ) : (
                            <p className="font-medium">
                                {profile?.websiteUrl ? (
                                    <a
                                        href={profile.websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {profile.websiteUrl}
                                    </a>
                                ) : (
                                    '-----'
                                )}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-500 mb-1">
                            GSTIN
                            {profile?.taxId && <VerifiedBadge />}
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter GSTIN"
                            />
                        ) : (
                            <p className="font-medium">{profile?.taxId || 'Not set'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-500 mb-1">
                            Company Address
                            {profile?.companyAddress && <VerifiedBadge />}
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="companyAddress"
                                value={formData.companyAddress}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter company address"
                            />
                        ) : (
                            <p className="font-medium">{profile?.companyAddress || 'Not set'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Contact Information Section */}
            <ContactInfoSection profile={profile} onUpdate={onUpdate} />

            {/* Bank Information Section */}
            <BankInfoSection profile={profile} onUpdate={onUpdate} />

            {/* Profile Preview Modal */}
            <ProfilePreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                profile={profile}
                userEmail={userEmail}
            />
        </div>
    );
};

export default MyDetailsTab;
