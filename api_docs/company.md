# Company API

## Overview
The Company API manages company-specific data, including delivery address management and company profile operations. Delivery addresses are used during trade creation for shipping information.

## Base URL
```
/company
```

## Authentication
All endpoints require authentication via signed cookie.

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
    "_id": "string",
    "companyName": "string",
    "companyAddress": "string",
    "companyMobile": "string",
    "taxId": "string",
    "role": "Buyer" | "Seller" | "Seller and Buyer",
    "isVerified": true,
    "tradeType": "international" | "domestic",
    "founderName": "string",
    "websiteUrl": "string",
    "exportedBefore": true,
    "referrel": "string",
    "mainLineBusiness": ["string"],
    "meanMonthlyRevenue": "string",
    "onboardingProgress": 4,
    "isOnboardingCompleted": true,
    "deliveryAddresses": [...],
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
  "mainLineBusiness": ["string"],
  "meanMonthlyRevenue": "string"
}
```

All fields are optional. Only provided fields will be updated.

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Company profile updated successfully",
  "data": {
    "_id": "string",
    "companyName": "string",
    "companyAddress": "string",
    ...
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
    "websiteUrl": "https://acme.com"
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
   - Some fields like `role`, `isVerified` should be read-only

3. **Address Selection During Trade:**
   - Fetch addresses via GET endpoint
   - Display as selectable cards
   - Allow adding new address inline

---

## Related Modules
- **Trade Module:** Uses delivery addresses for trade creation
- **Onboarding Module:** Company profile created during onboarding
- **Auth Module:** Company ID extracted from auth token
- **Users Module:** Users are associated with companies
