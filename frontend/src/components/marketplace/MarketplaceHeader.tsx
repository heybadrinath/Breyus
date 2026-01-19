import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface MarketplaceHeaderProps {
  userName: string;
}

/**
 * MarketplaceHeader - Personalized greeting for the marketplace page
 */
const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({ userName }) => {
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get greeting emoji based on time
  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 17) return '🌤️';
    return '🌙';
  };

  // Get first name from full name
  const firstName = userName?.split(' ')[0] || 'there';

  // Format current date
  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      {/* Main Greeting */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">
            {formatDate()}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {getGreeting()}, <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{firstName}</span> {getGreetingEmoji()}
          </h1>
          <p className="mt-3 text-gray-600 max-w-xl">
            Stay ahead with the latest market insights, commodity prices, and industry news tailored to your interests.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Market Status</p>
              <p className="text-sm font-semibold text-emerald-600">Active</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="hidden sm:flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Data Delay</p>
              <p className="text-sm font-semibold text-gray-700">15 min</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketplaceHeader;
