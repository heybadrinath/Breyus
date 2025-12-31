# Products API

## Overview
The Products API manages commodity listings in the marketplace. It handles product creation with file uploads, product search, HSN code autocomplete, and product retrieval with pagination and filtering.

## Base URL
```
/products
```

## Authentication
All endpoints require authentication via signed cookie.

---

## Endpoints

### 1. HSN Code Search / Autocomplete

Search for HSN (Harmonized System Nomenclature) codes for product categorization.

**Endpoint:** `GET /products/hsn`

**Authentication:** Required (signed cookie)

**Query Parameters:**
- `q` (string, required): Search query for HSN code or description

**Request Example:**
```
GET /products/hsn?q=cotton
```

**Response:**

**Success (200 OK):**
```json
[
  {
    "code": "5201",
    "description": "Cotton, not carded or combed"
  },
  {
    "code": "5208",
    "description": "Woven fabrics of cotton"
  }
  // ... more results
]
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "Query parameter \"q\" is required"
}
```

**401 Unauthorized:**
```json
"No valid cookie found"
```

**Implementation Notes:**
- Returns matching HSN codes from the database
- Use for autocomplete functionality in product creation

---

### 2. Create Product

Creates a new product listing with optional file uploads.

**Endpoint:** `POST /products/add-product`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request Body:**

**Form Fields:**
- `productData` (JSON string, required): Stringified CreateProductDto
- Files (optional):
  - Product images
  - Test reports/certificates

**CreateProductDto Structure:**
```json
{
  // Product Information
  "name": "string",
  "stock": "string",              // Number as string
  "stockUnit": "string",          // e.g., "MT", "KG", "Tons"
  "moq": "string",                // Minimum Order Quantity
  "moqUnit": "string",
  "description": "string",
  "detailedDescription": "string",
  "category": "string",
  "hsnCode": "string",

  // Pricing
  "price": "string",              // Number as string
  "currency": "string",           // e.g., "USD", "INR"
  "sku": "string",                // Stock Keeping Unit
  "onSale": boolean,              // Optional
  "discount": "string",           // Optional
  "salePrice": "string",          // Optional
  "costOfGoods": "string",        // Optional
  "profit": "string",             // Optional
  "margin": "string",             // Optional (percentage)

  // Tags
  "tags": ["string"],             // Array of tags

  // Trade Terms (Optional)
  "revenueMin": "string",
  "revenueMax": "string",
  "currencyTrade": "string",
  "unitTrade": "string",          // e.g., "Crore"
  "yearsTrade": "string",
  "industry": "string",
  "sellermarketYears": "string",
  "sellerMarketYears": "string",
  "marketcapture": "string",

  // Incoterms (Optional)
  "selectedIncoterm": "EXW" | "FCA" | "FAS" | "FOB" | "CFR" | "CIF" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP",
  "selectedIncotermData": {
    "Insurance": "Buyer" | "Seller",
    "Freight": "Buyer" | "Seller",
    // ... other incoterm responsibilities
  }
}
```

**Response:**

**Success (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "_id": "string",
    "name": "string",
    "stock": "string",
    "price": "string",
    "currency": "string",
    "productImages": ["string"],  // URLs/paths to uploaded images
    "testReports": ["string"],    // URLs/paths to uploaded reports
    "userId": "string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    // ... all other product fields
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid product data format"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```
or
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to create product",
  "error": "error details"
}
```

**Implementation Notes:**
- Files are processed via `FileUploadInterceptor`
- `userId` is automatically extracted from the JWT token
- Product images and test reports are uploaded to storage
- Returns full product object including file URLs

**File Upload Guidelines:**
- Supported formats: Check `FileUploadInterceptor` implementation
- Maximum file size: Check interceptor configuration
- Files are categorized as `productImages` or `testReports` based on field name

---

### 3. Get User's Products

Retrieves all products created by the authenticated user.

**Endpoint:** `GET /products/user-products`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "string",
      "name": "string",
      "price": "string",
      "currency": "string",
      "stock": "string",
      "category": "string",
      "productImages": ["string"],
      // ... all product fields
    }
    // ... more products
  ]
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to retrieve products",
  "error": "error details"
}
```

**Implementation Notes:**
- Returns only products where `userId` matches the authenticated user
- Used for seller's product management dashboard

---

### 4. Get Products with Pagination and Filters

Retrieves products with pagination, search, and filtering capabilities.

**Endpoint:** `GET /products/list`

**Authentication:** Required (signed cookie)

**Query Parameters:**
- `page` (string, optional): Page number (default: "1")
- `limit` (string, optional): Items per page (default: "30")
- `search` (string, optional): Search query for product name/description
- `category` (string, optional): Filter by category
- `minPrice` (string, optional): Minimum price filter
- `maxPrice` (string, optional): Maximum price filter

**Request Example:**
```
GET /products/list?page=1&limit=20&search=cotton&category=Textile&minPrice=100&maxPrice=1000
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "string",
      "name": "string",
      "price": "string",
      "currency": "string",
      "category": "string",
      "description": "string",
      "productImages": ["string"],
      "userId": "string",
      // ... all product fields
    }
    // ... more products
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalProducts": 200,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to retrieve products",
  "error": "error details"
}
```

**Implementation Notes:**
- Pagination is 1-indexed
- Search is performed on product name and description
- Price filters use numeric comparison
- Returns products from all sellers (marketplace view)

---

### 5. Get Product by ID

Retrieves detailed information about a specific product, including seller company information.

**Endpoint:** `GET /products/:id`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `id` (string, required): Product MongoDB ObjectId

**Request Example:**
```
GET /products/507f1f77bcf86cd799439011
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Product retrieved successfully",
  "data": {
    "_id": "string",
    "name": "string",
    "stock": "string",
    "stockUnit": "string",
    "moq": "string",
    "moqUnit": "string",
    "description": "string",
    "detailedDescription": "string",
    "category": "string",
    "hsnCode": "string",
    "price": "string",
    "currency": "string",
    "sku": "string",
    "tags": ["string"],
    "productImages": ["string"],
    "testReports": ["string"],
    "selectedIncoterm": "string",
    "selectedIncotermData": {},
    "userId": "string",
    "company": {
      // Seller's company information
      "_id": "string",
      "companyName": "string",
      "companyAddress": "string",
      // ... other populated company fields
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Product not found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to retrieve product",
  "error": "error details"
}
```

**Implementation Notes:**
- Populates company information via user reference
- Used for product detail pages
- Shows seller information to potential buyers

---

## Data Models

### Product Schema
```typescript
{
  _id: ObjectId;
  name: string;
  stock: string;
  stockUnit: string;
  moq: string;
  moqUnit: string;
  description: string;
  detailedDescription: string;
  category: string;
  hsnCode: string;
  price: string;
  currency: string;
  sku: string;
  onSale: boolean;
  discount?: string;
  salePrice?: string;
  costOfGoods?: string;
  profit?: string;
  margin?: string;
  tags: string[];
  
  // Trade terms
  revenueMin?: string;
  revenueMax?: string;
  currencyTrade?: string;
  unitTrade?: string;
  yearsTrade?: string;
  industry?: string;
  marketYears?: string;
  sellerMarketYears?: string;
  marketcapture?: string;
  
  // Incoterms
  selectedIncoterm?: IncotermType;
  selectedIncotermData?: Record<string, 'Buyer' | 'Seller'>;
  defaults?: Record<IncotermType, Record<string, 'Buyer' | 'Seller'>>;
  
  // Files
  productImages: string[];
  testReports: string[];
  
  // Metadata
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Incoterm Types
```typescript
type IncotermType = 
  | 'EXW'  // Ex Works
  | 'FCA'  // Free Carrier
  | 'FAS'  // Free Alongside Ship
  | 'FOB'  // Free on Board
  | 'CFR'  // Cost and Freight
  | 'CIF'  // Cost, Insurance and Freight
  | 'CPT'  // Carriage Paid To
  | 'CIP'  // Carriage and Insurance Paid To
  | 'DAP'  // Delivered at Place
  | 'DPU'  // Delivered at Place Unloaded
  | 'DDP'; // Delivered Duty Paid
```

---

## Frontend Integration Notes

1. **Product Creation Form:**
   - Use `FormData` for file uploads
   - Stringify the product data and append as `productData` field
   - Append files with appropriate field names
   ```javascript
   const formData = new FormData();
   formData.append('productData', JSON.stringify(productDto));
   formData.append('files', imageFile1);
   formData.append('files', imageFile2);
   ```

2. **HSN Autocomplete:**
   - Implement debounced search (300-500ms delay)
   - Minimum 2-3 characters before searching
   - Display code and description in dropdown

3. **Product Listing:**
   - Implement infinite scroll or pagination controls
   - Show loading states during API calls
   - Cache results for better performance
   - Update filters without losing pagination state

4. **Product Detail View:**
   - Display all product information
   - Show seller company details
   - Provide "Contact Seller" or "Create Trade" actions
   - Display product images in a gallery/carousel

5. **My Products Dashboard:**
   - Use `/products/user-products` for seller's inventory
   - Provide edit and delete actions (when implemented)
   - Show product status/visibility

6. **Search and Filters:**
   - Implement client-side filter UI
   - Build query parameters from filter state
   - Show active filters with clear options
   - Preserve filter state in URL for shareability

---

## Related Modules
- **Trade Module:** Products are used to create trades
- **Wishlist Module:** Users can save products to wishlist
- **Users Module:** Product creator information
- **Company Module:** Seller company information
