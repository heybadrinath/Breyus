import React, { useState, useEffect } from "react";
import { PurchaseRequestProgress } from "../components/purchaseRequestProgress";
import { Negoatation } from "../components/Negotation";
import { Address } from "../components/Address";
import { TradeQueries } from "../components/TradeQueries";
import { Payment } from "../components/Payment";
import { getProductById, Product } from "../../services/products.service";
import { createTradeRequest, CreateTradeRequest, Address as AddressType, PaymentMethod, Incoterms } from "../../services/trade.service";
import { useNavigate } from "react-router-dom";
import { IncotermsState, defaultIncotermValues } from "../../types/Incoterms";
import { getDeliveryAddresses, addDeliveryAddress, DeliveryAddress } from "../../services/company.service";

// Define step data types
interface Step1Data {
    buyerOfferedPrice?: string;
    buyerIncoterms?: Incoterms;
    buyerMessage?: string;
}

interface Step2Data {
    addresses?: AddressType[];
    selectedAddress?: AddressType;
    selectedAddressIndex?: number;
}

interface Step3Data {
    buyerIndustryType?: string;
    buyerMarketYears?: string;
    marketCapture?: string;
    tradeYears?: string;
    productUsage?: string;
}

interface Step4Data {
    paymentMethod?: PaymentMethod;
}

interface StepData {
    step1: Step1Data;
    step2: Step2Data;
    step3: Step3Data;
    step4: Step4Data;
}

export const PurchaseRequest = () => {
    const navigate = useNavigate();

    // States 
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Product and quantity state
    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('');

    // Lifted incoterms state
    const [sellerIncotermsState, setSellerIncotermsState] = useState<IncotermsState>({
        selectedIncoterm: "",
        selectedIncotermData: {},
        defaults: defaultIncotermValues
    });
    const [negoatiatedIncotermsState, setNegoatiatedIncotermsState] = useState<IncotermsState>({
        selectedIncoterm: "",
        selectedIncotermData: {},
        defaults: defaultIncotermValues
    });

    // Lifted state for Address component - now using company service
    const [addresses, setAddresses] = useState<AddressType[]>([]);
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
    const [showAddAddressPopup, setShowAddAddressPopup] = useState(false);
    const [newAddress, setNewAddress] = useState<AddressType>({
        fullName: '',
        mobileNumber: '',
        pincode: '',
        streetName: '',
        landmark: '',
        city: '',
        state: '',
        country: 'India',
        additionalDetails: ''
    });
    const [addressesLoading, setAddressesLoading] = useState(false);

    // Lifted state for TradeQueries component
    const [industryType, setIndustryType] = useState('');
    const [marketYears, setMarketYears] = useState('');
    const [marketCapture, setMarketCapture] = useState('');
    const [tradeYears, setTradeYears] = useState('');
    const [productUsage, setProductUsage] = useState('');

    // Lifted state for Payment component
    const [selectedPaymentType, setSelectedPaymentType] = useState<'advance' | 'credit' | 'openAccount' | ''>('');
    const [paymentDetails, setPaymentDetails] = useState({
        percentage: '',
        days: ''
    });

    // Step data state
    const [stepData, setStepData] = useState<StepData>({
        step1: {},
        step2: {},
        step3: {},
        step4: {}
    });

    const handleStep = (step: number) => {
        setStep(step);
    };

    const handleStepDataChange = (stepNumber: number, data: any) => {
        setStepData(prev => ({
            ...prev,
            [`step${stepNumber}`]: { ...prev[`step${stepNumber}` as keyof StepData], ...data }
        }));
    };

    // Handle incoterms state changes
    const handleSellerIncotermsChange = (state: IncotermsState) => {
        setSellerIncotermsState(state);
    };

    const handleNegotiatedIncotermsChange = (state: IncotermsState | ((prevState: IncotermsState) => IncotermsState)) => {
        if (typeof state === 'function') {
            setNegoatiatedIncotermsState(state);
        } else {
            setNegoatiatedIncotermsState(state);
        }
    };

    // Handle Address component state changes - now using company service
    const handleAddressesChange = (newAddresses: AddressType[]) => {
        setAddresses(newAddresses);
        handleStepDataChange(2, {
            addresses: newAddresses,
            selectedAddress: newAddresses[selectedAddressIndex] || newAddresses[0],
            selectedAddressIndex: selectedAddressIndex
        });
    };

    const handleSelectedAddressIndexChange = (index: number) => {
        setSelectedAddressIndex(index);
        if (addresses[index]) {
            handleStepDataChange(2, {
                addresses: addresses,
                selectedAddress: addresses[index],
                selectedAddressIndex: index
            });
        }
    };

    const handleShowAddAddressPopupChange = (show: boolean) => {
        setShowAddAddressPopup(show);
    };

    const handleNewAddressChange = (address: AddressType) => {
        setNewAddress(address);
    };

    const handleAddNewAddress = async () => {
        if (!newAddress.fullName || !newAddress.mobileNumber || !newAddress.pincode || 
            !newAddress.streetName || !newAddress.city || !newAddress.state) {
            setNotification({ type: 'error', message: 'Please fill in all required fields' });
            return;
        }

        setAddressesLoading(true);
        try {
            // Convert AddressType to DeliveryAddress for the API
            const deliveryAddress: DeliveryAddress = {
                fullName: newAddress.fullName,
                mobileNumber: newAddress.mobileNumber,
                pincode: newAddress.pincode,
                streetName: newAddress.streetName,
                landmark: newAddress.landmark,
                city: newAddress.city,
                state: newAddress.state,
                country: newAddress.country,
                additionalDetails: newAddress.additionalDetails
            };

            const updatedAddresses = await addDeliveryAddress(deliveryAddress);
            
            // Convert back to AddressType for the component
            const convertedAddresses: AddressType[] = updatedAddresses.map(addr => ({
                fullName: addr.fullName,
                mobileNumber: addr.mobileNumber,
                pincode: addr.pincode,
                streetName: addr.streetName,
                landmark: addr.landmark,
                city: addr.city,
                state: addr.state,
                country: addr.country,
                additionalDetails: addr.additionalDetails
            }));

            setAddresses(convertedAddresses);
            
            // Select the newly added address
            const newIndex = convertedAddresses.length - 1;
            setSelectedAddressIndex(newIndex);
            
            // Reset form
            setNewAddress({
                fullName: '',
                mobileNumber: '',
                pincode: '',
                streetName: '',
                landmark: '',
                city: '',
                state: '',
                country: 'India',
                additionalDetails: ''
            });
            
            setShowAddAddressPopup(false);
            
            setNotification({ type: 'success', message: 'Address added successfully!' });
        } catch (error) {
            console.error('Error adding address:', error);
            setNotification({ 
                type: 'error', 
                message: error instanceof Error ? error.message : 'Failed to add address' 
            });
        } finally {
            setAddressesLoading(false);
        }
    };

    // Fetch addresses from company service
    const fetchAddresses = async () => {
        setAddressesLoading(true);
        try {
            const deliveryAddresses = await getDeliveryAddresses();
            
            // Convert DeliveryAddress to AddressType for the component
            const convertedAddresses: AddressType[] = deliveryAddresses.map(addr => ({
                fullName: addr.fullName,
                mobileNumber: addr.mobileNumber,
                pincode: addr.pincode,
                streetName: addr.streetName,
                landmark: addr.landmark,
                city: addr.city,
                state: addr.state,
                country: addr.country,
                additionalDetails: addr.additionalDetails
            }));

            setAddresses(convertedAddresses);
            
            // Update step data
            if (convertedAddresses.length > 0) {
                handleStepDataChange(2, {
                    addresses: convertedAddresses,
                    selectedAddress: convertedAddresses[0],
                    selectedAddressIndex: 0
                });
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
            // If no addresses found, that's okay - user can add new ones
        } finally {
            setAddressesLoading(false);
        }
    };

    // Handle TradeQueries component state changes
    const handleIndustryTypeChange = (value: string) => {
        setIndustryType(value);
        handleStepDataChange(3, {
            buyerIndustryType: value,
            buyerMarketYears: marketYears,
            marketCapture: marketCapture,
            tradeYears: tradeYears,
            productUsage: productUsage
        });
    };

    const handleMarketYearsChange = (value: string) => {
        setMarketYears(value);
        handleStepDataChange(3, {
            buyerIndustryType: industryType,
            buyerMarketYears: value,
            marketCapture: marketCapture,
            tradeYears: tradeYears,
            productUsage: productUsage
        });
    };

    const handleMarketCaptureChange = (value: string) => {
        setMarketCapture(value);
        handleStepDataChange(3, {
            buyerIndustryType: industryType,
            buyerMarketYears: marketYears,
            marketCapture: value,
            tradeYears: tradeYears,
            productUsage: productUsage
        });
    };

    const handleTradeYearsChange = (value: string) => {
        setTradeYears(value);
        handleStepDataChange(3, {
            buyerIndustryType: industryType,
            buyerMarketYears: marketYears,
            marketCapture: marketCapture,
            tradeYears: value,
            productUsage: productUsage
        });
    };

    const handleProductUsageChange = (value: string) => {
        setProductUsage(value);
        handleStepDataChange(3, {
            buyerIndustryType: industryType,
            buyerMarketYears: marketYears,
            marketCapture: marketCapture,
            tradeYears: tradeYears,
            productUsage: value
        });
    };

    // Handle Payment component state changes
    const handlePaymentTypeChange = (type: 'advance' | 'credit' | 'openAccount') => {
        setSelectedPaymentType(type);
        // Reset payment details when changing type
        setPaymentDetails({ percentage: '', days: '' });
        
        const paymentMethod: PaymentMethod = {
            type: type,
            method: type === 'credit' ? 'LetterOfCredit' : 'RTGS',
            percentage: undefined,
            days: undefined
        };

        handleStepDataChange(4, {
            paymentMethod: paymentMethod
        });
    };

    const handlePaymentDetailsChange = (details: { percentage: string; days: string }) => {
        setPaymentDetails(details);
        
        if (selectedPaymentType) {
            const paymentMethod: PaymentMethod = {
                type: selectedPaymentType,
                method: selectedPaymentType === 'credit' ? 'LetterOfCredit' : 'RTGS',
                percentage: selectedPaymentType === 'advance' ? details.percentage : undefined,
                days: selectedPaymentType === 'credit' || selectedPaymentType === 'openAccount' ? details.days : undefined
            };

            handleStepDataChange(4, {
                paymentMethod: paymentMethod
            });
        }
    };

    // Update step1 data when negotiated incoterms change
    useEffect(() => {
        if (negoatiatedIncotermsState.selectedIncoterm) {
            handleStepDataChange(1, {
                buyerIncoterms: negoatiatedIncotermsState
            });
        }
    }, [negoatiatedIncotermsState]);

    // Fetch addresses when component mounts
    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleSubmitPurchaseRequest = async () => {
        if (!product) {
            setNotification({ type: 'error', message: 'Product not found' });
            return;
        }

        // Validate all required data
        if (addresses.length === 0) {
            setNotification({ type: 'error', message: 'Please add at least one address' });
            return;
        }

        if (!addresses[selectedAddressIndex]) {
            setNotification({ type: 'error', message: 'Please select a delivery address' });
            return;
        }

        if (!marketYears || !tradeYears) {
            setNotification({ type: 'error', message: 'Please fill in all required trade query fields' });
            return;
        }

        if (!selectedPaymentType) {
            setNotification({ type: 'error', message: 'Please select a payment method' });
            return;
        }

        if (!stepData.step4.paymentMethod) {
            setNotification({ type: 'error', message: 'Payment method data is incomplete' });
            return;
        }

        if (selectedPaymentType === 'advance' && !paymentDetails.percentage) {
            setNotification({ type: 'error', message: 'Please enter the advance payment percentage' });
            return;
        }

        if ((selectedPaymentType === 'credit' || selectedPaymentType === 'openAccount') && !paymentDetails.days) {
            setNotification({ type: 'error', message: 'Please enter the credit period' });
            return;
        }

        setSubmitting(true);

        try {
            const tradeRequest: CreateTradeRequest = {
                productId: product.id,
                quantity: quantity,
                quantityUnit: product.moqUnit,
                // Step 1 data (optional)
                buyerOfferedPrice: stepData.step1.buyerOfferedPrice,
                buyerIncoterms: stepData.step1.buyerIncoterms,
                buyerMessage: stepData.step1.buyerMessage,
                // Step 2 data
                selectedAddress: addresses[selectedAddressIndex],
                // Step 3 data
                buyerIndustryType: industryType,
                buyerMarketYears: marketYears,
                marketCapture: marketCapture,
                tradeYears: tradeYears,
                productUsage: productUsage,
                // Step 4 data
                paymentMethod: stepData.step4.paymentMethod!
            };

            const response = await createTradeRequest(tradeRequest);

            if (response.statusCode === 201) {
                setNotification({ 
                    type: 'success', 
                    message: 'Purchase request sent successfully!' 
                });
                
                // Redirect to trade requests page after 2 seconds
                setTimeout(() => {
                    navigate('/buyer/trade');
                }, 1200);
            } else {
                setNotification({ 
                    type: 'error', 
                    message: response.message || 'Failed to send purchase request' 
                });
            }
        } catch (error) {
            console.error('Error creating trade request:', error);
            setNotification({ 
                type: 'error', 
                message: error instanceof Error ? error.message : 'Failed to send purchase request' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);

            try {
                // Get product ID from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const productId = urlParams.get('id');
                const quantityParam = urlParams.get('quantity');

                if (!productId) {
                    setError('Product ID not found in URL');
                    return;
                }

                if (!quantityParam) {
                    setError('Quantity not found in URL');
                    return;
                }

                setQuantity(quantityParam);

                const response = await getProductById(productId);

                if (response.statusCode === 200 && response.data) {
                    // Transform backend data to match frontend Product interface
                    const transformedProduct: Product = {
                        id: response.data._id,
                        name: response.data.name,
                        description: response.data.description,
                        detailedDescription: response.data.detailedDescription,
                        category: response.data.category,
                        hsnCode: response.data.hsnCode,
                        price: parseFloat(response.data.price) || 0,
                        currency: response.data.currency,
                        sku: response.data.sku,
                        onSale: response.data.onSale || false,
                        discount: parseFloat(response.data.discount) || 0,
                        salePrice: parseFloat(response.data.salePrice) || 0,
                        costOfGoods: parseFloat(response.data.costOfGoods) || 0,
                        profit: parseFloat(response.data.profit) || 0,
                        margin: parseFloat(response.data.margin) || 0,
                        tags: response.data.tags || [],
                        stock: parseInt(response.data.stock) || 0,
                        stockUnit: response.data.stockUnit,
                        // Fix image URLs by adding backend URL prefix
                        productImage: response.data.productImages?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${response.data.productImages[0]}` : '',
                        images: response.data.productImages ? response.data.productImages.map((img: string) => `${process.env.REACT_APP_BACKEND_URL}/${img}`) : [],
                        primaryImage: response.data.productImages?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${response.data.productImages[0]}` : '',
                        testReport: response.data.testReports?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${response.data.testReports[0]}` : '',
                        createdAt: new Date(response.data.createdAt),
                        updatedAt: new Date(response.data.updatedAt),
                        moq: response.data.moq,
                        moqUnit: response.data.moqUnit,
                        preciseDescription: response.data.description,
                        sellerName: response.data.sellerName || 'Unknown Seller',
                        companyName: response.data.companyName || 'Unknown Company',
                        // trade terms
                        revenueMin: response.data.revenueMin,
                        revenueMax: response.data.revenueMax,
                        currencyTrade: response.data.currencyTrade,
                        unitTrade: response.data.unitTrade,
                        yearsTrade: response.data.yearsTrade,
                        industry: response.data.industry,
                        marketYears: response.data.marketYears,
                        sellerMarketYears: response.data.sellerMarketYears,
                        marketcapture: response.data.marketcapture,
                        selectedIncoterm: response.data.selectedIncoterm,
                        selectedIncotermData: response.data.selectedIncotermData,
                        defaults: response.data.defaults
                    };

                    setProduct(transformedProduct);
                } else {
                    setError(response.message || 'Failed to load product');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                setError('Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, []);

    // Initialize seller incoterms state when product is loaded
    useEffect(() => {
        if (product) {
            setSellerIncotermsState({
                selectedIncoterm: product.selectedIncoterm || "",
                selectedIncotermData: product.selectedIncotermData || {},
                defaults: product.defaults || defaultIncotermValues
            });
        }
    }, [product]);

    // Auto-hide notifications after 5 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <Negoatation 
                        handlestep={handleStep} 
                        currentStep={step} 
                        product={product} 
                        quantity={quantity}
                        onDataChange={(data) => handleStepDataChange(1, data)}
                        stepData={stepData.step1}
                        onSellerIncotermsChange={handleSellerIncotermsChange}
                        onNegotiatedIncotermsChange={handleNegotiatedIncotermsChange}
                        sellerIncotermsState={sellerIncotermsState}
                        negoatiatedIncotermsState={negoatiatedIncotermsState}
                    />
                );
            case 2:
                return (
                    <Address 
                        handlestep={handleStep} 
                        currentStep={step}
                        onDataChange={(data) => handleStepDataChange(2, data)}
                        stepData={stepData.step2}
                        addresses={addresses}
                        selectedAddressIndex={selectedAddressIndex}
                        onAddressesChange={handleAddressesChange}
                        showAddAddressPopup={showAddAddressPopup}
                        onShowAddAddressPopupChange={handleShowAddAddressPopupChange}
                        newAddress={newAddress}
                        onNewAddressChange={handleNewAddressChange}
                        onAddNewAddress={handleAddNewAddress}
                        onSelectedAddressIndexChange={handleSelectedAddressIndexChange}
                        loading={addressesLoading}
                    />
                );
            case 3:
                return (
                    <TradeQueries 
                        handlestep={handleStep} 
                        currentStep={step}
                        onDataChange={(data) => handleStepDataChange(3, data)}
                        stepData={stepData.step3}
                        industryType={industryType}
                        marketYears={marketYears}
                        marketCapture={marketCapture}
                        tradeYears={tradeYears}
                        productUsage={productUsage}
                        onIndustryTypeChange={handleIndustryTypeChange}
                        onMarketYearsChange={handleMarketYearsChange}
                        onMarketCaptureChange={handleMarketCaptureChange}
                        onTradeYearsChange={handleTradeYearsChange}
                        onProductUsageChange={handleProductUsageChange}
                    />
                );
            case 4:
                return (
                    <Payment 
                        handlestep={handleStep} 
                        currentStep={step}
                        onDataChange={(data) => handleStepDataChange(4, data)}
                        stepData={stepData.step4}
                        selectedPaymentType={selectedPaymentType}
                        paymentDetails={paymentDetails}
                        onPaymentTypeChange={handlePaymentTypeChange}
                        onPaymentDetailsChange={handlePaymentDetailsChange}
                        onSubmit={handleSubmitPurchaseRequest}
                    />
                );
            default:
                return null;
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-400 text-6xl mb-4">❌</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Product</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/buyer/homepage')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Homepage
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            <PurchaseRequestProgress currentStep={step} />
            {renderStep()}

            {/* Loading overlay for submission */}
            {submitting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Sending purchase request...</p>
                    </div>
                </div>
            )}

            {/* Notifications */}
            {notification && (
                <div className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg animate-bounce z-50 ${notification.type === 'success'
                    ? 'bg-green-500 text-white'
                    : notification.type === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {notification.type === 'success' && <span className="text-xl">✅</span>}
                            {notification.type === 'error' && <span className="text-xl">❌</span>}
                            {notification.type === 'info' && <span className="text-xl">ℹ️</span>}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{notification.message}</p>
                            {notification.type === 'success' && (
                                <p className="text-xs mt-1 opacity-90">Redirecting to trade requests...</p>
                            )}
                        </div>
                        <button
                            onClick={() => setNotification(null)}
                            className="ml-auto -mx-1.5 -my-1.5 text-white hover:bg-black hover:bg-opacity-20 rounded-lg p-1.5"
                        >
                            <span className="text-sm">✕</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}