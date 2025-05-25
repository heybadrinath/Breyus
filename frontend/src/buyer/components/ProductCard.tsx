import React, { useState, useEffect } from 'react';
import { Heart, Star } from "lucide-react";
import cartService from "../../services/cart.service";
import wishlistService from "../../services/wishlist.service";
import { Product } from "../../types/product";

interface ProductCardProps {
  product?: Product;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageError, setImageError] = useState(false);

  // All hooks must be called before any conditional logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAnimation) {
      timer = setTimeout(() => {
        setShowAnimation(false);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [showAnimation]);

  // Check if product is in wishlist
  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlistService.isInWishlist(product.id));
    }
  }, [product]);

  // Listen for wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (product) {
        setIsWishlisted(wishlistService.isInWishlist(product.id));
      }
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
    };
  }, [product]);

  // Handle case when no product is provided (placeholder)
  if (!product) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 flex w-[240px] h-[320px] flex-col items-center justify-between animate-pulse">
        <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
        <div className="w-full space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = wishlistService.toggleWishlist(product);
    if (success && !isWishlisted) {
      setShowAnimation(true);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddingToCart(true);
    
    try {
      const success = await cartService.addToCart(product, 1);
      if (success) {
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = `/buyer/product-page?id=${product.id}`;
    }
  };

  // Check if product is already in cart
  const isInCart = cartService.isInCart(product.id);

  // Enhanced image component with loading state
  const ProductImage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageError, setCurrentImageError] = useState(false);

    const getProductImage = () => {
      if (currentImageError) {
        return '/placeholder-product.svg';
      }

      // Try primary image first, then first image from array, then product image, then fallback
      const imageUrl = product.primaryImage || 
                       (product.images && product.images[0]) || 
                       product.productImage || 
                       '/placeholder-product.svg';
      
      return imageUrl;
    };

    const handleImageLoad = () => {
      setIsLoading(false);
    };

    const handleImageError = () => {
      setIsLoading(false);
      setCurrentImageError(true);
    };

    return (
      <div className="relative w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        )}
        <img
          src={getProductImage()}
          alt={product.name}
          className={`w-full h-full object-cover rounded-lg transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        {currentImageError && getProductImage() === '/placeholder-product.svg' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 text-sm">
            No Image
          </div>
        )}
      </div>
    );
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      onClick={handleCardClick} 
      className="bg-white rounded-xl shadow-sm p-4 flex w-[240px] h-[320px] flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300"
    >
      {/* Image Area */}
      <div className="relative">
        <ProductImage />
        
        {/* Heart Icon */}
        <div className="absolute top-3 right-3">
          <div 
            className={`w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors ${
              isWishlisted ? 'bg-red-50 border-red-200' : 'border-gray-300 bg-white/80'
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

        {/* Wishlist Animation */}
        {showAnimation && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded animate-bounce">
            Added to Wishlist!
          </div>
        )}

        {/* Cart Animation */}
        {addedToCart && (
          <div className="absolute bottom-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded animate-bounce">
            Added to Cart!
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between pt-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
            {product.name}
          </h3>
          
          <p className="text-xs text-gray-500 mb-2">
            by {product.sellerName || 'Unknown Seller'}
          </p>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs text-gray-600 ml-1">
                  {product.rating} ({product.reviewCount || 0})
                </span>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-gray-900">
              ₹{product.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className={`mt-3 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
            isInCart
              ? 'bg-green-500 text-white cursor-default'
              : isAddingToCart
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800 hover:scale-[1.02]'
          }`}
        >
          {isAddingToCart ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Adding...
            </div>
          ) : isInCart ? (
            'In Cart ✓'
          ) : (
            'Add to Cart'
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;