import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  BarChart3,
  Leaf,
  Cpu,
  Globe,
  TrendingUp,
  ShoppingCart,
  Ship,
  ArrowRight,
} from 'lucide-react';

// Category data with clean neutral + gold accent colors
const CATEGORIES = [
  {
    slug: 'commodities',
    name: 'Commodities',
    description: 'Global commodity insights and trends',
    icon: ShoppingCart,
    iconBg: 'bg-[#1A1A2E]',
    hoverBg: 'hover:bg-gray-50',
  },
  {
    slug: 'trading',
    name: 'Trading',
    description: 'Trade strategies and best practices',
    icon: TrendingUp,
    iconBg: 'bg-[#B8860B]',
    hoverBg: 'hover:bg-gray-50',
  },
  {
    slug: 'market-analysis',
    name: 'Market Analysis',
    description: 'Deep dives into market dynamics',
    icon: BarChart3,
    iconBg: 'bg-gray-700',
    hoverBg: 'hover:bg-gray-50',
  },
  {
    slug: 'sustainability',
    name: 'Sustainability',
    description: 'Eco-friendly trading practices',
    icon: Leaf,
    iconBg: 'bg-green-700',
    hoverBg: 'hover:bg-gray-50',
  },
  {
    slug: 'technology',
    name: 'Technology',
    description: 'Tech innovations in trade',
    icon: Cpu,
    iconBg: 'bg-gray-600',
    hoverBg: 'hover:bg-gray-50',
  },
  {
    slug: 'logistics',
    name: 'Logistics',
    description: 'Shipping and supply chain',
    icon: Ship,
    iconBg: 'bg-[#1A1A2E]',
    hoverBg: 'hover:bg-gray-50',
  },
  {
    slug: 'global-trade',
    name: 'Global Trade',
    description: 'International trade updates',
    icon: Globe,
    iconBg: 'bg-[#B8860B]',
    hoverBg: 'hover:bg-gray-50',
  },
  {
    slug: 'all',
    name: 'All Topics',
    description: 'Browse all categories',
    icon: Layers,
    iconBg: 'bg-gray-500',
    hoverBg: 'hover:bg-gray-50',
  },
];

/**
 * CategoriesGrid - Editorial category grid
 *
 * Features:
 * - Clean white + dark navy + gold accent colors
 * - Clean card styling with subtle shadow
 * - Refined hover effects (lift, not bounce)
 * - Stagger entrance animations
 */
export function CategoriesGrid() {
  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Explore Topics</h2>
        <p className="text-gray-500 mt-2 text-lg">
          Discover content that matters to your business
        </p>
      </div>

      {/* Categories Grid with stagger animation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 blog-card-grid">
        {CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            to={category.slug === 'all' ? '/blog/search' : `/blog/category/${category.slug}`}
            className={`group relative editorial-card p-5 ${category.hoverBg}`}
          >
            {/* Icon */}
            <div
              className={`${category.iconBg} h-11 w-11 rounded-lg flex items-center justify-center mb-4`}
            >
              <category.icon className="h-5 w-5 text-white" />
            </div>

            {/* Text */}
            <h3 className="font-semibold text-[#1A1A2E] group-hover:text-[#B8860B] transition-colors text-base">
              {category.name}
            </h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
              {category.description}
            </p>

            {/* Hover arrow indicator */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ArrowRight className="h-4 w-4 text-[#B8860B]" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CategoriesGrid;
