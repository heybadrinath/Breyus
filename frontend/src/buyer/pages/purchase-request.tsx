import React, { useState, useEffect } from "react";
import CheckoutStepper from "../components/cart/CheckoutStepper";
import cartService from "../../services/cart.service";

type StepProps = {
    className?: string;
    onNext: () => void;
    onPrev?: () => void;
};

const steps = [
    { label: "Trade Queries-1" },
    { label: "Trade Queries-2" },
    { label: "Pricing" },
    { label: "Payment" },
];

const ProgressBar: React.FC<{ step: number; className?: string }> = ({
    step,
    className = "",
}) => {
    return (
        <div className={`w-full mb-8 ${className}`}>
            <div className="flex items-center justify-between w-full px-6 pt-5 pb-4 bg-black rounded-xl">
                {steps.map((s, i) => (
                    <React.Fragment key={i}>
                        <div className="flex flex-col items-center flex-1">
                            <div
                                className={`rounded-full flex items-center justify-center transition-all duration-300
                                    ${step >= i ? "bg-white border-2 border-white" : "bg-gray-400 border-2 border-gray-400"}
                                    ${step === i ? "shadow-lg scale-110" : "scale-100"}
                                `}
                                style={{
                                    width: 12,
                                    height: 12,
                                }}
                            />
                            <span
                                className={`mt-2 text-xs font-light transition-all duration-300 ${step === i
                                    ? "text-white font-semibold"
                                    : step > i
                                        ? "text-gray-300"
                                        : "text-gray-400"
                                    }`}
                                style={{
                                    fontWeight: step === i ? 600 : 400,
                                    letterSpacing: 0.5,
                                    minHeight: 18,
                                    textAlign: "center",
                                    marginTop: 8,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="flex-1 h-0.5 mb-6  bg-gray-500 relative">
                                <div
                                    className="h-0.5 bg-white absolute  top-0 left-0 transition-all duration-500"
                                    style={{
                                        width: step > i ? "100%" : "0%",
                                    }}
                                />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

// Step 1
const TradeQueries1: React.FC<StepProps> = ({ className, onNext }) => (
    <div className={className}>
        <h2 className="text-2xl font-semibold mb-2">Trade Queries</h2>
        <div className="mb-6">
            <label className="block text-base font-medium mb-1">
                What's your company revenue range :<span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2 mb-2">
                <input className="border rounded px-2 py-1 w-20" type="number" placeholder="" />
                <span className="text-gray-500">to</span>
                <input className="border rounded px-2 py-1 w-20" type="number" placeholder="" />
                <select className="border rounded px-2 py-1 w-20">
                    <option>USD</option>
                    <option>INR</option>
                </select>
                <select className="border rounded px-2 py-1 w-20">
                    <option>Crore</option>
                    <option>Million</option>
                </select>
                <span className="text-gray-500">=</span>
                <select className="border rounded px-2 py-1 w-20">
                    <option>Total</option>
                </select>
            </div>
        </div>
        <div className="mb-6">
            <label className="block text-base font-medium mb-1">
                How many potential years will this Noval trade be ?<span className="text-red-500">*</span>
            </label>
            <input className="border-b w-full outline-none py-2" type="number" placeholder="" />
        </div>
        <div className="mb-8">
            <label className="block text-base font-medium mb-1">
                How are you using this product ?
            </label>
            <input className="border-b w-full outline-none py-2" type="text" placeholder="" />
        </div>
        <div className="flex jusify-end">
            <button
                className="bg-gradient-to-b from-black to-gray-700 text-white px-8 py-2 rounded shadow ml-auto"
                onClick={onNext}
            >
                Next
            </button>
        </div>
    </div>
);

// Step 2
const TradeQueries2: React.FC<StepProps> = ({ className, onNext, onPrev }) => (
    <div className={className}>
        <h2 className="text-2xl font-semibold mb-2">Trade Queries</h2>
        <div className="mb-6">
            <label className="block text-base font-medium mb-1">
                Which industry uses your product?
            </label>
            <input className="border-b w-full outline-none py-2" type="text" />
        </div>
        <div className="mb-6">
            <label className="block text-base font-medium mb-1">
                How long have you been in the market?
            </label>
            <input className="border-b w-full outline-none py-2" type="number" placeholder="Years" />
        </div>
        <div className="mb-8">
            <label className="block text-base font-medium mb-1">
                Market Capture:
            </label>
            <input className="border-b w-full outline-none py-2" type="number" placeholder="%" />
        </div>
        <div className="flex w-full gap-2">
            <button
                className="bg-gray-200 text-black px-8 py-2 rounded shadow mr-auto"
                onClick={onPrev}
            >
                Prev
            </button>
            <button
                className="bg-gradient-to-b from-black to-gray-700 text-white px-8 py-2 rounded shadow"
                onClick={onNext}
            >
                Next
            </button>
        </div>
    </div>
);

// Step 3

const Pricing: React.FC<StepProps> = ({ className, onNext, onPrev }) => {
    return (
        <div className={className}>
            <h2 className="text-2xl font-semibold mb-6">Pricing</h2>
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-10">
                {/* Price */}
                <div>
                    <label className="block text-sm font-medium mb-1">Price</label>
                    <input className="border-b w-full outline-none py-2" type="number" placeholder="" />
                    <div className="flex items-center mt-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
                            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-4"></div>
                        </label>
                        <span className="ml-3 text-sm font-medium">On Sale</span>
                    </div>
                </div>
                {/* Currency */}
                <div>
                    <label className="block text-sm font-medium mb-1">USD</label>
                    <select className="border-b w-full outline-none py-2">
                        <option>USD</option>
                        <option>INR</option>
                        <option>EUR</option>
                    </select>
                </div>
                {/* SKU */}
                <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <input className="border-b w-full outline-none py-2" type="text" placeholder="" />
                </div>
                {/* Discount */}
                <div>
                    <label className="block text-sm font-medium mb-1">Discount</label>
                    <input className="border-b w-full outline-none py-2" type="number" placeholder="" />
                </div>
                {/* Sale Price */}
                <div>
                    <label className="block text-sm font-medium mb-1">Sale Price</label>
                    <input className="border-b w-full outline-none py-2" type="number" placeholder="" />
                </div>
                {/* Empty for grid alignment */}
                <div></div>
                {/* Cost of goods */}
                <div>
                    <label className="block text-sm font-medium mb-1">Cost of goods</label>
                    <input className="border-b w-full outline-none py-2" type="number" placeholder="" />
                </div>
                {/* Profit and Margin */}
                <div className="col-span-2 flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Profit</label>
                        <input className="border-b w-full outline-none py-2" type="number" placeholder="" />
                    </div>
                    <span className="text-2xl font-light">=</span>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Margin</label>
                        <div className="flex items-center">
                            <input className="border-b w-full outline-none py-2" type="number" placeholder="" />
                            <span className="ml-2 text-gray-500">%</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-between mt-8">
                <button
                    className="bg-gray-200 text-black px-8 py-2 rounded shadow"
                    onClick={onPrev}
                >
                    Prev
                </button>
                <button
                    className="bg-gradient-to-b from-black to-gray-700 text-white px-8 py-2 rounded shadow"
                    onClick={onNext}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

// Step 4
const Payment: React.FC<StepProps> = ({ className, onPrev }) => {
    const [selected, setSelected] = useState<null | "advance" | "credit" | "open">(null);
    const [checkoutData, setCheckoutData] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Load checkout data from localStorage
        const savedCheckoutData = localStorage.getItem('checkout_data');
        if (savedCheckoutData) {
            setCheckoutData(JSON.parse(savedCheckoutData));
        }
    }, []);

    const handleSendPurchaseRequest = async () => {
        if (selected === null) return;
        
        setIsProcessing(true);
        
        try {
            if (!checkoutData || !checkoutData.selectedItems) {
                alert('No items selected for purchase request');
                return;
            }

            // Convert selected cart items to trade requests
            const selectedItemIds = checkoutData.selectedItems.map((item: any) => item.id);
            const paymentTerms = getPaymentTermsMessage(selected);
            
            const result = await cartService.convertCartToTradeRequests(
                selectedItemIds,
                `I would like to purchase these items. Please review and confirm availability and pricing.\n\nPayment Terms: ${paymentTerms}`
            );

            // Show results to user
            if (result.successful.length > 0) {
                let message = `Success! ${result.successful.length} trade request(s) sent to sellers:\n\n`;
                result.successful.forEach((trade, index) => {
                    message += `${index + 1}. ${trade.message}\n`;
                });
                
                if (result.failed.length > 0) {
                    message += `\n${result.failed.length} request(s) failed:\n`;
                    result.failed.forEach((trade, index) => {
                        message += `${index + 1}. ${trade.message}\n`;
                    });
                }
                
                // Clear checkout data
                localStorage.removeItem('checkout_data');
                
                // Redirect to success page
                window.history.pushState({}, '', '/buyer/purchase-request-success');
                const navEvent = new PopStateEvent('popstate');
                window.dispatchEvent(navEvent);
            } else {
                alert(`Failed to send trade requests:\n${result.failed.map(f => f.message).join('\n')}`);
            }
        } catch (error) {
            console.error('Error sending purchase requests:', error);
            alert('Failed to send purchase requests. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getPaymentTermsMessage = (paymentType: string): string => {
        switch (paymentType) {
            case 'advance':
                return 'Advance payment via RTGS';
            case 'credit':
                return 'Credits Period via Letter of Credit';
            case 'open':
                return 'Open Account via RTGS';
            default:
                return 'Standard payment terms';
        }
    };

    return (
        <div className={className}>
            <h2 className="text-3xl font-bold mb-6">Choose Mode of Payment</h2>
            
            {/* Show order summary */}
            {checkoutData && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
                    <div className="text-sm text-gray-600">
                        <p>{checkoutData.selectedItems?.length} items selected</p>
                        <p className="font-semibold">Total: ₹{checkoutData.summary?.totalAmount?.toLocaleString()}</p>
                    </div>
                </div>
            )}
            
            <div className="flex flex-col gap-10 mb-10">
                {/* Advance payment */}
                <label className="flex items-start gap-4 cursor-pointer">
                    <input
                        type="radio"
                        name="payment"
                        className="mt-1 accent-black"
                        checked={selected === "advance"}
                        onChange={() => setSelected("advance")}
                    />
                    <div className="flex flex-col flex-1">
                        <span className="text-xl font-medium">Advance payment via (RTGS)</span>
                        <div className="mt-2">
                            <label className="block text-xs font-semibold mb-1">
                                How much percent of Total amount in advance
                            </label>
                            <div className="relative w-64">
                                <input
                                    className="border rounded px-3 py-2 w-full pr-8 text-base"
                                    type="number"
                                    placeholder="45"
                                    min={0}
                                    max={100}
                                    disabled={selected !== "advance"}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-base">%</span>
                            </div>
                        </div>
                    </div>
                </label>
                {/* Credits Period */}
                <label className="flex items-start gap-4 cursor-pointer">
                    <input
                        type="radio"
                        name="payment"
                        className="mt-1 accent-black"
                        checked={selected === "credit"}
                        onChange={() => setSelected("credit")}
                    />
                    <div className="flex flex-col flex-1">
                        <span className="text-xl font-medium">Credits Period via (Letter of Credit)</span>
                        <div className="mt-2">
                            <label className="block text-xs font-semibold mb-1">
                                Timeline for LOC
                            </label>
                            <div className="relative w-64">
                                <input
                                    className="border rounded px-3 py-2 w-full pr-12 text-base"
                                    type="number"
                                    placeholder="Days"
                                    min={0}
                                    disabled={selected !== "credit"}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-base">Days</span>
                            </div>
                        </div>
                    </div>
                </label>
                {/* Open Account */}
                <label className="flex items-start gap-4 cursor-pointer">
                    <input
                        type="radio"
                        name="payment"
                        className="mt-1 accent-black"
                        checked={selected === "open"}
                        onChange={() => setSelected("open")}
                    />
                    <div className="flex flex-col flex-1">
                        <span className="text-xl font-medium">Open Account via (RTGS)</span>
                        <div className="mt-2">
                            <label className="block text-xs font-semibold mb-1">
                                Timeline for payment
                            </label>
                            <div className="relative w-64">
                                <input
                                    className="border rounded px-3 py-2 w-full pr-12 text-base"
                                    type="number"
                                    placeholder="45"
                                    min={0}
                                    disabled={selected !== "open"}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-base">Days</span>
                            </div>
                        </div>
                    </div>
                </label>
            </div>
            <div className="flex justify-between mt-12">
                <button
                    className="bg-gray-200 text-black px-8 py-2 rounded shadow mr-auto"
                    onClick={onPrev}
                    disabled={isProcessing}
                >
                    Prev
                </button>
                <button
                    className={`px-6 py-2 rounded shadow font-semibold ${
                        selected !== null && !isProcessing
                            ? 'bg-gradient-to-b from-black to-gray-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={selected === null || isProcessing}
                    onClick={handleSendPurchaseRequest}
                >
                    {isProcessing ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
                            Sending Request...
                        </div>
                    ) : (
                        'Send Purchase Request'
                    )}
                </button>
            </div>
        </div>
    );
};
const PurchaseRequest: React.FC = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Check if this is a resend operation
        const urlParams = new URLSearchParams(window.location.search);
        const isResend = urlParams.get('resend') === 'true';
        const productId = urlParams.get('productId');
        
        if (isResend && productId) {
            // Get resend data from sessionStorage
            const resendData = sessionStorage.getItem('resendTradeData');
            if (resendData) {
                try {
                    const tradeData = JSON.parse(resendData);
                    console.log('Resending trade with data:', tradeData);
                    
                    // You can pre-fill form fields here based on tradeData
                    // For now, we'll just show a notification
                    alert(`Resending offer for ${tradeData.product?.name || 'product'}. Previous offer: ₹${tradeData.offeredPrice?.toLocaleString()}`);
                    
                    // Clear the resend data after use
                    sessionStorage.removeItem('resendTradeData');
                } catch (error) {
                    console.error('Error parsing resend data:', error);
                }
            }
        }
    }, []);

    const stepComponents = [
        TradeQueries1,
        TradeQueries2,
        Pricing,
        Payment,
    ];

    const StepComponent = stepComponents[step];

    return (
        <div>
            <CheckoutStepper currentStep={2}/>

            <div className="w-full flex flex-col items-center min-h-screen bg-gray-50 py-12">
                <div className="w-full max-w-4xl">
                    <ProgressBar className="" step={step} />
                </div>
                <div className="relative">
                    <div className="w-fit rounded-xl shadow-xl p-10 mt-[-60px] w-max-[900px] z-10 relative">
                        <StepComponent
                            className="w-[900px] z-[100]"
                            onNext={() => setStep((s: number) => Math.min(s + 1, stepComponents.length - 1))}
                            onPrev={step > 0 ? () => setStep((s: number) => Math.max(s - 1, 0)) : undefined}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseRequest;