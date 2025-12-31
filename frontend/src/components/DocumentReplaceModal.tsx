import React, { useState } from "react";
import { X, AlertTriangle, FileText, Calendar } from "lucide-react";

interface DocumentInfo {
    filePath?: string;
    originalName?: string;
    uploadedAt?: string | Date;
    version?: number;
}

interface DocumentReplaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    documentType: 'sco' | 'icpo' | 'spa' | 'bol' | 'payment';
    currentDocument?: DocumentInfo;
    loading?: boolean;
}

const documentLabels: Record<string, string> = {
    sco: 'Soft Corporate Offer (SCO)',
    icpo: 'Irrevocable Corporate Purchase Order (ICPO)',
    spa: 'Sales Purchase Agreement (SPA)',
    bol: 'Bill of Lading',
    payment: 'Payment Proof'
};

const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Unknown date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const DocumentReplaceModal: React.FC<DocumentReplaceModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    documentType,
    currentDocument,
    loading = false
}) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const docLabel = documentLabels[documentType] || documentType.toUpperCase();

    const handleConfirm = () => {
        onConfirm(reason);
        setReason('');
    };

    const handleClose = () => {
        setReason('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-orange-50 border-b border-orange-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Replace Document
                            </h3>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    <p className="text-gray-600 mb-4">
                        You are about to replace an existing <strong>{docLabel}</strong>.
                        The other party will be notified of this change.
                    </p>

                    {/* Current Document Info */}
                    {currentDocument && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 border">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Document</h4>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded border">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {currentDocument.originalName || 'Document'}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>Uploaded: {formatDate(currentDocument.uploadedAt)}</span>
                                    </div>
                                    {currentDocument.version && currentDocument.version > 1 && (
                                        <p className="text-xs text-gray-500">
                                            Current version: {currentDocument.version}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reason Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason for replacement <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Updated terms, corrected errors, new signature..."
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Warning Note */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        <strong>Note:</strong> The previous version will be kept in history.
                        The other party will receive an email notification about this change.
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Replace Document'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentReplaceModal;
