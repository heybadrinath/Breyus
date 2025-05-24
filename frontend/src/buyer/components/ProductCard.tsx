import React, { useState, useEffect } from 'react';
import { Heart } from "lucide-react";
import AddToCartButton from "./AddToCartButton";

const ProductCard: React.FC = () => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const toggleWishlist = () => {
    if (!isWishlisted) {
      setShowAnimation(true);
      setIsWishlisted(true);
    } else {
      setIsWishlisted(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAnimation) {
      timer = setTimeout(() => {
        setShowAnimation(false);
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [showAnimation]);

  return (
    <div onClick={ () =>window.location.href = '/buyer/product-page'} className="bg-white rounded-xl shadow-sm p-4 flex w-[240px] h-[260px] flex-col items-center justify-between">
      {/* Image Area */}
      <div className="relative w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center">
        {/* Heart Icon */}
        <div className="absolute top-3 right-3">
          <div 
            className={`w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100 cursor-pointer ${
              isWishlisted ? 'bg-red-50 border-red-200' : 'border-gray-300'
            }`}
            onClick={toggleWishlist}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart 
              size={16} 
              className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-600'} 
            />
          </div>
        </div>
        {showAnimation && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded animate-fade-in">
            In Wishlist
          </div>
        )}
      </div>

      {/* Add to Cart Button */}
      <AddToCartButton />
    </div>
  );
};

export default ProductCard;