/**
 * ErrorState Component
 * Enhanced error state with retry option and helpful guidance
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  RefreshCw,
  Wifi,
  Server,
  Clock,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  error: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  retryLabel?: string;
  errorType?: 'network' | 'server' | 'timeout' | 'unknown';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  error,
  onRetry,
  onGoBack,
  retryLabel = 'Try Again',
  errorType = 'unknown',
}) => {
  // Determine error type from message if not provided
  const detectedType = (() => {
    if (errorType !== 'unknown') return errorType;
    const lowerError = error.toLowerCase();
    if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('offline')) {
      return 'network';
    }
    if (lowerError.includes('server') || lowerError.includes('500') || lowerError.includes('502')) {
      return 'server';
    }
    if (lowerError.includes('timeout') || lowerError.includes('took too long')) {
      return 'timeout';
    }
    return 'unknown';
  })();

  const errorConfig = {
    network: {
      icon: Wifi,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      title: title || 'Connection Error',
      suggestion: 'Check your internet connection and try again.',
    },
    server: {
      icon: Server,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: title || 'Server Error',
      suggestion: 'Our servers are experiencing issues. Please try again in a few moments.',
    },
    timeout: {
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      title: title || 'Request Timeout',
      suggestion: 'The request took too long. This might be due to high load. Please try again.',
    },
    unknown: {
      icon: HelpCircle,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      title: title || 'Something went wrong',
      suggestion: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
    },
  };

  const config = errorConfig[detectedType];
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12 px-4"
    >
      <div className="max-w-md mx-auto">
        {/* Error Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-2xl border-2 ${config.bgColor} ${config.borderColor}`}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-4 relative"
          >
            <div className={`w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center`}>
              <IconComponent className={`w-8 h-8 ${config.color}`} />
            </div>
            {/* Animated ring */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 rounded-full border-2 ${config.borderColor}`}
            />
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-gray-800 text-center mb-2"
          >
            {config.title}
          </motion.h3>

          {/* Error message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-4"
          >
            <p className="text-gray-600 mb-2">{error}</p>
            <p className="text-sm text-gray-500">{config.suggestion}</p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                {retryLabel}
              </button>
            )}
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            )}
          </motion.div>
        </motion.div>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-gray-400 mt-4"
        >
          If this problem persists, please contact support
        </motion.p>
      </div>
    </motion.div>
  );
};

export default ErrorState;
