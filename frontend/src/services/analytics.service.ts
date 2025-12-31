const BACKEND_END_POINT = process.env.REACT_APP_BACKEND_URL + "/analytics";

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
    bounce: string;
}

export interface MetricsData {
    totalVisits: number;
    totalSales: number;
    totalRevenue: number;
    totalCustomers: number;
}

const fetchWithAuth = async (endpoint: string) => {
    const response = await fetch(`${BACKEND_END_POINT}${endpoint}`, {
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
    getBarGraphData: async (): Promise<BarGraphData[]> => {
        try {
            return await fetchWithAuth('/bar-data');
        } catch (error) {
            console.error('Error fetching bar graph data:', error);
            return [];
        }
    },

    getScatterGraphData: async (): Promise<ScatterGraphData[]> => {
        try {
            return await fetchWithAuth('/scatter-data');
        } catch (error) {
            console.error('Error fetching scatter graph data:', error);
            return [];
        }
    },

    getPieChartData: async (): Promise<PieChartData[]> => {
        try {
            return await fetchWithAuth('/pie-data');
        } catch (error) {
            console.error('Error fetching pie chart data:', error);
            return [];
        }
    },

    getCountrySalesData: async (): Promise<CountrySalesData[]> => {
        try {
            return await fetchWithAuth('/country-sales');
        } catch (error) {
            console.error('Error fetching country sales data:', error);
            return [];
        }
    },

    getMetricsData: async (): Promise<MetricsData | null> => {
        try {
            return await fetchWithAuth('/metrics');
        } catch (error) {
            console.error('Error fetching metrics data:', error);
            return null;
        }
    },
};
