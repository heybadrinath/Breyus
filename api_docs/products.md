# Products API

## Overview
The Products API manages commodity listings in the marketplace. It handles product creation with file uploads, product search, HSN code autocomplete, product retrieval with pagination and filtering, product updates, visibility management, and deletion.

## Base URL
```
/products
```

## Authentication
All endpoints require authentication via signed cookie. The controller is protected by `AuthGuard` which validates:
- Cookie-based JWT authentication
- User existence in database
- User is not suspended

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
  "name": "string",
  "stock": "string",
  "stockUnit": "string",
  "moq": "string",
  "moqUnit": "string",
  "description": "string",
  "detailedDescription": "string",
  "application": "string",
  "environmentalImpact": "string",
  "qualityAssurance": "string",
  "category": "string",
  "categoryId": "string",
  "isNicheCommodity": false,
  "hsnCode": "string",

  "price": "string",
  "currency": "string",
  "sku": "string",
  "isActive": true,
  "onSale": false,
  "discount": "string",
  "salePrice": "string",
  "costOfGoods": "string",
  "profit": "string",
  "margin": "string",

  "tags": ["string"],

  "exportLocation": "string",
  "nearestPort": "string",
  "revenueMin": "string",
  "revenueMax": "string",
  "currencyTrade": "string",
  "unitTrade": "string",
  "paymentTerms": "string",
  "logisticsTerms": "string",
  "popTerms": "string",
  "yearsTrade": "string",
  "industry": "string",
  "sellermarketYears": "string",
  "sellerMarketYears": "string",
  "marketcapture": "string",

  "selectedIncoterm": "EXW" | "FCA" | "FAS" | "FOB" | "CFR" | "CIF" | "CPT" | "CIP" | "DAP" | "DPU" | "DDP",
  "selectedIncotermData": {
    "Insurance": "Buyer" | "Seller",
    "Freight": "Buyer" | "Seller"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Product name |
| stock | string | Yes | Stock quantity (number as string) |
| stockUnit | string | Yes | Unit of stock (e.g., "MT", "KG", "Tons") |
| moq | string | Yes | Minimum Order Quantity |
| moqUnit | string | Yes | MOQ Unit |
| description | string | Yes | Short product description |
| detailedDescription | string | Yes | Detailed product description |
| application | string | No | Practical application value |
| environmentalImpact | string | No | Environmental impact notes |
| qualityAssurance | string | No | Quality assurance notes |
| category | string | Yes | Category name for display |
| categoryId | string | No | Reference to ProductCategory collection (ObjectId) |
| isNicheCommodity | boolean | No | true = niche, false = mainstream (auto-set from category) |
| hsnCode | string | Yes | HSN code |
| price | string | Yes | Price of the product |
| currency | string | Yes | Currency (e.g., "USD", "INR") |
| sku | string | Yes | Stock Keeping Unit |
| isActive | boolean | No | Whether visible to buyers (default: true) |
| onSale | boolean | No | If product is on sale |
| discount | string | No | Discount percentage |
| salePrice | string | No | Sale price |
| costOfGoods | string | No | Cost of goods sold |
| profit | string | No | Profit amount |
| margin | string | No | Margin percentage |
| tags | string[] | Yes | Array of tags (min 1 required) |
| exportLocation | string | No | Export location |
| nearestPort | string | No | Nearest exporting port |
| selectedIncoterm | string | No | Selected Incoterm type |
| selectedIncotermData | object | No | Incoterm responsibilities |

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
    "productImages": ["string"],
    "testReports": ["string"],
    "userId": "string",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
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

---

### 3. Get User's Products

Retrieves all products created by the authenticated user. Supports pagination and filtering when query parameters are provided.

**Endpoint:** `GET /products/user-products`

**Authentication:** Required (signed cookie)

**Query Parameters (all optional):**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | string | "1" | Page number |
| limit | string | "10" | Items per page |
| search | string | "" | Search query for product name/description |
| category | string | "" | Filter by category |
| stockStatus | string | "" | Filter by stock status |
| sort | string | "" | Sort order |
| isMainstream | string | "" | Filter by commodity type ("true"/"false") |

**Request Examples:**
```
GET /products/user-products
GET /products/user-products?page=1&limit=10&search=cotton&category=Textile
```

**Response (without pagination params):**

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
      "productImages": ["string"]
    }
  ]
}
```

**Response (with pagination params):**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalProducts": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "stats": {...}
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
- When any query param is provided, returns paginated response with stats

---

### 4. Get Products with Pagination and Filters (Marketplace)

Retrieves products with pagination, search, and filtering capabilities for the marketplace view.

**Endpoint:** `GET /products/list`

**Authentication:** Required (signed cookie)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | string | "1" | Page number |
| limit | string | "30" | Items per page |
| search | string | "" | Search query for product name/description |
| category | string | "" | Filter by category |
| minPrice | string | "" | Minimum price filter |
| maxPrice | string | "" | Maximum price filter |

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
      "userId": "string"
    }
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

### 5. Get Products by Company ID

Retrieves all active products from a specific company. Used for viewing seller profiles.

**Endpoint:** `GET /products/company/:companyId`

**Authentication:** Required (signed cookie)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| companyId | string | Company MongoDB ObjectId |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | string | "1" | Page number |
| limit | string | "12" | Items per page |
| search | string | "" | Search query for product name |

**Request Example:**
```
GET /products/company/507f1f77bcf86cd799439011?page=1&limit=12
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
      "productImages": ["string"]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalProducts": 50,
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

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Company not found"
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

---

### 6. Get Product by ID

Retrieves detailed information about a specific product, including seller company information.

**Endpoint:** `GET /products/:id`

**Authentication:** Required (signed cookie)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product MongoDB ObjectId |

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
    "isActive": true,
    "company": {
      "_id": "string",
      "companyName": "string",
      "companyAddress": "string"
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

### 7. Track Product View

Tracks a product view for analytics. Called when a buyer views a product page.

**Endpoint:** `POST /products/:id/view`

**Authentication:** Required (signed cookie)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product MongoDB ObjectId |

**Request Example:**
```
POST /products/507f1f77bcf86cd799439011/view
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "View tracked successfully",
  "data": {
    "success": true
  }
}
```

**Self-view or Error (200 OK):**
```json
{
  "statusCode": 200,
  "message": "View not tracked (self-view or error)",
  "data": {
    "success": false
  }
}
```

**Implementation Notes:**
- Does not count self-views (seller viewing their own product)
- Fails silently - always returns 200 OK
- Used for product analytics and popularity tracking

---

### 8. Update Product

Updates an existing product. Only the product owner can update.

**Endpoint:** `PATCH /products/:id`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product MongoDB ObjectId |

**Request Body:**

**Form Fields:**
- `productData` (JSON string, required): Stringified product data with updated fields
- Files (optional): New product images or test reports

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Product updated successfully",
  "data": {
    "_id": "string",
    "name": "string",
    "price": "string",
    "updatedAt": "2024-01-01T00:00:00.000Z"
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
  "message": "Failed to update product",
  "error": "error details"
}
```

**Implementation Notes:**
- Only the product owner can update
- Uses same FileUploadInterceptor as create endpoint
- Partial updates are supported

---

### 9. Update Product Visibility

Toggles product visibility (active/inactive) in the marketplace.

**Endpoint:** `PATCH /products/:id/visibility`

**Authentication:** Required (signed cookie)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product MongoDB ObjectId |

**Request Body:**
```json
{
  "isActive": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| isActive | boolean | Yes | true = visible to buyers, false = hidden |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Product visibility updated successfully",
  "data": {
    "_id": "string",
    "name": "string",
    "isActive": true
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "isActive must be a boolean"
}
```

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
  "message": "Failed to update product visibility",
  "error": "error details"
}
```

**Implementation Notes:**
- Only the product owner can toggle visibility
- Inactive products are hidden from marketplace but not deleted
- Used for stock management (out of stock toggle)

---

### 10. Delete Product

Permanently deletes a product. Only the product owner can delete.

**Endpoint:** `DELETE /products/:id`

**Authentication:** Required (signed cookie)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Product MongoDB ObjectId |

**Request Example:**
```
DELETE /products/507f1f77bcf86cd799439011
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Product deleted successfully"
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
  "message": "Failed to delete product",
  "error": "error details"
}
```

**Implementation Notes:**
- Only the product owner can delete
- This is a permanent deletion
- Consider using visibility toggle instead for soft-delete behavior

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
  application?: string;
  environmentalImpact?: string;
  qualityAssurance?: string;
  category: string;
  categoryId?: ObjectId;
  isNicheCommodity?: boolean;
  hsnCode: string;
  price: string;
  currency: string;
  sku: string;
  isActive: boolean;
  onSale: boolean;
  discount?: string;
  salePrice?: string;
  costOfGoods?: string;
  profit?: string;
  margin?: string;
  tags: string[];

  // Trade terms
  exportLocation?: string;
  nearestPort?: string;
  revenueMin?: string;
  revenueMax?: string;
  currencyTrade?: string;
  unitTrade?: string;
  paymentTerms?: string;
  logisticsTerms?: string;
  popTerms?: string;
  yearsTrade?: string;
  industry?: string;
  sellermarketYears?: string;
  sellerMarketYears?: string;
  marketcapture?: string;

  // Incoterms
  selectedIncoterm?: IncotermType;
  selectedIncotermData?: Record<string, 'Buyer' | 'Seller'>;

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
   - Call POST /:id/view to track views

5. **My Products Dashboard:**
   - Use `/products/user-products` for seller's inventory
   - Provide edit, visibility toggle, and delete actions
   - Show product status/visibility
   - Support pagination and filtering

6. **Seller Profile Page:**
   - Use `/products/company/:companyId` to show seller's products
   - Support pagination

7. **Product Visibility Management:**
   - Use PATCH /:id/visibility for stock toggle
   - Show clear indication of active/inactive status

---

## Related Modules
- **Trade Module:** Products are used to create trades
- **Wishlist Module:** Users can save products to wishlist
- **Users Module:** Product creator information
- **Company Module:** Seller company information
