import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Banner from '../components/Banner';
import { SearchHeader } from '../../components/Header';
import Pagination from '../../components/Pagination';
import CategoryFilterDropdown from '../../components/CategoryFilterDropdown';
import { getProductsWithPagination, PaginationParams, Product } from '../../services/products.service';
import { getImageUrl, getFileUrl } from '../../utils/imageUtils';

type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'name_az' | 'name_za';

const Homepage: React.FC = () => {

  const navigate = useNavigate();
  // Issue #19 - Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const entriesPerPage = 30;
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: 0,
    maxPrice: 0
  });

  // Issue #19 - Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadProducts = useCallback(async (page: number) => {
    try {
      // Issue #19 - Only set loading if still mounted
      if (!isMountedRef.current) return;
      setLoading(true);

      const params: PaginationParams = {
        page,
        limit: entriesPerPage,
        search: searchTerm || undefined,
        category: filters.category || undefined,
        minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice > 0 ? filters.maxPrice : undefined
      };

      const response = await getProductsWithPagination(params);

      // Issue #19 - Check if still mounted before updating state
      if (!isMountedRef.current) return;

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
        // Fix image URLs using centralized utility for local/Docker/production support
        productImage: getImageUrl(item.productImages?.[0], ''),
        images: item.productImages ? item.productImages.map((img: string) => getImageUrl(img, '')) : [],
        primaryImage: getImageUrl(item.productImages?.[0], ''),
        testReport: getFileUrl(item.testReport),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        moq: item.moq,
        moqUnit: item.moqUnit,
        preciseDescription: item.description,
        sellerName: item.sellerName || 'Unknown Seller',
        companyName: item.companyName || 'Unknown Company',

        // product terms
        revenueMin: item.revenueMin,
        revenueMax: item.revenueMax,
        currencyTrade: item.currencyTrade,
        unitTrade: item.unitTrade,
        yearsTrade: item.yearsTrade,
        industry: item.industry,
        marketYears: item.marketYears,
        sellerMarketYears: item.sellerMarketYears,
        marketcapture: item.marketcapture,

        // intco terms
        selectedIncoterm: item.selectedIncoterm,
        selectedIncotermData: item.selectedIncotermData,
        defaults: item.defaults,
        isFeatured: Boolean(item.isFeatured),
        featuredAt: item.featuredAt ? new Date(item.featuredAt) : undefined,
        featuredBy: item.featuredBy,
      }));

      setAllProducts(transformedProducts);

      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
      setTotalProducts(response.pagination.totalProducts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters, entriesPerPage]);

  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage, loadProducts]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
    setCurrentPage(1);
  };

  const hasSearch = searchTerm.trim().length > 0;

  const sortProducts = (items: Product[], option: SortOption) => {
    const sorted = [...items];
    const getCreatedAt = (item: Product) => item.createdAt?.getTime?.() || 0;
    switch (option) {
      case 'oldest':
        return sorted.sort((a, b) => getCreatedAt(a) - getCreatedAt(b));
      case 'price_low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price_high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name_az':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_za':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'newest':
      default:
        return sorted.sort((a, b) => getCreatedAt(b) - getCreatedAt(a));
    }
  };

  const featuredProducts = !hasSearch
    ? [...allProducts]
        .filter(product => product.isFeatured)
        .sort((a, b) => {
          const aDate = a.featuredAt?.getTime?.() || a.createdAt?.getTime?.() || 0;
          const bDate = b.featuredAt?.getTime?.() || b.createdAt?.getTime?.() || 0;
          return bDate - aDate;
        })
        .slice(0, 8)
    : [];

  const featuredIds = new Set(featuredProducts.map(product => product.id));
  const baseProducts = hasSearch
    ? allProducts.filter(product => !product.isFeatured)
    : allProducts.filter(product => !featuredIds.has(product.id));
  const normalProducts = sortProducts(baseProducts, sortOption);

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
              onClick={() => loadProducts(1)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    if (normalProducts.length === 0) {
      const emptyMessage = hasSearch
        ? 'Try adjusting your search terms'
        : featuredProducts.length > 0
          ? 'No additional products are currently available'
          : 'No products are currently available';
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🛍️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-4">
              {emptyMessage}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8">
        {normalProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => navigate(`/buyer/product-page?id=${product.id}`)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <SearchHeader onSearch={handleSearch} />
      </div>

      {/* Scrollable Content */}
      <div className="px-8 lg:px-12 pb-16">
        {/* Banner Section */}
        <div className="mt-8">
          <Banner />
        </div>

        {/* Featured Products Section */}
        {!hasSearch && featuredProducts.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                  Featured Products
                </h2>
                <p className="mt-1 text-base text-gray-500">
                  Curated picks from top sellers
                </p>
              </div>
              <span className="text-sm font-medium text-gray-400">
                {featuredProducts.length} featured
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={`featured-${product.id}`}
                  product={product}
                  onClick={() => navigate(`/buyer/product-page?id=${product.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Products Section */}
        <section className="mt-14">
          {/* Section Header with Filters */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                {searchTerm ? `Results for "${searchTerm}"` : 'Available Products'}
              </h2>
              {!loading && (
                <p className="mt-1 text-base text-gray-500">
                  {totalProducts} {totalProducts === 1 ? 'product' : 'products'} found
                </p>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              {/* Category Filter */}
              <CategoryFilterDropdown
                value={filters.category}
                onChange={handleCategoryChange}
              />

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="product-sort" className="text-sm font-medium text-gray-500">
                  Sort by
                </label>
                <select
                  id="product-sort"
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value as SortOption)}
                  className="rounded-lg border border-gray-200 bg-white h-11 px-4 text-sm text-gray-700 shadow-sm hover:border-gray-300 focus:border-gray-400 focus:outline-none focus:ring-0 transition-colors"
                >
                  <option value="newest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="name_az">Name: A-Z</option>
                  <option value="name_za">Name: Z-A</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {renderProducts()}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                entriesPerPage={entriesPerPage}
                totalEntries={totalProducts}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Homepage;
