import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle, XCircle, Loader2, AlertCircle, ExternalLink, History, ChevronDown, ChevronUp } from 'lucide-react';
import { DocumentInfo, DocumentType, DocumentStatus } from '../services/trade.service';
import DocumentVersionHistory from './DocumentVersionHistory';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

interface ViewDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: DocumentInfo | null;
    documentType: DocumentType;
    tradeId?: string;
    title?: string;
    canVerify?: boolean;
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
    onVerify
}) => {
    const [verifying, setVerifying] = useState(false);
    const [verificationNotes, setVerificationNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showVerifySection, setShowVerifySection] = useState(false);
    const [showVersionHistory, setShowVersionHistory] = useState(false);

    if (!isOpen || !document) return null;

    const documentUrl = `${BACKEND_URL}${document.filePath.startsWith('/') ? '' : '/'}${document.filePath}`;
    const displayTitle = title || DOCUMENT_TYPE_LABELS[documentType];
    const statusInfo = STATUS_COLORS[document.status];
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
            setShowVerifySection(false);
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
            setShowVerifySection(false);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] shadow-xl flex flex-col">
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

                {/* Document Preview */}
                <div className="flex-1 overflow-hidden p-4 bg-gray-100 min-h-[400px]">
                    {isPDF ? (
                        <object
                            data={documentUrl}
                            type="application/pdf"
                            className="w-full h-full min-h-[400px] rounded-lg"
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
                        <div className="flex items-center justify-center h-full">
                            <img
                                src={documentUrl}
                                alt={document.originalName}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg p-8">
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
                <div className="p-4 border-t bg-gray-50 flex-shrink-0">
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
                    <div className="border-t flex-shrink-0">
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
                {canVerify && document.status === 'uploaded' && (
                    <div className="p-4 border-t flex-shrink-0">
                        {!showVerifySection ? (
                            <button
                                onClick={() => setShowVerifySection(true)}
                                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Verify This Document
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Verification Notes (Optional)
                                    </label>
                                    <textarea
                                        value={verificationNotes}
                                        onChange={(e) => setVerificationNotes(e.target.value)}
                                        placeholder="Add notes about your verification decision..."
                                        rows={2}
                                        disabled={verifying}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowVerifySection(false)}
                                        disabled={verifying}
                                        className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleVerify('rejected')}
                                        disabled={verifying}
                                        className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {verifying ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <XCircle className="w-5 h-5" />
                                                Reject
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleVerify('approved')}
                                        disabled={verifying}
                                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {verifying ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Approve
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
