---
type: api-doc
module: company
tags: [api, company]
---

# Company API

## Overview
The Company API manages company-specific data, including delivery address management, company profile operations, KYC document management, and profile media (profile picture and banner). Delivery addresses are used during trade creation for shipping information.

## Base URL
```
/company
```

## Authentication
All endpoints require authentication via signed cookie. The controller is protected by `AuthGuard` which validates:
- Cookie-based JWT authentication
- User existence in database
- User is not suspended

---

## Endpoints

### 1. Get Delivery Addresses

Retrieves all delivery addresses for the authenticated company.

**Endpoint:** `GET /company/delivery-addresses`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Delivery addresses retrieved successfully",
  "data": [
    {
      "fullName": "string",
      "mobileNumber": "string",
      "pincode": "string",
      "streetName": "string",
      "landmark": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "additionalDetails": "string"
    }
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
  "message": "Failed to get delivery addresses",
  "error": "error details"
}
```

**Implementation Notes:**
- Returns addresses for the company associated with the authenticated user
- Addresses are stored as an array in the Company document
- Returns empty array if no addresses exist

---

### 2. Add Delivery Address

Adds a new delivery address to the company's address list.

**Endpoint:** `POST /company/delivery-addresses`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "fullName": "string",
  "mobileNumber": "string",
  "pincode": "string",
  "streetName": "string",
  "landmark": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "additionalDetails": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fullName | string | Yes | Full name of recipient |
| mobileNumber | string | Yes | Contact phone number |
| pincode | string | Yes | Postal/ZIP code |
| streetName | string | Yes | Street address |
| landmark | string | No | Nearby landmark |
| city | string | Yes | City name |
| state | string | Yes | State/Province |
| country | string | Yes | Country name |
| additionalDetails | string | No | Additional notes |

**Response:**

**Success (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Delivery address added successfully",
  "data": [
    {
      "fullName": "string",
      "mobileNumber": "string",
      "pincode": "string",
      "streetName": "string",
      "landmark": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "additionalDetails": "string"
    }
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
  "message": "Failed to add delivery address",
  "error": "error details"
}
```

**Implementation Notes:**
- Appends new address to the company's `deliveryAddresses` array
- Returns the complete updated address list
- No duplicate checking is performed

---

### 3. Update Delivery Address

Updates an existing delivery address at a specific index.

**Endpoint:** `PUT /company/delivery-addresses/:index`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| index | string | Array index of the address to update (0-based) |

**Request Body:**
```json
{
  "fullName": "string",
  "mobileNumber": "string",
  "pincode": "string",
  "streetName": "string",
  "landmark": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "additionalDetails": "string"
}
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Delivery address updated successfully",
  "data": [...]
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid address index"
}
```

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
  "message": "Failed to update delivery address",
  "error": "error details"
}
```

---

### 4. Delete Delivery Address

Deletes a delivery address at a specific index.

**Endpoint:** `DELETE /company/delivery-addresses/:index`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| index | string | Array index of the address to delete (0-based) |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Delivery address deleted successfully",
  "data": [...]
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid address index"
}
```

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
  "message": "Failed to delete delivery address",
  "error": "error details"
}
```

---

### 5. Get Company Profile

Retrieves the company profile for the authenticated user.

**Endpoint:** `GET /company/profile`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Company profile retrieved successfully",
  "data": {
    "companyName": "string",
    "companyAddress": "string",
    "companyMobile": "string",
    "taxId": "string",
    "founderName": "string",
    "websiteUrl": "string",
    "role": "Buyer" | "Seller" | "Seller and Buyer",
    "tradeType": "international" | "domestic",
    "mainLineBusiness": ["string"],
    "bankInfo": {
      "ifscCode": "string",
      "accountNumber": "string",
      "accountHolderName": "string",
      "bankAddress": "string",
      "bankBranch": "string"
    },
    "tradeDetails": {
      "emergingInterest": "string",
      "agreedToTerms": true,
      "cisDocument": "string"
    },
    "whatsappContact": "string",
    "primaryEmail": "string",
    "alternativeSalesEmail": "string",
    "profilePicture": "string",
    "bannerImage": "string",
    "billingPreferences": {
      "invoiceEmail": "string",
      "useExistingEmail": true
    }
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
  "message": "Failed to get company profile",
  "error": "error details"
}
```

---

### 6. Update Company Profile

Updates the company profile for the authenticated user.

**Endpoint:** `PUT /company/profile`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "companyName": "string",
  "companyAddress": "string",
  "companyMobile": "string",
  "taxId": "string",
  "founderName": "string",
  "websiteUrl": "string",
  "bankInfo": {
    "ifscCode": "string",
    "accountNumber": "string",
    "accountHolderName": "string",
    "bankAddress": "string",
    "bankBranch": "string"
  },
  "tradeDetails": {
    "emergingInterest": "string",
    "agreedToTerms": true,
    "cisDocument": "string"
  },
  "whatsappContact": "string",
  "primaryEmail": "string",
  "alternativeSalesEmail": "string",
  "billingPreferences": {
    "invoiceEmail": "string",
    "useExistingEmail": true
  }
}
```

All fields are optional. Only provided fields will be updated. Fields not in the allowed list (`companyName`, `companyAddress`, `companyMobile`, `taxId`, `founderName`, `websiteUrl`, `bankInfo`, `tradeDetails`, `whatsappContact`, `primaryEmail`, `alternativeSalesEmail`, `billingPreferences`) are silently ignored.

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Company profile updated successfully",
  "data": {
    "companyName": "string",
    "companyAddress": "string",
    "companyMobile": "string",
    "taxId": "string",
    "founderName": "string",
    "websiteUrl": "string",
    "role": "Buyer",
    "tradeType": "international",
    "mainLineBusiness": ["string"],
    "bankInfo": {},
    "tradeDetails": {},
    "whatsappContact": "string",
    "primaryEmail": "string",
    "alternativeSalesEmail": "string",
    "profilePicture": "string",
    "bannerImage": "string",
    "billingPreferences": {
      "useExistingEmail": true
    }
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
  "message": "Failed to update company profile",
  "error": "error details"
}
```

---

### 7. Upload CIS Document

Uploads a CIS (Commonwealth of Independent States) document for the company.

**Endpoint:** `POST /company/upload-cis`

**Authentication:** Required (signed cookie)

**Request Type:** `multipart/form-data`

**Request Body:**
- `files`: The document file to upload (required). Maximum 10MB. Allowed types: Images, PDF.

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "CIS document uploaded successfully",
  "data": {
    "cisDocument": "https://storage.example.com/cis-documents/filename.pdf",
    "profile": { ... }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "No file provided"
}
```

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
  "message": "Failed to upload CIS document",
  "error": "error details"
}
```

---

### 8. Get KYC Documents

Retrieves all KYC documents for the authenticated company.

**Endpoint:** `GET /company/kyc-documents`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "KYC documents retrieved successfully",
  "data": [
    {
      "_id": "string",
      "type": "cis" | "product_catalog" | "other",
      "customName": "string",
      "description": "string",
      "filename": "string",
      "originalName": "string",
      "path": "string",
      "mimeType": "string",
      "size": 12345,
      "status": "pending" | "approved" | "rejected",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "reviewedBy": "string",
      "reviewedAt": "2024-01-01T00:00:00.000Z",
      "reviewNotes": "string"
    }
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
  "message": "Failed to get KYC documents",
  "error": "error details"
}
```

---

### 9. Get CIS Document Status

Retrieves the status of the CIS document specifically.

**Endpoint:** `GET /company/kyc-documents/cis-status`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "CIS status retrieved successfully",
  "data": {
    "hasCis": true,
    "canUploadCis": false,
    "reason": "A CIS document already exists with status: approved. Delete the existing CIS first to upload a new one.",
    "existingCisDocument": {
      "_id": "string",
      "status": "approved",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
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
  "message": "Failed to get CIS status",
  "error": "error details"
}
```

---

### 10. Get KYC Status

Retrieves the overall KYC verification status for the company.

**Endpoint:** `GET /company/kyc-status`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "KYC status retrieved successfully",
  "data": {
    "isKycVerified": true,
    "documents": [
      {
        "_id": "string",
        "type": "cis",
        "customName": "Company CIS 2024",
        "filename": "string",
        "originalName": "string",
        "path": "string",
        "mimeType": "string",
        "size": 12345,
        "status": "approved",
        "uploadedAt": "2024-01-01T00:00:00.000Z",
        "reviewedBy": "string",
        "reviewedAt": "2024-01-01T00:00:00.000Z",
        "reviewNotes": "string"
      }
    ],
    "pendingCount": 0,
    "approvedCount": 3,
    "rejectedCount": 0
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
  "message": "Failed to get KYC status",
  "error": "error details"
}
```

---

### 11. Upload KYC Document

Uploads a new KYC document for the company.

**Endpoint:** `POST /company/kyc-documents`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `files`: The document file to upload (required)
- `documentType`: string - Type of document (required)
- `customName`: string - User-provided name for the document (required)
- `description`: string - Description (optional, but required for 'other' type)

**Allowed Document Types:**
- `cis` - Company Information Sheet
- `product_catalog` - Product Catalog
- `other` - Other documents

**Response:**

**Success (201 Created):**
```json
{
  "statusCode": 201,
  "message": "KYC document uploaded successfully",
  "data": {
    "_id": "string",
    "type": "cis",
    "customName": "Company CIS 2024",
    "filename": "string",
    "originalName": "string",
    "path": "https://storage.example.com/kyc-documents/...",
    "mimeType": "application/pdf",
    "size": 12345,
    "status": "pending",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "No file provided"
}
```
or
```json
{
  "statusCode": 400,
  "message": "Invalid document type. Must be one of: cis, product_catalog, other"
}
```
or
```json
{
  "statusCode": 400,
  "message": "Document name is required"
}
```

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
  "message": "Failed to upload KYC document",
  "error": "error details"
}
```

**Implementation Notes:**
- Legacy document types (passport, tax_certificate, business_registration) exist in old data but are not uploadable via UI
- Documents are stored in the `kyc-documents` folder
- Initial status is always `pending`

---

### 12. Delete KYC Document

Deletes a KYC document by its ID.

**Endpoint:** `DELETE /company/kyc-documents/:docId`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| docId | string | KYC Document MongoDB ObjectId |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "KYC document deleted successfully"
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
  "message": "Document not found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to delete KYC document",
  "error": "error details"
}
```

---

### 13. Get Public Company Profile (Seller)

Retrieves a public company profile by ID. Returns only non-sensitive fields visible to other users. Validates that the company has a Seller or Both role before returning.

**Endpoint:** `GET /company/public/:companyId`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| companyId | string | Company MongoDB ObjectId |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Public company profile retrieved successfully",
  "data": {
    "_id": "string",
    "companyName": "string",
    "companyAddress": "string",
    "companyMobile": "string",
    "taxId": "string",
    "founderName": "string",
    "websiteUrl": "string",
    "role": "Seller",
    "tradeType": "international",
    "mainLineBusiness": ["string"],
    "whatsappContact": "string",
    "primaryEmail": "string",
    "alternativeSalesEmail": "string",
    "profilePicture": "string",
    "bannerImage": "string",
    "isKycVerified": true,
    "tradeDetails": {
      "emergingInterest": "string"
    }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid company ID format"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Company is not a seller"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Company not found"
}
```

---

### 14. Get Buyer Public Profile

Retrieves public profile for a buyer company. Used by sellers viewing buyer profiles. Validates that the company has a Buyer or Both role before returning.

**Endpoint:** `GET /company/buyer-public/:companyId`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| companyId | string | Company MongoDB ObjectId |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Buyer company profile retrieved successfully",
  "data": {
    "_id": "string",
    "companyName": "string",
    "companyAddress": "string",
    "companyMobile": "string",
    "taxId": "string",
    "founderName": "string",
    "websiteUrl": "string",
    "role": "Buyer",
    "tradeType": "international",
    "mainLineBusiness": ["string"],
    "whatsappContact": "string",
    "primaryEmail": "string",
    "alternativeSalesEmail": "string",
    "profilePicture": "string",
    "bannerImage": "string",
    "isKycVerified": true,
    "tradeDetails": {
      "emergingInterest": "string"
    }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid company ID format"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Company is not a buyer"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Company not found"
}
```

---

### 15. Upload Profile Picture

Uploads a profile picture for the company.

**Endpoint:** `POST /company/upload-profile-picture`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `files`: The image file to upload (required)

**Allowed File Types:** JPEG, PNG, GIF, WebP

**Max File Size:** 5MB

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Profile picture uploaded successfully",
  "data": {
    "profilePicture": "https://storage.example.com/profile-pictures/..."
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "No file provided"
}
```
or
```json
{
  "statusCode": 400,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
}
```
or
```json
{
  "statusCode": 400,
  "message": "File size exceeds 5MB limit"
}
```

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
  "message": "Failed to upload profile picture",
  "error": "error details"
}
```

---

### 16. Upload Banner Image

Uploads a banner image for the company profile.

**Endpoint:** `POST /company/upload-banner`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `files`: The image file to upload (required)

**Allowed File Types:** JPEG, PNG, GIF, WebP

**Max File Size:** 10MB

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Banner image uploaded successfully",
  "data": {
    "bannerImage": "https://storage.example.com/banners/..."
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "No file provided"
}
```
or
```json
{
  "statusCode": 400,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."
}
```
or
```json
{
  "statusCode": 400,
  "message": "File size exceeds 10MB limit"
}
```

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
  "message": "Failed to upload banner image",
  "error": "error details"
}
```

---

### 17. Delete Profile Picture

Deletes the company's profile picture.

**Endpoint:** `DELETE /company/profile-picture`

**Authentication:** Required (signed cookie)

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Profile picture deleted successfully"
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
  "message": "Failed to delete profile picture",
  "error": "error details"
}
```

---

### 18. Delete Banner Image

Deletes the company's banner image.

**Endpoint:** `DELETE /company/banner`

**Authentication:** Required (signed cookie)

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Banner image deleted successfully"
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
  "message": "Failed to delete banner image",
  "error": "error details"
}
```

---

## Data Models

### DeliveryAddress Interface
```typescript
interface DeliveryAddress {
  fullName: string;
  mobileNumber: string;
  pincode: string;
  streetName: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  additionalDetails?: string;
}
```

### Company Schema
```typescript
{
  _id: ObjectId;
  companyName: string;
  companyAddress: string;
  companyMobile: string;
  taxId: string;
  country: string;

  // GST Verification (for Indian companies)
  gstVerified: boolean;
  gstVerifiedAt?: Date;
  gstPendingManualReview: boolean;
  gstVerificationData?: {
    legalName: string;
    tradeName?: string;
    status: string;
    registrationDate?: string;
    stateJurisdiction?: string;
  };

  role: Role;
  isVerified: boolean;
  tradeType: TradeType;
  founderName: string;
  websiteUrl: string;
  exportedBefore: boolean;
  referrel: string;
  mainLineBusiness: string[];
  meanMonthlyRevenue: MeanMonthlyRevenue;
  users: ObjectId[];
  onboardingProgress: number;
  isOnboardingCompleted: boolean;
  deliveryAddresses: DeliveryAddress[];

  // Bank Information
  bankInfo: BankInfo;

  // Trade Details
  tradeDetails: TradeDetails;

  // Contact Information
  whatsappContact: string;
  primaryEmail: string;
  alternativeSalesEmail: string;

  // KYC Documents (Phase 4)
  kycDocuments: KycDocument[];
  isKycVerified: boolean;
  kycVerifiedBy?: ObjectId;
  kycVerifiedAt?: Date;
  kycVerificationNotes?: string;

  // Profile Media
  profilePicture?: string;
  bannerImage?: string;

  // Billing Preferences
  billingPreferences: BillingPreferences;

  // Currency for analytics
  currency: string;

  // Orphan Cleanup
  onboardingExpiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

### Role Enum
```typescript
enum Role {
  BUYER = 'Buyer',
  SELLER = 'Seller',
  BOTH = 'Seller and Buyer'
}
```

### TradeType Enum
```typescript
enum TradeType {
  INTERNATIONAL = 'international',
  DOMESTIC = 'domestic'
}
```

### KycDocumentType Enum
```typescript
enum KycDocumentType {
  CIS = 'cis',
  PRODUCT_CATALOG = 'product_catalog',
  OTHER = 'other',
  // Legacy types (kept for backward compatibility)
  PASSPORT = 'passport',
  TAX_CERTIFICATE = 'tax_certificate',
  BUSINESS_REGISTRATION = 'business_registration'
}
```

### KycDocumentStatus Enum
```typescript
enum KycDocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}
```

### KycDocument Interface
```typescript
interface KycDocument {
  _id: ObjectId;
  type: KycDocumentType;
  customName: string;
  description?: string;
  filename: string;
  originalName: string;
  path: string;
  mimeType: string;
  size: number;
  status: KycDocumentStatus;
  uploadedAt: Date;
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
}
```

### BankInfo Interface
```typescript
interface BankInfo {
  ifscCode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  bankAddress?: string;
  bankBranch?: string;
}
```

### TradeDetails Interface
```typescript
interface TradeDetails {
  emergingInterest?: string;
  agreedToTerms?: boolean;
  cisDocument?: string;
}
```

### BillingPreferences Interface
```typescript
interface BillingPreferences {
  invoiceEmail?: string;
  useExistingEmail?: boolean;
}
```

---

## Example Requests

### Get Delivery Addresses
```bash
curl -X GET http://localhost:3001/company/delivery-addresses \
  -H "Cookie: account=s%3A<signed-token>"
```

### Add Delivery Address
```bash
curl -X POST http://localhost:3001/company/delivery-addresses \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "fullName": "John Doe",
    "mobileNumber": "+1234567890",
    "pincode": "12345",
    "streetName": "123 Main Street",
    "landmark": "Near Central Park",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "additionalDetails": "Office building, Floor 5"
  }'
```

### Update Delivery Address
```bash
curl -X PUT http://localhost:3001/company/delivery-addresses/0 \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "fullName": "Jane Doe",
    "mobileNumber": "+1234567890",
    "pincode": "12345",
    "streetName": "456 Oak Avenue",
    "city": "New York",
    "state": "NY",
    "country": "USA"
  }'
```

### Delete Delivery Address
```bash
curl -X DELETE http://localhost:3001/company/delivery-addresses/0 \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Company Profile
```bash
curl -X GET http://localhost:3001/company/profile \
  -H "Cookie: account=s%3A<signed-token>"
```

### Update Company Profile
```bash
curl -X PUT http://localhost:3001/company/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "companyName": "Acme Corp",
    "companyMobile": "+1234567890",
    "websiteUrl": "https://acme.com",
    "whatsappContact": "+1234567890",
    "primaryEmail": "contact@acme.com",
    "bankInfo": {
      "accountHolderName": "Acme Corp",
      "bankBranch": "Main Branch"
    }
  }'
```

---

## Frontend Integration Notes

1. **Address Management:**
   - Display addresses in a list or card layout
   - Each address should have edit and delete actions
   - Use index from array position for update/delete operations
   - Refresh list after successful operations

2. **Profile Management:**
   - Display company profile in settings page
   - Allow editing of editable fields
   - Some fields like `role`, `isVerified`, `isKycVerified` should be read-only
   - Use profile picture and banner upload endpoints for media

3. **Address Selection During Trade:**
   - Fetch addresses via GET endpoint
   - Display as selectable cards
   - Allow adding new address inline

4. **KYC Document Management:**
   - Display uploaded documents with status badges (pending/approved/rejected)
   - Show review notes for rejected documents
   - Allow users to upload new documents
   - Allow deletion of pending documents only
   - Show overall KYC status from `/company/kyc-status`

5. **Public Profiles:**
   - Use `/company/public/:companyId` for viewing seller profiles
   - Use `/company/buyer-public/:companyId` for viewing buyer profiles
   - Show only non-sensitive public information

6. **Profile Media:**
   - Profile picture: Max 5MB, JPEG/PNG/GIF/WebP
   - Banner image: Max 10MB, JPEG/PNG/GIF/WebP
   - Display placeholders when no image uploaded
   - Provide delete functionality

---

## Related Modules
- **Trade Module:** Uses delivery addresses for trade creation
- **Onboarding Module:** Company profile created during onboarding
- **Auth Module:** Company ID extracted from auth token
- **Users Module:** Users are associated with companies
- **Admin KYC Module:** Admin reviews KYC documents
- **Products Module:** Products linked to company via user

## Related
- [[api/users]] — User accounts
- [[api/products]] — Company products
- [[api/onboarding]] — Company registration
- [[MOC-API]]
