import axios from 'axios';
import authService from './auth.service';
import { Product } from '../types/product';

// Get API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/products`
  : 'http://localhost:5000/backend/products';

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

      // Remove any fields not in CreateProductDto
      const allowedFields = [
        'name', 'moq', 'preciseDescription', 'detailedDescription', 'category',
        'hsnCode', 'productImage', 'testReports', 'price', 'sku', 'onSale',
        'discount', 'salePrice', 'costOfGoods', 'profit', 'margin', 'quantity', 'tags'
      ];
      
      const cleanData = Object.fromEntries(
        Object.entries(productData).filter(([key]) => allowedFields.includes(key))
      );

      console.log('Creating new product:', cleanData);
      
      const response = await axios.post(API_URL, cleanData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Product created successfully:', response.data);
      return { 
        success: true, 
        message: `Successfully added ${cleanData.name}`,
        product: response.data 
      };
    } catch (error) {
      console.error('Error creating product:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response:', error.response?.data);
        
        // If unauthorized, try to refresh token or log out
        if (error.response?.status === 401) {
          authService.logout();
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
      console.log('Fetching product by ID:', productId);
      
      const response = await axios.get(`${API_URL}/${productId}`);
      
      console.log('Product details received:', response.data);
      
      // Process images based on actual backend structure
      const productWithImages = {
        ...response.data,
        images: response.data.productImage ? [response.data.productImage] : [],
        primaryImage: response.data.productImage || '/placeholder-product.svg',
        sellerName: response.data.seller ? 
          `${response.data.seller.firstName || ''} ${response.data.seller.lastName || ''}`.trim() || 'Unknown Seller' :
          'Unknown Seller'
      };
      
      return { 
        success: true, 
        product: productWithImages 
      };
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response:', error.response?.data);
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to fetch product',
          product: null 
        };
      }
      
      return { success: false, message: 'Failed to fetch product', product: null };
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

  // Fetch all products for the marketplace with optional filters
  async getAllProducts(filters?: { category?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<{ success: boolean; message?: string; products: Product[] }> {
    try {
      console.log('Fetching all products for marketplace');
      
      let url = `${API_URL}`;
      const params = new URLSearchParams();
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      
      console.log('All products received:', response.data.length);
      
      // Process images for each product based on actual backend structure
      const productsWithImages = response.data.map((product: any) => {
        const sellerName = product.seller ? 
          `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() :
          '';
        
        return {
          ...product,
          images: product.productImage ? [product.productImage] : [],
          primaryImage: product.productImage || '/placeholder-product.svg',
          sellerName: sellerName || 'Unknown Seller',
          // Ensure all required fields are present
          description: product.preciseDescription || product.description || '',
          detailedDescription: product.detailedDescription || ''
        };
      });
      
      return { 
        success: true, 
        products: productsWithImages 
      };
    } catch (error) {
      console.error('Error fetching all products:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Server response:', error.response?.data);
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to fetch products',
          products: [] 
        };
      }
      
      return { success: false, message: 'Failed to fetch products', products: [] };
    }
  }

  // Search products
  async searchProducts(searchTerm: string, filters?: { category?: string; minPrice?: number; maxPrice?: number }) {
    try {
      console.log('Searching products with term:', searchTerm);
      
      const params = new URLSearchParams();
      params.append('search', searchTerm);
      
      if (filters?.category) params.append('category', filters.category);
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
      
      const response = await axios.get(`${API_URL}/search?${params.toString()}`);
      
      console.log('Search results received:', response.data.length);
      
      // Process images for each product based on actual backend structure
      const productsWithImages = response.data.map((product: any) => ({
        ...product,
        images: product.productImage ? [product.productImage] : [],
        primaryImage: product.productImage || '/placeholder-product.svg',
        sellerName: product.seller ? 
          `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || 'Unknown Seller' :
          'Unknown Seller'
      }));
      
      return { 
        success: true, 
        products: productsWithImages 
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return { success: false, message: 'Failed to search products', products: [] };
    }
  }

  // Get featured/recommended products
  async getFeaturedProducts(limit: number = 10) {
    try {
      console.log('Fetching featured products');
      
      const response = await axios.get(`${API_URL}/featured?limit=${limit}`);
      
      console.log('Featured products received:', response.data.length);
      
      // Process images for each product based on actual backend structure
      const productsWithImages = response.data.map((product: any) => ({
        ...product,
        images: product.productImage ? [product.productImage] : [],
        primaryImage: product.productImage || '/placeholder-product.svg',
        sellerName: product.seller ? 
          `${product.seller.firstName || ''} ${product.seller.lastName || ''}`.trim() || 'Unknown Seller' :
          'Unknown Seller'
      }));
      
      return { 
        success: true, 
        products: productsWithImages 
      };
    } catch (error) {
      console.error('Error fetching featured products:', error);
      
      // Fallback to getting all products if featured endpoint doesn't exist
      return this.getAllProducts();
    }
  }

  // Delete a product
  async deleteProduct(productId: string) {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        return { success: false, message: 'Authentication token not found' };
      }

      console.log(`Deleting product ${productId}`);
      
      const response = await axios.delete(`${API_URL}/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Product deleted successfully:', response.data);
      return { 
        success: true, 
        message: 'Product deleted successfully'
      };
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error);
      
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
            message: 'You are not authorized to delete this product' 
          };
        }
        
        // If not found
        if (error.response?.status === 404) {
          return { 
            success: false, 
            message: 'Product not found' 
          };
        }
        
        return { 
          success: false, 
          message: error.response?.data?.message || 'Failed to delete product' 
        };
      }
      
      return { success: false, message: 'Failed to delete product' };
    }
  }

  // Bulk delete products
  async bulkDeleteProducts(productIds: string[]) {
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('Authentication token not found');
        return { success: false, message: 'Authentication token not found' };
      }

      console.log(`Bulk deleting products:`, productIds);
      
      // Delete products one by one (since we don't have a bulk delete endpoint)
      const results = await Promise.allSettled(
        productIds.map(id => 
          axios.delete(`${API_URL}/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        )
      );
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;
      
      console.log(`Bulk delete completed: ${successful} successful, ${failed} failed`);
      
      if (failed === 0) {
        return { 
          success: true, 
          message: `Successfully deleted ${successful} product(s)`
        };
      } else if (successful > 0) {
        return { 
          success: true, 
          message: `Deleted ${successful} product(s), ${failed} failed`
        };
      } else {
        return { 
          success: false, 
          message: `Failed to delete all ${failed} product(s)`
        };
      }
    } catch (error) {
      console.error('Error in bulk delete:', error);
      return { success: false, message: 'Failed to delete products' };
    }
  }
}

const productService = new ProductService();
export default productService;