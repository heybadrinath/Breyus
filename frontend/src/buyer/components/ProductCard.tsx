import React, { useState, useEffect } from 'react';
import { Heart } from "lucide-react";
import { Product } from '../../services/products.service';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../services/wishlist.service';

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
  const [wishlistLoading, setWishlistLoading] = useState(false);

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

  useEffect(() => {
    let ignore = false;
    const checkWishlist = async () => {
      if (!product) return;
      try {
        const wishlist = await getWishlist();
        if (ignore) return;
        setIsWishlisted(wishlist.some((item: any) => item.id === product.id));
      } catch (e) {
        // ignore error
      }
    };
    checkWishlist();
    return () => { ignore = true; };
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





  // Check if product is already in cart

  // Enhanced image component with loading state
  const ProductImage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentImageError, setCurrentImageError] = useState(false);

    const getProductImage = () => {
      if (currentImageError) {
        return '/placeholder-product.svg';
      }
      // Prefer images, then productImages, then fallback
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      let img = '';
      if (product.images && product.images.length > 0) {
        img = product.images[0];
      } else if ((product as any).productImages && (product as any).productImages.length > 0) {
        img = (product as any).productImages[0];
      } else if (product.primaryImage) {
        img = product.primaryImage;
      } else if (product.productImage) {
        img = product.productImage;
      }
      if (img && !img.startsWith('http')) {
        img = `${backendUrl}/${img}`;
      }
      return img || '/placeholder-product.svg';
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
          className={`w-full h-full object-cover rounded-lg transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'
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

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = `/buyer/product-page?id=${product.id}`;
    }
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
            className={`w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors ${isWishlisted ? 'bg-red-50 border-red-200' : 'border-gray-300 bg-white/80'
              }`}
            onClick={async (e) => {
              e.stopPropagation();
              if (!product || wishlistLoading) return;
              setWishlistLoading(true);
              try {
                if (isWishlisted) {
                  await removeFromWishlist(product.id);
                  setIsWishlisted(false);
                } else {
                  await addToWishlist(product.id);
                  setIsWishlisted(true);
                  setShowAnimation(true);
                }
              } catch (err) {
                // Optionally show error
              } finally {
                setWishlistLoading(false);
              }
            }}
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

      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between pt-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
            {product.name}
          </h3>

          <p className="text-xs text-gray-500 mb-2">
            by {product.companyName || product.sellerName || 'Unknown Company'}
          </p>



          {/* Price */}

          <div className="flex items-baseline gap-3">
            <span className="text-lg font-bold text-gray-900">{(product.salePrice) ? product.salePrice.toLocaleString() + ' ' + product.currency : product.price.toLocaleString() + ' ' + product.currency}</span>
            {product.onSale && (
              <>
                <span className="text-sm text-gray-500 line-through">{product.price.toLocaleString() + ' ' + product.currency}</span>
              </>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          // onClick={handleAddToCart}
          disabled={isAddingToCart}
          className={`mt-3 w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 bg-black text-white hover:bg-gray-800 hover:scale-[1.02]`}
        >
          Send Purchase Request
        </button>
      </div>
    </div>
  );
};

export default ProductCard;