import React, { useEffect, useState} from 'react';
import ProductCard from '../components/ProductCard';
import { SearchHeader } from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import { getWishlist } from '../../services/wishlist.service';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  useEffect(() => {
    getWishlist().then(setWishlistItems).catch(() => setWishlistItems([]));
  }, []);

  return (
  
      <div>
        <div className="fixed top-0 right-0 left-64 z-10 p-6"><SearchHeader /></div>
        <div className="mt-28 px-6">
          <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
          {wishlistItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-gray-400 text-6xl mb-4">💝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Wishlist is Empty</h3>
              <button onClick={() => navigate('/buyer/homepage')} className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">Browse Products</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-6 m-0">
              {wishlistItems.map(product => (
                <div key={product.id} className="relative">
                  <ProductCard
                    product={product}
                    onClick={() => navigate(`/buyer/product-page?id=${product.id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
};

export default Wishlist;
