/**
 * AI Commodity Selection Page (Seller)
 * Shows mainstream + niche commodity options based on search query
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Package, Sparkles, Database, ArrowLeft, Users, Gem } from 'lucide-react';
import { searchCommodities } from '../../services/ai.service';
import { CommodityOption, CommoditySearchResult } from '../../types/aiTypes';

type AIMode = 'core' | 'niche';

interface LocationState {
  commodity?: string;
  country?: string;
  port?: string;
  priceMin?: number;
  priceMax?: number;
  aiMode?: AIMode;
}

const SellerAISelectPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  // Get AI mode from navigation state (default to 'core')
  const aiMode = state?.aiMode || 'core';

  const [searchQuery, setSearchQuery] = useState(state?.commodity || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CommoditySearchResult | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityOption | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search on mount if commodity was passed
  useEffect(() => {
    if (state?.commodity) {
      handleSearch(state.commodity);
    }
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await searchCommodities({ query, limit: 20 });
      setResults(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const handleSelectCommodity = (commodity: CommodityOption) => {
    setSelectedCommodity(commodity);
  };

  const handleContinue = () => {
    if (!selectedCommodity) return;

    navigate('/seller/search-result', {
      state: {
        commodity: selectedCommodity.name,
        hsCode: selectedCommodity.hsCode,
        country: state?.country,
        port: state?.port,
        priceMin: state?.priceMin,
        priceMax: state?.priceMax,
        isMainstream: selectedCommodity.isMainstream,
        isNiche: !selectedCommodity.isMainstream || aiMode === 'niche',
        aiMode,
        source: selectedCommodity.source,
      },
    });
  };

  const getSourceIcon = (source: CommodityOption['source']) => {
    switch (source) {
      case 'mainstream':
        return <Database className="w-4 h-4 text-blue-500" />;
      case 'platform':
        return <Package className="w-4 h-4 text-green-500" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  const getSourceLabel = (source: CommodityOption['source']) => {
    switch (source) {
      case 'mainstream':
        return 'Standard Commodity';
      case 'platform':
        return 'From Platform Products';
      case 'ai':
        return 'AI Suggested';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Find Buyers
              </h1>
              <p className="text-gray-600">
                Select the commodity you want to find buyers for
              </p>
            </div>
            {/* AI Mode Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              aiMode === 'niche'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {aiMode === 'niche' ? (
                <>
                  <Gem className="w-4 h-4" />
                  Niche AI Mode
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Core AI Mode
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search commodities (e.g., Coffee, Rice, Steel)..."
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => handleSearch(searchQuery)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="loading-spinner" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="space-y-6">
            {/* Mainstream Commodities */}
            {results.mainstream.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-500" />
                  Standard Commodities
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {results.mainstream.map((commodity, index) => (
                    <motion.button
                      key={`mainstream-${index}`}
                      onClick={() => handleSelectCommodity(commodity)}
                      className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        selectedCommodity?.name === commodity.name && selectedCommodity?.source === commodity.source
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : ''
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-3">
                        {getSourceIcon(commodity.source)}
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{commodity.name}</p>
                          {commodity.hsCode && (
                            <p className="text-sm text-gray-500">HS: {commodity.hsCode}</p>
                          )}
                          {commodity.category && (
                            <p className="text-xs text-gray-400">{commodity.category}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Niche Commodities */}
            {results.niche.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Niche Commodities
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {results.niche.map((commodity, index) => (
                    <motion.button
                      key={`niche-${index}`}
                      onClick={() => handleSelectCommodity(commodity)}
                      className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        selectedCommodity?.name === commodity.name && selectedCommodity?.source === commodity.source
                          ? 'bg-purple-50 border-l-4 border-l-purple-500'
                          : ''
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-3">
                        {getSourceIcon(commodity.source)}
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{commodity.name}</p>
                          {commodity.hsCode && (
                            <p className="text-sm text-gray-500">HS: {commodity.hsCode}</p>
                          )}
                          <p className="text-xs text-gray-400">{getSourceLabel(commodity.source)}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {results.mainstream.length === 0 && results.niche.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No commodities found for "{searchQuery}"</p>
                <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {/* Continue Button */}
        {selectedCommodity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6"
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Selected:</p>
                <p className="font-semibold text-gray-900">{selectedCommodity.name}</p>
              </div>
              <button
                onClick={handleContinue}
                className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                Find Buyers
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SellerAISelectPage;
