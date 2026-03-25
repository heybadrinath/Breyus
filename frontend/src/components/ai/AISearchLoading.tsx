/**
 * AISearchLoading Component
 * Interactive loading state for AI search with step progression
 */

import React, { useState, useEffect } from 'react';
import { Loader2, Search, Globe2, BarChart3, Users } from 'lucide-react';

interface AISearchLoadingProps {
  userRole: 'Buyer' | 'Seller';
  commodity?: string;
}

interface LoadingStep {
  icon: React.ReactNode;
  label: string;
  duration: number; // ms to stay on this step
}

export const AISearchLoading: React.FC<AISearchLoadingProps> = ({
  userRole,
  commodity,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: LoadingStep[] = userRole === 'Buyer'
    ? [
        { icon: <Search className="w-5 h-5" />, label: 'Analyzing commodity...', duration: 1500 },
        { icon: <Globe2 className="w-5 h-5" />, label: 'Searching global sellers...', duration: 2000 },
        { icon: <BarChart3 className="w-5 h-5" />, label: 'Matching platform products...', duration: 1500 },
        { icon: <Users className="w-5 h-5" />, label: 'Calculating match scores...', duration: 2000 },
      ]
    : [
        { icon: <Search className="w-5 h-5" />, label: 'Analyzing commodity...', duration: 1500 },
        { icon: <Globe2 className="w-5 h-5" />, label: 'Searching potential buyers...', duration: 2000 },
        { icon: <Users className="w-5 h-5" />, label: 'Checking platform history...', duration: 1500 },
        { icon: <BarChart3 className="w-5 h-5" />, label: 'Calculating probabilities...', duration: 2000 },
      ];

  useEffect(() => {
    if (currentStep >= steps.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
    }, steps[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep, steps]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Main spinner */}
      <div className="relative mb-8">
        <div className="w-24 h-24 relative">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
          {/* Inner icon */}
          <div className="absolute inset-0 flex items-center justify-center text-blue-500">
            {steps[currentStep].icon}
          </div>
        </div>

        {/* Pulse effect */}
        <div className="absolute inset-0 w-24 h-24 rounded-full animate-ping bg-blue-400/20" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Finding the best {userRole === 'Buyer' ? 'sellers' : 'buyers'}...
      </h3>

      {commodity && (
        <p className="text-gray-500 mb-6">
          Searching for "<span className="font-medium text-gray-700">{commodity}</span>"
        </p>
      )}

      {/* Steps progress */}
      <div className="w-full max-w-sm space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 transition-all duration-300 ${
              index <= currentStep ? 'opacity-100' : 'opacity-40'
            }`}
          >
            {/* Step indicator */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                index < currentStep
                  ? 'bg-green-100 text-green-600'
                  : index === currentStep
                  ? 'bg-blue-100 text-blue-600 animate-pulse'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {index < currentStep ? (
                <span className="text-sm font-medium">✓</span>
              ) : index === currentStep ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>

            {/* Step label */}
            <span
              className={`text-sm ${
                index === currentStep
                  ? 'text-blue-600 font-medium'
                  : index < currentStep
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Fun fact or tip */}
      <div className="mt-8 px-6 py-4 bg-blue-50 rounded-lg max-w-sm text-center">
        <p className="text-sm text-blue-700">
          💡 {userRole === 'Buyer'
            ? 'Our AI analyzes over 5.6 million trade records to find the best matches for you'
            : 'We prioritize buyers who have successfully completed trades on our platform'}
        </p>
      </div>
    </div>
  );
};

export default AISearchLoading;
