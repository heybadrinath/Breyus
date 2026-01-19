import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, Users, Package, ArrowRight } from 'lucide-react';

interface AISearchBarsProps {
  userRole: 'Buyer' | 'Seller';
}

/**
 * AISearchBars - Two search bar buttons that redirect to the AI page
 */
const AISearchBars: React.FC<AISearchBarsProps> = ({ userRole }) => {
  const navigate = useNavigate();

  const handlePeopleSearch = () => {
    // Navigate to AI page for finding sellers/buyers
    if (userRole === 'Buyer') {
      navigate('/buyer/ai');
    } else {
      navigate('/seller/ai');
    }
  };

  const handleCommoditySearch = () => {
    // Navigate to AI page for commodity search
    if (userRole === 'Buyer') {
      navigate('/buyer/ai');
    } else {
      navigate('/seller/ai');
    }
  };

  const peopleSearchText = userRole === 'Buyer'
    ? 'Find Verified Sellers'
    : 'Find Qualified Buyers';

  const peopleSearchDesc = userRole === 'Buyer'
    ? 'Discover trusted suppliers matched to your commodity requirements'
    : 'Connect with serious buyers looking for your products';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
      {/* People Search */}
      <motion.button
        onClick={handlePeopleSearch}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.15)' }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600
                   rounded-2xl p-6 text-white shadow-lg hover:shadow-emerald-500/25
                   transition-all duration-300 border border-emerald-400/20"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl transform -translate-x-10 translate-y-10" />
        </div>

        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0 p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
            <Users className="w-7 h-7" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span className="text-xs font-medium text-emerald-200 uppercase tracking-wider">AI-Powered</span>
            </div>
            <h3 className="font-bold text-xl">{peopleSearchText}</h3>
            <p className="text-sm text-emerald-100/80 mt-1 line-clamp-1">
              {peopleSearchDesc}
            </p>
          </div>
          <div className="flex-shrink-0 p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-3 right-3">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
          </div>
        </div>
      </motion.button>

      {/* Commodity Search */}
      <motion.button
        onClick={handleCommoditySearch}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.15)' }}
        whileTap={{ scale: 0.98 }}
        className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600
                   rounded-2xl p-6 text-white shadow-lg hover:shadow-blue-500/25
                   transition-all duration-300 border border-blue-400/20"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl transform translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl transform -translate-x-10 translate-y-10" />
        </div>

        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0 p-4 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
            <Package className="w-7 h-7" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-blue-200" />
              <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Smart Search</span>
            </div>
            <h3 className="font-bold text-xl">Search Commodities</h3>
            <p className="text-sm text-blue-100/80 mt-1 line-clamp-1">
              Explore products, analyze trends, and discover opportunities
            </p>
          </div>
          <div className="flex-shrink-0 p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-3 right-3">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />
            <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
          </div>
        </div>
      </motion.button>
    </div>
  );
};

export default AISearchBars;
