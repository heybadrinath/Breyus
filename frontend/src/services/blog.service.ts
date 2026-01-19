import axios from 'axios';
import type {
  BlogPost,
  BlogPostsResponse,
  BlogCategory,
  BlogTag,
} from '../types/marketplaceTypes';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

/**
 * Blog Service
 * Handles fetching blog posts for the marketplace page
 */
class BlogService {
  /**
   * Get published blog posts with pagination
   */
  async getPosts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    tag?: string;
    sortBy?: 'publishedAt' | 'viewCount' | 'title';
    sortOrder?: 'asc' | 'desc';
  }): Promise<BlogPostsResponse> {
    const response = await axios.get<ApiResponse<BlogPostsResponse>>(
      `${API_URL}/blog/posts`,
      { params }
    );
    return response.data.data!;
  }

  /**
   * Get personalized blog posts based on user's product interests
   * Requires authentication cookie to personalize
   */
  async getPersonalizedPosts(params?: {
    page?: number;
    limit?: number;
  }): Promise<BlogPostsResponse> {
    const response = await axios.get<ApiResponse<BlogPostsResponse>>(
      `${API_URL}/blog/posts/personalized`,
      {
        params,
        withCredentials: true, // Include auth cookie for personalization
      }
    );
    return response.data.data!;
  }

  /**
   * Get single blog post by slug
   */
  async getPostBySlug(slug: string): Promise<BlogPost> {
    const response = await axios.get<ApiResponse<BlogPost>>(
      `${API_URL}/blog/posts/${slug}`
    );
    return response.data.data!;
  }

  /**
   * Get available blog categories
   */
  async getCategories(): Promise<BlogCategory[]> {
    const response = await axios.get<ApiResponse<BlogCategory[]>>(
      `${API_URL}/blog/categories`
    );
    return response.data.data || [];
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<BlogTag[]> {
    const response = await axios.get<ApiResponse<BlogTag[]>>(
      `${API_URL}/blog/tags/popular`,
      { params: { limit } }
    );
    return response.data.data || [];
  }

  /**
   * Get related posts for a given post
   */
  async getRelatedPosts(postId: string, limit: number = 4): Promise<BlogPost[]> {
    const response = await axios.get<ApiResponse<BlogPost[]>>(
      `${API_URL}/blog/posts/${postId}/related`,
      { params: { limit } }
    );
    return response.data.data || [];
  }
}

export const blogService = new BlogService();
export default blogService;
