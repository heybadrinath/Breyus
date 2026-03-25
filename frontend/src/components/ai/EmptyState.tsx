/**
 * EmptyState Component
 * Enhanced empty results state for AI search with helpful suggestions
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ArrowLeft,
  Lightbulb,
  Globe,
  Tag,
  FileText,
  Sparkles,
} from 'lucide-react';

interface EmptyStateProps {
  commodity?: string;
  onSearchAgain?: () => void;
  onBroaderSearch?: () => void;
  suggestions?: string[];
  userRole?: 'Buyer' | 'Seller';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  commodity,
  onSearchAgain,
  onBroaderSearch,
  suggestions,
  userRole = 'Buyer',
}) => {
  const defaultSuggestions = [
    {
      icon: Tag,
      title: 'Try a broader term',
      description: 'Use general commodity names like "Rice" instead of specific varieties',
    },
    {
      icon: Globe,
      title: 'Remove location filters',
      description: 'Search globally to find more matches',
    },
    {
      icon: FileText,
      title: 'Use HS Code',
      description: 'Search by HS code for more accurate results',
    },
    {
      icon: Sparkles,
      title: 'Check spelling',
      description: 'Make sure the commodity name is spelled correctly',
    },
  ];

  const customSuggestions = suggestions?.map((s, i) => ({
    icon: [Tag, Globe, FileText, Sparkles][i % 4],
    title: s,
    description: '',
  }));

  const displaySuggestions = customSuggestions || defaultSuggestions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12 px-4"
    >
      <div className="max-w-lg mx-auto text-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="relative w-32 h-32 mx-auto mb-6"
        >
          {/* Background circle */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full" />
          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-16 h-16 text-gray-400" />
          </div>
          {/* Decorative dots */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-300 rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-300 rounded-full" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-300 rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-300 rounded-full" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-gray-800 mb-2"
        >
          No {userRole === 'Buyer' ? 'sellers' : 'buyers'} found
        </motion.h3>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 mb-8"
        >
          {commodity
            ? `We couldn't find any matches for "${commodity}". Try adjusting your search.`
            : "We couldn't find any matches for your search criteria."}
        </motion.p>

        {/* Suggestions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          {displaySuggestions.slice(0, 4).map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="p-4 bg-white rounded-xl border border-gray-200 text-left hover:border-blue-300 hover:shadow-sm transition-all cursor-default"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                <suggestion.icon className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-800 mb-1">{suggestion.title}</h4>
              {suggestion.description && (
                <p className="text-xs text-gray-500">{suggestion.description}</p>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-3"
        >
          {onSearchAgain && (
            <button
              onClick={onSearchAgain}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              New Search
            </button>
          )}
          {onBroaderSearch && (
            <button
              onClick={onBroaderSearch}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              Search Globally
            </button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EmptyState;
