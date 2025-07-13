# Product Integration Documentation

## Overview
This document describes the product creation endpoint and file upload functionality that has been integrated into the Breyus backend.

## Features Implemented

### 1. Product Creation Endpoint
- **Endpoint**: `POST /products/add-product`
- **Authentication**: Required (JWT token in signed cookies)
- **File Upload**: Supports multiple files (images and PDFs)
- **User Association**: Each product is associated with the authenticated user

### 2. File Upload System
- **Storage**: Files are stored in the `uploads/` directory
- **Organization**: 
  - Product images: `uploads/product-images/`
  - Test reports: `uploads/test-reports/`
- **File Types**: Images (jpg, png, etc.) and PDFs
- **Size Limit**: 10MB per file
- **Max Files**: 10 files per request

### 3. Additional Endpoints
- **GET /products/user-products**: Get all products for the authenticated user
- **GET /products/:id**: Get a specific product by ID (user-specific)

## Backend Changes

### New Files Created:
1. `src/products/file-upload.interceptor.ts` - Handles file uploads
2. `src/services/products.service.ts` (Frontend) - API service

### Modified Files:
1. `src/products/create-product.dto.ts` - Added file upload and user fields
2. `src/products/schema/products.schema.ts` - Added file paths and user association
3. `src/products/products.service.ts` - Added file upload and user methods
4. `src/products/products.controller.ts` - Added file upload handling
5. `src/products/products.module.ts` - Added JWT and file upload dependencies

## Frontend Integration

### Service File:
- `frontend/src/services/products.service.ts` - Handles API calls with fetch

### Component Updates:
- `frontend/src/seller/Products/add-product.tsx` - Integrated with backend API

## Environment Variables Required

### Backend (.env):
```
JWT_SECRET_KEY=your-jwt-secret-key
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
```

### Frontend (.env):
```
REACT_APP_BACKEND_URL=http://localhost:5000
```

## Usage Example

### Frontend (React):
```typescript
import { createProduct } from '../services/products.service';

const productData = {
  name: 'Product Name',
  moq: '100',
  moqUnit: 'pieces',
  // ... other product fields
};

const files = [imageFile1, imageFile2, pdfFile1];

try {
  const response = await createProduct(productData, files);
  console.log('Product created:', response.data);
} catch (error) {
  console.error('Error creating product:', error);
}
```

### Backend Response:
```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "_id": "product_id",
    "name": "Product Name",
    "userId": "user_id",
    "productImages": ["uploads/product-images/123456-image1.jpg"],
    "testReports": ["uploads/test-reports/123456-report1.pdf"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Security Features

1. **Authentication**: All endpoints require valid JWT token
2. **User Isolation**: Users can only access their own products
3. **File Validation**: Only images and PDFs are allowed
4. **File Size Limits**: 10MB per file maximum
5. **Secure File Names**: Timestamped filenames prevent conflicts

## File Storage

Files are stored locally in the `uploads/` directory with the following structure:
```
uploads/
├── product-images/
│   ├── 1704067200000-image1.jpg
│   └── 1704067200001-image2.png
└── test-reports/
    ├── 1704067200002-report1.pdf
    └── 1704067200003-report2.pdf
```

## Error Handling

The system provides comprehensive error handling for:
- Authentication failures
- File upload errors
- Validation errors
- Database errors
- Network errors

All errors are returned with appropriate HTTP status codes and descriptive messages. 