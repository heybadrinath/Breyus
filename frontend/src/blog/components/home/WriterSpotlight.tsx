import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { WriterCard } from '../cards';
import { blogWritersService } from '../../services/blog-portal.service';
import type { PublicBlogUser, BlogPost } from '../../types';

interface SpotlightWriter {
  writer: PublicBlogUser;
  recentPosts: BlogPost[];
  totalPosts: number;
}

/**
 * WriterSpotlight - Editorial featured writers section
 *
 * Features:
 * - Clean section header with dark navy + white icon
 * - Editorial card styling
 * - Stagger animation for cards
 */
export function WriterSpotlight() {
  const [writers, setWriters] = useState<SpotlightWriter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpotlight = async () => {
      try {
        const { writers: writerSummaries } = await blogWritersService.getAll(1, 3);
        const spotlightWriters = await Promise.all(
          writerSummaries.map(async (writerSummary): Promise<SpotlightWriter> => {
            const { posts, total } = await blogWritersService.getPosts(
              writerSummary._id,
              1,
              2
            );

            return {
              writer: {
                _id: writerSummary._id,
                firstName: writerSummary.firstName,
                lastName: writerSummary.lastName,
                companyName: writerSummary.companyName,
                isBrèyusMember: writerSummary.isBrèyusMember,
                isWriter: true,
                writerBio: writerSummary.writerBio,
                writerAvatar: writerSummary.writerAvatar || undefined,
              },
              recentPosts: posts,
              totalPosts: total,
            };
          })
        );

        setWriters(spotlightWriters);
      } catch (err) {
        console.error('Error fetching spotlight writers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpotlight();
  }, []);

  if (loading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-[#1A1A2E] flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Writer Spotlight</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="editorial-card h-72 animate-pulse">
              <div className="h-20 bg-gray-200" />
              <div className="p-5 pt-8 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-50 rounded w-1/2" />
                <div className="h-3 bg-gray-50 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (writers.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-[#1A1A2E] flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Writer Spotlight</h2>
        </div>
        <Link
          to="/blog/writers"
          className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-300 font-medium text-sm transition-colors group"
        >
          All Writers
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Writers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 blog-card-grid">
        {writers.map((spotlight) => (
          <WriterCard
            key={spotlight.writer._id}
            writer={spotlight.writer}
            recentPosts={spotlight.recentPosts}
            totalPosts={spotlight.totalPosts}
          />
        ))}
      </div>
    </section>
  );
}

export default WriterSpotlight;
