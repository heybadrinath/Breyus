import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MarketplaceHeader from '../../components/marketplace/MarketplaceHeader';
import AISearchBars from '../../components/marketplace/AISearchBars';
import MarketNewsSection from '../../components/marketplace/MarketNewsSection';
import CommodityPriceWidget from '../../components/marketplace/CommodityPriceWidget';
import { usernameService } from '../../services/users.service';

/**
 * Buyer Marketplace Page
 *
 * Features:
 * - Personalized greeting
 * - AI search bars for finding sellers/commodities
 * - Market news with General and Personalized tabs
 * - Real-time commodity price widget
 */
const BuyerMarketplace: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user info for personalized greeting
    const fetchUser = async () => {
      try {
        const user = await usernameService();
        setUserName(user?.name || 'User');
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setUserName('User');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Personalized Greeting */}
        <MarketplaceHeader userName={userName} />

        {/* AI Search Bars */}
        <AISearchBars userRole="Buyer" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Market News - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <MarketNewsSection userName={userName} />
          </div>

          {/* Commodity Prices - Sticky on desktop */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <CommodityPriceWidget />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BuyerMarketplace;
