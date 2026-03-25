---
type: api-doc
module: onboarding
tags: [api, onboarding]
---

# Onboarding API

## Overview
The Onboarding API manages the complete user registration process through a multi-step wizard. It handles email verification, password setup, and company profile creation in 5 distinct steps.

## Base URL
```
/onboarding
```

## Authentication
- **Steps 1-3 (OTP flow):** Use onboarding JWT token passed in `Authorization` header
- **Steps 4-9 (Company setup):** Use account JWT token passed in `Authorization` header

---

## Onboarding Flow

```
Step 1: Send OTP ──> Verify OTP ──> Set Password
                                        │
                                        ▼
Step 2: Company Info ──> Step 3: Business Info ──> Step 4: Additional Details ──> Step 5: Select Role
                                                                                            │
                                                                                            ▼
                                                                                       Complete
```

---

## Endpoints

### 1. Send Email OTP

Sends a 6-digit OTP to the provided email address.

**Endpoint:** `POST /onboarding/send-otp`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string"
}
```

**Validation Rules (SendEmailOtpDto):**

| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| email | string | Required, valid email format | "Email is required!", "Invalid Email address" |

**Response:**

**Success (200 OK):**
```json
"Otp has been sent to your email"
```

**Error Responses:**

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to send otp!"
}
```

**Implementation Notes:**
- Does NOT check if email already exists (duplicate handling is in verify-otp)
- Generates 6-digit OTP
- Stores OTP in Redis with 10-minute TTL
- Sends OTP via email (Sendinblue/SMTP)

---

### 2. Verify Email OTP

Verifies the OTP and generates an onboarding token.

**Endpoint:** `POST /onboarding/verify-otp`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string",
  "otp": "string"
}
```

**Validation Rules (VerifyEmailOtpDto):**

| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| email | string | Required, valid email format | "Email is required!", "Invalid Email address" |
| otp | string | Required, exactly 6 characters | "Otp is required!", "Otp Must be a String!", "Otp me must be 6 digit!" |

**Response:**

**Success (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "onboardingStatus": "false" | true | false
}
```
Returns an object with the onboarding JWT token and the onboarding status:
- `onboardingStatus: "false"` (string) — new user or orphan cleanup occurred, proceed to set-password
- `onboardingStatus: true` (boolean) — existing user with completed onboarding, proceed to continue-onboarding
- `onboardingStatus: false` (boolean) — existing user with incomplete onboarding (orphan cleanup triggered, returns fresh start)

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid or expired OTP. Please check your code and try again."
}
```

**Implementation Notes:**
- Validates OTP against Redis store
- Checks if user already exists with this email
- **Orphan cleanup logic:** If user exists but onboarding was never completed (`isOnboardingCompleted === false`), the orphan user and company records are deleted and a fresh start token is returned. This prevents users from getting stuck with incomplete registrations.
- **Edge case cleanup:** If user exists without a valid company reference, the orphan user is deleted and a fresh start is given.
- If user exists with completed onboarding, the token contains `userId` (for continue-onboarding flow)
- If user is new, the token contains `mail` (for set-password flow)
- Token should be stored and sent in `Authorization` header

---

### 3. Validate Onboarding Token

Validates the onboarding token.

**Endpoint:** `POST /onboarding/validate-token`

**Authentication:** Required (onboarding token)

**Headers:**
```
Authorization: Bearer <onboarding_token>
```

**Request Body:** None

**Response:**

**Success (200 OK):**
```json
{
  "status": "accountExists"
}
```
or
```json
{
  "status": "createAccount"
}
```
Returns an object with `status` indicating whether the token belongs to an existing user (`accountExists` — token contains `userId`) or a new user (`createAccount` — token contains `mail`).

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid or expired token"
}
```

---

### 4. Set Password

Sets the user's password after OTP verification. Creates the user and company records.

**Endpoint:** `POST /onboarding/set-password`

**Authentication:** Required (onboarding token)

**Headers:**
```
Authorization: Bearer <onboarding_token>
```

**Request Body:**
```json
{
  "setPassword": "string",
  "confirmPassword": "string"
}
```

**Validation Rules (SetPasswordDto):**

| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| setPassword | string | Required, min 8 chars, complexity requirements | "Password is required!", "Password must be a String!", "Password must be atleast 8 characters long!", complexity message |
| confirmPassword | string | Required, min 8 chars, complexity requirements | "Password is required!", "Confirm Password must be a String!", "Confirm Password must be atleast 8 characters long!", complexity message |

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*(),.?":{}|<>)

**Response:**

**Success (200 OK):**
```json
{
  "message": "Onboarding continued successfully",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
The `data` field contains the account JWT token as a plain string (not an object).

**Error Responses:**

**400 Bad Request — Passwords don't match:**
```json
{
  "statusCode": 400,
  "message": "Set passwords and confirm passwords don't match"
}
```

**400 Bad Request — Account already exists:**
```json
{
  "statusCode": 400,
  "message": "Account already exists!"
}
```

**400 Bad Request — Invalid token:**
```json
{
  "statusCode": 400,
  "message": "Invalid or expired onboarding token"
}
```

**404 Not Found — Email not in token:**
```json
{
  "statusCode": 404,
  "message": "Please Verify your email through otp first!"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to set password."
}
```

**Implementation Notes:**
- Decodes the onboarding token and extracts `mail` from payload
- Checks if a user already exists with that email (throws 400 if so)
- Creates user record with bcrypt-hashed password
- Creates company record linked to user with `onboardingExpiresAt` set to 7 days (TTL for orphan cleanup)
- Does NOT set `onboardingProgress` (remains at default 0)
- If user creation fails, rolls back by deleting the orphan company record
- Returns account JWT token for subsequent steps

---

### 5. Validate Account Token

Validates the account JWT token.

**Endpoint:** `POST /onboarding/validate-account-token`

**Authentication:** Required (account token)

**Headers:**
```
Authorization: Bearer <account_token>
```

**Request Body:** None

**Response:**

**Success (200 OK):**
Returns just the `userId` string extracted from the decoded token, not the full payload.
```json
"64f1a0b2c3d4e5f6g7h8i9j0"
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid or expired token"
}
```

---

### 6. Continue Onboarding

Continues the onboarding process after setting password (alternative flow).

**Endpoint:** `POST /onboarding/continue-onboarding`

**Authentication:** Required (onboarding token)

**Headers:**
```
Authorization: Bearer <onboarding_token>
```

**Request Body:**
```json
{
  "password": "string"
}
```

**Validation Rules (continueOnboardingDto):**

| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| password | string | Required, must be string | "Password is required!", "Password must be a String" |

**Response:**

**Success (200 OK):**
```json
{
  "message": "Onboarding continued successfully",
  "data": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
The `data` field contains the account JWT token as a plain string (not an object).

**Error Responses:**

**400 Bad Request — Invalid token payload:**
```json
{
  "statusCode": 400,
  "message": "Invalid token payload"
}
```

**400 Bad Request — Wrong password:**
```json
{
  "statusCode": 400,
  "message": "Incorrect password. Please try again."
}
```

**404 Not Found — User not found:**
```json
{
  "statusCode": 404,
  "message": "User not found"
}
```

**400 Bad Request — General failure:**
```json
{
  "statusCode": 400,
  "message": "Failed to verify password."
}
```

**Implementation Notes:**
- Decodes the onboarding token and extracts `userId` from payload
- Validates that the token payload contains `userId` (throws 400 if not)
- Looks up the user and populates company
- Compares provided password against stored bcrypt hash
- Returns account JWT token (not user/company objects)

---

### 7. Step 2: Company Information

Collects basic company information.

**Endpoint:** `POST /onboarding/step-2`

**Authentication:** Required (account token)

**Headers:**
```
Authorization: Bearer <account_token>
```

**Request Body:**
```json
{
  "companyName": "string",
  "companyAddress": "string",
  "country": "string",
  "companyMobile": "string",
  "taxId": "string"
}
```

**Validation Rules (Step2Dto):**

| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| companyName | string | Required | Default class-validator message |
| companyAddress | string | Required | Default class-validator message |
| country | string | Required | Default class-validator message |
| companyMobile | string | Required | Default class-validator message |
| taxId | string | Required (e.g., GST number) | Default class-validator message |

**Response:**

**Success (200 OK):**
```json
{
  "message": "Step 2 completed successfully",
  "data": {
    "_id": "string",
    "companyName": "string",
    "companyAddress": "string",
    "country": "string",
    "companyMobile": "string",
    "taxId": "string",
    "gstVerificationMessage": "GST verified successfully"
  }
}
```
> **Note:** The response includes `gstVerificationMessage` if GST verification was attempted. The response does NOT include `onboardingProgress` — the code has a TODO to update it but currently does not.

**Error Responses:**

**400 Bad Request — Invalid GST format:**
```json
{
  "statusCode": 400,
  "message": "Invalid GST format: must be 15 characters alphanumeric"
}
```

**400 Bad Request — GST not found:**
```json
{
  "statusCode": 400,
  "message": "GST number not found in government records. Please verify and try again."
}
```

**400 Bad Request — GST inactive:**
```json
{
  "statusCode": 400,
  "message": "GST registration is [status]. Only active registrations are accepted."
}
```

**400 Bad Request — Company name mismatch:**
```json
{
  "statusCode": 400,
  "message": "Company name does not match GST records. GST registered to: [legal_name]"
}
```

**400 Bad Request — Duplicate taxId:**
```json
{
  "statusCode": 400,
  "message": "A company with this tax ID already exists"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "error message"
}
```

**Implementation Notes:**
- Does NOT update `onboardingProgress` (TODO in code)
- All fields are mandatory
- **GST Verification (Indian companies):** If `country` is "India", validates GST format, verifies via Cashfree API, checks company name match against government records. Stores `gstVerified`, `gstVerifiedAt`, `gstVerificationData` on the company. If verification fails non-critically, sets `gstPendingManualReview: true`
- Depends on `GstService` for Cashfree GST API integration

---

### 8. Step 3: Business Information

Collects business line and revenue information.

**Endpoint:** `POST /onboarding/step-3`

**Authentication:** Required (account token)

**Headers:**
```
Authorization: Bearer <account_token>
```

**Request Body:**
```json
{
  "mainLineBusiness": ["string", "string"],
  "meanMonthlyRevenue": "enum"
}
```

**Validation Rules (Step3Dto):**

| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| mainLineBusiness | string[] | Required, array not empty, each item must be string | "At least one option must be selected", "Each option must be a string" |
| meanMonthlyRevenue | enum | Required, must be one of enum values | Default class-validator message |

**Mean Monthly Revenue Enum:**

| Value | Description |
|-------|-------------|
| `"Less than 1k Dollar"` | Revenue below $1,000 |
| `"1k Dollars - 10k Dollars"` | Revenue $1,000 - $10,000 |
| `"10k Dollars - 100k Dollars"` | Revenue $10,000 - $100,000 |
| `"100k Dollars - 1000k Dollars"` | Revenue $100,000 - $1,000,000 |
| `"More than 1000k Dollars"` | Revenue above $1,000,000 |

**Response:**

**Success (200 OK):**
```json
{
  "message": "Step 3 completed successfully",
  "data": {
    "_id": "string",
    "mainLineBusiness": ["Agriculture", "Manufacturing"],
    "meanMonthlyRevenue": "10k Dollars - 100k Dollars",
    "meanMonthlyRevenue": "10k Dollars - 100k Dollars"
  }
}
```
> **Note:** The response does NOT include `onboardingProgress` — the code has a TODO to update it but currently does not.

**Error Responses:**

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "error message"
}
```

**Implementation Notes:**
- Does NOT update `onboardingProgress` (TODO in code)
- `mainLineBusiness` must have at least one item

---

### 9. Step 4: Additional Details

Collects website, founder, and export information.

**Endpoint:** `POST /onboarding/step-4`

**Authentication:** Required (account token)

**Headers:**
```
Authorization: Bearer <account_token>
```

**Request Body:**
```json
{
  "websiteUrl": "string",
  "founderName": "string",
  "exportedBefore": true,
  "referrel": "string"
}
```

**Validation Rules (Step4Dto):**

| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| websiteUrl | string | Optional (can be empty) | Default class-validator message |
| founderName | string | Required | Default class-validator message |
| exportedBefore | boolean | Required | Default class-validator message |
| referrel | string | Required (how they heard about us) | Default class-validator message |

**Response:**

**Success (200 OK):**
```json
{
  "message": "Step 4 completed successfully",
  "data": {
    "_id": "string",
    "websiteUrl": "https://example.com",
    "founderName": "John Doe",
    "exportedBefore": true,
    "referrel": "Google Search",
    "referrel": "Google Search"
  }
}
```
> **Note:** The response does NOT include `onboardingProgress` — the code has a TODO to update it but currently does not.

**Error Responses:**

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "error message"
}
```

**Implementation Notes:**
- Does NOT update `onboardingProgress` (TODO in code)
- `websiteUrl` is optional (empty string allowed)

---

### 10. Step 5: Select Role

Selects the company's role (Buyer/Seller/Both). Final step of onboarding.

**Endpoint:** `POST /onboarding/step-5`

**Authentication:** Required (account token)

**Headers:**
```
Authorization: Bearer <account_token>
```

**Request Body:**
```json
{
  "role": "enum"
}
```

**Validation Rules (Step5Dto):**

| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| role | enum | Required, must be one of enum values | Default class-validator message |

**Role Enum:**

| Value | Description |
|-------|-------------|
| `"Buyer"` | User is a buyer/importer |
| `"Seller"` | User is a seller/exporter |
| `"Seller and Buyer"` | User is both |

**Response:**

**Success (200 OK):**
```json
{
  "message": "Step 5 completed successfully",
  "data": {
    "_id": "string",
    "role": "Buyer",
    "isOnboardingCompleted": true
  }
}
```

**Error Responses:**

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "error message"
}
```

**Implementation Notes:**
- This is the final step of onboarding
- Sets `isOnboardingCompleted` to `true`
- Does NOT explicitly set `onboardingProgress` to 5
- Clears `onboardingExpiresAt` (removes TTL orphan cleanup)
- **Sends welcome email** via email service
- **Creates onboarding_completed notification** via `MiscNotificationService`
- User is now ready to use the platform

---

### 11. Get Onboarding Progress

Retrieves the current onboarding progress and details.

**Endpoint:** `POST /onboarding/get-onboarding-progress-details`

**Authentication:** Required (account token)

**Headers:**
```
Authorization: Bearer <account_token>
```

**Request Body:** None

**Response:**

**Success (200 OK):**
```json
{
  "message": "Onboarding progress retrieved successfully",
  "company": {
    "_id": "string",
    "onboardingProgress": 3,
    "isOnboardingCompleted": false,
    "companyName": "Example Corp",
    "companyAddress": "123 Main St",
    "country": "India",
    "companyMobile": "+919876543210",
    "taxId": "GST123456789",
    "mainLineBusiness": ["Agriculture"],
    "meanMonthlyRevenue": "10k Dollars - 100k Dollars",
    "websiteUrl": "",
    "founderName": "",
    "exportedBefore": false,
    "referrel": "",
    "role": null
  }
}
```

**Error Responses:**

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "error message"
}
```

**Implementation Notes:**
- Use this to determine which step to show the user
- If `isOnboardingCompleted` is `true`, redirect to main app
- The `onboardingProgress` value (0-5) indicates the last completed step

---

## Data Transfer Objects (DTOs)

### SendEmailOtpDto
```typescript
{
  email: string;  // Valid email format, required
}
```

### VerifyEmailOtpDto
```typescript
{
  email: string;  // Valid email format, required
  otp: string;    // Exactly 6 characters, required
}
```

### SetPasswordDto
```typescript
{
  setPassword: string;      // Min 8 chars, complexity requirements, required
  confirmPassword: string;  // Min 8 chars, complexity requirements, required
}
```

### continueOnboardingDto
```typescript
{
  password: string;  // Required string
}
```

### Step2Dto
```typescript
{
  companyName: string;     // Required
  companyAddress: string;  // Required
  country: string;         // Required
  companyMobile: string;   // Required
  taxId: string;           // Required
}
```

### Step3Dto
```typescript
{
  mainLineBusiness: string[];           // At least one item, required
  meanMonthlyRevenue: MeanMonthlyRevenue;  // Enum value, required
}
```

### Step4Dto
```typescript
{
  websiteUrl: string;       // Optional (can be empty)
  founderName: string;      // Required
  exportedBefore: boolean;  // Required
  referrel: string;         // Required
}
```

### Step5Dto
```typescript
{
  role: Role;  // "Buyer" | "Seller" | "Seller and Buyer", required
}
```

---

## Enums

### MeanMonthlyRevenue
```typescript
enum MeanMonthlyRevenue {
  LessThanoneK = 'Less than 1k Dollar',
  one_k_to_ten_k = '1k Dollars - 10k Dollars',
  ten_k_to_hundred_k = '10k Dollars - 100k Dollars',
  hundred_k_to_thousand_k = '100k Dollars - 1000k Dollars',
  MoreThan1000k = 'More than 1000k Dollars',
}
```

### Role
```typescript
enum Role {
  BUYER = 'Buyer',
  SELLER = 'Seller',
  BOTH = 'Seller and Buyer',
}
```

---

## Onboarding State Management

### Company Schema Fields
```typescript
{
  onboardingProgress: number;        // 0-5, tracks current step
  isOnboardingCompleted: boolean;    // true when all steps done
  companyName: string;
  companyAddress: string;
  country: string;
  companyMobile: string;
  taxId: string;
  mainLineBusiness: string[];
  meanMonthlyRevenue: string;
  websiteUrl: string;
  founderName: string;
  exportedBefore: boolean;
  referrel: string;
  role: string;
}
```

### Progress Values

| Progress | Step | Description |
|----------|------|-------------|
| 0 | Initial | Account not yet created |
| 1 | Password Set | User/Company created, password set |
| 2 | Company Info | Basic company information collected |
| 3 | Business Info | Business lines and revenue collected |
| 4 | Additional | Website, founder, export info collected |
| 5 | Complete | Role selected, onboarding complete |

---

## Frontend Integration Notes

1. **Step-by-Step Flow:**
   - Always check `onboardingProgress` to determine current step
   - Use `/get-onboarding-progress-details` on app load
   - Show appropriate step based on progress value

2. **Token Management:**
   - Store onboarding token after `/verify-otp`
   - Switch to account token after `/set-password`
   - Send token in `Authorization: Bearer <token>` header

3. **Form Validation:**
   - Implement client-side validation matching DTO requirements
   - Display server validation errors to users
   - Highlight required fields

4. **Progress Indicator:**
   - Show visual progress (e.g., "Step 2 of 5")
   - Allow users to go back to previous steps if needed
   - Store partial progress on each step completion

5. **Error Handling:**
   - Handle network errors gracefully
   - Allow users to retry failed steps
   - Don't lose form data on errors

6. **Redirect Logic:**
   ```typescript
   const { company } = await getOnboardingProgress();

   if (company.isOnboardingCompleted) {
     // Redirect to main app based on role
     if (company.role === 'Buyer') {
       navigate('/buyer/homepage');
     } else {
       navigate('/seller/dashboard');
     }
   } else {
     // Redirect to appropriate onboarding step
     navigate(`/onboarding/step-${company.onboardingProgress + 1}`);
   }
   ```

---

## Example Requests

### Send OTP
```bash
curl -X POST http://localhost:3001/onboarding/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:3001/onboarding/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

### Validate Token
```bash
curl -X POST http://localhost:3001/onboarding/validate-token \
  -H "Authorization: Bearer <onboarding_token>"
```

### Set Password
```bash
curl -X POST http://localhost:3001/onboarding/set-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <onboarding_token>" \
  -d '{
    "setPassword": "SecurePass@123",
    "confirmPassword": "SecurePass@123"
  }'
```

### Step 2: Company Info
```bash
curl -X POST http://localhost:3001/onboarding/step-2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <account_token>" \
  -d '{
    "companyName": "Example Corp",
    "companyAddress": "123 Main St, Mumbai",
    "country": "India",
    "companyMobile": "+919876543210",
    "taxId": "GST123456789"
  }'
```

### Step 3: Business Info
```bash
curl -X POST http://localhost:3001/onboarding/step-3 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <account_token>" \
  -d '{
    "mainLineBusiness": ["Agriculture", "Manufacturing"],
    "meanMonthlyRevenue": "10k Dollars - 100k Dollars"
  }'
```

### Step 4: Additional Details
```bash
curl -X POST http://localhost:3001/onboarding/step-4 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <account_token>" \
  -d '{
    "websiteUrl": "https://example.com",
    "founderName": "John Doe",
    "exportedBefore": true,
    "referrel": "Google Search"
  }'
```

### Step 5: Select Role
```bash
curl -X POST http://localhost:3001/onboarding/step-5 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <account_token>" \
  -d '{
    "role": "Buyer"
  }'
```

### Get Progress
```bash
curl -X POST http://localhost:3001/onboarding/get-onboarding-progress-details \
  -H "Authorization: Bearer <account_token>"
```

---

## Related Modules
- **Auth Module:** For session management after onboarding
- **Login Module:** For returning users
- **Company Module:** Company data is populated during onboarding
- **Users Module:** User account created during onboarding
- **Mail Module:** For sending OTP emails
- **GST Module:** For GST verification via Cashfree API (Step 2)
- **MiscNotificationService:** For welcome email and onboarding_completed notification (Step 5)

## Related
- [[api/company]] — Company setup
- [[api/auth]] — Registration
- [[MOC-API]]
