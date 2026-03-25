import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, BadgeCheck, Loader2 } from 'lucide-react';
import { BlogLayout } from '../components/layout';
import { BlogCard } from '../components/cards';
import { blogWritersService } from '../services/blog-portal.service';
import type { PublicBlogUser, BlogPost } from '../types';

/**
 * WriterProfilePage - Public writer profile page
 *
 * Features:
 * - Writer bio and avatar
 * - Breyus member badge
 * - List of published articles
 * - Pagination
 */
export function WriterProfilePage() {
  const { id } = useParams<{ id: string }>();

  const [writer, setWriter] = useState<PublicBlogUser | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchWriter = async () => {
      setLoading(true);
      setError(null);

      try {
        const [writerData, postsData] = await Promise.all([
          blogWritersService.getProfile(id),
          blogWritersService.getPosts(id, page, 9),
        ]);

        setWriter(writerData);
        setPosts(postsData.posts);
        setTotalPages(postsData.pages);
        setTotalPosts(postsData.total);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Writer not found');
        } else {
          setError('Failed to load writer profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWriter();
  }, [id, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state
  if (loading && !writer) {
    return (
      <BlogLayout>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-[#B8860B] animate-spin" />
          </div>
        </div>
      </BlogLayout>
    );
  }

  // Error state
  if (error || !writer) {
    return (
      <BlogLayout>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link
            to="/blog"
            className="inline-flex items-center text-gray-600 hover:text-[#B8860B] mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Blog
          </Link>

          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
            <Link
              to="/blog"
              className="inline-flex items-center mt-4 text-[#B8860B] hover:text-[#9A7209] font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Return to homepage
            </Link>
          </div>
        </div>
      </BlogLayout>
    );
  }

  const fullName = `${writer.firstName} ${writer.lastName}`;

  return (
    <BlogLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Link */}
        <Link
          to="/blog"
          className="inline-flex items-center text-gray-600 hover:text-[#B8860B] mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Blog
        </Link>

        {/* Writer Profile Header */}
        <header className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Cover Banner */}
          <div className="h-32 relative overflow-hidden">
            {writer.writerBanner ? (
              <img
                src={writer.writerBanner}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#1A1A2E] to-[#2a2a4e]" />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6 -mt-16">
            {/* Avatar */}
            {writer.writerAvatar ? (
              <img
                src={writer.writerAvatar}
                alt={fullName}
                className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-gray-600 text-4xl font-bold">
                  {writer.firstName.charAt(0)}
                </span>
              </div>
            )}

            {/* Name and Badge */}
            <div className="mt-4 flex items-center flex-wrap gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              {writer.isBrèyusMember && (
                <span className="inline-flex items-center px-2 py-1 bg-[#B8860B]/10 text-[#B8860B] text-sm font-medium rounded-full">
                  <BadgeCheck className="h-4 w-4 mr-1" />
                  Breyus Member
                </span>
              )}
            </div>

            {/* Company */}
            {writer.companyName && (
              <p className="text-gray-500 mt-1">{writer.companyName}</p>
            )}

            {/* Bio */}
            {writer.writerBio && (
              <p className="text-gray-600 mt-4 max-w-2xl">{writer.writerBio}</p>
            )}

            {/* Stats */}
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <FileText className="h-4 w-4 mr-1" />
              <span>{totalPosts} article{totalPosts !== 1 ? 's' : ''} published</span>
            </div>
          </div>
        </header>

        {/* Articles Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Articles by {writer.firstName}
          </h2>

          {posts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No articles published yet.</p>
            </div>
          ) : (
            <>
              {/* Clean 3-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <BlogCard key={post._id} post={post} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages || loading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </BlogLayout>
  );
}

export default WriterProfilePage;
