import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

interface ProductInformationProps {
  productInformation: {
    name: string;
    stock: string;
    stockUnit: string;
    moq: string;
    moqUnit: string;
    description: string;
    detailedDescription: string;
    category: string;
    hsnCode: string;
    application: string;
    environmentalImpact: string;
    qualityAssurance: string;
  };
  setProductInformation: React.Dispatch<React.SetStateAction<{
    name: string;
    stock: string;
    stockUnit: string;
    moq: string;
    moqUnit: string;
    description: string;
    detailedDescription: string;
    category: string;
    hsnCode: string;
    application: string;
    environmentalImpact: string;
    qualityAssurance: string;
  }>>;
}

interface HSNRESULTS {
  _id: string;
  hsn_code: string;
  description: string;
  category: string;
}

const UNIT_OPTIONS = [
  { value: "", label: "Unit" },
  { value: "kg", label: "KG" },
  { value: "pieces", label: "Pieces" },
  { value: "boxes", label: "Boxes" },
  { value: "cartons", label: "Cartons" },
  { value: "grams", label: "Grams" },
  { value: "liters", label: "Liters" },
  { value: "tons", label: "Tons" },
  { value: "meters", label: "Meters" },
  { value: "sets", label: "Sets" },
  { value: "dozens", label: "Dozens" },
  { value: "pallets", label: "Pallets" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "Select Category" },
  { value: "oils", label: "Oils" },
  { value: "chemicals", label: "Chemicals" },
  { value: "metals", label: "Metals" },
  { value: "agriculture", label: "Agriculture" },
  { value: "textiles", label: "Textiles" },
  { value: "electronics", label: "Electronics" },
  { value: "machinery", label: "Machinery" },
  { value: "food", label: "Food Products" },
  { value: "pharmaceuticals", label: "Pharmaceuticals" },
  { value: "plastics", label: "Plastics" },
  { value: "other", label: "Other" },
];

const ProductInformation: React.FC<ProductInformationProps> = ({
  productInformation,
  setProductInformation
}) => {
  const [hsnQuery, setHsnQuery] = useState<string>(productInformation.hsnCode || '');
  const [hsnResults, setHsnResults] = useState<HSNRESULTS[]>([]);
  const [hsnLoading, setHsnLoading] = useState<boolean>(false);
  const [isHsnSelected, setIsHsnSelected] = useState<boolean>(!!productInformation.hsnCode);
  const [showHsnDropdown, setShowHsnDropdown] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductInformation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Debounced HSN search
  useEffect(() => {
    if (!hsnQuery || isHsnSelected) {
      setHsnResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setHsnLoading(true);
      try {
        const host = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${host}/products/hsn?q=${hsnQuery}`, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch data');
        const data: HSNRESULTS[] = await response.json();
        setHsnResults(data);
        setShowHsnDropdown(true);
      } catch (error) {
        console.error('Error fetching HSN data:', error);
      } finally {
        setHsnLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [hsnQuery, isHsnSelected]);

  const handleHsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHsnQuery(value);
    setIsHsnSelected(false);
    setShowHsnDropdown(true);
  };

  const handleHsnSelect = (item: HSNRESULTS) => {
    setHsnQuery(item.hsn_code);
    setHsnResults([]);
    setIsHsnSelected(true);
    setShowHsnDropdown(false);
    setProductInformation(prev => ({
      ...prev,
      hsnCode: item.hsn_code,
      category: item.category,
      description: prev.description || item.description
    }));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900">Product Information</h1>

      {/* Row 1: Name, Stock, and MOQ */}
      <div className="grid grid-cols-3 gap-6">
        {/* Name */}
        <div>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={productInformation.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Stock with Unit */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <input
            type="text"
            name="stock"
            placeholder="Stock"
            value={productInformation.stock}
            onChange={handleChange}
            className="flex-1 px-4 py-3 border-0 focus:ring-2 focus:ring-[#C4A962] outline-none"
          />
          <select
            name="stockUnit"
            value={productInformation.stockUnit}
            onChange={handleChange}
            className="px-3 py-3 bg-gray-50 border-l border-gray-300 text-gray-600 focus:outline-none cursor-pointer"
          >
            {UNIT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* MOQ with Unit */}
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <input
            type="text"
            name="moq"
            placeholder="MOQ"
            value={productInformation.moq}
            onChange={handleChange}
            className="flex-1 px-4 py-3 border-0 focus:ring-2 focus:ring-[#C4A962] outline-none"
          />
          <select
            name="moqUnit"
            value={productInformation.moqUnit}
            onChange={handleChange}
            className="px-3 py-3 bg-gray-50 border-l border-gray-300 text-gray-600 focus:outline-none cursor-pointer"
          >
            {UNIT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Description (left) and HSN/Category (right) */}
      <div className="grid grid-cols-2 gap-6">
        {/* Description Section */}
        <div className="space-y-0">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Precise Description */}
            <div className="relative">
              <input
                type="text"
                name="description"
                placeholder="Precise Description"
                value={productInformation.description}
                onChange={handleChange}
                maxLength={30}
                className="w-full px-4 py-3 border-0 border-b border-gray-200 focus:ring-2 focus:ring-[#C4A962] outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {productInformation.description.length}/30
              </span>
            </div>
            {/* Detailed Description */}
            <div className="relative">
              <textarea
                name="detailedDescription"
                placeholder="Detailed Description"
                value={productInformation.detailedDescription}
                onChange={handleChange}
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 border-0 focus:ring-2 focus:ring-[#C4A962] outline-none resize-none"
              />
              <span className="absolute right-3 bottom-3 text-xs text-gray-400">
                {productInformation.detailedDescription.length}/500
              </span>
            </div>
          </div>
        </div>

        {/* HSN Code and Category */}
        <div className="space-y-4">
          {/* HSN Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">HSN Code:</label>
            <div className="relative">
              <input
                type="text"
                value={hsnQuery}
                onChange={handleHsnChange}
                onFocus={() => !isHsnSelected && setShowHsnDropdown(true)}
                placeholder="Search HSN code..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none pr-10"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

              {/* HSN Dropdown */}
              {showHsnDropdown && hsnResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {hsnLoading ? (
                    <div className="px-4 py-3 text-gray-500">Loading...</div>
                  ) : (
                    hsnResults.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => handleHsnSelect(item)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <span className="font-medium text-gray-900">{item.hsn_code}</span>
                        <span className="text-gray-500 text-sm ml-2">- {item.description}</span>
                        <span className="text-gray-400 text-xs ml-2">({item.category})</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="relative">
              <select
                name="category"
                value={productInformation.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none appearance-none cursor-pointer bg-white"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} disabled={opt.value === ""}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Application and Environmental Impact */}
      <div className="grid grid-cols-2 gap-6">
        {/* Application */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Application</label>
          <div className="relative">
            <input
              type="text"
              name="application"
              placeholder="Practical application value"
              value={productInformation.application}
              onChange={handleChange}
              maxLength={30}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {productInformation.application.length}/30
            </span>
          </div>
        </div>

        {/* Environmental Impact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Environmental Impact</label>
          <div className="relative">
            <input
              type="text"
              name="environmentalImpact"
              placeholder="Effective Impact"
              value={productInformation.environmentalImpact}
              onChange={handleChange}
              maxLength={30}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {productInformation.environmentalImpact.length}/30
            </span>
          </div>
        </div>
      </div>

      {/* Row 4: Quality Assurance */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quality Assurance</label>
          <div className="relative">
            <input
              type="text"
              name="qualityAssurance"
              placeholder="Effective Quality"
              value={productInformation.qualityAssurance}
              onChange={handleChange}
              maxLength={30}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C4A962] focus:border-transparent outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {productInformation.qualityAssurance.length}/30
            </span>
          </div>
        </div>
        <div /> {/* Empty column for balance */}
      </div>
    </div>
  );
};

export default ProductInformation;
