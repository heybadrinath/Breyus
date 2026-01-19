import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Image, Loader2, Check, AlertCircle } from 'lucide-react';

export type DocumentType = 'sco' | 'icpo' | 'spa' | 'bol' | 'payment-proof';

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File, notes?: string, metadata?: Record<string, string>) => Promise<void>;
    documentType: DocumentType;
    title?: string;
    description?: string;
    acceptedTypes?: string[];
    maxSizeMB?: number;
}

const DOCUMENT_TYPE_INFO: Record<DocumentType, { title: string; description: string }> = {
    'sco': {
        title: 'Upload Soft Corporate Offer (SCO)',
        description: 'Upload your SCO document outlining the initial trade terms.'
    },
    'icpo': {
        title: 'Upload Irrevocable Corporate Purchase Order (ICPO)',
        description: 'Upload your ICPO confirming the purchase commitment.'
    },
    'spa': {
        title: 'Upload Sales Purchase Agreement (SPA)',
        description: 'Upload the signed SPA document for this trade.'
    },
    'bol': {
        title: 'Upload Bill of Lading (BoL)',
        description: 'Upload the Bill of Lading for shipment verification.'
    },
    'payment-proof': {
        title: 'Upload Payment Proof',
        description: 'Upload proof of payment (bank transfer receipt, payment confirmation, etc.)'
    }
};

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
    isOpen,
    onClose,
    onUpload,
    documentType,
    title,
    description,
    acceptedTypes = ['.pdf', '.png', '.jpg', '.jpeg'],
    maxSizeMB = 10
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [confirmAuthority, setConfirmAuthority] = useState(false);
    const [confirmAccuracy, setConfirmAccuracy] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Validation: require file and both confirmations
    const canSubmit = selectedFile && confirmAuthority && confirmAccuracy;

    const info = DOCUMENT_TYPE_INFO[documentType];
    const displayTitle = title || info.title;
    const displayDescription = description || info.description;

    const validateFile = (file: File): string | null => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(extension)) {
            return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
        }

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            return `File too large. Maximum size: ${maxSizeMB}MB`;
        }

        return null;
    };

    const handleFile = useCallback((file: File) => {
        setError(null);
        setUploadSuccess(false);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setSelectedFile(file);

        // Generate preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    }, [acceptedTypes, maxSizeMB]);

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

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    }, [handleFile]);

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setUploading(true);
            setError(null);
            await onUpload(selectedFile, notes || undefined);
            setUploadSuccess(true);
            setTimeout(() => {
                onClose();
                // Reset state
                setSelectedFile(null);
                setPreview(null);
                setNotes('');
                setUploadSuccess(false);
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        if (!uploading) {
            setSelectedFile(null);
            setPreview(null);
            setNotes('');
            setError(null);
            setUploadSuccess(false);
            setConfirmAuthority(false);
            setConfirmAccuracy(false);
            onClose();
        }
    };

    const getFileIcon = () => {
        if (!selectedFile) return null;
        if (selectedFile.type.startsWith('image/')) {
            return <Image className="w-8 h-8 text-blue-500" />;
        }
        return <FileText className="w-8 h-8 text-red-500" />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">{displayTitle}</h2>
                        <p className="text-sm text-gray-500 mt-1">{displayDescription}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {uploadSuccess ? (
                        <div className="flex flex-col items-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <p className="text-lg font-medium text-green-600">Upload Successful!</p>
                        </div>
                    ) : (
                        <>
                            {/* Drop Zone */}
                            <div
                                className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
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
                                    accept={acceptedTypes.join(',')}
                                    onChange={handleChange}
                                    className="hidden"
                                />

                                {selectedFile ? (
                                    <div className="flex flex-col items-center">
                                        {preview ? (
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="w-24 h-24 object-cover rounded-lg mb-3"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                                                {getFileIcon()}
                                            </div>
                                        )}
                                        <p className="font-medium text-gray-800">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFile(null);
                                                setPreview(null);
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
                                            Drop your file here, or <span className="text-blue-600">browse</span>
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Supported: {acceptedTypes.join(', ')} (max {maxSizeMB}MB)
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirmation Checkboxes */}
                            {selectedFile && (
                                <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Required Confirmations</p>

                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={confirmAuthority}
                                                onChange={(e) => setConfirmAuthority(e.target.checked)}
                                                disabled={uploading}
                                                className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 group-hover:text-gray-800">
                                            I confirm that I am authorized to upload this document on behalf of my company.
                                        </span>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={confirmAccuracy}
                                                onChange={(e) => setConfirmAccuracy(e.target.checked)}
                                                disabled={uploading}
                                                className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 group-hover:text-gray-800">
                                            I confirm that all information in this document is accurate and complete to the best of my knowledge.
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Notes Input */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any additional notes about this document..."
                                    rows={2}
                                    disabled={uploading}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-[#C4A962] resize-none disabled:bg-gray-100 text-sm"
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!uploadSuccess && (
                    <div className="p-4 border-t bg-gray-50 flex gap-3 flex-shrink-0 rounded-b-xl">
                        <button
                            onClick={handleClose}
                            disabled={uploading}
                            className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!canSubmit || uploading}
                            className="flex-1 py-2.5 px-4 bg-[#1a1a2e] text-white rounded-lg hover:bg-[#16162a] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Upload Document
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentUploadModal;
