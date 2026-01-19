const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/analytics";

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface AnalyticsParams {
    range?: TimeRange;
    startDate?: string;
    endDate?: string;
}

export interface BarGraphData {
    date: string;
    storeVisits: number;
}

export interface ScatterGraphData {
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
    percentage: string;
}

export interface MetricsComparison {
    visitsChange: number;
    salesChange: number;
    revenueChange: number;
    customersChange: number;
}

export interface MetricsData {
    totalVisits: number;
    totalSales: number;
    totalRevenue: number;
    totalCustomers: number;
    comparison: MetricsComparison;
}

// ========================================================================
// NEW TYPES (Sales Page)
// ========================================================================

export interface SalesMetricsComparison {
    salesChange: number;
    volumeChange: number;
    revenueChange: number;
    averageOrderChange: number;
    customersChange: number;
}

export interface SalesMetricsData {
    totalSales: number;
    totalVolume: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    currency: string;
    comparison: SalesMetricsComparison;
}

export interface TopProductData {
    productName: string;
    tradeCount: number;
    totalValue: number;
}

export interface TimeSeriesData {
    date: string;
    revenue: number;
    volume: number;
}

const buildQueryString = (params?: AnalyticsParams): string => {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    if (params.range) searchParams.append('range', params.range);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
};

const fetchWithAuth = async (endpoint: string, params?: AnalyticsParams) => {
    const queryString = buildQueryString(params);
    const response = await fetch(`${BACKEND_END_POINT}${endpoint}${queryString}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
};

export const analyticsService = {
    getBarGraphData: async (params?: AnalyticsParams): Promise<BarGraphData[]> => {
        try {
            return await fetchWithAuth('/bar-data', params);
        } catch (error) {
            console.error('Error fetching bar graph data:', error);
            return [];
        }
    },

    getScatterGraphData: async (params?: AnalyticsParams): Promise<ScatterGraphData[]> => {
        try {
            return await fetchWithAuth('/scatter-data', params);
        } catch (error) {
            console.error('Error fetching scatter graph data:', error);
            return [];
        }
    },

    getPieChartData: async (params?: AnalyticsParams): Promise<PieChartData[]> => {
        try {
            return await fetchWithAuth('/pie-data', params);
        } catch (error) {
            console.error('Error fetching pie chart data:', error);
            return [];
        }
    },

    getCountrySalesData: async (params?: AnalyticsParams): Promise<CountrySalesData[]> => {
        try {
            return await fetchWithAuth('/country-sales', params);
        } catch (error) {
            console.error('Error fetching country sales data:', error);
            return [];
        }
    },

    getMetricsData: async (params?: AnalyticsParams): Promise<MetricsData | null> => {
        try {
            return await fetchWithAuth('/metrics', params);
        } catch (error) {
            console.error('Error fetching metrics data:', error);
            return null;
        }
    },

    // ========================================================================
    // NEW METHODS (Sales Page)
    // ========================================================================

    getSalesMetrics: async (params?: AnalyticsParams): Promise<SalesMetricsData | null> => {
        try {
            return await fetchWithAuth('/sales-metrics', params);
        } catch (error) {
            console.error('Error fetching sales metrics:', error);
            return null;
        }
    },

    getTopProducts: async (params?: AnalyticsParams): Promise<TopProductData[]> => {
        try {
            return await fetchWithAuth('/top-products', params);
        } catch (error) {
            console.error('Error fetching top products:', error);
            return [];
        }
    },

    getTimeSeries: async (params?: AnalyticsParams): Promise<TimeSeriesData[]> => {
        try {
            return await fetchWithAuth('/time-series', params);
        } catch (error) {
            console.error('Error fetching time series:', error);
            return [];
        }
    },

    exportCsv: async (params?: AnalyticsParams): Promise<Blob | null> => {
        try {
            const queryString = buildQueryString(params);
            const response = await fetch(`${BACKEND_END_POINT}/export/csv${queryString}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to export CSV: ${response.statusText}`);
            }

            return await response.blob();
        } catch (error) {
            console.error('Error exporting CSV:', error);
            return null;
        }
    },

    exportPdf: async (params?: AnalyticsParams): Promise<string | null> => {
        try {
            const queryString = buildQueryString(params);
            const response = await fetch(`${BACKEND_END_POINT}/export/pdf${queryString}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Failed to export PDF: ${response.statusText}`);
            }

            // Returns HTML that can be printed as PDF
            return await response.text();
        } catch (error) {
            console.error('Error exporting PDF:', error);
            return null;
        }
    },
};
