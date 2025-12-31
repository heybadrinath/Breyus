import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, MessageCircle, Loader2, Upload, Eye } from "lucide-react";
import { getSellerTrades, Trade, TradePhase, PaymentMethod, DocumentInfo, verifyDocument, uploadDocument, DocumentType } from "../../services/trade.service";
import { createConversation } from "../../services/inbox.service";
import TrackTrade from "../../components/TrackTrade";
import DocumentUploadModal from "../../components/DocumentUploadModal";
import ViewDocumentModal from "../../components/ViewDocumentModal";

interface TradeWithProduct extends Omit<Trade, 'paymentMethod'> {
    product: {
        _id: string;
        name: string;
        price: string;
        currency: string;
        productImages: string[];
    };
    buyer: {
        _id: string;
        mail: string;
    };
    tradePhase?: TradePhase;
    paymentMethod?: PaymentMethod;
    scoDocument?: DocumentInfo;
    icpoDocument?: DocumentInfo;
    spaDocument?: DocumentInfo;
    paymentProof?: DocumentInfo;
    bolDocument?: DocumentInfo;
}

// Document phases to filter for
const DOCUMENT_PHASES: TradePhase[] = ['SCO', 'ICPO', 'SPA', 'PAYMENT', 'BOL'];

const PHASE_LABELS: Record<TradePhase, string> = {
    'PR': 'Purchase Request',
    'SCO': 'SCO Phase',
    'ICPO': 'ICPO Phase',
    'SPA': 'SPA Phase',
    'PAYMENT': 'Payment Phase',
    'BOL': 'Bill of Lading',
    'COMPLETED': 'Completed'
};

// What document the seller needs to upload/view at each phase
const PHASE_DOCUMENT_INFO: Record<string, { viewDoc: string; uploadDoc: DocumentType | ''; uploadLabel: string }> = {
    'SCO': { viewDoc: '', uploadDoc: 'sco', uploadLabel: 'Upload SCO' },
    'ICPO': { viewDoc: 'sco', uploadDoc: '', uploadLabel: '' },
    'SPA': { viewDoc: 'icpo', uploadDoc: 'spa', uploadLabel: 'Upload SPA' },
    'PAYMENT': { viewDoc: 'spa', uploadDoc: '', uploadLabel: '' },
    'BOL': { viewDoc: 'paymentProof', uploadDoc: 'bol', uploadLabel: 'Upload BoL' },
};

export const SellerSPAStatus: React.FC = () => {
    const navigate = useNavigate();
    const [trades, setTrades] = useState<TradeWithProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
    const [chattingProductId, setChattingProductId] = useState<string | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadTradeId, setUploadTradeId] = useState<string | null>(null);
    const [uploadDocType, setUploadDocType] = useState<DocumentType | null>(null);

    // View document modal state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewingDocument, setViewingDocument] = useState<DocumentInfo | null>(null);
    const [viewingDocType, setViewingDocType] = useState<DocumentType | null>(null);
    const [viewingTradeId, setViewingTradeId] = useState<string | null>(null);

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            setLoading(true);
            const response = await getSellerTrades();
            // Filter for trades in document phases (SCO through BOL)
            const documentPhaseTrades = (response.data as TradeWithProduct[]).filter(
                trade => trade.negotiationStatus === 'accepted' &&
                         trade.tradePhase &&
                         DOCUMENT_PHASES.includes(trade.tradePhase)
            );
            setTrades(documentPhaseTrades);
        } catch (err) {
            setError('Failed to fetch trades');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async (productId: string) => {
        try {
            setChattingProductId(productId);
            const result = await createConversation(productId);
            if (result.status === 'success') {
                navigate(`/seller/Inbox?conversationId=${result.data}`);
            } else if (result.conversationId) {
                navigate(`/seller/Inbox?conversationId=${result.conversationId}`);
            } else if (result.message?.includes("yourself")) {
                alert("You can't send a message to yourself.");
            } else {
                alert(result.message || 'Failed to create conversation');
            }
        } catch (error) {
            console.error("Error creating conversation:", error);
            alert('Error creating conversation');
        } finally {
            setChattingProductId(null);
        }
    };

    const handleTrack = (tradeId: string) => {
        setSelectedTradeId(tradeId);
    };

    const handleUpload = (tradeId: string, docType: DocumentType) => {
        setUploadTradeId(tradeId);
        setUploadDocType(docType);
        setUploadModalOpen(true);
    };

    const handleDocumentUpload = async (file: File, notes?: string) => {
        if (!uploadTradeId || !uploadDocType) return;
        await uploadDocument(uploadTradeId, uploadDocType, file, notes);
        setUploadModalOpen(false);
        setUploadTradeId(null);
        setUploadDocType(null);
        fetchTrades(); // Refresh to show updated status
    };

    const handleViewDocument = (tradeId: string, doc: DocumentInfo, docType: DocumentType) => {
        setViewingTradeId(tradeId);
        setViewingDocument(doc);
        setViewingDocType(docType);
        setViewModalOpen(true);
    };

    const handleVerify = async (status: 'approved' | 'rejected', notes?: string) => {
        if (!viewingDocType || !viewingTradeId) return;
        await verifyDocument(viewingTradeId, viewingDocType, status, notes);
        setViewModalOpen(false);
        setViewingDocument(null);
        setViewingDocType(null);
        setViewingTradeId(null);
        fetchTrades();
    };

    // Seller can verify: ICPO, Payment Proof
    const canVerifyDocument = (docType: DocumentType): boolean => {
        return docType === 'icpo' || docType === 'payment-proof';
    };

    const getStatusBadge = (trade: TradeWithProduct) => {
        const phase = trade.tradePhase;

        // For seller: check what they're waiting for or need to do
        if (phase === 'BOL') {
            // Check if BoL is uploaded
            if (trade.bolDocument?.filePath) {
                return (
                    <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        Uploaded
                    </span>
                );
            }
            return (
                <span className="flex items-center gap-1 text-yellow-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    Awaiting Upload
                </span>
            );
        }
        if (phase === 'PAYMENT') {
            if (trade.paymentProof?.filePath) {
                return (
                    <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        Payment Received
                    </span>
                );
            }
            return (
                <span className="flex items-center gap-1 text-yellow-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    Awaiting Payment
                </span>
            );
        }
        if (phase === 'SPA') {
            if (trade.spaDocument?.filePath) {
                return (
                    <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        SPA Uploaded
                    </span>
                );
            }
            return (
                <span className="flex items-center gap-1 text-yellow-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    Awaiting SPA
                </span>
            );
        }
        if (phase === 'ICPO') {
            if (trade.icpoDocument?.filePath) {
                return (
                    <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        ICPO Received
                    </span>
                );
            }
            return (
                <span className="flex items-center gap-1 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Awaiting ICPO
                </span>
            );
        }
        if (phase === 'SCO') {
            if (trade.scoDocument?.filePath) {
                return (
                    <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                        SCO Sent
                    </span>
                );
            }
            return (
                <span className="flex items-center gap-1 text-yellow-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                    Send SCO
                </span>
            );
        }

        return (
            <span className="flex items-center gap-1 text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                Unknown
            </span>
        );
    };

    const getDocumentLink = (trade: TradeWithProduct) => {
        const phase = trade.tradePhase;
        if (!phase) return null;

        const docInfo = PHASE_DOCUMENT_INFO[phase];
        if (!docInfo) return null;

        // Map viewDoc to actual trade properties
        const docPropertyMap: Record<string, keyof TradeWithProduct> = {
            'sco': 'scoDocument',
            'icpo': 'icpoDocument',
            'spa': 'spaDocument',
            'paymentProof': 'paymentProof',
            'bol': 'bolDocument'
        };

        // Show view link for the relevant document
        if (docInfo.viewDoc) {
            const propertyName = docPropertyMap[docInfo.viewDoc];
            const doc = propertyName ? trade[propertyName] as DocumentInfo | undefined : undefined;
            if (doc?.filePath) {
                const docType = docInfo.viewDoc === 'paymentProof' ? 'payment-proof' : docInfo.viewDoc as DocumentType;
                return (
                    <button
                        onClick={() => handleViewDocument(trade._id, doc, docType)}
                        className="text-[#0076D3] hover:underline text-sm flex items-center gap-1"
                    >
                        <Eye className="w-3 h-3" />
                        View {docInfo.viewDoc.toUpperCase()}
                    </button>
                );
            }
        }

        return <span className="text-gray-400 text-sm">No document</span>;
    };

    const getActionButton = (trade: TradeWithProduct) => {
        const phase = trade.tradePhase;
        if (!phase) return null;

        const docInfo = PHASE_DOCUMENT_INFO[phase];
        if (!docInfo) return null;

        // Map document type to trade property
        const docPropertyMap: Record<string, keyof TradeWithProduct> = {
            'sco': 'scoDocument',
            'icpo': 'icpoDocument',
            'spa': 'spaDocument',
            'payment-proof': 'paymentProof',
            'bol': 'bolDocument'
        };

        // Show upload button if seller needs to upload
        if (docInfo.uploadDoc && docInfo.uploadLabel) {
            const propertyName = docPropertyMap[docInfo.uploadDoc];
            const existingDoc = propertyName ? trade[propertyName] as DocumentInfo | undefined : undefined;
            if (!existingDoc?.filePath) {
                return (
                    <button
                        onClick={() => handleUpload(trade._id, docInfo.uploadDoc as DocumentType)}
                        className="px-3 py-1.5 border border-[#0076D3] text-[#0076D3] rounded hover:bg-blue-50 text-sm flex items-center gap-1"
                    >
                        <Upload className="w-3 h-3" />
                        {docInfo.uploadLabel}
                    </button>
                );
            }
        }

        // Show track button
        return (
            <button
                onClick={() => handleTrack(trade._id)}
                className="px-4 py-1.5 border border-gray-800 text-gray-800 rounded hover:bg-gray-100 text-sm"
            >
                Track
            </button>
        );
    };

    const displayedTrades = trades.slice(0, entriesPerPage);

    // If a trade is selected for tracking, show the TrackTrade view
    if (selectedTradeId) {
        return (
            <div className="p-4">
                <button
                    onClick={() => setSelectedTradeId(null)}
                    className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                    <span className="rotate-180">→</span>
                    Back to list
                </button>
                <TrackTrade tradeId={selectedTradeId} isSeller={true} />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="border-t-2 border-x-2 rounded-lg my-8 p-8">
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="animate-spin mr-2" />
                    <span className="text-gray-500">Loading document status...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="border-t-2 border-x-2 rounded-lg my-8 p-8">
                <div className="flex justify-center items-center h-40">
                    <span className="text-red-500">{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="border-t-2 border-x-2 rounded-lg my-8">
            <div className="p-8 flex-col flex">
                <div className="flex">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-700">Document Status</h1>
                        <span className="text-gray-500">Manage trade documents and track progress</span>
                    </div>
                    <Filter className="ml-auto cursor-pointer hover:text-gray-600" />
                </div>
                <div className="flex mt-8 items-center">
                    <select
                        id="entries"
                        className="w-fit bg-white border-2 rounded-lg px-2 py-1"
                        value={entriesPerPage}
                        onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                    </select>
                    <label className="ml-2 text-gray-500" htmlFor="entries">entries per page</label>
                    <span className="ml-auto text-gray-600">
                        {trades.length} trade{trades.length !== 1 ? 's' : ''} in document phase
                    </span>
                </div>
            </div>

            {trades.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    No trades in document phase
                </div>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2">
                            <th className="text-gray-500 font-normal py-3 text-sm">Buyer</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">Document</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">Product</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">Current Phase</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">Status</th>
                            <th className="text-gray-500 font-normal py-3 text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedTrades.map((trade) => (
                            <tr key={trade._id} className="border-b hover:bg-gray-50">
                                <td className="py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                                            {trade.buyer?.mail?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                        <span className="text-gray-600">
                                            {trade.buyer?.mail?.split('@')[0] || 'N/A'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 text-center">
                                    {getDocumentLink(trade)}
                                </td>
                                <td className="py-4 text-center">
                                    <span className="font-medium text-gray-800">
                                        {trade.product?.name || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-4 text-center">
                                    <span className="text-gray-600 text-sm">
                                        {trade.tradePhase ? PHASE_LABELS[trade.tradePhase] : 'N/A'}
                                    </span>
                                </td>
                                <td className="py-4 text-center">
                                    {getStatusBadge(trade)}
                                </td>
                                <td className="py-4 text-center">
                                    <div className="flex items-center justify-center gap-2 flex-wrap">
                                        {getActionButton(trade)}
                                        <button
                                            onClick={() => handleChat(trade.product._id)}
                                            disabled={chattingProductId === trade.product._id}
                                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                        >
                                            {chattingProductId === trade.product._id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <MessageCircle className="w-3 h-3" />
                                            )}
                                            Chat with buyer
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Document Upload Modal */}
            {uploadModalOpen && uploadTradeId && uploadDocType && (
                <DocumentUploadModal
                    isOpen={uploadModalOpen}
                    onClose={() => {
                        setUploadModalOpen(false);
                        setUploadTradeId(null);
                        setUploadDocType(null);
                    }}
                    onUpload={handleDocumentUpload}
                    documentType={uploadDocType}
                />
            )}

            {/* View Document Modal */}
            {viewingDocType && (
                <ViewDocumentModal
                    isOpen={viewModalOpen}
                    onClose={() => {
                        setViewModalOpen(false);
                        setViewingDocument(null);
                        setViewingDocType(null);
                        setViewingTradeId(null);
                    }}
                    document={viewingDocument}
                    documentType={viewingDocType}
                    canVerify={canVerifyDocument(viewingDocType) && viewingDocument?.status === 'uploaded'}
                    onVerify={handleVerify}
                />
            )}
        </div>
    );
};

export default SellerSPAStatus;
