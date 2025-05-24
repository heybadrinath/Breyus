import axios from 'axios';

const API_URL = 'http://localhost:5000/auth';

class AuthService {
  // Store the token in localStorage
  setToken(token: string): void {
    console.log('Setting token:', token.substring(0, 15) + '...');
    localStorage.setItem('token', token);
  }

  // Get the token from localStorage
  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('Getting token:', token ? (token.substring(0, 15) + '...') : 'null');
    return token;
  }

  // Remove the token from localStorage
  removeToken(): void {
    localStorage.removeItem('token');
  }

  // Store user data in localStorage
  setUser(user: any): void {
    console.log('Setting user:', user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get user data from localStorage
  getUser(): any {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('Getting user:', user);
    return user;
  }

  // Remove user data from localStorage
  removeUser(): void {
    localStorage.removeItem('user');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const isAuth = !!this.getToken();
    console.log('isAuthenticated:', isAuth);
    return isAuth;
  }

  // Check if user has the specified role
  hasRole(role: string): boolean {
    const user = this.getUser();
    const hasRole = user && user.role === role;
    console.log('hasRole check:', { userRole: user?.role, requiredRole: role, result: hasRole });
    return hasRole;
  }

  // Check if user has access to a specific role/portal (for unified accounts)
  hasAccessToRole(role: string): boolean {
    const user = this.getUser();
    // In a unified system, any authenticated user can access any portal
    // The role will be updated when they sign in to the specific portal
    return !!user;
  }

  // Update user profile information (firstName, lastName, profileImage)
  async updateUserProfile(profileData: { firstName: string; lastName: string; profileImage?: string }): Promise<any> {
    try {
      const token = this.getToken();
      if (!token) {
        console.error('Authentication token not found');
        return null;
      }

      console.log('Updating user profile:', profileData);
      
      // Update the user in the backend
      const response = await axios.put(`${API_URL}/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // If successful, update the local user data
      if (response.data) {
        const currentUser = this.getUser();
        const updatedUser = { 
          ...currentUser, 
          firstName: profileData.firstName, 
          lastName: profileData.lastName,
          ...(profileData.profileImage !== undefined && { profileImage: profileData.profileImage })
        };
        this.setUser(updatedUser);
        console.log('User profile updated successfully:', updatedUser);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response:', error.response?.data);
        
        // If unauthorized, try to refresh token or log out
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
      }
      
      throw error; // Rethrow to allow components to handle the error
    }
  }

  // Validate token with backend
  async validateTokenWithBackend(): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Configure axios to send the token in the Authorization header
      const response = await axios.get(`${API_URL}/validate-token`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data.valid === true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  // Login method
  async login(email: string, password: string, role: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/send-otp`, {
        email,
        password,
        role
      });
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Verify OTP
  async verifyOtp(email: string, otp: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, {
        email,
        otp
      });
      
      if (response.data.success) {
        // Store token if available
        if (response.data.token) {
          this.setToken(response.data.token);
          console.log('Login: Token stored');
        }
        
        // Store user data if available
        if (response.data.user) {
          console.log('Login: Setting user data:', response.data.user);
          this.setUser(response.data.user);
        }
      }
      
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Forgot password
  async forgotPassword(email: string, role?: string): Promise<any> {
    try {
      const data: any = { email };
      
      // If role is provided, include it in the request
      if (role) {
        data.role = role;
      }
      
      const response = await axios.post(`${API_URL}/forgot-password`, data);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Reset password with OTP
  async resetPassword(email: string, otp: string, newPassword: string, role?: string): Promise<any> {
    try {
      const data: any = { 
        email,
        otp,
        newPassword
      };
      
      // If role is provided, include it in the request
      if (role) {
        data.role = role;
      }
      
      const response = await axios.post(`${API_URL}/reset-password`, data);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Logout user
  logout(): void {
    this.removeToken();
    this.removeUser();
  }

  // Register user
  async register(email: string, password: string, firstName: string, lastName: string, role: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        email,
        password,
        firstName,
        lastName,
        role
      });
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Verify registration OTP
  async verifyRegistrationOtp(email: string, otp: string): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/verify-registration-otp`, {
        email,
        otp
      });
      
      if (response.data.success) {
        // Store token if available
        if (response.data.token) {
          this.setToken(response.data.token);
          console.log('Registration: Token stored');
        }
        
        // Store user data if available
        if (response.data.user) {
          console.log('Registration: Setting user data:', response.data.user);
          this.setUser(response.data.user);
        }
      }
      
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Add method to upload profile image
  async uploadProfileImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      // For now, we'll create a data URL since we don't have a file upload service
      // In production, you'd upload to a cloud storage service like AWS S3
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  // Check if this is a unified account (can access both portals)
  isUnifiedAccount(): boolean {
    // For now, all accounts are unified
    // You can implement business logic here to determine unified accounts
    return true;
  }

  // Switch user role (for unified accounts)
  async switchRole(newRole: 'buyer' | 'seller'): Promise<boolean> {
    try {
      const user = this.getUser();
      if (!user) {
        throw new Error('No user logged in');
      }

      // Update the user role locally
      const updatedUser = { ...user, role: newRole };
      this.setUser(updatedUser);
      
      return true;
    } catch (error) {
      console.error('Error switching role:', error);
      return false;
    }
  }

  // Get portal URL based on role
  getPortalUrl(role: string): string {
    switch (role) {
      case 'seller':
        return '/seller/dashboard';
      case 'buyer':
        return '/buyer/homepage';
      default:
        return '/';
    }
  }

  // Get opposite role
  getOppositeRole(currentRole: string): string {
    return currentRole === 'buyer' ? 'seller' : 'buyer';
  }
}

const authService = new AuthService();
export default authService; 