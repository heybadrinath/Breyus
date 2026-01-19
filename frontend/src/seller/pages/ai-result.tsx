/**
 * Seller AI Result Page
 * Displays buyer results for seller's product or commodity search
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "../../types/aiTypes";
import { useAnalysisPolling } from "../../hooks/useAnalysisPolling";

// Components
import {
  AISearchLoading,
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

// Probability filter type
type ProbabilityFilter = 'all' | 'high' | 'medium' | 'low';

// Market Analysis Charts Component
const MarketAnalysisCharts: React.FC<{ commodity: string }> = ({ commodity }) => {
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
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Demand</h4>
        <div className="h-40">
          <Radar data={demandRadarData} options={radarOptions} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Capital Required</h4>
        <div className="h-40">
          <Line data={capitalChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Price Volatility</h4>
        <div className="h-40">
          <Line data={priceVolatilityData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

// Buyer Result Card Component
interface BuyerCardProps {
  buyer: EnrichedPartner;
  tier: 1 | 2 | 3;
  onContact: (buyer: EnrichedPartner) => void;
  onSave: (buyer: EnrichedPartner) => void;
}

const BuyerCard: React.FC<BuyerCardProps> = ({ buyer, tier, onContact, onSave }) => {
  const getRiskColor = (risk: string | undefined) => {
    switch (risk) {
      case 'Very Low':
        return 'text-green-600 bg-green-50';
      case 'Low':
        return 'text-green-500 bg-green-50';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'High':
        return 'text-orange-600 bg-orange-50';
      case 'Very High':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTierBadge = () => {
    switch (tier) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <Trophy className="w-3 h-3" />
            Proven Buyer
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Users className="w-3 h-3" />
            Platform Buyer
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            <Globe2 className="w-3 h-3" />
            External
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{buyer.name}</h3>
            <p className="text-sm text-gray-500">{buyer.country || 'Unknown location'}</p>
          </div>
        </div>
        {getTierBadge()}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Buying Probability */}
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Buying Probability</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">
              {buyer.probability || buyer.matchScore || 0}%
            </span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
        </div>

        {/* Risk Level */}
        <div className={`rounded-lg p-3 ${getRiskColor(buyer.riskLevel)}`}>
          <p className="text-xs text-gray-600 mb-1">Risk Level</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">
              {buyer.riskLevel || 'Unknown'}
            </span>
            {(buyer.riskLevel === 'High' || buyer.riskLevel === 'Very High') && (
              <AlertTriangle className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* Match Reason */}
      {buyer.matchReason && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Match reason:</span> {buyer.matchReason}
          </p>
        </div>
      )}

      {/* Trade History (for tier 1) */}
      {tier === 1 && buyer.tradeCount && (
        <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500" />
            {buyer.tradeCount} completed trade(s)
          </span>
          {buyer.totalQuantity && (
            <span>Total: {buyer.totalQuantity.toLocaleString()} units</span>
          )}
        </div>
      )}

      {/* Contact Info (for on-platform buyers) */}
      {buyer.isOnPlatform && buyer.contactInfo && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          {buyer.contactInfo.email && (
            <span className="flex items-center gap-1 text-gray-600">
              <Mail className="w-4 h-4" />
              {buyer.contactInfo.email}
            </span>
          )}
          {buyer.contactInfo.phone && (
            <span className="flex items-center gap-1 text-gray-600">
              <Phone className="w-4 h-4" />
              {buyer.contactInfo.phone}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {buyer.isOnPlatform ? (
          <>
            <button
              onClick={() => onSave(buyer)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Save Contact
            </button>
            <button
              onClick={() => onContact(buyer)}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat Now
            </button>
          </>
        ) : (
          <button
            onClick={() => onSave(buyer)}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          >
            Save Contact Info
          </button>
        )}
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
  const [probabilityFilter, setProbabilityFilter] = useState<ProbabilityFilter>('all');

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

  useEffect(() => {
    if (hasSearchedRef.current) return;

    if (!state?.productId && !state?.commodity) {
      setError("No search criteria provided. Please go back and try again.");
      setLoading(false);
      return;
    }

    hasSearchedRef.current = true;
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      alert("Contact saved to your list!");
    } catch (err) {
      alert("Failed to save contact");
    }
  };

  // Handle contact (chat)
  const handleContact = (buyer: EnrichedPartner) => {
    if (buyer.platformUserId) {
      navigate("/seller/inbox", { state: { targetUserId: buyer.platformUserId } });
    }
  };

  // Handle search again
  const handleSearchAgain = () => {
    navigate("/seller/ai");
  };

  // Filter results by probability
  const filterByProbability = (buyers: EnrichedPartner[]) => {
    if (probabilityFilter === 'all') return buyers;

    return buyers.filter(buyer => {
      const prob = buyer.probability || buyer.matchScore || 0;
      switch (probabilityFilter) {
        case 'high':
          return prob >= 70;
        case 'medium':
          return prob >= 40 && prob < 70;
        case 'low':
          return prob < 40;
        default:
          return true;
      }
    });
  };

  // Get all buyers from results
  const getAllBuyers = (): { buyer: EnrichedPartner; tier: 1 | 2 | 3 }[] => {
    if (!results) return [];

    const buyers: { buyer: EnrichedPartner; tier: 1 | 2 | 3 }[] = [];

    // Tier 1 and 2 are EnrichedPartner for seller searches
    (results.tier1 as EnrichedPartner[]).forEach(b => {
      if (b.resultType === 'partner') {
        buyers.push({ buyer: b, tier: 1 });
      }
    });

    (results.tier2 as EnrichedPartner[]).forEach(b => {
      if (b.resultType === 'partner') {
        buyers.push({ buyer: b, tier: 2 });
      }
    });

    return buyers;
  };

  const mainBuyers = getAllBuyers();
  const filteredMainBuyers = filterByProbability(mainBuyers.map(b => b.buyer)).map(buyer => {
    const match = mainBuyers.find(b => b.buyer.id === buyer.id);
    return { buyer, tier: match?.tier || 2 as const };
  });

  const externalBuyers = filterByProbability(results?.tier3 || []);

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

              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
              </button>

              {/* Search Term Chip */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-full">
                <X className="w-4 h-4 cursor-pointer hover:text-red-400" onClick={handleSearchAgain} />
                <span className="text-sm">{getSearchLabel()}</span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 transition-colors">
                Niche Ai
              </button>
              <button className="px-4 py-2 bg-orange-600 rounded-lg text-sm hover:bg-orange-700 transition-colors">
                Core Ai
              </button>
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
            {/* Market Analysis */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-4">
                <MarketAnalysisCharts commodity={getSearchLabel()} />
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Product: {getSearchLabel()}</li>
                  <li>• Category: {state?.productCategory || results.commodity}</li>
                  <li>• Total Potential Buyers: {results.totalMatches}</li>
                  <li>• Market Price Range: Contact buyers for current pricing</li>
                </ul>
              </div>
            </motion.div>

            {/* Buyers Result Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Buyers Result</h2>
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
                      High probability
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
                  <span className="text-sm text-gray-500">Need more buyers?</span>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Post Your Offer
                  </button>
                </div>
              </div>

              {/* Main Buyers Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {filteredMainBuyers.map((item, index) => (
                  <BuyerCard
                    key={`buyer-${index}`}
                    buyer={item.buyer}
                    tier={item.tier}
                    onContact={handleContact}
                    onSave={handleSaveContact}
                  />
                ))}
              </div>

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
                          onContact={handleContact}
                          onSave={handleSaveContact}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Analysis Loading Overlay */}
      {analysisStatus === "pending" && (
        <LoadingOverlay
          message="Analyzing Buyer Data"
          subMessage="This may take a minute..."
          showProgress
          progress={analysisProgress}
          steps={[
            { label: "Fetching trade records", completed: analysisProgress > 20 },
            { label: "Analyzing buyer patterns", completed: analysisProgress > 50 },
            { label: "Generating insights", completed: analysisProgress > 80 },
          ]}
        />
      )}
    </div>
  );
};

export default SellerAiResult;
