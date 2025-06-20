import React, { useState, useEffect } from "react";
import CheckoutStepper from "../components/cart/CheckoutStepper";
import cartService from "../../services/cart.service";
import PurchaseRequestProgress from "../components/cart/PurchaseRequestProgress";
import purchaseRequestValidationService from "../../services/purchaseRequestValidation.service";

type StepProps = {
    className?: string;
    onNext: () => void;
    onPrev?: () => void;
    formData: any;
    setFormData: (data: any) => void;
    errors: string[];
    onErrorUpdate?: (errors: string[]) => void;
};

// Form data interfaces
interface Step1Data {
    companyRevenueRange: string;
    currency: string;
    revenueUnit: string;
    tradeDurationYears: string;
    productUsage: string;
}

interface Step2Data {
    industry: string;
    marketExperienceYears: string;
    marketCapturePercentage: string;
}

interface Step3Data {
    price: string;
    onSale: boolean;
    priceCurrency: string;
    sku: string;
    discount: string;
    salePrice: string;
    costOfGoods: string;
    profit: string;
    margin: string;
}

interface Step4Data {
    paymentMode: string;
    advancePercentage: string;
    creditTimelineDays: string;
    paymentTimelineDays: string;
}

interface FormData {
    step1: Step1Data;
    step2: Step2Data;
    step3: Step3Data;
    step4: Step4Data;
}

const steps = [
    { label: "Trade Queries-1" },
    { label: "Trade Queries-2" },
    { label: "Inco-Terms" },
    { label: "Mode of payment" },
];



// Step 1
const TradeQueries1: React.FC<StepProps> = ({ className, onNext, formData, setFormData, errors, onErrorUpdate }) => {
    const step1Data = formData.step1;

    const handleChange = (field: keyof Step1Data, value: string) => {
        // Clear errors when user starts typing
        if (onErrorUpdate) {
            onErrorUpdate([]);
        }
        
        setFormData({
            ...formData,
            step1: {
                ...step1Data,
                [field]: value
            }
        });
    };    const validateAndProceed = async () => {
        // Remove validation - just proceed to next step
        onNext();
    };

    const isFormValid = () => {
        return step1Data.companyRevenueRange && 
               step1Data.currency && 
               step1Data.revenueUnit && 
               step1Data.tradeDurationYears && 
               step1Data.productUsage?.trim();
    };

    return (
        <div className={className}>
            <h2 className="text-2xl font-semibold mb-2">Trade Queries</h2>
            <div className="mb-6">
                <label className="block text-base font-medium mb-1">
                    What's your company revenue range :<span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-500">to</span>
                    <input 
                        className="border rounded px-2 py-1 w-20" 
                        type="number" 
                        placeholder="" 
                        value={step1Data.companyRevenueRange}
                        onChange={(e) => handleChange('companyRevenueRange', e.target.value)}
                        required
                    />
                    <select 
                        className="border rounded px-2 py-1 w-20"
                        value={step1Data.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        required
                    >
                        <option value="">Select</option>
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                    </select>
                    <select 
                        className="border rounded px-2 py-1 w-20"
                        value={step1Data.revenueUnit}
                        onChange={(e) => handleChange('revenueUnit', e.target.value)}
                        required
                    >
                        <option value="">Select</option>
                        <option value="Crore">Crore</option>
                        <option value="Million">Million</option>
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
                <input 
                    className="border-b w-full outline-none py-2" 
                    type="number" 
                    placeholder="" 
                    value={step1Data.tradeDurationYears}
                    onChange={(e) => handleChange('tradeDurationYears', e.target.value)}
                    required
                />
            </div>
            <div className="mb-8">
                <label className="block text-base font-medium mb-1">
                    How are you using this product ?<span className="text-red-500">*</span>
                </label>
                <input 
                    className="border-b w-full outline-none py-2" 
                    type="text" 
                    placeholder="" 
                    value={step1Data.productUsage}
                    onChange={(e) => handleChange('productUsage', e.target.value)}
                    required
                />
            </div>
            {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    {errors.map((error, index) => (
                        <p key={index} className="text-red-600 text-sm">{error}</p>
                    ))}
                </div>
            )}
            <div className="flex jusify-end">
                <button
                    className={`px-8 py-2 rounded shadow ml-auto ${
                        isFormValid() 
                            ? 'bg-gradient-to-b from-black to-gray-700 text-white cursor-pointer' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={validateAndProceed}
                    disabled={!isFormValid()}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

// Step 2
const TradeQueries2: React.FC<StepProps> = ({ className, onNext, onPrev, formData, setFormData, errors, onErrorUpdate }) => {
    const step2Data = formData.step2;

    const handleChange = (field: keyof Step2Data, value: string) => {
        // Clear errors when user starts typing
        if (onErrorUpdate) {
            onErrorUpdate([]);
        }
        
        setFormData({
            ...formData,
            step2: {
                ...step2Data,
                [field]: value
            }
        });
    };

    const validateAndProceed = async () => {
        // Remove validation - just proceed to next step
        onNext();
    };

    const isFormValid = () => {
        return step2Data.industry?.trim() && 
               step2Data.marketExperienceYears && 
               step2Data.marketCapturePercentage;
    };

    return (
        <div className={className}>
            <h2 className="text-2xl font-semibold mb-2">Trade Queries</h2>
            <div className="mb-6">
                <label className="block text-base font-medium mb-1">
                    Which industry uses your product?<span className="text-red-500">*</span>
                </label>
                <input 
                    className="border-b w-full outline-none py-2" 
                    type="text" 
                    value={step2Data.industry}
                    onChange={(e) => handleChange('industry', e.target.value)}
                    required
                />
            </div>
            <div className="mb-6">
                <label className="block text-base font-medium mb-1">
                    How long have you been in the market?<span className="text-red-500">*</span>
                </label>
                <input 
                    className="border-b w-full outline-none py-2" 
                    type="number" 
                    placeholder="Years" 
                    value={step2Data.marketExperienceYears}
                    onChange={(e) => handleChange('marketExperienceYears', e.target.value)}
                    required
                />
            </div>
            <div className="mb-8">
                <label className="block text-base font-medium mb-1">
                    Market Capture:<span className="text-red-500">*</span>
                </label>
                <input 
                    className="border-b w-full outline-none py-2" 
                    type="number" 
                    placeholder="%" 
                    value={step2Data.marketCapturePercentage}
                    onChange={(e) => handleChange('marketCapturePercentage', e.target.value)}
                    max="100"
                    min="0"
                    required
                />
            </div>
            {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    {errors.map((error, index) => (
                        <p key={index} className="text-red-600 text-sm">{error}</p>
                    ))}
                </div>
            )}
            <div className="flex w-full gap-2">
                <button
                    className="bg-gray-200 text-black px-8 py-2 rounded shadow mr-auto"
                    onClick={onPrev}
                >
                    Prev
                </button>
                <button
                    className="px-8 py-2 rounded shadow bg-gradient-to-b from-black to-gray-700 text-white cursor-pointer"
                    onClick={validateAndProceed}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

// Step 3
const Pricing: React.FC<StepProps> = ({ className, onNext, onPrev, formData, setFormData, errors, onErrorUpdate }) => {
    const step3Data = formData.step3;

    const handleChange = (field: keyof Step3Data, value: string | boolean) => {
        // Clear errors when user starts typing
        if (onErrorUpdate) {
            onErrorUpdate([]);
        }
        
        setFormData({
            ...formData,
            step3: {
                ...step3Data,
                [field]: value
            }
        });
    };

    const validateAndProceed = async () => {
        // Remove validation - just proceed to next step
        onNext();
    };

    const isFormValid = () => {
        return step3Data.price && step3Data.priceCurrency;
    };

    return (
        <div className={className}>
            <h2 className="text-2xl font-semibold mb-6">Pricing</h2>
            <div className="grid grid-cols-3 gap-x-8 gap-y-6 mb-10">
                {/* Price */}
                <div>
                    <label className="block text-sm font-medium mb-1">Price<span className="text-red-500">*</span></label>
                    <input 
                        className="border-b w-full outline-none py-2" 
                        type="number" 
                        placeholder="" 
                        value={step3Data.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        required
                    />
                    <div className="flex items-center mt-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={step3Data.onSale}
                                onChange={(e) => handleChange('onSale', e.target.checked)}
                            />
                            <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
                            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-4"></div>
                        </label>
                        <span className="ml-3 text-sm font-medium">On Sale</span>
                    </div>
                </div>
                {/* Currency */}
                <div>
                    <label className="block text-sm font-medium mb-1">Currency<span className="text-red-500">*</span></label>
                    <select 
                        className="border-b w-full outline-none py-2"
                        value={step3Data.priceCurrency}
                        onChange={(e) => handleChange('priceCurrency', e.target.value)}
                        required
                    >
                        <option value="">Select</option>
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                        <option value="EUR">EUR</option>
                    </select>
                </div>
                {/* SKU */}
                <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <input 
                        className="border-b w-full outline-none py-2" 
                        type="text" 
                        placeholder="" 
                        value={step3Data.sku}
                        onChange={(e) => handleChange('sku', e.target.value)}
                    />
                </div>
                {/* Discount */}
                <div>
                    <label className="block text-sm font-medium mb-1">Discount</label>
                    <input 
                        className="border-b w-full outline-none py-2" 
                        type="number" 
                        placeholder="" 
                        value={step3Data.discount}
                        onChange={(e) => handleChange('discount', e.target.value)}
                        max="100"
                        min="0"
                    />
                </div>
                {/* Sale Price */}
                <div>
                    <label className="block text-sm font-medium mb-1">Sale Price</label>
                    <input 
                        className="border-b w-full outline-none py-2" 
                        type="number" 
                        placeholder="" 
                        value={step3Data.salePrice}
                        onChange={(e) => handleChange('salePrice', e.target.value)}
                        min="0"
                    />
                </div>
                {/* Empty for grid alignment */}
                <div></div>
                {/* Cost of goods */}
                <div>
                    <label className="block text-sm font-medium mb-1">Cost of goods</label>
                    <input 
                        className="border-b w-full outline-none py-2" 
                        type="number" 
                        placeholder="" 
                        value={step3Data.costOfGoods}
                        onChange={(e) => handleChange('costOfGoods', e.target.value)}
                        min="0"
                    />
                </div>
                {/* Profit and Margin */}
                <div className="col-span-2 flex items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Profit</label>
                        <input 
                            className="border-b w-full outline-none py-2" 
                            type="number" 
                            placeholder="" 
                            value={step3Data.profit}
                            onChange={(e) => handleChange('profit', e.target.value)}
                        />
                    </div>
                    <span className="text-2xl font-light">=</span>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Margin</label>
                        <div className="flex items-center">
                            <input 
                                className="border-b w-full outline-none py-2" 
                                type="number" 
                                placeholder="" 
                                value={step3Data.margin}
                                onChange={(e) => handleChange('margin', e.target.value)}
                                max="100"
                                min="0"
                            />
                            <span className="ml-2 text-gray-500">%</span>
                        </div>
                    </div>
                </div>
            </div>
            {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    {errors.map((error, index) => (
                        <p key={index} className="text-red-600 text-sm">{error}</p>
                    ))}
                </div>
            )}
            <div className="flex justify-between mt-8">
                <button
                    className="bg-gray-200 text-black px-8 py-2 rounded shadow"
                    onClick={onPrev}
                >
                    Prev
                </button>
                <button
                    className={`px-8 py-2 rounded shadow ${
                        isFormValid() 
                            ? 'bg-gradient-to-b from-black to-gray-700 text-white cursor-pointer' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={validateAndProceed}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

// Step 4
const Payment: React.FC<StepProps> = ({ className, onPrev, formData, setFormData, errors }) => {
    const step4Data = formData.step4;
    const [checkoutData, setCheckoutData] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Load checkout data from localStorage
        const savedCheckoutData = localStorage.getItem('checkout_data');
        if (savedCheckoutData) {
            setCheckoutData(JSON.parse(savedCheckoutData));
        }
    }, []);

    const handleChange = (field: keyof Step4Data, value: string) => {
        setFormData({
            ...formData,
            step4: {
                ...step4Data,
                [field]: value
            }
        });
    };    const handleSendPurchaseRequest = async () => {
        // Remove validation - just proceed with the request
        setIsProcessing(true);
        
        try {
            if (!checkoutData || !checkoutData.selectedItems) {
                alert('No items selected for purchase request');
                return;
            }

            // Convert selected cart items to trade requests
            const selectedItemIds = checkoutData.selectedItems.map((item: any) => item.id);
            const paymentTerms = getPaymentTermsMessage(step4Data.paymentMode);
            
            // Include all form data in the purchase request
            const purchaseRequestFormData = {
                step1: formData.step1,
                step2: formData.step2,
                step3: formData.step3,
                step4: formData.step4
            };
            
            const result = await cartService.convertCartToTradeRequests(
                selectedItemIds,
                `I would like to purchase these items. Please review and confirm availability and pricing.\n\nPayment Terms: ${paymentTerms}`,
                purchaseRequestFormData
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

    const isFormValid = () => {
        if (!step4Data.paymentMode) return false;
        
        if (step4Data.paymentMode === 'advance' && !step4Data.advancePercentage) return false;
        if (step4Data.paymentMode === 'credit' && !step4Data.creditTimelineDays) return false;
        if (step4Data.paymentMode === 'open' && !step4Data.paymentTimelineDays) return false;
        
        return true;
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
                        checked={step4Data.paymentMode === "advance"}
                        onChange={() => handleChange('paymentMode', 'advance')}
                    />
                    <div className="flex flex-col flex-1">
                        <span className="text-xl font-medium">Advance payment via (RTGS)</span>
                        <div className="mt-2">
                            <label className="block text-xs font-semibold mb-1">
                                How much percent of Total amount in advance<span className="text-red-500">*</span>
                            </label>
                            <div className="relative w-64">
                                <input
                                    className="border rounded px-3 py-2 w-full pr-8 text-base"
                                    type="number"
                                    placeholder="45"
                                    min={0}
                                    max={100}
                                    value={step4Data.advancePercentage}
                                    onChange={(e) => handleChange('advancePercentage', e.target.value)}
                                    disabled={step4Data.paymentMode !== "advance"}
                                    required={step4Data.paymentMode === "advance"}
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
                        checked={step4Data.paymentMode === "credit"}
                        onChange={() => handleChange('paymentMode', 'credit')}
                    />
                    <div className="flex flex-col flex-1">
                        <span className="text-xl font-medium">Credits Period via (Letter of Credit)</span>
                        <div className="mt-2">
                            <label className="block text-xs font-semibold mb-1">
                                Timeline for LOC<span className="text-red-500">*</span>
                            </label>
                            <div className="relative w-64">
                                <input
                                    className="border rounded px-3 py-2 w-full pr-12 text-base"
                                    type="number"
                                    placeholder="Days"
                                    min={0}
                                    value={step4Data.creditTimelineDays}
                                    onChange={(e) => handleChange('creditTimelineDays', e.target.value)}
                                    disabled={step4Data.paymentMode !== "credit"}
                                    required={step4Data.paymentMode === "credit"}
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
                        checked={step4Data.paymentMode === "open"}
                        onChange={() => handleChange('paymentMode', 'open')}
                    />
                    <div className="flex flex-col flex-1">
                        <span className="text-xl font-medium">Open Account via (RTGS)</span>
                        <div className="mt-2">
                            <label className="block text-xs font-semibold mb-1">
                                Timeline for payment<span className="text-red-500">*</span>
                            </label>
                            <div className="relative w-64">
                                <input
                                    className="border rounded px-3 py-2 w-full pr-12 text-base"
                                    type="number"
                                    placeholder="45"
                                    min={0}
                                    value={step4Data.paymentTimelineDays}
                                    onChange={(e) => handleChange('paymentTimelineDays', e.target.value)}
                                    disabled={step4Data.paymentMode !== "open"}
                                    required={step4Data.paymentMode === "open"}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-base">Days</span>
                            </div>
                        </div>
                    </div>
                </label>
            </div>
            {errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    {errors.map((error, index) => (
                        <p key={index} className="text-red-600 text-sm">{error}</p>
                    ))}
                </div>
            )}
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
                        !isProcessing
                            ? 'bg-gradient-to-b from-black to-gray-700 text-white cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={isProcessing}
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
    const [errors, setErrors] = useState<string[]>([]);
    const [formData, setFormData] = useState<FormData>({
        step1: {
            companyRevenueRange: '',
            currency: '',
            revenueUnit: '',
            tradeDurationYears: '',
            productUsage: ''
        },
        step2: {
            industry: '',
            marketExperienceYears: '',
            marketCapturePercentage: ''
        },
        step3: {
            price: '',
            onSale: false,
            priceCurrency: '',
            sku: '',
            discount: '',
            salePrice: '',
            costOfGoods: '',
            profit: '',
            margin: ''
        },
        step4: {
            paymentMode: '',
            advancePercentage: '',
            creditTimelineDays: '',
            paymentTimelineDays: ''
        }
    });

    // Function to handle step navigation with error clearing
    const handleNextStep = () => {
        setErrors([]); // Clear errors when moving to next step
        setStep((s: number) => Math.min(s + 1, stepComponents.length - 1));
    };

    const handlePrevStep = () => {
        setErrors([]); // Clear errors when going back
        setStep((s: number) => Math.max(s - 1, 0));
    };

    const handleErrorUpdate = (newErrors: string[]) => {
        setErrors(newErrors);
    };

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
                    {/* <ProgressBar className="" step={step} /> */}
                    <PurchaseRequestProgress className="mx-auto my-6" step1="Trade Queries - 1" step2="Trade Queries - 2" step3="Incoterms" step4="Mode of Payment" currentStep={step}/>
                   
                </div>                <div className="relative">
                    <div className="w-fit rounded-xl shadow-xl p-10 mt-[-60px] w-max-[900px] z-10 relative">                        <StepComponent
                            className="w-[900px] z-[100]"
                            onNext={handleNextStep}
                            onPrev={step > 0 ? handlePrevStep : undefined}
                            formData={formData}
                            setFormData={setFormData}
                            errors={errors}
                            onErrorUpdate={handleErrorUpdate}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseRequest;