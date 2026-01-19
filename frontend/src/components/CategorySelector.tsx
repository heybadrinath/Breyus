/**
 * CategorySelector Component
 *
 * A searchable dropdown for selecting commodity categories, grouped by
 * Mainstream and Niche classifications. Includes option to suggest new categories.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCategoriesGrouped,
  suggestNewCategory,
  type Category,
  type GroupedCategories,
} from '../services/content.service';

interface CategorySelectorProps {
  value?: string; // Selected category ID
  onChange: (categoryId: string, isMainstream: boolean, categoryName: string) => void;
  onSuggestNew?: (name: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  label?: string;
}

export function CategorySelector({
  value,
  onChange,
  onSuggestNew,
  disabled = false,
  placeholder = 'Select a commodity category',
  error,
  required = false,
  label = 'Commodity Category',
}: CategorySelectorProps) {
  const [groupedCategories, setGroupedCategories] = useState<GroupedCategories | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestValue, setSuggestValue] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

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

  // Find the currently selected category
  const selectedCategory = useMemo(() => {
    if (!value || !groupedCategories) return null;

    const allCategories = [
      ...groupedCategories.mainstream,
      ...groupedCategories.niche,
    ];

    return allCategories.find((cat) => cat._id === value) || null;
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

  // Handle category selection
  const handleSelect = useCallback(
    (category: Category) => {
      onChange(category._id, category.isMainstream ?? false, category.name);
      setIsOpen(false);
      setSearchTerm('');
    },
    [onChange]
  );

  // Handle suggestion submission
  const handleSuggest = async () => {
    const trimmedName = suggestValue.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setSuggestionError('Please enter at least 2 characters');
      return;
    }

    setIsSuggesting(true);
    setSuggestionError(null);

    try {
      const newCategory = await suggestNewCategory({ name: trimmedName });
      setSuggestValue('');

      if (onSuggestNew) {
        onSuggestNew(trimmedName);
      }

      // Reload categories to include the new pending category
      try {
        const data = await getCategoriesGrouped();
        setGroupedCategories(data);
      } catch (reloadErr) {
        console.error('Error reloading categories:', reloadErr);
      }

      // Auto-select the newly suggested category
      if (newCategory._id) {
        handleSelect({
          ...newCategory,
          isPending: true,
          isMainstream: false,
        } as Category);
      }
    } catch (err: any) {
      setSuggestionError(err.message || 'Failed to submit suggestion');
    } finally {
      setIsSuggesting(false);
    }
  };

  // Render category item
  const renderCategoryItem = (category: Category) => (
    <button
      key={category._id}
      type="button"
      onClick={() => handleSelect(category)}
      className={`w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center justify-between transition-colors ${
        value === category._id ? 'bg-gray-50 border-l-4 border-black' : ''
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">{category.name}</p>
          {category.isPending && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
              Pending
            </span>
          )}
        </div>
        {category.path && (
          <p className="text-xs text-gray-500 mt-0.5">{category.path}</p>
        )}
      </div>
      {category.hsCodePrefix && (
        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
          HS: {category.hsCodePrefix}
        </span>
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="h-12 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-sm text-gray-500">Loading categories...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="h-12 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
          <span className="text-sm text-red-600">{loadError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 relative" style={{ overflow: 'visible' }}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full h-12 px-4 bg-white border rounded-lg text-left flex items-center justify-between transition-all ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : 'hover:border-gray-400 cursor-pointer'
        } ${error ? 'border-red-500' : 'border-gray-300'} ${
          isOpen ? 'ring-2 ring-black ring-opacity-20' : ''
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedCategory ? (
            <>
              <span className="font-medium text-gray-900 truncate">
                {selectedCategory.name}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory.isMainstream
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {selectedCategory.isMainstream ? 'Mainstream' : 'Niche'}
              </span>
              {selectedCategory.isPending && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300">
                  Pending
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>

        {/* Chevron Icon */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Error Message */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Pending Category Warning */}
      {selectedCategory?.isPending && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <svg
            className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              This niche commodity is pending admin approval
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              You can still create your product, but it will only be visible to you until the category is approved by an admin.
            </p>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden" style={{ top: '100%', left: 0 }}>
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search commodities..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
              autoFocus
            />
          </div>

          {/* Categories List */}
          <div className="max-h-64 overflow-y-auto">
            {/* Mainstream Section */}
            {filteredCategories.mainstream.length > 0 && (
              <div>
                <div className="sticky top-0 bg-green-50 px-4 py-2 border-b border-green-200">
                  <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Mainstream Commodities ({filteredCategories.mainstream.length})
                  </h4>
                </div>
                <div className="divide-y divide-gray-100">
                  {filteredCategories.mainstream.map(renderCategoryItem)}
                </div>
              </div>
            )}

            {/* Niche Section */}
            {filteredCategories.niche.length > 0 && (
              <div>
                <div className="sticky top-0 bg-orange-50 px-4 py-2 border-b border-orange-200">
                  <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Niche Commodities ({filteredCategories.niche.length})
                  </h4>
                </div>
                <div className="divide-y divide-gray-100">
                  {filteredCategories.niche.map(renderCategoryItem)}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredCategories.mainstream.length === 0 &&
              filteredCategories.niche.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">
                    No categories found for "{searchTerm}"
                  </p>
                </div>
              )}
          </div>

          {/* Suggest New Category Section */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">
              Can't find your commodity? Suggest it here:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={suggestValue}
                onChange={(e) => setSuggestValue(e.target.value)}
                placeholder="Enter commodity name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSuggest();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSuggest}
                disabled={isSuggesting || !suggestValue.trim()}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSuggesting ? 'Sending...' : 'Suggest'}
              </button>
            </div>
            {suggestionError && (
              <p className="text-xs text-red-500 mt-1">{suggestionError}</p>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default CategorySelector;
