import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/backend'; // Corrected Port and generic name

export interface DailyStoreVisitData {
  date: string; // "yyyy-MM-dd"
  dayName: string; // "Mon", "Tue", etc.
  visits: number;
}

export interface DailySaleData {
  date: string; // "yyyy-MM-dd"
  time: string; // "HH:mm:ss"
  amount: number;
  productName?: string;
}

export interface TaskStatusDistributionData {
  status: string;
  count: number;
  percentage: number;
}

export interface DashboardAnalyticsData {
  dailyVisits: DailyStoreVisitData[];
  dailySales: DailySaleData[];
  tasksDistribution: TaskStatusDistributionData[];
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getDashboardAnalytics = async (days: number = 30): Promise<DashboardAnalyticsData> => {
  try {
    const response = await axios.get<DashboardAnalyticsData>(`${API_URL}/analytics/dashboard`, {
      params: { days },
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    
    // Handle authentication errors specifically
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        // Token might be expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard analytics');
    }
    throw new Error('Failed to fetch dashboard analytics due to an unexpected error.');
  }
}; 