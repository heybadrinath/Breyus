/**
 * CategoryFilterDropdown Component
 *
 * A searchable dropdown for filtering products by category on the marketplace.
 * Features grouped categories (Mainstream/Niche), search functionality, and
 * a clean dropdown design matching the add-product CategorySelector.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown, X, Filter } from 'lucide-react';
import {
  getCategoriesGrouped,
  type Category,
  type GroupedCategories,
} from '../services/content.service';

interface CategoryFilterDropdownProps {
  value: string; // Selected category slug or empty string for "All"
  onChange: (categorySlug: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CategoryFilterDropdown({
  value,
  onChange,
  disabled = false,
  className = '',
}: CategoryFilterDropdownProps) {
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategories | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getCategoriesGrouped();
        setGroupedCategories(data);
      } catch (err: any) {
        setLoadError(err.message || 'Failed to load categories');
        console.error('Error loading categories:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCategories();
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Find the currently selected category
  const selectedCategory = useMemo(() => {
    if (!value || !groupedCategories) return null;

    const allCategories = [
      ...groupedCategories.mainstream,
      ...groupedCategories.niche,
    ];

    // Match by name (used for backend filtering)
    return allCategories.find((cat) => cat.name === value) || null;
  }, [value, groupedCategories]);

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!groupedCategories) return { mainstream: [], niche: [] };

    const term = searchTerm.toLowerCase().trim();

    if (!term) return groupedCategories;

    const filterFn = (cat: Category) => {
      const nameMatch = cat.name.toLowerCase().includes(term);
      const pathMatch = cat.path?.toLowerCase().includes(term);
      const aliasMatch = cat.aliases?.some((alias) =>
        alias.toLowerCase().includes(term)
      );
      const hsMatch = cat.hsCodePrefix?.includes(term);

      return nameMatch || pathMatch || aliasMatch || hsMatch;
    };

    return {
      mainstream: groupedCategories.mainstream.filter(filterFn),
      niche: groupedCategories.niche.filter(filterFn),
    };
  }, [groupedCategories, searchTerm]);

  // Handle category selection - pass category NAME for backend filtering
  // (backend filters by `category` string field which stores the name, not slug)
  const handleSelect = (categoryName: string) => {
    onChange(categoryName);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Clear filter
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  // Total count of categories
  const totalCount = useMemo(() => {
    if (!groupedCategories) return 0;
    return groupedCategories.mainstream.length + groupedCategories.niche.length;
  }, [groupedCategories]);

  // Render category item
  const renderCategoryItem = (category: Category) => (
    <button
      key={category._id}
      type="button"
      onClick={() => handleSelect(category.name)}
      className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between transition-colors ${
        value === category.name
          ? 'bg-gray-50 border-l-4 border-gray-900'
          : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{category.name}</p>
        {category.path && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{category.path}</p>
        )}
      </div>
      {category.hsCodePrefix && (
        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded ml-2 flex-shrink-0">
          HS: {category.hsCodePrefix}
        </span>
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="h-11 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center min-w-[180px]">
          <span className="text-xs text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`${className}`}>
        <div className="h-11 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center px-3 min-w-[180px]">
          <span className="text-xs text-red-600">Error loading</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`h-11 px-4 bg-white border rounded-lg flex items-center gap-2 transition-all min-w-[180px] ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed border-gray-200'
            : 'hover:border-gray-400 cursor-pointer border-gray-200 hover:shadow-sm'
        } ${isOpen ? 'ring-2 ring-gray-900 ring-opacity-10 border-gray-400' : ''}`}
      >
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

        <span className={`text-sm flex-1 text-left truncate ${selectedCategory ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {selectedCategory ? selectedCategory.name : 'All Categories'}
        </span>

        {/* Clear button or chevron */}
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        ) : (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-[100] w-80 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ top: '100%', left: 0 }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-opacity-10 focus:border-gray-400 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Categories List */}
          <div className="max-h-72 overflow-y-auto">
            {/* All Categories Option */}
            {!searchTerm && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 transition-colors ${
                  !value ? 'bg-gray-50 border-l-4 border-gray-900' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Filter className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">All Categories</p>
                  <p className="text-xs text-gray-500">{totalCount} categories available</p>
                </div>
              </button>
            )}

            {/* Mainstream Section */}
            {filteredCategories.mainstream.length > 0 && (
              <div>
                <div className="sticky top-0 bg-emerald-50 px-4 py-2 border-b border-emerald-100">
                  <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Mainstream ({filteredCategories.mainstream.length})
                  </h4>
                </div>
                <div className="divide-y divide-gray-50">
                  {filteredCategories.mainstream.map(renderCategoryItem)}
                </div>
              </div>
            )}

            {/* Niche Section */}
            {filteredCategories.niche.length > 0 && (
              <div>
                <div className="sticky top-0 bg-amber-50 px-4 py-2 border-b border-amber-100">
                  <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Niche ({filteredCategories.niche.length})
                  </h4>
                </div>
                <div className="divide-y divide-gray-50">
                  {filteredCategories.niche.map(renderCategoryItem)}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredCategories.mainstream.length === 0 &&
              filteredCategories.niche.length === 0 && (
                <div className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">No categories found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryFilterDropdown;
