import React, { useRef } from "react";
import { Anchor, Upload, FileText, X, Loader2, Check, AlertCircle } from "lucide-react";
import ComboboxDropdown, { ComboboxOption } from "../../components/ui/ComboboxDropdown";
import { Port } from "../../services/content.service";

interface TradeQueriesProps {
    handlestep: (step: number) => void;
    currentStep: number;
    onDataChange: (data: any) => void;
    stepData: any;
    // Lifted state props
    industryType: string;
    marketYears: string;
    marketCapture: string;
    tradeYears: string;
    productUsage: string;
    onIndustryTypeChange: (value: string) => void;
    onMarketYearsChange: (value: string) => void;
    onMarketCaptureChange: (value: string) => void;
    onTradeYearsChange: (value: string) => void;
    onProductUsageChange: (value: string) => void;
    // New props for port and CIS
    nearestPort: string;
    onNearestPortChange: (value: string) => void;
    ports: Port[];
    portsLoading: boolean;
    // CIS document props
    hasCisInProfile: boolean;
    profileCisDocument?: string;
    uploadedCisDocument?: string;
    onCisUpload: (file: File) => Promise<void>;
    onCisRemove: () => void;
    cisUploadLoading: boolean;
}

export const TradeQueries: React.FC<TradeQueriesProps> = ({
    handlestep,
    currentStep,
    onDataChange,
    stepData,
    industryType,
    marketYears,
    marketCapture,
    tradeYears,
    productUsage,
    onIndustryTypeChange,
    onMarketYearsChange,
    onMarketCaptureChange,
    onTradeYearsChange,
    onProductUsageChange,
    // New props
    nearestPort,
    onNearestPortChange,
    ports,
    portsLoading,
    hasCisInProfile,
    profileCisDocument,
    uploadedCisDocument,
    onCisUpload,
    onCisRemove,
    cisUploadLoading
}) => {
    const cisInputRef = useRef<HTMLInputElement>(null);

    const handleNext = () => {
        // Validate required fields
        if (!marketYears || !tradeYears) {
            alert('Please fill in all required fields');
            return;
        }
        handlestep(currentStep + 1);
    };

    // Convert ports to ComboboxOption format
    const portOptions: ComboboxOption[] = ports.map(port => ({
        value: port.name,
        label: port.name,
        subLabel: port.city ? `${port.city}, ${typeof port.country === 'object' ? port.country.name : port.country}` : (typeof port.country === 'object' ? port.country.name : ''),
        group: port.type === 'sea' ? 'Sea Ports' : port.type === 'air' ? 'Air Ports' : 'Land Ports',
        icon: port.type === 'sea' ? <Anchor className="w-4 h-4" /> : undefined
    }));

    const handleCisFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onCisUpload(file);
        }
        // Reset input
        if (cisInputRef.current) {
            cisInputRef.current.value = '';
        }
    };

    const cisDocumentPath = hasCisInProfile ? profileCisDocument : uploadedCisDocument;

    return (
        <div className="flex flex-col my-auto mx-auto w-[50%]">
            <h1 className="text-3xl font-semibold text-black mb-3">Trade Queries</h1>
            <div className="flex flex-col w-full border-2 rounded-lg px-8 py-6 gap-y-4" >
                {/* Nearest Port Section */}
                <div>
                    <label className="block font-medium mb-2">
                        Nearest Importing Port
                    </label>
                    <ComboboxDropdown
                        options={portOptions}
                        value={nearestPort}
                        onChange={(value) => onNearestPortChange(value)}
                        placeholder="Search or enter your nearest port..."
                        allowCustom={true}
                        showCustomWarning={true}
                        customWarningMessage="This port is not in our standard list. You can still use it."
                        loading={portsLoading}
                        grouped={true}
                        emptyMessage="No ports found. You can enter a custom port name."
                    />
                </div>

                {/* CIS Document Section */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block font-medium mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        CIS Document (Customer Information Sheet)
                    </label>

                    {hasCisInProfile ? (
                        // CIS exists in profile
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-green-800 font-medium">
                                    Your CIS document is attached from your profile
                                </p>
                                <p className="text-xs text-green-600 mt-0.5">
                                    The CIS from your company settings will be used for this Purchase Request
                                </p>
                            </div>
                            {profileCisDocument && (
                                <a
                                    href={`${process.env.REACT_APP_BACKEND_URL}${profileCisDocument}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-green-700 hover:text-green-800 underline"
                                >
                                    View
                                </a>
                            )}
                        </div>
                    ) : uploadedCisDocument ? (
                        // User has uploaded a CIS for this PR
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-blue-800 font-medium">
                                    CIS document uploaded
                                </p>
                                <p className="text-xs text-blue-600 mt-0.5">
                                    Your uploaded document will be attached to this Purchase Request
                                </p>
                            </div>
                            <a
                                href={`${process.env.REACT_APP_BACKEND_URL}${uploadedCisDocument}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-700 hover:text-blue-800 underline mr-2"
                            >
                                View
                            </a>
                            <button
                                onClick={onCisRemove}
                                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remove document"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        // No CIS - show upload option
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-yellow-800 font-medium">
                                        No CIS document found in your profile
                                    </p>
                                    <p className="text-xs text-yellow-600 mt-0.5">
                                        Please upload a CIS document for this Purchase Request or add one to your profile settings
                                    </p>
                                </div>
                            </div>
                            <input
                                ref={cisInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={handleCisFileChange}
                                className="hidden"
                                id="cis-upload"
                            />
                            <button
                                onClick={() => cisInputRef.current?.click()}
                                disabled={cisUploadLoading}
                                className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                {cisUploadLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Upload CIS Document
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block font-medium">Which industry uses your product?</label>
                    <input
                        type="text"
                        name="industry"
                        className="border p-2 mt-2 w-full rounded"
                        value={industryType}
                        onChange={(e) => onIndustryTypeChange(e.target.value)}
                        placeholder="e.g., Manufacturing, Agriculture, etc."
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        How long have you been in the market? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="marketYears"
                        className="border p-2 mt-2 w-full rounded"
                        value={marketYears}
                        onChange={(e) => onMarketYearsChange(e.target.value)}
                        placeholder="Enter number of years"
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        What is your market capture?
                    </label>
                    <input
                        type="text"
                        name="marketcapture"
                        className="border p-2 mt-2 w-full rounded"
                        placeholder="  %"
                        value={marketCapture}
                        onChange={(e) => onMarketCaptureChange(e.target.value)}
                    />
                </div>

                <div className="flex flex-col w-full">
                    <label className="block font-medium">
                        How many potential years this this "Company Name" trade be? <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="yearsTrade"
                        className="border p-2 mt-2 w-full rounded"
                        value={tradeYears}
                        onChange={(e) => onTradeYearsChange(e.target.value)}
                        placeholder="Enter number of years"
                        required
                    />
                </div>

                <div>
                    <label className="block font-medium">
                        How are you using this product?
                    </label>
                    <input
                        type="text"
                        name="productUsage"
                        className="border p-2 mt-2 w-full rounded"
                        value={productUsage}
                        onChange={(e) => onProductUsageChange(e.target.value)}
                        placeholder="Describe how you plan to use this product"
                    />
                </div>

                <div className="mt-8 flex justify-between">
                    <button
                        onClick={() => handlestep(currentStep - 1)}
                        type="button"
                        className=" bg-gradient-to-r from-[#e7e7e7] to-[#ffffff] border-2 text-black px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-[#e1e2e4] hover:to-[#f8fafc] hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        type="button"
                        className=" ml-auto bg-gradient-to-r from-[#5e5959] to-[black] text-white px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-gray-600 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
