import React from "react";
import { Eye, RefreshCw, Clock, CheckCircle, XCircle, FileText, Download } from "lucide-react";

export interface DocumentInfo {
    filePath: string;
    originalName?: string;
    mimeType?: string;
    size?: number;
    uploadedAt?: string | Date;
    uploadedBy?: string;
    status?: 'pending' | 'uploaded' | 'approved' | 'rejected';
    notes?: string;
    version?: number;
}

interface DocumentStatusBadgeProps {
    documentType: 'sco' | 'icpo' | 'spa' | 'bol' | 'payment';
    document?: DocumentInfo | null;
    showViewButton?: boolean;
    onView?: () => void;
    showReplaceButton?: boolean;
    onReplace?: () => void;
    showDownloadButton?: boolean;
    onDownload?: () => void;
    compact?: boolean;
    showTimestamp?: boolean;
}

const documentLabels: Record<string, string> = {
    sco: 'SCO',
    icpo: 'ICPO',
    spa: 'SPA',
    bol: 'Bill of Lading',
    payment: 'Payment Proof'
};

const statusConfig = {
    not_uploaded: {
        label: 'Not Uploaded',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        dotColor: 'bg-gray-400',
        icon: FileText
    },
    uploaded: {
        label: 'Uploaded',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        dotColor: 'bg-blue-500',
        icon: FileText
    },
    pending: {
        label: 'Pending Review',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        dotColor: 'bg-yellow-500',
        icon: Clock
    },
    approved: {
        label: 'Verified',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        dotColor: 'bg-green-500',
        icon: CheckCircle
    },
    rejected: {
        label: 'Rejected',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        dotColor: 'bg-red-500',
        icon: XCircle
    }
};

const formatDate = (date: string | Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
    documentType,
    document,
    showViewButton = true,
    onView,
    showReplaceButton = false,
    onReplace,
    showDownloadButton = false,
    onDownload,
    compact = false,
    showTimestamp = true
}) => {
    const getStatus = () => {
        if (!document || !document.filePath) return 'not_uploaded';
        if (document.status === 'approved') return 'approved';
        if (document.status === 'rejected') return 'rejected';
        if (document.status === 'pending') return 'pending';
        return 'uploaded';
    };

    const status = getStatus();
    const config = statusConfig[status];
    const Icon = config.icon;
    const docLabel = documentLabels[documentType] || documentType.toUpperCase();

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                <span className={`text-sm ${config.textColor}`}>{config.label}</span>
                {document && showViewButton && onView && (
                    <button
                        onClick={onView}
                        className="text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                        View
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`rounded-lg p-3 ${config.bgColor} border`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                    <div>
                        <span className={`text-sm font-medium ${config.textColor}`}>
                            {docLabel}: {config.label}
                        </span>
                        {document && showTimestamp && document.uploadedAt && (
                            <p className="text-xs text-gray-500 mt-0.5">
                                {formatDate(document.uploadedAt)}
                            </p>
                        )}
                        {document?.version && document.version > 1 && (
                            <p className="text-xs text-gray-500">
                                Version {document.version}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {document && showViewButton && onView && (
                        <button
                            onClick={onView}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                            title={`View ${docLabel}`}
                        >
                            <Eye size={16} />
                        </button>
                    )}
                    {document && showDownloadButton && onDownload && (
                        <button
                            onClick={onDownload}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                            title={`Download ${docLabel}`}
                        >
                            <Download size={16} />
                        </button>
                    )}
                    {showReplaceButton && onReplace && (
                        <button
                            onClick={onReplace}
                            className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-white rounded transition-colors"
                            title={document ? `Replace ${docLabel}` : `Upload ${docLabel}`}
                        >
                            <RefreshCw size={16} />
                        </button>
                    )}
                </div>
            </div>

            {status === 'rejected' && document?.notes && (
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                    <strong>Rejection reason:</strong> {document.notes}
                </div>
            )}
        </div>
    );
};

// Simple inline badge for table rows
export const DocumentStatusDot: React.FC<{
    document?: DocumentInfo | null;
    label?: string;
}> = ({ document, label }) => {
    const getStatus = () => {
        if (!document || !document.filePath) return 'not_uploaded';
        if (document.status === 'approved') return 'approved';
        if (document.status === 'rejected') return 'rejected';
        if (document.status === 'pending') return 'pending';
        return 'uploaded';
    };

    const status = getStatus();
    const config = statusConfig[status];

    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
            <span className={`text-sm ${config.textColor}`}>
                {label || config.label}
            </span>
        </div>
    );
};

// Trade phase aware status message
export const TradePhaseMessage: React.FC<{
    tradePhase?: string;
    scoDocument?: DocumentInfo | null;
    icpoDocument?: DocumentInfo | null;
    isBuyer: boolean;
}> = ({ tradePhase, scoDocument, icpoDocument, isBuyer }) => {
    const getMessage = () => {
        if (isBuyer) {
            // Buyer perspective
            if (!scoDocument) {
                return {
                    text: "Waiting for seller to upload SCO",
                    color: "text-yellow-600",
                    bgColor: "bg-yellow-50"
                };
            }
            if (scoDocument && !icpoDocument) {
                return {
                    text: "SCO Received - Upload your ICPO to proceed",
                    color: "text-blue-600",
                    bgColor: "bg-blue-50"
                };
            }
            if (icpoDocument?.status === 'uploaded' || icpoDocument?.status === 'pending') {
                return {
                    text: "ICPO Sent - Awaiting seller verification",
                    color: "text-yellow-600",
                    bgColor: "bg-yellow-50"
                };
            }
            if (icpoDocument?.status === 'approved') {
                return {
                    text: "ICPO Verified - Ready for SPA",
                    color: "text-green-600",
                    bgColor: "bg-green-50"
                };
            }
            if (icpoDocument?.status === 'rejected') {
                return {
                    text: "ICPO Rejected - Please re-upload",
                    color: "text-red-600",
                    bgColor: "bg-red-50"
                };
            }
        } else {
            // Seller perspective
            if (!scoDocument) {
                return {
                    text: "Upload your SCO to proceed",
                    color: "text-blue-600",
                    bgColor: "bg-blue-50"
                };
            }
            if (scoDocument && !icpoDocument) {
                return {
                    text: "SCO Sent - Waiting for buyer's ICPO",
                    color: "text-yellow-600",
                    bgColor: "bg-yellow-50"
                };
            }
            if (icpoDocument?.status === 'uploaded' || icpoDocument?.status === 'pending') {
                return {
                    text: "ICPO Received - Review and verify",
                    color: "text-blue-600",
                    bgColor: "bg-blue-50"
                };
            }
            if (icpoDocument?.status === 'approved') {
                return {
                    text: "ICPO Verified - Ready for SPA",
                    color: "text-green-600",
                    bgColor: "bg-green-50"
                };
            }
        }

        return {
            text: `Phase: ${tradePhase || 'Unknown'}`,
            color: "text-gray-600",
            bgColor: "bg-gray-50"
        };
    };

    const message = getMessage();

    return (
        <div className={`px-3 py-2 rounded-lg ${message.bgColor} ${message.color} text-sm font-medium`}>
            {message.text}
        </div>
    );
};

export default DocumentStatusBadge;
