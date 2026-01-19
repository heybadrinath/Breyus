import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, Search, Sparkles, Gem } from "lucide-react";
import AiAnimation from "../../assets/ai/ai-animation.svg";

/**
 * Seller AI Landing Page
 *
 * Two main options for sellers:
 * 1. Search Buyer for your Product - Select from inventory first
 * 2. Search Any Buyer - Direct commodity search (like buyer flow)
 */

const AnimatedBackground = () => (
  <div className="absolute inset-0 flex items-center justify-center z-0 opacity-15 pointer-events-none overflow-hidden">
    <motion.img
      src={AiAnimation}
      alt="Rotating Icon"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      className="w-[900px] h-[900px] min-w-[700px] min-h-[700px]"
    />
  </div>
);

type AIMode = 'core' | 'niche';

const SellerAILanding: React.FC = () => {
  const navigate = useNavigate();
  const [aiMode, setAiMode] = useState<AIMode>('core');

  const handleSearchFromInventory = () => {
    // Navigate to inventory selection page with AI mode
    navigate('/seller/ai-inventory', { state: { aiMode } });
  };

  const handleSearchAnyBuyer = () => {
    // Navigate to commodity search (similar to buyer flow) with AI mode
    navigate('/seller/ai-select', { state: { aiMode } });
  };

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-8 px-4">
        <div className="w-full max-w-3xl">
          {/* Title Section */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-8 h-8 text-orange-500" />
                <h1 className="font-extrabold text-4xl md:text-5xl text-gray-900">
                  Commodity AI
                </h1>
              </div>
              <p className="font-bold text-xl md:text-2xl text-gray-700 mb-1">
                Find Your Perfect Buyers
              </p>
              <p className="text-gray-500 text-base">
                {aiMode === 'core'
                  ? 'AI-powered buyer matching for your products'
                  : 'Find buyers for specialized & unique commodities'}
              </p>
            </motion.div>
          </div>

          {/* Options Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8"
          >
            <h2 className="text-center text-lg font-semibold text-gray-700 mb-6">
              Choose how you'd like to search for buyers
            </h2>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
              {/* Option 1: Search from Inventory */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearchFromInventory}
                className="flex-1 flex flex-col items-center justify-center gap-3 p-6 bg-black text-white rounded-xl hover:bg-gray-800 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-1">
                    Search Buyer for your Product
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Select from your inventory and find matching buyers
                  </p>
                </div>
                <span className="px-3 py-1 bg-orange-500 text-white text-xs rounded-full font-medium">
                  Recommended
                </span>
              </motion.button>

              {/* Option 2: Search Any Buyer */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearchAnyBuyer}
                className="flex-1 flex flex-col items-center justify-center gap-3 p-6 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-all duration-200 border border-gray-200"
              >
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-1">
                    Search Any Buyer
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Enter any commodity to explore potential buyers
                  </p>
                </div>
              </motion.button>
            </div>

            {/* Info Section */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-center gap-6 text-center text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>AI-powered matching</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>5M+ trade records analyzed</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>130K+ companies indexed</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Toggle for Niche/Core AI */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center mt-5"
          >
            <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-200">
              <button
                onClick={() => setAiMode('core')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  aiMode === 'core'
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Core AI
              </button>
              <button
                onClick={() => setAiMode('niche')}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  aiMode === 'niche'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Gem className="w-3.5 h-3.5" />
                Niche AI
              </button>
            </div>
          </motion.div>

          {/* Mode Description */}
          <motion.p
            key={aiMode}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center mt-3 text-sm text-gray-500"
          >
            {aiMode === 'core'
              ? 'Search for standard commodities with established trade data'
              : 'Find buyers for specialized, rare, or unique products'}
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default SellerAILanding;
