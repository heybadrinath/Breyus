/**
 * Niche AI Landing Page (Buyer)
 *
 * Simple search interface for niche/unique commodities.
 * Features:
 * - Single search input
 * - Different visual style (no rotating animation)
 * - Always routes to /buyer/ai-select for commodity selection
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Sparkles, Boxes, Loader2, ArrowRight, Zap } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION - Extract hardcoded values for easy maintenance
// ═══════════════════════════════════════════════════════════════

/** Example niche commodities to suggest to users */
const NICHE_COMMODITY_EXAMPLES = [
  "Organic Saffron",
  "Himalayan Salt",
  "Ethiopian Coffee",
  "Truffle Oil",
  "Manuka Honey",
  "Dragon Fruit",
] as const;

/** Tooltip display duration in milliseconds */
const TOOLTIP_DURATION_MS = 3000;

// ═══════════════════════════════════════════════════════════════
// VISUAL BACKGROUND COMPONENT (Different from Commodity AI)
// ═══════════════════════════════════════════════════════════════

const NicheBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Gradient Orbs */}
    <div className="absolute top-10 -left-20 w-96 h-96 bg-purple-200 rounded-full opacity-30 blur-3xl" />
    <div className="absolute bottom-10 -right-20 w-96 h-96 bg-indigo-200 rounded-full opacity-30 blur-3xl" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full opacity-20 blur-3xl" />

    {/* Floating Elements */}
    <motion.div
      animate={{
        y: [0, -20, 0],
        rotate: [0, 5, 0],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-20 left-[10%] w-16 h-16 bg-purple-100 rounded-xl opacity-40"
    />
    <motion.div
      animate={{
        y: [0, 20, 0],
        rotate: [0, -5, 0],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-32 right-[15%] w-12 h-12 bg-indigo-100 rounded-lg opacity-40"
    />
    <motion.div
      animate={{
        y: [0, 15, 0],
        x: [0, 10, 0],
      }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/3 right-[10%] w-8 h-8 bg-purple-200 rounded-full opacity-50"
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════
// HEADER BUTTONS COMPONENT
// ═══════════════════════════════════════════════════════════════

interface HeaderButtonsProps {
  onCommodityClick: () => void;
  onCoreClick: () => void;
  showCoreTooltip: boolean;
}

const HeaderButtons: React.FC<HeaderButtonsProps> = ({
  onCommodityClick,
  onCoreClick,
  showCoreTooltip,
}) => (
  <div className="flex justify-center gap-4 mb-8">
    <button
      onClick={onCommodityClick}
      className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
    >
      <Boxes className="w-4 h-4" />
      Try Commodity AI
    </button>
    <div className="relative">
      <button
        onClick={onCoreClick}
        className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 rounded-full font-medium cursor-not-allowed"
      >
        Breyus Core AI
        <span className="text-xs bg-gray-300 px-2 py-0.5 rounded-full">Coming Soon</span>
      </button>
      {showCoreTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap z-50"
        >
          Core AI is coming soon! Stay tuned.
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-b-gray-900" />
        </motion.div>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// FEATURE HIGHLIGHTS COMPONENT
// ═══════════════════════════════════════════════════════════════

const FeatureHighlights = () => (
  <div className="grid grid-cols-3 gap-4 mb-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100"
    >
      <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-700">AI-Powered Discovery</p>
      <p className="text-xs text-gray-500 mt-1">Find unique commodities</p>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-indigo-100"
    >
      <Zap className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-700">Global Network</p>
      <p className="text-xs text-gray-500 mt-1">Access hidden suppliers</p>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-purple-100"
    >
      <Search className="w-8 h-8 text-purple-500 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-700">Smart Matching</p>
      <p className="text-xs text-gray-500 mt-1">Find the best deals</p>
    </motion.div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const NicheAIPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // UI State
  const [showCoreTooltip, setShowCoreTooltip] = useState(false);

  // Reference for cleanup
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup tooltip timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Handle Core AI click (tooltip)
  const handleCoreClick = () => {
    setShowCoreTooltip(true);
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => setShowCoreTooltip(false), TOOLTIP_DURATION_MS);
  };

  // Navigate to Commodity AI
  const handleCommodityClick = () => {
    navigate("/buyer/ai");
  };

  // Handle search submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      // Always go to selection page for niche AI
      navigate("/buyer/ai-select", {
        state: {
          commodity: searchQuery.trim(),
          source: "niche-ai",
          isMainstream: false,
        },
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      handleSubmit(e);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 overflow-hidden">
      <NicheBackground />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Header Buttons */}
        <HeaderButtons
          onCommodityClick={handleCommodityClick}
          onCoreClick={handleCoreClick}
          showCoreTooltip={showCoreTooltip}
        />

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Discover Unique Commodities
          </div>
          <h1 className="text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Breyus Niche AI
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-2">Explore unborn path unfazed</p>
          <p className="text-gray-500">Unlock the hidden values of commodity</p>
        </motion.div>

        {/* Feature Highlights */}
        <FeatureHighlights />

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        >
          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter commodity name to get unique commodities
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Organic Saffron, Rare Spices, Artisan Coffee..."
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={submitting}
              />
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={submitting || !searchQuery.trim()}
              className={`
                w-full mt-6 py-4 px-6 rounded-xl font-semibold text-lg
                flex items-center justify-center gap-3
                transition-all duration-200 transform hover:scale-[1.02]
                ${
                  submitting || !searchQuery.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                }
              `}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Discover Niche Commodities
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Examples */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">Try searching for:</p>
            <div className="flex flex-wrap gap-2">
              {NICHE_COMMODITY_EXAMPLES.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchQuery(suggestion)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Info Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Niche AI specializes in finding unique, hard-to-find commodities from
            global suppliers.
          </p>
          <p className="mt-1">
            Looking for standard commodities?{" "}
            <button
              onClick={handleCommodityClick}
              className="text-black hover:text-gray-700 font-medium"
            >
              Try Commodity AI
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NicheAIPage;
