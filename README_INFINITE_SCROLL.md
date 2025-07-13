# Infinite Scrolling Product Implementation

This document describes the implementation of infinite scrolling for products in the Breyus application, including both backend and frontend components.

## Backend Implementation

### New Endpoint: `GET /products/list`

**Location**: `backend/src/products/products.controller.ts`

**Features**:
- Pagination support with configurable page size (default: 30 products per page)
- Search functionality across product name, description, category, and tags
- Category filtering
- Price range filtering (min/max price)
- Sorting by creation date (newest first)

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Products per page (default: 30)
- `search` (string): Search term for product name, description, category, or tags
- `category` (string): Filter by specific category
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter

**Response Format**:
```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "product_id",
      "name": "Product Name",
      "description": "Product description",
      "price": "100.00",
      "currency": "USD",
      "category": "Electronics",
      "productImages": ["image1.jpg", "image2.jpg"],
      "tags": ["tag1", "tag2"],
      "onSale": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 150,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Service Method: `getProductsWithPagination`

**Location**: `backend/src/products/products.service.ts`

**Features**:
- MongoDB aggregation with efficient pagination using `skip()` and `limit()`
- Case-insensitive search using regex
- Dynamic query building based on provided filters
- Total count calculation for pagination metadata

## Frontend Implementation

### Service Method: `getProductsWithPagination`

**Location**: `frontend/src/services/products.service.ts`

**Features**:
- TypeScript interfaces for type safety
- Query parameter building
- Error handling with meaningful error messages
- Credentials inclusion for authentication

**Usage**:
```typescript
import { getProductsWithPagination, PaginationParams } from '../services/products.service';

const params: PaginationParams = {
  page: 1,
  limit: 30,
  search: 'laptop',
  category: 'Electronics',
  minPrice: 100,
  maxPrice: 1000
};

const response = await getProductsWithPagination(params);
```

### Homepage Component Updates

**Location**: `frontend/src/buyer/pages/Homepage.tsx`

**Key Features**:
- **Infinite Scrolling**: Uses Intersection Observer API to detect when user scrolls near the bottom
- **State Management**: Local state management for products, pagination, and loading states
- **Data Transformation**: Converts backend data format to frontend Product interface
- **Loading States**: Separate loading states for initial load and "load more" operations
- **Error Handling**: Comprehensive error handling with retry functionality
- **Search Integration**: Real-time search with debouncing
- **Filter Support**: Category and price range filtering

**State Variables**:
- `products`: Array of loaded products
- `currentPage`: Current page number
- `hasNextPage`: Boolean indicating if more products are available
- `totalProducts`: Total number of products matching the query
- `loading`: Boolean for initial loading state
- `loadingMore`: Boolean for "load more" loading state
- `error`: Error message if any
- `searchTerm`: Current search term
- `filters`: Current filter settings

**Key Methods**:
- `loadProducts()`: Fetches products for a specific page
- `handleSearch()`: Handles search term changes
- `renderProducts()`: Renders product cards with infinite scroll logic

## Infinite Scrolling Implementation

### Intersection Observer Setup

```typescript
useEffect(() => {
  if (loading || loadingMore) return;

  if (observer.current) observer.current.disconnect();

  observer.current = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasNextPage && !loadingMore) {
      loadProducts(currentPage + 1);
    }
  });

  if (lastProductRef.current) {
    observer.current.observe(lastProductRef.current);
  }

  return () => {
    if (observer.current) {
      observer.current.disconnect();
    }
  };
}, [loading, loadingMore, hasNextPage, currentPage, loadProducts]);
```

### Last Product Reference

The last product in the list is wrapped with a ref to trigger the intersection observer:

```typescript
{products.map((product, index) => {
  if (products.length === index + 1) {
    return (
      <div key={product.id} ref={lastProductRef}>
        <ProductCard 
          product={product}
          onClick={() => window.location.href = `/buyer/product-page?id=${product.id}`}
        />
      </div>
    );
  } else {
    return (
      <ProductCard 
        key={product.id}
        product={product}
        onClick={() => window.location.href = `/buyer/product-page?id=${product.id}`}
      />
    );
  }
})}
```

## Data Flow

1. **Initial Load**: Component mounts → `loadProducts(1, true)` → Fetch first 30 products
2. **Search/Filter**: User changes search or filters → Reset to page 1 → Fetch new results
3. **Scroll**: User scrolls near bottom → Intersection Observer triggers → `loadProducts(currentPage + 1)` → Append new products
4. **End**: No more products available → `hasNextPage` becomes false → Stop loading

## Performance Optimizations

1. **Efficient Pagination**: Backend uses MongoDB's `skip()` and `limit()` for efficient pagination
2. **Intersection Observer**: Modern API for scroll detection without performance impact
3. **Loading States**: Prevents multiple simultaneous requests
4. **Data Transformation**: Efficient mapping of backend data to frontend format
5. **Memory Management**: Observer cleanup on component unmount

## Error Handling

- **Network Errors**: Displayed to user with retry button
- **Empty Results**: User-friendly message with clear search option
- **Loading Failures**: Graceful degradation with error messages
- **Invalid Data**: Safe data transformation with fallback values

## Testing

### Backend Testing

Run the test script to verify the endpoint:
```bash
cd backend
node test-pagination-endpoint.js
```

### Frontend Testing

1. Start the development server
2. Navigate to the homepage
3. Scroll down to trigger infinite loading
4. Test search functionality
5. Verify loading states and error handling

## Future Enhancements

1. **Virtual Scrolling**: For very large datasets
2. **Caching**: Implement product caching for better performance
3. **Advanced Filters**: Add more filter options (brand, rating, etc.)
4. **Sorting**: Add sorting options (price, name, date)
5. **URL State**: Sync search and filter state with URL parameters 