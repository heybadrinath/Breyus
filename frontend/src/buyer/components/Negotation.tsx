import React, { useState } from "react";
import TradeStatusProgress from "./tradeStatusProgress";
import { Incoterms } from "../../components/incoterms";
import { Edit, Timer, X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "../../services/products.service";
import { IncotermsState } from "../../types/Incoterms";

interface NegotationProps {
    handlestep: (step: number) => void;
    currentStep: number;
    product: Product | null;
    quantity: string;
    onDataChange: (data: any) => void;
    stepData: any;
    // New props for lifted state
    sellerIncotermsState: IncotermsState;
    negoatiatedIncotermsState: IncotermsState;
    onSellerIncotermsChange: (state: IncotermsState) => void;
    onNegotiatedIncotermsChange: (state: IncotermsState | ((prevState: IncotermsState) => IncotermsState)) => void;
}

export const Negoatation: React.FC<NegotationProps> = ({ 
    handlestep, 
    currentStep, 
    product, 
    quantity, 
    onDataChange,
    stepData,
    sellerIncotermsState,
    negoatiatedIncotermsState,
    onSellerIncotermsChange,
    onNegotiatedIncotermsChange
}) => {
    const [showIncoterms, setShowIncoterms] = useState(false)
    const [showNegotiatedIncoterms, setShowNegotiatedIncoterms] = useState(false)
    const [incotermType, setIncotermType] = useState("EditIncoterms") // Default to edit mode

    // Form data state - these will be controlled by parent
    const [additionalMessage, setAdditionalMessage] = useState(stepData?.buyerMessage || '');
    const [counterPrice, setCounterPrice] = useState(stepData?.buyerOfferedPrice || '');

    const navigate = useNavigate();

    // Handle form field changes and update parent
    const handleAdditionalMessageChange = (value: string) => {
        setAdditionalMessage(value);
        onDataChange({
            buyerMessage: value,
            buyerOfferedPrice: counterPrice,
            buyerIncoterms: negoatiatedIncotermsState.selectedIncoterm ? negoatiatedIncotermsState : undefined
        });
    };

    const handleCounterPriceChange = (value: string) => {
        setCounterPrice(value);
        onDataChange({
            buyerMessage: additionalMessage,
            buyerOfferedPrice: value,
            buyerIncoterms: negoatiatedIncotermsState.selectedIncoterm ? negoatiatedIncotermsState : undefined
        });
    };

    const handleNext = () => {
        handlestep(currentStep + 1);
    };

    const handleSkip = () => {
        // Clear negotiation data when skipping
        setAdditionalMessage('');
        setCounterPrice('');
        onDataChange({
            buyerMessage: '',
            buyerOfferedPrice: '',
            buyerIncoterms: undefined
        });
        handlestep(currentStep + 1);
    };

    return (
        <div className="flex w-full min-h-[75vh] py-6 px-8 gap-6">
            {/* Left - Trade Status */}
            <div className="w-[260px] flex-shrink-0">
                <h1 className="text-lg font-bold mb-3">Trade Status:</h1>
                <div className="border border-gray-200 rounded-lg bg-white h-fit">
                    <TradeStatusProgress currentStep={1} />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 border border-gray-200 rounded-lg bg-white">
                <div className="grid grid-cols-2 gap-8 p-8">
                    {/* Left Section - Incoterms & Counter Offer */}
                    <div className="flex flex-col space-y-6">
                        {/* Incoterms */}
                        <div>
                            <h3 className="font-bold text-lg mb-3">Incoterms :</h3>
                            <button
                                onClick={() => setShowIncoterms(true)}
                                className="flex items-center gap-2 border border-gray-300 px-6 py-2.5 rounded-lg transition-all hover:border-gray-400 hover:bg-gray-50"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Inco-terms
                            </button>
                        </div>

                        {/* Negotiated Incoterms */}
                        <div>
                            <h3 className="font-bold text-lg mb-3">Negotiated Incoterms :</h3>
                            <button
                                onClick={() => setShowNegotiatedIncoterms(true)}
                                className="flex items-center gap-2 border border-gray-300 px-6 py-2.5 rounded-lg transition-all hover:border-gray-400 hover:bg-gray-50"
                            >
                                <Eye className="h-4 w-4" />
                                Countered terms
                            </button>
                        </div>

                        {/* Additional Message */}
                        <div>
                            <h3 className="font-bold text-lg mb-3">Additional Message:</h3>
                            <textarea
                                placeholder="Type your additional message"
                                className="w-full h-32 border border-gray-300 rounded-lg p-3 outline-none focus:border-gray-400 resize-none"
                                value={additionalMessage}
                                onChange={(e) => handleAdditionalMessageChange(e.target.value)}
                            />
                        </div>

                        {/* Price Section */}
                        <div className="flex gap-6">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-3">Current Price :</h3>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                    <div className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700">
                                        {product?.salePrice || product?.price}
                                    </div>
                                    <span className="px-4 py-2.5 bg-white border-l border-gray-300 text-gray-600">
                                        {product?.currency}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-3">Make counter offer :</h3>
                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                    <input
                                        placeholder="type your price here"
                                        className="flex-1 px-4 py-2.5 outline-none"
                                        value={counterPrice}
                                        onChange={(e) => handleCounterPriceChange(e.target.value)}
                                        type="number"
                                    />
                                    <span className="px-4 py-2.5 bg-white border-l border-gray-300 text-gray-600">
                                        {product?.currency}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Product Info & Coming Soon */}
                    <div className="flex flex-col gap-4">
                        {/* Product Information Card */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <h3 className="font-bold text-base mb-1">Product Information</h3>
                                    <h4 className="font-bold text-lg mb-2">{product?.name}</h4>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-lg font-bold text-gray-900">
                                            {product?.salePrice || product?.price} {product?.currency}
                                        </span>
                                        {product?.onSale && (
                                            <>
                                                <span className="text-sm text-gray-400 line-through">
                                                    {product?.price} {product?.currency}
                                                </span>
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                                                    {product?.discount}% OFF
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex text-xs text-gray-500 mb-4">
                                        <span>MOQ: {product?.moq} {product?.moqUnit}</span>
                                        <span className="ml-auto">Stock: {product?.stock} {product?.stockUnit}</span>
                                    </div>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-fit">
                                        <span className="px-4 py-2 text-sm">Quantity : {quantity}</span>
                                        <span className="px-3 py-2 bg-gray-50 border-l border-gray-300 text-sm text-gray-600">
                                            {product?.moqUnit}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-32 h-32 flex-shrink-0">
                                    <img
                                        alt={product?.name}
                                        className="w-full h-full object-cover rounded-lg"
                                        src={product?.images?.[0] || product?.productImage}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Coming Soon */}
                        <div className="flex-1 border border-gray-200 rounded-lg flex flex-col items-center justify-center min-h-[200px]">
                            <span className="text-gray-300 text-xl font-semibold mb-2">Coming soon</span>
                            <Timer className="text-gray-200" height={60} width={60} />
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-between items-center px-8 pb-6">
                    <button
                        onClick={() => navigate(`/buyer/product-page?id=${product?.id}`)}
                        type="button"
                        className="border border-gray-300 text-black px-8 py-3 rounded-lg font-medium transition-all hover:bg-gray-50"
                    >
                        Back To Product Page
                    </button>
                    <div className="flex gap-4">
                        <button
                            onClick={handleNext}
                            type="button"
                            className="border border-gray-300 text-black px-8 py-3 rounded-lg font-medium transition-all hover:bg-gray-50"
                        >
                            Counter Offer
                        </button>
                        <button
                            onClick={handleSkip}
                            type="button"
                            className="bg-black text-white px-8 py-3 rounded-lg font-medium transition-all hover:bg-gray-800"
                        >
                            Skip Counter Offer
                        </button>
                    </div>
                </div>
            </div>

            {/* Popups */}
            {showIncoterms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-xl w-[98vw] h-[96vh] mx-auto p-6 relative animate-fade-in flex flex-col">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                            onClick={() => setShowIncoterms(false)}
                            aria-label="Close"
                        >
                            <X size={22} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-center">Edit Incoterms</h2>
                        <div className="flex-1 overflow-y-auto">
                            <div>
                                <div className="flex mx-auto w-fit mb-4 gap-8">
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${incotermType === "SellerIncoterms" ? 'bg-gray-100 font-medium' : ''}`}>
                                        <input
                                            className="accent-black"
                                            name="Incoterms"
                                            value="SellerIncoterms"
                                            type='radio'
                                            onChange={(e) => setIncotermType(e.target.value)}
                                            checked={incotermType === "SellerIncoterms"}
                                        />
                                        View Seller's Terms (Read-only)
                                    </label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${incotermType === "EditIncoterms" ? 'bg-blue-100 font-medium' : ''}`}>
                                        <input
                                            className="accent-blue-600"
                                            name="Incoterms"
                                            value="EditIncoterms"
                                            type='radio'
                                            onChange={(e) => setIncotermType(e.target.value)}
                                            checked={incotermType === "EditIncoterms"}
                                        />
                                        Edit Your Terms
                                    </label>
                                </div>
                                {incotermType === "EditIncoterms" && (
                                    <p className="text-center text-sm text-gray-600 mb-2">
                                        Select an Incoterm column (checkbox) to edit its values. Click on Buyer/Seller cells to toggle.
                                    </p>
                                )}
                                {incotermType === "SellerIncoterms" ? (
                                    <Incoterms incoterms={sellerIncotermsState} setIncoterms={() => { }} />
                                ) : (
                                    <Incoterms incoterms={negoatiatedIncotermsState} setIncoterms={onNegotiatedIncotermsChange} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showNegotiatedIncoterms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-xl w-[98vw] h-[96vh] mx-auto p-6 relative animate-fade-in flex flex-col">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                            onClick={() => setShowNegotiatedIncoterms(false)}
                            aria-label="Close"
                        >
                            <X size={22} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-center">Compare Incoterms</h2>
                        <div className="flex-1 overflow-y-auto">
                            <div>
                                <div className="flex mx-auto w-fit mb-4 gap-8">
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${incotermType === "SellerIncoterms" ? 'bg-green-100 font-medium' : ''}`}>
                                        <input
                                            className="accent-green-600"
                                            name="ViewIncoterms"
                                            value="SellerIncoterms"
                                            type='radio'
                                            onChange={(e) => setIncotermType(e.target.value)}
                                            checked={incotermType === "SellerIncoterms"}
                                        />
                                        Seller's Terms
                                    </label>
                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${incotermType === "EditIncoterms" ? 'bg-blue-100 font-medium' : ''}`}>
                                        <input
                                            className="accent-blue-600"
                                            name="ViewIncoterms"
                                            value="EditIncoterms"
                                            type='radio'
                                            onChange={(e) => setIncotermType(e.target.value)}
                                            checked={incotermType === "EditIncoterms"}
                                        />
                                        Your Counter Terms
                                    </label>
                                </div>
                                <p className="text-center text-sm text-gray-500 mb-2">
                                    View-only comparison of terms
                                </p>
                                {incotermType === "SellerIncoterms" ? (
                                    <Incoterms incoterms={sellerIncotermsState} setIncoterms={() => { }} />
                                ) : (
                                    <Incoterms incoterms={negoatiatedIncotermsState} setIncoterms={() => { }} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
