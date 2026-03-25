/**
 * Commodity AI Landing Page (Buyer)
 *
 * Main AI search page for mainstream commodities with full form:
 * - Commodity dropdown with autocomplete
 * - Country dropdown
 * - Port dropdown (filtered by country)
 * - Price range (currency + unit + from/to)
 *
 * Routes:
 * - Mainstream commodity → /buyer/ai-result (direct)
 * - Niche/custom commodity → /buyer/ai-select (selection page)
 */

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Sparkles, AlertTriangle, Loader2, Info } from "lucide-react";
import AiAnimation from "../../assets/ai/ai-animation.svg";

// Services
import {
  getCountries,
  getPorts,
  getCurrencies,
  getCategoriesGrouped,
  Country,
  Port,
  Currency,
  Category,
} from "../../services/content.service";
import { searchCommodities } from "../../services/ai.service";

// Components
import ComboboxDropdown, { ComboboxOption } from "../../components/ui/ComboboxDropdown";

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Tooltip display duration in milliseconds */
const TOOLTIP_DURATION_MS = 3000;

/** Price unit options with multipliers for calculation */
const PRICE_UNITS = [
  { value: "unit", label: "Per Unit", multiplier: 1 },
  { value: "thousand", label: "Thousand", multiplier: 1000 },
  { value: "lakh", label: "Lakhs", multiplier: 100000 },
  { value: "crore", label: "Crore", multiplier: 10000000 },
  { value: "million", label: "Million", multiplier: 1000000 },
] as const;

// ═══════════════════════════════════════════════════════════════
// ANIMATED BACKGROUND COMPONENT
// ═══════════════════════════════════════════════════════════════

const AnimatedBackground = () => (
  <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10 pointer-events-none">
    <motion.img
      src={AiAnimation}
      alt="AI Animation"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
      className="h-[80vh] w-[80vh]"
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════
// HEADER BUTTONS COMPONENT
// ═══════════════════════════════════════════════════════════════

interface HeaderButtonsProps {
  onNicheClick: () => void;
  onCoreClick: () => void;
  showCoreTooltip: boolean;
}

const HeaderButtons: React.FC<HeaderButtonsProps> = ({
  onNicheClick,
  onCoreClick,
  showCoreTooltip,
}) => (
  <div className="flex justify-center gap-4 mb-8">
    <button
      onClick={onNicheClick}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
    >
      <Sparkles className="w-4 h-4" />
      Try Breyus Niche AI
    </button>
    <div className="relative">
      <button
        onClick={onCoreClick}
        className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-500 rounded-full font-medium cursor-not-allowed"
      >
        Breyus Core AI
        <span className="text-xs bg-gray-300 px-2 py-0.5 rounded-full">Coming Soon</span>
      </button>
      {showCoreTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg whitespace-nowrap z-50"
        >
          Core AI is coming soon! Stay tuned.
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-8 border-transparent border-b-gray-900" />
        </motion.div>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const CommodityAIPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [commodity, setCommodity] = useState("");
  const [country, setCountry] = useState("");
  const [countryId, setCountryId] = useState("");
  const [port, setPort] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [priceUnit, setPriceUnit] = useState("unit");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");

  // Data State
  const [commodityOptions, setCommodityOptions] = useState<ComboboxOption[]>([]);
  const [countryOptions, setCountryOptions] = useState<ComboboxOption[]>([]);
  const [portOptions, setPortOptions] = useState<ComboboxOption[]>([]);
  const [currencyOptions, setCurrencyOptions] = useState<ComboboxOption[]>([]);

  // Loading States
  const [loadingCommodities, setLoadingCommodities] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // UI State
  const [showCoreTooltip, setShowCoreTooltip] = useState(false);
  const [isMainstreamCommodity, setIsMainstreamCommodity] = useState<boolean | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════

  // Load commodities (grouped)
  useEffect(() => {
    const fetchCommodities = async () => {
      setLoadingCommodities(true);
      try {
        const grouped = await getCategoriesGrouped();
        const options: ComboboxOption[] = [];

        // Add mainstream commodities
        grouped.mainstream.forEach((cat) => {
          options.push({
            value: cat.name,
            label: cat.name,
            subLabel: cat.hsCodePrefix ? `HS: ${cat.hsCodePrefix}` : undefined,
            group: "Mainstream",
            data: { isMainstream: true, category: cat },
          });
        });

        // Add niche commodities
        grouped.niche.forEach((cat) => {
          options.push({
            value: cat.name,
            label: cat.name,
            subLabel: cat.hsCodePrefix ? `HS: ${cat.hsCodePrefix}` : undefined,
            group: "Niche",
            data: { isMainstream: false, category: cat },
          });
        });

        setCommodityOptions(options);
      } catch (error) {
        console.error("Failed to fetch commodities:", error);
      } finally {
        setLoadingCommodities(false);
      }
    };

    fetchCommodities();
  }, []);

  // Load countries
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const countries = await getCountries();
        const options: ComboboxOption[] = countries.map((c) => ({
          value: c._id,
          label: c.name,
          subLabel: c.flagEmoji || undefined,
          data: c,
        }));
        setCountryOptions(options);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Load currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      setLoadingCurrencies(true);
      try {
        const currencies = await getCurrencies();
        const options: ComboboxOption[] = currencies.map((c) => ({
          value: c.code,
          label: `${c.code} (${c.symbol})`,
          data: c,
        }));
        setCurrencyOptions(options);
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
        // Fallback currencies
        setCurrencyOptions([
          { value: "USD", label: "USD ($)" },
          { value: "INR", label: "INR (₹)" },
          { value: "EUR", label: "EUR (€)" },
          { value: "GBP", label: "GBP (£)" },
        ]);
      } finally {
        setLoadingCurrencies(false);
      }
    };

    fetchCurrencies();
  }, []);

  // Load ports when country changes
  useEffect(() => {
    const fetchPorts = async () => {
      if (!countryId) {
        setPortOptions([]);
        return;
      }

      setLoadingPorts(true);
      try {
        const ports = await getPorts(countryId);
        const options: ComboboxOption[] = ports.map((p) => ({
          value: p.name,
          label: p.name,
          subLabel: `${p.type.toUpperCase()} - ${p.city || ""}`.trim(),
          data: p,
        }));
        setPortOptions(options);
      } catch (error) {
        console.error("Failed to fetch ports:", error);
      } finally {
        setLoadingPorts(false);
      }
    };

    fetchPorts();
  }, [countryId]);

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  // Handle commodity change
  const handleCommodityChange = useCallback(
    (value: string, option?: ComboboxOption) => {
      setCommodity(value);

      if (option?.data?.isMainstream !== undefined) {
        setIsMainstreamCommodity(option.data.isMainstream);
      } else {
        // Custom value - check if it matches any known commodity
        const matchedOption = commodityOptions.find(
          (opt) => opt.value.toLowerCase() === value.toLowerCase()
        );
        if (matchedOption?.data?.isMainstream !== undefined) {
          setIsMainstreamCommodity(matchedOption.data.isMainstream);
        } else {
          setIsMainstreamCommodity(null); // Unknown/custom
        }
      }
    },
    [commodityOptions]
  );

  // Handle country change
  const handleCountryChange = useCallback(
    (value: string, option?: ComboboxOption) => {
      if (option?.data) {
        setCountry(option.data.name);
        setCountryId(option.value);
      } else {
        setCountry(value);
        setCountryId("");
      }
      // Reset port when country changes
      setPort("");
    },
    []
  );

  // Handle port change
  const handlePortChange = useCallback((value: string, option?: ComboboxOption) => {
    setPort(value);
  }, []);

  // Handle Core AI click (tooltip) - use configuration constant
  const handleCoreClick = () => {
    setShowCoreTooltip(true);
    setTimeout(() => setShowCoreTooltip(false), TOOLTIP_DURATION_MS);
  };

  // Navigate to Niche AI
  const handleNicheClick = () => {
    navigate("/buyer/ai-niche");
  };

  // Calculate price range values using configuration
  const calculatePriceRange = (): { min?: number; max?: number } | undefined => {
    if (!priceFrom && !priceTo) return undefined;

    // Find multiplier from configuration to keep values in sync
    const unitConfig = PRICE_UNITS.find(u => u.value === priceUnit);
    const multiplier = unitConfig?.multiplier ?? 1;

    return {
      min: priceFrom ? parseFloat(priceFrom) * multiplier : undefined,
      max: priceTo ? parseFloat(priceTo) * multiplier : undefined,
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commodity.trim()) {
      alert("Please enter a commodity name");
      return;
    }

    setSubmitting(true);

    try {
      // Check if commodity is mainstream or niche
      const isKnownMainstream = isMainstreamCommodity === true;
      const isKnownNiche = isMainstreamCommodity === false;
      const isUnknown = isMainstreamCommodity === null;

      // Calculate price range
      const priceRange = calculatePriceRange();

      // Build state to pass
      const searchState = {
        commodity: commodity.trim(),
        country: country || undefined,
        port: port || undefined,
        priceMin: priceRange?.min,
        priceMax: priceRange?.max,
        currency: currency,
        priceUnit: priceUnit,
        isMainstream: isKnownMainstream,
        source: "commodity-ai",
      };

      if (isKnownMainstream) {
        // Go directly to results for mainstream commodities
        navigate("/buyer/ai-result", { state: searchState });
      } else {
        // Go to selection page for niche or unknown commodities
        navigate("/buyer/ai-select", { state: searchState });
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header Buttons */}
        <HeaderButtons
          onNicheClick={handleNicheClick}
          onCoreClick={handleCoreClick}
          showCoreTooltip={showCoreTooltip}
        />

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-3">
            Commodity Breyus AI
          </h1>
          <p className="text-xl text-gray-600">Explore unborn path unfazed</p>
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Commodity Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What commodity are you looking for?
              </label>
              <ComboboxDropdown
                options={commodityOptions}
                value={commodity}
                onChange={handleCommodityChange}
                placeholder="e.g., Iron, Coffee, Rice..."
                allowCustom={true}
                showCustomWarning={true}
                customWarningMessage="This commodity is not in our standard list. You may get limited results."
                loading={loadingCommodities}
                grouped={true}
                emptyMessage="No commodities found"
              />
              {isMainstreamCommodity === false && commodity && (
                <p className="mt-2 text-sm text-purple-600 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  This is a niche commodity - you'll see specialized options
                </p>
              )}
            </div>

            {/* Country Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which country would you prefer to buy from?
              </label>
              <ComboboxDropdown
                options={countryOptions}
                value={countryId || country}
                onChange={handleCountryChange}
                placeholder="Select a country..."
                allowCustom={true}
                showCustomWarning={false}
                loading={loadingCountries}
                emptyMessage="No countries found"
              />
            </div>

            {/* Port Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your nearest city or port for delivery?
              </label>
              <ComboboxDropdown
                options={portOptions}
                value={port}
                onChange={handlePortChange}
                placeholder={
                  countryId
                    ? "Select or enter a port..."
                    : "Select a country first..."
                }
                allowCustom={true}
                showCustomWarning={false}
                loading={loadingPorts}
                disabled={!countryId && !country}
                emptyMessage={
                  countryId
                    ? "No ports found. You can enter a custom port name."
                    : "Select a country first"
                }
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What price range are you exploring today?
              </label>
              {/* Responsive grid: 2 cols on mobile, 4 cols on larger screens */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Currency */}
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {currencyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Unit */}
                <select
                  value={priceUnit}
                  onChange={(e) => setPriceUnit(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {PRICE_UNITS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* From */}
                <input
                  type="number"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  placeholder="From"
                  min="0"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {/* To */}
                <input
                  type="number"
                  value={priceTo}
                  onChange={(e) => setPriceTo(e.target.value)}
                  placeholder="To"
                  min="0"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Leave empty to search all price ranges
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || !commodity.trim()}
                className={`
                  w-full py-4 px-6 rounded-xl font-semibold text-lg
                  flex items-center justify-center gap-3
                  transition-all duration-200 transform hover:scale-[1.02]
                  ${
                    submitting || !commodity.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl"
                  }
                `}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search with AI
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Info Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Breyus AI analyzes global trade data to find the best suppliers for your needs.
          </p>
          <p className="mt-1">
            Looking for unique commodities?{" "}
            <button
              onClick={handleNicheClick}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Try Niche AI
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommodityAIPage;
