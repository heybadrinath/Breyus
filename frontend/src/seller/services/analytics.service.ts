import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:5000/backend';

export interface BarGraphData {
  date: string;
  storeVisits: number;
  uniqueVisitors: number;
}

export interface ScatterGraphData {
  day: string;
  x: number;
  y: number;
}

export interface PieChartData {
  category: string;
  value: number;
}

export interface CountrySalesData {
  country: string;
  flag: string;
  sales: number;
  value: string;
  bounce: string;
  sales_count: number;
}

export interface MetricsData {
  totalVisits: number;
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  topCountry: string;
}

interface ErrorResponse {
  message: string;
}

class AnalyticsService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorResponse>;
      if (axiosError.response?.status === 401) {
        // Handle unauthorized error
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch data');
    }
    throw new Error('An unexpected error occurred');
  }

  async getBarGraphData(): Promise<BarGraphData[]> {
    try {
      const response = await axios.get(`${API_URL}/seller/bar-graph`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getScatterGraphData(): Promise<ScatterGraphData[]> {
    try {
      const response = await axios.get(`${API_URL}/seller/scatter-graph`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPieChartData(): Promise<PieChartData[]> {
    try {
      const response = await axios.get(`${API_URL}/seller/pie-chart`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCountrySalesData(): Promise<CountrySalesData[]> {
    try {
      const response = await axios.get(`${API_URL}/seller/country-sales`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMetricsData(): Promise<MetricsData> {
    try {
      const response = await axios.get(`${API_URL}/seller/metrics`, this.getAuthHeader());
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const analyticsService = new AnalyticsService(); 