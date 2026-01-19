/**
 * Buyer AI Result Page - Figma Design Update
 * Displays 3-tier search results with market analysis charts
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "../../types/aiTypes";
import { useAnalysisPolling } from "../../hooks/useAnalysisPolling";

// Components
import {
  AISearchLoading,
  AIResultCard,
  SkeletonResultList,
  ErrorState,
  EmptyState,
  LoadingOverlay,
} from "../../components/ai";
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
  commodity: string;
  hsCode?: string;
  country?: string;
  port?: string;
  priceMin?: number;
  priceMax?: number;
  isMainstream?: boolean;
  source?: string;
}

// Probability filter type
type ProbabilityFilter = 'all' | 'high' | 'medium' | 'low';

// Market Analysis Charts Component
const MarketAnalysisCharts: React.FC<{ commodity: string }> = ({ commodity }) => {
  // Demand Radar Chart Data
  const demandRadarData = {
    labels: ['Market Size', 'Growth Rate', 'Competition', 'Seasonality', 'Price Stability', 'Trade Volume'],
    datasets: [
      {
        label: 'Demand Analysis',
        data: [75, 85, 60, 45, 70, 80],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  // Capital Required Chart Data
  const capitalChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Capital Required',
        data: [3200, 3500, 3100, 3800, 3600, 3400, 3700],
        fill: true,
        backgroundColor: 'rgba(147, 197, 253, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        tension: 0.4,
      },
    ],
  };

  // Price Volatility Chart Data
  const priceVolatilityData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Price Volatility',
        data: [6500, 7200, 6800, 7500, 8000, 7800, 7300],
        fill: false,
        borderColor: 'rgba(34, 197, 94, 1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
      legend: { display: false },
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
    <div className="grid grid-cols-3 gap-4">
      {/* Demand Radar */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Demand</h4>
        <div className="h-40">
          <Radar data={demandRadarData} options={radarOptions} />
        </div>
      </div>

      {/* Capital Required */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Capital Required</h4>
        <div className="h-40">
          <Line data={capitalChartData} options={chartOptions} />
        </div>
      </div>

      {/* Price Volatility */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Volatility</h4>
        <div className="h-40">
          <Line data={priceVolatilityData} options={chartOptions} />
        </div>
      </div>
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
  onSaveContact: (result: EnrichedPartner) => void;
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
}) => {
  if (results.length === 0) return null;

  return (
    <div className="mb-6">
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
              <div key={index} className="result-item">
                <AIResultCard
                  result={result}
                  userRole={userRole}
                  tier={tier}
                  commodity={commodity}
                  onSaveContact={onSaveContact}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
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
  const [showAnalysis, setShowAnalysis] = useState(true); // Default open
  const [probabilityFilter, setProbabilityFilter] = useState<ProbabilityFilter>('all');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle save contact
  const handleSaveContact = async (partner: EnrichedPartner) => {
    try {
      await saveAIContact({
        name: partner.name,
        email: partner.contactInfo?.email,
        phone: partner.contactInfo?.phone,
        country: partner.country,
        commodity: state?.commodity,
        hsCode: state?.hsCode,
        matchScore: partner.matchScore,
        role: "seller",
      });
      alert("Contact saved to wishlist!");
    } catch (err) {
      alert("Failed to save contact");
    }
  };

  // Handle chat navigation
  const handleChat = (userId: string) => {
    navigate("/buyer/inbox", { state: { targetUserId: userId } });
  };

  // Handle search again
  const handleSearchAgain = () => {
    navigate("/buyer/ai");
  };

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

              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
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

            {/* Right: AI Toggle & Icons */}
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors">
                Niche Ai
              </button>
              <button className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Core Ai
              </button>
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
            {/* Market Analysis Charts Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <MarketAnalysisCharts commodity={state?.commodity || ''} />
                </div>
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {showAnalysis ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              </div>

              {/* Market Info Text */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Your Export Country: {state?.country || 'India'}</li>
                  <li>• Your Import Country: {state?.port ? state.port : 'Switzerland'}</li>
                  <li>• Nearest Port: {state?.port || 'Mumbai'}</li>
                  <li>• Market Price Range: ₹25-₹50 per kg (approximately $0.035-$0.070 per kg)</li>
                </ul>
                <div className="flex justify-end mt-3">
                  <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors">
                    View More
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Suppliers Result Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Suppliers result</h2>
                  {/* Probability Filter Badges */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setProbabilityFilter('high')}
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        probabilityFilter === 'high'
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      High buying probability
                    </button>
                    <button
                      onClick={() => setProbabilityFilter('medium')}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        probabilityFilter === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Medium probability
                    </button>
                    <button
                      onClick={() => setProbabilityFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        probabilityFilter === 'all'
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All Results
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">In case of inappropriate results</span>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Post Requirement
                  </button>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Tier 1 Results */}
                {results.tier1.map((result, index) => (
                  <AIResultCard
                    key={`tier1-${index}`}
                    result={result}
                    userRole="Buyer"
                    tier={1}
                    commodity={results.commodity}
                    onSaveContact={handleSaveContact}
                  />
                ))}

                {/* Tier 2 Results */}
                {results.tier2.map((result, index) => (
                  <AIResultCard
                    key={`tier2-${index}`}
                    result={result}
                    userRole="Buyer"
                    tier={2}
                    commodity={results.commodity}
                    onSaveContact={handleSaveContact}
                  />
                ))}
              </div>

              {/* Tier 3: External Sellers (Collapsible) */}
              {results.tier3.length > 0 && (
                <div className="mt-6">
                  <TierSection
                    title="External Sellers"
                    icon={<Globe2 className="w-5 h-5 text-gray-600" />}
                    description="Potential sellers from global trade data"
                    results={results.tier3}
                    tier={3}
                    userRole="Buyer"
                    commodity={results.commodity}
                    isExpanded={tier3Expanded}
                    onToggle={() => setTier3Expanded(!tier3Expanded)}
                    badgeClass="bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                    onSaveContact={handleSaveContact}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Loading Overlay */}
      {analysisStatus === "pending" && showAnalysis && (
        <LoadingOverlay
          message="Analyzing Market Data"
          subMessage="This may take a minute..."
          showProgress
          progress={analysisProgress}
          steps={[
            { label: "Fetching trade records", completed: analysisProgress > 20 },
            { label: "Analyzing price trends", completed: analysisProgress > 50 },
            { label: "Generating insights", completed: analysisProgress > 80 },
          ]}
        />
      )}
    </div>
  );
};

export default BuyerAiResult;
