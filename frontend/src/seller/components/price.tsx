import React, { useEffect } from "react";
import { ChevronDown } from "lucide-react";

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
}

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

const Price: React.FC<PriceProps> = ({ priceData, setPriceData, moq }) => {

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

  // Calculate pricing (actual price considering sale)
  useEffect(() => {
    const newPricing = priceData.onSale && priceData.salePrice ? priceData.salePrice : priceData.price;
    setPriceData(prev => ({
      ...prev,
      pricing: newPricing
    }));
  }, [priceData.onSale, priceData.price, priceData.salePrice]);

  // Calculate sale price from discount
  useEffect(() => {
    if (priceData.onSale && priceData.price && priceData.discount) {
      const discountValue = Number(priceData.discount.replace('%', ''));
      const salePrice = Number(priceData.price) - (discountValue / 100) * Number(priceData.price);
      setPriceData(prev => ({
        ...prev,
        salePrice: String(salePrice.toFixed(2))
      }));
    } else if (!priceData.onSale) {
      setPriceData(prev => ({
        ...prev,
        salePrice: ''
      }));
    }
  }, [priceData.price, priceData.discount, priceData.onSale]);

  // Calculate profit
  useEffect(() => {
    if (priceData.pricing && priceData.costOfGoods) {
      const profit = Number(priceData.pricing) - Number(priceData.costOfGoods);
      setPriceData(prev => ({
        ...prev,
        profit: String(profit.toFixed(2)),
      }));
    }
  }, [priceData.pricing, priceData.costOfGoods]);

  // Calculate margin
  useEffect(() => {
    if (priceData.pricing && priceData.profit && Number(priceData.pricing) > 0) {
      const margin = (Number(priceData.profit) / Number(priceData.pricing)) * 100;
      setPriceData(prev => ({
        ...prev,
        margin: margin.toFixed(1) + '%',
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
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <input
              type="text"
              name="price"
              placeholder="Enter price"
              value={priceData.price}
              onChange={handleChange}
              className="flex-1 px-4 py-3 border-0 focus:ring-2 focus:ring-[#C4A962] outline-none"
            />
            <div className="relative">
              <select
                name="currency"
                value={priceData.currency}
                onChange={handleChange}
                className="h-full px-4 py-3 bg-gray-50 border-l border-gray-300 text-gray-600 focus:outline-none cursor-pointer appearance-none pr-8"
              >
                {CURRENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSale}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
            priceData.onSale ? 'bg-[#C4A962]' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              priceData.onSale ? 'translate-x-7' : 'translate-x-1'
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
              if (priceData.discount && !priceData.discount.endsWith('%')) {
                setPriceData(prev => ({
                  ...prev,
                  discount: priceData.discount + '%',
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
            placeholder="Effective price"
            value={priceData.pricing}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none bg-gray-50"
          />
        </div>

        <div className="flex items-center justify-center pb-3">
          <span className="text-2xl text-gray-400 font-light">−</span>
        </div>

        <div className="flex-1">
          <label className="block text-sm text-gray-500 mb-2">Cost of goods</label>
          <input
            type="text"
            name="costOfGoods"
            placeholder="Enter cost"
            value={priceData.costOfGoods}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none"
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
            placeholder="Profit"
            value={priceData.profit}
            readOnly
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none bg-gray-50"
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
