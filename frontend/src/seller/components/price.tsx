import React, { useEffect, useRef, useState } from "react";
import SelectField from "../../components/SelectField";
import { getCurrencies, Currency } from "../../services/content.service";

interface PriceProps {
  priceData: {
    price: string;
    currency: string;
    sku: string;
    onSale: boolean;
    discount: string;
    salePrice: string;
    costOfGoods: string;
    profit: string;
    pricing: string;
    margin: string;
  };
  setPriceData: React.Dispatch<React.SetStateAction<{
    price: string;
    currency: string;
    sku: string;
    onSale: boolean;
    discount: string;
    salePrice: string;
    costOfGoods: string;
    profit: string;
    pricing: string;
    margin: string;
  }>>;
  moq: string;
  category: string;
}

// Fallback currencies if API fails
const FALLBACK_CURRENCIES = [
  { value: "INR", label: "INR (₹)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
];

const Price: React.FC<PriceProps> = ({ priceData, setPriceData, moq, category }) => {
  const hasGeneratedSku = useRef(false);

  // Admin-controlled currencies
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(true);

  // Fetch currencies from admin portal on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const data = await getCurrencies();
        setCurrencies(data);
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
      } finally {
        setCurrenciesLoading(false);
      }
    };
    fetchCurrencies();
  }, []);
  const categoryCode = (value: string) => {
    if (!value) return 'GEN';
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleaned) return 'GEN';
    return cleaned.slice(0, 4);
  };

  const toggleSale = () => {
    setPriceData(prev => ({
      ...prev,
      onSale: !prev.onSale
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setPriceData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  useEffect(() => {
    if (!priceData.sku && !hasGeneratedSku.current) {
      const sku = `BRY-${categoryCode(category)}-${Math.floor(Math.random() * 9000 + 1000)}`;
      hasGeneratedSku.current = true;
      setPriceData(prev => ({
        ...prev,
        sku,
      }));
    }
  }, [priceData.sku, setPriceData]);

  // Helper to check if a value is a valid positive number
  // Handles both string and number inputs (backend may return numbers)
  const isValidNumber = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return false;
    const strVal = String(val);
    const num = Number(strVal);
    return !isNaN(num) && strVal.trim() !== '';
  };

  // Calculate pricing (actual price considering sale)
  useEffect(() => {
    const priceValue = priceData.onSale && priceData.salePrice ? priceData.salePrice : priceData.price;
    // Only set pricing if it's a valid number
    if (isValidNumber(priceValue)) {
      setPriceData(prev => ({
        ...prev,
        pricing: priceValue
      }));
    } else {
      setPriceData(prev => ({
        ...prev,
        pricing: ''
      }));
    }
  }, [priceData.onSale, priceData.price, priceData.salePrice]);

  // Calculate sale price from discount
  useEffect(() => {
    if (priceData.onSale && isValidNumber(priceData.price) && priceData.discount) {
      // Convert to string first in case backend returns a number
      const discountValue = Number(String(priceData.discount).replace('%', ''));
      if (!isNaN(discountValue) && discountValue > 0) {
        const salePrice = Number(priceData.price) - (discountValue / 100) * Number(priceData.price);
        setPriceData(prev => ({
          ...prev,
          salePrice: salePrice.toFixed(2)
        }));
      }
    } else if (!priceData.onSale) {
      setPriceData(prev => ({
        ...prev,
        salePrice: ''
      }));
    }
  }, [priceData.price, priceData.discount, priceData.onSale]);

  // Calculate profit
  useEffect(() => {
    if (isValidNumber(priceData.pricing) && isValidNumber(priceData.costOfGoods)) {
      const profit = Number(priceData.pricing) - Number(priceData.costOfGoods);
      setPriceData(prev => ({
        ...prev,
        profit: profit.toFixed(2),
      }));
    } else {
      setPriceData(prev => ({
        ...prev,
        profit: '',
      }));
    }
  }, [priceData.pricing, priceData.costOfGoods]);

  // Calculate margin
  useEffect(() => {
    if (isValidNumber(priceData.pricing) && isValidNumber(priceData.profit) && Number(priceData.pricing) > 0) {
      const margin = (Number(priceData.profit) / Number(priceData.pricing)) * 100;
      if (!isNaN(margin)) {
        setPriceData(prev => ({
          ...prev,
          margin: margin.toFixed(1) + '%',
        }));
      }
    } else {
      setPriceData(prev => ({
        ...prev,
        margin: '',
      }));
    }
  }, [priceData.pricing, priceData.profit]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>

      {/* Row 1: Price/Unit with Currency dropdown + SKU */}
      <div className="grid grid-cols-2 gap-6">
        {/* Price with Currency */}
        <div>
          <label className="block text-sm text-gray-500 mb-2">
            Price/ Unit (Unit = Chosen unit in MOQ )
          </label>
          <div className="flex border border-gray-300 rounded-lg overflow-visible">
            <input
              type="number"
              name="price"
              placeholder="Enter price"
              value={priceData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="flex-1 px-4 py-3 border-0 focus:ring-2 focus:ring-[#C4A962] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <SelectField
              name="currency"
              value={priceData.currency}
              onChange={handleChange}
              wrapperClassName="h-full min-w-[100px]"
              className="select-field--inline h-full bg-gray-50 border-l border-gray-300 text-gray-600 px-3"
            >
              {currenciesLoading ? (
                <option value="">...</option>
              ) : currencies.length === 0 ? (
                FALLBACK_CURRENCIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              ) : (
                currencies.map((currency) => (
                  <option key={currency._id} value={currency.code}>
                    {`${currency.code} ${currency.symbol}`}
                  </option>
                ))
              )}
            </SelectField>
          </div>
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm text-gray-500 mb-2">SKU</label>
          <input
            type="text"
            name="sku"
            placeholder="Enter SKU"
            value={priceData.sku}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* On Sale Toggle */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSale}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#C4A962] focus:ring-offset-2 ${
            priceData.onSale ? 'bg-[#C4A962]' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={priceData.onSale}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              priceData.onSale ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm font-medium text-gray-700">On Sale</span>
      </div>

      {/* Row 2: Discount and Sale Price */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm text-gray-500 mb-2">Discount</label>
          <input
            type="text"
            name="discount"
            placeholder="Enter discount %"
            value={priceData.discount}
            onChange={handleChange}
            disabled={!priceData.onSale}
            onBlur={() => {
              if (priceData.discount && !String(priceData.discount).endsWith('%')) {
                setPriceData(prev => ({
                  ...prev,
                  discount: String(priceData.discount) + '%',
                }));
              }
            }}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none ${
              !priceData.onSale ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
            }`}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-2">Sale Price</label>
          <input
            type="text"
            name="salePrice"
            placeholder="Calculated sale price"
            value={priceData.salePrice}
            readOnly
            disabled={!priceData.onSale}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg outline-none ${
              !priceData.onSale ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50'
            }`}
          />
        </div>
      </div>

      {/* Row 3: Pricing - Cost of goods = Profit */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm text-gray-500 mb-2">Pricing</label>
          <input
            type="text"
            name="pricing"
            placeholder="—"
            value={priceData.pricing || '—'}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none bg-gray-100 text-gray-600"
          />
        </div>

        <div className="flex items-center justify-center pb-3">
          <span className="text-2xl text-gray-400 font-light">−</span>
        </div>

        <div className="flex-1">
          <label className="block text-sm text-gray-500 mb-2">Cost of goods</label>
          <input
            type="number"
            name="costOfGoods"
            placeholder="Enter cost"
            value={priceData.costOfGoods}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div className="flex items-center justify-center pb-3">
          <span className="text-2xl text-gray-400 font-light">=</span>
        </div>

        <div className="flex-1">
          <label className="block text-sm text-gray-500 mb-2">Profit</label>
          <input
            type="text"
            name="profit"
            placeholder="—"
            value={priceData.profit || '—'}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none bg-gray-100 text-gray-600"
          />
        </div>
      </div>

      {/* Margin display (optional - not in Figma but useful) */}
      {priceData.margin && (
        <div className="text-sm text-gray-500">
          Profit Margin: <span className="font-medium text-gray-700">{priceData.margin}</span>
        </div>
      )}
    </div>
  );
};

export default Price;
