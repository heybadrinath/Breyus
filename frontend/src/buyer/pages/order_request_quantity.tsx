import React, { useState } from "react";

const units = [
    { label: "Tonne", value: "tonne" },
    { label: "Quintal", value: "quintal" },
    { label: "Bag", value: "bag" },
    { label: "Kgs", value: "kgs" },
];

export default function OrderRequestQuantity() {
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [sampleOnly, setSampleOnly] = useState(false);
    const [details, setDetails] = useState("");

    return (
        <div style={{
            display: "flex",
            background: "#fff",
            borderRadius: 12,
            padding: 32,
            minHeight: 600,
            maxWidth: 900,
            margin: "40px auto"
        }}>
            {/* Left Side Placeholder */}
            <div style={{ flex: 1, marginRight: 32 }}>
                {/* <div style={{
                    background: "#E0E0E0",
                    borderRadius: 8,
                    height: 180,
                    marginBottom: 24
                }} />
                <div style={{
                    background: "#E0E0E0",
                    borderRadius: 8,
                    height: 48,
                    width: "80%"
                }} /> */}
                <img src="https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTBNq3VYmr08yNiIs5AdhFefkNnGIHTGO-AnGfWxT6kfjTtNe1ZPAozfDn_e5qOOcWZiRpZh-ww-Rs8lO4voRrqJZHXzYSOJ5OtPPYPccilFliouKxSisxlJQ" alt="product-images" />
            </div>
            {/* Right Side Form */}
            <div style={{ flex: 2 }}>
                <div style={{ fontWeight: 600, fontSize: 22, marginBottom: 8 }}>
                    Contact Seller <span style={{ fontWeight: 400, fontSize: 18 }}>by adding a few details of your requirement</span>
                </div>
                <div style={{ margin: "24px 0 8px 0", fontWeight: 500 }}>Quantity</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <input
                        type="number"
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        placeholder=""
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
                        width: 220
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
                        resize: "none"
                    }}
                />

                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <button style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        border: "1px solid #ccc",
                        background: "#fff",
                        fontSize: 28,
                        cursor: "pointer"
                    }}>
                        &#8592;
                    </button>
                    <button style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 12,
                        border: "none",
                        background: "linear-gradient(180deg, #222 0%, #444 100%)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 18,
                        cursor: "pointer"
                    }}>
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}