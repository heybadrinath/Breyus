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
    Check,
    MessageCircle,
    XCircle
} from 'lucide-react';
import {
    Trade,
    TradePhase,
    DocumentInfo,
    DocumentStatus,
    DocumentRejectionTracking,
    getTradeById,
    getTradeDocuments,
    uploadSCO,
    uploadICPO,
    uploadSPA,
    uploadSignedSpa,
    uploadBoL,
    uploadPaymentProof,
    completeTrade,
    verifyDocument
} from '../services/trade.service';
import { createConversation, createConversationByCompany } from '../services/inbox.service';
import DocumentUploadModal, { DocumentType } from './DocumentUploadModal';
import ViewDocumentModal from './ViewDocumentModal';

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

// PHASE 2 REFACTORING: New SPA approval status interface
interface SPAApprovalStatus {
    spaUploaded: boolean;
    spaApproved: boolean;
    signedSpaUploaded: boolean;
    signedSpaApproved: boolean;
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
        description: 'Seller uploads SPA, buyer approves and uploads signed copy',
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
        uploadedBy: 'buyer'  // PHASE 2: Changed to buyer - only buyer completes trade
    }
];

const DOCUMENT_LABELS: Record<DocumentType, string> = {
    sco: 'SCO',
    icpo: 'ICPO',
    spa: 'SPA',
    'signed-spa': 'Signed SPA',  // PHASE 2 REFACTORING
    'payment-proof': 'Payment Proof',
    bol: 'BoL'
};

// PHASE 2 REFACTORING: Added 'signed-spa' to document order
const DOCUMENT_ORDER: DocumentType[] = [
    'sco',
    'icpo',
    'spa',
    'signed-spa',  // PHASE 2: New signed SPA document
    'payment-proof',
    'bol'
];

const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
    pending: 'Pending',
    uploaded: 'Under Review',  // PHASE 2: More descriptive
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

// PHASE 2 REFACTORING: Updated verifier roles - removed 'signatures', SPA uses approval flow
const getVerifierRole = (docType: DocumentType): 'buyer' | 'seller' => {
    // Buyer verifies documents uploaded by seller
    if (docType === 'sco' || docType === 'bol' || docType === 'spa') return 'buyer';
    // Seller verifies documents uploaded by buyer (including signed-spa)
    if (docType === 'icpo' || docType === 'payment-proof' || docType === 'signed-spa') return 'seller';
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

    // PHASE 2 REFACTORING: SPA approval flow tracking (replaces signature tracking)
    const [spaApprovalStatus, setSpaApprovalStatus] = useState<SPAApprovalStatus>({
        spaUploaded: false,
        spaApproved: false,
        signedSpaUploaded: false,
        signedSpaApproved: false
    });

    // PHASE 2 REFACTORING: Rejection tracking for documents
    const [rejectionTracking, setRejectionTracking] = useState<Record<string, DocumentRejectionTracking>>({});

    // PHASE 2 REFACTORING: Messaging state
    const [startingConversation, setStartingConversation] = useState(false);

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

            // Map documents - backend returns nested structure {documents: {sco, icpo, spa, bol, paymentProof, signedSpa}}
            const docs: Record<string, DocumentInfo> = {};
            const docsData = docsResponse.data as any;
            // Handle both nested structure (from getTradeDocuments) and flat structure (from getTradeById)
            const nestedDocs = docsData.documents || {};
            // Check nested structure first
            if (nestedDocs.sco) docs['sco'] = nestedDocs.sco;
            if (nestedDocs.icpo) docs['icpo'] = nestedDocs.icpo;
            if (nestedDocs.spa) docs['spa'] = nestedDocs.spa;
            if (nestedDocs.signedSpa) docs['signed-spa'] = nestedDocs.signedSpa;  // PHASE 2
            if (nestedDocs.bol) docs['bol'] = nestedDocs.bol;
            if (nestedDocs.paymentProof) docs['payment-proof'] = nestedDocs.paymentProof;
            // Also check for flat document properties (scoDocument, icpoDocument, etc.)
            if (docsData.scoDocument) docs['sco'] = docsData.scoDocument;
            if (docsData.icpoDocument) docs['icpo'] = docsData.icpoDocument;
            if (docsData.spaDocument) docs['spa'] = docsData.spaDocument;
            if (docsData.signedSpaDocument) docs['signed-spa'] = docsData.signedSpaDocument;  // PHASE 2
            if (docsData.bolDocument) docs['bol'] = docsData.bolDocument;
            if (docsData.paymentProof && !docs['payment-proof']) docs['payment-proof'] = docsData.paymentProof;
            setDocuments(docs);

            // PHASE 2 REFACTORING: Extract SPA approval status
            const spaDoc = docs['spa'];
            const signedSpaDoc = docs['signed-spa'];
            setSpaApprovalStatus({
                spaUploaded: !!spaDoc,
                spaApproved: spaDoc?.status === 'approved',
                signedSpaUploaded: !!signedSpaDoc,
                signedSpaApproved: signedSpaDoc?.status === 'approved'
            });

            // PHASE 2 REFACTORING: Extract rejection tracking from trade data
            const trackingData: Record<string, DocumentRejectionTracking> = {};
            const tradeAny = tradeData as any;
            if (tradeAny.scoRejectionTracking) trackingData['sco'] = tradeAny.scoRejectionTracking;
            if (tradeAny.icpoRejectionTracking) trackingData['icpo'] = tradeAny.icpoRejectionTracking;
            if (tradeAny.spaRejectionTracking) trackingData['spa'] = tradeAny.spaRejectionTracking;
            if (tradeAny.signedSpaRejectionTracking) trackingData['signed-spa'] = tradeAny.signedSpaRejectionTracking;
            if (tradeAny.paymentProofRejectionTracking) trackingData['payment-proof'] = tradeAny.paymentProofRejectionTracking;
            if (tradeAny.bolRejectionTracking) trackingData['bol'] = tradeAny.bolRejectionTracking;
            setRejectionTracking(trackingData);
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

    // PHASE 2 REFACTORING: Helper to get rejection info for a document type
    // Returns shape matching RejectionTrackingInfo interface for ViewDocumentModal
    const getRejectionInfo = (docType: DocumentType): { rejectionCount: number; maxAttempts: number; remainingAttempts: number; isLastAttempt: boolean } | null => {
        const tracking = rejectionTracking[docType];
        if (!tracking) return null;
        const remainingAttempts = tracking.maxAttempts - tracking.rejectionCount;
        return {
            rejectionCount: tracking.rejectionCount,
            maxAttempts: tracking.maxAttempts,
            remainingAttempts,
            isLastAttempt: remainingAttempts === 1
        };
    };

    // PHASE 2 REFACTORING: Check if signed-spa upload is allowed
    const canUploadSignedSpa = (): boolean => {
        // Only buyer can upload signed SPA
        if (isSeller) return false;
        // SPA must be approved first
        if (!spaApprovalStatus.spaApproved) return false;
        // Can't upload if already uploaded and pending review
        const signedSpaDoc = documents['signed-spa'];
        if (signedSpaDoc?.status === 'uploaded') return false;
        // Can upload if not uploaded yet or if rejected
        return !signedSpaDoc || signedSpaDoc.status === 'rejected';
    };

    const canUpload = (phase: PhaseInfo): boolean => {
        if (!phase.documentType) return false;

        const roleMatches = (isSeller && phase.uploadedBy === 'seller') ||
                          (!isSeller && phase.uploadedBy === 'buyer');
        const existingDoc = documents[phase.documentType];
        const isRejected = existingDoc?.status === 'rejected';
        const isPendingReview = existingDoc?.status === 'uploaded';

        // PHASE 2 REFACTORING: Block upload when document is pending review
        if (isPendingReview) return false;

        // Special case: Allow re-upload of rejected documents even if not current phase
        // This is needed when a prior document is rejected after trade has progressed
        if (isRejected && roleMatches) {
            // But still block if there's a prior rejected document that needs to be fixed first
            if (checkPriorDocumentsRejected(phase.documentType)) {
                return false;
            }
            // PHASE 2: Check if max attempts exceeded
            const rejectionInfo = getRejectionInfo(phase.documentType);
            if (rejectionInfo && rejectionInfo.remainingAttempts <= 0) {
                return false; // No more attempts allowed
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

        // PHASE 2 REFACTORING: Added 'signed-spa' upload function
        const uploadFns: Record<DocumentType, typeof uploadSCO> = {
            'sco': uploadSCO,
            'icpo': uploadICPO,
            'spa': uploadSPA,
            'signed-spa': uploadSignedSpa,
            'bol': uploadBoL,
            'payment-proof': uploadPaymentProof
        };

        await uploadFns[selectedDocType](tradeId, file, notes);
        // NOTE: Don't call fetchTradeData() here - the modal shows success for 1.5s
        // We'll refresh data when the modal closes to avoid re-render flickering
    };

    // PHASE 2 REFACTORING: Determine if user can verify a document based on role and document type
    const canVerifyDocument = (docType: DocumentType): boolean => {
        if (docType === 'sco') return !isSeller;          // Buyer verifies SCO
        if (docType === 'icpo') return isSeller;          // Seller verifies ICPO
        if (docType === 'spa') return !isSeller;          // PHASE 2: Buyer approves SPA
        if (docType === 'signed-spa') return isSeller;    // PHASE 2: Seller approves signed SPA
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
        try {
            await verifyDocument(tradeId, viewingDocType, status, notes);
            showToast(
                status === 'approved' ? 'Document approved successfully!' : 'Document rejected.',
                status === 'approved' ? 'success' : 'warning'
            );
            await fetchTradeData(false);
        } catch (err: any) {
            showToast(err.message || 'Failed to verify document. Please try again.', 'error');
        }
    };

    // PHASE 2 REFACTORING: Message the other party (useful when document is rejected)
    const handleMessageOtherParty = async () => {
        if (!trade) return;

        try {
            setStartingConversation(true);
            const tradeAny = trade as any;

            // Try to get product ID first (preferred - creates product-based conversation)
            const productId = tradeAny.product?._id || tradeAny.productId;

            let conversationId: string | undefined;

            if (productId) {
                // Use product-based conversation (preferred)
                const response = await createConversation(productId);
                conversationId = response.conversationId;
            } else {
                // Fallback to company-based conversation
                const targetCompanyId = isSeller
                    ? tradeAny.buyer?.company?._id || tradeAny.buyerCompany?._id || tradeAny.buyer?._id
                    : tradeAny.seller?.company?._id || tradeAny.sellerCompany?._id || tradeAny.seller?._id;

                if (!targetCompanyId) {
                    showToast('Unable to find other party information', 'error');
                    return;
                }

                const response = await createConversationByCompany(targetCompanyId);
                conversationId = response.conversationId;
            }

            if (conversationId) {
                const basePath = isSeller ? '/seller' : '/buyer';
                navigate(`${basePath}/inbox?conversationId=${conversationId}`);
            } else {
                showToast('Failed to start conversation', 'error');
            }
        } catch (err: any) {
            console.error('Failed to start conversation:', err);
            showToast(err.message || 'Failed to start conversation', 'error');
        } finally {
            setStartingConversation(false);
        }
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

    const SPA_STEPS = [
        { label: 'Seller uploads SPA', shortLabel: 'Upload' },
        { label: 'Buyer reviews & approves SPA', shortLabel: 'Review' },
        { label: 'Buyer uploads Signed SPA', shortLabel: 'Sign' },
        { label: 'Seller reviews & approves Signed SPA', shortLabel: 'Approve' },
    ];

    const getSPAStepNumber = (): number => {
        if (!spaApprovalStatus.spaUploaded) return 1;
        if (!spaApprovalStatus.spaApproved) return 2;
        if (!spaApprovalStatus.signedSpaUploaded) return 3;
        return 4;
    };

    const renderSPAStepIndicator = () => {
        if (currentPhase !== 'SPA') return null;
        const currentStep = getSPAStepNumber();

        // Check for rejection states — show which step needs redo
        const spaDoc = documents['spa'];
        const signedSpaDoc = documents['signed-spa'];
        const spaRejected = spaDoc?.status === 'rejected';
        const signedSpaRejected = signedSpaDoc?.status === 'rejected';

        let activeStep = currentStep;
        if (spaRejected) activeStep = 1;       // Go back to step 1
        if (signedSpaRejected) activeStep = 3;  // Go back to step 3

        return (
            <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    {SPA_STEPS.map((step, idx) => {
                        const stepNum = idx + 1;
                        const isDone = stepNum < activeStep;
                        const isCurrent = stepNum === activeStep;

                        return (
                            <React.Fragment key={stepNum}>
                                {idx > 0 && (
                                    <div className={`flex-1 h-0.5 mx-1 ${isDone ? 'bg-gray-900' : 'bg-gray-200'}`} />
                                )}
                                <div className="flex flex-col items-center" style={{ minWidth: '2rem' }}>
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                                            isDone
                                                ? 'bg-gray-900 border-gray-900 text-white'
                                                : isCurrent
                                                    ? 'bg-white border-gray-900 text-gray-900'
                                                    : 'bg-white border-gray-300 text-gray-400'
                                        }`}
                                    >
                                        {isDone ? '✓' : stepNum}
                                    </div>
                                    <span className={`text-xs mt-1 text-center ${
                                        isCurrent ? 'text-gray-900 font-medium' : isDone ? 'text-gray-700' : 'text-gray-400'
                                    }`}>
                                        {step.shortLabel}
                                    </span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-600 text-center mt-1">
                    Step {activeStep}: {SPA_STEPS[activeStep - 1]?.label}
                </p>
            </div>
        );
    };

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

        // PHASE 2 REFACTORING: New SPA approval flow (replaces signature flow)
        if (docType === 'spa') {
            const signedSpaDoc = documents['signed-spa'];
            const signedSpaStatus = signedSpaDoc ? getDocumentStatus(signedSpaDoc) : null;

            // Step 1: SPA not uploaded yet
            if (!doc) {
                return canUpload(phase)
                    ? renderUploadButton(`Upload ${docLabel}`)
                    : (
                        <p className="text-sm text-gray-600">
                            Waiting for seller to upload {docLabel}.
                        </p>
                    );
            }

            // Step 2: SPA rejected - show re-upload option with rejection info
            if (docStatus === 'rejected') {
                const rejectionInfo = getRejectionInfo('spa');
                return canUpload(phase) ? (
                    <div className="flex flex-col gap-3">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700 flex items-center gap-2">
                                <XCircle className="w-4 h-4 flex-shrink-0" />
                                SPA was rejected.
                            </p>
                            {rejectionInfo && (
                                <p className="text-xs text-red-600 mt-1">
                                    {rejectionInfo.isLastAttempt
                                        ? '⚠️ This is your FINAL attempt!'
                                        : `Attempt ${rejectionInfo.rejectionCount + 1}/${rejectionInfo.maxAttempts}`}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {renderUploadButton(`Upload revised ${docLabel}`)}
                            <button
                                onClick={handleMessageOtherParty}
                                disabled={startingConversation}
                                className={secondaryActionClasses}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Message Buyer
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-600">
                            SPA was rejected. Waiting for seller to upload a revised copy.
                        </p>
                        <button
                            onClick={handleMessageOtherParty}
                            disabled={startingConversation}
                            className={secondaryActionClasses}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Message Seller
                        </button>
                    </div>
                );
            }

            // Step 3: SPA uploaded, waiting for buyer approval
            if (docStatus === 'uploaded') {
                if (!isSeller) {
                    return (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm text-gray-700">
                                SPA submitted by seller. Please review and approve to continue.
                            </p>
                            {renderReviewButton('Review SPA')}
                        </div>
                    );
                }
                return (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        SPA submitted. Waiting for buyer to review and approve.
                    </p>
                );
            }

            // Step 4: SPA approved - now buyer uploads signed SPA
            if (docStatus === 'approved') {
                // Check signed SPA status
                if (!signedSpaDoc) {
                    // No signed SPA uploaded yet
                    if (!isSeller) {
                        return (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-green-700 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    SPA approved. Please upload your signed copy.
                                </p>
                                <button
                                    onClick={() => handleUploadClick('signed-spa')}
                                    className={primaryActionClasses}
                                >
                                    <Upload className="w-4 h-4" />
                                    Upload Signed SPA
                                </button>
                            </div>
                        );
                    }
                    return (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            SPA approved. Waiting for buyer to upload signed copy.
                        </p>
                    );
                }

                // Signed SPA rejected
                if (signedSpaStatus === 'rejected') {
                    const rejectionInfo = getRejectionInfo('signed-spa');
                    if (!isSeller) {
                        return (
                            <div className="flex flex-col gap-3">
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700 flex items-center gap-2">
                                        <XCircle className="w-4 h-4 flex-shrink-0" />
                                        Signed SPA was rejected.
                                    </p>
                                    {rejectionInfo && (
                                        <p className="text-xs text-red-600 mt-1">
                                            {rejectionInfo.isLastAttempt
                                                ? '⚠️ This is your FINAL attempt!'
                                                : `Attempt ${rejectionInfo.rejectionCount + 1}/${rejectionInfo.maxAttempts}`}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUploadClick('signed-spa')}
                                        className={primaryActionClasses}
                                    >
                                        <Upload className="w-4 h-4" />
                                        Upload Revised Signed SPA
                                    </button>
                                    <button
                                        onClick={handleMessageOtherParty}
                                        disabled={startingConversation}
                                        className={secondaryActionClasses}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Message Seller
                                    </button>
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm text-gray-600">
                                Signed SPA was rejected. Waiting for buyer to upload a revised copy.
                            </p>
                            <button
                                onClick={handleMessageOtherParty}
                                disabled={startingConversation}
                                className={secondaryActionClasses}
                            >
                                <MessageCircle className="w-4 h-4" />
                                Message Buyer
                            </button>
                        </div>
                    );
                }

                // Signed SPA uploaded, waiting for seller approval
                if (signedSpaStatus === 'uploaded') {
                    if (isSeller) {
                        return (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm text-gray-700">
                                    Signed SPA submitted by buyer. Please review and approve.
                                </p>
                                <button
                                    onClick={() => handleViewDocument(signedSpaDoc, 'signed-spa')}
                                    className={primaryActionClasses}
                                >
                                    <Eye className="w-4 h-4" />
                                    Review Signed SPA
                                </button>
                            </div>
                        );
                    }
                    return (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Signed SPA submitted. Waiting for seller to approve.
                        </p>
                    );
                }

                // Signed SPA approved - moving to payment
                if (signedSpaStatus === 'approved') {
                    return (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm text-green-700 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                SPA process complete. Moving to Payment phase.
                            </p>
                            <div className="flex gap-2">
                                {renderViewButton('View SPA')}
                                <button
                                    onClick={() => handleViewDocument(signedSpaDoc, 'signed-spa')}
                                    className={secondaryActionClasses}
                                >
                                    <Eye className="w-4 h-4" />
                                    View Signed SPA
                                </button>
                            </div>
                        </div>
                    );
                }
            }

            // Default fallback
            return (
                <p className="text-sm text-gray-600">
                    Processing SPA documents...
                </p>
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

        // PHASE 2 REFACTORING: Enhanced rejection handling with tracking info and message button
        if (docStatus === 'rejected') {
            const rejectionInfo = getRejectionInfo(docType);
            const otherPartyLabel = waitingFor === 'seller' ? 'Buyer' : 'Seller';

            return canUpload(phase) ? (
                <div className="flex flex-col gap-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 flex items-center gap-2">
                            <XCircle className="w-4 h-4 flex-shrink-0" />
                            {docLabel} was rejected. Please upload a revised copy.
                        </p>
                        {rejectionInfo && (
                            <p className="text-xs text-red-600 mt-1">
                                {rejectionInfo.isLastAttempt
                                    ? '⚠️ This is your FINAL attempt!'
                                    : `Attempt ${rejectionInfo.rejectionCount + 1}/${rejectionInfo.maxAttempts}`}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {renderUploadButton(`Upload revised ${docLabel}`)}
                        <button
                            onClick={handleMessageOtherParty}
                            disabled={startingConversation}
                            className={secondaryActionClasses}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Message {otherPartyLabel}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-gray-600">
                        {docLabel} was rejected. Waiting for {waitingFor} to upload a revised copy.
                    </p>
                    <button
                        onClick={handleMessageOtherParty}
                        disabled={startingConversation}
                        className={secondaryActionClasses}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Message {waitingFor === 'seller' ? 'Seller' : 'Buyer'}
                    </button>
                </div>
            );
        }

        // PHASE 2 REFACTORING: Show pending review status when document is uploaded
        if (docStatus === 'uploaded') {
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
                <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {docLabel} submitted. Waiting for {verifier} to review.
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
                                            {/* PHASE 2 REFACTORING: Special handling for SPA - show approval status */}
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
                                                            {/* SPA rejection with tracking info */}
                                                            {(() => {
                                                                const info = getRejectionInfo('spa');
                                                                const isLastAttempt = info?.isLastAttempt;
                                                                return (
                                                                    <div className={`text-center px-2 py-1 rounded ${isLastAttempt ? 'bg-orange-100' : 'bg-red-100'}`}>
                                                                        <span className={`text-xs font-semibold ${isLastAttempt ? 'text-orange-700' : 'text-red-600'}`}>
                                                                            {isLastAttempt ? '⚠️ Final!' : 'Rejected'}
                                                                        </span>
                                                                        {info && (
                                                                            <p className={`text-xs ${isLastAttempt ? 'text-orange-600' : 'text-red-500'}`}>
                                                                                {info.remainingAttempts}/{info.maxAttempts}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </>
                                                    ) : (
                                                        /* PHASE 2: SPA Approval Status */
                                                        <div className="flex flex-col items-center gap-0.5 mt-1">
                                                            <div className={`flex items-center gap-1 text-xs ${spaApprovalStatus.spaApproved ? 'text-green-600' : doc.status === 'uploaded' ? 'text-yellow-600' : 'text-gray-500'}`}>
                                                                {spaApprovalStatus.spaApproved ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                SPA {spaApprovalStatus.spaApproved ? 'Approved' : 'Pending'}
                                                            </div>
                                                            {spaApprovalStatus.spaApproved && (
                                                                <div className={`flex items-center gap-1 text-xs ${spaApprovalStatus.signedSpaApproved ? 'text-green-600' : spaApprovalStatus.signedSpaUploaded ? 'text-yellow-600' : 'text-gray-500'}`}>
                                                                    {spaApprovalStatus.signedSpaApproved ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                                    Signed {spaApprovalStatus.signedSpaApproved ? 'Approved' : spaApprovalStatus.signedSpaUploaded ? 'Pending' : 'Needed'}
                                                                </div>
                                                            )}
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
                                                    {/* Show rejected badge with tracking info */}
                                                    {doc.status === 'rejected' && (() => {
                                                        const info = getRejectionInfo(phase.documentType!);
                                                        const isLastAttempt = info?.isLastAttempt;
                                                        return (
                                                            <div className={`text-center px-2 py-1 rounded ${isLastAttempt ? 'bg-orange-100' : 'bg-red-100'}`}>
                                                                <span className={`text-xs font-semibold ${isLastAttempt ? 'text-orange-700' : 'text-red-600'}`}>
                                                                    {isLastAttempt ? '⚠️ Final Attempt!' : 'Rejected'}
                                                                </span>
                                                                {info && (
                                                                    <p className={`text-xs ${isLastAttempt ? 'text-orange-600' : 'text-red-500'}`}>
                                                                        {info.remainingAttempts} of {info.maxAttempts} left
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
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
                        <span>Current Phase: <span className="font-semibold">{currentPhaseInfo?.label}</span></span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        {currentPhaseInfo?.description}
                    </p>

                    {currentPhase !== 'COMPLETED' && (
                        <div className="mt-4">
                            {renderSPAStepIndicator()}
                            {renderCurrentPhaseAction()}
                        </div>
                    )}

                    {/* PHASE 2 REFACTORING: Complete Trade Button - only for buyer when BoL is approved */}
                    {currentPhase === 'BOL' && bolStatus === 'approved' && (
                        !isSeller ? (
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
                        ) : (
                            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    BoL approved. Waiting for buyer to close the trade.
                                </p>
                            </div>
                        )
                    )}
                </div>

                {/* Documents List - PHASE 2 REFACTORING: Updated to show rejection tracking */}
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

                                // PHASE 2: Get rejection tracking info
                                const rejectionInfo = getRejectionInfo(type);
                                const showRejectionWarning = docStatus === 'rejected' && rejectionInfo;

                                return (
                                    <div
                                        key={type}
                                        className={`flex items-center justify-between gap-4 rounded-lg border p-3 ${
                                            docStatus === 'rejected' ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`rounded-lg p-2 ${
                                                docStatus === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
                                            }`}>
                                                <FileText className={`w-5 h-5 ${
                                                    docStatus === 'rejected' ? 'text-red-500' : 'text-gray-500'
                                                }`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {displayName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {DOCUMENT_LABELS[type]} - Uploaded {formatDate(doc.uploadedAt)}
                                                </p>
                                                {/* PHASE 2: Show rejection info */}
                                                {showRejectionWarning && (
                                                    <p className="text-xs text-red-600 mt-0.5">
                                                        {rejectionInfo.isLastAttempt
                                                            ? '⚠️ Final attempt remaining'
                                                            : `${rejectionInfo.remainingAttempts} attempt(s) remaining`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {needsApproval && (
                                                <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
                                                    Needs your approval
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

            {/* View Document Modal - PHASE 2 REFACTORING: Updated for new SPA approval flow */}
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
                    canRejectSPA={
                        (viewingDocType === 'spa' || viewingDocType === 'signed-spa') &&
                        viewingDocument?.status !== 'rejected' &&
                        viewingDocument?.status !== 'approved'
                    }
                    onVerify={handleVerify}
                    // PHASE 2: Pass rejection tracking info for informative UI
                    rejectionTracking={viewingDocType ? getRejectionInfo(viewingDocType) || undefined : undefined}
                />
            )}

            {/* Upload Modal */}
            {selectedDocType && (
                <DocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedDocType(null);
                        // Refresh data when modal closes (after upload success or cancel)
                        fetchTradeData(false);
                    }}
                    onUpload={handleUpload}
                    documentType={selectedDocType}
                />
            )}

            {/* PHASE 2 REFACTORING: Signature modal removed - replaced with approval flow */}
        </div>
    );
};

export default TrackTrade;
