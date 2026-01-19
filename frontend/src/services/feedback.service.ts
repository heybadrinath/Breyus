const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export type FeedbackType = 'seller' | 'delivery' | 'product';

export interface ProductSummary {
  _id: string;
  name?: string;
  price?: string;
  currency?: string;
  productImages?: string[];
}

export interface CreateFeedbackData {
  tradeId: string;
  feedbackType: FeedbackType;
  rating: number;
  comment?: string;
  tags?: string[];
  details?: Record<string, string>;
}

export interface Feedback {
  _id: string;
  trade: string | { _id: string; product?: ProductSummary };
  product?: ProductSummary;
  reviewer: {
    _id: string;
    mail: string;
  };
  reviewee: {
    _id: string;
    mail: string;
  };
  feedbackType: FeedbackType;
  rating: number;
  comment: string;
  tags?: string[];
  details?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackResponse {
  statusCode: number;
  message: string;
  data: Feedback | Feedback[];
}

export interface UserFeedbackResponse {
  statusCode: number;
  message: string;
  data: {
    feedbacks: Feedback[];
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: Record<number, number>;
  };
}

export interface AverageRatingResponse {
  statusCode: number;
  message: string;
  data: {
    average: number;
    count: number;
  };
}

export interface SellerFeedbackDashboardResponse {
  statusCode: number;
  message: string;
  data: {
    summary: {
      totalReviews: number;
      averageRating: number;
      ratingBreakdown: Record<number, number>;
      byType: Record<FeedbackType, { count: number; averageRating: number }>;
    };
    productBreakdown: Array<{
      product: ProductSummary;
      totalReviews: number;
      averageRating: number;
      ratingBreakdown: Record<number, number>;
      latestFeedbackAt?: string;
    }>;
    recentFeedback: Feedback[];
  };
}

export interface HasLeftFeedbackResponse {
  statusCode: number;
  message: string;
  data: {
    hasLeftFeedback: boolean;
  };
}

export const createFeedback = async (data: CreateFeedbackData): Promise<FeedbackResponse> => {
  const response = await fetch(`${BACKEND_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to submit feedback');
  }

  return result;
};

export const updateFeedback = async (
  tradeId: string,
  feedbackType: FeedbackType,
  data: Omit<CreateFeedbackData, 'tradeId' | 'feedbackType'>
): Promise<FeedbackResponse> => {
  const response = await fetch(`${BACKEND_URL}/feedback/my/${tradeId}/${feedbackType}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to update feedback');
  }

  return result;
};

export const getFeedbackByTrade = async (tradeId: string): Promise<FeedbackResponse> => {
  const response = await fetch(`${BACKEND_URL}/feedback/trade/${tradeId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch feedback');
  }

  return result;
};

export const getMyFeedback = async (
  tradeId: string,
  feedbackType: FeedbackType
): Promise<FeedbackResponse> => {
  const response = await fetch(`${BACKEND_URL}/feedback/my/${tradeId}/${feedbackType}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch feedback');
  }

  return result;
};

export const getFeedbackForUser = async (userId: string): Promise<UserFeedbackResponse> => {
  const response = await fetch(`${BACKEND_URL}/feedback/user/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch user feedback');
  }

  return result;
};

export const getFeedbackByType = async (
  userId: string,
  feedbackType: FeedbackType
): Promise<FeedbackResponse> => {
  const response = await fetch(`${BACKEND_URL}/feedback/user/${userId}/type/${feedbackType}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch feedback by type');
  }

  return result;
};

export const getAverageRating = async (userId: string): Promise<AverageRatingResponse> => {
  const response = await fetch(`${BACKEND_URL}/feedback/user/${userId}/rating`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch average rating');
  }

  return result;
};

export const hasUserLeftFeedback = async (
  tradeId: string,
  feedbackType: FeedbackType
): Promise<HasLeftFeedbackResponse> => {
  const response = await fetch(`${BACKEND_URL}/feedback/check/${tradeId}/${feedbackType}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to check feedback status');
  }

  return result;
};

export const getSellerFeedbackDashboard = async (): Promise<SellerFeedbackDashboardResponse> => {
  const response = await fetch(`${BACKEND_URL}/feedback/seller/dashboard`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch seller feedback dashboard');
  }

  return result;
};
