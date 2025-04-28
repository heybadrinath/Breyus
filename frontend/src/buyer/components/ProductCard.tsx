import React from 'react';

import { Heart } from "lucide-react";
import AddToCartButton from "./AddToCartButton";

const ProductCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex w-[240px] h-[260px] flex-col items-center justify-between">
      {/* Image Area */}
      <div className="relative w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center">
        {/* Heart Icon */}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer">
            <Heart size={16} className="text-gray-600" />
          </div>
        </div>
      </div>

      {/* Add to Cart Button */}
      <AddToCartButton />
    </div>
  );
};

export default ProductCard;