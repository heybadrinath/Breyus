import React, { useState, useEffect } from "react";
import CheckoutStepper from "../components/cart/CheckoutStepper";
import authService from "../../services/auth.service";

interface UserDetails {
    id: string;
    userId: string;
    contactNumber: string;
    alternateNumber1: string;
    alternateNumber2: string;
    alternateEmail: string;
    address: string;
    city: string;
    state: string;
    country: string;
    companyName: string;
    companyWebsite: string;
    gstin: string;
    companyAddress: string;
    socials: string;
    accountType: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
}

interface Address {
    id: string;
    address: string;
    city: string;
    state: string;
    country: string;
    contactNumber: string;
    isDefault: boolean;
}

const BuyerAddress: React.FC = () => {
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [checkoutData, setCheckoutData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Form state for new/edit address
    const [formData, setFormData] = useState({
        address: "",
        city: "",
        state: "",
        country: "",
        contactNumber: ""
    });

    useEffect(() => {
        loadUserDetails();
        loadCheckoutData();
    }, []);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const loadUserDetails = async () => {
        try {
            const user = authService.getUser();
            if (!user) {
                showNotification('error', 'Please login to continue');
                setLoading(false);
                return;
            }

            console.log('Loading user details for user:', user.id);

            // Use the correct endpoint that fetches from user_details table
            const response = await fetch(`http://localhost:5000/users/me/details`, {
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('Loaded user data with details:', userData);
                
                // Extract the details object from the response
                // Backend returns: { ...user, details: userDetails }
                const details = userData.details || {};
                console.log('Extracted user details:', details);
                setUserDetails(details);
                
                // Create address list from user details
                const addressList: Address[] = [];
                
                // Check if user has any address information
                if (details.address || details.city || details.state || details.country || details.contactNumber) {
                    const userAddress: Address = {
                        id: 'user-default',
                        address: details.address || '',
                        city: details.city || '',
                        state: details.state || '',
                        country: details.country || '',
                        contactNumber: details.contactNumber || '',
                        isDefault: true
                    };
                    addressList.push(userAddress);
                    setSelectedAddressId('user-default');
                    console.log('Created address from user details:', userAddress);
                } else {
                    console.log('No address information found in user details');
                }
                
                setAddresses(addressList);
                
                // If no address exists, show the add form
                if (addressList.length === 0) {
                    console.log('No address found, showing add form');
                    setShowAddForm(true);
                }
            } else {
                console.error('Failed to load user details, status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
                showNotification('error', 'Failed to load user details');
            }
        } catch (error) {
            console.error('Error loading user details:', error);
            showNotification('error', 'Error loading user details');
        } finally {
            setLoading(false);
        }
    };

    const loadCheckoutData = () => {
        const savedCheckoutData = localStorage.getItem('checkout_data');
        if (savedCheckoutData) {
            setCheckoutData(JSON.parse(savedCheckoutData));
        }
    };

    const handleSaveAddress = async () => {
        if (!formData.address.trim() && !formData.city.trim() && !formData.contactNumber.trim()) {
            showNotification('error', 'Please fill in at least address, city, or contact number');
            return;
        }

        setSaving(true);
        try {
            const user = authService.getUser();
            if (!user) {
                showNotification('error', 'Please login to continue');
                return;
            }

            console.log('Saving address data:', formData);

            const updateData = {
                address: formData.address.trim(),
                city: formData.city.trim(),
                state: formData.state.trim(),
                country: formData.country.trim(),
                contactNumber: formData.contactNumber.trim()
            };

            // Use the correct endpoint that updates user_details table
            const response = await fetch(`http://localhost:5000/users/me/details`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const updatedDetails = await response.json();
                console.log('Address saved successfully:', updatedDetails);
                
                showNotification('success', 'Address saved successfully!');
                setShowAddForm(false);
                setEditingAddress(null);
                setFormData({ address: "", city: "", state: "", country: "", contactNumber: "" });
                
                // Reload user details to refresh the address list
                await loadUserDetails();
            } else {
                const errorText = await response.text();
                console.error('Failed to save address:', response.status, errorText);
                showNotification('error', 'Failed to save address');
            }
        } catch (error) {
            console.error('Error saving address:', error);
            showNotification('error', 'Error saving address');
        } finally {
            setSaving(false);
        }
    };

    const handleEditAddress = (address: Address) => {
        console.log('Editing address:', address);
        setEditingAddress(address);
        setFormData({
            address: address.address,
            city: address.city,
            state: address.state,
            country: address.country,
            contactNumber: address.contactNumber
        });
        setShowAddForm(true);
    };

    const handleCancelForm = () => {
        setShowAddForm(false);
        setEditingAddress(null);
        setFormData({ address: "", city: "", state: "", country: "", contactNumber: "" });
    };

    const handleProceedToPurchaseRequest = () => {
        if (!selectedAddressId) {
            showNotification('error', 'Please select a delivery address');
            return;
        }

        // Store selected address for purchase request
        const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
        if (selectedAddress) {
            sessionStorage.setItem('selectedAddress', JSON.stringify(selectedAddress));
            console.log('Selected address stored:', selectedAddress);
        }

        // Navigate to purchase request page
        window.location.href = '/buyer/purchase-request';
    };

    const formatAddress = (address: Address) => {
        const parts = [];
        if (address.address) parts.push(address.address);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);
        return parts.join(', ') || 'No address details';
    };

    if (loading) {
        return (
            <div style={{ background: "#fafafa", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "18px", marginBottom: "10px" }}>Loading your addresses...</div>
                    <div style={{ fontSize: "14px", color: "#666" }}>Please wait while we fetch your delivery information</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: "#fafafa", minHeight: "100vh" }}>
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

            <CheckoutStepper currentStep={1} />
            
            {/* Main Content */}
            <div style={{ maxWidth: 1100, margin: "40px auto", display: "flex", gap: 40, padding: "0 20px" }}>
                {/* Address Section */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Select Delivery Address</h3>
                    
                    {/* Show selected items summary */}
                    {checkoutData && (
                        <div style={{ 
                            background: "#fff", 
                            border: "1px solid #eee", 
                            borderRadius: 8, 
                            padding: 20, 
                            marginBottom: 20 
                        }}>
                            <h4 style={{ fontWeight: 600, marginBottom: 15 }}>Order Summary</h4>
                            <div style={{ fontSize: 14, color: "#666" }}>
                                <p>{checkoutData.selectedItems?.length} items selected</p>
                                <p style={{ fontWeight: 600 }}>Total: ₹{checkoutData.summary?.totalAmount?.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Add Address Button */}
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            style={{
                                margin: "10px 0 20px 0",
                                padding: "12px 24px",
                                borderRadius: 8,
                                border: "1px solid #007bff",
                                background: "#fff",
                                color: "#007bff",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: "14px",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#007bff";
                                e.currentTarget.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#fff";
                                e.currentTarget.style.color = "#007bff";
                            }}
                        >
                            {addresses.length === 0 ? "ADD YOUR FIRST ADDRESS" : "ADD NEW ADDRESS"}
                        </button>
                    )}

                    {/* Address Form */}
                    {showAddForm && (
                        <div style={{
                            background: "#fff",
                            border: "1px solid #eee",
                            borderRadius: 8,
                            padding: 24,
                            marginBottom: 20,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }}>
                            <h4 style={{ fontWeight: 600, marginBottom: 20, color: "#333" }}>
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h4>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 15 }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>
                                        Contact Number *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter your contact number"
                                        value={formData.contactNumber}
                                        onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            border: "1px solid #ddd",
                                            borderRadius: 6,
                                            fontSize: 14,
                                            outline: "none",
                                            transition: "border-color 0.2s"
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "#007bff"}
                                        onBlur={(e) => e.target.style.borderColor = "#ddd"}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter country"
                                        value={formData.country}
                                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            border: "1px solid #ddd",
                                            borderRadius: 6,
                                            fontSize: 14,
                                            outline: "none",
                                            transition: "border-color 0.2s"
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "#007bff"}
                                        onBlur={(e) => e.target.style.borderColor = "#ddd"}
                                    />
                                </div>
                            </div>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15, marginBottom: 15 }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>
                                        State
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter state"
                                        value={formData.state}
                                        onChange={(e) => setFormData({...formData, state: e.target.value})}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            border: "1px solid #ddd",
                                            borderRadius: 6,
                                            fontSize: 14,
                                            outline: "none",
                                            transition: "border-color 0.2s"
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "#007bff"}
                                        onBlur={(e) => e.target.style.borderColor = "#ddd"}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter city"
                                        value={formData.city}
                                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            border: "1px solid #ddd",
                                            borderRadius: 6,
                                            fontSize: 14,
                                            outline: "none",
                                            transition: "border-color 0.2s"
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = "#007bff"}
                                        onBlur={(e) => e.target.style.borderColor = "#ddd"}
                                    />
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: "block", marginBottom: 5, fontWeight: 500, fontSize: 14 }}>
                                    Full Address *
                                </label>
                                <textarea
                                    placeholder="Enter your complete address (House/Flat no, Street, Area, Landmark)"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    rows={3}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        border: "1px solid #ddd",
                                        borderRadius: 6,
                                        fontSize: 14,
                                        resize: "vertical",
                                        outline: "none",
                                        transition: "border-color 0.2s",
                                        fontFamily: "inherit"
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = "#007bff"}
                                    onBlur={(e) => e.target.style.borderColor = "#ddd"}
                                />
                            </div>
                            
                            <div style={{ display: "flex", gap: 12 }}>
                                <button
                                    onClick={handleSaveAddress}
                                    disabled={saving}
                                    style={{
                                        padding: "12px 24px",
                                        background: saving ? "#ccc" : "#007bff",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 6,
                                        cursor: saving ? "not-allowed" : "pointer",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        transition: "background-color 0.2s"
                                    }}
                                >
                                    {saving ? "Saving..." : "Save Address"}
                                </button>
                                <button
                                    onClick={handleCancelForm}
                                    disabled={saving}
                                    style={{
                                        padding: "12px 24px",
                                        background: "#6c757d",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 6,
                                        cursor: saving ? "not-allowed" : "pointer",
                                        fontSize: 14
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Address List */}
                    <div>
                        {addresses.length === 0 && !showAddForm ? (
                            <div style={{
                                background: "#fff",
                                border: "2px dashed #ddd",
                                borderRadius: 8,
                                padding: 40,
                                textAlign: "center",
                                color: "#666"
                            }}>
                                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📍</div>
                                <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>No delivery address found</h4>
                                <p style={{ margin: "0 0 20px 0" }}>Please add a delivery address to continue with your order.</p>
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    style={{
                                        padding: "12px 24px",
                                        background: "#007bff",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        fontWeight: 600,
                                        fontSize: 14
                                    }}
                                >
                                    Add Your First Address
                                </button>
                            </div>
                        ) : (
                            addresses.map((address) => (
                                <div key={address.id} style={{
                                    background: "#fff",
                                    border: selectedAddressId === address.id ? "2px solid #007bff" : "1px solid #eee",
                                    borderRadius: 8,
                                    padding: 20,
                                    marginBottom: 16,
                                    position: "relative",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    boxShadow: selectedAddressId === address.id ? "0 4px 12px rgba(0,123,255,0.15)" : "0 2px 4px rgba(0,0,0,0.1)"
                                }}
                                onClick={() => setSelectedAddressId(address.id)}
                                >
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                        <input
                                            type="radio"
                                            checked={selectedAddressId === address.id}
                                            onChange={() => setSelectedAddressId(address.id)}
                                            style={{ 
                                                accentColor: "#007bff",
                                                marginTop: "2px"
                                            }}
                                        />
                                        
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                                <span style={{ fontWeight: 600, fontSize: 16, color: "#333" }}>
                                                    {address.country || 'Delivery Address'}
                                                </span>
                                                {address.isDefault && (
                                                    <span style={{
                                                        background: "#e8f5e8",
                                                        color: "#2d7d32",
                                                        fontSize: 11,
                                                        borderRadius: 4,
                                                        padding: "2px 8px",
                                                        fontWeight: 600
                                                    }}>DEFAULT</span>
                                                )}
                                            </div>
                                            
                                            <div style={{
                                                color: "#555",
                                                fontSize: 14,
                                                lineHeight: 1.5,
                                                marginBottom: 8
                                            }}>
                                                {formatAddress(address)}
                                            </div>
                                            
                                            {address.contactNumber && (
                                                <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                                                    <span style={{ fontWeight: 600 }}>Mobile: </span>
                                                    <span>{address.contactNumber}</span>
                                                </div>
                                            )}
                                            
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditAddress(address);
                                                    }}
                                                    style={{
                                                        padding: "6px 16px",
                                                        borderRadius: 4,
                                                        border: "1px solid #007bff",
                                                        background: "#fff",
                                                        color: "#007bff",
                                                        fontWeight: 500,
                                                        cursor: "pointer",
                                                        fontSize: 12,
                                                        transition: "all 0.2s"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = "#007bff";
                                                        e.currentTarget.style.color = "white";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = "#fff";
                                                        e.currentTarget.style.color = "#007bff";
                                                    }}
                                                >
                                                    EDIT
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Proceed Button */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center", maxWidth: "300px" }}>
                        {addresses.length > 0 && selectedAddressId ? (
                            <>
                                <div style={{ marginBottom: "20px", padding: "16px", background: "#f8f9fa", borderRadius: 8 }}>
                                    <h4 style={{ margin: "0 0 8px 0", color: "#333", fontSize: 16 }}>Selected Address</h4>
                                    <p style={{ margin: 0, fontSize: 14, color: "#666" }}>
                                        {formatAddress(addresses.find(addr => addr.id === selectedAddressId)!)}
                                    </p>
                                </div>
                                <button
                                    onClick={handleProceedToPurchaseRequest}
                                    style={{
                                        background: "linear-gradient(90deg, #007bff 0%, #0056b3 100%)",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 16,
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "16px 32px",
                                        cursor: "pointer",
                                        boxShadow: "0 4px 12px rgba(0,123,255,0.3)",
                                        transition: "all 0.2s",
                                        width: "100%"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,123,255,0.4)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,123,255,0.3)";
                                    }}
                                >
                                    Proceed To Purchase Request
                                </button>
                            </>
                        ) : (
                            <div style={{ color: "#666", textAlign: "center" }}>
                                <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚚</div>
                                <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>Ready to Deliver</h4>
                                <p style={{ margin: 0, fontSize: 14 }}>
                                    Please add and select a delivery address to continue
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuyerAddress;