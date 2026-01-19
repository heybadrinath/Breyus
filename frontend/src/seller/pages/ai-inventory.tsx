import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Search,
  Package,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { getSellerInventory } from "../../services/ai.service";
import { SellerInventoryItem, SellerInventoryResult } from "../../types/aiTypes";

type AIMode = 'core' | 'niche';

interface LocationState {
  aiMode?: AIMode;
}

/**
 * Seller AI Inventory Page
 *
 * Displays the seller's products in a table format
 * Allows selecting a product to search for potential buyers
 */

const SellerAIInventory: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  // Get AI mode from navigation state (default to 'core')
  const aiMode = state?.aiMode || 'core';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<SellerInventoryResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  // Set initial tab based on aiMode from landing page
  const [activeTab, setActiveTab] = useState<'normal' | 'niche'>(aiMode === 'niche' ? 'niche' : 'normal');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSellerInventory();
      setInventory(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId === selectedProduct ? null : productId);
  };

  const handleSearchBuyers = () => {
    if (!selectedProduct) {
      alert("Please select a product first");
      return;
    }

    const product = inventory?.products.find(p => p._id === selectedProduct);

    navigate('/seller/ai-result', {
      state: {
        productId: selectedProduct,
        productName: product?.name,
        productCategory: product?.category,
        searchType: 'from-product',
        aiMode,
        isNiche: aiMode === 'niche' || activeTab === 'niche',
        loading: true,
      },
    });
  };

  const filteredProducts = inventory?.products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.hsnCode.toLowerCase().includes(searchQuery.toLowerCase());

    // For now, all products are in 'normal' tab
    // Can add niche detection logic later
    return matchesSearch;
  }) || [];

  const formatPrice = (price: string, currency: string, unit: string) => {
    return `${currency} ${price}/${unit || 'unit'}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/seller/ai')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Select Product</h1>
                <p className="text-gray-400 text-sm">
                  Choose a product from your inventory to find buyers
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 border-t border-white/10">
            <button
              onClick={() => setActiveTab('normal')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'normal'
                  ? 'text-white border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Products ({inventory?.totalProducts || 0})
            </button>
            <button
              onClick={() => setActiveTab('niche')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'niche'
                  ? 'text-white border-b-2 border-orange-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Niche Commodities
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading your inventory...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchInventory}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "Add products to your inventory first"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/seller/add-products')}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Add Product
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Product Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                      Select
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      MOQ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      HSN Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleProductSelect(product._id)}
                      className={`cursor-pointer transition-colors ${
                        selectedProduct === product._id
                          ? 'bg-orange-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedProduct === product._id
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedProduct === product._id && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.productImages?.[0] ? (
                              <img
                                src={product.productImages[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.selectedIncoterm && (
                              <span className="text-xs text-gray-500">
                                {product.selectedIncoterm}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{product.category || '-'}</td>
                      <td className="px-4 py-4 text-gray-900 font-medium">
                        {formatPrice(product.price, product.currency, product.priceUnit)}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {product.stock} {product.stockUnit}
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {product.moq} {product.moqUnit}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm text-gray-600">
                          {product.hsnCode || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          product.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg"
            >
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="text-gray-600">
                  {selectedProduct ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      1 product selected
                    </span>
                  ) : (
                    <span>Select a product to search for buyers</span>
                  )}
                </div>
                <button
                  onClick={handleSearchBuyers}
                  disabled={!selectedProduct}
                  className={`flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all ${
                    selectedProduct
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Search Buyers
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerAIInventory;
