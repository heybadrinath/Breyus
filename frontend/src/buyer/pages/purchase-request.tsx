import React, { useState, useEffect } from "react";
import { PurchaseRequestProgress } from "../components/purchaseRequestProgress";
import { Negoatation } from "../components/Negotation";
import { Address } from "../components/Address";
import { TradeQueries } from "../components/TradeQueries";
import { Payment } from "../components/Payment";
import { getProductById, Product } from "../../services/products.service";

export const PurchaseRequest = () => {

    // types
    type negotation = {
        additionalMessage?: string;
        counterPrice?: string;
    }

    // States 
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
      const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        message: string;
    } | null>(null);

    // negotation state
    const [product, setProduct] = useState<Product | null>(null);
    const [additionalMessage, setAdditionalMessage] = useState('');
    const [counterPrice, setCounterPrice] = useState('');




    const urlParams = new URLSearchParams(window.location.search);
    const quantity = urlParams.get('quantity');

const handleStep = (step: number) => {
        setStep(step);
    };

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);

            try {
                // Get product ID from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const productId = urlParams.get('id');

                if (!productId) {
                    setError('Product ID not found in URL');
                    return;
                }


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


    const renderStep = () => {
        switch (step) {
            case 1:
                return <Negoatation handlestep={handleStep} currentStep={step} product={product} quantity={quantity as string} />;
            case 2:
                return <Address handlestep={handleStep} currentStep={step} />;
            case 3:
                return <TradeQueries handlestep={handleStep} currentStep={step} />;
            case 4:
                return <Payment handlestep={handleStep} currentStep={step} />;
            default:
                return null;
        }
    }

    return (
        <div className="flex flex-col h-screen">
            <PurchaseRequestProgress currentStep={step} />
            {renderStep()}


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