import axios, { AxiosError } from 'axios';
import authService from './auth.service';

const API_URL = `${process.env.REACT_APP_API_URL || 'https://breyus.com/backend'}/users`;

class UserDetailsService {
  async getUserDetails() {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        return null;
      }

      console.log('Fetching user details using JWT token');
      const response = await axios.get(`${API_URL}/me/details`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('User details retrieved:', response.data);
      
      // Extract the details object from the response
      // The backend returns: { ...user, details: userDetails }
      const userDetailsData = response.data.details || {};
      
      return userDetailsData;
    } catch (error) {
      console.error('Error fetching user details:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response:', error.response?.data);
        
        // If unauthorized, try to refresh token or log out
        if (error.response?.status === 401) {
          authService.logout();
          window.location.href = '/login';
        }
      }
      
      return null;
    }
  }

  async updateUserDetails(details: any) {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        return null;
      }

      console.log('Updating user details:', details);
      
      // Use the 'me/details' endpoint which gets user ID from JWT
      const response = await axios.put(`${API_URL}/me/details`, details, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('User details updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating user details:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response:', error.response?.data);
        
        // If unauthorized, try to refresh token or log out
        if (error.response?.status === 401) {
          authService.logout();
          window.location.href = '/login';
        }
      }
      
      throw error; // Rethrow to allow components to handle the error
    }
  }

  // Update multiple fields at once for a more efficient API call
  async updateMultipleDetails(detailsObject: any) {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        return null;
      }

      console.log('Updating multiple user details:', detailsObject);
      
      const response = await axios.put(`${API_URL}/me/details`, detailsObject, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Multiple user details updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating multiple user details:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response:', error.response?.data);
      }
      
      throw error; // Rethrow to allow components to handle the error
    }
  }
}

const userDetailsService = new UserDetailsService();
export default userDetailsService; 