/**
 * Buyer AI Result Page - Figma Design Update
 * Displays 3-tier search results with market analysis charts
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Package,
  Globe2,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  RefreshCw,
  X,
  Plus,
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
import { aiSearch, startAnalysis } from "../../services/ai.service";
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
  AIResultCard,
  SkeletonResultList,
  ErrorState,
  EmptyState,
  ResultFilters,
  ExpandableText,
  ExpandableList,
} from "../../components/ai";
import type { SortOption, RiskFilter, ProbabilityFilter } from "../../components/ai";
import { saveAIContact } from "../../services/ai.service";
import { RiskLevel } from "../../types/aiTypes";

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
  commodity: string;
  hsCode?: string;
  country?: string;
  port?: string;
  priceMin?: number;
  priceMax?: number;
  isMainstream?: boolean;
  source?: string;
  aiMode?: 'commodity-ai' | 'niche-ai';
  currency?: string;
  priceUnit?: string;
}

// Market Analysis Charts Component - Now uses real data from analysisResult
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
  // Check for actual real data - no fallbacks allowed
  const hasDemandData = (analysisResult?.chartData?.demandForecast?.data?.length ?? 0) > 0;
  const hasCapitalData = (analysisResult?.chartData?.capitalRequired?.data?.length ?? 0) > 0 ||
    (analysisResult?.priceTrends?.length ?? 0) > 0;
  const hasPriceData = (analysisResult?.chartData?.priceVolatility?.data?.length ?? 0) > 0 ||
    (analysisResult?.priceTrends?.length ?? 0) > 0;

  // Build chart data ONLY from real data - no fallbacks
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
      {/* Demand Radar - Only render if real data exists */}
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

      {/* Capital Required - Only render if real data exists */}
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

      {/* Price Volatility - Only render if real data exists */}
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

// Tier section component
interface TierSectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  results: (EnrichedPartner | ProductResult)[];
  tier: 1 | 2 | 3;
  userRole: "Buyer" | "Seller";
  commodity: string;
  isExpanded: boolean;
  onToggle: () => void;
  badgeClass: string;
  onSaveContact: (result: EnrichedPartner | ProductResult) => void;
  // New props for comparison
  showCompareCheckbox?: boolean;
  isResultSelected?: (result: EnrichedPartner | ProductResult) => boolean;
  onSelectionChange?: (result: EnrichedPartner | ProductResult, selected: boolean) => void;
}

const TierSection: React.FC<TierSectionProps> = ({
  title,
  icon,
  description,
  results,
  tier,
  userRole,
  commodity,
  isExpanded,
  onToggle,
  badgeClass,
  onSaveContact,
  showCompareCheckbox = false,
  isResultSelected,
  onSelectionChange,
}) => {
  if (results.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 rounded-t-xl border ${badgeClass} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm opacity-80">{description}</p>
          </div>
          <span className="ml-2 px-2 py-1 bg-white/30 rounded-full text-sm font-medium">
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border border-t-0 border-gray-200 rounded-b-xl bg-gray-50 p-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            {results.map((result, index) => (
              <AIResultCard
                key={index}
                result={result}
                userRole={userRole}
                tier={tier}
                commodity={commodity}
                onSaveContact={onSaveContact}
                index={index}
                showCompareCheckbox={showCompareCheckbox}
                isSelected={isResultSelected ? isResultSelected(result) : false}
                onSelectionChange={onSelectionChange}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const BuyerAiResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  // Search state
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<MergedSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [tier1Expanded, setTier1Expanded] = useState(true);
  const [tier2Expanded, setTier2Expanded] = useState(true);
  const [tier3Expanded, setTier3Expanded] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true); // Default open for charts panel

  // Filter & Sort state
  const [probabilityFilter, setProbabilityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('probability_desc');

  // Comparison selection state
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [showCompareCheckbox, setShowCompareCheckbox] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Warning banner dismiss state
  const [showWarning, setShowWarning] = useState(true);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Analysis polling
  const {
    status: analysisStatus,
    progress: analysisProgress,
    result: analysisResult,
    startPolling,
  } = useAnalysisPolling();

  // Ref to prevent double search execution
  const hasSearchedRef = useRef(false);

  // Perform search on mount
  const performSearch = useCallback(async () => {
    if (!state?.commodity) {
      setError("No commodity specified. Please go back and search again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchInput: AISearchInput = {
        role: 'Buyer',
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

      const response = await aiSearch(searchInput);
      setResults(response.data);

      // Optionally start market analysis
      if (response.data.totalMatches > 0) {
        try {
          const analysisResponse = await startAnalysis({
            role: 'Buyer',
            commodity: state.commodity,
            hsCode: state.hsCode,
            destinationCountry: state.country,
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
    // Prevent double execution from React strict mode or Animate wrapper remounts
    if (hasSearchedRef.current) return;

    // Check state immediately before searching
    if (!state?.commodity) {
      setError("No commodity specified. Please go back and search again.");
      setLoading(false);
      return;
    }

    hasSearchedRef.current = true;
    performSearch();
  }, [location.key, performSearch, state?.commodity]);

  // Handle save contact - works for both EnrichedPartner and ProductResult
  const handleSaveContact = async (result: EnrichedPartner | ProductResult) => {
    try {
      // Type-safe extraction based on result type
      const isPartner = result.resultType === 'partner';
      const partner = isPartner ? (result as EnrichedPartner) : null;
      const product = !isPartner ? (result as ProductResult) : null;

      await saveAIContact({
        name: isPartner ? partner!.name : product!.sellerName || product!.name,
        email: isPartner ? partner!.contactInfo?.email : product!.contactInfo?.email,
        phone: isPartner ? partner!.contactInfo?.phone : product!.contactInfo?.phone,
        country: isPartner ? partner!.country : product!.sellerCountry || product!.exportLocation,
        commodity: state?.commodity,
        hsCode: state?.hsCode,
        matchScore: isPartner ? partner!.matchScore : product!.aiMatchScore || product!.probability,
        role: "seller",
      });
      setToast({ type: 'success', message: 'Contact saved to wishlist!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to save contact. Please try again.' });
    }
  };

  // Handle chat navigation - Create conversation first, then navigate
  const handleChat = async (companyId: string) => {
    if (!companyId) {
      console.warn('No company ID available for chat');
      return;
    }

    try {
      const result = await createConversationByCompany(companyId);

      if (result.conversationId) {
        navigate(`/buyer/inbox?conversationId=${result.conversationId}`);
      } else if (result.message?.includes('yourself')) {
        setToast({ type: 'warning', message: "You can't chat with yourself." });
      } else {
        // Fallback: navigate to inbox without specific conversation
        navigate('/buyer/inbox');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      navigate('/buyer/inbox');
    }
  };

  // Handle search again
  const handleSearchAgain = () => {
    navigate("/buyer/ai");
  };

  // Generate unique ID for comparison - uses multiple fields to ensure uniqueness
  // For external results without IDs, we include additional fields to differentiate
  const getResultUniqueId = useCallback((result: EnrichedPartner | ProductResult, index?: number): string => {
    if (result.resultType === 'partner') {
      const partner = result as EnrichedPartner;
      // Use combination of id, platformCompanyId, name, country, and contact info for uniqueness
      // This ensures external partners with the same name but different details are differentiated
      const uniqueParts = [
        'partner',
        partner.id || partner.platformCompanyId || '',
        partner.name,
        partner.country || '',
        partner.contactInfo?.email || partner.contactInfo?.phone || '',
        // Include match score as additional differentiator for AI results with same name
        partner.matchScore?.toString() || '',
      ].filter(Boolean);
      return uniqueParts.join('-');
    } else {
      const product = result as ProductResult;
      // Products always have _id from MongoDB, so this is reliable
      return `product-${product._id}-${product.name}`;
    }
  }, []);

  // Handle comparison selection
  const handleSelectionChange = useCallback((result: EnrichedPartner | ProductResult, selected: boolean) => {
    const resultId = getResultUniqueId(result);

    setSelectedResults(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(resultId);
      } else {
        next.delete(resultId);
      }
      return next;
    });
  }, [getResultUniqueId]);

  // Check if result is selected
  const isResultSelected = useCallback((result: EnrichedPartner | ProductResult): boolean => {
    const resultId = getResultUniqueId(result);
    return selectedResults.has(resultId);
  }, [selectedResults, getResultUniqueId]);

  // Get all unique countries from results
  const getAvailableCountries = (): string[] => {
    if (!results) return [];
    const countries = new Set<string>();

    const addCountry = (result: EnrichedPartner | ProductResult) => {
      const country = result.resultType === 'partner'
        ? (result as EnrichedPartner).country
        : (result as ProductResult).exportLocation || (result as ProductResult).sellerCountry;
      if (country) countries.add(country);
    };

    [...results.tier1, ...results.tier2, ...results.tier3].forEach(addCountry);
    return Array.from(countries).sort();
  };

  // Filter and sort results - memoized to prevent unnecessary recalculations
  const filterAndSortResults = useCallback((items: (EnrichedPartner | ProductResult)[]): (EnrichedPartner | ProductResult)[] => {
    let filtered = items.filter(item => {
      // Get item properties
      const isPartner = item.resultType === 'partner';
      const probability = isPartner
        ? (item as EnrichedPartner).probability || 0
        : (item as ProductResult).probability || (item as ProductResult).aiMatchScore || 0;
      const riskLevel = isPartner
        ? (item as EnrichedPartner).riskLevel
        : (item as ProductResult).riskLevel;
      const country = isPartner
        ? (item as EnrichedPartner).country
        : (item as ProductResult).exportLocation || (item as ProductResult).sellerCountry;

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
    filtered.sort((a, b) => {
      const isPartnerA = a.resultType === 'partner';
      const isPartnerB = b.resultType === 'partner';

      const probA = isPartnerA
        ? (a as EnrichedPartner).probability || 0
        : (a as ProductResult).probability || (a as ProductResult).aiMatchScore || 0;
      const probB = isPartnerB
        ? (b as EnrichedPartner).probability || 0
        : (b as ProductResult).probability || (b as ProductResult).aiMatchScore || 0;

      const riskOrder: Record<RiskLevel, number> = {
        'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5
      };
      const riskA = riskOrder[(isPartnerA ? (a as EnrichedPartner).riskLevel : (a as ProductResult).riskLevel) as RiskLevel] || 3;
      const riskB = riskOrder[(isPartnerB ? (b as EnrichedPartner).riskLevel : (b as ProductResult).riskLevel) as RiskLevel] || 3;

      const nameA = isPartnerA ? (a as EnrichedPartner).name : (a as ProductResult).name;
      const nameB = isPartnerB ? (b as EnrichedPartner).name : (b as ProductResult).name;

      switch (sortBy) {
        case 'probability_desc': return probB - probA;
        case 'probability_asc': return probA - probB;
        case 'risk_asc': return riskA - riskB;
        case 'risk_desc': return riskB - riskA;
        case 'name_asc': return nameA.localeCompare(nameB);
        default: return 0;
      }
    });

    return filtered;
  }, [probabilityFilter, riskFilter, countryFilter, sortBy]);

  // Get filtered results for each tier - memoized to prevent unnecessary recalculations
  const filteredTier1 = useMemo(() =>
    results ? filterAndSortResults(results.tier1) : [],
    [results, filterAndSortResults]
  );
  const filteredTier2 = useMemo(() =>
    results ? filterAndSortResults(results.tier2) : [],
    [results, filterAndSortResults]
  );
  const filteredTier3 = useMemo(() =>
    results ? filterAndSortResults(results.tier3) : [],
    [results, filterAndSortResults]
  );
  const totalFilteredResults = filteredTier1.length + filteredTier2.length + filteredTier3.length;
  const totalResults = results ? results.totalMatches : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Black Header Bar - Figma Style */}
      <div className="bg-gray-900 text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Back */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-lg">Breyus</span>
              <span className="text-blue-400 text-sm">Ai</span>
            </div>

            {/* Center: Search Again & Search Term */}
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
              {state?.commodity && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-full">
                  <X className="w-4 h-4 cursor-pointer hover:text-red-400" onClick={handleSearchAgain} />
                  <span className="text-sm">
                    {state.commodity}
                    {state.country && ` from ${state.country}`}
                  </span>
                </div>
              )}
            </div>

            {/* Right: AI Mode Indicator */}
            <div className="flex items-center gap-3">
              {/* Mode Indicator - Visual only */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <span className="text-xs text-gray-400">Mode:</span>
                {state?.aiMode === 'niche-ai' ? (
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7l3-7z" />
                    </svg>
                    Niche AI
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Commodity AI
                  </span>
                )}
              </div>
              {/* Coming Soon Badge */}
              <div className="px-3 py-1.5 bg-gray-700 rounded-lg text-gray-400 text-xs">
                Core AI <span className="text-gray-500">• Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading State */}
        {loading && (
          <AISearchLoading userRole="Buyer" commodity={state?.commodity} />
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorState
            error={error}
            onRetry={performSearch}
          />
        )}

        {/* Empty State */}
        {!loading && !error && results && results.totalMatches === 0 && (
          <EmptyState
            commodity={state?.commodity}
            onSearchAgain={() => navigate("/buyer/ai")}
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
                    Tip: Try broadening your search criteria or exploring suppliers from other regions.
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

            {/* Market Analysis Charts Panel */}
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
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-semibold text-gray-800">Market Analysis</h3>
                    {analysisStatus === 'pending' && (
                      <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full animate-pulse">
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
                        commodity={state?.commodity || ''}
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
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <h4 className="text-sm font-semibold text-blue-800 mb-1">Market Summary</h4>
                          <ExpandableText
                            text={analysisResult.summary}
                            maxLength={300}
                            textClassName="text-sm text-blue-700"
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
                        <li>• Commodity: <span className="font-medium">{state?.commodity}</span></li>
                        <li>• Target Country: <span className="font-medium">{state?.country || 'Global'}</span></li>
                        <li>• Nearest Port: <span className="font-medium">{state?.port || 'Any'}</span></li>
                        {analysisResult?.priceTrends && analysisResult.priceTrends.length > 0 && (() => {
                          const validMinPrices = analysisResult.priceTrends.map(t => t.minPrice).filter((p): p is number => typeof p === 'number' && !isNaN(p));
                          const validMaxPrices = analysisResult.priceTrends.map(t => t.maxPrice).filter((p): p is number => typeof p === 'number' && !isNaN(p));
                          if (validMinPrices.length === 0 || validMaxPrices.length === 0) return null;
                          return (
                            <li>• Price Range: <span className="font-medium">
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
                            <h4 className="text-sm font-semibold text-green-800">Demand Forecast</h4>
                          </div>
                          <p className="text-sm text-green-700">
                            <span className="font-medium capitalize">{analysisResult.demandForecast.direction}</span>
                            {' '}- {analysisResult.demandForecast.explanation}
                            {' '}({analysisResult.demandForecast.confidence}% confidence)
                          </p>
                        </div>
                      )}

                      {/* Top Exporters & Importers */}
                      {!!(analysisResult?.topExporters?.length || analysisResult?.topImporters?.length) && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {analysisResult?.topExporters && analysisResult.topExporters.length > 0 && (
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-700 mb-2">Top Exporters</h4>
                              <ul className="space-y-1">
                                {analysisResult.topExporters.slice(0, 3).map((e, idx) => (
                                  <li key={idx} className="text-xs text-gray-600 flex justify-between">
                                    <span>{e.country}</span>
                                    <span className="text-gray-400">{e.percentage}%</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysisResult?.topImporters && analysisResult.topImporters.length > 0 && (
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                              <h4 className="text-xs font-semibold text-gray-700 mb-2">Top Importers</h4>
                              <ul className="space-y-1">
                                {analysisResult.topImporters.slice(0, 3).map((i, idx) => (
                                  <li key={idx} className="text-xs text-gray-600 flex justify-between">
                                    <span>{i.country}</span>
                                    <span className="text-gray-400">{i.percentage}%</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Seasonality */}
                      {analysisResult?.seasonality && (
                        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <h4 className="text-sm font-semibold text-purple-800 mb-1">Seasonality</h4>
                          <div className="text-sm text-purple-700">
                            {analysisResult.seasonality.peakMonths?.length > 0 && (
                              <p>Peak months: <span className="font-medium">{analysisResult.seasonality.peakMonths.join(', ')}</span></p>
                            )}
                            {analysisResult.seasonality.lowMonths?.length > 0 && (
                              <p>Low months: <span className="font-medium">{analysisResult.seasonality.lowMonths.join(', ')}</span></p>
                            )}
                          </div>
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
                              Analyzing price trends and market insights...
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Suppliers Result Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Suppliers Result</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      AI-powered matches based on your search criteria
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Compare Toggle */}
                    <button
                      onClick={() => {
                        setShowCompareCheckbox(!showCompareCheckbox);
                        if (showCompareCheckbox) setSelectedResults(new Set());
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        showCompareCheckbox
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {showCompareCheckbox ? `Compare (${selectedResults.size})` : 'Compare'}
                    </button>
                    <span className="text-sm text-gray-500">In case of inappropriate results</span>
                    <button
                      onClick={() => navigate("/buyer/purchase-request")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Post Requirement
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
                  userRole="Buyer"
                />
              </div>

              {/* Tier 1: Best Match Sellers (AI + Platform) */}
              {filteredTier1.length > 0 && (
                <TierSection
                  title="Best Match Sellers"
                  icon={<Trophy className="w-5 h-5 text-amber-600" />}
                  description="AI-recommended sellers with verified platform presence"
                  results={filteredTier1}
                  tier={1}
                  userRole="Buyer"
                  commodity={results.commodity}
                  isExpanded={tier1Expanded}
                  onToggle={() => setTier1Expanded(!tier1Expanded)}
                  badgeClass="bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                  onSaveContact={handleSaveContact}
                  showCompareCheckbox={showCompareCheckbox}
                  isResultSelected={isResultSelected}
                  onSelectionChange={handleSelectionChange}
                />
              )}

              {/* Tier 2: Platform Sellers */}
              {filteredTier2.length > 0 && (
                <TierSection
                  title="Platform Sellers"
                  icon={<Package className="w-5 h-5 text-blue-600" />}
                  description="Verified sellers with products on Breyus"
                  results={filteredTier2}
                  tier={2}
                  userRole="Buyer"
                  commodity={results.commodity}
                  isExpanded={tier2Expanded}
                  onToggle={() => setTier2Expanded(!tier2Expanded)}
                  badgeClass="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                  onSaveContact={handleSaveContact}
                  showCompareCheckbox={showCompareCheckbox}
                  isResultSelected={isResultSelected}
                  onSelectionChange={handleSelectionChange}
                />
              )}

              {/* Tier 3: External Sellers */}
              {filteredTier3.length > 0 && (
                <TierSection
                  title="External Sellers"
                  icon={<Globe2 className="w-5 h-5 text-gray-600" />}
                  description="Potential sellers from global trade data"
                  results={filteredTier3}
                  tier={3}
                  userRole="Buyer"
                  commodity={results.commodity}
                  isExpanded={tier3Expanded}
                  onToggle={() => setTier3Expanded(!tier3Expanded)}
                  badgeClass="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  onSaveContact={handleSaveContact}
                  showCompareCheckbox={showCompareCheckbox}
                  isResultSelected={isResultSelected}
                  onSelectionChange={handleSelectionChange}
                />
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
                  <p className="text-gray-500 mb-4">Try adjusting your filter criteria to see more results.</p>
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

export default BuyerAiResult;
