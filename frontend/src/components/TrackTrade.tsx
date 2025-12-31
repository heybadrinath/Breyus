import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    CheckCircle,
    Clock,
    Package,
    DollarSign,
    Ship,
    Award,
    Loader2,
    Download,
    Upload,
    Eye,
    AlertCircle,
    Pen,
    Check,
    X
} from 'lucide-react';
import {
    Trade,
    TradePhase,
    DocumentInfo,
    SPAStatus,
    getTradeById,
    getTradeDocuments,
    uploadSCO,
    uploadICPO,
    uploadSPA,
    uploadBoL,
    uploadPaymentProof,
    completeTrade,
    verifyDocument,
    signDocument
} from '../services/trade.service';
import DocumentUploadModal, { DocumentType } from './DocumentUploadModal';
import ViewDocumentModal from './ViewDocumentModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

interface TrackTradeProps {
    tradeId: string;
    isSeller: boolean;
}

interface PhaseInfo {
    key: TradePhase;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    description: string;
    documentType?: DocumentType;
    uploadedBy: 'seller' | 'buyer';
}

const PHASES: PhaseInfo[] = [
    {
        key: 'PR',
        label: 'Purchase Request',
        shortLabel: 'PR',
        icon: <Package className="w-5 h-5" />,
        description: 'Initial purchase request and negotiation',
        uploadedBy: 'buyer'
    },
    {
        key: 'SCO',
        label: 'Soft Corporate Offer',
        shortLabel: 'SCO',
        icon: <FileText className="w-5 h-5" />,
        description: 'Seller provides SCO document',
        documentType: 'sco',
        uploadedBy: 'seller'
    },
    {
        key: 'ICPO',
        label: 'Irrevocable Corporate Purchase Order',
        shortLabel: 'ICPO',
        icon: <FileText className="w-5 h-5" />,
        description: 'Buyer confirms with ICPO',
        documentType: 'icpo',
        uploadedBy: 'buyer'
    },
    {
        key: 'SPA',
        label: 'Sales Purchase Agreement',
        shortLabel: 'SPA',
        icon: <FileText className="w-5 h-5" />,
        description: 'Both parties sign SPA',
        documentType: 'spa',
        uploadedBy: 'seller'
    },
    {
        key: 'PAYMENT',
        label: 'Payment',
        shortLabel: 'Payment',
        icon: <DollarSign className="w-5 h-5" />,
        description: 'Buyer submits payment proof',
        documentType: 'payment-proof',
        uploadedBy: 'buyer'
    },
    {
        key: 'BOL',
        label: 'Bill of Lading',
        shortLabel: 'BoL',
        icon: <Ship className="w-5 h-5" />,
        description: 'Seller provides shipping documents',
        documentType: 'bol',
        uploadedBy: 'seller'
    },
    {
        key: 'COMPLETED',
        label: 'Completed',
        shortLabel: 'Done',
        icon: <Award className="w-5 h-5" />,
        description: 'Trade completed successfully',
        uploadedBy: 'seller'
    }
];

const TrackTrade: React.FC<TrackTradeProps> = ({ tradeId, isSeller }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [trade, setTrade] = useState<Trade | null>(null);
    const [documents, setDocuments] = useState<Record<string, DocumentInfo>>({});
    const [currentPhase, setCurrentPhase] = useState<TradePhase>('PR');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
    const [completing, setCompleting] = useState(false);

    // View document modal state
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingDocument, setViewingDocument] = useState<DocumentInfo | null>(null);
    const [viewingDocType, setViewingDocType] = useState<DocumentType | null>(null);

    // SPA dual signature tracking
    const [spaStatus, setSpaStatus] = useState<SPAStatus | null>(null);
    const [signingSpa, setSigningSpa] = useState(false);

    useEffect(() => {
        fetchTradeData();
    }, [tradeId]);

    const fetchTradeData = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            setError(null);

            const [tradeResponse, docsResponse] = await Promise.all([
                getTradeById(tradeId),
                getTradeDocuments(tradeId)
            ]);

            const tradeData = tradeResponse.data as Trade;
            setTrade(tradeData);
            setCurrentPhase((tradeData as any).tradePhase || 'PR');

            // Map documents - backend returns nested structure {documents: {sco, icpo, spa, bol, paymentProof}}
            const docs: Record<string, DocumentInfo> = {};
            const docsData = docsResponse.data as any;
            // Handle both nested structure (from getTradeDocuments) and flat structure (from getTradeById)
            const nestedDocs = docsData.documents || {};
            // Check nested structure first
            if (nestedDocs.sco) docs['sco'] = nestedDocs.sco;
            if (nestedDocs.icpo) docs['icpo'] = nestedDocs.icpo;
            if (nestedDocs.spa) docs['spa'] = nestedDocs.spa;
            if (nestedDocs.bol) docs['bol'] = nestedDocs.bol;
            if (nestedDocs.paymentProof) docs['payment-proof'] = nestedDocs.paymentProof;
            // Also check for flat document properties (scoDocument, icpoDocument, etc.)
            if (docsData.scoDocument) docs['sco'] = docsData.scoDocument;
            if (docsData.icpoDocument) docs['icpo'] = docsData.icpoDocument;
            if (docsData.spaDocument) docs['spa'] = docsData.spaDocument;
            if (docsData.bolDocument) docs['bol'] = docsData.bolDocument;
            if (docsData.paymentProof && !docs['payment-proof']) docs['payment-proof'] = docsData.paymentProof;
            setDocuments(docs);

            // Extract SPA status for dual signature tracking
            if (docsData.spaStatus) {
                setSpaStatus(docsData.spaStatus);
            } else if (docs['spa']) {
                // Construct SPA status from document
                const spaDoc = docs['spa'] as any;
                setSpaStatus({
                    uploaded: true,
                    sellerSigned: !!spaDoc.sellerSignatureDataUrl,
                    buyerSigned: !!spaDoc.buyerSignatureDataUrl,
                    fullySigned: !!spaDoc.sellerSignatureDataUrl && !!spaDoc.buyerSignatureDataUrl
                });
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load trade data');
        } finally {
            setLoading(false);
        }
    };

    const getPhaseIndex = (phase: TradePhase): number => {
        return PHASES.findIndex(p => p.key === phase);
    };

    const isPhaseComplete = (phase: TradePhase): boolean => {
        return getPhaseIndex(phase) < getPhaseIndex(currentPhase);
    };

    const isCurrentPhase = (phase: TradePhase): boolean => {
        return phase === currentPhase;
    };

    const canUpload = (phase: PhaseInfo): boolean => {
        if (!isCurrentPhase(phase.key)) return false;
        if (!phase.documentType) return false;

        const roleMatches = (isSeller && phase.uploadedBy === 'seller') ||
                          (!isSeller && phase.uploadedBy === 'buyer');

        return roleMatches && !documents[phase.documentType];
    };

    const handleUploadClick = (docType: DocumentType) => {
        setSelectedDocType(docType);
        setShowUploadModal(true);
    };

    const handleUpload = async (file: File, notes?: string) => {
        if (!selectedDocType) return;

        const uploadFns: Record<DocumentType, typeof uploadSCO> = {
            'sco': uploadSCO,
            'icpo': uploadICPO,
            'spa': uploadSPA,
            'bol': uploadBoL,
            'payment-proof': uploadPaymentProof
        };

        await uploadFns[selectedDocType](tradeId, file, notes);
        await fetchTradeData();
    };

    const handleDownload = (doc: DocumentInfo) => {
        const url = `${BACKEND_URL}${doc.filePath}`;
        window.open(url, '_blank');
    };

    // Determine if user can verify a document based on role and document type
    const canVerifyDocument = (docType: DocumentType): boolean => {
        if (docType === 'sco') return !isSeller;          // Buyer verifies SCO
        if (docType === 'icpo') return isSeller;          // Seller verifies ICPO
        if (docType === 'spa') return true;               // Both can verify SPA
        if (docType === 'payment-proof') return isSeller; // Seller verifies payment
        if (docType === 'bol') return !isSeller;          // Buyer verifies BoL
        return false;
    };

    const handleViewDocument = (doc: DocumentInfo, docType: DocumentType) => {
        setViewingDocument(doc);
        setViewingDocType(docType);
        setShowViewModal(true);
    };

    const handleVerify = async (status: 'approved' | 'rejected', notes?: string) => {
        if (!viewingDocType) return;
        await verifyDocument(tradeId, viewingDocType, status, notes);
        await fetchTradeData();
    };

    // Handle SPA signing - both parties must sign
    const handleSignSPA = async (signatureDataUrl: string) => {
        try {
            setSigningSpa(true);
            const result = await signDocument(tradeId, 'spa', signatureDataUrl);
            console.log('Sign SPA result:', result);

            // Update SPA status from response if available
            const responseData = result.data as any;
            if (responseData?.spaStatus) {
                setSpaStatus(responseData.spaStatus);
            }

            // Update trade phase if it changed
            if (responseData?.trade?.tradePhase) {
                setCurrentPhase(responseData.trade.tradePhase);
            }

            // Show success message
            alert(result.message || 'SPA signed successfully!');

            // Refresh full data in background (without loading spinner)
            fetchTradeData(false);
        } catch (err: any) {
            console.error('Failed to sign SPA:', err);
            alert(err.message || 'Failed to sign SPA. Please try again.');
        } finally {
            setSigningSpa(false);
        }
    };

    // Check if current user can sign SPA
    const canSignSPA = (): boolean => {
        if (!spaStatus || !spaStatus.uploaded) return false;
        if (spaStatus.fullySigned) return false;
        // Seller can sign if they haven't signed yet
        if (isSeller && !spaStatus.sellerSigned) return true;
        // Buyer can sign if they haven't signed yet
        if (!isSeller && !spaStatus.buyerSigned) return true;
        return false;
    };

    const handleCompleteTrade = async () => {
        if (!window.confirm('Are you sure you want to mark this trade as complete?')) return;
        try {
            setCompleting(true);
            await completeTrade(tradeId);
            navigate(isSeller ? '/seller/trade-complete' : '/buyer/trade-complete');
        } catch (err) {
            console.error('Failed to complete trade:', err);
            alert('Failed to complete trade. Please try again.');
        } finally {
            setCompleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">Loading trade progress...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-500">{error}</p>
                <button
                    onClick={() => fetchTradeData()}
                    className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gray-50 border-b">
                <h2 className="text-lg font-bold text-gray-800">Trade Progress</h2>
                <p className="text-sm text-gray-500">
                    {trade?.product?.name || 'Trade'} - {trade?.quantity} {trade?.quantityUnit}
                </p>
            </div>

            {/* Progress Pipeline */}
            <div className="p-6">
                <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded">
                        <div
                            className="h-full bg-green-500 rounded transition-all duration-500"
                            style={{
                                width: `${(getPhaseIndex(currentPhase) / (PHASES.length - 1)) * 100}%`
                            }}
                        />
                    </div>

                    {/* Phase Nodes */}
                    <div className="flex justify-between relative">
                        {PHASES.map((phase, index) => {
                            const isComplete = isPhaseComplete(phase.key);
                            const isCurrent = isCurrentPhase(phase.key);
                            const doc = phase.documentType ? documents[phase.documentType] : null;

                            return (
                                <div key={phase.key} className="flex flex-col items-center" style={{ width: '14%' }}>
                                    {/* Node */}
                                    <div
                                        className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                            isComplete
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : isCurrent
                                                    ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                                                    : 'bg-white border-gray-300 text-gray-400'
                                        }`}
                                    >
                                        {isComplete ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : isCurrent ? (
                                            <Clock className="w-6 h-6" />
                                        ) : (
                                            phase.icon
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className={`mt-2 text-xs font-medium text-center ${
                                        isCurrent ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                        {phase.shortLabel}
                                    </span>

                                    {/* Document Actions */}
                                    {phase.documentType && (
                                        <div className="mt-2">
                                            {/* Special handling for SPA - show dual signature status */}
                                            {phase.key === 'SPA' && doc ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onClick={() => handleViewDocument(doc, phase.documentType!)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </button>
                                                    {/* SPA Signature Status */}
                                                    {spaStatus && (
                                                        <div className="flex flex-col items-center gap-0.5 mt-1">
                                                            <div className={`flex items-center gap-1 text-xs ${spaStatus.sellerSigned ? 'text-green-600' : 'text-yellow-600'}`}>
                                                                {spaStatus.sellerSigned ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                Seller
                                                            </div>
                                                            <div className={`flex items-center gap-1 text-xs ${spaStatus.buyerSigned ? 'text-green-600' : 'text-yellow-600'}`}>
                                                                {spaStatus.buyerSigned ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                Buyer
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : doc ? (
                                                <button
                                                    onClick={() => handleViewDocument(doc, phase.documentType!)}
                                                    className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    View
                                                </button>
                                            ) : canUpload(phase) ? (
                                                <button
                                                    onClick={() => handleUploadClick(phase.documentType!)}
                                                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                                                >
                                                    <Upload className="w-3 h-3" />
                                                    Upload
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    {isComplete || isCurrent ? 'Pending' : '-'}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Current Phase Details */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Current Phase: {PHASES.find(p => p.key === currentPhase)?.label}
                    </h3>
                    <p className="text-sm text-blue-600 mt-1">
                        {PHASES.find(p => p.key === currentPhase)?.description}
                    </p>

                    {/* Action Prompt */}
                    {currentPhase !== 'COMPLETED' && (
                        <div className="mt-3">
                            {(() => {
                                const phase = PHASES.find(p => p.key === currentPhase);
                                if (!phase?.documentType) return null;

                                // Special handling for SPA - dual signature flow
                                if (currentPhase === 'SPA' && documents['spa']) {
                                    if (spaStatus?.fullySigned) {
                                        return (
                                            <p className="text-sm text-green-600 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                SPA fully signed by both parties - proceeding to Payment phase
                                            </p>
                                        );
                                    }

                                    const userHasSigned = isSeller ? spaStatus?.sellerSigned : spaStatus?.buyerSigned;
                                    const otherParty = isSeller ? 'buyer' : 'seller';
                                    const otherHasSigned = isSeller ? spaStatus?.buyerSigned : spaStatus?.sellerSigned;

                                    if (userHasSigned) {
                                        return (
                                            <p className="text-sm text-yellow-600 flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                You have signed. Waiting for {otherParty} to sign...
                                            </p>
                                        );
                                    }

                                    return (
                                        <div className="space-y-2">
                                            {otherHasSigned && (
                                                <p className="text-sm text-blue-600">
                                                    The {otherParty} has already signed. Your signature is required.
                                                </p>
                                            )}
                                            <p className="text-sm text-gray-600 mb-2">
                                                Please review and sign the SPA to proceed.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    // For now, use a simple signature - in production, use SignatureCanvas
                                                    const signaturePlaceholder = `data:text/plain;base64,${btoa(isSeller ? 'Seller Signature' : 'Buyer Signature')}`;
                                                    handleSignSPA(signaturePlaceholder);
                                                }}
                                                disabled={signingSpa}
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400"
                                            >
                                                {signingSpa ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Signing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pen className="w-4 h-4" />
                                                        Sign SPA
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                }

                                const canAct = canUpload(phase);
                                const waitingFor = phase.uploadedBy === 'seller' ? 'seller' : 'buyer';

                                return canAct ? (
                                    <button
                                        onClick={() => handleUploadClick(phase.documentType!)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload {phase.shortLabel}
                                    </button>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        Waiting for {waitingFor} to upload {phase.shortLabel}...
                                    </p>
                                );
                            })()}
                        </div>
                    )}

                    {/* Complete Trade Button - shown when BoL is uploaded */}
                    {currentPhase === 'BOL' && documents['bol'] && (
                        <button
                            onClick={handleCompleteTrade}
                            disabled={completing}
                            className="mt-4 flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                        >
                            {completing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Completing Trade...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Complete Trade
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Documents List */}
                <div className="mt-6">
                    <h3 className="font-medium text-gray-800 mb-3">Uploaded Documents</h3>
                    {Object.keys(documents).length === 0 ? (
                        <p className="text-sm text-gray-500">No documents uploaded yet</p>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(documents).map(([type, doc]) => (
                                <div
                                    key={type}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-sm">{doc.originalName}</p>
                                            <p className="text-xs text-gray-500">
                                                {type.toUpperCase()} - Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleViewDocument(doc, type as DocumentType)}
                                        className="p-2 hover:bg-gray-200 rounded-lg"
                                    >
                                        <Eye className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* View Document Modal */}
            {viewingDocType && (
                <ViewDocumentModal
                    isOpen={showViewModal}
                    onClose={() => {
                        setShowViewModal(false);
                        setViewingDocument(null);
                        setViewingDocType(null);
                    }}
                    document={viewingDocument}
                    documentType={viewingDocType}
                    canVerify={canVerifyDocument(viewingDocType) && viewingDocument?.status === 'uploaded'}
                    onVerify={handleVerify}
                />
            )}

            {/* Upload Modal */}
            {selectedDocType && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedDocType(null);
                    }}
                    onUpload={handleUpload}
                    documentType={selectedDocType}
                />
            )}
        </div>
    );
};

export default TrackTrade;
