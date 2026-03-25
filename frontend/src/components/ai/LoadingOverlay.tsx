/**
 * LoadingOverlay Component
 * Full-page loading overlay for heavy AI operations
 */

import React from 'react';
import { Loader2, X } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
  steps?: {
    label: string;
    completed: boolean;
  }[];
  onDismiss?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message,
  subMessage,
  showProgress = false,
  progress = 0,
  steps,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl animate-fadeIn relative">
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {/* Loading Indicator */}
        <div className="relative mb-6">
          {showProgress ? (
            <div className="relative w-24 h-24 mx-auto">
              {/* Background circle */}
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#3B82F6"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
              {/* Progress percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-700">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
              <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Message */}
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{message}</h3>
        {subMessage && (
          <p className="text-gray-500 text-sm">{subMessage}</p>
        )}

        {/* Steps indicator */}
        {steps && steps.length > 0 && (
          <div className="mt-6 space-y-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm ${
                  step.completed ? 'text-green-600' : 'text-gray-400'
                } transition-colors duration-300`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    step.completed
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.completed ? '✓' : index + 1}
                </span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
