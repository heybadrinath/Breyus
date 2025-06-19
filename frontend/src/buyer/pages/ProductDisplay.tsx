import React from "react";
import ProductVisual from "../components/ProductVisual";
import ProductDetails from "../components/ProductDetails";
import ProductCTA from "../components/ProductCTA";
import { Product } from "../../types/product";

const ProductDisplay = () => {
  // Mock product ID for development
  const productId = "mock-product-id";
  
  // Mock product object for ProductCTA
  const mockProduct: Product = {
    id: productId,
    name: "Redragon Shiva K512 RGB Backlit Membrane Wired Gaming Keyboard with Multimedia Keys",
    price: 4500000,
    onSale: false,
    discount: 0,
    salePrice: 4500000,
    costOfGoods: 0,
    profit: 0,
    margin: 0,
    quantity: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Optional fields
    moq: "10",
    preciseDescription: "A high-quality gaming keyboard.",
    detailedDescription: "This is a detailed description of the product.",
    category: "Electronics",
    hsnCode: "8471",
    productImage: "/protein-pack.png",
    images: ["/protein-pack.png"],
    primaryImage: "/protein-pack.png",
    testReports: undefined,
    sku: "SKU123",
    tags: ["gaming", "keyboard"],
    sellerId: "seller-1",
    sellerName: "Redragon",
    rating: 4.0,
    reviewCount: 10,
    description: "A high-quality gaming keyboard.",
    // Trade terms fields
    preferred_buyer_revenue_range: "1-10 Crore USD",
    potential_years_to_trade: "5",
    industry_using_product: "Gaming",
    years_in_market: "3",
    buyer_market_duration: "2",
    market_capture: 15.5,
  };

  return (
    <div className="p-4 max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
      {/* Left - Image and Visual */}
      <div className="w-full md:w-1/2">
        <ProductVisual
          src="/protein-pack.png"
          alt="De-Carbon Protein Sample"
        />
      </div>

      {/* Right - Product Info */}
      <div className="w-full md:w-1/2 flex flex-col justify-between">
        <ProductDetails
          title="Redragon Shiva K512 RGB Backlit Membrane Wired Gaming Keyboard with Multimedia Keys"
          rating={4.0}
          price="₹4,500,000.00"
        />
        <ProductCTA product={mockProduct} />
      </div>
    </div>
  );
};

export default ProductDisplay;