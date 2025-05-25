import React from "react";

const ProductPage: React.FC = () => {
    return (
        <div style={{ display: "flex", padding: 32, background: "#f7f7f7", minHeight: "100vh" }}>
            {/* Left: Product Images */}
            <div style={{ width: 400, display: "flex" }}>
                {/* Thumbnails */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginRight: 16 }}>
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: 48,
                                height: 48,
                                background: "#fff",
                                borderRadius: 8,
                                border: "1px solid #eee",
                            }}
                        />
                    ))}
                </div>
                {/* Main Image */}
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px #0001",
                        width: 350,
                        height: 400,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <img
                        src="https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTBNq3VYmr08yNiIs5AdhFefkNnGIHTGO-AnGfWxT6kfjTtNe1ZPAozfDn_e5qOOcWZiRpZh-ww-Rs8lO4voRrqJZHXzYSOJ5OtPPYPccilFliouKxSisxlJQ"
                        alt="Protein"
                        style={{ width: 300, height: 350, objectFit: "contain" }}
                    />
                </div>
            </div>

            {/* Right: Product Details */}
            <div style={{ marginLeft: 40, flex: 1 }}>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>
                    Redragon Shiva K512 RGB Backlit Membrane Wired Gaming Keyboard with Multimedia Keys
                </h2>
                <div style={{ margin: "12px 0 0 0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>4.0</span>
                    <span>
                        {[...Array(4)].map((_, i) => (
                            <span key={i} style={{ color: "#FFD700", fontSize: 18 }}>★</span>
                        ))}
                        <span style={{ color: "#ccc", fontSize: 18 }}>★</span>
                    </span>
                </div>
                <div style={{ margin: "24px 0 16px 0", fontSize: 22, fontWeight: 700 }}>
                    Price : <span style={{ fontWeight: 900 }}>₹4,500,000.00</span>
                </div>
                <button 
                    onClick={() => {window.location.href=`/buyer/product-request-quantity`}}
                    style={{
                        width: "100%",
                        padding: "18px 0",
                        background: "linear-gradient(180deg, #222 0%, #444 100%)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 20,
                        border: "none",
                        borderRadius: 8,
                        marginBottom: 16,
                        cursor: "pointer",
                    }}
                >
                    Add to Cart
                </button>
                <button
                    style={{
                        width: "100%",
                        padding: "14px 0",
                        background: "#fff",
                        color: "#222",
                        fontWeight: 600,
                        fontSize: 18,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        marginBottom: 12,
                        cursor: "pointer",
                    }}
                >
                    View Test Reports
                </button>
                <button
                    style={{
                        width: "100%",
                        padding: "14px 0",
                        background: "#fff",
                        color: "#222",
                        fontWeight: 700,
                        fontSize: 18,
                        border: "1px solid #eee",
                        borderRadius: 8,
                        marginBottom: 24,
                        cursor: "pointer",
                    }}
                >
                    Trade Terms
                </button>
                {/* Chat, Wishlist, Share */}
                <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 32 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span role="img" aria-label="chat">💬</span> Chat
                    </span>
                    <span style={{ borderLeft: "1px solid #ccc", height: 24 }} />
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span role="img" aria-label="wishlist">♡</span> Wishlist
                    </span>
                    <span style={{ borderLeft: "1px solid #ccc", height: 24 }} />
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span role="img" aria-label="share">🔗</span> Share
                    </span>
                </div>
                {/* Empty Inputs */}
                <div style={{ display: "flex", gap: 24 }}>
                    {[...Array(3)].map((_, i) => (
                        <input
                            key={i}
                            style={{
                                flex: 1,
                                height: 48,
                                borderRadius: 8,
                                border: "1px solid #eee",
                                background: "#fff",
                                padding: "0 16px",
                                fontSize: 16,
                            }}
                            disabled
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductPage;