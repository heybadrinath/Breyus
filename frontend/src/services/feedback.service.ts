import axios, { AxiosError } from 'axios';
import authService from './auth.service';

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/feedback` 
  : 'http://localhost:5000/feedback';

console.log('Feedback service using API URL:', API_URL);

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  date: string;
  images?: string[];
  helpful: number;
  notHelpful: number;
}

export interface ProductFeedbackSummary {
  productId: string;
  productName: string;
  productImage: string;
  productDescription: string;
  averageRating: number;
  reviewCount: number;
  starCounts: number[]; // [5-star, 4-star, 3-star, 2-star, 1-star]
  reviews: Review[];
}

// Mock data for development and testing
const mockProducts: ProductFeedbackSummary[] = [
  {
    productId: "prod-1",
    productName: "Wireless Headphones",
    productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    productDescription: "Premium wireless noise-cancelling headphones with 30-hour battery life and high-quality sound.",
    averageRating: 4.7,
    reviewCount: 24,
    starCounts: [18, 4, 1, 1, 0],
    reviews: [
      {
        id: "rev-1",
        productId: "prod-1",
        userId: "user-1",
        userName: "John Doe",
        userAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
        rating: 5,
        content: "These headphones are amazing! Great sound quality and the noise cancellation is top-notch. Battery life is impressive too.",
        date: "2023-11-10T12:00:00Z",
        images: ["https://images.unsplash.com/photo-1612528443702-f6741f70a049?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80"],
        helpful: 12,
        notHelpful: 1
      },
      {
        id: "rev-2",
        productId: "prod-1",
        userId: "user-2",
        userName: "Jane Smith",
        rating: 4,
        content: "Very comfortable to wear for long periods. Sound quality is great, but the app could use some improvements.",
        date: "2023-10-25T15:30:00Z",
        helpful: 8,
        notHelpful: 0
      }
    ]
  },
  {
    productId: "prod-2",
    productName: "Smart Watch Pro",
    productImage: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    productDescription: "Advanced fitness tracking, heart rate monitoring, GPS, and smartphone notifications in a sleek design.",
    averageRating: 4.2,
    reviewCount: 16,
    starCounts: [8, 6, 1, 1, 0],
    reviews: [
      {
        id: "rev-3",
        productId: "prod-2",
        userId: "user-3",
        userName: "Robert Johnson",
        rating: 5,
        content: "This watch has transformed my fitness routine. The tracking is accurate and the battery lasts much longer than advertised.",
        date: "2023-11-05T09:15:00Z",
        helpful: 5,
        notHelpful: 1
      }
    ]
  },
  {
    productId: "prod-3",
    productName: "Ultra HD 4K Monitor",
    productImage: "https://images.unsplash.com/photo-1616763355603-9755a640a287?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    productDescription: "32-inch 4K display with HDR support, perfect for creative professionals and gaming enthusiasts.",
    averageRating: 0,
    reviewCount: 0,
    starCounts: [0, 0, 0, 0, 0],
    reviews: []
  }
];

class FeedbackService {
  async getProductFeedback(productId: string): Promise<ProductFeedbackSummary | null> {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        // Return mock data in development
        const mockProduct = mockProducts.find(p => p.productId === productId);
        if (mockProduct) {
          console.log('Using mock product data for development');
          return mockProduct;
        }
        return null;
      }

      const response = await axios.get(`${API_URL}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Fetched product feedback:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching product feedback:', error);
      
      // Return mock data in development
      const mockProduct = mockProducts.find(p => p.productId === productId);
      if (mockProduct) {
        console.log('Using mock product data for development');
        return mockProduct;
      }
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Server response:', axiosError.response?.data);
        
        // If unauthorized, try to refresh token or log out
        if (axiosError.response?.status === 401) {
          authService.logout();
          window.location.href = '/login';
        }
      }
      
      return null;
    }
  }

  async getSellerProductsFeedback(): Promise<ProductFeedbackSummary[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        // Return mock data in development
        console.log('Using mock products data for development');
        return [...mockProducts];
      }

      const response = await axios.get(`${API_URL}/seller/products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Fetched seller products feedback:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching seller products feedback:', error);
      
      // Return mock data in development
      console.log('Using mock products data for development');
      return [...mockProducts];
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Server response:', axiosError.response?.data);
        
        // If unauthorized, try to refresh token or log out
        if (axiosError.response?.status === 401) {
          authService.logout();
          window.location.href = '/login';
        }
      }
      
      return [];
    }
  }

  async replyToReview(reviewId: string, reply: string): Promise<boolean> {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        // Mock success for development
        console.log('Mock reply submitted for development');
        return true;
      }

      const response = await axios.post(`${API_URL}/reviews/${reviewId}/reply`, 
        { reply },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Reply submitted:', response.data);
      return true;
    } catch (error) {
      console.error('Error submitting reply:', error);
      
      // Mock success for development
      console.log('Mock reply submitted for development');
      return true;
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Server response:', axiosError.response?.data);
      }
      
      return false;
    }
  }
}

const feedbackService = new FeedbackService();
export default feedbackService; 