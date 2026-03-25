import React, { useState, useEffect } from 'react';
import { Heart } from "lucide-react";
import { Product } from '../../services/products.service';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../services/wishlist.service';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUtils';
import ClickableCompanyName from '../../components/ui/ClickableCompanyName';


interface ProductCardProps {
  product?: Product;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const navigate = useNavigate()
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const isFeatured = Boolean(product?.isFeatured);

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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col animate-pulse min-w-[220px]">
        <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl"></div>
        <div className="mt-4 space-y-3">
          <div className="h-4 bg-gray-200 rounded-full"></div>
          <div className="h-3 bg-gray-100 rounded-full w-2/3"></div>
          <div className="h-5 bg-gray-200 rounded-full w-1/2 mt-2"></div>
        </div>
        <div className="h-10 bg-gray-100 rounded-xl mt-4"></div>
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
      let img: string | undefined;
      if (product.images && product.images.length > 0) {
        img = product.images[0];
      } else if ((product as any).productImages && (product as any).productImages.length > 0) {
        img = (product as any).productImages[0];
      } else if (product.primaryImage) {
        img = product.primaryImage;
      } else if (product.productImage) {
        img = product.productImage;
      }
      // Use centralized URL handling for consistent local/Docker/production support
      return getImageUrl(img, '/placeholder-product.svg');
    };


    const handleImageLoad = () => {
      setIsLoading(false);
    };

    const handleImageError = () => {
      setIsLoading(false);
      setCurrentImageError(true);
    };

    return (
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center overflow-hidden group-hover:shadow-inner transition-all duration-300">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-400"></div>
          </div>
        )}
        <img
          src={getProductImage()}
          alt={product.name}
          className={`w-full h-full object-cover rounded-xl transition-all duration-300 group-hover:scale-105 ${isLoading ? 'opacity-0' : 'opacity-100'
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-400 text-xs font-medium">No Image</span>
          </div>
        )}
      </div>
    );
  };



  const handlePurchaseRequest = async (e: React.MouseEvent) => {
    // e.stopPropagation();
    // navigate(`/buyer/purchase-request?id=${product.id}&quantity_unit=${product.moqUnit}`);

  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/buyer/product-page?id=${product.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 p-5 flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image Area */}
      <div className="relative overflow-hidden rounded-xl">
        <ProductImage />

        {isFeatured && (
          <div className="absolute top-3 left-3 rounded-full bg-amber-50 border border-amber-200/50 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur-sm">
            ✨ Featured
          </div>
        )}

        {/* Heart Icon */}
        <div className="absolute top-3 right-3">
          <div
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 backdrop-blur-sm ${
              isWishlisted
                ? 'bg-red-50 border-red-200 shadow-sm'
                : 'border-white/60 bg-white/70 hover:bg-white hover:border-gray-200 hover:shadow-md'
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
              size={18}
              className={`transition-all duration-200 ${isWishlisted ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-500 group-hover:text-gray-700'}`}
            />
          </div>
        </div>

        {/* Wishlist Animation */}
        {showAnimation && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1.5 rounded-full animate-bounce shadow-lg">
            ❤️ Added to Wishlist!
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between pt-4">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-700 transition-colors">
            {product.name}
          </h3>

          <ClickableCompanyName
            companyId={product.companyId}
            companyName={product.companyName || product.sellerName || 'Unknown Company'}
            className="text-sm text-gray-400 truncate block"
          />

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xl font-bold text-gray-900">
              {(product.salePrice) ? product.salePrice.toLocaleString() : (product.price ? product.price.toLocaleString() : 'N/A')}
            </span>
            <span className="text-sm font-medium text-gray-500">{product.currency || ''}</span>
            {product.onSale && product.price && (
              <span className="text-sm text-gray-400 line-through ml-1">
                {product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Send Purchase Request */}
        <button
          onClick={handlePurchaseRequest}
          className="mt-4 w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98] shadow-sm hover:shadow-md"
        >
          Send Purchase Request
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
