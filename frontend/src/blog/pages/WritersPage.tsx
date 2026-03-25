import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  ArrowRight,
  Loader2,
  CheckCircle,
  Eye,
  FileText,
  Sparkles,
  ChevronDown,
  BookOpen,
  Check,
} from 'lucide-react';
import { BlogLayout } from '../components/layout';
import { blogWritersService } from '../services/blog-portal.service';

/**
 * Custom Dropdown Component for sort options
 */
interface SortDropdownProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SortDropdown({ value, options, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border
          transition-all duration-200
          ${isOpen
            ? 'border-[#B8860B] ring-2 ring-[#B8860B]/20 bg-white text-[#1A1A2E]'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }
        `}
      >
        <span>{selectedOption?.label || 'Sort by'}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          style={{ animation: 'blogFadeInUp 0.2s ease-out forwards' }}
        >
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center justify-between
                  transition-colors duration-150
                  ${option.value === value
                    ? 'bg-[#B8860B]/10 text-[#B8860B] font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span>{option.label}</span>
                {option.value === value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Writer {
  _id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  writerBio?: string;
  writerAvatar?: string | null;
  writerBanner?: string | null;
  isBrèyusMember: boolean;
  stats: { totalPosts: number; totalViews: number };
  latestPost: { title: string; slug: string; featuredImage?: string } | null;
}

type SortOption = 'posts' | 'views' | 'recent';

/**
 * WritersPage - Magazine-style writers showcase
 *
 * Features:
 * - Featured writers hero section
 * - Visual writer cards with latest post images
 * - Stats badges (posts, views)
 * - Sort options (posts, views, recent)
 * - Search filter
 * - Load more pagination
 */
export function WritersPage() {
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('posts');

  const fetchWriters = useCallback(
    async (currentPage: number, searchTerm: string, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await blogWritersService.getAll(
          currentPage,
          20,
          searchTerm || undefined
        );
        if (append) {
          setWriters((prev) => [...prev, ...result.writers]);
        } else {
          setWriters(result.writers);
        }
        setTotal(result.total);
        setHasMore(currentPage < result.pages);
        setPage(currentPage);
      } catch (err) {
        console.error('Error fetching writers:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Initial fetch
  useEffect(() => {
    fetchWriters(1, search);
  }, [search, fetchWriters]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleLoadMore = () => {
    fetchWriters(page + 1, search, true);
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  // Sort writers based on selected option
  const sortedWriters = [...writers].sort((a, b) => {
    switch (sortBy) {
      case 'posts':
        return b.stats.totalPosts - a.stats.totalPosts;
      case 'views':
        return b.stats.totalViews - a.stats.totalViews;
      case 'recent':
      default:
        return 0; // Keep original order (API provides recent first)
    }
  });

  // Top 3 writers for featured section
  const featuredWriters = [...writers]
    .sort((a, b) => b.stats.totalViews - a.stats.totalViews)
    .slice(0, 3);

  return (
    <BlogLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A2E] via-[#2D2D4A] to-[#1A1A2E] p-8 md:p-12 mb-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-[#B8860B]/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#B8860B]" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Our Writers
                </h1>
                <p className="text-white/60 text-sm mt-0.5">
                  Meet the voices behind Breyus Blog
                </p>
              </div>
            </div>

            <p className="text-white/70 text-lg max-w-2xl mt-4">
              {total} expert contributors sharing insights on commodity trading,
              market analysis, and industry trends.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#B8860B]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {writers.reduce((sum, w) => sum + w.stats.totalPosts, 0)}
                  </p>
                  <p className="text-xs text-white/50">Total Articles</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatViews(
                      writers.reduce((sum, w) => sum + w.stats.totalViews, 0)
                    )}
                  </p>
                  <p className="text-xs text-white/50">Total Views</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{total}</p>
                  <p className="text-xs text-white/50">Writers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Writers (Top 3) - Only show when not searching */}
        {!search && !loading && featuredWriters.length >= 3 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-[#B8860B]" />
              <h2 className="text-xl font-bold text-[#1A1A2E]">
                Top Contributors
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {featuredWriters.map((writer, idx) => (
                <Link
                  key={writer._id}
                  to={`/blog/author/${writer._id}`}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 hover:border-[#B8860B]/30 hover:shadow-xl transition-all duration-300"
                >
                  {/* Background Image (writer banner) */}
                  <div className="relative h-36 overflow-hidden">
                    {writer.writerBanner ? (
                      <img
                        src={writer.writerBanner}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] via-[#2D2D4A] to-[#1A1A2E]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Rank Badge */}
                    <div
                      className={`absolute top-3 left-3 h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                        idx === 0
                          ? 'bg-gradient-to-br from-[#B8860B] to-[#D4A853]'
                          : idx === 1
                          ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                          : 'bg-gradient-to-br from-amber-600 to-amber-700'
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    {/* Member Badge */}
                    {writer.isBrèyusMember && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle className="h-5 w-5 text-[#B8860B] drop-shadow-lg" />
                      </div>
                    )}
                  </div>

                  {/* Avatar - overlapping */}
                  <div className="relative -mt-10 px-5 flex justify-center">
                    {writer.writerAvatar ? (
                      <img
                        src={writer.writerAvatar}
                        alt={`${writer.firstName} ${writer.lastName}`}
                        className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-xl ring-4 ring-white/50"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4A] border-4 border-white flex items-center justify-center shadow-xl ring-4 ring-white/50">
                        <span className="text-white text-2xl font-bold">
                          {writer.firstName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 pt-3 text-center">
                    <h3 className="font-bold text-lg text-[#1A1A2E] group-hover:text-[#B8860B] transition-colors">
                      {writer.firstName} {writer.lastName}
                    </h3>

                    {writer.companyName && (
                      <p className="text-gray-400 text-xs mt-0.5 truncate">
                        {writer.companyName}
                      </p>
                    )}

                    {writer.writerBio && (
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                        {writer.writerBio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <p className="text-lg font-bold text-[#1A1A2E]">
                          {writer.stats.totalPosts}
                        </p>
                        <p className="text-xs text-gray-400">Posts</p>
                      </div>
                      <div className="h-8 w-px bg-gray-100" />
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">
                          {formatViews(writer.stats.totalViews)}
                        </p>
                        <p className="text-xs text-gray-400">Views</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gray-400" />
            <h2 className="text-xl font-bold text-[#1A1A2E]">All Writers</h2>
            <span className="text-sm text-gray-400">({total})</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <SortDropdown
              value={sortBy}
              options={[
                { value: 'posts', label: 'Most Posts' },
                { value: 'views', label: 'Most Views' },
                { value: 'recent', label: 'Recently Active' },
              ]}
              onChange={(value) => setSortBy(value as SortOption)}
            />

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search writers..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-200 focus:border-[#B8860B] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/10 transition-all text-sm font-medium text-[#1A1A2E] placeholder:text-gray-400"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Writers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-40" />
                    <div className="h-4 bg-gray-100 rounded w-64" />
                    <div className="h-3 bg-gray-100 rounded w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedWriters.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              No writers found
            </h3>
            <p className="text-gray-500 mt-1">
              {search
                ? 'Try a different search term.'
                : 'No writers have been approved yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedWriters.map((writer) => (
              <Link
                key={writer._id}
                to={`/blog/author/${writer._id}`}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#B8860B]/30 hover:shadow-lg transition-all duration-300"
              >
                {/* Card Header with Banner/Gradient */}
                <div className="relative h-20 overflow-hidden">
                  {writer.writerBanner ? (
                    <img
                      src={writer.writerBanner}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1A1A2E] via-[#2D2D4A] to-[#1A1A2E]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                  {/* Member Badge */}
                  {writer.isBrèyusMember && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-[#B8860B] px-2 py-1 rounded-full shadow-md">
                        <CheckCircle className="h-3 w-3" />
                        Member
                      </span>
                    </div>
                  )}
                </div>

                {/* Avatar - overlapping banner */}
                <div className="relative -mt-8 px-4">
                  {writer.writerAvatar ? (
                    <img
                      src={writer.writerAvatar}
                      alt={`${writer.firstName} ${writer.lastName}`}
                      className="h-14 w-14 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#1A1A2E] to-[#2D2D4A] border-4 border-white flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg font-bold">
                        {writer.firstName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 pt-2">
                  {/* Name and Company */}
                  <h3 className="font-semibold text-[#1A1A2E] group-hover:text-[#B8860B] transition-colors text-base">
                    {writer.firstName} {writer.lastName}
                  </h3>

                  {writer.companyName && (
                    <p className="text-gray-400 text-xs mt-0.5 truncate">
                      {writer.companyName}
                    </p>
                  )}

                  {writer.writerBio && (
                    <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                      {writer.writerBio}
                    </p>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <FileText className="h-3.5 w-3.5 text-gray-400" />
                        {writer.stats.totalPosts} {writer.stats.totalPosts === 1 ? 'post' : 'posts'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <Eye className="h-3.5 w-3.5" />
                        {formatViews(writer.stats.totalViews)}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="h-8 w-8 rounded-full bg-[#B8860B]/5 group-hover:bg-[#B8860B]/10 flex items-center justify-center transition-colors">
                      <ArrowRight className="h-4 w-4 text-[#B8860B] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Latest Post Preview */}
                  {writer.latestPost && (
                    <div className="mt-3 p-2.5 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Latest article</p>
                      <p className="text-sm text-gray-700 font-medium line-clamp-1">
                        {writer.latestPost.title}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center mt-10">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-lg text-[#1A1A2E] hover:bg-gray-50 hover:border-gray-300 font-medium transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              {loadingMore ? 'Loading...' : 'Load More Writers'}
            </button>
          </div>
        )}
      </div>
    </BlogLayout>
  );
}

export default WritersPage;
