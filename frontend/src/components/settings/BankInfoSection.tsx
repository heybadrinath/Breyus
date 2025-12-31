import React, { useState } from "react";
import { Loader2, Edit2, Check, X } from "lucide-react";
import { CompanyProfile, BankInfo, updateCompanyProfile } from "../../services/company.service";

interface BankInfoSectionProps {
    profile: CompanyProfile | null;
    onUpdate: (profile: CompanyProfile) => void;
}

const BankInfoSection: React.FC<BankInfoSectionProps> = ({ profile, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState<BankInfo>({
        ifscCode: profile?.bankInfo?.ifscCode || '',
        accountNumber: profile?.bankInfo?.accountNumber || '',
        accountHolderName: profile?.bankInfo?.accountHolderName || '',
        bankAddress: profile?.bankInfo?.bankAddress || '',
        bankBranch: profile?.bankInfo?.bankBranch || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const startEditing = () => {
        setFormData({
            ifscCode: profile?.bankInfo?.ifscCode || '',
            accountNumber: profile?.bankInfo?.accountNumber || '',
            accountHolderName: profile?.bankInfo?.accountHolderName || '',
            bankAddress: profile?.bankInfo?.bankAddress || '',
            bankBranch: profile?.bankInfo?.bankBranch || '',
        });
        setIsEditing(true);
        setError(null);
        setSuccessMessage(null);
    };

    const cancelEdit = () => {
        setFormData({
            ifscCode: profile?.bankInfo?.ifscCode || '',
            accountNumber: profile?.bankInfo?.accountNumber || '',
            accountHolderName: profile?.bankInfo?.accountHolderName || '',
            bankAddress: profile?.bankInfo?.bankAddress || '',
            bankBranch: profile?.bankInfo?.bankBranch || '',
        });
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const updatedProfile = await updateCompanyProfile({
                bankInfo: formData
            });
            onUpdate(updatedProfile);
            setSuccessMessage('Bank information updated successfully');
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving bank information:', err);
            setError('Failed to update bank information. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Bank Information</h3>
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
                    <label className="block text-sm text-gray-500 mb-1">IFSC Code</label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="ifscCode"
                            value={formData.ifscCode}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter IFSC code"
                        />
                    ) : (
                        <p className="font-medium">{profile?.bankInfo?.ifscCode || 'Not set'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm text-gray-500 mb-1">Account Number</label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter account number"
                        />
                    ) : (
                        <p className="font-medium">{profile?.bankInfo?.accountNumber || 'Not set'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm text-gray-500 mb-1">Account Holder Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="accountHolderName"
                            value={formData.accountHolderName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter account holder name"
                        />
                    ) : (
                        <p className="font-medium">{profile?.bankInfo?.accountHolderName || 'Not set'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm text-gray-500 mb-1">Bank Branch</label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="bankBranch"
                            value={formData.bankBranch}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter bank branch"
                        />
                    ) : (
                        <p className="font-medium">{profile?.bankInfo?.bankBranch || 'Not set'}</p>
                    )}
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm text-gray-500 mb-1">Bank Address</label>
                    {isEditing ? (
                        <input
                            type="text"
                            name="bankAddress"
                            value={formData.bankAddress}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter bank address"
                        />
                    ) : (
                        <p className="font-medium">{profile?.bankInfo?.bankAddress || 'Not set'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BankInfoSection;
