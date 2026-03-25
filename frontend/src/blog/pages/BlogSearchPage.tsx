import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowLeft, Loader2, X, Filter, ChevronDown, Check } from 'lucide-react';
import { BlogLayout } from '../components/layout';
import { MasonryBlogCard } from '../components/cards';
import { MasonryGrid } from '../components/layout/MasonryGrid';
import { MasonrySkeletonGrid } from '../components/shared/MasonryCardSkeleton';
import { blogPostsService } from '../services/blog-portal.service';
import type { BlogPost } from '../types';

/**
 * Custom Dropdown Component
 * Styled to match Breyus design system with gold accents
 */
interface CustomDropdownProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function CustomDropdown({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select...',
  className = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-lg border text-left flex items-center justify-between
          transition-all duration-200
          ${disabled
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
            : isOpen
              ? 'border-[#B8860B] ring-2 ring-[#B8860B]/20 bg-white'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{
            animation: 'blogFadeInUp 0.2s ease-out forwards',
          }}
        >
          <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2.5 text-left flex items-center justify-between
                  transition-colors duration-150
                  ${option.value === value
                    ? 'bg-[#B8860B]/10 text-[#B8860B]'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span className="font-medium">{option.label}</span>
                {option.value === value && (
                  <Check className="h-4 w-4 text-[#B8860B]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * BlogSearchPage - Search and browse blog posts with Pinterest-style masonry layout
 *
 * Features:
 * - Full-text search by query
 * - Dynamic category filter (fetched from API)
 * - URL-based search params
 * - Pinterest-style masonry grid with scroll-reveal animations
 * - Paginated results with load more
 */
export function BlogSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Dynamic categories from API
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'All Categories' },
  ]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Get params from URL
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  // Local input state
  const [inputQuery, setInputQuery] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState(category);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const data = await blogPostsService.getCategories();
        // Transform API response to dropdown format
        const categoryOptions = [
          { value: '', label: 'All Categories' },
          ...data.map((cat: { category: string; count: number }) => ({
            value: cat.category.toLowerCase().replace(/\s+/g, '-'),
            label: cat.category,
          })),
        ];
        setCategories(categoryOptions);
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Keep the default "All Categories" option on error
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await blogPostsService.search({
        query,
        category,
        page: 1,
        limit: 12,
      });

      setPosts(response.posts);
      setTotal(response.total);
      setHasMore(response.hasMore);
      setPage(1);
    } catch (err) {
      console.error('Error searching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle load more
  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await blogPostsService.search({
        query,
        category,
        page: nextPage,
        limit: 12,
      });

      setPosts((prev) => [...prev, ...response.posts]);
      setHasMore(response.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (inputQuery) params.set('q', inputQuery);
    if (selectedCategory) params.set('category', selectedCategory);

    setSearchParams(params);
  };

  // Handle category change
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);

    const params = new URLSearchParams();
    if (inputQuery) params.set('q', inputQuery);
    if (cat) params.set('category', cat);

    setSearchParams(params);
  };

  // Clear search
  const handleClearSearch = () => {
    setInputQuery('');
    setSelectedCategory('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <BlogLayout>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-8">
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center text-gray-600 hover:text-[#B8860B] mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Blog
        </Link>

        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Articles</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Search by title, content, or tags..."
                  className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/20 outline-none"
                />
                {inputQuery && (
                  <button
                    type="button"
                    onClick={() => setInputQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Filter Toggle (Mobile) */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-center"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>

              {/* Category Select (Desktop) */}
              <CustomDropdown
                value={selectedCategory}
                options={categoriesLoading ? [{ value: '', label: 'Loading...' }] : categories}
                onChange={handleCategoryChange}
                disabled={categoriesLoading}
                placeholder="All Categories"
                className="hidden sm:block min-w-[200px]"
              />

              {/* Search Button */}
              <button
                type="submit"
                className="px-6 py-3 bg-[#1A1A2E] text-white font-medium rounded-lg hover:bg-[#2a2a4e] transition-colors"
              >
                Search
              </button>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="sm:hidden">
                <CustomDropdown
                  value={selectedCategory}
                  options={categoriesLoading ? [{ value: '', label: 'Loading...' }] : categories}
                  onChange={handleCategoryChange}
                  disabled={categoriesLoading}
                  placeholder="All Categories"
                  className="w-full"
                />
              </div>
            )}
          </form>

          {/* Active Filters */}
          {(query || category) && (
            <div className="mt-4 flex items-center flex-wrap gap-2">
              <span className="text-sm text-gray-500">Filters:</span>
              {query && (
                <span className="px-3 py-1 bg-[#B8860B]/10 text-[#B8860B] text-sm rounded-full flex items-center">
                  "{query}"
                  <button
                    onClick={() => {
                      setInputQuery('');
                      const params = new URLSearchParams();
                      if (category) params.set('category', category);
                      setSearchParams(params);
                    }}
                    className="ml-2 hover:text-[#1A1A2E]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              {category && (
                <span className="px-3 py-1 bg-[#B8860B]/10 text-[#B8860B] text-sm rounded-full flex items-center">
                  {categories.find((c) => c.value === category)?.label || category}
                  <button
                    onClick={() => handleCategoryChange('')}
                    className="ml-2 hover:text-[#1A1A2E]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearSearch}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Results Count */}
          {!loading && (
            <p className="mt-4 text-sm text-gray-500">
              {total} result{total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <MasonrySkeletonGrid count={8} />
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No articles found matching your search.</p>
            <button
              onClick={handleClearSearch}
              className="mt-4 text-[#B8860B] hover:text-[#9A7209] font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Pinterest-style Masonry Grid for search results */}
            <MasonryGrid>
              {posts.map((post, index) => (
                <MasonryBlogCard key={post._id} post={post} index={index} />
              ))}
            </MasonryGrid>

            {/* Load More */}
            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-lg text-[#1A1A2E] hover:bg-gray-50 hover:border-gray-300 font-medium transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : null}
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </BlogLayout>
  );
}

export default BlogSearchPage;
