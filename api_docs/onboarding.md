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
"OTP sent successfully to user@example.com"
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "User with this email already exists"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to send OTP. Please try again."
}
```

**Implementation Notes:**
- Checks if email already exists in database
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
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
Returns the onboarding JWT token as a string.

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid or expired OTP."
}
```

**Implementation Notes:**
- Validates OTP against Redis store
- Returns a temporary onboarding token
- This token is used for subsequent onboarding steps
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
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```
Returns the decoded token payload.

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
  "data": {
    "AccountToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "string",
      "email": "string"
    },
    "company": {
      "_id": "string",
      "onboardingProgress": 1
    }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Passwords do not match"
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
- Creates user record with hashed password
- Creates company record linked to user
- Sets `onboardingProgress` to 1
- Returns account token for subsequent steps

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
```json
{
  "userId": "string",
  "companyId": "string",
  "iat": 1234567890,
  "exp": 1234567890
}
```
Returns the decoded payload or userId.

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
  "data": {
    "AccountToken": "string",
    "user": { ... },
    "company": { ... }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Failed to verify password."
}
```

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
    "onboardingProgress": 2
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
- Updates `onboardingProgress` to 2
- All fields are mandatory

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
    "onboardingProgress": 3
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
- Updates `onboardingProgress` to 3
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
    "onboardingProgress": 4
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
- Updates `onboardingProgress` to 4
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
    "onboardingProgress": 5,
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
- Sets `onboardingProgress` to 5
- Sets `isOnboardingCompleted` to `true`
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
