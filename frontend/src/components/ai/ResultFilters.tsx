/**
 * ResultFilters Component
 * Filter and sort controls for AI search results
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  X,
  Check,
  MapPin,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { RiskLevel } from '../../types/aiTypes';

export type SortOption = 'probability_desc' | 'probability_asc' | 'risk_asc' | 'risk_desc' | 'name_asc';
export type RiskFilter = RiskLevel | 'all';
export type ProbabilityFilter = 'all' | 'high' | 'medium' | 'low';

interface ResultFiltersProps {
  // Filter values
  probabilityFilter: 'all' | 'high' | 'medium' | 'low';
  onProbabilityFilterChange: (value: 'all' | 'high' | 'medium' | 'low') => void;

  riskFilter: RiskFilter;
  onRiskFilterChange: (value: RiskFilter) => void;

  countryFilter: string;
  onCountryFilterChange: (value: string) => void;

  // Sort
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;

  // Available countries for filter dropdown
  availableCountries: string[];

  // Total and filtered count
  totalResults: number;
  filteredResults: number;

  // User role for labels
  userRole: 'Buyer' | 'Seller';
}

export const ResultFilters: React.FC<ResultFiltersProps> = ({
  probabilityFilter,
  onProbabilityFilterChange,
  riskFilter,
  onRiskFilterChange,
  countryFilter,
  onCountryFilterChange,
  sortBy,
  onSortChange,
  availableCountries,
  totalResults,
  filteredResults,
  userRole,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFiltersCount = [
    probabilityFilter !== 'all',
    riskFilter !== 'all',
    countryFilter !== '',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onProbabilityFilterChange('all');
    onRiskFilterChange('all');
    onCountryFilterChange('');
  };

  const getSortLabel = (sort: SortOption): string => {
    switch (sort) {
      case 'probability_desc': return 'Highest Probability';
      case 'probability_asc': return 'Lowest Probability';
      case 'risk_asc': return 'Lowest Risk';
      case 'risk_desc': return 'Highest Risk';
      case 'name_asc': return 'Name (A-Z)';
      default: return 'Sort';
    }
  };

  const probabilityLabel = userRole === 'Buyer' ? 'Selling' : 'Buying';

  return (
    <div className="space-y-3">
      {/* Main Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Filter Toggle & Quick Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white text-xs rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Quick Probability Filters */}
          <div className="flex items-center gap-1">
            {(['high', 'medium', 'low', 'all'] as const).map((level) => (
              <button
                key={level}
                onClick={() => onProbabilityFilterChange(level)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  probabilityFilter === level
                    ? level === 'high'
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : level === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      : level === 'low'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {level === 'all' ? 'All' : `${level.charAt(0).toUpperCase() + level.slice(1)} ${probabilityLabel}`}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Sort & Results Count */}
        <div className="flex items-center gap-3">
          {/* Results Count */}
          <span className="text-sm text-gray-500">
            {filteredResults === totalResults
              ? `${totalResults} results`
              : `${filteredResults} of ${totalResults} results`}
          </span>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {sortBy.includes('desc') ? (
                <SortDesc className="w-4 h-4" />
              ) : (
                <SortAsc className="w-4 h-4" />
              )}
              <span className="text-sm">{getSortLabel(sortBy)}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {sortDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                >
                  {([
                    { value: 'probability_desc', label: 'Highest Probability', icon: TrendingUp },
                    { value: 'probability_asc', label: 'Lowest Probability', icon: TrendingUp },
                    { value: 'risk_asc', label: 'Lowest Risk', icon: AlertTriangle },
                    { value: 'risk_desc', label: 'Highest Risk', icon: AlertTriangle },
                    { value: 'name_asc', label: 'Name (A-Z)', icon: SortAsc },
                  ] as const).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                        sortBy === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <option.icon className="w-4 h-4" />
                      {option.label}
                      {sortBy === option.value && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Advanced Filters</h4>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Country Filter */}
                <div className="relative" ref={countryDropdownRef}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    Country
                  </label>
                  <button
                    onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:border-gray-400 transition-colors"
                  >
                    <span className={countryFilter ? 'text-gray-900' : 'text-gray-400'}>
                      {countryFilter || 'All Countries'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {countryDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                      >
                        <button
                          onClick={() => {
                            onCountryFilterChange('');
                            setCountryDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                            !countryFilter ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          All Countries
                        </button>
                        {availableCountries.map((country) => (
                          <button
                            key={country}
                            onClick={() => {
                              onCountryFilterChange(country);
                              setCountryDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                              countryFilter === country ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            {country}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Risk Level Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Risk Level
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {(['all', 'Very Low', 'Low', 'Medium', 'High', 'Very High'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => onRiskFilterChange(level)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                          riskFilter === level
                            ? level === 'all'
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : level === 'Very Low' || level === 'Low'
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : level === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                              : 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {level === 'all' ? 'All' : level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && !showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Active filters:</span>
          {probabilityFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {probabilityFilter} probability
              <button onClick={() => onProbabilityFilterChange('all')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {riskFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {riskFilter} risk
              <button onClick={() => onRiskFilterChange('all')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {countryFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              {countryFilter}
              <button onClick={() => onCountryFilterChange('')} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultFilters;
