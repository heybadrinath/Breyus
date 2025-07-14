import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProductCard from '../components/ProductCard';
import Banner from '../components/Banner';
import Navbar from '../components/navbar';
import { getProductsWithPagination, PaginationParams, Product } from '../../services/products.service';


const Homepage: React.FC = () => {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: 0,
    maxPrice: 0
  });

  const observer = useRef<IntersectionObserver | null>(null);
  const lastProductRef = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(async (page: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: PaginationParams = {
        page,
        limit: 30,
        search: searchTerm || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice > 0 ? filters.maxPrice : undefined
      };

      const response = await getProductsWithPagination(params);
      
      // Transform backend data to match frontend Product interface
      const transformedProducts: Product[] = response.data.map((item: any) => ({
        id: item._id,
        name: item.name,
        description: item.description,
        detailedDescription: item.detailedDescription,
        category: item.category,
        hsnCode: item.hsnCode,
        price: parseFloat(item.price) || 0,
        currency: item.currency,
        sku: item.sku,
        onSale: item.onSale || false,
        discount: parseFloat(item.discount) || 0,
        salePrice: parseFloat(item.salePrice) || 0,
        costOfGoods: parseFloat(item.costOfGoods) || 0,
        profit: parseFloat(item.profit) || 0,
        margin: parseFloat(item.margin) || 0,
        tags: item.tags || [],
        stock: parseInt(item.stock) || 0,
        stockUnit: item.stockUnit,
        // Fix image URLs by adding backend URL prefix
        productImage: item.productImages?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${item.productImages[0]}` : '',
        images: item.productImages ? item.productImages.map((img: string) => `${process.env.REACT_APP_BACKEND_URL}/${img}`) : [],
        primaryImage: item.productImages?.[0] ? `${process.env.REACT_APP_BACKEND_URL}/${item.productImages[0]}` : '',
        testReport: item.testReport? `${process.env.REACT_APP_BACKEND_URL}/${item.testReport}`: '',
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        moq: item.moq,
        moqUnit: item.moqUnit,
        preciseDescription: item.description,
        sellerName: item.sellerName || 'Unknown Seller',
        companyName: item.companyName || 'Unknown Company'
      }));

     
      
      if (isInitial) {
        setProducts(transformedProducts);
      } else {
        setProducts(prev => [...prev, ...transformedProducts]);
      }
      
      setCurrentPage(response.pagination.currentPage);
      setHasNextPage(response.pagination.hasNextPage);
      setTotalProducts(response.pagination.totalProducts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, filters]);

  // Load initial products
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    loadProducts(1, true);
  }, [searchTerm, filters]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (loading || loadingMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !loadingMore) {
        loadProducts(currentPage + 1);
      }
    });

    if (lastProductRef.current) {
      observer.current.observe(lastProductRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasNextPage, currentPage, loadProducts]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
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
              onClick={() => loadProducts(1, true)}
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
                onClick={() => setSearchTerm('')}
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
        {products.map((product, index) => {
          if (products.length === index + 1) {
            return (
              <div key={product.id} ref={lastProductRef}>
                <ProductCard 
                  product={product}
                  onClick={() => navigate(`/buyer/product-page?id=${product.id}`)}
                />
              </div>
            );
          } else {
            return (
              <ProductCard 
                key={product.id}
                product={product}
                onClick={() => navigate(`/buyer/product-page?id=${product.id}`)}
              />
            );
          }
        })}
        {loadingMore && (
          <div className="w-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
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
                {!loading && `${totalProducts} products found`}
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
