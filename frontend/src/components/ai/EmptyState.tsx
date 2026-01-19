/**
 * EmptyState Component
 * Empty results state for AI search
 */

import React from 'react';
import { Search, ArrowLeft } from 'lucide-react';

interface EmptyStateProps {
  commodity?: string;
  onSearchAgain?: () => void;
  suggestions?: string[];
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  commodity,
  onSearchAgain,
  suggestions = [
    'Using a broader commodity name',
    'Checking the spelling',
    'Searching by HS code instead',
    'Trying a different country or port',
  ],
}) => {
  return (
    <div className="text-center py-12 px-4">
      {/* Icon */}
      <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
        <Search className="w-24 h-24" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">No matches found</h3>

      {/* Message */}
      <p className="text-gray-500 mb-4 max-w-md mx-auto">
        {commodity
          ? `We couldn't find any matches for "${commodity}"`
          : "We couldn't find any matches for your search criteria"}
      </p>

      {/* Suggestions */}
      <div className="mb-6 max-w-md mx-auto">
        <p className="text-sm text-gray-400 mb-2">Try:</p>
        <ul className="text-sm text-gray-500 space-y-1">
          {suggestions.map((suggestion, index) => (
            <li key={index}>• {suggestion}</li>
          ))}
        </ul>
      </div>

      {/* Search again button */}
      {onSearchAgain && (
        <button
          onClick={onSearchAgain}
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Search Again
        </button>
      )}
    </div>
  );
};

export default EmptyState;
