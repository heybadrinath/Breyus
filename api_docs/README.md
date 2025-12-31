# Breyus API Documentation

## Overview

This directory contains comprehensive API documentation for the Breyus B2B commodity trading platform. The documentation is structured by module, with each file covering a specific functional area of the API.

---

## Module Documentation

### Core Modules

1. **[Authentication](./auth.md)** - Session validation and user info retrieval
   - Validate authentication cookies
   - Get current user information
   - Session management

2. **[Login](./login.md)** - User authentication
   - Email/password login with OTP
   - OTP validation and session creation
   - Cookie-based authentication

3. **[Onboarding](./onboarding.md)** - User registration and company setup
   - 5-step registration wizard
   - Email verification with OTP
   - Company profile creation
   - Role selection (Buyer/Seller/Both)

### Business Modules

4. **[Products](./products.md)** - Product catalog management
   - Create products with file uploads
   - HSN code search/autocomplete
   - Product listing with pagination and filters
   - Product details retrieval

5. **[Trade](./trade.md)** - Trade/purchase request management
   - Create purchase requests
   - Multi-step trade creation (negotiation, address, queries, payment)
   - Buyer and seller trade views
   - Trade detail retrieval

6. **[Company](./company.md)** - Company profile and settings
   - Delivery address management (CRUD)
   - Company information
   - Used in trade and shipping

### Supporting Modules

7. **[Wishlist](./wishlist.md)** - Save favorite products
   - Add/remove products from wishlist
   - Retrieve saved products
   - Product bookmarking

8. **[Inbox](./inbox.md)** - Messaging and conversations
   - Create conversations between companies
   - Send and receive messages
   - Message read status
   - Conversation management
   - WebSocket gateway for real-time messaging

9. **[Users](./users.md)** - User account management
   - User profile information
   - Account settings (future)

10. **[Analytics](./analytics.md)** - Dashboard metrics and charts
    - Key performance metrics (visits, sales, revenue, customers)
    - Bar chart data (weekly activity)
    - Scatter graph data (monthly trends)
    - Pie chart data (customer distribution)
    - Country-wise sales breakdown

---

## API Base URL

```
Development: http://localhost:<port>
Production: <production-url>
```

---

## Authentication

All API endpoints (except public onboarding and login endpoints) require authentication via signed HTTP-only cookies.

### Cookie-Based Authentication

The API uses a cookie named `account` which contains a signed JWT token.

**Cookie Details:**
- **Name:** `account`
- **Type:** Signed, HTTP-only
- **Expiry:** Configurable (default: 1 hour)
- **Secure:** true in production
- **SameSite:** strict in production, none in development

**Setting the Cookie:**
- Cookie is automatically set upon successful login (`POST /login/validate-otp`)
- Frontend doesn't need to manually manage the token
- Cookie is included automatically in all same-origin requests

**Validating Authentication:**
```
GET /auth/validate-cookie
```

---

## Common Request/Response Patterns

### Successful Response Format

Most endpoints follow this response structure:

```json
{
  "statusCode": 200,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Common Status Codes

- **200 OK:** Successful GET request
- **201 Created:** Successful POST request (resource created)
- **400 Bad Request:** Validation error or invalid input
- **401 Unauthorized:** Missing or invalid authentication
- **403 Forbidden:** Authenticated but not authorized
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server-side error

---

## Data Models

### Common Types

#### Incoterms
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

#### Company Roles
```typescript
enum Role {
  BUYER = 'Buyer',
  SELLER = 'Seller',
  BOTH = 'Seller and Buyer'
}
```

#### Trade Type
```typescript
enum TradeType {
  INTERNATIONAL = 'international',
  DOMESTIC = 'domestic'
}
```

#### Payment Method Types
```typescript
type PaymentType = 'advance' | 'credit' | 'openAccount';
type PaymentMethodType = 'RTGS' | 'LetterOfCredit';
```

---

## Module Dependencies

```mermaid
graph TD
    A[Login] --> B[Auth]
    C[Onboarding] --> B
    B --> D[Users]
    B --> E[Company]
    D --> E
    E --> F[Products]
    F --> G[Wishlist]
    F --> H[Trade]
    E --> H
    H --> I[Inbox]
    F --> I
    H --> J[Analytics]
    F --> J
```

---

## API Usage Flow

### New User Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant OnboardingAPI
    participant LoginAPI
    participant AuthAPI

    User->>Frontend: Sign Up
    Frontend->>OnboardingAPI: POST /onboarding/send-otp
    OnboardingAPI-->>User: Email OTP
    Frontend->>OnboardingAPI: POST /onboarding/verify-otp
    OnboardingAPI-->>Frontend: Onboarding Token
    
    Frontend->>OnboardingAPI: POST /onboarding/set-password
    Frontend->>OnboardingAPI: POST /onboarding/step-2 (Company Info)
    Frontend->>OnboardingAPI: POST /onboarding/step-3 (Business Info)
    Frontend->>OnboardingAPI: POST /onboarding/step-4 (Additional Details)
    Frontend->>OnboardingAPI: POST /onboarding/step-5 (Role Selection)
    
    OnboardingAPI-->>Frontend: Account Token + Cookie
    Frontend->>AuthAPI: GET /auth/validate-cookie
    AuthAPI-->>Frontend: User authenticated
```

### Existing User Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant LoginAPI
    participant AuthAPI

    User->>Frontend: Enter email & password
    Frontend->>LoginAPI: POST /login
    LoginAPI-->>User: Email OTP
    
    User->>Frontend: Enter OTP
    Frontend->>LoginAPI: POST /login/validate-otp
    LoginAPI-->>Frontend: Account Token + Cookie
    
    Frontend->>AuthAPI: GET /auth/validate-cookie
    AuthAPI-->>Frontend: User role & status
    Frontend->>Frontend: Redirect to dashboard
```

### Trade Creation Flow

```mermaid
sequenceDiagram
    participant Buyer
    participant Frontend
    participant ProductsAPI
    participant CompanyAPI
    participant TradeAPI

    Buyer->>Frontend: Browse products
    Frontend->>ProductsAPI: GET /products/list
    ProductsAPI-->>Frontend: Product list
    
    Buyer->>Frontend: Select product
    Frontend->>ProductsAPI: GET /products/:id
    ProductsAPI-->>Frontend: Product details
    
    Buyer->>Frontend: Create Purchase Request
    Frontend->>CompanyAPI: GET /company/delivery-addresses
    CompanyAPI-->>Frontend: Saved addresses
    
    Buyer->>Frontend: Fill trade form (4 steps)
    Frontend->>TradeAPI: POST /trade/create
    TradeAPI-->>Frontend: Trade created
```

---

## Frontend Integration Guidelines

### 1. API Client Setup

```javascript
// api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // Important: Send cookies with requests
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Authentication Check

```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { valid, role } = await apiClient.get('/auth/validate-cookie');
        if (valid) {
          const { companyId } = await apiClient.get('/auth/me');
          setUser({ role, companyId });
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, loading };
};
```

### 3. API Service Layer

```javascript
// services/products.service.js
import apiClient from '../api/client';

export const productsService = {
  getProducts: (params) => 
    apiClient.get('/products/list', { params }),
  
  getProduct: (id) => 
    apiClient.get(`/products/${id}`),
  
  createProduct: (formData) => 
    apiClient.post('/products/add-product', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  getUserProducts: () => 
    apiClient.get('/products/user-products'),
  
  searchHSN: (query) => 
    apiClient.get('/products/hsn', { params: { q: query } })
};
```

### 4. Error Handling

```javascript
try {
  const result = await apiClient.post('/endpoint', data);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    const { statusCode, message } = error.response.data;
    showError(message);
  } else if (error.request) {
    // Network error
    showError('Network error. Please check your connection.');
  } else {
    // Other errors
    showError('An unexpected error occurred.');
  }
}
```

---

## Development Guidelines

### When Implementing a Feature

1. **Reference the API documentation** for the module you're working with
2. **Check context folder** for additional requirements and specifications
3. **Update this documentation** if you add/modify endpoints
4. **Update the feature tracking** in `context/Breyus — Complete Backend Feature.md`
5. **Test all endpoints** before marking as complete

### Adding New Endpoints

1. Create/update the controller
2. Create/update DTOs and schemas
3. Update the corresponding API documentation file
4. Add integration examples
5. Document in the feature tracking file

### API Documentation Standards

Each API documentation file should include:
- Overview and purpose
- Base URL
- Authentication requirements
- All endpoints with:
  - HTTP method and path
  - Request parameters/body
  - Response format
  - Error responses
  - Implementation notes
- Data models and schemas
- Frontend integration notes
- Related modules

---

## Environment Variables

Required environment variables for the backend:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/breyus

# JWT Secrets
JWT_SECRET=<your-secret-key>
ONBOARDING_JWT_SECRET=<onboarding-secret>

# Cookie Configuration
COOKIE_EXPIRY_LOGIN=3600000  # 1 hour in milliseconds
COOKIE_SECRET=<cookie-signature-secret>

# Email Service (for OTP)
MAIL_SERVICE_API_KEY=<your-mail-service-key>

# Environment
NODE_ENV=development|production
```

---

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"mail":"user@example.com","password":"Password123!"}'

# Validate cookie (after login)
curl -X GET http://localhost:3000/auth/validate-cookie \
  -b "account=<cookie-value>" \
  --cookie-jar cookies.txt

# Get products
curl -X GET "http://localhost:3000/products/list?page=1&limit=20" \
  -b cookies.txt
```

### Using Postman

1. Import the API collection (if available)
2. Set up environment variables
3. Enable "Save cookies" in Postman settings
4. Login to get the session cookie
5. All subsequent requests will include the cookie automatically

---

## Glossary

- **PR**: Purchase Request
- **SCO**: Soft Corporate Offer
- **ICPO**: Irrevocable Corporate Purchase Order
- **SPA**: Sales Purchase Agreement
- **BoL**: Bill of Lading
- **HSN**: Harmonized System Nomenclature (product classification code)
- **MOQ**: Minimum Order Quantity
- **KYC**: Know Your Customer
- **Incoterms**: International Commercial Terms (shipping responsibilities)

---

## Support and Questions

For questions about the API or to report issues:
1. Check the relevant module documentation
2. Review the `context/` folder for additional specifications
3. Check the backend implementation in `backend/src/`
4. Consult with the backend team

---

## Changelog

### Version 1.1 (Current)
- **Auth Module:** Added logout, forgot-password, reset-password, change-password endpoints
- **Login Module:** Complete rewrite with OTP-based 2-step authentication flow
- **Trade Module:** Major update with negotiation, document uploads, and phase management (18 endpoints total)
- **Inbox Module:** Added WebSocket gateway documentation for real-time messaging
- **Analytics Module:** NEW - Dashboard metrics and chart data endpoints
- **Company Module:** Added profile management endpoints
- **Users Module:** Updated schema documentation with password reset fields
- **Wishlist Module:** Updated schema documentation with correct field names

### Version 1.0
- Initial API documentation
- Core modules: Auth, Login, Onboarding
- Business modules: Products, Trade, Company
- Supporting modules: Wishlist, Inbox, Users
- Complete endpoint documentation with examples
