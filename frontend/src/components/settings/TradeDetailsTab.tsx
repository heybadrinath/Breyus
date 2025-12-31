import React, { useState, useRef } from "react";
import { Loader2, Edit2, Check, X, Paperclip, FileText } from "lucide-react";
import { CompanyProfile, TradeDetails, updateCompanyProfile, uploadCisDocument } from "../../services/company.service";

interface TradeDetailsTabProps {
    profile: CompanyProfile | null;
    onUpdate: (profile: CompanyProfile) => void;
}

const TradeDetailsTab: React.FC<TradeDetailsTabProps> = ({ profile, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<TradeDetails>({
        emergingInterest: profile?.tradeDetails?.emergingInterest || '',
        agreedToTerms: profile?.tradeDetails?.agreedToTerms || false,
        cisDocument: profile?.tradeDetails?.cisDocument || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const startEditing = () => {
        setFormData({
            emergingInterest: profile?.tradeDetails?.emergingInterest || '',
            agreedToTerms: profile?.tradeDetails?.agreedToTerms || false,
            cisDocument: profile?.tradeDetails?.cisDocument || '',
        });
        setIsEditing(true);
        setError(null);
        setSuccessMessage(null);
    };

    const cancelEdit = () => {
        setFormData({
            emergingInterest: profile?.tradeDetails?.emergingInterest || '',
            agreedToTerms: profile?.tradeDetails?.agreedToTerms || false,
            cisDocument: profile?.tradeDetails?.cisDocument || '',
        });
        setIsEditing(false);
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const updatedProfile = await updateCompanyProfile({
                tradeDetails: formData
            });
            onUpdate(updatedProfile);
            setSuccessMessage('Trade details updated successfully');
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving trade details:', err);
            setError('Failed to update trade details. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setError(null);
            const result = await uploadCisDocument(file);
            setFormData(prev => ({ ...prev, cisDocument: result.cisDocument }));
            onUpdate(result.profile);
            setSuccessMessage('CIS document uploaded successfully');
        } catch (err) {
            console.error('Error uploading CIS document:', err);
            setError('Failed to upload CIS document. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-6">My Trade Details</h2>

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Details</h3>
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

                <div className="space-y-6">
                    {/* Emerging Interest */}
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">Your emerging Interest</label>
                        {isEditing ? (
                            <textarea
                                name="emergingInterest"
                                value={formData.emergingInterest}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="E.g., I'm interested in Fertilizers, I love derive the minerals from waste"
                            />
                        ) : (
                            <p className="font-medium text-gray-900">
                                {profile?.tradeDetails?.emergingInterest || 'Not set'}
                            </p>
                        )}
                    </div>

                    {/* Agreement Checkbox */}
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <input
                                type="checkbox"
                                name="agreedToTerms"
                                checked={formData.agreedToTerms}
                                onChange={handleInputChange}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        ) : (
                            <div className={`h-5 w-5 rounded border flex items-center justify-center ${
                                profile?.tradeDetails?.agreedToTerms
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-white border-gray-300'
                            }`}>
                                {profile?.tradeDetails?.agreedToTerms && (
                                    <Check className="h-3 w-3 text-white" />
                                )}
                            </div>
                        )}
                        <label className="text-sm text-gray-700">
                            I agree to the breyus ways of using this below documents
                        </label>
                    </div>

                    {/* CIS Document Upload */}
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                        />
                        <button
                            onClick={triggerFileInput}
                            disabled={isUploading || (!isEditing && !profile?.tradeDetails?.cisDocument)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? (
                                <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                                <Paperclip className="h-4 w-4" />
                            )}
                            {isUploading
                                ? 'Uploading...'
                                : 'Attach Your CIS (Customer Information Sheet) with valid passport'
                            }
                        </button>

                        {(formData.cisDocument || profile?.tradeDetails?.cisDocument) && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                <FileText className="h-4 w-4" />
                                <a
                                    href={formData.cisDocument || profile?.tradeDetails?.cisDocument}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    View uploaded CIS document
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeDetailsTab;
