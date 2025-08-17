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
    const [incotermType, setIncotermType] = useState("SellerIncoterms")

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
        <div className="flex w-full h-[75%] my-auto px-8">
            {/* Left */}
            <div className=" w-[300px] h-full">
                <h1 className=" ml-2 text-xl font-bold ">Trade Status</h1>
                <div className="flex flex-col h-full border border-gray-300 rounded-lg">
                    <TradeStatusProgress currentStep={1} />
                </div>
            </div>

            {/* Right */}
            <div className=" w-full h-full border border-gray-300 rounded-lg mt-7 mx-6">
                <div className=" grid grid-cols-2">
                    {/* Right section -> Left Section */}
                    <div id="left" className="flex flex-col h-full py-8 px-12">
                        <h3 className="font-extrabold text-xl mb-2">Incoterms: </h3>
                        <button onClick={() => setShowIncoterms(true)} className="flex border-2 px-8 py-2 w-fit rounded-lg transition-all delay-50 hover:border-gray-400 hover:scale-[1.02]"> <Edit className="inline mr-2 h-5 w-5 my-auto" /> Edit Incoterms</button>

                        <h3 className="font-extrabold text-xl mb-2 mt-6">Negotiated Incoterms: </h3>
                        <button onClick={() => setShowNegotiatedIncoterms(true)} className="flex border px-8 py-2 w-fit rounded-lg border-gray-400 transition-all delay-50 hover:border-gray-400 hover:scale-[1.02]"> <Eye className="inline mr-2 h-5 w-5 my-auto" /> View Countered Terms</button>

                        <h3 className="font-extrabold text-xl mb-2 mt-6">Additional Message: </h3>
                        <textarea 
                            placeholder="Type your additional message" 
                            className="flex h-[18vh] border-2 outline-none p-2 rounded-lg"
                            value={additionalMessage}
                            onChange={(e) => handleAdditionalMessageChange(e.target.value)}
                        />

                        <div className="flex justify-between mt-6">
                            <div>
                                <h3 className="font-extrabold text-xl mb-2">Current Price: </h3>
                                <div className=" px-2 py-2 mb-6 flex flex-row border-2 rounded-lg">
                                    <div className="w-full !border-0 !rounded-r-none text-sm py-1"> {product?.salePrice || product?.price} </div>
                                    <span className="my-auto mx-2 text-sm">{product?.currency}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-extrabold text-xl mb-2">Make counter offer: </h3>
                                <div className=" px-2 py-2 mb-6 flex flex-row border-2 rounded-lg">
                                    <input 
                                        placeholder={`type your price here`} 
                                        className="w-full !border-0 !rounded-r-none text-sm ring-0 outline-none py-1"
                                        value={counterPrice}
                                        onChange={(e) => handleCounterPriceChange(e.target.value)}
                                        type="number"
                                    />
                                    <span className="my-auto mx-2 text-sm">{product?.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right section -> Right Section */}
                    <div id="right" className="flex flex-col h-full py-8 px-12">
                        {/* Product infromation  */}
                        <div className="grid grid-cols-2 border-2 rounded-lg p-4">
                            <div className="flex flex-col w-fit h-fit">
                                <h3 className="font-bold text-lg">Product Information</h3>
                                <h3 className="font-bold text-lg">{product?.name}</h3>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-gray-900">{product?.salePrice || product?.price} {product?.currency}</span>
                                        {product?.onSale && (
                                            <>
                                                <span className="text-sm text-gray-500 line-through">{product?.price} {product?.currency}</span>
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-[10px] font-medium">{product?.discount}% OFF</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex">
                                        <p className="text-xs text-gray-600">MOQ: {product?.moq} {product?.moqUnit}</p>
                                        <span className="text-xs text-gray-500 ml-auto">Stock: {product?.stock} {product?.stockUnit}</span>
                                    </div>
                                </div>
                                <div className=" px-2 py-2 mt-6 mb-6 flex flex-row border-2 rounded-lg">
                                    <div className="w-full !border-0 !rounded-r-none text-xs"> {quantity} </div>
                                    <span className="my-auto mx-2 text-xs">{product?.moqUnit}</span>
                                </div>
                            </div>
                            <div className="h-fit w-fit ml-auto">
                                <img alt={product?.name} className=" rounded-xl  ml-auto h-[200px]" src={product?.images?.[0] || product?.productImage}></img>
                            </div>
                        </div>

                        {/* Coming soon  */}
                        <div className="text-gray-200 text-xl font-bold h-full w-full border rounded-lg flex flex-col justify-center items-center my-4">
                            coming Soon
                            <Timer className="mt-3" height={100} width={100} />
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="mt-8 mb-2 flex justify-between mx-8">
                    <button
                        // onClick={() => navigate(`/buyer/product-page?id=${product?.id}`)}
                        onClick={() => {navigate(`/buyer/product-page?id=${product?.id}`)}}
                        type="button"
                        className=" bg-gradient-to-r from-[#e7e7e7] to-[#ffffff] border-2 text-black px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-[#e1e2e4] hover:to-[#f8fafc] hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Back to Product Page
                    </button>
                    <button
                        onClick={handleSkip}
                        type="button"
                        className=" bg-gradient-to-r ml-auto from-[#e7e7e7] to-[#ffffff] border-2 text-black px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-[#e1e2e4] hover:to-[#f8fafc] hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Skip Counter Offer
                    </button>
                    <button
                        onClick={handleNext}
                        type="button"
                        className=" ml-8 bg-gradient-to-r from-[#5e5959] to-[black] text-white px-12 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out hover:from-gray-600 hover:to-gray-700 hover:shadow-lg hover:scale-105 active:scale-100 "
                    >
                        Counter Offer
                    </button>
                </div>
            </div>

            {/* Popups */}
            {showIncoterms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-xl w-[98vw] h-[96vh] mx-auto  p-6 relative animate-fade-in flex flex-col">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                            onClick={() => setShowIncoterms(false)}
                            aria-label="Close"
                        >
                            <X size={22} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-center">Preferred Inco Terms</h2>
                        <div className="flex-1 overflow-y-auto">
                            <div>
                                <div className="flex mx-auto w-fit">
                                    <input className="mr-1" name="Incoterms" id="SellerIncoterms" value={"SellerIncoterms"} type='radio' onChange={(e) => setIncotermType(e.target.value)} checked={incotermType === "SellerIncoterms"} />
                                    <label htmlFor="SellerIncoterms"> SellerIncoterms </label>
                                    <input className="ml-8 mr-1" name="Incoterms" id="EditIncoterms" value={"EditIncoterms"} type='radio' onChange={(e) => setIncotermType(e.target.value)} checked={incotermType === "EditIncoterms"} />
                                    <label htmlFor="EditIncoterms"> EditIncoterms </label>
                                </div>
                                {incotermType === "SellerIncoterms" ? (
                                    // Render content for SellerIncoterms
                                    <Incoterms incoterms={sellerIncotermsState} setIncoterms={() => { }} />
                                ) : <Incoterms incoterms={negoatiatedIncotermsState} setIncoterms={onNegotiatedIncotermsChange} />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showNegotiatedIncoterms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-xl w-[98vw] h-[96vh] mx-auto  p-6 relative animate-fade-in flex flex-col">
                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
                            onClick={() => setShowNegotiatedIncoterms(false)}
                            aria-label="Close"
                        >
                            <X size={22} />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-center">Preferred Inco Terms</h2>
                        <div className="flex-1 overflow-y-auto">
                            <div>
                                <div className="flex mx-auto w-fit">
                                    <input className="mr-1" name="Incoterms" id="SellerIncoterms" value={"SellerIncoterms"} type='radio' onChange={(e) => setIncotermType(e.target.value)} checked={incotermType === "SellerIncoterms"} />
                                    <label htmlFor="SellerIncoterms"> SellerIncoterms </label>
                                    <input className="ml-8 mr-1" name="Incoterms" id="EditIncoterms" value={"EditIncoterms"} type='radio' onChange={(e) => setIncotermType(e.target.value)} checked={incotermType === "EditIncoterms"} />
                                    <label htmlFor="EditIncoterms"> View Your Incoterms </label>
                                </div>
                                {incotermType === "SellerIncoterms" ? (
                                    <Incoterms incoterms={sellerIncotermsState} setIncoterms={() => { }} />
                                ) : <Incoterms incoterms={negoatiatedIncotermsState} setIncoterms={() => { }} />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
