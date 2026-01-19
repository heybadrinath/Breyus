import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Clock,
  ChevronDown,
  Loader2,
  Info,
  ExternalLink,
} from 'lucide-react';
import { commodityService } from '../../services/commodity.service';
import type { CommodityPrice, CommodityPriceSummary } from '../../types/marketplaceTypes';

/**
 * CommodityPriceWidget - Displays real commodity prices from Alpha Vantage
 *
 * Features:
 * - Real-time data from Alpha Vantage API
 * - Category filter
 * - Price change indicators (green/red)
 * - Shows data source, last updated, next refresh time
 * - Loading states for initial load and background refresh
 */
const CommodityPriceWidget: React.FC = () => {
  const [data, setData] = useState<CommodityPriceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const categories: { value: string; label: string }[] = [
    { value: 'all', label: 'All Commodities' },
    { value: 'Precious Metals', label: 'Precious Metals' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Agricultural', label: 'Agricultural' },
    { value: 'Metals', label: 'Base Metals' },
  ];

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const summary = await commodityService.getPriceSummary();
      setData(summary);
      setError(null);
    } catch (err) {
      setError('Failed to load commodity prices');
      console.error('Commodity price fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    // Check for updates every 5 minutes (the backend handles rate limiting)
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter prices by category
  const filteredPrices = data?.prices.filter((price) =>
    selectedCategory === 'all' || price.category === selectedCategory
  ) || [];

  // Format price with currency
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Format percent change
  const formatPercent = (percent: number) => {
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  // Get change color and icon
  const getChangeStyles = (change: number) => {
    if (change > 0) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: TrendingUp,
      };
    }
    if (change < 0) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: TrendingDown,
      };
    }
    return {
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      icon: Minus,
    };
  };

  // Format datetime for display
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    // Show relative time if recent
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    // Show date/time for older data
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format next refresh time
  const formatNextRefresh = (dateStr: string | null) => {
    if (!dateStr) return 'Pending';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs <= 0) return 'Soon';

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 60) return `in ${diffMins}m`;
    return `in ${diffHours}h ${diffMins % 60}m`;
  };

  const isBackgroundLoading = data?.isLoading && !loading;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">
              Commodity Prices
            </h3>
            {isBackgroundLoading && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Info tooltip */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
              {showInfoTooltip && (
                <div className="absolute right-0 top-full mt-1 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-20">
                  <p className="font-medium mb-2">About This Data</p>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Source: {data?.dataSource || 'Alpha Vantage'}</li>
                    <li>• Updates every {data?.refreshIntervalHours || 12} hours</li>
                    <li>• Prices are 15-min delayed</li>
                    <li>• Data refreshes when users visit</li>
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={fetchPrices}
              disabled={loading}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100
                         rounded-lg transition-colors"
              title="Refresh prices"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="relative mt-3">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm
                       bg-gray-50 rounded-lg border border-gray-200 text-gray-700"
          >
            {categories.find((c) => c.value === selectedCategory)?.label}
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg
                           shadow-lg border border-gray-200 py-1">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    setSelectedCategory(cat.value);
                    setDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50
                             transition-colors ${
                               selectedCategory === cat.value
                                 ? 'text-emerald-600 font-medium'
                                 : 'text-gray-700'
                             }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price List */}
      <div className="max-h-[320px] overflow-y-auto">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
            <span className="text-sm">Loading prices...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={fetchPrices}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Try again
            </button>
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-medium">No prices available yet</p>
            <p className="text-xs mt-1">
              {data?.isLoading
                ? 'Fetching data from Alpha Vantage...'
                : 'Data will load on first visit'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-xs text-gray-500">
                <th className="text-left py-2 px-4 font-medium">Name</th>
                <th className="text-right py-2 px-4 font-medium">Price</th>
                <th className="text-right py-2 px-4 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrices.map((commodity, index) => {
                const styles = getChangeStyles(commodity.change);
                const Icon = styles.icon;

                return (
                  <motion.tr
                    key={commodity.symbol}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-gray-50 last:border-b-0
                               hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">
                          {commodity.name}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {commodity.symbol}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="font-semibold text-gray-900 text-sm">
                        {formatPrice(commodity.price)}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {commodity.unit}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${styles.bgColor} ${styles.color}`}>
                        <Icon className="w-3 h-3" />
                        <span>{formatPercent(commodity.changePercent)}</span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer - Data Source & Refresh Info */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
        {/* Data Source */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Source: <span className="font-medium text-gray-700">{data?.dataSource || 'Alpha Vantage'}</span>
          </span>
          <span className="text-gray-400">
            Refreshes every {data?.refreshIntervalHours || 12}h
          </span>
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated: <span className="font-medium">{formatDateTime(data?.lastUpdated ?? null)}</span>
          </span>
          <span>
            Next: <span className="font-medium">{formatNextRefresh(data?.nextRefreshAt ?? null)}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default CommodityPriceWidget;
