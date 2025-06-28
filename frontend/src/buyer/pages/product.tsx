import React, { useState, useEffect } from "react";
import { Star, Heart, Share2, MessageCircle, ShoppingCart, Package, Shield, Truck, X } from "lucide-react";
import productService from "../../services_old/product.service";
import cartService from "../../services_old/cart.service";
import wishlistService from "../../services_old/wishlist.service";
import { Product } from "../../types/product";

const ProductPage: React.FC = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [tradeRequestSent, setTradeRequestSent] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showTradeTerms, setShowTradeTerms] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get product ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
          setError('Product ID not found in URL');
          return;
        }

        console.log('Fetching product with ID:', productId);
        
        const response = await productService.getProductById(productId);
        
        if (response.success && response.product) {
          setProduct(response.product);
          setIsWishlisted(wishlistService.isInWishlist(response.product.id));
        } else {
          setError(response.message || 'Failed to load product');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, []);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    
    try {
      // Add to cart locally first for immediate feedback
      const success = await cartService.addToCart(product, quantity);
      if (success) {
        setAddedToCart(true);
        showNotification('success', `${product.name} added to cart successfully!`);
        setTimeout(() => setAddedToCart(false), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification('error', 'Failed to add item to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    
    try {
      // Create trade request directly (quick purchase)
      const result = await cartService.quickPurchase(
        product, 
        quantity, 
        `I would like to purchase ${quantity} units of ${product.name}. Please review and confirm availability.`
      );
      
      if (result.success) {
        setTradeRequestSent(true);
        showNotification(
          'success', 
          `Trade request sent successfully! The seller will review your request and respond soon. You can track the status in your trade requests.`
        );
        
        // Redirect to trade page after showing notification
        setTimeout(() => {
          window.location.href = '/buyer/trade';
        }, 3000);
      } else {
        showNotification('error', result.message || 'Failed to send trade request');
      }
    } catch (error) {
      console.error('Error creating trade request:', error);
      showNotification('error', 'Failed to send trade request. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    
    const success = wishlistService.toggleWishlist(product);
    if (success) {
      setIsWishlisted(!isWishlisted);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Product</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/buyer/homepage'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h3>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => window.location.href = '/buyer/homepage'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.productImage || '/placeholder-product.svg'];
  const isInCart = cartService.isInCart(product.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Left: Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.svg';
                  }}
                />
              </div>
              
              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-20 h-20 bg-gray-100 rounded cursor-pointer border-2 ${
                        selectedImageIndex === index ? 'border-blue-500' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-product.svg';
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details */}
            <div className="space-y-6">
              {/* Product Title */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-600">by {product.sellerName || 'Unknown Seller'}</p>
              </div>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={i < Math.floor(product.rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium">{product.rating.toFixed(1)}</span>
                  <span className="text-gray-500">({product.reviewCount || 0} reviews)</span>
                </div>
              )}

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                  {product.onSale && product.salePrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">₹{product.salePrice.toLocaleString()}</span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                        {Math.round(((product.salePrice - product.price) / product.salePrice) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                {product.moq && (
                  <p className="text-sm text-gray-600">Minimum Order Quantity: {product.moq}</p>
                )}
              </div>

              

              {/* Description */}
              {product.preciseDescription && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{product.preciseDescription}</p>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500 ml-2">
                    {product.quantity > 0 ? `${product.quantity} available` : 'Out of stock'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || product.quantity === 0}
                  className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-all ${
                    isInCart
                      ? 'bg-green-500 text-white cursor-default'
                      : product.quantity === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isAddingToCart
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  {isAddingToCart ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Adding to Cart...
                    </div>
                  ) : isInCart ? (
                    <>
                      <ShoppingCart className="inline w-5 h-5 mr-2" />
                      In Cart ✓
                    </>
                  ) : product.quantity === 0 ? (
                    'Out of Stock'
                  ) : (
                    <>
                      <ShoppingCart className="inline w-5 h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </button>

                {/* <button
                  onClick={handleBuyNow}
                  disabled={product.quantity === 0 || isAddingToCart || tradeRequestSent}
                  className={`w-full py-3 px-6 rounded-lg text-lg font-semibold border transition-all ${
                    tradeRequestSent
                      ? 'border-green-300 bg-green-50 text-green-700 cursor-default'
                      : product.quantity === 0 || isAddingToCart
                      ? 'border-gray-300 text-gray-500 cursor-not-allowed'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  
                  {tradeRequestSent ? (
                    <>
                      <Package className="inline w-5 h-5 mr-2" />
                      Request Sent ✓
                    </>
                  ) : isAddingToCart ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                      Sending Request...
                    </div>
                  ) : (
                    <>
                      <Package className="inline w-5 h-5 mr-2" />
                      Send Purchase Request
                    </>
                  )}
                </button> */}
                <button
                className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold transition"
                onClick={() => {}}
              >
                View Test Reports
              </button>
                {/* View Trade Terms Button */}
              <button
                className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold transition"
                onClick={() => setShowTradeTerms(true)}
              >
                View Trade Terms
              </button>

                {/* Secondary Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleToggleWishlist}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                      isWishlisted
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`inline w-4 h-4 mr-2 ${isWishlisted ? 'fill-red-500' : ''}`} />
                    {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                  </button>
                  
                  <button className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                    <MessageCircle className="inline w-4 h-4 mr-2" />
                    Ask Queries
                  </button>
                  
                  <button className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Share2 className="inline w-4 h-4 mr-2" />
                    Share
                  </button>
                </div>
              </div>

              {/* Product Features */}
              <div className="border-t pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-green-600" />
                    Quality Assured
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="w-4 h-4 text-blue-600" />
                    Fast Delivery
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4 text-purple-600" />
                    Secure Packaging
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          {product.detailedDescription && (
            <div className="border-t bg-gray-50 p-6">
              <h3 className="text-xl font-semibold mb-4">Detailed Information</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{product.detailedDescription}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg animate-bounce z-50 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : notification.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && <span className="text-xl">✅</span>}
                {notification.type === 'error' && <span className="text-xl">❌</span>}
                {notification.type === 'info' && <span className="text-xl">ℹ️</span>}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{notification.message}</p>
                {notification.type === 'success' && tradeRequestSent && (
                  <p className="text-xs mt-1 opacity-90">Redirecting to trade requests...</p>
                )}
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-auto -mx-1.5 -my-1.5 text-white hover:bg-black hover:bg-opacity-20 rounded-lg p-1.5"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>
          </div>
        )}

        {/* Legacy cart success message - keeping for cart operations */}
        {addedToCart && !notification && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
            Added to Cart Successfully!
          </div>
        )}

        {/* Trade Terms Modal */}
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
    </div>
  );
};

export default ProductPage;