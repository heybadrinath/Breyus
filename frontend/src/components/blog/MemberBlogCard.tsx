import { Link } from 'react-router-dom';
import { Lock, Clock, Eye } from 'lucide-react';

interface MemberBlogCardProps {
  post: {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage?: string;
    category: string;
    readTime?: number;
    views?: number;
    accessLevel: 'public' | 'member_only';
    publishedAt: string;
    writer?: {
      firstName: string;
      lastName: string;
    };
  };
  isMember?: boolean;
}

/**
 * MemberBlogCard - Display blog posts on marketplace pages
 *
 * Features:
 * - Shows lock icon for member-only content
 * - Displays post preview with cover image
 * - Links to full post (or login for non-members on member content)
 * - Shows Breyus member badge for exclusive content
 */
export function MemberBlogCard({ post, isMember = false }: MemberBlogCardProps) {
  const isMemberOnly = post.accessLevel === 'member_only';
  const canAccess = !isMemberOnly || isMember;

  const linkTo = canAccess
    ? `/blog/post/${post.slug}`
    : `/blog/login?redirect=/blog/post/${post.slug}`;

  return (
    <Link
      to={linkTo}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#C4A484]/20 to-[#C4A484]/40 flex items-center justify-center">
            <span className="text-4xl text-[#C4A484]/50">📝</span>
          </div>
        )}

        {/* Member Only Badge */}
        {isMemberOnly && (
          <div className="absolute top-3 right-3">
            {canAccess ? (
              <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Member Access
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-black/70 text-white text-xs font-medium rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Members Only
              </span>
            )}
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full capitalize">
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-[#C4A484] transition-colors">
          {post.title}
        </h3>

        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {post.readTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.readTime} min read
              </span>
            )}
            {post.views !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {post.views}
              </span>
            )}
          </div>

          {post.writer && (
            <span>
              By {post.writer.firstName} {post.writer.lastName}
            </span>
          )}
        </div>

        {/* CTA for non-members on member content */}
        {isMemberOnly && !canAccess && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-[#C4A484] font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Become a Breyus Member to read
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default MemberBlogCard;
