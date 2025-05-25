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

  // Validate token with backend
  async validateTokenWithBackend(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) {
        console.log('validateTokenWithBackend: No token found');
        return false;
      }

      console.log('validateTokenWithBackend: Validating token with backend');
      const response = await axios.get(`${API_URL}/validate-token`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('validateTokenWithBackend response:', response.data);
      
      if (response.data.valid && response.data.user) {
        // Update user data in localStorage with the latest from server
        this.setUser(response.data.user);
        return true;
      } else {
        // Token is invalid, clear auth data
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('validateTokenWithBackend error:', error);
      // If there's an error, assume token is invalid
      this.logout();
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
}

const authService = new AuthService();
export default authService; 