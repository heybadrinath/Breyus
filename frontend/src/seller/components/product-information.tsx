import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import SelectField from "../../components/SelectField";
import UnitSelector from "../../components/UnitSelector";
import CategorySelector from "../../components/CategorySelector";

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
    categoryId?: string; // New: Category ObjectId for database reference
    isNicheCommodity?: boolean; // New: Classification from category
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
    categoryId?: string;
    isNicheCommodity?: boolean;
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

// Unit and Category options are now fetched dynamically from the admin-managed content API
// via UnitSelector and CascadingCategorySelector components

const ProductInformation: React.FC<ProductInformationProps> = ({
  productInformation,
  setProductInformation
}) => {
  const [hsnQuery, setHsnQuery] = useState<string>(productInformation.hsnCode || '');
  const [hsnResults, setHsnResults] = useState<HSNRESULTS[]>([]);
  const [hsnLoading, setHsnLoading] = useState<boolean>(false);
  const [isHsnSelected, setIsHsnSelected] = useState<boolean>(!!productInformation.hsnCode);
  const [showHsnDropdown, setShowHsnDropdown] = useState(false);

  useEffect(() => {
    if (productInformation.hsnCode) {
      setHsnQuery(productInformation.hsnCode);
      setIsHsnSelected(true);
      setShowHsnDropdown(false);
    } else {
      setHsnQuery('');
      setIsHsnSelected(false);
    }
  }, [productInformation.hsnCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Sync stockUnit and moqUnit - they should always be the same
    if (name === 'stockUnit' || name === 'moqUnit') {
      setProductInformation(prev => ({
        ...prev,
        stockUnit: value,
        moqUnit: value,
      }));
    } else {
      setProductInformation(prev => ({
        ...prev,
        [name]: value
      }));
    }
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

  // Handle category selection from the new grouped CategorySelector
  const handleCategoryChange = (categoryId: string, isMainstream: boolean, categoryName: string) => {
    setProductInformation(prev => ({
      ...prev,
      category: categoryName, // Store the category name for display
      categoryId: categoryId, // Store the category ID for database reference
      isNicheCommodity: !isMainstream, // Inverse of isMainstream
    }));
  };

  // Handle new category suggestion
  const handleCategorySuggested = (name: string) => {
    console.log('User suggested new category:', name);
    // The category is now pending admin approval
    // User will need to wait or select an existing category
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
        <div className="flex border border-gray-300 rounded-lg overflow-visible">
          <input
            type="text"
            name="stock"
            placeholder="Stock"
            value={productInformation.stock}
            onChange={handleChange}
            className="flex-1 min-w-0 px-4 py-3 border-0 rounded-l-lg focus:ring-2 focus:ring-[#C4A962] outline-none"
          />
          <UnitSelector
            name="stockUnit"
            value={productInformation.stockUnit}
            onChange={handleChange}
            wrapperClassName="flex-shrink-0"
            className="!border-0 !border-l !border-gray-300 !rounded-none !rounded-r-lg bg-gray-50 text-gray-700 text-sm whitespace-nowrap min-w-[130px]"
            placeholder="Unit"
          />
        </div>

        {/* MOQ with Unit */}
        <div className="flex border border-gray-300 rounded-lg overflow-visible">
          <input
            type="text"
            name="moq"
            placeholder="MOQ"
            value={productInformation.moq}
            onChange={handleChange}
            className="flex-1 min-w-0 px-4 py-3 border-0 rounded-l-lg focus:ring-2 focus:ring-[#C4A962] outline-none"
          />
          <UnitSelector
            name="moqUnit"
            value={productInformation.moqUnit}
            onChange={handleChange}
            wrapperClassName="flex-shrink-0"
            className="!border-0 !border-l !border-gray-300 !rounded-none !rounded-r-lg bg-gray-50 text-gray-700 text-sm whitespace-nowrap min-w-[130px]"
            placeholder="Unit"
          />
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
        <div className="space-y-4" style={{ overflow: 'visible' }}>
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
            <CategorySelector
              value={productInformation.categoryId}
              onChange={handleCategoryChange}
              onSuggestNew={handleCategorySuggested}
              label="Commodity Category"
              placeholder="Select a commodity..."
              required
            />
            {/* Show classification badge if category is selected */}
            {productInformation.categoryId && (
              <p className="mt-2 text-sm flex items-center gap-2">
                <span className="text-gray-500">Classification:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    productInformation.isNicheCommodity
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {productInformation.isNicheCommodity ? 'Niche Commodity' : 'Mainstream Commodity'}
                </span>
              </p>
            )}
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
