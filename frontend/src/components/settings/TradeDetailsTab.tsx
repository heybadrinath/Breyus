import React, { useState, useRef, useEffect } from "react";
import { Loader2, Edit2, Check, X, Plus, FileText, Trash2, Eye, AlertCircle, CheckCircle, Clock, Shield, ChevronDown } from "lucide-react";
import {
    CompanyProfile,
    TradeDetails,
    updateCompanyProfile,
    KycDocument,
    KycDocumentType,
    UploadableKycDocumentType,
    KYC_DOCUMENT_TYPE_LABELS,
    getKycStatus,
    getCisStatus,
    uploadKycDocument,
    deleteKycDocument,
    KycStatus,
    CisStatus
} from "../../services/company.service";

interface TradeDetailsTabProps {
    profile: CompanyProfile | null;
    onUpdate: (profile: CompanyProfile) => void;
}

// Document types available for upload (excludes legacy types)
const DOCUMENT_TYPE_OPTIONS: { value: UploadableKycDocumentType; label: string; description?: string }[] = [
    { value: 'cis', label: 'CIS (Customer Information Sheet)', description: 'Only one CIS document allowed' },
    { value: 'product_catalog', label: 'Product Catalog', description: 'Requires CIS to be uploaded first' },
    { value: 'other', label: 'Other', description: 'Requires a description' },
];

// Helper to get label for any document type (including legacy types)
const getDocumentTypeLabel = (type: KycDocumentType): string => {
    return KYC_DOCUMENT_TYPE_LABELS[type] || type;
};

const StatusBadge: React.FC<{ status: KycDocument['status'] }> = ({ status }) => {
    const config = {
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending Review' },
        approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Approved' },
        rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle, label: 'Rejected' },
    }[status];

    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
};

const TradeDetailsTab: React.FC<TradeDetailsTabProps> = ({ profile, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // KYC Documents state
    const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
    const [cisStatus, setCisStatus] = useState<CisStatus | null>(null);
    const [isLoadingKyc, setIsLoadingKyc] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

    // Upload form state
    const [uploadDocType, setUploadDocType] = useState<UploadableKycDocumentType>('cis');
    const [uploadCustomName, setUploadCustomName] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<TradeDetails>({
        emergingInterest: profile?.tradeDetails?.emergingInterest || '',
        agreedToTerms: profile?.tradeDetails?.agreedToTerms || false,
    });

    // Load KYC status and CIS status on mount
    useEffect(() => {
        loadKycData();
    }, []);

    const loadKycData = async () => {
        try {
            setIsLoadingKyc(true);
            const [kycStatusResult, cisStatusResult] = await Promise.all([
                getKycStatus(),
                getCisStatus()
            ]);
            setKycStatus(kycStatusResult);
            setCisStatus(cisStatusResult);
        } catch (err) {
            console.error('Error loading KYC data:', err);
        } finally {
            setIsLoadingKyc(false);
        }
    };

    const loadKycStatus = async () => {
        try {
            setIsLoadingKyc(true);
            const [kycStatusResult, cisStatusResult] = await Promise.all([
                getKycStatus(),
                getCisStatus()
            ]);
            setKycStatus(kycStatusResult);
            setCisStatus(cisStatusResult);
        } catch (err) {
            console.error('Error loading KYC status:', err);
        } finally {
            setIsLoadingKyc(false);
        }
    };

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
        });
        setIsEditing(true);
        setError(null);
        setSuccessMessage(null);
    };

    const cancelEdit = () => {
        setFormData({
            emergingInterest: profile?.tradeDetails?.emergingInterest || '',
            agreedToTerms: profile?.tradeDetails?.agreedToTerms || false,
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

    const openUploadModal = async () => {
        // Refresh CIS status to ensure we have the latest data
        try {
            const freshCisStatus = await getCisStatus();
            setCisStatus(freshCisStatus);

            // Default to CIS if can upload, otherwise product_catalog, otherwise other
            let defaultType: UploadableKycDocumentType = 'cis';
            if (!freshCisStatus.canUploadCis) {
                defaultType = freshCisStatus.hasCis ? 'product_catalog' : 'other';
            }
            setUploadDocType(defaultType);
        } catch (err) {
            console.error('Error refreshing CIS status:', err);
            // Fall back to current state
            let defaultType: UploadableKycDocumentType = 'cis';
            if (cisStatus && !cisStatus.canUploadCis) {
                defaultType = cisStatus.hasCis ? 'product_catalog' : 'other';
            }
            setUploadDocType(defaultType);
        }

        setUploadCustomName('');
        setUploadDescription('');
        setUploadFile(null);
        setShowUploadModal(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
            if (!uploadCustomName) {
                // Auto-fill custom name from filename without extension
                const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
                setUploadCustomName(nameWithoutExt);
            }
        }
    };

    const handleUpload = async () => {
        if (!uploadFile || !uploadCustomName.trim()) {
            setError('Please select a file and enter a document name');
            return;
        }

        // Validate description for "other" type
        if (uploadDocType === 'other' && (!uploadDescription.trim() || uploadDescription.trim().length < 5)) {
            setError('Please provide a description for the document type (at least 5 characters)');
            return;
        }

        try {
            setIsUploading(true);
            setError(null);
            await uploadKycDocument(
                uploadFile,
                uploadDocType,
                uploadCustomName.trim(),
                uploadDocType === 'other' ? uploadDescription.trim() : undefined
            );
            setSuccessMessage('Document uploaded successfully');
            setShowUploadModal(false);
            await loadKycStatus();
        } catch (err: any) {
            console.error('Error uploading document:', err);
            setError(err.message || 'Failed to upload document. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (docId: string) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            setDeletingDocId(docId);
            setError(null);
            await deleteKycDocument(docId);
            setSuccessMessage('Document deleted successfully');
            await loadKycStatus();
        } catch (err: any) {
            console.error('Error deleting document:', err);
            setError(err.message || 'Failed to delete document. Please try again.');
        } finally {
            setDeletingDocId(null);
        }
    };

    const getDocumentUrl = (path: string) => {
        if (path.startsWith('http')) return path;
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        return `${backendUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="w-full space-y-6">
            <h2 className="text-2xl font-bold">My Trade Details</h2>

            {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    {successMessage}
                    <button onClick={() => setSuccessMessage(null)} className="ml-auto">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Trade Details Section */}
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
                </div>
            </div>

            {/* KYC Documents Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Your Documents</h3>
                        {kycStatus?.isKycVerified && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <Shield className="h-4 w-4" />
                                Verified Company
                            </span>
                        )}
                    </div>
                    <button
                        onClick={openUploadModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Document
                    </button>
                </div>

                {isLoadingKyc ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                    </div>
                ) : kycStatus?.documents && kycStatus.documents.length > 0 ? (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="flex gap-4 text-sm mb-4">
                            <span className="text-gray-600">
                                Total: <strong>{kycStatus.documents.length}</strong>
                            </span>
                            {kycStatus.pendingCount > 0 && (
                                <span className="text-yellow-600">
                                    Pending: <strong>{kycStatus.pendingCount}</strong>
                                </span>
                            )}
                            {kycStatus.approvedCount > 0 && (
                                <span className="text-green-600">
                                    Approved: <strong>{kycStatus.approvedCount}</strong>
                                </span>
                            )}
                            {kycStatus.rejectedCount > 0 && (
                                <span className="text-red-600">
                                    Rejected: <strong>{kycStatus.rejectedCount}</strong>
                                </span>
                            )}
                        </div>

                        {/* Document List */}
                        <div className="divide-y divide-gray-100">
                            {kycStatus.documents.map((doc) => {
                                // CIS can be deleted regardless of status
                                // Non-CIS documents can only be deleted if not approved
                                const canDelete = doc.type === 'cis' || doc.status !== 'approved';

                                return (
                                    <div key={doc._id} className="py-4 first:pt-0 last:pb-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <FileText className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{doc.customName}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {getDocumentTypeLabel(doc.type)} • {formatFileSize(doc.size)} • Uploaded {formatDate(doc.uploadedAt)}
                                                    </p>
                                                    {/* Show description for 'other' type documents */}
                                                    {doc.type === 'other' && doc.description && (
                                                        <p className="text-sm text-gray-600 mt-1 italic">
                                                            "{doc.description}"
                                                        </p>
                                                    )}
                                                    {doc.status === 'rejected' && doc.reviewNotes && (
                                                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                                                            <strong>Rejection reason:</strong> {doc.reviewNotes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <StatusBadge status={doc.status} />
                                                <div className="flex gap-1">
                                                    <a
                                                        href={getDocumentUrl(doc.path)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        title="View document"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => handleDeleteDocument(doc._id)}
                                                            disabled={deletingDocId === doc._id}
                                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                                            title={doc.type === 'cis' ? "Delete CIS (you can re-upload)" : "Delete document"}
                                                        >
                                                            {deletingDocId === doc._id ? (
                                                                <Loader2 className="animate-spin h-4 w-4" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                        <p className="text-sm text-gray-400 max-w-md mx-auto">
                            Upload your verification documents such as CIS, passport, tax certificates,
                            or business registration to get verified.
                        </p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Document Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Document Type
                                </label>
                                <div className="relative">
                                    <select
                                        value={uploadDocType}
                                        onChange={(e) => {
                                            setUploadDocType(e.target.value as UploadableKycDocumentType);
                                            // Clear description when changing away from "other"
                                            if (e.target.value !== 'other') {
                                                setUploadDescription('');
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                                    >
                                        {DOCUMENT_TYPE_OPTIONS.map((option) => {
                                            // Determine if option should be disabled
                                            let isDisabled = false;
                                            let disabledReason = '';

                                            if (option.value === 'cis' && cisStatus) {
                                                if (cisStatus.hasCis && !cisStatus.canUploadCis) {
                                                    isDisabled = true;
                                                    disabledReason = ' (already uploaded)';
                                                }
                                            } else if (option.value === 'product_catalog' && cisStatus) {
                                                if (!cisStatus.hasCis) {
                                                    isDisabled = true;
                                                    disabledReason = ' (upload CIS first)';
                                                }
                                            }

                                            return (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                    disabled={isDisabled}
                                                >
                                                    {option.label}{disabledReason}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>

                                {/* Warning/Info messages based on selected type */}
                                {uploadDocType === 'cis' && cisStatus?.reason && cisStatus.canUploadCis && (
                                    <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {cisStatus.reason}
                                    </p>
                                )}
                                {uploadDocType === 'cis' && cisStatus?.hasCis && !cisStatus.canUploadCis && (
                                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-4 w-4" />
                                        {cisStatus.reason || 'A CIS document already exists. Delete it first to upload a new one.'}
                                    </p>
                                )}
                            </div>

                            {/* Custom Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Document Name
                                </label>
                                <input
                                    type="text"
                                    value={uploadCustomName}
                                    onChange={(e) => setUploadCustomName(e.target.value)}
                                    placeholder="E.g., Company Registration Certificate 2024"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Description (required for "other" type) */}
                            {uploadDocType === 'other' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={uploadDescription}
                                        onChange={(e) => setUploadDescription(e.target.value)}
                                        placeholder="Please describe what this document is and why you're uploading it (min 5 characters)"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        {uploadDescription.trim().length}/5 characters minimum
                                    </p>
                                </div>
                            )}

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    File
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    className="hidden"
                                />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                >
                                    {uploadFile ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                            <span className="text-sm text-gray-700">{uploadFile.name}</span>
                                            <span className="text-xs text-gray-500">
                                                ({formatFileSize(uploadFile.size)})
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">Click to select a file</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                PDF, JPG, PNG, DOC up to 10MB
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={
                                    isUploading ||
                                    !uploadFile ||
                                    !uploadCustomName.trim() ||
                                    (uploadDocType === 'cis' && cisStatus?.hasCis && !cisStatus?.canUploadCis) ||
                                    (uploadDocType === 'product_catalog' && !cisStatus?.hasCis) ||
                                    (uploadDocType === 'other' && uploadDescription.trim().length < 5)
                                }
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4" />
                                        Upload Document
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TradeDetailsTab;
