import React, { useState, useRef, useCallback } from 'react';
import { X, Download, FileText, Upload, CheckCircle, Loader2, AlertCircle, PenTool, ExternalLink } from 'lucide-react';
import { DocumentInfo, DocumentType } from '../services/trade.service';
import SignatureCanvas from './SignatureCanvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

type SigningMode = 'choose' | 'in-app' | 'upload';

interface DocumentSigningModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: DocumentInfo | null;
    documentType: DocumentType;
    tradeId: string;
    onSignInApp: (notes?: string, signatureDataUrl?: string) => Promise<void>;
    onUploadSigned: (file: File, notes?: string) => Promise<void>;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    'sco': 'Soft Corporate Offer (SCO)',
    'icpo': 'Irrevocable Corporate Purchase Order (ICPO)',
    'spa': 'Sales Purchase Agreement (SPA)',
    'bol': 'Bill of Lading (BoL)',
    'payment-proof': 'Payment Proof'
};

const DocumentSigningModal: React.FC<DocumentSigningModalProps> = ({
    isOpen,
    onClose,
    document,
    documentType,
    tradeId,
    onSignInApp,
    onUploadSigned
}) => {
    const [mode, setMode] = useState<SigningMode>('choose');
    const [agreed, setAgreed] = useState(false);
    const [notes, setNotes] = useState('');
    const [signing, setSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Signature state
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

    // Upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const documentUrl = document ? `${BACKEND_URL}${document.filePath.startsWith('/') ? '' : '/'}${document.filePath}` : null;
    const displayTitle = DOCUMENT_TYPE_LABELS[documentType];
    const isPDF = document?.mimeType === 'application/pdf';
    const isImage = document?.mimeType.startsWith('image/');

    const handleDownload = () => {
        if (documentUrl) {
            window.open(documentUrl, '_blank');
        }
    };

    const handleSignInApp = async () => {
        try {
            setSigning(true);
            setError(null);
            await onSignInApp(notes || undefined, signatureDataUrl || undefined);
            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to sign document');
        } finally {
            setSigning(false);
        }
    };

    const handleUploadSigned = async () => {
        if (!selectedFile) return;

        try {
            setSigning(true);
            setError(null);
            await onUploadSigned(selectedFile, notes || undefined);
            setSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to upload signed document');
        } finally {
            setSigning(false);
        }
    };

    const handleClose = () => {
        if (!signing) {
            setMode('choose');
            setAgreed(false);
            setNotes('');
            setError(null);
            setSuccess(false);
            setSelectedFile(null);
            setSignatureDataUrl(null);
            onClose();
        }
    };

    const validateFile = (file: File): string | null => {
        const validTypes = ['.pdf', '.png', '.jpg', '.jpeg'];
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!validTypes.includes(extension)) {
            return `Invalid file type. Accepted: ${validTypes.join(', ')}`;
        }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 10) {
            return 'File too large. Maximum size: 10MB';
        }
        return null;
    };

    const handleFile = useCallback((file: File) => {
        setError(null);
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }
        setSelectedFile(file);
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    }, [handleFile]);

    // Success view
    if (success) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-8">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Document Signed!</h3>
                        <p className="text-gray-500 text-center">
                            {mode === 'in-app'
                                ? 'Your digital signature has been recorded.'
                                : 'Your signed document has been uploaded successfully.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Choose mode view
    if (mode === 'choose') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-bold text-gray-800">Sign {displayTitle}</h2>
                        <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6">
                        <p className="text-gray-600 mb-6 text-center">
                            How would you like to sign this document?
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            {/* In-App Signing Option */}
                            <button
                                onClick={() => setMode('in-app')}
                                className="p-6 border-2 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200">
                                        <PenTool className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="font-medium text-gray-800 mb-1">Sign In-App</h3>
                                    <p className="text-xs text-gray-500 text-center">
                                        Agree digitally within Breyus
                                    </p>
                                </div>
                            </button>

                            {/* External Upload Option */}
                            <button
                                onClick={() => setMode('upload')}
                                className="p-6 border-2 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-200">
                                        <Upload className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="font-medium text-gray-800 mb-1">Upload Signed</h3>
                                    <p className="text-xs text-gray-500 text-center">
                                        Upload externally signed document
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // In-App Signing Mode
    if (mode === 'in-app') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] shadow-xl flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b flex-shrink-0 bg-white">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMode('choose')}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ← Back
                            </button>
                            <h2 className="text-lg font-bold text-gray-800">Sign {displayTitle}</h2>
                        </div>
                        <button onClick={handleClose} disabled={signing} className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Document Preview */}
                    <div className="flex-1 overflow-auto p-4 bg-gray-100 min-h-[200px] max-h-[40vh]">
                        {document && isPDF ? (
                            <object
                                data={documentUrl || ''}
                                type="application/pdf"
                                className="w-full h-full min-h-[300px] rounded-lg"
                            >
                                <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg p-8">
                                    <FileText className="w-16 h-16 text-gray-400 mb-4" />
                                    <p className="text-gray-600 mb-4">Preview not available</p>
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open Document
                                    </button>
                                </div>
                            </object>
                        ) : document && isImage ? (
                            <div className="flex items-center justify-center h-full">
                                <img
                                    src={documentUrl || ''}
                                    alt={document.originalName}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg p-8">
                                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                                <p className="text-gray-500">No document to preview</p>
                                {documentUrl && (
                                    <button
                                        onClick={handleDownload}
                                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Document
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Agreement and Signature Section */}
                    <div className="p-4 border-t flex-shrink-0 space-y-4">
                        {/* Signature Canvas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Draw Your Signature
                            </label>
                            <SignatureCanvas
                                onSignatureChange={setSignatureDataUrl}
                                width={500}
                                height={150}
                            />
                        </div>

                        {/* Agreement Checkbox */}
                        <div className="flex items-start gap-3 pt-2">
                            <input
                                type="checkbox"
                                id="agree-checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                disabled={signing}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="agree-checkbox" className="text-gray-700 text-sm">
                                I have read and agree to all the details in this document. By clicking "Sign Document",
                                I confirm my digital acceptance of these terms.
                            </label>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (Optional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add any notes about your signature..."
                                rows={2}
                                disabled={signing}
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
                                onClick={handleClose}
                                disabled={signing}
                                className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSignInApp}
                                disabled={!agreed || !signatureDataUrl || signing}
                                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {signing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Signing...
                                    </>
                                ) : (
                                    <>
                                        <PenTool className="w-5 h-5" />
                                        Sign Document
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Upload Mode
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMode('choose')}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ← Back
                        </button>
                        <h2 className="text-lg font-bold text-gray-800">Upload Signed Document</h2>
                    </div>
                    <button onClick={handleClose} disabled={signing} className="p-2 hover:bg-gray-100 rounded-full disabled:opacity-50">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-gray-600 text-sm">
                        Upload your externally signed {displayTitle}. You can sign it physically or using any digital signature tool.
                    </p>

                    {/* Download Original */}
                    {documentUrl && (
                        <button
                            onClick={handleDownload}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            Download Original Document to Sign
                        </button>
                    )}

                    {/* Drop Zone */}
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : selectedFile
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {selectedFile ? (
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                                    <FileText className="w-8 h-8 text-green-600" />
                                </div>
                                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                    className="mt-2 text-sm text-red-500 hover:text-red-600"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="font-medium text-gray-700">
                                    Drop your signed file here, or <span className="text-blue-600">browse</span>
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    PDF, PNG, JPG (max 10MB)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes..."
                            rows={2}
                            disabled={signing}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex gap-3">
                    <button
                        onClick={handleClose}
                        disabled={signing}
                        className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUploadSigned}
                        disabled={!selectedFile || signing}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {signing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                Upload Signed Document
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DocumentSigningModal;
