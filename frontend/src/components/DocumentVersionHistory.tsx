import React, { useState, useEffect } from 'react';
import { Clock, Download, FileText, ChevronDown, ChevronUp, CheckCircle, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

interface DocumentVersion {
    filePath: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    uploadedBy: {
        _id: string;
        mail: string;
    } | string;
    version: number;
    isCurrent: boolean;
}

interface DocumentVersionHistoryProps {
    tradeId: string;
    documentType: 'sco' | 'icpo' | 'spa' | 'signed-spa' | 'bol' | 'payment-proof';
    onVersionSelect?: (version: DocumentVersion) => void;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    'sco': 'Soft Corporate Offer',
    'icpo': 'Irrevocable Corporate Purchase Order',
    'spa': 'Sales Purchase Agreement',
    'signed-spa': 'Signed SPA',
    'bol': 'Bill of Lading',
    'payment-proof': 'Payment Proof'
};

const DocumentVersionHistory: React.FC<DocumentVersionHistoryProps> = ({
    tradeId,
    documentType,
    onVersionSelect
}) => {
    const [versions, setVersions] = useState<DocumentVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [downloading, setDownloading] = useState<number | null>(null);

    useEffect(() => {
        fetchVersions();
    }, [tradeId, documentType]);

    const fetchVersions = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `${BACKEND_URL}/trade/${tradeId}/document/${documentType}/versions`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch document versions');
            }

            const result = await response.json();
            setVersions(result.data?.versions || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load versions');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (version: DocumentVersion) => {
        try {
            setDownloading(version.version);

            const response = await fetch(
                `${BACKEND_URL}/trade/${tradeId}/document/${documentType}/version/${version.version}/download`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error('Failed to download document');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = version.originalName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download document');
        } finally {
            setDownloading(null);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUploaderEmail = (uploadedBy: DocumentVersion['uploadedBy']): string => {
        if (typeof uploadedBy === 'string') return uploadedBy;
        return uploadedBy?.mail || 'Unknown';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Loading versions...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-sm text-red-500 bg-red-50 rounded-lg">
                {error}
            </div>
        );
    }

    if (versions.length === 0) {
        return (
            <div className="p-4 text-sm text-gray-500 text-center">
                No document versions available
            </div>
        );
    }

    const currentVersion = versions.find(v => v.isCurrent);
    const previousVersions = versions.filter(v => !v.isCurrent);

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">
                        {DOCUMENT_TYPE_LABELS[documentType]} Versions
                    </h4>
                    <span className="text-xs text-gray-500">
                        {versions.length} version{versions.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Current Version */}
            {currentVersion && (
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800 truncate">
                                    {currentVersion.originalName}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Current
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>v{currentVersion.version}</span>
                                <span>{formatFileSize(currentVersion.size)}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(currentVersion.uploadedAt)}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                Uploaded by {getUploaderEmail(currentVersion.uploadedBy)}
                            </div>
                        </div>
                        <button
                            onClick={() => handleDownload(currentVersion)}
                            disabled={downloading === currentVersion.version}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Download current version"
                        >
                            {downloading === currentVersion.version ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Download className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Previous Versions Toggle */}
            {previousVersions.length > 0 && (
                <>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <span>Previous versions ({previousVersions.length})</span>
                        {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>

                    {/* Previous Versions List */}
                    {expanded && (
                        <div className="border-t border-gray-100">
                            {previousVersions.map((version) => (
                                <div
                                    key={version.version}
                                    className="p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-gray-700 truncate">
                                                {version.originalName}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>v{version.version}</span>
                                                <span>{formatFileSize(version.size)}</span>
                                                <span>{formatDate(version.uploadedAt)}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(version)}
                                            disabled={downloading === version.version}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                            title={`Download version ${version.version}`}
                                        >
                                            {downloading === version.version ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DocumentVersionHistory;
