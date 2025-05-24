import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Banner from '../components/Banner';
import Navbar from '../components/navbar';
import productService from '../../services/product.service';
import { Product } from '../../types/product';

const Homepage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: 0,
    maxPrice: 0
  });

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching products for marketplace...');
      const response = await productService.getAllProducts();
      
      if (response.success) {
        setProducts(response.products);
        console.log('Products loaded successfully:', response.products.length);
      } else {
        setError(response.message || 'Failed to load products');
        console.error('Failed to fetch products:', response.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      fetchProducts();
      return;
    }

    setLoading(true);
    setSearchTerm(term);
    
    try {
      const response = await productService.searchProducts(term, filters);
      if (response.success) {
        setProducts(response.products);
      } else {
        setError(response.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProducts = () => {
    if (loading) {
      return (
        <div className="flex flex-wrap gap-8">
          {[...Array(8)].map((_, index) => (
            <ProductCard key={index} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Products</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'No products are currently available'}
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  fetchProducts();
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-8">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product}
            onClick={() => window.location.href = `/buyer/product-page?id=${product.id}`}
          />
        ))}
      </div>
    );
  };

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
          <Navbar onSearch={handleSearch} />
        </div>

        {/* Scrollable Content */}
        <div className="p-6 mt-28">
          <div className="mt-6">
            <Banner />
          </div>
          
          {/* Products Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchTerm ? `Search Results for "${searchTerm}"` : 'Available Products'}
              </h2>
              <div className="text-sm text-gray-600">
                {!loading && `${products.length} products found`}
              </div>
            </div>
            
            {renderProducts()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
