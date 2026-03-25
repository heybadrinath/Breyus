import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, User, ChevronDown, LogOut, PenTool, Flame, Users } from 'lucide-react';
import { useBlogAuth } from '../../context/BlogAuthContext';
import { blogPostsService } from '../../services/blog-portal.service';

/**
 * BlogHeader - Clean white navigation header
 *
 * Navigation:
 * - Home
 * - Categories (dynamic dropdown with post counts)
 * - Writers
 * - Trending
 * - Search
 * - User Menu
 *
 * Mobile: white slide-out panel with expandable categories
 */
export function BlogHeader() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isWriter, logout } = useBlogAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await blogPostsService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/blog/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    navigate('/blog');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/blog" className="flex items-center space-x-2 group">
            <img
              src="/Logo.png"
              alt="Breyus"
              className="h-8 w-auto"
            />
            <span className="text-lg text-gray-400 font-medium">Blog</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/blog"
              className="px-4 py-2 text-gray-600 hover:text-[#B8860B] transition-colors font-medium"
            >
              Home
            </Link>

            {/* Categories Dropdown */}
            <div className="relative" ref={categoriesRef}>
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className={`flex items-center px-4 py-2 font-medium transition-colors ${
                  isCategoriesOpen ? 'text-[#B8860B]' : 'text-gray-600 hover:text-[#B8860B]'
                }`}
              >
                Categories
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoriesOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-50 animate-fadeIn">
                  {categories.length > 0 ? (
                    <>
                      {/* Scrollable category list with max height */}
                      <div className="max-h-[60vh] overflow-y-auto">
                        {categories.map((cat) => (
                          <Link
                            key={cat.category}
                            to={`/blog/category/${encodeURIComponent(cat.category.toLowerCase())}`}
                            onClick={() => setIsCategoriesOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#1A1A2E] transition-colors"
                          >
                            <span className="font-medium">{cat.category}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                              {cat.count}
                            </span>
                          </Link>
                        ))}
                      </div>
                      <hr className="my-2 border-gray-100" />
                      <Link
                        to="/blog/search"
                        onClick={() => setIsCategoriesOpen(false)}
                        className="flex items-center px-4 py-2.5 text-[#B8860B] hover:bg-[#B8860B]/5 font-medium transition-colors"
                      >
                        View All Categories →
                      </Link>
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-400">Loading...</div>
                  )}
                </div>
              )}
            </div>

            <Link
              to="/blog/writers"
              className="px-4 py-2 text-gray-600 hover:text-[#B8860B] transition-colors font-medium flex items-center gap-1.5"
            >
              <Users className="h-4 w-4" />
              Writers
            </Link>
            <Link
              to="/blog/trending"
              className="px-4 py-2 text-gray-600 hover:text-[#B8860B] transition-colors font-medium flex items-center gap-1.5"
            >
              <Flame className="h-4 w-4" />
              Trending
            </Link>
          </nav>

          {/* Search & User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Expandable Search */}
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="relative animate-fadeIn">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-64 pl-10 pr-10 py-2.5 rounded-lg bg-white border border-gray-200 focus:border-[#B8860B] focus:outline-none focus:ring-2 focus:ring-[#B8860B]/10 transition-all font-medium text-[#1A1A2E] placeholder:text-gray-400"
                  onBlur={() => {
                    if (!searchQuery) setIsSearchOpen(false);
                  }}
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 text-gray-500 hover:text-[#B8860B] transition-colors rounded-lg"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-[#1A1A2E] transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="h-9 w-9 rounded-full bg-[#1A1A2E] flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-[#1A1A2E]">{user?.firstName}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-50 animate-fadeIn">
                    {isWriter && (
                      <Link
                        to="/blog/writer"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#1A1A2E] transition-colors"
                      >
                        <PenTool className="h-4 w-4 mr-3" />
                        Writer Dashboard
                      </Link>
                    )}
                    <Link
                      to="/blog/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-[#1A1A2E] transition-colors"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Settings
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/blog/login"
                className="btn-editorial !py-2.5 !px-5"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-[#1A1A2E]"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu — white slide-out panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fadeIn bg-white">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-gray-200 focus:border-[#B8860B] focus:outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="space-y-1">
              <Link
                to="/blog"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2.5 text-gray-700 hover:text-[#B8860B] hover:bg-gray-50 rounded-lg font-medium"
              >
                Home
              </Link>

              {/* Categories Accordion */}
              <div>
                <button
                  onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-gray-700 hover:text-[#B8860B] hover:bg-gray-50 rounded-lg font-medium"
                >
                  <span>Categories</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileCategoriesOpen && (
                  <div className="ml-4 mt-1 space-y-1 animate-fadeIn">
                    {categories.map((cat) => (
                      <Link
                        key={cat.category}
                        to={`/blog/category/${encodeURIComponent(cat.category.toLowerCase())}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-gray-600 hover:text-[#B8860B] hover:bg-gray-50 rounded-lg text-sm"
                      >
                        <span>{cat.category}</span>
                        <span className="text-xs text-gray-400">{cat.count}</span>
                      </Link>
                    ))}
                    <Link
                      to="/blog/search"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2 text-[#B8860B] text-sm font-medium"
                    >
                      View All →
                    </Link>
                  </div>
                )}
              </div>

              <Link
                to="/blog/writers"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-[#B8860B] hover:bg-gray-50 rounded-lg font-medium"
              >
                <Users className="h-4 w-4" />
                Writers
              </Link>
              <Link
                to="/blog/trending"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-[#B8860B] hover:bg-gray-50 rounded-lg font-medium"
              >
                <Flame className="h-4 w-4" />
                Trending
              </Link>

              <hr className="my-3 border-gray-100" />

              {isAuthenticated ? (
                <>
                  {isWriter && (
                    <Link
                      to="/blog/writer"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-2.5 text-gray-700 hover:text-[#B8860B] hover:bg-gray-50 rounded-lg font-medium"
                    >
                      Writer Dashboard
                    </Link>
                  )}
                  <Link
                    to="/blog/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-2.5 text-gray-700 hover:text-[#B8860B] hover:bg-gray-50 rounded-lg font-medium"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/blog/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2.5 bg-[#1A1A2E] text-white text-center rounded-lg hover:bg-[#2a2a4e] font-semibold transition-colors"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default BlogHeader;
