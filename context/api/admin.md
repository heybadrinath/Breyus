---
type: api-doc
module: admin
tags: [api, admin]
---

# Admin Portal API

## Overview

The Admin Portal API provides administrative management capabilities for the Breyus platform. These endpoints are exclusively for admin users with separate authentication from regular platform users.

### Key Features
- **Separate Authentication**: Admin accounts are stored in a separate collection (`adminusers`) with their own session management
- **Role-Based Access Control (RBAC)**: Three admin roles with different permission levels
- **Activity Logging**: All admin actions are automatically logged for audit purposes
- **Session Management**: Secure cookie-based sessions with configurable expiry

### Admin Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `super_admin` | Full system access | All operations including destructive actions (delete users, force changes) |
| `admin` | Standard admin | Most operations (suspend users, manage trades, verify KYC) |
| `viewer` | Read-only access | View all data but cannot modify anything |

## Base URL
```
/admin
```

## Authentication

Admin endpoints use cookie-based authentication via a signed HTTP-only cookie named `admin_session`.

### Cookie Configuration
- **Name:** `admin_session`
- **Type:** Signed HTTP-only cookie
- **Expiry:** 24 hours (configurable via `ADMIN_SESSION_EXPIRY`)
- **Secure:** `true` in production
- **SameSite:** `strict` in production, `lax` in development

---

# 1. Admin Authentication

## Base URL
```
/admin/auth
```

---

### 1.1 Login

Authenticate admin with email and password.

**Endpoint:** `POST /admin/auth/login`

**Authentication:** None required (public)

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123"
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| email | string | Required, valid email format |
| password | string | Required, minimum 8 characters |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "admin": {
      "_id": "64abc123...",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "lastLogin": "2025-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**423 Locked:**
```json
{
  "statusCode": 423,
  "message": "Account locked. Too many failed attempts."
}
```

---

### 1.2 Logout

Clear admin session.

**Endpoint:** `POST /admin/auth/logout`

**Authentication:** Optional (clears existing cookie)

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

---

### 1.3 Get Current Admin

Get current authenticated admin info.

**Endpoint:** `GET /admin/auth/me`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "_id": "64abc123...",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "super_admin",
    "lastLogin": "2025-01-15T10:30:00.000Z",
    "createdAt": "2024-06-01T00:00:00.000Z"
  },
  "valid": true
}
```

**Error Response (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "Not authenticated",
  "valid": false
}
```

---

### 1.4 Change Password

Change admin password.

**Endpoint:** `POST /admin/auth/change-password`

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePass456"
}
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Incorrect current password
- `401 Unauthorized`: Not authenticated

---

### 1.5 Get Sessions

Get all active sessions for current admin.

**Endpoint:** `GET /admin/auth/sessions`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "_id": "session123...",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "lastActivity": "2025-01-15T12:00:00.000Z",
      "isCurrentSession": true
    }
  ]
}
```

---

### 1.6 Revoke All Sessions

Logout from all other devices.

**Endpoint:** `POST /admin/auth/sessions/revoke-all`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "All other sessions revoked"
}
```

---

# 2. User Management

## Base URL
```
/admin/users
```

**Authentication:** Required for all endpoints
**RBAC:** Applied to all endpoints

---

### 2.1 List Users

Get paginated list of users with filters.

**Endpoint:** `GET /admin/users`

**RBAC:** `@AnyAdmin()` - All admin roles

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search by email, name |
| role | string | - | Filter by role: `Buyer` or `Seller` |
| isSuspended | boolean | - | Filter by suspension status |
| sortBy | string | `createdAt` | Sort field: `createdAt`, `mail`, `updatedAt` |
| sortOrder | string | `desc` | Sort order: `asc` or `desc` |
| startDate | string | - | Filter by registration date (ISO format) |
| endDate | string | - | Filter by registration date (ISO format) |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "user123...",
        "mail": "user@example.com",
        "fullName": "John Doe",
        "company": {
          "_id": "company123...",
          "companyName": "Acme Corp",
          "role": "Buyer"
        },
        "isSuspended": false,
        "createdAt": "2024-12-01T00:00:00.000Z"
      }
    ],
    "total": 150,
    "page": 1,
    "totalPages": 8
  }
}
```

---

### 2.2 Get User Page Stats

Get KPI statistics for the users page.

**Endpoint:** `GET /admin/users/stats`

**RBAC:** `@AnyAdmin()` - All admin roles

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "User page stats retrieved successfully",
  "data": {
    "totalUsers": 1500,
    "activeUsers": 1420,
    "suspendedUsers": 80,
    "newUsersThisMonth": 45,
    "buyerCount": 800,
    "sellerCount": 700
  }
}
```

---

### 2.3 Get User by ID

Get user details with company info and statistics.

**Endpoint:** `GET /admin/users/:id`

**RBAC:** `@AnyAdmin()` - All admin roles

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | User MongoDB ObjectId |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "user123...",
      "mail": "user@example.com",
      "fullName": "John Doe",
      "phoneNumber": "+1234567890",
      "company": {
        "_id": "company123...",
        "companyName": "Acme Corp",
        "role": "Buyer",
        "isKycVerified": true
      },
      "isSuspended": false,
      "suspendedAt": null,
      "suspensionReason": null,
      "createdAt": "2024-06-01T00:00:00.000Z",
      "lastLogin": "2025-01-15T10:30:00.000Z"
    },
    "stats": {
      "totalTrades": 25,
      "completedTrades": 20,
      "pendingTrades": 5,
      "totalVolume": 150000
    }
  }
}
```

---

### 2.4 Update User

Update user fields.

**Endpoint:** `PATCH /admin/users/:id`

**RBAC:** `@AdminOrAbove()` - super_admin and admin only

**Request Body:**
```json
{
  "mail": "newemail@example.com",
  "role": "admin"
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| mail | string | Optional, valid email format |
| role | string | Optional, one of: `admin` (Buyer), `user` (Seller) |

> **Note:** The `role` field uses legacy internal values: `admin` = Buyer, `user` = Seller.
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "User updated successfully",
  "data": { ... }
}
```

---

### 2.5 Delete User

Permanently delete a user.

**Endpoint:** `DELETE /admin/users/:id`

**RBAC:** `@SuperAdminOnly()` - Only super_admin

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "User deleted successfully"
}
```

---

### 2.6 Suspend User

Suspend a user account (blocks login and API access).

**Endpoint:** `POST /admin/users/:id/suspend`

**RBAC:** `@AdminOrAbove()` - super_admin and admin

**Request Body:**
```json
{
  "reason": "Violation of terms of service"
}
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "User suspended successfully",
  "data": {
    "_id": "user123...",
    "isSuspended": true,
    "suspendedAt": "2025-01-15T12:00:00.000Z",
    "suspensionReason": "Violation of terms of service"
  }
}
```

---

### 2.7 Unsuspend User

Restore a suspended user's access.

**Endpoint:** `POST /admin/users/:id/unsuspend`

**RBAC:** `@AdminOrAbove()` - super_admin and admin

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "User unsuspended successfully",
  "data": { ... }
}
```

---

### 2.8 Force Password Reset

Trigger password reset email for a user.

**Endpoint:** `POST /admin/users/:id/reset-password`

**RBAC:** `@AdminOrAbove()` - super_admin and admin

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Password reset initiated successfully. User will receive an email with reset instructions."
}
```

---

### 2.9 Export User Data (GDPR)

Export all user data as JSON file.

**Endpoint:** `GET /admin/users/:id/export`

**RBAC:** `@AdminOrAbove()` - super_admin and admin

**Response:** JSON file download with headers:
- `Content-Type: application/json`
- `Content-Disposition: attachment; filename="user-data-{id}-{timestamp}.json"`

---

# 3. Company Management

## Base URL
```
/admin/companies
```

---

### 3.1 List Companies

Get paginated list of companies with filters.

**Endpoint:** `GET /admin/companies`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| search | string | - | Search by company name |
| role | string | - | Filter by role: `Buyer`, `Seller`, or `Seller and Buyer` |
| isKycVerified | boolean | - | Filter by KYC status |
| hasKycDocuments | boolean | - | Filter companies with KYC documents |
| gstPendingManualReview | boolean | - | Filter companies with pending GST review |
| sortBy | string | `createdAt` | Sort field |
| sortOrder | string | `desc` | Sort order: `asc` or `desc` |
| startDate | string | - | Filter by registration date (ISO format) |
| endDate | string | - | Filter by registration date (ISO format) |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Companies retrieved successfully",
  "data": {
    "companies": [...],
    "total": 500,
    "page": 1,
    "totalPages": 25
  }
}
```

---

### 3.2 Get Company Page Stats

**Endpoint:** `GET /admin/companies/stats`

**Success Response (200 OK):**
```json
{
  "data": {
    "totalCompanies": 500,
    "verifiedCompanies": 350,
    "pendingVerification": 100,
    "buyerCompanies": 280,
    "sellerCompanies": 220
  }
}
```

---

### 3.3 Get Company by ID

**Endpoint:** `GET /admin/companies/:id`

---

### 3.4 Get Company Stats

**Endpoint:** `GET /admin/companies/:id/stats`

---

### 3.5 Update Company

**Endpoint:** `PATCH /admin/companies/:id`

**Request Body:**
```json
{
  "companyName": "Updated Corp",
  "companyAddress": "123 New Street",
  "companyMobile": "+1234567890",
  "taxId": "TAX123456",
  "founderName": "John Doe",
  "websiteUrl": "https://example.com",
  "role": "Buyer",
  "tradeType": "international",
  "mainLineBusiness": ["commodities", "manufacturing"],
  "whatsappContact": "+1234567890",
  "primaryEmail": "contact@example.com",
  "alternativeSalesEmail": "sales@example.com"
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| companyName | string | Optional |
| companyAddress | string | Optional |
| companyMobile | string | Optional |
| taxId | string | Optional |
| founderName | string | Optional |
| websiteUrl | string | Optional |
| role | string | Optional, one of: `Buyer`, `Seller`, `Seller and Buyer` |
| tradeType | string | Optional, one of: `international`, `domestic` |
| mainLineBusiness | string[] | Optional, array of strings |
| whatsappContact | string | Optional |
| primaryEmail | string | Optional |
| alternativeSalesEmail | string | Optional |

---

### 3.6 Delete Company

**Endpoint:** `DELETE /admin/companies/:id`

---

### 3.7 Verify Company

Mark company as KYC verified.

**Endpoint:** `POST /admin/companies/:id/verify`

**Request Body:**
```json
{
  "notes": "All documents verified and approved"
}
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Company verified successfully",
  "data": {
    "_id": "company123...",
    "isKycVerified": true,
    "verifiedAt": "2025-01-15T12:00:00.000Z",
    "verifiedBy": "admin@example.com"
  }
}
```

---

### 3.8 Unverify Company

Remove KYC verification status.

**Endpoint:** `POST /admin/companies/:id/unverify`

---

### 3.9 Approve GST

**Endpoint:** `POST /admin/companies/:id/gst/approve`

---

### 3.10 Clear GST Flag

**Endpoint:** `POST /admin/companies/:id/gst/clear-flag`

---

### 3.11 Get GST Pending Count

**Endpoint:** `GET /admin/companies/gst/pending-count`

---

# 4. KYC Document Review

## Base URL
```
/admin/kyc
```

---

### 4.1 List KYC Documents

Get paginated list of KYC documents for review.

**Endpoint:** `GET /admin/kyc/documents`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page (max 100) |
| search | string | - | Search by company name |
| status | string | - | Filter: `pending`, `approved`, `rejected` |
| documentType | string | - | Filter: `cis`, `passport`, `tax_certificate`, `business_registration`, `other` |
| sortBy | string | `uploadedAt` | Sort field |
| sortOrder | string | `desc` | Sort order: `asc` or `desc` |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "documents": [
      {
        "companyId": "company123...",
        "companyName": "Acme Corp",
        "documentId": "doc123...",
        "documentType": "CIS",
        "fileName": "cis_certificate.pdf",
        "status": "pending",
        "uploadedAt": "2025-01-10T00:00:00.000Z"
      }
    ],
    "total": 45,
    "page": 1,
    "totalPages": 3
  }
}
```

---

### 4.2 Get KYC Stats

**Endpoint:** `GET /admin/kyc/stats`

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "pendingDocuments": 45,
    "approvedDocuments": 350,
    "rejectedDocuments": 25,
    "companiesWithPendingKyc": 30
  }
}
```

---

### 4.3 Get Single Document

**Endpoint:** `GET /admin/kyc/companies/:companyId/documents/:docId`

---

### 4.4 Approve Document

Approve a KYC document.

**Endpoint:** `POST /admin/kyc/companies/:companyId/documents/:docId/approve`

**Request Body:**
```json
{
  "notes": "Document verified against official records"
}
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Document approved",
  "data": {
    "status": "approved",
    "reviewedBy": "admin@example.com",
    "reviewedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

---

### 4.5 Reject Document

Reject a KYC document with reason.

**Endpoint:** `POST /admin/kyc/companies/:companyId/documents/:docId/reject`

**Request Body:**
```json
{
  "notes": "Document is expired. Please upload a valid document."
}
```

---

# 5. Trade Management

## Base URL
```
/admin/trades
```

---

### 5.1 List Trades

Get paginated list of trades with filters.

**Endpoint:** `GET /admin/trades`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search by trade ID, product name |
| negotiationStatus | string | - | Filter: `pending`, `countered`, `buyer_responded`, `accepted`, `rejected`, `cancelled` |
| tradePhase | string | - | Filter: `PR`, `SCO`, `ICPO`, `SPA`, `PAYMENT`, `BOL`, `COMPLETED`, `CANCELLED` |
| buyerId | string | - | Filter by buyer user ID |
| sellerId | string | - | Filter by seller user ID |
| isStalled | boolean | - | Filter stalled trades |
| hasDispute | boolean | - | Filter trades with disputes |
| dateFrom | string | - | Filter by start date (ISO format) |
| dateTo | string | - | Filter by end date (ISO format) |
| minValue | number | - | Filter by minimum trade value |
| maxValue | number | - | Filter by maximum trade value |
| sortBy | string | `updatedAt` | Sort field: `createdAt`, `updatedAt`, `lastPhaseChangeAt` |
| sortOrder | string | `desc` | Sort order: `asc` or `desc` |
| stalledDays | number | 7 | Threshold days for stalled detection |

---

### 5.2 Get Trade Stats

**Endpoint:** `GET /admin/trades/stats`

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "totalTrades": 500,
    "activeTrades": 150,
    "completedTrades": 300,
    "stalledTrades": 25,
    "byPhase": {
      "PR": 50,
      "SCO": 30,
      "ICPO": 20,
      "SPA": 25,
      "PAYMENT": 15,
      "BOL": 10
    }
  }
}
```

---

### 5.3 Get Stalled Trades

Get trades stuck in a phase for more than X days.

**Endpoint:** `GET /admin/trades/stalled`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | number | 7 | Threshold in days |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Stalled trades retrieved successfully",
  "data": {
    "trades": [...],
    "total": 25,
    "threshold": 7
  }
}
```

---

### 5.4 Get Trade by ID

**Endpoint:** `GET /admin/trades/:id`

---

### 5.5 Get Trade Timeline

Get chronological list of all trade events.

**Endpoint:** `GET /admin/trades/:id/timeline`

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "event": "trade_created",
      "timestamp": "2025-01-01T10:00:00.000Z",
      "actor": "buyer@example.com",
      "details": "Purchase request created"
    },
    {
      "event": "counter_offer_sent",
      "timestamp": "2025-01-02T14:00:00.000Z",
      "actor": "seller@example.com",
      "details": "Counter offer: $50,000"
    }
  ]
}
```

---

### 5.6 Get Trade Notes

**Endpoint:** `GET /admin/trades/:id/notes`

---

### 5.7 Add Trade Note

Add admin note to a trade.

**Endpoint:** `POST /admin/trades/:id/notes`

**Request Body:**
```json
{
  "content": "Contacted buyer regarding document delay"
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| content | string | Required, min 3 chars, max 1000 chars |

```

---

### 5.8 Delete Trade Note

**Endpoint:** `DELETE /admin/trades/:id/notes/:noteId`

---

### 5.9 Verify Document

Verify or reject a trade document.

**Endpoint:** `PUT /admin/trades/:id/verify-document`

**Request Body:**
```json
{
  "documentType": "sco",
  "status": "approved",
  "notes": "Document verified successfully"
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| documentType | string | Required, one of: `sco`, `icpo`, `spa`, `bol`, `payment-proof` |
| status | string | Required, one of: `approved`, `rejected` |
| notes | string | Optional, min 5 chars, max 500 chars |

```

---

### 5.10 Force Phase Change

Admin override to change trade phase.

**Endpoint:** `PUT /admin/trades/:id/force-phase`

**Request Body:**
```json
{
  "newPhase": "SPA",
  "reason": "Buyer and seller confirmed agreement offline",
  "notifyParties": true
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| newPhase | string | Required, one of: `PR`, `SCO`, `ICPO`, `SPA`, `PAYMENT`, `BOL`, `COMPLETED`, `CANCELLED` |
| reason | string | Required, min 10 chars, max 500 chars |
| notifyParties | boolean | Optional, whether to notify buyer/seller of the change |

---

### 5.11 Download Document

**Endpoint:** `GET /admin/trades/:id/documents/:type/download`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Trade ID |
| type | string | Document type: `SCO`, `ICPO`, `SPA`, `PAYMENT`, `BOL` |

**Response:** File download with appropriate headers.

---

### 5.12 Send Stalled Trade Reminder

Send reminder email to buyer and/or seller for a stalled trade.

**Endpoint:** `POST /admin/trades/:id/send-reminder`

**Request Body:**
```json
{
  "recipientType": "both",
  "customMessage": "Your trade has been pending for 7 days. Please take action."
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| recipientType | string | Required, one of: `both`, `buyer`, `seller` |
| customMessage | string | Optional, max 500 characters |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Reminder sent to buyer, seller",
  "data": {
    "success": true,
    "sentTo": ["buyer", "seller"]
  }
}
```

---

# 6. Dispute Management

## Base URL
```
/admin/disputes
```

---

### 6.1 List Disputes

**Endpoint:** `GET /admin/disputes`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | - | Filter: `open`, `under_review`, `resolved`, `closed` |
| priority | string | - | Filter: `low`, `medium`, `high`, `urgent` |
| reason | string | - | Filter: `payment_issue`, `quality_issue`, `delivery_delay`, `documentation_problem`, `communication_issue`, `pricing_dispute`, `contract_breach`, `other` |
| assignedTo | string | - | Filter by assigned admin ID |
| unassigned | boolean | - | Filter unassigned disputes |
| tradeId | string | - | Filter by trade ID |
| search | string | - | Search in dispute description |
| dateFrom | string | - | Filter by start date (ISO format) |
| dateTo | string | - | Filter by end date (ISO format) |
| sortBy | string | `createdAt` | Sort field: `createdAt`, `priority`, `status`, `updatedAt` |
| sortOrder | string | `desc` | Sort order: `asc` or `desc` |

---

### 6.2 Get Dispute Stats

**Endpoint:** `GET /admin/disputes/stats`

---

### 6.3 Get Dispute by ID

**Endpoint:** `GET /admin/disputes/:id`

---

### 6.4 Get Dispute Messages

**Endpoint:** `GET /admin/disputes/:id/messages`

---

### 6.5 Assign Dispute

Assign dispute to another admin.

**Endpoint:** `POST /admin/disputes/:id/assign`

**Request Body:**
```json
{
  "adminId": "admin456...",
  "notes": "Assigning to specialist for review"
}
```

---

### 6.6 Self-Assign Dispute

Assign dispute to yourself.

**Endpoint:** `POST /admin/disputes/:id/self-assign`

**Request Body:**
```json
{
  "notes": "Taking over this case"
}
```

---

### 6.7 Update Dispute Status

**Endpoint:** `PATCH /admin/disputes/:id/status`

**Request Body:**
```json
{
  "status": "under_review",
  "notes": "Investigation started"
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| status | string | Required, one of: `open`, `under_review`, `resolved`, `closed` |
| notes | string | Optional, max 500 chars |

```

---

### 6.8 Resolve Dispute

**Endpoint:** `POST /admin/disputes/:id/resolve`

**Request Body:**
```json
{
  "resolutionNotes": "Refund issued to buyer. Seller failed to deliver as agreed."
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| resolutionNotes | string | Required, min 10 chars, max 2000 chars |

```

---

### 6.9 Add Dispute Message

**Endpoint:** `POST /admin/disputes/:id/messages`

**Request Body:**
```json
{
  "content": "We have received your complaint and are investigating.",
  "isInternal": false
}
```

---

# 7. Dashboard

## Base URL
```
/admin/dashboard
```

---

### 7.1 Get Dashboard Stats

**Endpoint:** `GET /admin/dashboard/stats`

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "users": {
      "total": 1500,
      "new": 45,
      "active": 1200
    },
    "trades": {
      "total": 500,
      "active": 150,
      "completed": 300,
      "volume": 5000000
    },
    "companies": {
      "total": 500,
      "verified": 350
    },
    "disputes": {
      "open": 10,
      "inProgress": 5
    }
  }
}
```

---

### 7.2 Get Pending Actions

**Endpoint:** `GET /admin/dashboard/pending-actions`

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "pendingKycDocuments": 45,
    "stalledTrades": 25,
    "openDisputes": 10,
    "unresolvedAlerts": 5
  }
}
```

---

### 7.3 Get Recent Activity

**Endpoint:** `GET /admin/dashboard/activity`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 10 | Number of activities to return |

---

### 7.4 Get Trades by Status

**Endpoint:** `GET /admin/dashboard/trades-by-status`

---

### 7.5 Get Users by Role

**Endpoint:** `GET /admin/dashboard/users-by-role`

---

### 7.6 Get Trade Volume Over Time

**Endpoint:** `GET /admin/dashboard/trade-volume`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| days | number | 30 | Number of days to include |

---

# 8. System Management

## Base URL
```
/admin/system
```

---

### 8.1 Get System Health

**Endpoint:** `GET /admin/system/health`

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "status": "healthy",
    "uptime": 864000,
    "memory": {
      "used": 512,
      "total": 2048,
      "percentage": 25
    },
    "cpu": {
      "usage": 15
    },
    "databases": {
      "mongodb": "connected",
      "redis": "connected"
    }
  }
}
```

---

### 8.2 Get Container Status

**Endpoint:** `GET /admin/system/health/containers`

---

### 8.3 Get Container Logs

**Endpoint:** `GET /admin/system/health/containers/:name/logs`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| lines | number | 100 | Number of log lines |

---

### 8.4 Get Container Details

**Endpoint:** `GET /admin/system/health/containers/:name/details`

---

### 8.5 Restart Container

**Endpoint:** `POST /admin/system/health/containers/:name/restart`

---

### 8.6 Stop Container

**Endpoint:** `POST /admin/system/health/containers/:name/stop`

---

### 8.7 Start Container

**Endpoint:** `POST /admin/system/health/containers/:name/start`

---

### 8.8 Get Disk Usage

**Endpoint:** `GET /admin/system/health/disk`

---

### 8.9 Get Database Stats

**Endpoint:** `GET /admin/system/health/databases`

---

### 8.10 Get Enhanced Database Stats

**Endpoint:** `GET /admin/system/health/databases/stats`

---

### 8.11 Get Maintenance Config

**Endpoint:** `GET /admin/system/maintenance`

---

### 8.12 Update Maintenance Config

Enable or disable maintenance mode.

**Endpoint:** `PUT /admin/system/maintenance`

**Request Body:**
```json
{
  "isEnabled": true,
  "message": "System undergoing scheduled maintenance",
  "estimatedEndTime": "2025-01-15T18:00:00.000Z",
  "allowedIPs": ["192.168.1.1", "10.0.0.1"]
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| isEnabled | boolean | Required |
| message | string | Optional |
| estimatedEndTime | string | Optional, ISO date string |
| allowedIPs | string[] | Optional, array of IP addresses allowed during maintenance |

```

---

### 8.13 Get Maintenance Status

**Endpoint:** `GET /admin/system/maintenance/status`

---

### 8.14 Get SSL Certificates

**Endpoint:** `GET /admin/system/health/ssl`

---

### 8.15 Renew SSL Certificates

**Endpoint:** `POST /admin/system/ssl/renew`

**Request Body:**
```json
{
  "domains": ["example.com", "www.example.com"]
}
```

---

### 8.16 Create Backup

**Endpoint:** `POST /admin/system/actions/backup`

**Request Body:**
```json
{
  "target": "all"
}
```

**Target Options:** `all`, `mongodb`, `postgresql`

---

### 8.17 Rotate Logs

**Endpoint:** `POST /admin/system/actions/rotate-logs`

---

### 8.18 Run Health Check

**Endpoint:** `POST /admin/system/actions/health-check`

---

### 8.19 List Backups

**Endpoint:** `GET /admin/system/backups`

---

### 8.20 Get Backup Storage Info

**Endpoint:** `GET /admin/system/backups/storage`

---

### 8.21 Delete Backup

**Endpoint:** `DELETE /admin/system/backups/:type/:filename`

---

# 9. Content Management

## Base URL
```
/admin/content
```

This module manages platform reference data including currencies, countries, ports, HSN codes, categories, incoterms, and units of measurement.

---

## 9.1 Currencies

### List Currencies
**Endpoint:** `GET /admin/content/currencies`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| search | string | Search by name or code |

### Get Currency by ID
**Endpoint:** `GET /admin/content/currencies/:id`

### Get Currency by Code
**Endpoint:** `GET /admin/content/currencies/code/:code`

### Create Currency
**Endpoint:** `POST /admin/content/currencies`

**Request Body:**
```json
{
  "code": "USD",
  "name": "US Dollar",
  "symbol": "$",
  "symbolPosition": "before",
  "decimalPlaces": 2,
  "isActive": true
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| code | string | Required, 3 characters |
| name | string | Required, max 100 chars |
| symbol | string | Required, max 10 chars |
| symbolPosition | string | Required, one of: `before`, `after` |
| decimalPlaces | number | Optional (default 2), 0-6 |
| isActive | boolean | Optional (default true) |

```

### Update Currency
**Endpoint:** `PATCH /admin/content/currencies/:id`

### Delete Currency
**Endpoint:** `DELETE /admin/content/currencies/:id`

### Seed Default Currencies
**Endpoint:** `POST /admin/content/currencies/seed`

---

## 9.2 Countries

### List Countries
**Endpoint:** `GET /admin/content/countries`

### Get Country by ID
**Endpoint:** `GET /admin/content/countries/:id`

### Create Country
**Endpoint:** `POST /admin/content/countries`

### Update Country
**Endpoint:** `PATCH /admin/content/countries/:id`

### Delete Country
**Endpoint:** `DELETE /admin/content/countries/:id`

### Seed Default Countries
**Endpoint:** `POST /admin/content/countries/seed`

---

## 9.3 Ports

### List Ports
**Endpoint:** `GET /admin/content/ports`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| country | string | Filter by country ID |
| type | string | Filter: `sea`, `air`, `land` |
| search | string | Search by port name |

### Get Port by ID
**Endpoint:** `GET /admin/content/ports/:id`

### Get Ports by Country
**Endpoint:** `GET /admin/content/ports/country/:countryId`

### Create Port
**Endpoint:** `POST /admin/content/ports`

### Update Port
**Endpoint:** `PATCH /admin/content/ports/:id`

### Delete Port
**Endpoint:** `DELETE /admin/content/ports/:id`

### Seed Default Ports
**Endpoint:** `POST /admin/content/ports/seed`

---

## 9.4 HSN Codes

### List HSN Codes
**Endpoint:** `GET /admin/content/hsn-codes`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| search | string | - | Search by code or description |
| category | string | - | Filter by category |
| page | number | 1 | Page number |
| limit | number | 50 | Items per page |

### Get HSN Stats
**Endpoint:** `GET /admin/content/hsn-codes/stats`

### Get HSN Categories
**Endpoint:** `GET /admin/content/hsn-codes/categories`

### Search HSN Codes (Autocomplete)
**Endpoint:** `GET /admin/content/hsn-codes/search`

**Query Parameters:**

| Parameter | Type | Default |
|-----------|------|---------|
| q | string | - |
| limit | number | 20 |

### Get HSN Code by ID
**Endpoint:** `GET /admin/content/hsn-codes/:id`

### Create HSN Code
**Endpoint:** `POST /admin/content/hsn-codes`

### Bulk Import HSN Codes
**Endpoint:** `POST /admin/content/hsn-codes/bulk-import`

**Request Body:**
```json
{
  "data": [
    { "code": "0101", "description": "Live horses", "category": "Animals" }
  ],
  "skipDuplicates": true
}
```

### Update HSN Code
**Endpoint:** `PATCH /admin/content/hsn-codes/:id`

### Delete HSN Code
**Endpoint:** `DELETE /admin/content/hsn-codes/:id`

---

## 9.5 Categories (Product Categories / Commodities)

### List Categories
**Endpoint:** `GET /admin/content/categories`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| rootOnly | boolean | Get only root categories |
| parent | string | Filter by parent category ID |
| isMainstream | boolean | Filter mainstream vs niche |

### Get Category Tree
**Endpoint:** `GET /admin/content/categories/tree`

### Get Categories Grouped by Classification
**Endpoint:** `GET /admin/content/categories/grouped-classification`

### Get Pending User Categories
**Endpoint:** `GET /admin/content/categories/pending`

### Get Pending Categories with Product Details
**Endpoint:** `GET /admin/content/categories/pending-detailed`

### Get Commodity Stats
**Endpoint:** `GET /admin/content/categories/commodity-stats`

### Get Category by ID
**Endpoint:** `GET /admin/content/categories/:id`

### Get Category Children
**Endpoint:** `GET /admin/content/categories/:id/children`

### Create Category
**Endpoint:** `POST /admin/content/categories`

### Update Category
**Endpoint:** `PATCH /admin/content/categories/:id`

### Delete Category
**Endpoint:** `DELETE /admin/content/categories/:id`

### Reorder Category
**Endpoint:** `POST /admin/content/categories/reorder`

### Seed Default Categories
**Endpoint:** `POST /admin/content/categories/seed`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| reset | boolean | Delete all before seeding |
| updateExisting | boolean | Update existing categories |

### Seed Mainstream Classification
**Endpoint:** `POST /admin/content/categories/seed-mainstream`

### Toggle Mainstream Status
**Endpoint:** `POST /admin/content/categories/:id/toggle-mainstream`

**Request Body:**
```json
{
  "isMainstream": false
}
```

### Approve User Category
**Endpoint:** `POST /admin/content/categories/:id/approve`

### Reject User Category
**Endpoint:** `POST /admin/content/categories/:id/reject`

**Request Body:**
```json
{
  "replacementCategoryId": "category123...",
  "rejectionReason": "Category already exists"
}
```

---

## 9.6 Incoterms

### List Incoterms
**Endpoint:** `GET /admin/content/incoterms`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| transportMode | string | Filter: `sea_inland`, `any` |

### Get Incoterm Codes
**Endpoint:** `GET /admin/content/incoterms/codes`

**Success Response:**
```json
{
  "data": ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"]
}
```

### Get Incoterm by Code
**Endpoint:** `GET /admin/content/incoterms/:code`

### Update Incoterm
**Endpoint:** `PATCH /admin/content/incoterms/:code`

> Note: Cannot create or delete incoterms - fixed 11 types

### Seed Default Incoterms
**Endpoint:** `POST /admin/content/incoterms/seed`

### Reset Incoterms to Defaults
**Endpoint:** `POST /admin/content/incoterms/reset`

---

## 9.7 Units of Measurement

### List Units
**Endpoint:** `GET /admin/content/units`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active status |
| type | string | Filter by type: `weight`, `volume`, `length`, etc. |
| search | string | Search by name or code |

### Get Unit Stats
**Endpoint:** `GET /admin/content/units/stats`

### Get Units Grouped by Type
**Endpoint:** `GET /admin/content/units/grouped`

### Get Unit Types
**Endpoint:** `GET /admin/content/units/types`

### Get Unit by ID
**Endpoint:** `GET /admin/content/units/:id`

### Get Unit by Code
**Endpoint:** `GET /admin/content/units/code/:code`

### Create Unit
**Endpoint:** `POST /admin/content/units`

### Seed Default Units
**Endpoint:** `POST /admin/content/units/seed`

### Update Unit
**Endpoint:** `PATCH /admin/content/units/:id`

### Delete Unit
**Endpoint:** `DELETE /admin/content/units/:id`

---

## 9.8 Content Stats Overview

**Endpoint:** `GET /admin/content/stats`

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "currencies": { "total": 150, "active": 145 },
    "countries": { "total": 195, "active": 190 },
    "ports": { "total": 500 },
    "categories": { "total": 250 },
    "hsnCodes": { "total": 12000 },
    "incoterms": { "total": 11 },
    "commodities": { "total": 150, "mainstream": 100, "niche": 50 },
    "units": { "total": 30, "active": 28 }
  }
}
```

---

# 10. Blog Management

## Base URL
```
/admin/blog
```

---

## 10.1 Posts

### List Posts
**Endpoint:** `GET /admin/blog/posts`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| status | string | `draft`, `published`, `submitted`, `approved`, `rejected` |
| category | string | Filter by category |
| author | string | Filter by author ID |
| search | string | Search in title/content |

### Get Blog Stats
**Endpoint:** `GET /admin/blog/stats`

### Check Slug Availability
**Endpoint:** `GET /admin/blog/posts/check-slug`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | Slug to check |
| excludePostId | string | Exclude post from check (for updates) |

### Get Post by ID
**Endpoint:** `GET /admin/blog/posts/:id`

### Create Post
**Endpoint:** `POST /admin/blog/posts`

**RBAC:** `@AdminOrAbove()`

### Update Post
**Endpoint:** `PATCH /admin/blog/posts/:id`

**RBAC:** `@AdminOrAbove()`

### Publish Post
**Endpoint:** `POST /admin/blog/posts/:id/publish`

**RBAC:** `@AdminOrAbove()`

### Unpublish Post
**Endpoint:** `POST /admin/blog/posts/:id/unpublish`

**RBAC:** `@AdminOrAbove()`

### Get Pending Review Posts
**Endpoint:** `GET /admin/blog/posts/pending-review`

**RBAC:** `@AdminOrAbove()`

### Approve Post
**Endpoint:** `POST /admin/blog/posts/:id/approve`

**RBAC:** `@AdminOrAbove()`

### Reject Post
**Endpoint:** `POST /admin/blog/posts/:id/reject`

**RBAC:** `@AdminOrAbove()`

**Request Body:**
```json
{
  "reason": "Content does not meet quality standards"
}
```

### Request Revision
**Endpoint:** `POST /admin/blog/posts/:id/request-revision`

**RBAC:** `@AdminOrAbove()`

**Request Body:**
```json
{
  "notes": "Please improve the introduction section"
}
```

### Toggle Featured
**Endpoint:** `POST /admin/blog/posts/:id/toggle-featured`

### Toggle Pinned
**Endpoint:** `POST /admin/blog/posts/:id/toggle-pinned`

### Update Access Level
**Endpoint:** `PATCH /admin/blog/posts/:id/access-level`

**Request Body:**
```json
{
  "accessLevel": "public"
}
```

**Options:** `public`, `member_only`

### Delete Post
**Endpoint:** `DELETE /admin/blog/posts/:id`

### Restore Deleted Post
**Endpoint:** `POST /admin/blog/posts/:id/restore`

### Upload Image
**Endpoint:** `POST /admin/blog/upload-image`

**RBAC:** `@AdminOrAbove()`

**Content-Type:** `multipart/form-data`

**File Field:** `image`

**Limits:** 5MB max, JPEG/PNG/GIF/WebP only

---

## 10.2 Writers

### List Writers
**Endpoint:** `GET /admin/blog/writers`

### Remove Writer Status
**Endpoint:** `DELETE /admin/blog/writers/:id`

**RBAC:** `@AdminOrAbove()`

---

## 10.3 Invites

### List Writer Invites
**Endpoint:** `GET /admin/blog/invites`

### Create Writer Invite
**Endpoint:** `POST /admin/blog/invites`

**RBAC:** `@AdminOrAbove()`

**Request Body:**
```json
{
  "emailHint": "writer@example.com",
  "adminNote": "Invited industry expert"
}
```

### Revoke Invite
**Endpoint:** `DELETE /admin/blog/invites/:id`

**RBAC:** `@AdminOrAbove()`

---

## 10.4 Comments

### List Comments
**Endpoint:** `GET /admin/blog/comments`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| search | string | Search in content |
| flagged | boolean | Filter flagged comments |
| hidden | boolean | Filter hidden comments |

### Get Comment Stats
**Endpoint:** `GET /admin/blog/comments/stats`

### Update Comment
**Endpoint:** `PATCH /admin/blog/comments/:id`

**RBAC:** `@AdminOrAbove()`

**Request Body:**
```json
{
  "isHidden": true
}
```

### Clear Comment Flags
**Endpoint:** `POST /admin/blog/comments/:id/clear-flags`

**RBAC:** `@AdminOrAbove()`

### Delete Comment
**Endpoint:** `DELETE /admin/blog/comments/:id`

**RBAC:** `@AdminOrAbove()`

---

## 10.5 Analytics

### Get Analytics Overview
**Endpoint:** `GET /admin/blog/analytics/overview`

**Query Parameters:**

| Parameter | Type | Default |
|-----------|------|---------|
| period | string | `30d` |

### Get Post Performance
**Endpoint:** `GET /admin/blog/analytics/posts`

**Query Parameters:**

| Parameter | Type | Default |
|-----------|------|---------|
| period | string | `30d` |
| sort | string | `views` |

### Get Writer Performance
**Endpoint:** `GET /admin/blog/analytics/writers`

### Get Category Performance
**Endpoint:** `GET /admin/blog/analytics/categories`

---

## 10.6 Blog Users

### Get Blog Users Stats
**Endpoint:** `GET /admin/blog/users/stats`

### List Blog Users
**Endpoint:** `GET /admin/blog/users`

### Get Blog User
**Endpoint:** `GET /admin/blog/users/:id`

### Suspend Blog User
**Endpoint:** `PATCH /admin/blog/users/:id/suspend`

### Unsuspend Blog User
**Endpoint:** `PATCH /admin/blog/users/:id/unsuspend`

### Promote to Writer
**Endpoint:** `PATCH /admin/blog/users/:id/promote-writer`

### Revoke Writer Status
**Endpoint:** `PATCH /admin/blog/users/:id/revoke-writer`

### Delete Blog User
**Endpoint:** `DELETE /admin/blog/users/:id`

---

## 10.7 Newsletter Subscribers

### Get Subscriber Stats
**Endpoint:** `GET /admin/blog/subscribers/stats`

### List Subscribers
**Endpoint:** `GET /admin/blog/subscribers`

### Export Subscribers as CSV
**Endpoint:** `GET /admin/blog/subscribers/export`

**RBAC:** `@AdminOrAbove()`

**Response:** CSV file download

### Send Weekly Digest
**Endpoint:** `POST /admin/blog/subscribers/send-digest`

**RBAC:** `@AdminOrAbove()`

### Remove Subscriber
**Endpoint:** `DELETE /admin/blog/subscribers/:id`

**RBAC:** `@AdminOrAbove()`

---

# 11. Admin Analytics

## Base URL
```
/admin/analytics
```

---

### 11.1 Overview Metrics

**Endpoint:** `GET /admin/analytics/overview`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | ISO date string |
| endDate | string | ISO date string |

---

### 11.2 Trade Analytics

**Endpoint:** `GET /admin/analytics/trades`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| startDate | string | - | ISO date string |
| endDate | string | - | ISO date string |
| groupBy | string | `day` | Grouping: `day`, `week`, `month` |

---

### 11.3 User Analytics

**Endpoint:** `GET /admin/analytics/users`

---

### 11.4 Financial Analytics

**Endpoint:** `GET /admin/analytics/financial`

---

### 11.5 Operational Metrics

**Endpoint:** `GET /admin/analytics/operational`

---

### 11.6 Export Analytics

Export analytics data as CSV or PDF.

**Endpoint:** `POST /admin/analytics/export`

**Request Body:**
```json
{
  "type": "csv",
  "section": "all",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

**Type Options:** `csv`, `pdf`

**Section Options:** `all`, `overview`, `trades`, `users`, `financial`

**Response:** File download

---

# 12. Product Management

## Base URL
```
/admin/products
```

---

### 12.1 List Products

**Endpoint:** `GET /admin/products`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| search | string | Search by product name |
| category | string | Filter by category ID |
| isActive | boolean | Filter by active status |
| isDeactivated | boolean | Filter admin-deactivated products |
| isFeatured | boolean | Filter featured products |

---

### 12.2 Get Product Stats

**Endpoint:** `GET /admin/products/stats`

---

### 12.3 Get Categories

**Endpoint:** `GET /admin/products/categories`

---

### 12.4 Get Product by ID

**Endpoint:** `GET /admin/products/:id`

---

### 12.5 Deactivate Product

Admin moderation to deactivate a product.

**Endpoint:** `PUT /admin/products/:id/deactivate`

**Request Body:**
```json
{
  "reason": "Product violates platform guidelines"
}
```

---

### 12.6 Reactivate Product

**Endpoint:** `PUT /admin/products/:id/reactivate`

---

### 12.7 Feature Product

**Endpoint:** `PUT /admin/products/:id/feature`

---

### 12.8 Unfeature Product

**Endpoint:** `PUT /admin/products/:id/unfeature`

---

# 13. Alert Rules

## Base URL
```
/admin/alerts
```

---

### 13.1 List Alert Rules

**Endpoint:** `GET /admin/alerts/rules`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| eventType | string | Filter by event type |
| isEnabled | boolean | Filter by enabled status |

---

### 13.2 Create Alert Rule

**Endpoint:** `POST /admin/alerts/rules`

**Request Body:**
```json
{
  "name": "KYC Pending Threshold Alert",
  "eventType": "KYC_PENDING_THRESHOLD",
  "threshold": 50,
  "timeWindowMinutes": 60,
  "recipients": ["admin@example.com"],
  "cooldownMinutes": 120
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| name | string | Required |
| eventType | enum | Required, one of: `USER_SUSPENDED`, `KYC_PENDING_THRESHOLD`, `TRADE_STALLED`, `FAILED_LOGIN_SPIKE`, `NEW_DISPUTE` |
| threshold | number | Optional, min 1 |
| timeWindowMinutes | number | Optional, min 1 |
| recipients | string[] | Required, array of valid email addresses (min 1) |
| cooldownMinutes | number | Optional, 5-1440 (max 24 hours) |

```

---

### 13.3 Get Alert Rule by ID

**Endpoint:** `GET /admin/alerts/rules/:id`

---

### 13.4 Update Alert Rule

**Endpoint:** `PUT /admin/alerts/rules/:id`

---

### 13.5 Delete Alert Rule

**Endpoint:** `DELETE /admin/alerts/rules/:id`

---

### 13.6 Toggle Alert Rule

**Endpoint:** `PUT /admin/alerts/rules/:id/toggle`

---

### 13.7 Get Alert History

**Endpoint:** `GET /admin/alerts/history`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |
| limit | number | Items per page |
| ruleId | string | Filter by rule |
| eventType | string | Filter by event type |
| emailStatus | string | Filter: `sent`, `failed`, `pending` |
| startDate | string | ISO date string |
| endDate | string | ISO date string |

---

### 13.8 Send Test Alert

**Endpoint:** `POST /admin/alerts/test/:ruleId`

---

# 14. Security

## Base URL
```
/admin/security
```

---

## 14.1 Blocked IPs

### List Blocked IPs

**Endpoint:** `GET /admin/security/blocked-ips`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| isActive | boolean | Filter by active blocks |

---

### Block IP

**Endpoint:** `POST /admin/security/blocked-ips`

**Request Body:**
```json
{
  "ipAddress": "192.168.1.100",
  "reason": "Suspicious activity detected",
  "expiresAt": "2025-02-15T00:00:00.000Z"
}
```

---

### Unblock IP

**Endpoint:** `DELETE /admin/security/blocked-ips/:id`

---

### Check IP Status

**Endpoint:** `GET /admin/security/blocked-ips/check/:ipAddress`

**Success Response:**
```json
{
  "statusCode": 200,
  "data": {
    "ipAddress": "192.168.1.100",
    "isBlocked": true
  }
}
```

---

## 14.2 Failed Logins

### List Failed Logins

**Endpoint:** `GET /admin/security/failed-logins`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Items per page (max 100) |
| email | string | - | Filter by email |
| ipAddress | string | - | Filter by IP |
| reason | enum | - | Filter by failure reason (FailedLoginReason enum) |
| startDate | string | - | ISO date string |
| endDate | string | - | ISO date string |

---

### Get Failed Login Stats

**Endpoint:** `GET /admin/security/failed-logins/stats`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | ISO date string |
| endDate | string | ISO date string |

---

# 15. Activity Logging

## Base URL
```
/admin/activity
```

All admin actions are automatically logged using the `@AdminAction` decorator.

---

### 15.1 List Activity Logs

**Endpoint:** `GET /admin/activity`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| adminId | string | - | Filter by admin |
| actionCategory | string | - | Filter by category |
| action | string | - | Filter by action |
| targetType | string | - | Filter by target type |
| startDate | string | - | ISO date string |
| endDate | string | - | ISO date string |
| search | string | - | Search in description |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "data": [
      {
        "_id": "log123...",
        "adminId": "admin456...",
        "adminEmail": "admin@example.com",
        "action": "user.suspend",
        "actionCategory": "users",
        "targetType": "user",
        "targetId": "user789...",
        "targetIdentifier": "user@example.com",
        "description": "User suspended for ToS violation",
        "metadata": {
          "ipAddress": "192.168.1.1",
          "userAgent": "Mozilla/5.0..."
        },
        "timestamp": "2025-01-15T12:00:00.000Z"
      }
    ],
    "total": 500,
    "page": 1,
    "totalPages": 25
  }
}
```

---

### 15.2 Export Activity Logs

Export logs as CSV file.

**Endpoint:** `GET /admin/activity/export`

**Query Parameters:** Same as List Activity Logs (without pagination)

**Response:** CSV file download

---

### 15.3 Get Activity Log by ID

**Endpoint:** `GET /admin/activity/:id`

---

### 15.4 Get Activity Summary

Get activity counts grouped by category.

**Endpoint:** `GET /admin/activity/summary/by-category`

**Query Parameters:**

| Parameter | Type | Default |
|-----------|------|---------|
| startDate | string | 30 days ago |
| endDate | string | now |

---

### 15.5 Get Recent Activity

Dashboard widget for recent activity.

**Endpoint:** `GET /admin/activity/recent/list`

**Query Parameters:**

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| limit | number | 10 | 50 |

---

# 16. Global Search

## Base URL
```
/admin/search
```

**Authentication:** Required for all endpoints

---

### 16.1 Global Search

Search across users, companies, trades, and products.

**Endpoint:** `GET /admin/search`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | - | Search query (minimum 2 characters) |
| limit | number | 10 | Maximum results to return |
| types | string | - | Comma-separated types to search: `user`, `company`, `trade`, `product` |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Search completed",
  "data": [
    {
      "type": "user",
      "id": "user123...",
      "title": "user@example.com",
      "subtitle": "John Doe",
      "url": "/users/user123...",
      "metadata": {
        "role": "Buyer",
        "createdAt": "2024-12-01T00:00:00.000Z"
      }
    },
    {
      "type": "company",
      "id": "company456...",
      "title": "Acme Corp",
      "subtitle": "info@acme.com",
      "url": "/companies/company456...",
      "metadata": {
        "country": "India",
        "isVerified": true,
        "createdAt": "2024-06-01T00:00:00.000Z"
      }
    },
    {
      "type": "trade",
      "id": "trade789...",
      "title": "TRD-2025-001",
      "subtitle": "Raw Cotton - accepted",
      "url": "/trades/trade789...",
      "metadata": {
        "status": "accepted",
        "quantity": 500,
        "createdAt": "2025-01-10T00:00:00.000Z"
      }
    },
    {
      "type": "product",
      "id": "prod012...",
      "title": "Basmati Rice",
      "subtitle": "Grains",
      "url": "/products/prod012...",
      "metadata": {
        "hsnCode": "1006",
        "category": "Grains",
        "pricePerUnit": 1200,
        "createdAt": "2024-11-15T00:00:00.000Z"
      }
    }
  ]
}
```

**Notes:**
- Results are sorted by relevance (exact matches first), then limited
- Each type is searched up to `ceil(limit / 4)` results, then combined
- Returns empty array if query is less than 2 characters

---

### 16.2 Search Suggestions

Get autocomplete suggestions for the search bar.

**Endpoint:** `GET /admin/search/suggestions`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | - | Search query (minimum 2 characters) |
| limit | number | 5 | Maximum suggestions to return |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Suggestions retrieved",
  "data": [
    "user@example.com",
    "Acme Corp",
    "Basmati Rice"
  ]
}
```

**Notes:**
- Searches user emails, company names, and product names
- Uses prefix matching (starts with the query)
- Returns deduplicated suggestions

---

# 17. Public Content

## Base URL
```
/public/content
```

**Authentication:** Not required (public endpoints), except where noted

These endpoints provide read-only access to admin-managed reference data for the main frontend. The data served here is configured via the Admin Content Management endpoints (`/admin/content/*`).

---

### 17.1 Get Active Currencies

**Endpoint:** `GET /public/content/currencies`

Returns all currencies with `isActive: true`.

---

### 17.2 Get Active Countries

**Endpoint:** `GET /public/content/countries`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| continent | string | Filter: `Africa`, `Asia`, `Europe`, `North America`, `South America`, `Oceania`, `Antarctica` |

Returns all countries with `isActive: true`.

---

### 17.3 Get Incoterms

**Endpoint:** `GET /public/content/incoterms`

Returns all 11 standard Incoterms.

---

### 17.4 Get Incoterm Codes

**Endpoint:** `GET /public/content/incoterms/codes`

Returns incoterm code strings for dropdown use.

**Success Response:**
```json
{
  "statusCode": 200,
  "data": ["EXW", "FCA", "FAS", "FOB", "CFR", "CIF", "CPT", "CIP", "DAP", "DPU", "DDP"]
}
```

---

### 17.5 Get Category Tree

**Endpoint:** `GET /public/content/categories/tree`

Returns category tree structure for navigation and dropdowns.

---

### 17.6 Get Active Categories

**Endpoint:** `GET /public/content/categories`

Returns flat list of active categories.

---

### 17.7 Search HSN Codes

**Endpoint:** `GET /public/content/hsn-codes/search`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | - | Search query |
| limit | number | 20 | Maximum results |

For autocomplete in product forms.

---

### 17.8 Get HSN Categories

**Endpoint:** `GET /public/content/hsn-codes/categories`

Returns all unique HSN code categories for filtering.

---

### 17.9 Get Active Ports

**Endpoint:** `GET /public/content/ports`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| country | string | Filter by country ID |
| type | string | Filter: `sea`, `air`, `land` |

Returns ports with `isActive: true`.

---

### 17.10 Get Active Units

**Endpoint:** `GET /public/content/units`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter: `weight`, `volume`, `count`, `length`, `area` |

Returns units with `isActive: true`.

---

### 17.11 Get Units Grouped by Type

**Endpoint:** `GET /public/content/units/grouped`

Returns all active units grouped by their type.

---

### 17.12 Get Categories Grouped by Classification

**Endpoint:** `GET /public/content/categories/grouped`

**Authentication:** Required (user auth)

Returns categories grouped by mainstream/niche classification. Includes user's pending (unapproved) categories if authenticated.

---

### 17.13 Suggest New Category

**Endpoint:** `POST /public/content/categories/suggest`

**Authentication:** Required (user auth)

Creates a new category with `isActive: false`, pending admin approval. For sellers who cannot find their commodity in the existing list.

**Request Body:**
```json
{
  "name": "Dragon Fruit",
  "parentId": "category123..."
}
```

**Validation Rules:**

| Field | Type | Rules |
|-------|------|-------|
| name | string | Required, 2-100 characters |
| parentId | string | Optional, valid MongoDB ObjectId |

```

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Category suggestion submitted successfully. It will be available after admin approval."
}
```

---

### 17.14 Get Commodity Stats

**Endpoint:** `GET /public/content/categories/commodity-stats`

Returns commodity/category classification statistics.

---

### 17.15 Get Commodities for AI (Internal)

**Endpoint:** `GET /public/content/internal/commodities`

**Authentication:** Not required (internal service-to-service use)

Returns commodities grouped by mainstream/niche classification with aliases for fuzzy matching. Used by the AI server for commodity classification.

---

# Error Handling

All admin endpoints follow consistent error handling:

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid input or validation errors |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions (RBAC) |
| 404 | Not Found - Resource does not exist |
| 423 | Locked - Account locked due to failed login attempts |
| 500 | Internal Server Error - Unexpected server errors |

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

# Activity Logging

All admin actions are automatically logged with the following information:
- Admin ID and email
- Action performed
- Action category
- Target entity (type, ID, identifier)
- Timestamp
- IP address and user agent
- Additional metadata

**Action Categories:**
- `auth` - Login, logout, password changes
- `users` - User management actions
- `companies` - Company management actions
- `kyc` - KYC document review
- `trades` - Trade management actions
- `disputes` - Dispute handling
- `content` - Content management
- `system` - System administration
- `analytics` - Analytics access

---

# Frontend Integration Notes

1. **Authentication Flow:**
   - Call `POST /admin/auth/login` with credentials
   - Store admin info in local state
   - Cookie is automatically sent with subsequent requests
   - Call `GET /admin/auth/me` on app load to validate session

2. **Role-Based UI:**
   - Check `admin.role` from `/admin/auth/me` response
   - Hide/disable UI elements based on role permissions
   - `viewer` role should only see read operations

3. **Real-time Updates:**
   - Use WebSocket connection to `admin` namespace for live updates
   - Subscribe to relevant events (new disputes, stalled trades, etc.)

4. **Activity Awareness:**
   - All actions are logged automatically
   - Consider showing audit trail in relevant views

5. **Session Management:**
   - Sessions expire after 24 hours
   - Implement auto-logout on 401 responses
   - Provide session management UI for power users

---

# Example cURL Requests

### Admin Login
```bash
curl -X POST http://localhost:3001/admin/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "admin@example.com", "password": "SecurePass123"}'
```

### Get Current Admin
```bash
curl -X GET http://localhost:3001/admin/auth/me \
  -b cookies.txt
```

### List Users
```bash
curl -X GET "http://localhost:3001/admin/users?page=1&limit=20&role=Buyer" \
  -b cookies.txt
```

### Suspend User
```bash
curl -X POST http://localhost:3001/admin/users/user123/suspend \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"reason": "Terms of service violation"}'
```

### Approve KYC Document
```bash
curl -X POST http://localhost:3001/admin/kyc/companies/company123/documents/doc456/approve \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"notes": "Document verified"}'
```

### Get System Health
```bash
curl -X GET http://localhost:3001/admin/system/health \
  -b cookies.txt
```

---

# Related Modules

- **User Auth Module:** For regular user authentication (separate from admin)
- **Trade Module:** For trade operations (admin endpoints provide management overlay)
- **Company Module:** For company operations
- **Mail Module:** For email notifications triggered by admin actions

## Related
- [[api/users]] — User management
- [[api/trade]] — Trade oversight
- [[api/company]] — Company management
- [[MOC-API]]
