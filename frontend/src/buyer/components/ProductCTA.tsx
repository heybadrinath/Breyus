import { MessageCircle, Heart, Share2, X } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import React, { useState } from "react";
import { Product } from "../../types/product";

interface ProductCTAProps {
  product: Product;
}

const ProductCTA: React.FC<ProductCTAProps> = ({ product }) => {
  const [showTradeTerms, setShowTradeTerms] = useState(false);

  return (
    <div className="space-y-4 mt-6">
      <AddToCartButton />

      <button className="w-full py-2 border rounded-lg font-semibold">
        View Test Reports
      </button>
      <button
        className="w-full py-2 border rounded-lg font-semibold"
        onClick={() => setShowTradeTerms(true)}
      >
        View Trade Terms
      </button>

      <div className="flex justify-between text-sm text-black mt-4 border-t pt-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} /> Chat
        </div>
        <div className="flex items-center gap-2">
          <Heart size={16} /> Wishlist
        </div>
        <div className="flex items-center gap-2">
          <Share2 size={16} /> Share
        </div>
      </div>

      {showTradeTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setShowTradeTerms(false)}
              aria-label="Close"
            >
              <X size={22} />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Trade Terms</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold">Preferred Buyer Revenue Range:</span><br />
                <span>{product.preferred_buyer_revenue_range || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">Potential Years to Trade:</span><br />
                <span>{product.potential_years_to_trade || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">Industry Using Product:</span><br />
                <span>{product.industry_using_product || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">Years in Market:</span><br />
                <span>{product.years_in_market || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">Buyer Market Duration:</span><br />
                <span>{product.buyer_market_duration || "-"}</span>
              </div>
              <div>
                <span className="font-semibold">Market Capture:</span><br />
                <span>{product.market_capture !== undefined && product.market_capture !== null ? product.market_capture + "%" : "-"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCTA;