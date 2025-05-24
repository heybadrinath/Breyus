import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/navbar';
import wishlistService, { WishlistItem } from '../../services/wishlist.service';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial wishlist items
    const items = wishlistService.getWishlistItems();
    setWishlistItems(items);
    setLoading(false);

    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      const updatedItems = wishlistService.getWishlistItems();
      setWishlistItems(updatedItems);
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
    };
  }, []);

  const handleRemoveFromWishlist = (productId: string) => {
    wishlistService.removeFromWishlist(productId);
  };

  const handleClearWishlist = () => {
    wishlistService.clearWishlist();
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="fixed left-0 top-0 h-screen">
          <Sidebar />
        </div>
        <div className="flex-1 ml-64 overflow-y-auto">
          <div className="fixed top-0 right-0 left-64 z-10 p-6">
            <Navbar />
          </div>
          <div className="p-6 mt-28">
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed Sidebar */}
      <div className="fixed left-0 top-0 h-screen">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 overflow-y-auto">
        {/* Fixed Navbar */}
        <div className="fixed top-0 right-0 left-64 z-10 p-6">
          <Navbar />
        </div>

        {/* Wishlist Content */}
        <div className="p-6 mt-28">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Wishlist</h1>
              <p className="text-gray-600">{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved</p>
            </div>
            {wishlistItems.length > 0 && (
              <button
                onClick={handleClearWishlist}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-gray-400 text-6xl mb-4">💝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Wishlist is Empty</h3>
              <p className="text-gray-600 mb-4">
                Save items you love for later by clicking the heart icon on any product.
              </p>
              <button
                onClick={() => window.location.href = '/buyer/homepage'}
                className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="relative">
                  <ProductCard 
                    product={item.product} 
                    onClick={() => window.location.href = `/buyer/product-page?id=${item.productId}`}
                  />
                  <button
                    onClick={() => handleRemoveFromWishlist(item.productId)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    title="Remove from wishlist"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>  
    </div>
  );
};

export default Wishlist;