import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/api';

export interface MaintenanceStatus {
  isActive: boolean;
  message: string;
  estimatedEndTime?: string;
}

export const checkMaintenanceStatus = async (): Promise<MaintenanceStatus> => {
  try {
    const response = await axios.get(`${BACKEND_URL}/maintenance/status`, {
      timeout: 5000,
    });
    return response.data.data;
  } catch (error) {
    // If we can't reach the server, assume it's not in maintenance
    console.warn('Failed to check maintenance status:', error);
    return { isActive: false, message: '' };
  }
};
