import React, { useState, useEffect } from "react";
import Image from "../../components/Image";

const units = [
    { label: "Tonne", value: "tonne" },
    { label: "Quintal", value: "quintal" },
    { label: "Bag", value: "bag" },
    { label: "Kgs", value: "kgs" },
];

interface ResendTradeData {
    productId: string;
    sellerId: string;
    quantity: number;
    offeredPrice: number;
    message?: string;
    product?: {
        id: string;
        name: string;
        productImage?: string;
        price?: number;
    };
    seller?: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
}

export default function OrderRequestQuantity() {
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [sampleOnly, setSampleOnly] = useState(false);
    const [details, setDetails] = useState("");
    const [resendData, setResendData] = useState<ResendTradeData | null>(null);
    const [isResendMode, setIsResendMode] = useState(false);

    useEffect(() => {
        // Check if this is a resend operation
        const urlParams = new URLSearchParams(window.location.search);
        const isResend = urlParams.get('resend') === 'true';
        const productId = urlParams.get('productId');
        
        if (isResend && productId) {
            setIsResendMode(true);
            
            // Get resend data from sessionStorage
            const resendDataString = sessionStorage.getItem('resendTradeData');
            if (resendDataString) {
                try {
                    const tradeData: ResendTradeData = JSON.parse(resendDataString);
                    setResendData(tradeData);
                    
                    // Pre-fill form with previous data
                    if (tradeData.quantity) {
                        setQuantity(tradeData.quantity.toString());
                    }
                    if (tradeData.message) {
                        setDetails(tradeData.message);
                    }
                    
                    console.log('Loaded resend trade data:', tradeData);
                } catch (error) {
                    console.error('Error parsing resend data:', error);
                }
            }
        }
    }, []);

    const getProductImage = () => {
        if (resendData?.product?.productImage) {
            return resendData.product.productImage;
        }
        // Fallback to the hardcoded image if no product data
        return "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTBNq3VYmr08yNiIs5AdhFefkNnGIHTGO-AnGfWxT6kfjTtNe1ZPAozfDn_e5qOOcWZiRpZh-ww-Rs8lO4voRrqJZHXzYSOJ5OtPPYPccilFliouKxSisxlJQ";
    };

    const getProductName = () => {
        return resendData?.product?.name || "Product";
    };

    const getSellerName = () => {
        if (resendData?.seller?.firstName && resendData?.seller?.lastName) {
            return `${resendData.seller.firstName} ${resendData.seller.lastName}`;
        }
        return resendData?.seller?.email || "Seller";
    };

    const handleNext = () => {
        // Store the updated form data
        const formData = {
            quantity: parseInt(quantity) || 0,
            unit,
            sampleOnly,
            details,
            ...resendData // Include original resend data
        };
        
        sessionStorage.setItem('orderRequestData', JSON.stringify(formData));
        window.location.href = `/buyer/buyer-information`;
    };

    return (
        <div style={{
            display: "flex",
            background: "#fff",
            borderRadius: 12,
            padding: 32,
            minHeight: 600,
            maxWidth: 900,
            margin: "40px auto",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }}>
            {/* Left Side - Product Image */}
            <div style={{ flex: 1, marginRight: 32 }}>
                <div style={{ position: "relative", marginBottom: 16 }}>
                    <Image
                        src={getProductImage()}
                        alt={getProductName()}
                        className="w-full h-48 object-cover rounded-lg"
                        showLoadingSpinner={true}
                        showErrorText={true}
                    />
                    {isResendMode && (
                        <div style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            background: "rgba(59, 130, 246, 0.9)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500
                        }}>
                            Resending Offer
                        </div>
                    )}
                </div>
                
                {/* Product Info */}
                {resendData?.product && (
                    <div style={{ padding: "12px 0" }}>
                        <h3 style={{ 
                            fontSize: 16, 
                            fontWeight: 600, 
                            marginBottom: 4,
                            color: "#1f2937"
                        }}>
                            {getProductName()}
                        </h3>
                        <p style={{ 
                            fontSize: 14, 
                            color: "#6b7280",
                            marginBottom: 8
                        }}>
                            Seller: {getSellerName()}
                        </p>
                        {resendData.offeredPrice && (
                            <p style={{ 
                                fontSize: 14, 
                                color: "#059669",
                                fontWeight: 500
                            }}>
                                Previous Offer: ₹{resendData.offeredPrice.toLocaleString()} per unit
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Right Side Form */}
            <div style={{ flex: 2 }}>
                <div style={{ fontWeight: 600, fontSize: 22, marginBottom: 8 }}>
                    Contact Seller <span style={{ fontWeight: 400, fontSize: 18 }}>by adding a few details of your requirement</span>
                </div>

                {isResendMode && (
                    <div style={{
                        background: "#fef3c7",
                        border: "1px solid #f59e0b",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        fontSize: 14,
                        color: "#92400e"
                    }}>
                        <strong>Resending Previous Offer:</strong> Form has been pre-filled with your previous request details. You can modify them before sending.
                    </div>
                )}

                <div style={{ margin: "24px 0 8px 0", fontWeight: 500 }}>Quantity</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        placeholder="Enter quantity"
                        style={{
                            width: 100,
                            height: 48,
                            borderRadius: 12,
                            border: "1px solid #ccc",
                            padding: "0 12px",
                            fontSize: 16,
                            marginRight: 8
                        }}
                    />
                    {units.map(u => (
                        <label key={u.value} style={{
                            display: "flex",
                            alignItems: "center",
                            background: unit === u.value ? "#F2F2F2" : "#fff",
                            borderRadius: 12,
                            padding: "0 18px",
                            height: 48,
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 500,
                            fontSize: 16,
                            boxShadow: unit === u.value ? "0 0 0 2px #000" : "0 0 0 1px #ccc"
                        }}>
                            <input
                                type="radio"
                                name="unit"
                                checked={unit === u.value}
                                onChange={() => setUnit(u.value)}
                                style={{ marginRight: 8 }}
                            />
                            {u.label}
                        </label>
                    ))}
                </div>

                <div style={{ margin: "32px 0 8px 0", fontWeight: 600, fontSize: 20 }}>
                    Type of Requirement
                </div>
                <div>
                    <label style={{
                        display: "flex",
                        alignItems: "center",
                        background: sampleOnly ? "#F2F2F2" : "#fff",
                        borderRadius: 12,
                        padding: "0 18px",
                        height: 56,
                        fontWeight: 500,
                        fontSize: 18,
                        boxShadow: sampleOnly ? "0 0 0 2px #000" : "0 0 0 1px #ccc",
                        marginBottom: 24,
                        width: 220,
                        cursor: "pointer"
                    }}>
                        <input
                            type="checkbox"
                            checked={sampleOnly}
                            onChange={() => setSampleOnly(!sampleOnly)}
                            style={{ marginRight: 12 }}
                        />
                        Sample only
                    </label>
                </div>

                <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 8 }}>
                    Requirement Details
                </div>
                <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Additional details about your requirement"
                    style={{
                        width: "100%",
                        minHeight: 90,
                        borderRadius: 12,
                        border: "1px solid #ccc",
                        padding: 16,
                        fontSize: 16,
                        marginBottom: 32,
                        resize: "vertical"
                    }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <button 
                        onClick={() => window.history.back()}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            border: "1px solid #ccc",
                            background: "#fff",
                            fontSize: 28,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        &#8592;
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!quantity || !unit}
                        style={{
                            flex: 1,
                            height: 48,
                            borderRadius: 12,
                            border: "none",
                            background: (!quantity || !unit) 
                                ? "#9ca3af" 
                                : "linear-gradient(180deg, #222 0%, #444 100%)",
                            color: "#fff",
                            fontWeight: 600,
                            fontSize: 18,
                            cursor: (!quantity || !unit) ? "not-allowed" : "pointer",
                            opacity: (!quantity || !unit) ? 0.6 : 1
                        }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}