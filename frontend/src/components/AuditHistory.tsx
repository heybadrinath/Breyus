import React, { useState, useEffect } from 'react';
import {
    Clock,
    FileText,
    Check,
    X,
    RefreshCw,
    Upload,
    ChevronDown,
    ChevronUp,
    Filter,
    User,
    ArrowRight
} from 'lucide-react';
import SelectField from './SelectField';

// Audit action types matching the backend
type AuditAction =
    | 'trade_created'
    | 'counter_offer'
    | 'buyer_response'
    | 'accepted'
    | 'rejected'
    | 'cancelled'
    | 'document_uploaded'
    | 'document_replaced'
    | 'document_verified'
    | 'document_rejected'
    | 'phase_advanced'
    | 'trade_completed'
    | 'signature_added';

interface AuditLog {
    _id: string;
    trade: string;
    performedBy: {
        _id: string;
        mail: string;
    };
    action: AuditAction;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    details?: string;
    documentType?: string;
    createdAt: string;
}

interface AuditHistoryProps {
    tradeId: string;
    onClose?: () => void;
}

// Action icons and colors
const actionConfig: Record<AuditAction, { icon: React.ReactNode; color: string; label: string }> = {
    'trade_created': {
        icon: <FileText size={16} />,
        color: 'bg-blue-100 text-blue-600',
        label: 'Trade Created'
    },
    'counter_offer': {
        icon: <RefreshCw size={16} />,
        color: 'bg-orange-100 text-orange-600',
        label: 'Counter Offer'
    },
    'buyer_response': {
        icon: <RefreshCw size={16} />,
        color: 'bg-purple-100 text-purple-600',
        label: 'Buyer Response'
    },
    'accepted': {
        icon: <Check size={16} />,
        color: 'bg-green-100 text-green-600',
        label: 'Trade Accepted'
    },
    'rejected': {
        icon: <X size={16} />,
        color: 'bg-red-100 text-red-600',
        label: 'Trade Rejected'
    },
    'cancelled': {
        icon: <X size={16} />,
        color: 'bg-gray-100 text-gray-600',
        label: 'Trade Cancelled'
    },
    'document_uploaded': {
        icon: <Upload size={16} />,
        color: 'bg-blue-100 text-blue-600',
        label: 'Document Uploaded'
    },
    'document_replaced': {
        icon: <RefreshCw size={16} />,
        color: 'bg-yellow-100 text-yellow-600',
        label: 'Document Replaced'
    },
    'document_verified': {
        icon: <Check size={16} />,
        color: 'bg-green-100 text-green-600',
        label: 'Document Verified'
    },
    'document_rejected': {
        icon: <X size={16} />,
        color: 'bg-red-100 text-red-600',
        label: 'Document Rejected'
    },
    'phase_advanced': {
        icon: <ArrowRight size={16} />,
        color: 'bg-indigo-100 text-indigo-600',
        label: 'Phase Advanced'
    },
    'trade_completed': {
        icon: <Check size={16} />,
        color: 'bg-green-100 text-green-600',
        label: 'Trade Completed'
    },
    'signature_added': {
        icon: <FileText size={16} />,
        color: 'bg-blue-100 text-blue-600',
        label: 'Signature Added'
    },
};

const AuditHistory: React.FC<AuditHistoryProps> = ({ tradeId, onClose }) => {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [filterAction, setFilterAction] = useState<AuditAction | 'all'>('all');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchAuditHistory();
    }, [tradeId, filterAction]);

    const fetchAuditHistory = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            queryParams.append('limit', '50');
            if (filterAction !== 'all') {
                queryParams.append('action', filterAction);
            }

            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/trade/${tradeId}/audit-history?${queryParams}`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch audit history');
            }

            const data = await response.json();
            setAuditLogs(data.data.logs || []);
            setTotal(data.data.total || 0);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audit history');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (logId: string) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(logId)) {
            newExpanded.delete(logId);
        } else {
            newExpanded.add(logId);
        }
        setExpandedLogs(newExpanded);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionDisplay = (action: AuditAction) => {
        return actionConfig[action] || {
            icon: <Clock size={16} />,
            color: 'bg-gray-100 text-gray-600',
            label: action
        };
    };

    const renderStateChanges = (log: AuditLog) => {
        if (!log.previousState && !log.newState) return null;

        return (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                {log.previousState && (
                    <div className="mb-2">
                        <span className="font-medium text-gray-500">Previous State:</span>
                        <pre className="mt-1 text-xs text-gray-600 overflow-x-auto">
                            {JSON.stringify(log.previousState, null, 2)}
                        </pre>
                    </div>
                )}
                {log.newState && (
                    <div>
                        <span className="font-medium text-gray-500">New State:</span>
                        <pre className="mt-1 text-xs text-gray-600 overflow-x-auto">
                            {JSON.stringify(log.newState, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading audit history...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Audit History
                    </h3>
                    <span className="text-sm text-gray-500">
                        {total} event{total !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Filter */}
                <div className="mt-3 flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <SelectField
                        value={filterAction}
                        className="select-field--sm"
                        onValueChange={(value) => setFilterAction(value as AuditAction | 'all')}
                    >
                        <option value="all">All Actions</option>
                        <option value="trade_created">Trade Created</option>
                        <option value="counter_offer">Counter Offers</option>
                        <option value="buyer_response">Buyer Responses</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="document_uploaded">Documents Uploaded</option>
                        <option value="document_verified">Documents Verified</option>
                        <option value="phase_advanced">Phase Changes</option>
                        <option value="trade_completed">Completed</option>
                        <option value="signature_added">Signatures</option>
                    </SelectField>
                </div>
            </div>

            {/* Timeline */}
            <div className="p-4">
                {auditLogs.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        No audit events found
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                        {/* Timeline items */}
                        <div className="space-y-4">
                            {auditLogs.map((log, index) => {
                                const actionDisplay = getActionDisplay(log.action);
                                const isExpanded = expandedLogs.has(log._id);
                                const hasDetails = log.previousState || log.newState;

                                return (
                                    <div key={log._id} className="relative pl-10">
                                        {/* Timeline dot */}
                                        <div className={`absolute left-2 w-5 h-5 rounded-full ${actionDisplay.color} flex items-center justify-center -translate-x-1/2`}>
                                            {actionDisplay.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${actionDisplay.color}`}>
                                                        {actionDisplay.label}
                                                    </span>
                                                    {log.documentType && (
                                                        <span className="ml-2 text-xs text-gray-500">
                                                            ({log.documentType.toUpperCase()})
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock size={12} />
                                                    {formatDate(log.createdAt)}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            {log.details && (
                                                <p className="mt-2 text-sm text-gray-600">
                                                    {log.details}
                                                </p>
                                            )}

                                            {/* Performer */}
                                            <div className="mt-2 flex items-center text-xs text-gray-500">
                                                <User size={12} className="mr-1" />
                                                {log.performedBy?.mail || 'Unknown user'}
                                            </div>

                                            {/* Expand/Collapse for state changes */}
                                            {hasDetails && (
                                                <button
                                                    onClick={() => toggleExpand(log._id)}
                                                    className="mt-2 flex items-center text-xs text-blue-600 hover:text-blue-800"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <ChevronUp size={14} className="mr-1" />
                                                            Hide Details
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown size={14} className="mr-1" />
                                                            Show Details
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Expanded state changes */}
                                            {isExpanded && renderStateChanges(log)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {onClose && (
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuditHistory;
