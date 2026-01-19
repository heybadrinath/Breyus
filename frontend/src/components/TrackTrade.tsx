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
    Upload,
    Eye,
    AlertCircle,
    Pen,
    Check
} from 'lucide-react';
import {
    Trade,
    TradePhase,
    DocumentInfo,
    DocumentStatus,
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
import SignatureCanvas from './SignatureCanvas';
import { useNotifications } from '../contexts/NotificationContext';

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

const DOCUMENT_LABELS: Record<DocumentType, string> = {
    sco: 'SCO',
    icpo: 'ICPO',
    spa: 'SPA',
    'payment-proof': 'Payment Proof',
    bol: 'BoL'
};

const DOCUMENT_ORDER: DocumentType[] = [
    'sco',
    'icpo',
    'spa',
    'payment-proof',
    'bol'
];

const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
    pending: 'Pending',
    uploaded: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected'
};

const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
    pending: 'bg-gray-100 text-gray-600',
    uploaded: 'bg-yellow-50 text-yellow-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700'
};

const getDocumentStatus = (doc?: DocumentInfo | null): DocumentStatus => {
    return doc?.status || 'uploaded';
};

const getVerifierRole = (docType: DocumentType): 'buyer' | 'seller' | 'signatures' => {
    if (docType === 'spa') return 'signatures';
    if (docType === 'sco' || docType === 'bol') return 'buyer';
    return 'seller';
};

const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const TrackTrade: React.FC<TrackTradeProps> = ({ tradeId, isSeller }) => {
    const navigate = useNavigate();
    const { showToast } = useNotifications();
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

    // Signature modal state
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [signatureConfirmed, setSignatureConfirmed] = useState(false);

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

    /**
     * Check if any prior document in the workflow is rejected
     * This blocks uploading subsequent documents until the rejection is resolved
     */
    const checkPriorDocumentsRejected = (docType: DocumentType): boolean => {
        const currentIndex = DOCUMENT_ORDER.indexOf(docType);
        if (currentIndex <= 0) return false; // No prior documents for SCO

        for (let i = 0; i < currentIndex; i++) {
            const priorDoc = documents[DOCUMENT_ORDER[i]];
            if (priorDoc?.status === 'rejected') {
                return true;
            }
        }
        return false;
    };

    /**
     * Find the first rejected prior document (for displaying a message)
     */
    const findRejectedPriorDocument = (docType: DocumentType): { type: DocumentType; label: string } | null => {
        const currentIndex = DOCUMENT_ORDER.indexOf(docType);
        if (currentIndex <= 0) return null;

        for (let i = 0; i < currentIndex; i++) {
            const priorDocType = DOCUMENT_ORDER[i];
            const priorDoc = documents[priorDocType];
            if (priorDoc?.status === 'rejected') {
                return { type: priorDocType, label: DOCUMENT_LABELS[priorDocType] };
            }
        }
        return null;
    };

    const canUpload = (phase: PhaseInfo): boolean => {
        if (!phase.documentType) return false;

        const roleMatches = (isSeller && phase.uploadedBy === 'seller') ||
                          (!isSeller && phase.uploadedBy === 'buyer');
        const existingDoc = documents[phase.documentType];
        const isRejected = existingDoc?.status === 'rejected';

        // Special case: Allow re-upload of rejected documents even if not current phase
        // This is needed when a prior document is rejected after trade has progressed
        if (isRejected && roleMatches) {
            // But still block if there's a prior rejected document that needs to be fixed first
            if (checkPriorDocumentsRejected(phase.documentType)) {
                return false;
            }
            return true;
        }

        // For non-rejected documents, only allow upload during current phase
        if (!isCurrentPhase(phase.key)) return false;

        // Block upload if any prior document is rejected
        if (checkPriorDocumentsRejected(phase.documentType)) {
            return false;
        }

        return roleMatches && !existingDoc;
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

    // Determine if user can verify a document based on role and document type
    const canVerifyDocument = (docType: DocumentType): boolean => {
        if (docType === 'sco') return !isSeller;          // Buyer verifies SCO
        if (docType === 'icpo') return isSeller;          // Seller verifies ICPO
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
            showToast(result.message || 'SPA signed successfully!', 'success');

            // Refresh full data in background (without loading spinner)
            fetchTradeData(false);
        } catch (err: any) {
            console.error('Failed to sign SPA:', err);
            showToast(err.message || 'Failed to sign SPA. Please try again.', 'error');
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
            const destination = isSeller
                ? '/seller/trade-complete'
                : `/buyer/trade-complete?tradeId=${tradeId}`;
            navigate(destination);
        } catch (err) {
            console.error('Failed to complete trade:', err);
            showToast('Failed to complete trade. Please try again.', 'error');
        } finally {
            setCompleting(false);
        }
    };

    const currentPhaseInfo = PHASES.find(p => p.key === currentPhase);
    const bolDocument = documents['bol'];
    const bolStatus = bolDocument ? getDocumentStatus(bolDocument) : null;

    const primaryActionClasses =
        'inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm';
    const secondaryActionClasses =
        'inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm';

    const renderCurrentPhaseAction = () => {
        const phase = currentPhaseInfo;
        if (!phase) return null;

        if (!phase.documentType) {
            if (currentPhase === 'PR') {
                return (
                    <p className="text-sm text-gray-600">
                        Waiting for seller to upload SCO to continue.
                    </p>
                );
            }
            return (
                <p className="text-sm text-gray-600">
                    Waiting for the next step to begin.
                </p>
            );
        }

        const docType = phase.documentType;

        // Check if a prior document is rejected - block progress until it's resolved
        const rejectedPriorDoc = findRejectedPriorDocument(docType);
        if (rejectedPriorDoc) {
            const uploaderRole = PHASES.find(p => p.documentType === rejectedPriorDoc.type)?.uploadedBy || 'party';
            return (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>
                            Cannot proceed - <strong>{rejectedPriorDoc.label}</strong> was rejected and needs to be re-uploaded
                            {uploaderRole === 'seller' ? ' by the seller' : ' by the buyer'} first.
                        </span>
                    </p>
                </div>
            );
        }
        const docLabel = DOCUMENT_LABELS[docType];
        const doc = documents[docType];
        const docStatus = doc ? getDocumentStatus(doc) : null;
        const waitingFor = phase.uploadedBy === 'seller' ? 'seller' : 'buyer';
        const verifier = getVerifierRole(docType);

        const renderUploadButton = (labelText: string) => (
            <button
                onClick={() => handleUploadClick(docType)}
                className={primaryActionClasses}
            >
                <Upload className="w-4 h-4" />
                {labelText}
            </button>
        );

        const renderReviewButton = (labelText: string) => (
            <button
                onClick={() => handleViewDocument(doc!, docType)}
                className={primaryActionClasses}
            >
                <Eye className="w-4 h-4" />
                {labelText}
            </button>
        );

        const renderViewButton = (labelText: string) => (
            <button
                onClick={() => handleViewDocument(doc!, docType)}
                className={secondaryActionClasses}
            >
                <Eye className="w-4 h-4" />
                {labelText}
            </button>
        );

        if (docType === 'spa') {
            if (!doc) {
                return canUpload(phase)
                    ? renderUploadButton(`Upload ${docLabel}`)
                    : (
                        <p className="text-sm text-gray-600">
                            Waiting for {waitingFor} to upload {docLabel}.
                        </p>
                    );
            }

            if (docStatus === 'rejected') {
                return canUpload(phase) ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-red-600">
                            SPA was rejected. Please upload a revised copy.
                        </p>
                        {renderUploadButton(`Upload revised ${docLabel}`)}
                    </div>
                ) : (
                    <p className="text-sm text-gray-600">
                        SPA was rejected. Waiting for {waitingFor} to upload a revised copy.
                    </p>
                );
            }

            if (spaStatus?.fullySigned) {
                return (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            SPA signed by both parties. Moving to Payment phase.
                        </p>
                        {renderViewButton('View SPA')}
                    </div>
                );
            }

            const userHasSigned = isSeller ? spaStatus?.sellerSigned : spaStatus?.buyerSigned;
            const otherParty = isSeller ? 'buyer' : 'seller';
            const otherHasSigned = isSeller ? spaStatus?.buyerSigned : spaStatus?.sellerSigned;

            return (
                <div className="flex flex-col gap-2">
                    {userHasSigned ? (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            You have signed. Waiting for {otherParty} to sign.
                        </p>
                    ) : (
                        <p className="text-sm text-gray-600">
                            {otherHasSigned
                                ? `The ${otherParty} has signed. Your signature is required.`
                                : 'Awaiting signatures from both parties.'}
                        </p>
                    )}
                    {canSignSPA() && (
                        <button
                            onClick={() => {
                                setSignatureData(null);
                                setSignatureConfirmed(false);
                                setShowSignatureModal(true);
                            }}
                            disabled={signingSpa}
                            className={primaryActionClasses}
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
                    )}
                </div>
            );
        }

        if (!doc) {
            return canUpload(phase)
                ? renderUploadButton(`Upload ${docLabel}`)
                : (
                    <p className="text-sm text-gray-600">
                        Waiting for {waitingFor} to upload {docLabel}.
                    </p>
                );
        }

        if (docStatus === 'rejected') {
            return canUpload(phase) ? (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-red-600">
                        {docLabel} was rejected. Please upload a revised copy.
                    </p>
                    {renderUploadButton(`Upload revised ${docLabel}`)}
                </div>
            ) : (
                <p className="text-sm text-gray-600">
                    {docLabel} was rejected. Waiting for {waitingFor} to upload a revised copy.
                </p>
            );
        }

        if (docStatus === 'approved') {
            return (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {docLabel} approved.
                    </p>
                    {renderViewButton(`View ${docLabel}`)}
                </div>
            );
        }

        if (canVerifyDocument(docType)) {
            return (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-700">
                        {docLabel} submitted. Please review to continue.
                    </p>
                    {renderReviewButton(`Review ${docLabel}`)}
                </div>
            );
        }

        return (
            <p className="text-sm text-gray-600">
                Awaiting {verifier} verification for {docLabel}.
            </p>
        );
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
                            className="h-full bg-gray-900 rounded transition-all duration-500"
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
                                <div key={phase.key} className="flex flex-col items-center flex-1 min-w-0">
                                    {/* Node */}
                                <div
                                    className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                        isComplete
                                            ? 'bg-gray-900 border-gray-900 text-white'
                                            : isCurrent
                                                ? 'bg-white border-gray-900 text-gray-900 shadow-sm ring-4 ring-gray-100'
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
                                        isCurrent ? 'text-gray-900' : isComplete ? 'text-gray-800' : 'text-gray-400'
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
                                                        className="flex items-center gap-1 px-2.5 py-1 border border-gray-200 text-gray-700 rounded text-xs hover:bg-gray-50"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </button>
                                                    {/* SPA rejected - show re-upload option */}
                                                    {doc.status === 'rejected' ? (
                                                        <>
                                                            {canUpload(phase) && (
                                                                <button
                                                                    onClick={() => handleUploadClick(phase.documentType!)}
                                                                    className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                                >
                                                                    <Upload className="w-3 h-3" />
                                                                    Re-upload
                                                                </button>
                                                            )}
                                                            <span className="text-xs text-red-600 font-medium">Rejected</span>
                                                        </>
                                                    ) : spaStatus && (
                                                        /* SPA Signature Status */
                                                        <div className="flex flex-col items-center gap-0.5 mt-1">
                                                            <div className={`flex items-center gap-1 text-xs ${spaStatus.sellerSigned ? 'text-gray-800' : 'text-gray-500'}`}>
                                                                {spaStatus.sellerSigned ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                Seller
                                                            </div>
                                                            <div className={`flex items-center gap-1 text-xs ${spaStatus.buyerSigned ? 'text-gray-800' : 'text-gray-500'}`}>
                                                                {spaStatus.buyerSigned ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                Buyer
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : doc ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onClick={() => handleViewDocument(doc, phase.documentType!)}
                                                        className="flex items-center gap-1 px-2.5 py-1 border border-gray-200 text-gray-700 rounded text-xs hover:bg-gray-50"
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </button>
                                                    {/* Show re-upload button if document is rejected and user can upload */}
                                                    {doc.status === 'rejected' && canUpload(phase) && (
                                                        <button
                                                            onClick={() => handleUploadClick(phase.documentType!)}
                                                            className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                        >
                                                            <Upload className="w-3 h-3" />
                                                            Re-upload
                                                        </button>
                                                    )}
                                                    {/* Show rejected badge */}
                                                    {doc.status === 'rejected' && (
                                                        <span className="text-xs text-red-600 font-medium">Rejected</span>
                                                    )}
                                                </div>
                                            ) : canUpload(phase) ? (
                                                <button
                                                    onClick={() => handleUploadClick(phase.documentType!)}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white rounded text-xs hover:bg-gray-800"
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
                <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Clock className="w-4 h-4" />
                        <span>Current Phase: {currentPhaseInfo?.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        {currentPhaseInfo?.description}
                    </p>

                    {currentPhase !== 'COMPLETED' && (
                        <div className="mt-4">
                            {renderCurrentPhaseAction()}
                        </div>
                    )}

                    {/* Complete Trade Button - shown when BoL is approved */}
                    {currentPhase === 'BOL' && bolStatus === 'approved' && (
                        <button
                            onClick={handleCompleteTrade}
                            disabled={completing}
                            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                    {DOCUMENT_ORDER.filter(type => documents[type]).length === 0 ? (
                        <p className="text-sm text-gray-500">No documents uploaded yet</p>
                    ) : (
                        <div className="space-y-3">
                            {DOCUMENT_ORDER.filter(type => documents[type]).map((type) => {
                                const doc = documents[type] as DocumentInfo;
                                const docStatus = getDocumentStatus(doc);
                                const statusLabel = DOCUMENT_STATUS_LABELS[docStatus];
                                const statusClass = DOCUMENT_STATUS_STYLES[docStatus];
                                const displayName = doc.originalName || `${DOCUMENT_LABELS[type]} Document`;
                                const needsApproval =
                                    (docStatus === 'uploaded' || docStatus === 'pending') &&
                                    canVerifyDocument(type);
                                const spaDoc = type === 'spa' ? (doc as any) : null;
                                const spaFullySigned = type === 'spa'
                                    ? (spaStatus?.fullySigned ??
                                        (!!spaDoc?.sellerSignatureDataUrl && !!spaDoc?.buyerSignatureDataUrl))
                                    : false;
                                const spaUserSigned = type === 'spa'
                                    ? (isSeller
                                        ? (spaStatus?.sellerSigned ?? !!spaDoc?.sellerSignatureDataUrl)
                                        : (spaStatus?.buyerSigned ?? !!spaDoc?.buyerSignatureDataUrl))
                                    : false;
                                const needsSignature = type === 'spa' && doc && !spaFullySigned;
                                const signatureLabel = needsSignature
                                    ? (spaUserSigned ? 'Awaiting other signature' : 'Your signature needed')
                                    : '';
                                return (
                                    <div
                                        key={type}
                                        className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="rounded-lg bg-gray-100 p-2">
                                                <FileText className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {displayName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {DOCUMENT_LABELS[type]} - Uploaded {formatDate(doc.uploadedAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {needsApproval && (
                                                <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                                                    Needs your approval
                                                </span>
                                            )}
                                            {needsSignature && (
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                    {signatureLabel}
                                                </span>
                                            )}
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}>
                                                {statusLabel}
                                            </span>
                                            <button
                                                onClick={() => handleViewDocument(doc, type)}
                                                className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"
                                            >
                                                <Eye className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
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
                    tradeId={tradeId}
                    canVerify={
                        canVerifyDocument(viewingDocType) &&
                        (!viewingDocument?.status || viewingDocument?.status === 'uploaded' || viewingDocument?.status === 'pending')
                    }
                    canRejectSPA={viewingDocType === 'spa' && viewingDocument?.status !== 'rejected'}
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

            {/* Signature Modal */}
            {showSignatureModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-lg w-full mx-4 p-6">
                        <h3 className="text-lg font-bold mb-2">Sign SPA Document</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Draw your signature below to sign the Sales Purchase Agreement.
                        </p>

                        <SignatureCanvas
                            onSignatureChange={setSignatureData}
                            width={400}
                            height={150}
                        />

                        {/* Confirmation checkbox */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <div className="relative flex items-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={signatureConfirmed}
                                        onChange={(e) => setSignatureConfirmed(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                    />
                                </div>
                                <span className="text-sm text-gray-600">
                                    I confirm that this is my legal signature and I authorize its use to sign this Sales Purchase Agreement.
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowSignatureModal(false);
                                    setSignatureData(null);
                                    setSignatureConfirmed(false);
                                }}
                                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (signatureData && signatureConfirmed) {
                                        handleSignSPA(signatureData);
                                        setShowSignatureModal(false);
                                        setSignatureData(null);
                                        setSignatureConfirmed(false);
                                    }
                                }}
                                disabled={!signatureData || !signatureConfirmed || signingSpa}
                                className="flex-1 py-2 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {signingSpa ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Signing...
                                    </>
                                ) : (
                                    <>
                                        <Pen className="w-4 h-4" />
                                        Confirm & Sign
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

export default TrackTrade;
