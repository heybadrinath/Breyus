import React, { useState, useEffect } from "react";
import { Star, Heart, Share2, MessageCircle, ShoppingCart, Package, Shield, Truck, X } from "lucide-react";
import { getProductById, Product } from "../../services/products.service";

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

        const response = await getProductById(productId);

        if (response.statusCode === 200 && response.data) {
          // Transform backend data to match frontend Product interface
          const transformedProduct: Product = {
            id: response.data._id,
            name: response.data.name,
            description: response.data.description,
            detailedDescription: response.data.detailedDescription,
            category: response.data.category,
            hsnCode: response.data.hsnCode,
            price: parseFloat(response.data.price) || 0,
            sku: response.data.sku,
            onSale: response.data.onSale || false,
            discount: parseFloat(response.data.discount) || 0,
            salePrice: parseFloat(response.data.salePrice) || 0,
            costOfGoods: parseFloat(response.data.costOfGoods) || 0,
            profit: parseFloat(response.data.profit) || 0,
            margin: parseFloat(response.data.margin) || 0,
            tags: response.data.tags || [],
            stock: parseInt(response.data.stock) || 0,
            stockUnit: response.data.stockUnit,
            // Fix image URLs by adding backend URL prefix
            productImage: response.data.productImages?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${response.data.productImages[0]}` : '',
            images: response.data.productImages ? response.data.productImages.map((img: string) => `${process.env.REACT_APP_BACKEND_URL}/${img}`) : [],
            primaryImage: response.data.productImages?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${response.data.productImages[0]}` : '',
            createdAt: new Date(response.data.createdAt),
            updatedAt: new Date(response.data.updatedAt),
            moq: response.data.moq,
            moqUnit: response.data.moqUnit,
            preciseDescription: response.data.description,
            sellerName: response.data.sellerName || 'Unknown Seller',
            companyName: response.data.companyName || 'Unknown Company'
          };

          setProduct(transformedProduct);
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
                      className={`flex-shrink-0 w-20 h-20 bg-gray-100 rounded cursor-pointer border-2 ${selectedImageIndex === index ? 'border-blue-500' : 'border-transparent'
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
                <p className="text-gray-600">by {product.companyName || product.sellerName || 'Unknown Company'}</p>
              </div>


              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">₹{(product.salePrice)?product.salePrice.toLocaleString(): product.price.toLocaleString()}</span>
                  {product.onSale && (
                    <>
                      <span className="text-xl text-gray-500 line-through">₹{product.price.toLocaleString()}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                        {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                {product.moq && (
                  <p className="text-sm text-gray-600">Minimum Order Quantity: {product.moq.toString() + ' ' + product.moqUnit}</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
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
                    {product.stock > 0 ? `${product.stock + ' ' + product.stockUnit} available` : 'Out of stock'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button

                  disabled={isAddingToCart || product.stock === 0}
                  className={`w-full py-3 px-6 rounded-lg text-lg font-semibold transition-all ${false
                      ? 'bg-green-500 text-white cursor-default'
                      : product.stock === 0
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
                  ) : false ? (
                    <>
                      <ShoppingCart className="inline w-5 h-5 mr-2" />
                      In Cart ✓
                    </>
                  ) : product.stock === 0 ? (
                    'Out of Stock'
                  ) : (
                    <>
                      <ShoppingCart className="inline w-5 h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </button>


                <button
                  className="w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold transition"
                  onClick={() => { }}
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
                    // onClick={handleToggleWishlist}
                    className={`flex-1 py-2 px-4 rounded-lg border transition-all ${isWishlisted
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
          <div className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg animate-bounce z-50 ${notification.type === 'success'
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

      </div>
    </div>
  );
};

export default ProductPage;