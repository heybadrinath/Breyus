import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Image from "../../components/Image";
import cartService from "../../services_old/cart.service";
import authService from "../../services_old/auth.service";
import { Product } from "../../types/product";

interface OrderRequestData {
    productId?: string;
    sellerId?: string;
    quantity?: number;
    unit?: string;
    sampleOnly?: boolean;
    details?: string;
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

const BuyerInformation: React.FC = () => {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState("");
    const [gstNumber, setGstNumber] = useState("");
    const [orderData, setOrderData] = useState<OrderRequestData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

    useEffect(() => {
        // Load order request data from sessionStorage
        const orderRequestData = sessionStorage.getItem('orderRequestData');
        if (orderRequestData) {
            try {
                const data: OrderRequestData = JSON.parse(orderRequestData);
                setOrderData(data);
                console.log('Loaded order request data:', data);
            } catch (error) {
                console.error('Error parsing order request data:', error);
            }
        }
    }, []);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const getProductImage = () => {
        if (orderData?.product?.productImage) {
            return orderData.product.productImage;
        }
        return "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTBNq3VYmr08yNiIs5AdhFefkNnGIHTGO-AnGfWxT6kfjTtNe1ZPAozfDn_e5qOOcWZiRpZh-ww-Rs8lO4voRrqJZHXzYSOJ5OtPPYPccilFliouKxSisxlJQ";
    };

    const getProductName = () => {
        return orderData?.product?.name || "Product";
    };

    const getSellerName = () => {
        if (orderData?.seller?.firstName && orderData?.seller?.lastName) {
            return `${orderData.seller.firstName} ${orderData.seller.lastName}`;
        }
        return orderData?.seller?.email || "Seller";
    };

    const handleViewInCart = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!orderData?.product) {
            showNotification('error', 'No product data found. Please go back and select a product.');
            return;
        }

        const user = authService.getUser();
        if (!user) {
            showNotification('error', 'Please login to add items to cart.');
            return;
        }

        setIsLoading(true);

        try {
            // Create product object for cart
            const productForCart: Product = {
                id: orderData.product.id,
                name: orderData.product.name,
                price: orderData.product.price || 0,
                productImage: orderData.product.productImage || '',
                images: orderData.product.productImage ? [orderData.product.productImage] : [],
                sellerId: orderData.sellerId || '',
                sellerName: getSellerName(),
                // Required fields with defaults
                onSale: false,
                discount: 0,
                salePrice: orderData.product.price || 0,
                costOfGoods: 0,
                profit: 0,
                margin: 0,
                quantity: orderData.quantity || 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                // Optional fields
                moq: undefined,
                preciseDescription: undefined,
                detailedDescription: undefined,
                category: undefined,
                hsnCode: undefined,
                primaryImage: orderData.product.productImage || '',
                testReports: undefined,
                sku: undefined,
                tags: undefined,
                rating: undefined,
                reviewCount: undefined,
                description: undefined
            };

            // Add to cart
            const success = await cartService.addToCart(productForCart, orderData.quantity || 1);
            
            if (success) {
                // Store buyer information for later use
                const buyerInfo = {
                    companyName,
                    gstNumber,
                    ...orderData
                };
                sessionStorage.setItem('buyerInformation', JSON.stringify(buyerInfo));
                
                showNotification('success', `${productForCart.name} added to cart successfully!`);
                
                // Navigate to cart page after a short delay
                setTimeout(() => {
                    navigate('/buyer/cartpage');
                }, 2000);
            } else {
                showNotification('error', 'Failed to add item to cart. Please try again.');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('error', 'An error occurred while adding to cart.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div
            style={{
                background: "#E5E5E5",
                minHeight: "100vh",
                padding: "40px 0",
            }}
        >
            {/* Notification */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    background: notification.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: 8,
                    zIndex: 1000,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    {notification.message}
                </div>
            )}

            <div
                style={{
                    maxWidth: 1100,
                    margin: "0 auto",
                    background: "#fff",
                    borderRadius: 10,
                    display: "flex",
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                }}
            >
                {/* Left Side (Product Image & Info) */}
                <div style={{ flex: 1, padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ position: "relative" }}>
                        <Image
                            src={getProductImage()}
                            alt={getProductName()}
                            className="w-full h-48 object-cover rounded-lg"
                            showLoadingSpinner={true}
                            showErrorText={true}
                        />
                    </div>
                    
                    {/* Product Info */}
                    {orderData?.product && (
                        <div style={{ padding: "12px 0" }}>
                            <h3 style={{ 
                                fontSize: 18, 
                                fontWeight: 600, 
                                marginBottom: 8,
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
                            {orderData.quantity && (
                                <p style={{ 
                                    fontSize: 14, 
                                    color: "#059669",
                                    fontWeight: 500
                                }}>
                                    Quantity: {orderData.quantity} {orderData.unit || 'units'}
                                </p>
                            )}
                            {orderData.product.price && (
                                <p style={{ 
                                    fontSize: 16, 
                                    color: "#1f2937",
                                    fontWeight: 600,
                                    marginTop: 8
                                }}>
                                    Price: ₹{orderData.product.price.toLocaleString()} per unit
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side (Form) */}
                <div style={{ flex: 2, padding: "40px 32px 40px 0" }}>
                    <div style={{ maxWidth: 500, margin: "0 auto" }}>
                        <div style={{ marginBottom: 32 }}>
                            <span style={{ fontWeight: 700 }}>Please</span>
                            <span style={{ marginLeft: 6 }}>
                                provide a few details to get quick response from the supplier
                            </span>
                        </div>
                        <form onSubmit={handleViewInCart}>
                            <div style={{ marginBottom: 24 }}>
                                <label
                                    htmlFor="company"
                                    style={{
                                        display: "block",
                                        fontSize: 15,
                                        fontWeight: 500,
                                        marginBottom: 8,
                                    }}
                                >
                                    Company/Business Name
                                </label>
                                <input
                                    id="company"
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Eg: john Enterprises , Sugna food PVT"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: 6,
                                        border: "1px solid #E5E5E5",
                                        fontSize: 15,
                                        background: "#FAFAFA",
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: 32 }}>
                                <label
                                    htmlFor="gst"
                                    style={{
                                        display: "block",
                                        fontSize: 15,
                                        fontWeight: 500,
                                        marginBottom: 8,
                                    }}
                                >
                                    GST Number
                                </label>
                                <input
                                    id="gst"
                                    type="text"
                                    value={gstNumber}
                                    onChange={(e) => setGstNumber(e.target.value)}
                                    placeholder="GST Number"
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        borderRadius: 6,
                                        border: "1px solid #E5E5E5",
                                        fontSize: 15,
                                        background: "#FAFAFA",
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 8,
                                        border: "1px solid #E5E5E5",
                                        background: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 24,
                                        cursor: "pointer",
                                    }}
                                >
                                    {/* Left Arrow SVG */}
                                    <svg width="24" height="24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !companyName.trim()}
                                    style={{
                                        flex: 1,
                                        height: 48,
                                        borderRadius: 8,
                                        background: (isLoading || !companyName.trim()) 
                                            ? "#9ca3af" 
                                            : "linear-gradient(180deg, #222 0%, #111 100%)",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 20,
                                        border: "none",
                                        cursor: (isLoading || !companyName.trim()) ? "not-allowed" : "pointer",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                                        opacity: (isLoading || !companyName.trim()) ? 0.6 : 1
                                    }}
                                >
                                    {isLoading ? "Adding to Cart..." : "View In Cart"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuyerInformation;