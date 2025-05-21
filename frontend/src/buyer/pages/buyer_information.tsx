import React from "react";

const BuyerInformation: React.FC = () => {
    return (
        <div
            style={{
                background: "#E5E5E5",
                minHeight: "100vh",
                padding: "40px 0",
            }}
        >
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
                {/* Left Side (Image & Placeholder) */}
                <div style={{ flex: 1, padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
                    <div
                        style={{
                            background: "#D9D9D9",
                            borderRadius: 10,
                            height: 180,
                            width: "100%",
                        }}
                    />
                    <div
                        style={{
                            background: "#D9D9D9",
                            borderRadius: 8,
                            height: 40,
                            width: "80%",
                            marginTop: 16,
                        }}
                    />
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
                        <form>
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
                                    placeholder="Eg: john Enterprises , Sugna food PVT"
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
                                    style={{
                                        flex: 1,
                                        height: 48,
                                        borderRadius: 8,
                                        background: "linear-gradient(180deg, #222 0%, #111 100%)",
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 20,
                                        border: "none",
                                        cursor: "pointer",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                                    }}
                                >
                                    View In Cart
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* Bottom placeholders */}
            <div style={{ display: "flex", gap: 32, margin: "40px auto 0", maxWidth: 900 }}>
                <div style={{ flex: 1, height: 48, background: "#E5E5E5", borderRadius: 8 }} />
                <div style={{ flex: 1, height: 48, background: "#E5E5E5", borderRadius: 8 }} />
                <div style={{ flex: 1, height: 48, background: "#E5E5E5", borderRadius: 8 }} />
            </div>
        </div>
    );
};

export default BuyerInformation;