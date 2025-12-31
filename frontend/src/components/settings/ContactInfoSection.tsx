import React, { useState } from "react";
import { Loader2, Edit2, Check, X, CheckCircle } from "lucide-react";
import { CompanyProfile, updateCompanyProfile } from "../../services/company.service";

interface ContactInfoSectionProps {
    profile: CompanyProfile | null;
    onUpdate: (profile: CompanyProfile) => void;
}

interface ContactFormData {
    companyMobile: string;
    whatsappContact: string;
    primaryEmail: string;
    alternativeSalesEmail: string;
}

const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({ profile, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState<ContactFormData>({
        companyMobile: profile?.companyMobile || '',
        whatsappContact: profile?.whatsappContact || '',
        primaryEmail: profile?.primaryEmail || '',
        alternativeSalesEmail: profile?.alternativeSalesEmail || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const startEditing = () => {
        setFormData({
            companyMobile: profile?.companyMobile || '',
            whatsappContact: profile?.whatsappContact || '',
            primaryEmail: profile?.primaryEmail || '',
            alternativeSalesEmail: profile?.alternativeSalesEmail || '',
        });
        setIsEditing(true);
        setError(null);
        setSuccessMessage(null);
    };

    const cancelEdit = () => {
        setFormData({
            companyMobile: profile?.companyMobile || '',
            whatsappContact: profile?.whatsappContact || '',
            primaryEmail: profile?.primaryEmail || '',
            alternativeSalesEmail: profile?.alternativeSalesEmail || '',
        });
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const updatedProfile = await updateCompanyProfile(formData);
            onUpdate(updatedProfile);
            setSuccessMessage('Contact information updated successfully');
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving contact information:', err);
            setError('Failed to update contact information. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const VerifiedBadge = () => (
        <CheckCircle className="h-4 w-4 text-green-500 inline ml-1" />
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Contact Information</h3>
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
                        Company Contact Information
                        {profile?.companyMobile && <VerifiedBadge />}
                    </label>
                    {isEditing ? (
                        <div className="flex">
                            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-lg">
                                +91
                            </span>
                            <input
                                type="tel"
                                name="companyMobile"
                                value={formData.companyMobile}
                                onChange={handleInputChange}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter phone number"
                            />
                        </div>
                    ) : (
                        <p className="font-medium">{profile?.companyMobile ? `+91 ${profile.companyMobile}` : 'Not set'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm text-gray-500 mb-1">
                        WhatsApp Contact
                        {profile?.whatsappContact && <VerifiedBadge />}
                    </label>
                    {isEditing ? (
                        <div className="flex">
                            <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-lg">
                                +91
                            </span>
                            <input
                                type="tel"
                                name="whatsappContact"
                                value={formData.whatsappContact}
                                onChange={handleInputChange}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter WhatsApp number"
                            />
                        </div>
                    ) : (
                        <p className="font-medium">{profile?.whatsappContact ? `+91 ${profile.whatsappContact}` : 'Not set'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm text-gray-500 mb-1">
                        Primary Email
                        {profile?.primaryEmail && <VerifiedBadge />}
                    </label>
                    {isEditing ? (
                        <input
                            type="email"
                            name="primaryEmail"
                            value={formData.primaryEmail}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter primary email"
                        />
                    ) : (
                        <p className="font-medium">{profile?.primaryEmail || 'Not set'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm text-gray-500 mb-1">
                        Alternative Sales Email
                        {profile?.alternativeSalesEmail && <VerifiedBadge />}
                    </label>
                    {isEditing ? (
                        <input
                            type="email"
                            name="alternativeSalesEmail"
                            value={formData.alternativeSalesEmail}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter alternative email"
                        />
                    ) : (
                        <p className="font-medium">{profile?.alternativeSalesEmail || 'Not set'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactInfoSection;
