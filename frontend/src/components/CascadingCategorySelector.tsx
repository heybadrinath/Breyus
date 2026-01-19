import React, { useEffect, useState, useMemo } from 'react';
import { getCategoryTree, CategoryNode } from '../services/content.service';
import SelectField from './SelectField';

interface CascadingCategorySelectorProps {
  value?: string;
  onChange: (slug: string, fullPath: string[]) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * CascadingCategorySelector
 *
 * A three-level cascading dropdown for selecting product categories.
 * Fetches the category tree from the admin-managed content API and
 * displays hierarchical dropdowns that auto-populate based on parent selection.
 *
 * Usage:
 * <CascadingCategorySelector
 *   value={selectedCategory}
 *   onChange={(slug, path) => setCategory(slug)}
 * />
 */
const CascadingCategorySelector: React.FC<CascadingCategorySelectorProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  placeholder = 'Select Category',
}) => {
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected values at each level
  const [level1, setLevel1] = useState<string>('');
  const [level2, setLevel2] = useState<string>('');
  const [level3, setLevel3] = useState<string>('');

  // Fetch category tree on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const tree = await getCategoryTree();
        setCategoryTree(tree);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Initialize selections from value prop when categories load
  useEffect(() => {
    if (!value || categoryTree.length === 0) return;

    // Find the category in the tree and set all levels
    for (const l1 of categoryTree) {
      if (l1.slug === value) {
        setLevel1(value);
        setLevel2('');
        setLevel3('');
        return;
      }
      if (l1.children) {
        for (const l2 of l1.children) {
          if (l2.slug === value) {
            setLevel1(l1.slug);
            setLevel2(value);
            setLevel3('');
            return;
          }
          if (l2.children) {
            for (const l3 of l2.children) {
              if (l3.slug === value) {
                setLevel1(l1.slug);
                setLevel2(l2.slug);
                setLevel3(value);
                return;
              }
            }
          }
        }
      }
    }
  }, [value, categoryTree]);

  // Get level 1 options (top-level categories)
  const level1Options = useMemo(() => {
    return categoryTree.filter((cat) => cat.isActive);
  }, [categoryTree]);

  // Get level 2 options based on level 1 selection
  const level2Options = useMemo(() => {
    if (!level1) return [];
    const parent = categoryTree.find((cat) => cat.slug === level1);
    return parent?.children?.filter((cat) => cat.isActive) || [];
  }, [categoryTree, level1]);

  // Get level 3 options based on level 2 selection
  const level3Options = useMemo(() => {
    if (!level1 || !level2) return [];
    const l1Node = categoryTree.find((cat) => cat.slug === level1);
    const l2Node = l1Node?.children?.find((cat) => cat.slug === level2);
    return l2Node?.children?.filter((cat) => cat.isActive) || [];
  }, [categoryTree, level1, level2]);

  // Handle level 1 change
  const handleLevel1Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setLevel1(newValue);
    setLevel2('');
    setLevel3('');

    if (newValue) {
      // If this level has no children, use this as the final value
      const node = categoryTree.find((cat) => cat.slug === newValue);
      if (!node?.children || node.children.length === 0) {
        onChange(newValue, [newValue]);
      } else {
        // Clear the onChange if there are children (user must select deeper)
        onChange('', []);
      }
    } else {
      onChange('', []);
    }
  };

  // Handle level 2 change
  const handleLevel2Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setLevel2(newValue);
    setLevel3('');

    if (newValue) {
      const l1Node = categoryTree.find((cat) => cat.slug === level1);
      const l2Node = l1Node?.children?.find((cat) => cat.slug === newValue);
      if (!l2Node?.children || l2Node.children.length === 0) {
        onChange(newValue, [level1, newValue]);
      } else {
        onChange('', []);
      }
    } else {
      // When clearing level 2, fall back to level 1 if it has no children
      const l1Node = categoryTree.find((cat) => cat.slug === level1);
      if (level1 && (!l1Node?.children || l1Node.children.length === 0)) {
        onChange(level1, [level1]);
      } else {
        onChange('', []);
      }
    }
  };

  // Handle level 3 change
  const handleLevel3Change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setLevel3(newValue);

    if (newValue) {
      onChange(newValue, [level1, level2, newValue]);
    } else {
      // Fall back to level 2
      const l1Node = categoryTree.find((cat) => cat.slug === level1);
      const l2Node = l1Node?.children?.find((cat) => cat.slug === level2);
      if (level2 && (!l2Node?.children || l2Node.children.length === 0)) {
        onChange(level2, [level1, level2]);
      } else {
        onChange('', []);
      }
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 animate-pulse">
          Loading categories...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Level 1 - Main Category */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Main Category
        </label>
        <SelectField
          value={level1}
          onChange={handleLevel1Change}
          disabled={disabled}
          wrapperClassName="w-full"
          placeholder={placeholder}
        >
          <option value="">{placeholder}</option>
          {level1Options.map((cat) => (
            <option key={cat._id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </SelectField>
      </div>

      {/* Level 2 - Sub Category */}
      {level2Options.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Sub Category
          </label>
          <SelectField
            value={level2}
            onChange={handleLevel2Change}
            disabled={disabled || !level1}
            wrapperClassName="w-full"
            placeholder="Select Sub Category"
          >
            <option value="">Select Sub Category</option>
            {level2Options.map((cat) => (
              <option key={cat._id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </SelectField>
        </div>
      )}

      {/* Level 3 - Specific Category */}
      {level3Options.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Specific Category
          </label>
          <SelectField
            value={level3}
            onChange={handleLevel3Change}
            disabled={disabled || !level2}
            wrapperClassName="w-full"
            placeholder="Select Specific Category"
          >
            <option value="">Select Specific Category</option>
            {level3Options.map((cat) => (
              <option key={cat._id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </SelectField>
        </div>
      )}
    </div>
  );
};

export default CascadingCategorySelector;
