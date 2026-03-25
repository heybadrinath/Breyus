/**
 * AI Commodity Selection Page (Buyer)
 *
 * Shows mainstream + niche commodity options based on search query.
 * Handles navigation from both Commodity AI and Niche AI pages.
 *
 * Sources:
 * - 'commodity-ai': User searched from Commodity AI page
 * - 'niche-ai': User searched from Niche AI page
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronRight,
  Package,
  Sparkles,
  Database,
  ArrowLeft,
  Boxes,
  Info,
} from 'lucide-react';
import { searchCommodities } from '../../services/ai.service';
import { CommodityOption, CommoditySearchResult } from '../../types/aiTypes';

interface LocationState {
  commodity: string;
  country?: string;
  port?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  priceUnit?: string;
  source?: 'commodity-ai' | 'niche-ai';
  isMainstream?: boolean;
}

const AISelectPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [searchQuery, setSearchQuery] = useState(state?.commodity || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CommoditySearchResult | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityOption | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Determine source page for styling
  const isFromNicheAI = state?.source === 'niche-ai';

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

    navigate('/buyer/ai-result', {
      state: {
        commodity: selectedCommodity.name,
        hsCode: selectedCommodity.hsCode,
        country: state?.country,
        port: state?.port,
        priceMin: state?.priceMin,
        priceMax: state?.priceMax,
        currency: state?.currency,
        priceUnit: state?.priceUnit,
        isMainstream: selectedCommodity.isMainstream,
        source: selectedCommodity.source,
        aiMode: state?.source || 'commodity-ai', // Pass which AI mode was used
      },
    });
  };

  const handleBack = () => {
    // Navigate back to the source page
    if (isFromNicheAI) {
      navigate('/buyer/ai-niche');
    } else {
      navigate('/buyer/ai');
    }
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

  // Dynamic styling based on source - using full class names for Tailwind compilation
  const iconColorClass = isFromNicheAI ? 'text-purple-500' : 'text-blue-500';
  const badgeBgClass = isFromNicheAI ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
  const focusRingClass = isFromNicheAI ? 'focus:ring-purple-500' : 'focus:ring-blue-500';
  const spinnerClass = isFromNicheAI
    ? 'border-purple-200 border-t-purple-600'
    : 'border-blue-200 border-t-blue-600';
  const emptyStateBtnClass = isFromNicheAI
    ? 'bg-purple-600 hover:bg-purple-700'
    : 'bg-blue-600 hover:bg-blue-700';
  const bgGradient = isFromNicheAI
    ? 'from-purple-50 via-white to-indigo-50'
    : 'from-gray-50 to-gray-100';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} p-6`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {isFromNicheAI ? 'Niche AI' : 'Commodity AI'}
          </button>

          <div className="flex items-center gap-3 mb-2">
            {isFromNicheAI ? (
              <Sparkles className={`w-8 h-8 ${iconColorClass}`} />
            ) : (
              <Boxes className={`w-8 h-8 ${iconColorClass}`} />
            )}
            <h1 className="text-3xl font-bold text-gray-900">Select Commodity</h1>
          </div>
          <p className="text-gray-600">
            Choose the specific commodity you're looking for
          </p>

          {/* Source indicator */}
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 ${badgeBgClass} rounded-full text-sm`}>
            <Info className="w-3 h-3" />
            Searching from: {isFromNicheAI ? 'Niche AI' : 'Commodity AI'}
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
            className={`w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${focusRingClass} focus:border-transparent`}
          />
          <button
            onClick={() => handleSearch(searchQuery)}
            disabled={loading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 border-4 ${spinnerClass} rounded-full animate-spin`} />
              <p className="mt-4 text-gray-500">Searching commodities...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">Search Error</p>
              <p className="text-sm">{error}</p>
            </div>
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
                  <span className="text-sm font-normal text-gray-500">
                    ({results.mainstream.length})
                  </span>
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
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
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
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
                  <span className="text-sm font-normal text-gray-500">
                    ({results.niche.length})
                  </span>
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
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
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
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
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No commodities found for "{searchQuery}"</p>
                <p className="text-sm text-gray-400 mt-2">Try a different search term</p>
                <button
                  onClick={handleBack}
                  className={`mt-4 px-4 py-2 ${emptyStateBtnClass} text-white rounded-lg transition-colors`}
                >
                  Search Again
                </button>
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
                <p className="text-xs text-gray-500">
                  {selectedCommodity.isMainstream ? 'Standard Commodity' : 'Niche Commodity'}
                </p>
              </div>
              <button
                onClick={handleContinue}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  isFromNicheAI
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AISelectPage;
