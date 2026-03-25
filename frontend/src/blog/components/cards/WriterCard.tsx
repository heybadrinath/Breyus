import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, BadgeCheck } from 'lucide-react';
import type { PublicBlogUser, BlogPost } from '../../types';

interface WriterCardProps {
  writer: PublicBlogUser;
  recentPosts?: BlogPost[];
  totalPosts?: number;
}

/**
 * WriterCard - Editorial writer profile card
 *
 * Features:
 * - Clean card with subtle shadow
 * - Earth tone header
 * - Avatar with clean styling
 * - Breyus member badge
 * - Recent posts preview
 */
export function WriterCard({ writer, recentPosts = [], totalPosts = 0 }: WriterCardProps) {
  const fullName = `${writer.firstName} ${writer.lastName}`;

  return (
    <div className="editorial-card overflow-hidden">
      {/* Header Banner */}
      <div className="h-20 relative overflow-hidden">
        {writer.writerBanner ? (
          <img
            src={writer.writerBanner}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
        )}
      </div>

      {/* Avatar - overlapping */}
      <div className="px-5 -mt-10 relative z-10">
        {writer.writerAvatar ? (
          <img
            src={writer.writerAvatar}
            alt={fullName}
            className="h-20 w-20 rounded-full object-cover border-4 border-white"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gray-300 border-4 border-white flex items-center justify-center">
            <span className="text-gray-700 text-2xl font-bold">
              {writer.firstName.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 pt-3">
        {/* Name and Badge */}
        <div className="flex items-center space-x-2">
          <h3 className="font-bold text-[#1A1A2E] text-lg">{fullName}</h3>
          {writer.isBrèyusMember && (
            <span title="Breyus Member">
              <BadgeCheck className="h-5 w-5 text-[#B8860B]" />
            </span>
          )}
        </div>

        {/* Company */}
        {writer.companyName && (
          <p className="text-sm text-gray-400 font-medium">{writer.companyName}</p>
        )}

        {/* Bio */}
        {writer.writerBio && (
          <p className="mt-3 text-gray-500 text-sm line-clamp-2 leading-relaxed">{writer.writerBio}</p>
        )}

        {/* Stats */}
        <div className="mt-4 inline-flex items-center px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600 font-medium">
          <FileText className="h-4 w-4 mr-1.5" />
          <span>{totalPosts} article{totalPosts !== 1 ? 's' : ''}</span>
        </div>

        {/* Recent Posts Preview */}
        {recentPosts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-[#B8860B] font-bold uppercase tracking-wider mb-2">Recent</p>
            <ul className="space-y-2">
              {recentPosts.slice(0, 2).map((post) => (
                <li key={post._id}>
                  <Link
                    to={`/blog/post/${post.slug}`}
                    className="text-sm text-gray-600 hover:text-[#B8860B] line-clamp-1 font-medium transition-colors"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* View Profile Link */}
        <Link
          to={`/blog/author/${writer._id}`}
          className="mt-5 inline-flex items-center text-sm text-[#B8860B] hover:text-[#9A7209] font-semibold group/link transition-colors"
        >
          View Profile
          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 ease-out group-hover/link:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

export default WriterCard;
