import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle, XCircle, Loader2, AlertCircle, ExternalLink, History, ChevronDown, ChevronUp } from 'lucide-react';
import { DocumentInfo, DocumentType, DocumentStatus } from '../services/trade.service';
import DocumentVersionHistory from './DocumentVersionHistory';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

interface ViewDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: DocumentInfo | null;
    documentType: DocumentType;
    tradeId?: string;
    title?: string;
    canVerify?: boolean;
    canRejectSPA?: boolean; // Special flag for SPA rejection (since SPA uses signatures, not approval)
    onVerify?: (status: 'approved' | 'rejected', notes?: string) => Promise<void>;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    'sco': 'Soft Corporate Offer (SCO)',
    'icpo': 'Irrevocable Corporate Purchase Order (ICPO)',
    'spa': 'Sales Purchase Agreement (SPA)',
    'bol': 'Bill of Lading (BoL)',
    'payment-proof': 'Payment Proof'
};

const STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string; label: string }> = {
    'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    'uploaded': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Uploaded' },
    'approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
    'rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
};

const ViewDocumentModal: React.FC<ViewDocumentModalProps> = ({
    isOpen,
    onClose,
    document,
    documentType,
    tradeId,
    title,
    canVerify = false,
    canRejectSPA = false,
    onVerify
}) => {
    const [verifying, setVerifying] = useState(false);
    const [verificationNotes, setVerificationNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showVersionHistory, setShowVersionHistory] = useState(false);

    if (!isOpen || !document) return null;

    const documentUrl = `${BACKEND_URL}${document.filePath.startsWith('/') ? '' : '/'}${document.filePath}`;
    const displayTitle = title || DOCUMENT_TYPE_LABELS[documentType];
    const statusInfo = STATUS_COLORS[document.status] || STATUS_COLORS.uploaded;
    const isPDF = document.mimeType === 'application/pdf';
    const isImage = document.mimeType.startsWith('image/');

    const handleDownload = () => {
        window.open(documentUrl, '_blank');
    };

    const handleVerify = async (status: 'approved' | 'rejected') => {
        if (!onVerify) return;

        try {
            setVerifying(true);
            setError(null);
            await onVerify(status, verificationNotes || undefined);
            setVerificationNotes('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to verify document');
        } finally {
            setVerifying(false);
        }
    };

    const handleClose = () => {
        if (!verifying) {
            setVerificationNotes('');
            setError(null);
            onClose();
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] shadow-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-800">{displayTitle}</h2>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={verifying}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    {/* Document Preview */}
                    <div className="p-4 bg-gray-100">
                        {isPDF ? (
                            <object
                                data={documentUrl}
                                type="application/pdf"
                                className="w-full h-[50vh] min-h-[260px] max-h-[50vh] rounded-lg"
                            >
                                <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg p-8">
                                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                                    <p className="text-gray-600 mb-4">Unable to display PDF in browser</p>
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open in New Tab
                                    </button>
                                </div>
                            </object>
                        ) : isImage ? (
                            <div className="flex items-center justify-center">
                                <img
                                    src={documentUrl}
                                    alt={document.originalName}
                                    className="max-w-full h-[50vh] min-h-[260px] max-h-[50vh] object-contain rounded-lg shadow-lg"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center bg-white rounded-lg p-8">
                                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                                <p className="text-gray-800 font-medium mb-2">{document.originalName}</p>
                                <p className="text-gray-500 text-sm mb-4">Preview not available for this file type</p>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Download className="w-4 h-4" />
                                    Download to View
                                </button>
                            </div>
                        )}
                    </div>

                {/* Document Info */}
                <div className="p-4 border-t bg-gray-50">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div>
                            <span className="font-medium">File:</span> {document.originalName}
                        </div>
                        <div>
                            <span className="font-medium">Size:</span> {formatFileSize(document.size)}
                        </div>
                        <div>
                            <span className="font-medium">Uploaded:</span> {formatDate(document.uploadedAt)}
                        </div>
                        {document.notes && (
                            <div className="w-full">
                                <span className="font-medium">Notes:</span> {document.notes}
                            </div>
                        )}
                    </div>
                </div>

                {/* Version History Section */}
                {tradeId && (
                    <div className="border-t">
                        <button
                            onClick={() => setShowVersionHistory(!showVersionHistory)}
                            className="w-full p-3 flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4" />
                                <span className="font-medium">Version History</span>
                            </div>
                            {showVersionHistory ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </button>
                        {showVersionHistory && (
                            <div className="px-4 pb-4">
                                <DocumentVersionHistory
                                    tradeId={tradeId}
                                    documentType={documentType}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Verification Section */}
                {canVerify && (document.status === 'uploaded' || document.status === 'pending') && (
                    <div className="p-4 border-t">
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2">
                                    Approval notes (optional)
                                </label>
                                <textarea
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    placeholder="Add a short note for the other party..."
                                    rows={2}
                                    disabled={verifying}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-300 resize-none disabled:bg-gray-100"
                                />
                            </div>

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleVerify('rejected')}
                                    disabled={verifying}
                                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {verifying ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleVerify('approved')}
                                    disabled={verifying}
                                    className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {verifying ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Approve
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SPA Rejection Section - Either party can reject SPA */}
                {canRejectSPA && documentType === 'spa' && document.status !== 'rejected' && (
                    <div className="p-4 border-t">
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                                If there are issues with this SPA, you can reject it and request a new version.
                            </p>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2">
                                    Rejection reason (recommended)
                                </label>
                                <textarea
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    placeholder="Explain why the SPA needs revision..."
                                    rows={2}
                                    disabled={verifying}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-300 resize-none disabled:bg-gray-100"
                                />
                            </div>

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={() => handleVerify('rejected')}
                                disabled={verifying}
                                className="w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {verifying ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4" />
                                        Reject SPA
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
                </div>

                {/* Footer - Download Button */}
                <div className="p-4 border-t bg-gray-50 flex gap-3 flex-shrink-0">
                    <button
                        onClick={handleClose}
                        disabled={verifying}
                        className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download className="w-5 h-5" />
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewDocumentModal;
