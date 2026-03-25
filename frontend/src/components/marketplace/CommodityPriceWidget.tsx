import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { commodityService } from '../../services/commodity.service';
import type { CommodityPrice, CommodityPriceSummary, PriceHistoryPoint } from '../../types/marketplaceTypes';

/**
 * Mini Sparkline Component
 * Renders a simple SVG line chart showing price trend
 */
interface SparklineProps {
  data: PriceHistoryPoint[];
  width?: number;
  height?: number;
  color?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 60,
  height = 24,
  color,
}) => {
  if (!data || data.length < 2) {
    return <div className="w-[60px] h-[24px] bg-gray-100 rounded" />;
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Calculate if trend is up or down
  const isUp = values[values.length - 1] >= values[0];
  const strokeColor = color || (isUp ? '#10b981' : '#ef4444');

  // Generate SVG path points
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current price dot */}
      <circle
        cx={width}
        cy={height - ((values[values.length - 1] - min) / range) * height * 0.8 - height * 0.1}
        r="2"
        fill={strokeColor}
      />
    </svg>
  );
};

/**
 * Price Detail Modal
 * Shows expanded price history chart and details
 */
interface PriceDetailModalProps {
  commodity: CommodityPrice;
  onClose: () => void;
}

const PriceDetailModal: React.FC<PriceDetailModalProps> = ({ commodity, onClose }) => {
  const formatPrice = (price: number | null | undefined) => {
    if (price == null || !isFinite(price)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const isUp = (commodity.change ?? 0) >= 0;
  const priceHistory = commodity.priceHistory || [];

  // Calculate min/max for the chart
  const values = priceHistory.map((d) => d.value).filter((v) => isFinite(v));
  const chartMin = values.length > 0 ? Math.min(...values) : 0;
  const chartMax = values.length > 0 ? Math.max(...values) : 100;
  const chartRange = chartMax - chartMin || 1;

  // Use backend values or calculate from priceHistory
  const weekHigh = commodity.weekHigh && isFinite(commodity.weekHigh) ? commodity.weekHigh : chartMax;
  const weekLow = commodity.weekLow && isFinite(commodity.weekLow) ? commodity.weekLow : chartMin;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-gray-900">{commodity.name}</h3>
              <span className="text-sm text-gray-500">{commodity.symbol}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Price Display */}
          <div className="p-4 bg-gray-50">
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(commodity.price)}
              </span>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
                  isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {isUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span>
                  {(commodity.changePercent ?? 0) >= 0 ? '+' : ''}
                  {(commodity.changePercent ?? 0).toFixed(2)}%
                </span>
              </div>
            </div>
            <span className="text-sm text-gray-500">{commodity.unit}</span>
          </div>

          {/* 7-Day Chart */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">7-Day Price History</h4>
            {priceHistory.length > 1 ? (
              <div className="relative h-32 bg-gray-50 rounded-lg p-3">
                <svg viewBox={`0 0 280 100`} className="w-full h-full">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="280"
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                    />
                  ))}
                  {/* Price line */}
                  <polyline
                    points={priceHistory
                      .map((point, index) => {
                        const x = (index / (priceHistory.length - 1)) * 280;
                        const y = 100 - ((point.value - chartMin) / chartRange) * 80 - 10;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke={isUp ? '#10b981' : '#ef4444'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Area fill */}
                  <polygon
                    points={`0,100 ${priceHistory
                      .map((point, index) => {
                        const x = (index / (priceHistory.length - 1)) * 280;
                        const y = 100 - ((point.value - chartMin) / chartRange) * 80 - 10;
                        return `${x},${y}`;
                      })
                      .join(' ')} 280,100`}
                    fill={isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                  />
                  {/* Data points */}
                  {priceHistory.map((point, index) => {
                    const x = (index / (priceHistory.length - 1)) * 280;
                    const y = 100 - ((point.value - chartMin) / chartRange) * 80 - 10;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="3"
                        fill={isUp ? '#10b981' : '#ef4444'}
                      />
                    );
                  })}
                </svg>
                {/* Date labels */}
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>
                    {priceHistory[0]?.date
                      ? new Date(priceHistory[0].date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : ''}
                  </span>
                  <span>
                    {priceHistory[priceHistory.length - 1]?.date
                      ? new Date(priceHistory[priceHistory.length - 1].date).toLocaleDateString(
                          'en-US',
                          { month: 'short', day: 'numeric' }
                        )
                      : 'Today'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                No historical data available
              </div>
            )}
          </div>

          {/* 7-Day Stats */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3">
                <span className="text-xs text-green-600 font-medium">7-Day High</span>
                <p className="text-lg font-semibold text-green-700">
                  {formatPrice(weekHigh)}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <span className="text-xs text-red-600 font-medium">7-Day Low</span>
                <p className="text-lg font-semibold text-red-700">
                  {formatPrice(weekLow)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Category: {commodity.category}</span>
              <span>15-min delayed</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * CommodityPriceWidget - Displays real commodity prices from Alpha Vantage
 *
 * Features:
 * - Real-time data from Alpha Vantage API
 * - Category filter
 * - Price change indicators (green/red)
 * - Mini sparkline charts showing 7-day trend
 * - Weekly high/low indicators
 * - Click-to-expand detail modal
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
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityPrice | null>(null);

  const categories: { value: string; label: string }[] = [
    { value: 'all', label: 'All Commodities' },
    { value: 'Precious Metals', label: 'Precious Metals' },
    { value: 'Energy', label: 'Energy' },
    { value: 'Agricultural', label: 'Agricultural' },
    { value: 'Metals', label: 'Base Metals' },
  ];

  const fetchPrices = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchPrices();

    // Check for updates every 5 minutes (the backend handles rate limiting)
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Filter prices by category
  const filteredPrices =
    data?.prices.filter(
      (price) => selectedCategory === 'all' || price.category === selectedCategory
    ) || [];

  // Format price with currency
  const formatPrice = (price: number | null | undefined, currency: string = 'USD') => {
    if (price == null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Format percent change
  const formatPercent = (percent: number | null | undefined) => {
    if (percent == null) return 'N/A';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  // Get change color and icon
  const getChangeStyles = (change: number | null | undefined) => {
    if (change != null && change > 0) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: TrendingUp,
      };
    }
    if (change != null && change < 0) {
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
    <>
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
              <h3 className="font-semibold text-gray-900">Commodity Prices</h3>
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
                      <li>• Click any row for 7-day chart</li>
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
              <ChevronDown
                className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute z-10 w-full mt-1 bg-white rounded-lg
                           shadow-lg border border-gray-200 py-1"
              >
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
        <div className="max-h-[400px] overflow-y-auto">
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px]">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-[11px] text-gray-500">
                    <th className="text-left py-1.5 px-2 font-medium">Name</th>
                    <th className="text-center py-1.5 px-1 font-medium w-12">7D</th>
                    <th className="text-right py-1.5 px-2 font-medium">Price</th>
                    <th className="text-right py-1.5 px-2 font-medium w-16">Chg</th>
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
                                   hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedCommodity(commodity)}
                      >
                        <td className="py-1.5 px-2">
                          <span className="font-medium text-gray-900 text-xs block truncate max-w-[100px]">
                            {commodity.name}
                          </span>
                          <span className="text-[10px] text-gray-400">{commodity.symbol}</span>
                        </td>
                        <td className="py-1.5 px-1">
                          <div className="flex justify-center">
                            <Sparkline data={commodity.priceHistory || []} width={40} height={16} />
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <span className="font-semibold text-gray-900 text-xs">
                            {formatPrice(commodity.price)}
                          </span>
                          <span className="block text-[10px] text-gray-400">{commodity.unit}</span>
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <span className={`text-[11px] font-medium ${styles.color}`}>
                            {formatPercent(commodity.changePercent)}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer - Data Source & Refresh Info */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
          {/* Data Source */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Source:{' '}
              <span className="font-medium text-gray-700">
                {data?.dataSource || 'Alpha Vantage'}
              </span>
            </span>
            <span className="text-gray-400">Refreshes every {data?.refreshIntervalHours || 12}h</span>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated:{' '}
              <span className="font-medium">{formatDateTime(data?.lastUpdated ?? null)}</span>
            </span>
            <span>
              Next:{' '}
              <span className="font-medium">{formatNextRefresh(data?.nextRefreshAt ?? null)}</span>
            </span>
          </div>
        </div>
      </motion.div>

      {/* Price Detail Modal */}
      {selectedCommodity && (
        <PriceDetailModal
          commodity={selectedCommodity}
          onClose={() => setSelectedCommodity(null)}
        />
      )}
    </>
  );
};

export default CommodityPriceWidget;
