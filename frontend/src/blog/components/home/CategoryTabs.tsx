import React, { useEffect, useState, useRef } from 'react';
import { blogPostsService } from '../../services/blog-portal.service';

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

/**
 * CategoryTabs - Horizontal scrollable category filter tabs
 *
 * Features:
 * - Fetches categories from API with post counts
 * - "All" tab selected by default
 * - Selected tab: gold bottom border + gold text
 * - Horizontal scroll on mobile
 * - Filters the magazine grid below
 */
export function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await blogPostsService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 mb-8 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse flex-shrink-0" />
        ))}
      </div>
    );
  }

  const allTabs = [
    { category: 'all', count: categories.reduce((sum, c) => sum + c.count, 0) },
    ...categories,
  ];

  return (
    <div className="mb-8">
      <div
        ref={scrollRef}
        className="flex gap-1 overflow-x-auto scrollbar-hide pb-2 -mb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allTabs.map((tab) => {
          const isSelected = selectedCategory === tab.category;
          return (
            <button
              key={tab.category}
              onClick={() => onSelectCategory(tab.category)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                isSelected
                  ? 'bg-[#B8860B]/10 text-[#B8860B] border-b-2 border-[#B8860B]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.category === 'all' ? 'All' : tab.category}
              <span className={`ml-1.5 text-xs ${isSelected ? 'text-[#B8860B]/70' : 'text-gray-400'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryTabs;
