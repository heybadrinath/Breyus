import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Upload, FileText, X, Check, Loader2, Paperclip, CheckCircle, RefreshCw, Eye, Download, Clock } from "lucide-react";
import { uploadSCO, getTradeById, Trade } from "../../services/trade.service";
import DocumentReplaceModal from "../../components/DocumentReplaceModal";

// Horizontal Trade Progress Component
const TradeProgressBar = ({ currentStep }: { currentStep: number }) => {
    const steps = [
        { label: "Purchase Request", step: 1 },
        { label: "Soft Corporate Offer", step: 2 },
        { label: "Purchase Order (ICPO)", step: 3 },
        { label: "SPA & Completion", step: 4 },
    ];

    return (
        <div className="bg-black text-white py-4 px-8">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
                {steps.map((item, index) => (
                    <React.Fragment key={item.step}>
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    currentStep >= item.step
                                        ? "bg-white border-white"
                                        : "border-gray-500 bg-transparent"
                                }`}
                            >
                                {currentStep >= item.step && (
                                    <div className="w-2 h-2 rounded-full bg-black"></div>
                                )}
                            </div>
                            <span
                                className={`text-xs mt-2 whitespace-nowrap ${
                                    currentStep >= item.step ? "text-white font-medium" : "text-gray-400"
                                }`}
                            >
                                {item.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-[1px] mx-2 mt-[-20px] ${
                                    currentStep > item.step
                                        ? "border-t-2 border-white border-dashed"
                                        : "border-t-2 border-gray-500 border-dashed"
                                }`}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

interface DocumentInfo {
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

interface TradeWithProduct extends Omit<Trade, 'purchaseOrderStatus' | 'purchaseRequestStatus' | 'negotiationStatus'> {
    product: {
        _id: string;
        name: string;
        price: string;
        currency: string;
        productImages: string[];
        description?: string;
    };
    buyer: {
        _id: string;
        mail: string;
    };
    purchaseOrderStatus?: string;
    purchaseRequestStatus?: string;
    negotiationStatus?: string;
    tradePhase?: string;
    scoDocument?: DocumentInfo;
    icpoDocument?: DocumentInfo;
}

// Helper to get progress step from trade phase
const getProgressStep = (tradePhase?: string): number => {
    switch (tradePhase) {
        case 'PR':
            return 1;
        case 'SCO':
        case 'ICPO':
            return 2;
        case 'SPA':
            return 3;
        case 'PAYMENT':
        case 'BOL':
        case 'COMPLETED':
            return 4;
        default:
            return 2; // Default to step 2 for SCO upload
    }
};

export const SCOUpload = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get trade ID from URL query params
    const searchParams = new URLSearchParams(location.search);
    const tradeId = searchParams.get("tradeId");

    const [trade, setTrade] = useState<TradeWithProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [agreed, setAgreed] = useState(false);

    // Replace mode state
    const isReplaceMode = searchParams.get("replace") === "true";
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [replaceMode, setReplaceMode] = useState(isReplaceMode);

    useEffect(() => {
        if (tradeId) {
            fetchTrade();
        } else {
            setError("No trade ID provided");
            setLoading(false);
        }
    }, [tradeId]);

    const fetchTrade = async () => {
        try {
            setLoading(true);
            const response = await getTradeById(tradeId!);
            setTrade(response.data as TradeWithProduct);
        } catch (err) {
            setError("Failed to load trade details");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                setError("Please upload a PDF or image file (JPEG, PNG)");
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                return;
            }

            setSelectedFile(file);
            setError(null);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setPreviewUrl(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                setError("Please upload a PDF or image file (JPEG, PNG)");
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError("File size must be less than 10MB");
                return;
            }
            setSelectedFile(file);
            setError(null);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setPreviewUrl(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const removeFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile || !agreed || !tradeId) {
            if (!selectedFile) setError("Please select a file to upload");
            if (!agreed) setError("Please agree to the terms");
            return;
        }

        try {
            setUploading(true);
            setError(null);
            await uploadSCO(tradeId, selectedFile);
            navigate("/seller/trade?tab=po", {
                state: { success: "SCO uploaded successfully! Waiting for buyer to upload ICPO." }
            });
        } catch (err: any) {
            setError(err.message || "Failed to upload SCO");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        );
    }

    if (error && !trade) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate("/seller/trade")}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                    Back to Trade
                </button>
            </div>
        );
    }

    // Check if SCO is already uploaded
    const hasExistingSCO = trade?.scoDocument && trade.scoDocument.filePath && !replaceMode;
    const progressStep = getProgressStep(trade?.tradePhase);

    // Handle opening replace modal
    const handleReplaceClick = () => {
        setShowReplaceModal(true);
    };

    // Confirm replace and enter replace mode
    const handleConfirmReplace = (reason: string) => {
        setReplaceMode(true);
        setShowReplaceModal(false);
    };

    // Get document URL
    const getDocumentUrl = (filePath: string) => {
        return filePath.startsWith('http')
            ? filePath
            : `${process.env.REACT_APP_BACKEND_URL}${filePath}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Progress Bar - Dynamic based on trade phase */}
            <TradeProgressBar currentStep={progressStep} />

            {/* Main Content */}
            <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/seller/trade")}
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Trade
                </button>

                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Soft Corporate Offer (SCO) Details
                </h1>

                {/* Trade Info Summary */}
                {trade && (
                    <div className="bg-white rounded-lg border p-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                {trade.product?.productImages?.[0] && (
                                    <img
                                        src={trade.product.productImages[0].startsWith('http')
                                            ? trade.product.productImages[0]
                                            : `${process.env.REACT_APP_BACKEND_URL}${trade.product.productImages[0]}`}
                                        alt={trade.product.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{trade.product?.name}</h3>
                                <p className="text-sm text-gray-500">
                                    Quantity: {trade.quantity} {trade.quantityUnit}
                                </p>
                                <p className="text-sm font-medium text-green-600">
                                    {trade.buyerOfferedPrice || trade.product?.price} {trade.product?.currency || 'INR'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Buyer</p>
                                <p className="text-sm font-medium">{trade.buyer?.mail}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Already Uploaded State */}
                {hasExistingSCO ? (
                    <div className="bg-white rounded-lg border p-8 mb-6">
                        {/* Success Banner */}
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <div>
                                <h3 className="font-semibold text-green-800">SCO Document Uploaded</h3>
                                <p className="text-sm text-green-700">Your corporate offer has been sent to the buyer</p>
                            </div>
                        </div>

                        {/* Document Info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-lg border">
                                    <FileText className="w-8 h-8 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {trade.scoDocument?.originalName || 'SCO Document'}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                        {trade.scoDocument?.uploadedAt && (
                                            <span>
                                                Uploaded: {new Date(trade.scoDocument.uploadedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        )}
                                        {trade.scoDocument?.version && trade.scoDocument.version > 1 && (
                                            <span className="text-blue-600">Version {trade.scoDocument.version}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ICPO Status */}
                        {trade.icpoDocument && trade.icpoDocument.filePath ? (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                <span className="text-sm text-blue-800">
                                    Buyer has uploaded their ICPO - Review and verify
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                                <Clock className="w-5 h-5 text-yellow-600" />
                                <span className="text-sm text-yellow-800">
                                    Awaiting buyer's ICPO (Irrevocable Corporate Purchase Order)
                                </span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <a
                                href={getDocumentUrl(trade.scoDocument!.filePath)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-700"
                            >
                                <Eye className="w-4 h-4" />
                                View Document
                            </a>
                            <a
                                href={getDocumentUrl(trade.scoDocument!.filePath)}
                                download={trade.scoDocument?.originalName || 'SCO'}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-700"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </a>
                            <button
                                onClick={handleReplaceClick}
                                className="flex-1 px-4 py-3 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Replace Document
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Upload Area */}
                        <div
                            className={`bg-white rounded-lg border-2 border-dashed p-8 mb-6 transition-colors ${
                                selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                        >
                            {!selectedFile ? (
                                <div className="flex flex-col items-center justify-center min-h-[300px]">
                                    <Upload className="w-16 h-16 text-gray-400 mb-4" />
                                    <p className="text-lg text-gray-600 mb-2">
                                        {replaceMode ? 'Upload new SCO document' : 'Drag and drop your SCO document here'}
                                    </p>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Supported formats: PDF, JPEG, PNG (Max 10MB)
                                    </p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        Browse Files
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center min-h-[300px]">
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-h-[250px] max-w-full object-contain mb-4 rounded-lg"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-24 h-24 bg-gray-100 rounded-lg mb-4">
                                            <FileText className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Check className="w-5 h-5 text-green-500" />
                                        <span className="text-gray-700 font-medium">{selectedFile.name}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    <button
                                        onClick={removeFile}
                                        className="flex items-center gap-1 text-red-500 hover:text-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                        Remove file
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                                {error}
                            </div>
                        )}

                        {/* Agreement Checkbox */}
                        <div className="flex items-start gap-3 mb-6">
                            <input
                                type="checkbox"
                                id="agreement"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                            />
                            <label htmlFor="agreement" className="text-sm text-gray-600">
                                I confirm that this Soft Corporate Offer contains accurate product details, pricing, and terms
                            </label>
                        </div>

                        {/* Info Note */}
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 bg-gray-100 px-4 py-3 rounded-lg">
                            <Paperclip className="w-4 h-4" />
                            <span>After you submit the SCO, the buyer will be able to upload their ICPO (Irrevocable Corporate Purchase Order)</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => navigate("/seller/trade")}
                                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedFile || !agreed || uploading}
                                className={`px-8 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                                    selectedFile && agreed && !uploading
                                        ? 'bg-black text-white hover:bg-gray-800'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    replaceMode ? 'Replace SCO Document' : 'Send SCO (Soft Corporate Offer)'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Replace Document Modal */}
            {trade && (
                <DocumentReplaceModal
                    isOpen={showReplaceModal}
                    onClose={() => setShowReplaceModal(false)}
                    onConfirm={handleConfirmReplace}
                    documentType="sco"
                    currentDocument={trade.scoDocument}
                />
            )}
        </div>
    );
};

export default SCOUpload;
