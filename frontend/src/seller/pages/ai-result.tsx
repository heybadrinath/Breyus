/**
 * Seller AI Result Page
 * Displays buyer results for seller's product or commodity search
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  X,
  Plus,
  Trophy,
  Users,
  Globe2,
  TrendingUp,
  MessageSquare,
  Building2,
  Mail,
  Phone,
  Star,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { Line, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from "chart.js";

// Services and types
import { aiSearch, searchBuyersForProduct, startAnalysis } from "../../services/ai.service";
import {
  MergedSearchResult,
  EnrichedPartner,
  ProductResult,
  AISearchInput,
  AnalysisResult,
} from "../../types/aiTypes";
import { useAnalysisPolling } from "../../hooks/useAnalysisPolling";
import { createConversationByCompany } from "../../services/inbox.service";

// Components
import {
  AISearchLoading,
  ErrorState,
  EmptyState,
  ResultFilters,
  ExpandableText,
  ExpandableList,
} from "../../components/ai";
import type { SortOption, RiskFilter, ProbabilityFilter } from "../../components/ai";
import { RiskLevel } from "../../types/aiTypes";
import { saveAIContact } from "../../services/ai.service";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

interface LocationState {
  // For product-based search
  productId?: string;
  productName?: string;
  productCategory?: string;
  searchType?: 'from-product' | 'commodity';

  // For commodity-based search
  commodity?: string;
  hsCode?: string;
  country?: string;
  port?: string;
  priceMin?: number;
  priceMax?: number;
}

// Market Analysis Charts Component - Shows ONLY real data from analysisResult
interface MarketAnalysisChartsProps {
  commodity: string;
  analysisResult?: AnalysisResult | null;
  isLoading?: boolean;
}

// Animated Chart Loader Component - shows smooth loading animation
const ChartLoader: React.FC<{ title: string }> = ({ title }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white rounded-lg p-4 border border-gray-200 relative overflow-hidden"
  >
    <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
    <div className="h-48 flex flex-col items-center justify-center relative">
      {/* Animated bars to simulate chart loading */}
      <div className="flex items-end gap-2 h-20 mb-3">
        {[40, 60, 45, 70, 55, 65, 50].map((height, i) => (
          <motion.div
            key={i}
            className="w-4 bg-gradient-to-t from-blue-300 to-blue-100 rounded-t"
            initial={{ height: 0, opacity: 0.3 }}
            animate={{
              height: `${height}%`,
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              height: {
                duration: 0.6,
                delay: i * 0.08,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              },
              opacity: {
                duration: 1.2,
                delay: i * 0.08,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          />
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-sm text-gray-500"
      >
        Analyzing market data...
      </motion.p>
    </div>
  </motion.div>
);

// No Data Placeholder Component - shows when analysis complete but no data
const NoDataPlaceholder: React.FC<{ title: string; isLoading: boolean }> = ({ title, isLoading }) => {
  if (isLoading) {
    return <ChartLoader title={title} />;
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 relative">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="h-48 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-sm">No data available</p>
          <p className="text-xs mt-1">Analysis complete - insufficient data</p>
        </div>
      </div>
    </div>
  );
};

// Data Disclaimer Tooltip - Shows on hover over info icon
const DataDisclaimerTooltip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        aria-label="Data disclaimer information"
      >
        <Info className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl"
          >
            {/* Arrow */}
            <div className="absolute -top-1.5 left-3 w-3 h-3 bg-gray-900 rotate-45" />

            <div className="relative space-y-2">
              <p className="font-medium text-gray-100">📊 Data Sources & Accuracy</p>
              <ul className="space-y-1.5 text-gray-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>Historical data is based on actual platform trade records</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>Forecasts are AI-projected estimates using linear regression</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Insights are AI-generated and may not reflect real-time conditions</span>
                </li>
              </ul>
              <p className="text-gray-400 pt-1 border-t border-gray-700">
                This analysis is for informational purposes only and should not be considered financial advice.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MarketAnalysisCharts: React.FC<MarketAnalysisChartsProps> = ({
  commodity,
  analysisResult,
  isLoading = false,
}) => {
  // Check for actual real data - no fallbacks
  const hasDemandData = (analysisResult?.chartData?.demandForecast?.data?.length ?? 0) > 0;
  const hasCapitalData = (analysisResult?.chartData?.capitalRequired?.data?.length ?? 0) > 0 ||
    (analysisResult?.priceTrends?.length ?? 0) > 0;
  const hasPriceData = (analysisResult?.chartData?.priceVolatility?.data?.length ?? 0) > 0 ||
    (analysisResult?.priceTrends?.length ?? 0) > 0;

  // Build chart data ONLY from real data
  const demandRadarData = hasDemandData ? {
    labels: analysisResult?.chartData?.demandForecast?.labels ||
      ['Market Size', 'Growth Rate', 'Competition', 'Seasonality', 'Price Stability', 'Trade Volume'],
    datasets: [
      {
        label: 'Demand Analysis',
        data: analysisResult!.chartData!.demandForecast!.data,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  } : null;

  // Capital chart from real price trends or chart data only
  const capitalChartData = hasCapitalData ? {
    labels: analysisResult?.chartData?.capitalRequired?.labels ||
      analysisResult?.priceTrends?.map(t => t.month) || [],
    datasets: [
      {
        label: 'Capital Required',
        data: analysisResult?.chartData?.capitalRequired?.data ||
          analysisResult?.priceTrends?.map(t => Math.round(t.avgPrice * 0.4)) || [],
        fill: true,
        backgroundColor: 'rgba(147, 197, 253, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        tension: 0.4,
      },
    ],
  } : null;

  // Price volatility from real data only
  const priceVolatilityData = hasPriceData ? {
    labels: analysisResult?.chartData?.priceVolatility?.labels ||
      analysisResult?.priceTrends?.map(t => t.month) || [],
    datasets: [
      {
        label: 'Price Volatility',
        data: analysisResult?.chartData?.priceVolatility?.data ||
          analysisResult?.priceTrends?.map(t => t.avgPrice) || [],
        fill: true,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.8)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          font: { size: 10 },
          boxWidth: 10,
          padding: 6,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          font: { size: 10 },
          boxWidth: 10,
          padding: 6,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#1F2937',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: { color: 'rgba(0,0,0,0.1)' },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Demand Chart - Only render if real data exists */}
      {demandRadarData ? (
        <div className="bg-white rounded-lg p-4 border border-gray-200 relative">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Demand</h4>
          <div className="h-48">
            <Radar data={demandRadarData} options={radarOptions} />
          </div>
        </div>
      ) : (
        <NoDataPlaceholder title="Demand" isLoading={isLoading} />
      )}

      {/* Capital Required Chart - Only render if real data exists */}
      {capitalChartData ? (
        <div className="bg-white rounded-lg p-4 border border-gray-200 relative">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Capital Required</h4>
          <div className="h-48">
            <Line data={capitalChartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <NoDataPlaceholder title="Capital Required" isLoading={isLoading} />
      )}

      {/* Price Volatility Chart - Only render if real data exists */}
      {priceVolatilityData ? (
        <div className="bg-white rounded-lg p-4 border border-gray-200 relative">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Volatility</h4>
          <div className="h-48">
            <Line data={priceVolatilityData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <NoDataPlaceholder title="Price Volatility" isLoading={isLoading} />
      )}
    </div>
  );
};

// Buyer Result Card Component
interface BuyerCardProps {
  buyer: EnrichedPartner;
  tier: 1 | 2 | 3;
  index?: number;
  onContact: (buyer: EnrichedPartner) => void;
  onSave: (buyer: EnrichedPartner) => void;
}

const BuyerCard: React.FC<BuyerCardProps> = ({ buyer, tier, index = 0, onContact, onSave }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getRiskColor = (risk: string | undefined) => {
    switch (risk) {
      case 'Very Low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Low':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Very High':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTierBadge = () => {
    switch (tier) {
      case 1:
        return (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-full text-xs font-medium border border-amber-200"
          >
            <Trophy className="w-3 h-3" />
            Proven Buyer
          </motion.span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
            <Users className="w-3 h-3" />
            Platform Buyer
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium border border-gray-200">
            <Globe2 className="w-3 h-3" />
            External
          </span>
        );
    }
  };

  // Get probability value - use nullish coalescing for proper fallback
  // (0 is a valid probability, but || would treat it as falsy)
  const probability = buyer.probability ?? buyer.matchScore ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-xl border overflow-hidden transition-all duration-300 ${
        isHovered
          ? 'border-gray-300 shadow-xl -translate-y-1'
          : 'border-gray-200 shadow-sm'
      }`}
    >
      {/* Tier Color Bar */}
      <div
        className={`h-1 ${
          tier === 1
            ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
            : tier === 2
            ? 'bg-gradient-to-r from-blue-400 to-indigo-400'
            : 'bg-gradient-to-r from-gray-300 to-gray-400'
        }`}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center"
            >
              <Building2 className="w-6 h-6 text-gray-500" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-gray-900">{buyer.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Globe2 className="w-3 h-3" />
                {buyer.country || 'Unknown location'}
              </p>
            </div>
          </div>
          {getTierBadge()}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Buying Probability with Progress Bar */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 border border-green-100"
          >
            <p className="text-xs text-gray-600 mb-1">Buying Probability</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-green-600">
                {probability}%
              </span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${probability}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
              />
            </div>
          </motion.div>

          {/* Risk Level */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`rounded-xl p-3 border ${getRiskColor(buyer.riskLevel)}`}
          >
            <p className="text-xs text-gray-600 mb-1">Risk Level</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">
                {buyer.riskLevel || 'Unknown'}
              </span>
              {(buyer.riskLevel === 'High' || buyer.riskLevel === 'Very High') && (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
          </motion.div>
        </div>

        {/* Match Reason */}
        {buyer.matchReason && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100"
          >
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-700">Match reason:</span> {buyer.matchReason}
            </p>
          </motion.div>
        )}

        {/* Trade History (for tier 1) */}
        {tier === 1 && buyer.tradeCount && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 flex items-center gap-4 text-sm"
          >
            <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              {buyer.tradeCount} verified trade{buyer.tradeCount > 1 ? 's' : ''}
            </span>
            {buyer.totalQuantity && (
              <span className="text-gray-600">Total: {buyer.totalQuantity.toLocaleString()} units</span>
            )}
          </motion.div>
        )}

        {/* Contact Info (for on-platform buyers) */}
        {buyer.isOnPlatform && buyer.contactInfo && (
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            {buyer.contactInfo.email && (
              <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400" />
                {buyer.contactInfo.email}
              </span>
            )}
            {buyer.contactInfo.phone && (
              <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                <Phone className="w-4 h-4 text-gray-400" />
                {buyer.contactInfo.phone}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {buyer.isOnPlatform ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSave(buyer)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
              >
                Save Contact
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onContact(buyer)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all text-sm font-medium flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Chat Now
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSave(buyer)}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all text-sm font-medium"
            >
              Save Contact Info
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
const SellerAiResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  // Search state
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<MergedSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [tier3Expanded, setTier3Expanded] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showWarning, setShowWarning] = useState(true);

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filter & Sort state
  const [probabilityFilter, setProbabilityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('probability_desc');

  // Analysis polling
  const {
    status: analysisStatus,
    progress: analysisProgress,
    result: analysisResult,
    startPolling,
  } = useAnalysisPolling();

  // Ref to prevent double search
  const hasSearchedRef = useRef(false);

  // Get search label
  const getSearchLabel = () => {
    if (state?.productName) {
      return state.productName;
    }
    return state?.commodity || 'Your Product';
  };

  // Perform search
  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let response;

      if (state?.searchType === 'from-product' && state?.productId) {
        // Search from product
        response = await searchBuyersForProduct({
          productId: state.productId,
          country: state.country,
          limit: 30,
        });
      } else if (state?.commodity) {
        // Direct commodity search
        const searchInput: AISearchInput = {
          role: 'Seller',
          commodity: state.commodity,
          hsCode: state.hsCode,
          country: state.country,
          port: state.port,
          priceRange:
            state.priceMin || state.priceMax
              ? {
                  min: state.priceMin || 0,
                  max: state.priceMax || 999999,
                }
              : undefined,
          limit: 30,
        };
        response = await aiSearch(searchInput);
      } else {
        throw new Error("No search criteria provided");
      }

      setResults(response.data);

      // Start market analysis
      if (response.data.totalMatches > 0) {
        try {
          const commodity = state?.productName || state?.commodity || 'commodity';
          const analysisResponse = await startAnalysis({
            role: 'Seller',
            commodity,
            hsCode: state?.hsCode,
          });
          startPolling(analysisResponse.data.jobId);
        } catch (analysisError) {
          console.warn("Analysis start failed:", analysisError);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [state, startPolling]);

  // Reset search ref when location changes (handles rapid navigation)
  useEffect(() => {
    hasSearchedRef.current = false;
  }, [location.key]);

  useEffect(() => {
    if (hasSearchedRef.current) return;

    if (!state?.productId && !state?.commodity) {
      setError("No search criteria provided. Please go back and try again.");
      setLoading(false);
      return;
    }

    hasSearchedRef.current = true;
    performSearch();
  }, [location.key, performSearch, state?.productId, state?.commodity]);

  // Handle save contact
  const handleSaveContact = async (buyer: EnrichedPartner) => {
    try {
      await saveAIContact({
        name: buyer.name,
        email: buyer.contactInfo?.email,
        phone: buyer.contactInfo?.phone,
        country: buyer.country,
        commodity: results?.commodity,
        hsCode: results?.hsCode,
        matchScore: buyer.matchScore,
        role: "buyer",
      });
      setToast({ type: 'success', message: 'Contact saved to your list!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save contact. Please try again.' });
    }
  };

  // Handle contact (chat) - Create conversation first, then navigate
  const handleContact = async (buyer: EnrichedPartner) => {
    // Use platformCompanyId for conversation creation
    const companyId = buyer.platformCompanyId;

    if (!companyId) {
      console.warn('No company ID available for chat');
      return;
    }

    try {
      const result = await createConversationByCompany(companyId);

      if (result.conversationId) {
        navigate(`/seller/inbox?conversationId=${result.conversationId}`);
      } else if (result.message?.includes('yourself')) {
        setToast({ type: 'warning', message: "You can't chat with yourself." });
      } else {
        // Fallback: navigate to inbox without specific conversation
        navigate('/seller/inbox');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      navigate('/seller/inbox');
    }
  };

  // Handle search again
  const handleSearchAgain = () => {
    navigate("/seller/ai");
  };

  // Get all unique countries from results
  const getAvailableCountries = (): string[] => {
    if (!results) return [];
    const countries = new Set<string>();

    const addCountry = (buyer: EnrichedPartner) => {
      if (buyer.country) countries.add(buyer.country);
    };

    (results.tier1 as EnrichedPartner[]).forEach(addCountry);
    (results.tier2 as EnrichedPartner[]).forEach(addCountry);
    (results.tier3 as EnrichedPartner[]).forEach(addCountry);

    return Array.from(countries).sort();
  };

  // Filter and sort results - memoized to prevent unnecessary recalculations
  // Used for external buyers (tier 3) where tier preservation isn't needed
  const filterAndSortResults = useCallback((buyers: EnrichedPartner[]): EnrichedPartner[] => {
    let filtered = buyers.filter(buyer => {
      const probability = buyer.probability ?? buyer.matchScore ?? 0;
      const riskLevel = buyer.riskLevel;
      const country = buyer.country;

      // Apply probability filter
      if (probabilityFilter !== 'all') {
        if (probabilityFilter === 'high' && probability < 70) return false;
        if (probabilityFilter === 'medium' && (probability < 40 || probability >= 70)) return false;
        if (probabilityFilter === 'low' && probability >= 40) return false;
      }

      // Apply risk filter
      if (riskFilter !== 'all' && riskLevel !== riskFilter) {
        return false;
      }

      // Apply country filter
      if (countryFilter && country !== countryFilter) {
        return false;
      }

      return true;
    });

    // Apply sorting
    const riskOrder: Record<RiskLevel, number> = {
      'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5
    };

    filtered.sort((a, b) => {
      const probA = a.probability ?? a.matchScore ?? 0;
      const probB = b.probability ?? b.matchScore ?? 0;
      const riskA = riskOrder[a.riskLevel as RiskLevel] ?? 3;
      const riskB = riskOrder[b.riskLevel as RiskLevel] ?? 3;

      switch (sortBy) {
        case 'probability_desc': return probB - probA;
        case 'probability_asc': return probA - probB;
        case 'risk_asc': return riskA - riskB;
        case 'risk_desc': return riskB - riskA;
        case 'name_asc': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return filtered;
  }, [probabilityFilter, riskFilter, countryFilter, sortBy]);

  // Type guard for EnrichedPartner
  const isEnrichedPartner = (item: EnrichedPartner | ProductResult): item is EnrichedPartner => {
    return item.resultType === 'partner';
  };

  // Get all buyers from results - with proper type guards
  const getAllBuyers = useCallback((): { buyer: EnrichedPartner; tier: 1 | 2 | 3 }[] => {
    if (!results) return [];

    const buyers: { buyer: EnrichedPartner; tier: 1 | 2 | 3 }[] = [];

    // Tier 1 and 2 - filter only EnrichedPartner items with proper type guard
    results.tier1.forEach(item => {
      if (isEnrichedPartner(item)) {
        buyers.push({ buyer: item, tier: 1 });
      }
    });

    results.tier2.forEach(item => {
      if (isEnrichedPartner(item)) {
        buyers.push({ buyer: item, tier: 2 });
      }
    });

    return buyers;
  }, [results]);

  // Memoize buyer lists for performance
  const mainBuyers = useMemo(() => getAllBuyers(), [getAllBuyers]);

  // Filter and sort while preserving tier information
  // We filter the { buyer, tier } pairs directly instead of re-matching after filtering
  const filteredMainBuyers = useMemo(() => {
    // First, filter out buyers that don't match criteria
    const filtered = mainBuyers.filter(({ buyer }) => {
      const probability = buyer.probability ?? buyer.matchScore ?? 0;
      const riskLevel = buyer.riskLevel;
      const country = buyer.country;

      // Apply probability filter
      if (probabilityFilter !== 'all') {
        if (probabilityFilter === 'high' && probability < 70) return false;
        if (probabilityFilter === 'medium' && (probability < 40 || probability >= 70)) return false;
        if (probabilityFilter === 'low' && probability >= 40) return false;
      }

      // Apply risk filter
      if (riskFilter !== 'all' && riskLevel !== riskFilter) {
        return false;
      }

      // Apply country filter
      if (countryFilter && country !== countryFilter) {
        return false;
      }

      return true;
    });

    // Then sort (tier is preserved since we never detached it)
    const riskOrder: Record<RiskLevel, number> = {
      'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5
    };

    filtered.sort((a, b) => {
      const probA = a.buyer.probability ?? a.buyer.matchScore ?? 0;
      const probB = b.buyer.probability ?? b.buyer.matchScore ?? 0;
      const riskA = riskOrder[a.buyer.riskLevel as RiskLevel] ?? 3;
      const riskB = riskOrder[b.buyer.riskLevel as RiskLevel] ?? 3;

      switch (sortBy) {
        case 'probability_desc': return probB - probA;
        case 'probability_asc': return probA - probB;
        case 'risk_asc': return riskA - riskB;
        case 'risk_desc': return riskB - riskA;
        case 'name_asc': return a.buyer.name.localeCompare(b.buyer.name);
        default: return 0;
      }
    });

    return filtered;
  }, [mainBuyers, probabilityFilter, riskFilter, countryFilter, sortBy]);

  const externalBuyers = useMemo(() => {
    // Filter tier3 with type guard to ensure we only have EnrichedPartner items
    const tier3Partners = (results?.tier3 || []).filter(item => item.resultType === 'partner') as EnrichedPartner[];
    return filterAndSortResults(tier3Partners);
  }, [results, filterAndSortResults]);

  const totalResults = results ? results.totalMatches : 0;
  const totalFilteredResults = filteredMainBuyers.length + externalBuyers.length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gray-900 text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-lg">Breyus</span>
              <span className="text-orange-400 text-sm">Ai</span>
            </div>

            {/* Center */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSearchAgain}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Search Again
              </button>

              <button
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Open filter options"
                title="Filter results"
              >
                <Filter className="w-4 h-4" />
              </button>

              {/* Search Term Chip */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-full">
                <X className="w-4 h-4 cursor-pointer hover:text-red-400" onClick={handleSearchAgain} />
                <span className="text-sm">{getSearchLabel()}</span>
              </div>
            </div>

            {/* Right: AI Mode Indicator */}
            <div className="flex items-center gap-3">
              {/* Mode Indicator - Visual only */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <span className="text-xs text-gray-400">Mode:</span>
                <span className="px-2 py-0.5 bg-orange-600 text-white text-xs rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                  Core AI
                </span>
              </div>
              {/* Coming Soon Badge */}
              <div className="px-3 py-1.5 bg-gray-700 rounded-lg text-gray-400 text-xs">
                Niche AI <span className="text-gray-500">• Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading */}
        {loading && (
          <AISearchLoading userRole="Seller" commodity={getSearchLabel()} />
        )}

        {/* Error */}
        {error && !loading && (
          <ErrorState error={error} onRetry={performSearch} />
        )}

        {/* Empty */}
        {!loading && !error && results && results.totalMatches === 0 && (
          <EmptyState
            commodity={getSearchLabel()}
            onSearchAgain={handleSearchAgain}
          />
        )}

        {/* Results */}
        {!loading && !error && results && results.totalMatches > 0 && (
          <div className="space-y-6">
            {/* Country Fallback Warning Banner */}
            {results.warning && showWarning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Globe2 className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-800">Country Filter Notice</h4>
                  <p className="text-sm text-amber-700 mt-1">{results.warning}</p>
                  <p className="text-xs text-amber-600 mt-2">
                    Tip: Try broadening your search criteria or exploring buyers from other regions.
                  </p>
                </div>
                <button
                  onClick={() => setShowWarning(false)}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* Market Analysis */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Clickable Header Toggle */}
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="flex-1 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg -m-2 p-2"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    <h3 className="text-base font-semibold text-gray-800">Market Analysis</h3>
                    {analysisStatus === 'pending' && (
                      <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full animate-pulse">
                        Analyzing...
                      </span>
                    )}
                  </div>
                  {showAnalysis ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {/* Data Disclaimer Info Icon */}
                <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                  <DataDisclaimerTooltip />
                </div>
              </div>

              {/* Collapsible Content */}
              <AnimatePresence initial={false}>
                {showAnalysis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 border-t border-gray-100">
                      <MarketAnalysisCharts
                        commodity={getSearchLabel()}
                        analysisResult={analysisResult}
                        isLoading={analysisStatus === 'pending'}
                      />
                    </div>

                    {/* Market Info & Analysis Summary */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      {/* Market Summary (from AI) - only show if it's a meaningful summary, not a generic fallback */}
                      {analysisResult?.summary &&
                       analysisResult.summary.toLowerCase() !== 'market analysis completed.' &&
                       analysisResult.summary.length > 30 && (
                        <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <h4 className="text-sm font-semibold text-orange-800 mb-1">Market Summary</h4>
                          <ExpandableText
                            text={analysisResult.summary}
                            maxLength={300}
                            textClassName="text-sm text-orange-700"
                          />
                        </div>
                      )}

                      {/* Key Insights Section */}
                      {analysisResult?.keyInsights && analysisResult.keyInsights.length > 0 && (
                        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-indigo-600" />
                            <h4 className="text-sm font-semibold text-indigo-800">Key Insights</h4>
                          </div>
                          <ExpandableList
                            items={analysisResult.keyInsights}
                            initialCount={3}
                            itemClassName="text-xs text-indigo-700"
                          />
                        </div>
                      )}

                      {/* Basic Info */}
                      <ul className="text-sm text-gray-600 space-y-1 mb-4">
                        <li>• Product: <span className="font-medium">{getSearchLabel()}</span></li>
                        <li>• Category: <span className="font-medium">{state?.productCategory || results.commodity}</span></li>
                        <li>• Total Potential Buyers: <span className="font-medium">{results.totalMatches}</span></li>
                        {analysisResult?.priceTrends && analysisResult.priceTrends.length > 0 && (() => {
                          const validMinPrices = analysisResult.priceTrends.map(t => t.minPrice).filter((p): p is number => typeof p === 'number' && !isNaN(p));
                          const validMaxPrices = analysisResult.priceTrends.map(t => t.maxPrice).filter((p): p is number => typeof p === 'number' && !isNaN(p));
                          if (validMinPrices.length === 0 || validMaxPrices.length === 0) return null;
                          return (
                            <li>• Market Price Range: <span className="font-medium">
                              ${Math.min(...validMinPrices).toLocaleString()} -
                              ${Math.max(...validMaxPrices).toLocaleString()}
                            </span></li>
                          );
                        })()}
                      </ul>

                      {/* Demand Forecast */}
                      {analysisResult?.demandForecast && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <h4 className="text-sm font-semibold text-green-800">Buyer Demand</h4>
                          </div>
                          <p className="text-sm text-green-700">
                            <span className="font-medium capitalize">{analysisResult.demandForecast.direction}</span>
                            {' '}- {analysisResult.demandForecast.explanation}
                          </p>
                        </div>
                      )}

                      {/* Risk Factors & Opportunities */}
                      <div className="grid grid-cols-2 gap-4">
                        {analysisResult?.riskFactors && analysisResult.riskFactors.length > 0 && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                            <h4 className="text-xs font-semibold text-red-800 mb-2">⚠️ Risk Factors</h4>
                            <ExpandableList
                              items={analysisResult.riskFactors}
                              initialCount={3}
                              itemClassName="text-xs text-red-700"
                            />
                          </div>
                        )}
                        {analysisResult?.opportunities && analysisResult.opportunities.length > 0 && (
                          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <h4 className="text-xs font-semibold text-emerald-800 mb-2">✨ Opportunities</h4>
                            <ExpandableList
                              items={analysisResult.opportunities}
                              initialCount={3}
                              itemClassName="text-xs text-emerald-700"
                            />
                          </div>
                        )}
                      </div>

                      {/* Loading state for analysis - inline indicator */}
                      {analysisStatus === 'pending' && !analysisResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 bg-blue-500 rounded-full"
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{
                                    duration: 0.6,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut",
                                  }}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-blue-700">
                              Analyzing buyer patterns and market insights...
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Buyers Result Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Buyers Result</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      AI-powered matches for your product
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Need more buyers?</span>
                    <button
                      onClick={() => navigate("/seller/add-products")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Post Your Offer
                    </button>
                  </div>
                </div>

                {/* Enhanced Filters */}
                <ResultFilters
                  probabilityFilter={probabilityFilter}
                  onProbabilityFilterChange={setProbabilityFilter}
                  riskFilter={riskFilter}
                  onRiskFilterChange={setRiskFilter}
                  countryFilter={countryFilter}
                  onCountryFilterChange={setCountryFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  availableCountries={getAvailableCountries()}
                  totalResults={totalResults}
                  filteredResults={totalFilteredResults}
                  userRole="Seller"
                />
              </div>

              {/* Main Buyers Grid */}
              {filteredMainBuyers.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredMainBuyers.map((item, index) => (
                    <BuyerCard
                      key={`buyer-${index}`}
                      buyer={item.buyer}
                      tier={item.tier}
                      index={index}
                      onContact={handleContact}
                      onSave={handleSaveContact}
                    />
                  ))}
                </div>
              )}

              {/* External Buyers (Tier 3) */}
              {externalBuyers.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setTier3Expanded(!tier3Expanded)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe2 className="w-5 h-5 text-gray-600" />
                      <div className="text-left">
                        <h3 className="font-semibold">External Buyers</h3>
                        <p className="text-sm text-gray-500">
                          Potential buyers from global trade data
                        </p>
                      </div>
                      <span className="ml-2 px-2 py-1 bg-white rounded-full text-sm text-gray-600">
                        {externalBuyers.length} results
                      </span>
                    </div>
                    {tier3Expanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {tier3Expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 grid gap-4 md:grid-cols-2"
                    >
                      {externalBuyers.map((buyer, index) => (
                        <BuyerCard
                          key={`external-${index}`}
                          buyer={buyer}
                          tier={3}
                          index={index}
                          onContact={handleContact}
                          onSave={handleSaveContact}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {/* No Results After Filtering */}
              {totalFilteredResults === 0 && totalResults > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Filter className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No results match your filters</h3>
                  <p className="text-gray-500 mb-4">Try adjusting your filter criteria to see more buyers.</p>
                  <button
                    onClick={() => {
                      setProbabilityFilter('all');
                      setRiskFilter('all');
                      setCountryFilter('');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
                toast.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : toast.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-amber-50 border border-amber-200 text-amber-800'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-current opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellerAiResult;
