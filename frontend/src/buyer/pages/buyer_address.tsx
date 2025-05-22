import React, { useState } from "react";
import CheckoutStepper from "../components/cart/CheckoutStepper";

const addresses = [
    {
        id: 1,
        country: "US",
        isDefault: true,
        isNew: true,
        address: "-----------------------------------------------\n-----------------------------------------------\n-----------------------------------------------",
        mobile: "+91 xxxxxxxx89",
        payOnDelivery: false,
    },
];

const BuyerAddress: React.FC = () => {
    const [selectedAddressId, setSelectedAddressId] = useState(addresses[0].id);

    return (
        <div style={{ background: "#fafafa", minHeight: "100vh" }}>

            <CheckoutStepper currentStep={1} />
            
            {/* Main Content */}
            <div style={{ maxWidth: 1100, margin: "40px auto", display: "flex", gap: 40 }}>
                {/* Address Section */}
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, fontSize: 18 }}>Select Delivery Address</h3>
                    <button
                        style={{
                            margin: "10px 0 20px 0",
                            padding: "8px 18px",
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            background: "#fff",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        ADD NEW ADDRESS
                    </button>
                    <div>
                        <div style={{
                            background: "#fff",
                            border: "1px solid #eee",
                            borderRadius: 8,
                            padding: 20,
                            marginBottom: 20,
                            maxWidth: 400,
                            position: "relative"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <input
                                    type="radio"
                                    checked={selectedAddressId === addresses[0].id}
                                    onChange={() => setSelectedAddressId(addresses[0].id)}
                                    style={{ accentColor: "#e74c3c" }}
                                />
                                <span style={{ fontWeight: 600 }}>{addresses[0].country}</span>
                                {addresses[0].isNew && (
                                    <span style={{
                                        background: "#eaffea",
                                        color: "#27ae60",
                                        fontSize: 10,
                                        borderRadius: 4,
                                        padding: "2px 6px",
                                        marginLeft: 8,
                                    }}>New</span>
                                )}
                            </div>
                            <pre style={{
                                background: "none",
                                border: "none",
                                fontFamily: "inherit",
                                fontSize: 13,
                                margin: "10px 0 0 0",
                                color: "#222"
                            }}>
                                {addresses[0].address}
                            </pre>
                            <div style={{ marginTop: 10, color: "#888", fontSize: 13 }}>
                                <span style={{ fontWeight: 700 }}>MOBILE NO: </span>
                                <span>{addresses[0].mobile}</span>
                            </div>
                            <div style={{ color: "#bbb", fontSize: 12, margin: "6px 0" }}>
                                Pay on Delivery not available
                            </div>
                            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                                <button
                                    style={{
                                        padding: "6px 18px",
                                        borderRadius: 5,
                                        border: "1px solid #e74c3c",
                                        background: "#fff",
                                        color: "#e74c3c",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    REMOVE
                                </button>
                                <button
                                    style={{
                                        padding: "6px 18px",
                                        borderRadius: 5,
                                        border: "1px solid #222",
                                        background: "#fff",
                                        color: "#222",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    EDIT
                                </button>
                            </div>
                        </div>
                        <button
                            className="w-full py-4 rounded-lg border border-gray-400 bg-white shadow-lg text-red-500 font-bold text-lg cursor-pointer"
                        >
                            + ADD NEW ADDRESS
                        </button>
                    </div>
                </div>
                {/* Proceed Button */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <button
                        style={{
                            background: "linear-gradient(90deg, #222 0%, #444 100%)",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 18,
                            border: "none",
                            borderRadius: 8,
                            padding: "18px 40px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                        }}
                    >
                        Proceed To Purchase Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BuyerAddress;