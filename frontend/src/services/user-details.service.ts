import axios from 'axios';
import authService from './auth.service';

const API_URL = 'http://localhost:5000/users';

class UserDetailsService {
  async getUserDetails() {
    try {
      const user = authService.getUser();
      if (!user || !user.id) {
        console.error('User not found in localStorage');
        return null;
      }

      const token = authService.getToken();
      const response = await axios.get(`${API_URL}/${user.id}/details`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }

  async updateUserDetails(details: any) {
    try {
      const user = authService.getUser();
      if (!user || !user.id) {
        console.error('User not found in localStorage');
        return null;
      }

      const token = authService.getToken();
      const response = await axios.put(`${API_URL}/${user.id}/details`, details, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating user details:', error);
      return null;
    }
  }
}

const userDetailsService = new UserDetailsService();
export default userDetailsService; 