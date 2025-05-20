import axios from 'axios';
import authService from './auth.service';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/products` 
  : 'http://localhost:5000/products';

console.log('Product service using API URL:', API_URL);

class ProductService {
  async createProduct(productData: any) {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        return { success: false, message: 'Authentication token not found' };
      }

      // Get user from localStorage (this will include the ID from JWT)
      const user = authService.getUser();
      if (!user || !user.id) {
        console.error('User ID not found in auth data');
        return { success: false, message: 'User ID not found, please log in again' };
      }

      // Add the seller ID to the product data
      const dataWithSellerId = {
        ...productData,
        sellerId: user.id
      };

      console.log('Creating new product with seller ID:', user.id, dataWithSellerId);
      
      const response = await axios.post(API_URL, dataWithSellerId, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Product created successfully:', response.data);
      return { 
        success: true, 
        message: `Successfully added ${productData.name}`,
        product: response.data 
      };
    } catch (error) {
      console.error('Error creating product:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response:', error.response?.data);
        
        // If unauthorized, try to refresh token or log out
        if (error.response?.status === 401) {
          authService.logout();
          window.location.href = '/login';
          return { success: false, message: 'Authentication failed' };
        }
        
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to create product' 
        };
      }
      
      return { success: false, message: 'Failed to create product' };
    }
  }

  async getSellerProducts() {
    try {
      console.log('Fetching seller products from:', `${API_URL}/seller/me`);
      
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        return { success: false, message: 'Authentication token not found', products: [] };
      }
      
      // Get the current user's products
      const response = await axios.get(`${API_URL}/seller/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Seller products received:', response.data.length);
      return { 
        success: true, 
        products: response.data 
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response status:', error.response?.status);
        console.error('Server response data:', error.response?.data);
        
        // If unauthorized, try to refresh token or log out
        if (error.response?.status === 401) {
          authService.logout();
          window.location.href = '/login';
          return { success: false, message: 'Authentication failed', products: [] };
        }
        
        // If API endpoint not found
        if (error.response?.status === 404) {
          return { 
            success: false, 
            message: 'Product API endpoint not found. Please check server configuration.', 
            products: [] 
          };
        }
      }
      
      return { success: false, message: 'Failed to fetch products', products: [] };
    }
  }

  async getProductById(productId: string) {
    try {
      console.log(`Fetching product details for ID: ${productId}`);
      
      // Get product details without authentication for faster loading
      // (We'll check ownership on the server side for any edits)
      const response = await axios.get(`${API_URL}/${productId}`);
      
      return { 
        success: true, 
        product: response.data 
      };
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      
      if (axios.isAxiosError(error)) {
        // If product not found
        if (error.response?.status === 404) {
          return { 
            success: false, 
            message: 'Product not found' 
          };
        }
      }
      
      return { success: false, message: 'Failed to fetch product details' };
    }
  }

  async updateProduct(productId: string, productData: any) {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        return { success: false, message: 'Authentication token not found' };
      }

      console.log(`Updating product ${productId} with data:`, productData);
      
      const response = await axios.put(`${API_URL}/${productId}`, productData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Product updated successfully:', response.data);
      return { 
        success: true, 
        message: `Successfully updated ${productData.name}`,
        product: response.data 
      };
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response:', error.response?.data);
        
        // If unauthorized, try to refresh token or log out
        if (error.response?.status === 401) {
          authService.logout();
          window.location.href = '/login';
          return { success: false, message: 'Authentication failed' };
        }
        
        // If forbidden (not the owner)
        if (error.response?.status === 403) {
          return { 
            success: false, 
            message: 'You are not authorized to edit this product' 
          };
        }
        
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to update product' 
        };
      }
      
      return { success: false, message: 'Failed to update product' };
    }
  }
}

const productService = new ProductService();
export default productService; 