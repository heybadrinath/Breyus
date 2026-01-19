# Breyus — Technical Documentation

**Version**: 1.2
**Date**: December 6, 2025
**Document Type**: Technical Architecture & Implementation Guide

---

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Backend Technical Stack](#backend-technical-stack)
3. [Frontend Technical Stack](#frontend-technical-stack)
4. [Database Schema & Data Models](#database-schema--data-models)
5. [API Architecture](#api-architecture)
6. [Authentication & Authorization](#authentication--authorization)
7. [Real-time Communication](#real-time-communication)
8. [File Upload & Storage](#file-upload--storage)
9. [Security Implementation](#security-implementation)
10. [Deployment Architecture](#deployment-architecture)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture
Breyus follows a **three-tier architecture** pattern:
- **Presentation Layer**: React-based SPA (Single Page Application)
- **Application Layer**: NestJS RESTful API backend
- **Data Layer**: MongoDB with Mongoose ODM

### 1.2 Technology Stack Summary
| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 19.1.1 |
| Frontend Routing | React Router DOM | 7.3.0 |
| UI Styling | TailwindCSS | 3.4.17 |
| Backend Framework | NestJS | 11.0.1 |
| Runtime | Node.js | - |
| Database | MongoDB | - |
| ODM | Mongoose | 8.16.3 |
| Schema Definition | Typegoose | 12.16.0 |
| Authentication | JWT | 11.0.0 |

---

## 2. Backend Technical Stack

### 2.1 Framework & Core Dependencies

**NestJS v11.0.1** - Progressive Node.js framework
- Modular architecture with dependency injection
- TypeScript-first development
- Decorator-based routing and middleware

**Key Dependencies:**
```json
{
  "@nestjs/common": "^11.0.1",
  "@nestjs/core": "^11.0.1",
  "@nestjs/config": "^4.0.2",
  "@nestjs/jwt": "^11.0.0",
  "@nestjs/mongoose": "^11.0.3",
  "@nestjs/platform-express": "^11.1.3",
  "@typegoose/typegoose": "^12.16.0",
  "mongoose": "^8.16.3"
}
```

### 2.2 Module Structure

The backend follows a **modular monolithic architecture**:

```
src/
├── app.module.ts           # Root module
├── main.ts                 # Application entry point
├── auth/                   # Authentication module
├── users/                  # User management module
├── company/                # Company profile module
├── onboarding/             # User onboarding module
├── products/               # Product & inventory module
├── trade/                  # Trade lifecycle module
├── inbox/                  # Messaging & chat module
├── wishlist/               # Wishlist module
├── login/                  # Login module
├── mail/                   # Email notification module
└── analytics/              # Analytics & dashboard module
```

### 2.3 Data Handling

**Validation:**
- `class-validator` (v0.14.2) for DTO validation
- `class-transformer` (v0.5.1) for type transformation

**Security:**
- `bcrypt` (v6.0.0) for password hashing
- `cookie-parser` (v1.4.7) for signed cookie handling
- JWT-based token authentication

**File Upload:**
- `multer` (v2.0.1) for multipart/form-data handling
- Custom `FileUploadInterceptor` for file validation

### 2.4 Email Service

**Sendinblue Integration:**
- `sib-api-v3-sdk` (v8.5.0) for transactional emails
- Email templates for notifications

---

## 3. Frontend Technical Stack

### 3.1 Core Framework

**React v19.1.1** with **TypeScript**
- Functional components with Hooks
- Context API for global state
- React Router DOM v7.3.0 for routing

### 3.2 UI & Styling

**TailwindCSS v3.4.17:**
- Utility-first CSS framework
- Custom configuration in `tailwind.config.js`
- PostCSS processing

**Component Libraries:**
- `@heroicons/react` (v2.2.0) - Icon library
- `lucide-react` (v0.511.0) - Additional icons
- `react-icons` (v5.5.0) - Icon collections

### 3.3 Form Management

**React Hook Form v7.54.2:**
- Performant form validation
- Uncontrolled component approach
- Integration with custom validation rules

**Toggle Components:**
- `react-switch` (v7.1.0) for toggle switches

### 3.4 Data Visualization

**Charting Libraries:**
- `chart.js` (v4.5.0) - Chart rendering engine
- `react-chartjs-2` (v5.3.0) - React wrapper for Chart.js
- `recharts` (v2.15.1) - Declarative charts

### 3.5 HTTP & WebSocket

**HTTP Client:**
- `axios` (v1.8.3) for API communication
- Interceptors for auth token injection
- Centralized error handling

**Real-time Communication:**
- `socket.io-client` (v4.8.1) for WebSocket connections
- Real-time messaging and notifications

### 3.6 Animations

**Framer Motion v12.23.12:**
- Page transition animations
- Micro-interactions
- Gesture animations

### 3.7 Security

**Content Security:**
- `dompurify` (v3.2.6) for XSS prevention
- Sanitization of user-generated content

### 3.8 Notifications

**React Toastify v11.0.5:**
- Toast notifications for user feedback
- Customizable notification system

### 3.9 Folder Structure

```
src/
├── buyer/                  # Buyer-specific pages & components
│   ├── pages/             # Buyer pages (Homepage, Trade, etc.)
│   └── components/        # Buyer UI components
├── seller/                # Seller-specific pages & components
│   ├── pages/             # Seller pages (Dashboard, Inventory, etc.)
│   └── components/        # Seller UI components
├── main/                  # Public pages (Login, Onboarding, etc.)
├── components/            # Shared components (Header, Sidebar, etc.)
├── services/              # API service layer
├── routes/                # Routing configuration
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── assets/                # Static assets (images, fonts, etc.)
```

---

## 4. Database Schema & Data Models

### 4.1 Database Technology

**MongoDB** with **Mongoose ODM** (v8.16.3)
- NoSQL document database
- Schema-based modeling with Mongoose
- Typegoose for TypeScript class-based schemas

### 4.2 Core Schemas

#### 4.2.1 User Schema
**Location:** `backend/src/users/user.schema.ts`

```typescript
class User {
  mail: string;              // Unique email
  password: string;          // Bcrypt hashed password
  role: Role;                // 'admin' (Buyer) or 'user' (Seller)
  company: Types.ObjectId;   // Reference to Company
  failedLoginAttempts: number;
  lockUntil: number | null;
  timestamps: true;          // createdAt, updatedAt
}
```

**Indexes:**
- Unique index on `mail`
- Reference index on `company`

#### 4.2.2 Company Schema
**Location:** `backend/src/company/company.schema.ts`

```typescript
class Company {
  companyName: string;
  companyAddress: string;
  companyMobile: string;
  taxId: string;
  role: Role;                // 'Buyer', 'Seller', 'Seller and Buyer'
  isVerified: boolean;
  tradeType: TradeType;      // 'international' or 'domestic'
  founderName: string;
  websiteUrl: string;
  exportedBefore: boolean;
  referrel: string;
  mainLineBusiness: string[];
  meanMonthlyRevenue: MeanMonthlyRevenue;
  users: Types.ObjectId[];   // Array of User references
  onboardingProgress: number;
  isOnboardingCompleted: boolean;
  deliveryAddresses: DeliveryAddress[];
  timestamps: true;
}
```

**Enums:**
- `Role`: 'Buyer', 'Seller', 'Seller and Buyer'
- `TradeType`: 'international', 'domestic'

#### 4.2.3 Product Schema
**Location:** `backend/src/products/schema/products.schema.ts`

```typescript
class Product {
  // Basic Information
  name: string;
  stock: string;
  stockUnit: string;
  moq: string;                    // Minimum Order Quantity
  moqUnit: string;
  description: string;
  detailedDescription: string;
  category: string;
  hsnCode: string;
  
  // Pricing
  price: string;
  currency: string;
  sku: string;
  onSale: boolean;
  discount: string;
  salePrice: string;
  costOfGoods: string;
  profit: string;
  pricing: string;
  margin: string;
  
  tags: string[];
  
  // Trade Terms
  revenueMin: string;
  revenueMax: string;
  currencyTrade: string;
  unitTrade: string;
  yearsTrade: string;
  industry: string;
  marketYears: string;
  sellerMarketYears: string;
  marketcapture: string;
  
  // Incoterms
  selectedIncoterm: IncotermType;  // 'EXW', 'FCA', 'FAS', 'FOB', etc.
  selectedIncotermData: IncotermRowData;
  defaults: Record<IncotermType, IncotermRowData>;
  
  // File Uploads
  productImages: string[];         // Array of image paths
  testReports: string[];           // Array of document paths
  
  userId: string;                  // Creator user ID
  timestamps: true;
}
```

**Incoterm Types:**
- 'EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'

#### 4.2.4 Trade Schema
**Location:** `backend/src/trade/schema/trade.schema.ts`

```typescript
class Trade {
  // Core References
  product: Types.ObjectId;         // Reference to Product
  buyer: Types.ObjectId;           // Reference to User (Buyer)
  seller: Types.ObjectId;          // Reference to User (Seller)

  // Status Fields
  purchaseRequestStatus: string;   // 'pending', 'accepted', 'rejected'
  purchaseOrderStatus: string;

  // Quantity
  quantity: string;
  quantityUnit: string;

  // Buyer's Initial Offer
  buyerOfferedPrice: string;
  buyerIncoterms: Incoterms;
  buyerMessage: string;
  selectedAddress: Address;        // Required delivery address

  // Trade Queries
  buyerIndustryType: string;
  buyerMarketYears: string;        // Required
  marketCapture: string;
  tradeYears: string;              // Required
  productUsage: string;

  // Payment Terms
  paymentMethod: PaymentMethod;    // type, method, percentage, days

  // Seller's Counter-Offer
  sellerOfferedPrice: string;
  sellerOfferedIncoterms: Incoterms;
  sellerMessage: string;

  // Negotiation Tracking
  negotiationStatus: NegotiationStatus;  // 'pending' | 'countered' | 'buyer_responded' | 'accepted' | 'rejected'
  currentNegotiationRound: number;       // Tracks negotiation round (default: 0)
  negotiationHistory: NegotiationEntry[]; // Full history of all offers
  acceptedAt: Date;
  rejectedAt: Date;
  rejectionReason: string;

  // Trade Phase Management
  tradePhase: TradePhase;          // 'PR' | 'SCO' | 'ICPO' | 'SPA' | 'PAYMENT' | 'BOL' | 'COMPLETED'

  // Document Storage
  scoDocument: DocumentInfo;       // Seller uploads after acceptance
  icpoDocument: DocumentInfo;      // Buyer uploads after SCO
  spaDocument: DocumentInfo;       // Either party uploads after ICPO
  bolDocument: DocumentInfo;       // Seller uploads after payment
  paymentProof: DocumentInfo;      // Buyer uploads after SPA

  // Document Timestamps
  scoSubmittedAt: Date;
  icpoSubmittedAt: Date;
  spaSignedAt: Date;
  paymentVerifiedAt: Date;
  bolUploadedAt: Date;
  completedAt: Date;

  timestamps: true;
}

// Negotiation History Entry
interface NegotiationEntry {
  round: number;
  party: 'buyer' | 'seller';
  price: string;
  incoterms: Incoterms;
  message: string;
  timestamp: Date;
}

// Document Info Structure
interface DocumentInfo {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  notes?: string;
}
```

**Sub-interfaces:**
- `Address`: fullName, mobileNumber, pincode, city, state, country, etc.
- `PaymentMethod`: type ('advance'|'credit'|'openAccount'), method ('RTGS'|'LetterOfCredit')

#### 4.2.5 Inbox Schemas
**Location:** `backend/src/inbox/schemas/`

**Conversation Schema:**
```typescript
class Conversation {
  participants: Types.ObjectId[];  // Array of User IDs
  lastMessage: string;
  lastMessageTimestamp: Date;
  unreadCount: Map<string, number>;
  timestamps: true;
}
```

**Message Schema:**
```typescript
class Message {
  conversationId: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  timestamp: Date;
  isRead: boolean;
}
```

#### 4.2.6 Wishlist Schema
**Location:** `backend/src/wishlist/wishlist.schema.ts`

```typescript
class Wishlist {
  userId: Types.ObjectId;
  products: Types.ObjectId[];      // Array of Product references
  timestamps: true;
}
```

#### 4.2.7 HSN Schema
**Location:** `backend/src/products/schema/hsn.schema.ts`

```typescript
class HSN {
  code: string;                    // HSN code
  description: string;
  // Additional HSN metadata
}
```

### 4.3 Relationships

```
User ──┬─> Company (Many-to-One)
       ├─> Wishlist (One-to-One)
       └─> Trade (One-to-Many as Buyer/Seller)

Company ──> User (One-to-Many)

Product ──┬─> User (Many-to-One)
          └─> Trade (One-to-Many)

Trade ──┬─> Product (Many-to-One)
        ├─> Buyer User (Many-to-One)
        └─> Seller User (Many-to-One)

Conversation ──> User[] (Many-to-Many)
Message ──> Conversation (Many-to-One)
```

---

## 5. API Architecture

### 5.1 API Base URL Structure

**Development:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001` (assumed)

**API Versioning:**
- Current: No versioning (flat structure)
- Recommended: `/api/v1/*` for future versioning

### 5.2 REST API Endpoints

#### 5.2.1 Authentication Module (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/auth/validate-cookie` | Validate user session cookie | Yes (Cookie) |
| GET | `/auth/me` | Get current user info | Yes (Cookie) |
| POST | `/auth/logout` | Clear session cookie | Yes (Cookie) |
| POST | `/auth/forgot-password` | Request password reset OTP | No |
| POST | `/auth/reset-password` | Reset password with OTP | No |
| POST | `/auth/change-password` | Change password (logged in) | Yes (Cookie) |

#### 5.2.2 User Module (`/users`)

_(Not fully implemented in current codebase)_

Planned endpoints from spec:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/mfa`
- `GET /users/me`
- `PATCH /users/:id/role`

#### 5.2.3 Login Module (`/login`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Validate credentials, send OTP email | No |
| POST | `/login/validate-otp` | Validate OTP, issue JWT cookie | No |

**POST /login Request:**
```json
{
  "mail": "user@example.com",
  "password": "userPassword"
}
```

**POST /login/validate-otp Request:**
```json
{
  "mail": "user@example.com",
  "otp": "123456"
}
```

**POST /login/validate-otp Response:**
```json
{
  "AccountToken": "jwt_token_string",
  "role": "Buyer" | "Seller"
}
```
Sets signed HTTP-only cookie `account` with JWT token.

#### 5.2.4 Company/Profile Module (`/company`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/company/profile` | Get company profile | Yes (Cookie) |
| PUT | `/company/profile` | Update company profile | Yes (Cookie) |
| GET | `/company/delivery-addresses` | Get delivery addresses | Yes (Cookie) |
| POST | `/company/delivery-addresses` | Add delivery address | Yes (Cookie) |
| PUT | `/company/delivery-addresses/:index` | Update delivery address | Yes (Cookie) |
| DELETE | `/company/delivery-addresses/:index` | Delete delivery address | Yes (Cookie) |

#### 5.2.5 Onboarding Module (`/onboarding`)

Multi-step onboarding flow (implementation in `onboarding.controller.ts`)

#### 5.2.6 Products Module (`/products`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products?q=search` | Search HSN codes | No |
| POST | `/products` | Create new product | Yes |
| GET | `/products/user` | Get user's products | Yes |
| GET | `/products` | Get all products (paginated, filtered) | No |
| GET | `/products/:id` | Get product by ID | No |
| PATCH | `/products/:id` | Update product | Yes |
| DELETE | `/products/:id` | Delete product | Yes |

**Query Parameters (GET `/products`):**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 30)
- `search`: Search query
- `category`: Filter by category
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

#### 5.2.7 Trade Module (`/trade`)

**Trade CRUD Operations:**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/trade/create` | Create purchase request | Yes |
| GET | `/trade/user-trades` | Get buyer's trades | Yes |
| GET | `/trade/seller-trades` | Get seller's trades | Yes |
| GET | `/trade/:id` | Get trade by ID | Yes |

**Negotiation Endpoints:**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/trade/:id/counter-offer` | Seller submits counter-offer | Yes (Seller) |
| POST | `/trade/:id/buyer-respond` | Buyer responds to counter | Yes (Buyer) |
| PUT | `/trade/:id/accept` | Accept trade terms | Yes |
| PUT | `/trade/:id/reject` | Reject trade (with reason) | Yes |
| GET | `/trade/:id/history` | Get negotiation history | Yes |

**Document Upload Endpoints:**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/trade/:id/upload-sco` | Upload SCO (Seller only, after acceptance) | Yes (Seller) |
| POST | `/trade/:id/upload-icpo` | Upload ICPO (Buyer only, after SCO) | Yes (Buyer) |
| POST | `/trade/:id/upload-spa` | Upload SPA (Either party, after ICPO) | Yes |
| POST | `/trade/:id/upload-payment-proof` | Upload payment proof (Buyer, after SPA) | Yes (Buyer) |
| POST | `/trade/:id/upload-bol` | Upload BoL (Seller, after payment) | Yes (Seller) |
| GET | `/trade/:id/documents` | Get all trade documents | Yes |

**Trade Phase Management:**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| PUT | `/trade/:id/advance-phase` | Manually advance trade phase | Yes |
| PUT | `/trade/:id/complete` | Mark trade as completed | Yes |

#### 5.2.8 Wishlist Module (`/wishlist`)

Wishlist management (implementation in `wishlist.controller.ts`)

#### 5.2.9 Inbox Module (`/inbox`)

Real-time messaging endpoints (implementation in `inbox.controller.ts`)

Planned from spec:
- `GET /messages/:threadId`
- `POST /messages/send`
- `GET /messages/history`

#### 5.2.10 Analytics Module (`/analytics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/analytics/metrics` | Get dashboard metrics (visits, sales, revenue, customers) | Yes (Cookie) |
| GET | `/analytics/bar-data` | Get bar chart data (7-day store visits) | Yes (Cookie) |
| GET | `/analytics/scatter-data` | Get scatter/line chart data (30-day sales) | Yes (Cookie) |
| GET | `/analytics/pie-data` | Get pie chart data (customer distribution) | Yes (Cookie) |
| GET | `/analytics/country-sales` | Get sales by country with flags | Yes (Cookie) |

#### 5.2.11 Mail Module (`/mail`)

Email notification service (implementation in `mail.controller.ts`)

### 5.3 Request/Response Patterns

#### 5.3.1 Authentication Pattern

**Cookie-based Authentication:**
```javascript
// Request
Headers: {
  Cookie: 'account=<signed-jwt-token>'
}

// Token Validation
const accountToken = response.req.signedCookies['account'];
const decodeToken = authService.validateAccountToken(accountToken);
const { userId, companyId } = decodeToken;
```

#### 5.3.2 Response Format

**Success Response:**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error description"
}
```

#### 5.3.3 File Upload Pattern

**Multipart Form Data:**
```javascript
// Controller
@UseInterceptors(FileUploadInterceptor)
async createProduct(
  @Body() body: any,
  @UploadedFiles() files?: Express.Multer.File[]
)

// Files array contains:
// - productImages[]
// - testReports[]
```

### 5.4 Planned AI Service Endpoints

From specification document (not yet implemented):

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/links/predict` | Predict Buyer/Seller match (AI trade dataset) |
| POST | `/v1/trades/score` | Calculate Gravity Score |
| POST | `/v1/analysis/initiate` | Start market analysis (async) |
| GET | `/v1/analysis/results/:jobId` | Get analysis results |
| POST | `/v1/commodities/search-niche` | Find niche commodity matches (grid feed) |

#### 5.4.1 Breyus AI vs Niche AI Orchestration

- Backend classifies the entered commodity against the mainstream list.
- If **not mainstream**, redirect to Niche AI and call `/v1/commodities/search-niche`.
- Niche AI shows a grid of matching commodities and flags each item using `is_niche` (true/false); user selects one.
- Backend sends seeker name for lookup plus only useful profile context for scoring:
  country, location (lat/lon), buyer port (from the form), price range, mean monthly revenue,
  and payment terms/credit score. Include `role` (buyer/seller) when profile context is sent.
  AI DB IDs are optional and often unavailable.
- Link prediction uses the AI trade dataset with a waterfall that ends in a commodity pool fallback
  so results still return even when there is no direct name match. Predicted partners can be matched
  by name when the AI DB ID is missing.
- Selected commodity runs the main AI pipeline:
  - `/v1/analysis/initiate`
  - `/v1/links/predict`
  - `/v1/trades/score`
- For each predicted company, the backend checks **email or phone** in the Breyus user database:
  - If the company exists, show **PO/Chat** actions.
  - If not, hide PO/Chat and show **contact info + AI scores** only.

#### 5.4.2 Breyus AI Flow Diagram

```
[User enters commodity]
          |
          v
[Backend classify: mainstream list]
    |                        |
    | mainstream             | not mainstream
    v                        v
[Breyus AI pipeline]     [Niche AI: /v1/commodities/search-niche]
    |                        |
    |                        v
    |               [Grid: show all results (flag is_niche)]
    |                        |
    |                        v
    |               [User selects commodity]
    |                        |
    +------------------------+
          |
          v
[POST /v1/analysis/initiate] (async)
          |
          v
[POST /v1/links/predict] + [POST /v1/trades/score]
          |
          v
[For each predicted company]
    |                        |
    | on platform            | not on platform
    v                        v
[Show PO/Chat]          [Show contact info + AI scores]
```

#### 5.4.3 HS/HSN Normalization (AI Requests)

- HS/HSN is required for Breyus AI and Niche AI requests.
- Accept 4, 6, 8, or 10 digit codes.
- Canonical AI key is HS-6 (6 digits).
- 8/10 digit codes are truncated to HS-6 for AI calls.
- 4 digit codes are treated as a prefix match (e.g., `0901%`).

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

**Two-Factor Authentication (Password + Email OTP):**

1. **Step 1 - Credential Validation:**
   - User submits email + password to `POST /login`
   - Backend validates password with bcrypt
   - 6-digit OTP generated and stored in Redis (10-min TTL)
   - OTP sent via email (Sendinblue/SMTP)
   - Returns success if credentials valid

2. **Step 2 - OTP Verification:**
   - User submits email + OTP to `POST /login/validate-otp`
   - OTP validated against Redis store
   - OTP marked as used (single use)
   - JWT token generated with payload: `{ userId, companyId }`
   - Token stored in **signed HTTP-only cookie**
   - Cookie name: `account`, expiry: 1 hour

3. **Request Authentication:**
   - Every protected endpoint reads `account` cookie
   - Token validated using `authService.validateAccountToken()`
   - User/Company ID extracted from token
   - Database lookup for user details and role

4. **Session Management:**
   - Cookie-based session (no refresh tokens currently)
   - Token expiration: 1 hour (configurable via COOKIE_EXPIRY_LOGIN)
   - OTP storage: Redis with in-memory fallback

5. **Password Reset Flow:**
   - `POST /auth/forgot-password` - Sends OTP to email
   - `POST /auth/reset-password` - Validates OTP, sets new password
   - Password validation: min 8 chars, uppercase, lowercase, number, special char

6. **Password Change (Authenticated):**
   - `POST /auth/change-password` - Verify current password, set new password

### 6.2 Authorization (RBAC)

**Role-Based Access Control:**

**Roles:**
- `Buyer` (stored as 'admin' in User schema - legacy naming)
- `Seller` (stored as 'user' in User schema - legacy naming)
- `Seller and Buyer` (in Company schema)

**Frontend Route Protection:**
```typescript
// Buyer-only routes
<BuyerProtectedRoute>
  <Layout Buyer={true} Body={<Homepage />} />
</BuyerProtectedRoute>

// Seller-only routes
<SellerProtectedRoute>
  <Layout Seller={true} Body={<Dashboard />} />
</SellerProtectedRoute>
```

**Backend Protection:**
```typescript
// Extract role from token
const user = await userSchema.findById(userId)
  .populate('company', 'role')
  .lean();
const company = user.company as { role?: string };
```

### 6.3 Account Security Features

**Password Security:**
- Bcrypt hashing (v6.0.0)
- Salt rounds: (configured in service)

**Failed Login Protection:**
```typescript
failedLoginAttempts: number;   // Counter
lockUntil: number | null;      // Timestamp for account unlock
```

**Planned Features (from spec):**
- Multi-Factor Authentication (TOTP/SMS)
- Device session list & revocation
- OAuth2 refresh token flow
- Password reset flow

---

## 7. Real-time Communication

### 7.1 WebSocket Implementation

**Technology:** Socket.io

**Frontend:**
```typescript
import { io } from 'socket.io-client';
// socket.io-client v4.8.1
```

**Backend:**
- Integration pending (not in current dependencies)

### 7.2 Real-time Features

**Inbox/Messaging:**
- Real-time message delivery
- Typing indicators
- Read receipts
- Online status 

**Notifications:**
- Trade status updates
- New message alerts
- Document verification alerts

---

## 8. File Upload & Storage

### 8.1 Upload Mechanism

**Multer Configuration:**
```typescript
import { FileUploadInterceptor } from './file-upload.interceptor';

@UseInterceptors(FileUploadInterceptor)
@UploadedFiles() files?: Express.Multer.File[]
```

**Supported File Types:**

**Product Module:**
- Product Images: `productImages[]`
- Test Reports: `testReports[]`

**Trade/Document Module (planned):**
- SCO (Soft Corporate Offer)
- ICPO
- SPA (Sales Purchase Agreement)
- BoL (Bill of Lading)
- Payment Proof

### 8.2 Storage Strategy

**Current Implementation:**
- Local file system storage
- File paths stored in MongoDB as strings

**Recommended Production Strategy:**
- Cloud storage (AWS S3, Google Cloud Storage, Azure Blob)
- CDN for product images
- Secure document storage with encryption
- File versioning for legal documents

### 8.3 File Validation

**Custom Interceptor:**
- File type validation
- File size limits
- Virus scanning (recommended for production)

---

## 9. Security Implementation

### 9.1 Current Security Measures

**Backend:**
1. **Signed Cookies:**
   - `cookie-parser` with secret key
   - HTTP-only cookies (prevent XSS)

2. **Password Hashing:**
   - Bcrypt with salt rounds

3. **Input Validation:**
   - `class-validator` DTOs
   - Type checking with TypeScript

4. **CORS:**
   - Configured in `main.ts`

**Frontend:**
1. **XSS Prevention:**
   - DOMPurify (v3.2.6) for sanitizing HTML
   - React's built-in XSS protection

2. **Secure API Calls:**
   - Axios interceptors for auth headers
   - Automatic cookie attachment

### 9.2 Recommended Security Enhancements

**From Specification:**

1. **TLS/HTTPS Enforcement:**
   - Enforce HTTPS in production
   - HSTS headers

2. **Field-Level Encryption:**
   - Encrypt sensitive data (bank info, PII)
   - Encryption at rest

3. **Rate Limiting:**
   - Login attempt limits
   - API rate limiting per user/IP

4. **Audit Logging:**
   - Activity logs for all critical operations
   - Audit trail for trade lifecycle

5. **GDPR Compliance:**
   - Right to be Forgotten
   - Data export functionality
   - Consent management

6. **Security Headers:**
   - CSP (Content Security Policy)
   - X-Frame-Options
   - X-Content-Type-Options

---



## 10. Deployment Architecture

**Production Topology:**
- Frontend build is served by Nginx on the VPS at `https://breyus.com`.
- Admin Portal is served by Nginx at `https://admin.breyus.com`.
- Nginx proxies API traffic to the backend at `https://api.breyus.com` and passes WebSocket upgrades.
- Backend, AI service, and data stores run in Docker Compose on the Hetzner host.
- Frontend is built on the VPS (`frontend/` -> `frontend/build`) and bind-mounted into the Nginx container.
- Admin Portal is built on the VPS (`admin/` -> `admin/dist`) and bind-mounted into the Nginx container.

**Reference:** See `DEPLOYMENT.md` and `SERVER_SETUP.md` for step-by-step setup.

---

## 16. Migration Path & Roadmap

### 16.1 Current vs. Planned Features

**Implemented:**
✅ User authentication (two-factor: password + email OTP)
✅ Password reset (OTP-based) and change password
✅ Logout functionality
✅ Product listing and search
✅ Trade creation (Purchase Request)
✅ Trade negotiation (counter-offer, buyer-response, accept, reject)
✅ Unlimited negotiation rounds with history tracking
✅ Document uploads (SCO, ICPO, SPA, Payment Proof, BoL)
✅ Trade phase advancement and completion
✅ Company profiles with GET/PUT API
✅ Onboarding flow (4-step wizard)
✅ Wishlist
✅ Basic inbox structure (schemas, gateway)
✅ Analytics dashboard with metrics, charts, and country data
✅ Settings page with profile editing
✅ Security page with password management
✅ Trade status tracking (5-tab UI: PR Status, PO Status, Ongoing, Track, History)
✅ Negotiation pages for buyers and sellers
✅ TradeDetailsModal with negotiation history view

**In Development:**
🔄 Real-time messaging (WebSocket gateway exists, needs completion)
🔄 Document verification workflow (status fields exist, admin portal planned)
🔄 Admin Portal (`admin.breyus.com`) - See `ADMIN_PORTAL_PLAN.md` for full specifications
   - User & Company management (KYC verification, account suspension)
   - Trade oversight and dispute resolution
   - AI pipeline monitoring and database operations
   - System health monitoring, logs viewer, alerts
   - Content management (commodities, Incoterms, countries)
   - GDPR compliance tools

**Planned:**
📋 MFA enhancement (TOTP/SMS)
📋 E-signature integration (DocuSign/Adobe Sign)
📋 AI services (similarity search, gravity score, demand forecasting)
📋 Logistics integration (Maersk, INTTRA)
📋 KYC verification service (Onfido/Trulioo)
📋 Compliance & audit module

### 16.2 Database Migration Strategy

**Recommended Tool:** Mongoose migrations

**Migration Steps:**
1. Version control for schemas
2. Migration scripts for schema changes
3. Rollback procedures
4. Data validation post-migration

---

## 18. Glossary

| Term | Definition |
|------|------------|
| **HSN** | Harmonized System Nomenclature - International product classification code |
| **MOQ** | Minimum Order Quantity |
| **Incoterms** | International Commercial Terms - Trade responsibility rules |
| **PR** | Purchase Request |
| **SCO** | Soft Corporate Offer |
| **ICPO** | Irrevocable Corporate Purchase Order |
| **SPA** | Sales Purchase Agreement |
| **BoL** | Bill of Lading |
| **KYC** | Know Your Customer - Identity verification |
| **RBAC** | Role-Based Access Control |
| **ODM** | Object-Document Mapping (Mongoose for MongoDB) |
| **DTO** | Data Transfer Object |

---

