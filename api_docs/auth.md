# Authentication API

## Overview
The Authentication API handles user session validation, retrieval of user information, logout functionality, and password management (forgot password, reset password, change password). All authentication is cookie-based using signed HTTP-only cookies.

## Base URL
```
/auth
```

## Authentication
Most endpoints use cookie-based authentication via signed cookies named `account`. Some endpoints (forgot-password, reset-password) are public.

---

## Endpoints

### 1. Validate Cookie

Validates the authentication cookie and returns the user's role.

**Endpoint:** `GET /auth/validate-cookie`

**Authentication:** Required (signed cookie)

**Request:**
- No request body required
- Cookie: `account` (signed, HTTP-only)

**Response:**

**Success (200 OK):**
```json
{
  "valid": true,
  "role": "Buyer" | "Seller" | "Seller and Buyer"
}
```

**Error Responses:**

**401 Unauthorized:**
```
"No valid cookie found"
```
or
```
"Invalid or expired cookie"
```
or
```
"User not found"
```

**Implementation Notes:**
- Extracts `userId` from the JWT token
- Populates user's company information
- Returns the role from the associated company

---

### 2. Get Current User Info

Returns the current authenticated user's company ID.

**Endpoint:** `GET /auth/me`

**Authentication:** Required (signed cookie)

**Request:**
- No request body required
- Cookie: `account` (signed, HTTP-only)

**Response:**

**Success (200 OK):**
```json
{
  "companyId": "string"
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "message": "No valid cookie found"
}
```
or
```json
{
  "message": "Invalid or expired cookie"
}
```
or
```json
{
  "message": "No companyId in token"
}
```

**Implementation Notes:**
- Validates the account token
- Extracts and returns the `companyId` from the JWT payload
- Used by frontend to identify the current user's company

---

### 3. Logout

Clears the authentication cookie and logs the user out.

**Endpoint:** `POST /auth/logout`

**Authentication:** None required (clears any existing cookie)

**Request:**
- No request body required

**Response:**

**Success (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Error (500 Internal Server Error):**
```json
{
  "message": "Logout failed"
}
```

**Implementation Notes:**
- Clears the `account` cookie with matching settings (httpOnly, signed, secure, sameSite)
- Cookie is cleared regardless of whether it exists

---

### 4. Forgot Password

Initiates the password reset flow by sending an OTP to the user's email.

**Endpoint:** `POST /auth/forgot-password`

**Authentication:** None required (public endpoint)

**Request Body:**
```json
{
  "email": "string"
}
```

**Validation Rules (ForgotPasswordDto):**
| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| email | string | Required, valid email format | "Email is required!", "Invalid Email address" |

**Response:**

**Success (200 OK):**
```json
{
  "message": "Password reset OTP has been sent to your email."
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "message": "No account found with this email address."
}
```

**500 Internal Server Error:**
```json
{
  "message": "An error occurred while processing your request."
}
```

**Implementation Notes:**
- Generates a 6-digit OTP
- Stores OTP in Redis with 10-minute TTL
- Sets `passwordResetToken` and `passwordResetExpires` on user document
- Sends password reset email via MailService (Sendinblue/SMTP)

---

### 5. Reset Password

Completes the password reset using the OTP received via email.

**Endpoint:** `POST /auth/reset-password`

**Authentication:** None required (public endpoint)

**Request Body:**
```json
{
  "email": "string",
  "otp": "string",
  "newPassword": "string"
}
```

**Validation Rules (ResetPasswordDto):**
| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| email | string | Required, valid email format | "Email is required!", "Invalid Email address" |
| otp | string | Required, exactly 6 characters | "OTP is required!", "OTP must be 6 digits!" |
| newPassword | string | Required, min 8 chars, must contain uppercase, lowercase, number, special char | See password requirements below |

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
  "success": true,
  "message": "Password reset successfully."
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "message": "Invalid or expired OTP. Please check your code and try again."
}
```
or
```json
{
  "message": "Invalid request."
}
```
or
```json
{
  "message": "OTP has expired. Please request a new one."
}
```

**500 Internal Server Error:**
```json
{
  "message": "An error occurred while resetting your password."
}
```

**Implementation Notes:**
- Validates OTP against Redis store
- Checks `passwordResetExpires` timestamp
- Updates password with bcrypt hashing
- Clears password reset token fields after successful reset

---

### 6. Change Password

Allows authenticated users to change their password.

**Endpoint:** `POST /auth/change-password`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Validation Rules (ChangePasswordDto):**
| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| currentPassword | string | Required | "Current password is required!" |
| newPassword | string | Required, min 8 chars, must contain uppercase, lowercase, number, special char | See password requirements below |

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
  "success": true,
  "message": "Password changed successfully."
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "message": "Authentication required."
}
```
or
```json
{
  "message": "Invalid or expired session."
}
```
or
```json
{
  "message": "Invalid session."
}
```

**400 Bad Request:**
```json
{
  "message": "Incorrect current password. Please try again."
}
```
or
```json
{
  "message": "New password must be different from current password."
}
```

**500 Internal Server Error:**
```json
{
  "message": "An error occurred while changing your password."
}
```

**Implementation Notes:**
- Validates current session via cookie
- Verifies current password before allowing change
- Ensures new password is different from current password
- Updates password with bcrypt hashing
- Session remains valid after password change

---

## JWT Token Structure

### Account Token Payload
```typescript
{
  userId: string;      // MongoDB ObjectId of the user
  companyId: string;   // MongoDB ObjectId of the company
  iat: number;         // Issued at timestamp
  exp: number;         // Expiration timestamp
}
```

---

## Cookie Configuration

### Account Cookie
- **Name:** `account`
- **Type:** Signed HTTP-only cookie
- **Expiry:** Configured via `COOKIE_EXPIRY_LOGIN` environment variable (default: 1 hour)
- **Secure:** `true` in production
- **SameSite:** `strict` in production, `none` in development

---

## Error Handling

All endpoints follow a consistent error handling pattern:
- **400 Bad Request:** Invalid input or validation errors
- **401 Unauthorized:** Invalid or missing authentication
- **500 Internal Server Error:** Unexpected server errors

---

## Security Features

### Password Security
- Passwords hashed with bcrypt
- Strong password requirements enforced via validation
- Current password verification before changes

### OTP Security
- 6-digit numeric codes
- 10-minute expiration
- Redis storage with TTL
- Single-use validation

### Cookie Security
- HTTP-only (prevents XSS access)
- Signed (prevents tampering)
- Secure flag in production (HTTPS only)
- SameSite attribute (CSRF prevention)

---

## Frontend Integration Notes

1. **Cookie Management:** Cookies are automatically sent with requests. Frontend doesn't need to manually manage the `account` cookie.

2. **Role-Based Access:** Use the `/auth/validate-cookie` endpoint to determine user role and conditionally render UI elements.

3. **Company Context:** Use `/auth/me` to get the current user's company ID for other API calls.

4. **Session Validation:** Call `/auth/validate-cookie` on app initialization to verify if the user is authenticated.

5. **Password Reset Flow:**
   - Call `/auth/forgot-password` with email
   - User receives OTP via email
   - Call `/auth/reset-password` with email, OTP, and new password

6. **Password Change Flow:**
   - User must be authenticated
   - Call `/auth/change-password` with current and new password

---

## Example Requests

### Validate Cookie
```bash
curl -X GET http://localhost:3001/auth/validate-cookie \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Current User
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Cookie: account=s%3A<signed-token>"
```

### Logout
```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Cookie: account=s%3A<signed-token>"
```

### Forgot Password
```bash
curl -X POST http://localhost:3001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:3001/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "NewSecure@123"
  }'
```

### Change Password
```bash
curl -X POST http://localhost:3001/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "currentPassword": "OldPassword@123",
    "newPassword": "NewPassword@456"
  }'
```

---

## Related Modules
- **Login Module:** For initial authentication and cookie creation
- **Onboarding Module:** For user registration and account setup
- **Users Module:** For user-specific data
- **Mail Module:** For OTP email delivery
