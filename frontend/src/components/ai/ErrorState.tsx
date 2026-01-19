/**
 * ErrorState Component
 * Error state with retry option for AI operations
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  error: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  error,
  onRetry,
  retryLabel = 'Try Again',
}) => {
  return (
    <div className="text-center py-12 px-4">
      {/* Icon */}
      <div className="w-20 h-20 mx-auto mb-6 text-red-400">
        <AlertCircle className="w-20 h-20" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>

      {/* Error message */}
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </button>
      )}
    </div>
  );
};

export default ErrorState;
