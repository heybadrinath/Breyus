# Login API

## Overview
The Login API handles user authentication through a two-factor flow: email/password verification followed by OTP validation. It manages session creation via signed HTTP-only cookies.

## Base URL
```
/login
```

---

## Endpoints

### 1. Login with Email and Password

Initiates the login process by verifying credentials and sending an OTP to the user's email.

**Endpoint:** `POST /login`

**Authentication:** Not required

**Request Body:**
```json
{
  "mail": "string",
  "password": "string"
}
```

**Validation Rules (loginDto):**
| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| mail | string | Required, valid email format | "Email is required!", "Invalid Email address" |
| password | string | Required, must be string | "Password is required!", "Password must be a String!" |

**Response:**

**Success (200 OK):**
```json
true
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "No account found with this email. Please sign up first."
}
```
or
```json
{
  "statusCode": 400,
  "message": "Incorrect password. Please try again."
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to send otp!"
}
```
or
```json
{
  "statusCode": 500,
  "message": "An unexpected error occurred. Please try again."
}
```

**Implementation Notes:**
- Validates user exists in database by email
- Verifies password using bcrypt comparison
- Generates 6-digit OTP
- Stores OTP in Redis with 10-minute TTL
- Sends OTP via email (Sendinblue/SMTP)
- Returns `true` on successful OTP transmission

---

### 2. Validate OTP

Validates the OTP and creates an authenticated session by setting a cookie.

**Endpoint:** `POST /login/validate-otp`

**Authentication:** Not required

**Request Body:**
```json
{
  "mail": "string",
  "otp": "string"
}
```

**Validation Rules (otpDto):**
| Field | Type | Rules | Error Messages |
|-------|------|-------|----------------|
| mail | string | Required, valid email format | "Email is required!", "Invalid Email address" |
| otp | string | Required, exactly 6 characters | "Otp is required!", "Otp Must be a String!", "Otp me must be 6 digit!" |

**Response:**

**Success (200 OK):**
```json
{
  "AccountToken": "string",
  "role": "Buyer" | "Seller" | "Seller and Buyer"
}
```

**Set-Cookie Header:**
```
account=<JWT_TOKEN>; HttpOnly; Secure; SameSite=Strict/None; Max-Age=<configured_expiry>; Signed
```

**Cookie Configuration:**
| Setting | Value |
|---------|-------|
| Name | `account` |
| HttpOnly | `true` (prevents JavaScript access) |
| MaxAge | Value from `COOKIE_EXPIRY_LOGIN` env variable (default: 3,600,000 ms = 1 hour) |
| Signed | `true` (cookie signature verification) |
| Secure | `true` in production or always `true` |
| SameSite | `strict` in production, `none` in development |

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "No account found with this email. Please sign up first."
}
```
or
```json
{
  "statusCode": 400,
  "message": "Invalid or expired OTP. Please check your code and try again."
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "An unexpected error occurred. Please try again."
}
```

**Implementation Notes:**
- Validates user exists in database
- Validates OTP against Redis store
- Generates JWT account token with `{ userId, companyId }`
- Sets token as HTTP-only signed cookie
- Returns token and user role in response body

---

## Data Transfer Objects (DTOs)

### loginDto
```typescript
{
  mail: string;      // Email address (required, valid email)
  password: string;  // Password (required)
}
```

### otpDto
```typescript
{
  mail: string;  // Email address (required, valid email)
  otp: string;   // 6-digit OTP (required, exactly 6 chars)
}
```

---

## Authentication Flow

```
┌─────────┐      ┌──────────┐      ┌───────────┐      ┌─────────────┐      ┌──────────┐
│  User   │      │ Frontend │      │ Login API │      │ Mail Service│      │ Database │
└────┬────┘      └────┬─────┘      └─────┬─────┘      └──────┬──────┘      └────┬─────┘
     │                │                   │                   │                  │
     │ Enter email    │                   │                   │                  │
     │ & password     │                   │                   │                  │
     │───────────────>│                   │                   │                  │
     │                │ POST /login       │                   │                  │
     │                │──────────────────>│                   │                  │
     │                │                   │ Validate creds    │                  │
     │                │                   │─────────────────────────────────────>│
     │                │                   │<─────────────────────────────────────│
     │                │                   │ Valid             │                  │
     │                │                   │                   │                  │
     │                │                   │ Generate & store OTP                 │
     │                │                   │──────────────────>│                  │
     │                │                   │                   │                  │
     │<───────────────────────────────────────────────────────│ Email with OTP   │
     │                │                   │                   │                  │
     │                │<──────────────────│ true              │                  │
     │                │                   │                   │                  │
     │ Enter OTP      │                   │                   │                  │
     │───────────────>│                   │                   │                  │
     │                │ POST /validate-otp│                   │                  │
     │                │──────────────────>│                   │                  │
     │                │                   │ Validate OTP      │                  │
     │                │                   │──────────────────>│                  │
     │                │                   │<──────────────────│ Valid            │
     │                │                   │                   │                  │
     │                │                   │ Generate JWT      │                  │
     │                │<──────────────────│ + Set Cookie      │                  │
     │                │                   │                   │                  │
```

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

## Error Handling

| Status Code | Error Message | Cause |
|-------------|---------------|-------|
| 400 | "No account found with this email. Please sign up first." | Email not registered |
| 400 | "Incorrect password. Please try again." | Wrong password |
| 400 | "Invalid or expired OTP. Please check your code and try again." | OTP validation failed |
| 500 | "Failed to send otp!" | Email service error |
| 500 | "An unexpected error occurred. Please try again." | Unexpected server error |

---

## Security Considerations

1. **Password Verification:** Uses bcrypt for secure password comparison
2. **OTP Security:**
   - 6-digit numeric codes
   - 10-minute expiration
   - Stored in Redis with TTL
   - Single-use validation
3. **Cookie Security:**
   - HTTP-only (prevents XSS access)
   - Signed (prevents tampering)
   - Secure flag in production
   - SameSite attribute for CSRF protection
4. **Error Messages:** Specific but not revealing internal details

---

## Frontend Integration Notes

1. **Two-Step Authentication Process:**
   ```typescript
   // Step 1: Submit credentials
   const loginResponse = await fetch('/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ mail: email, password }),
     credentials: 'include'
   });

   // Step 2: Submit OTP (after user receives email)
   const otpResponse = await fetch('/login/validate-otp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ mail: email, otp }),
     credentials: 'include'
   });

   const { role } = await otpResponse.json();
   // Redirect based on role
   ```

2. **Cookie Handling:**
   - The `account` cookie is automatically set by the browser
   - Include `credentials: 'include'` in fetch requests
   - Cookie is sent automatically in subsequent same-origin requests

3. **Session Persistence:**
   - Session duration controlled by cookie's `MaxAge` (default: 1 hour)
   - Use `/auth/validate-cookie` to check session validity

4. **Error Display:**
   - Show specific validation errors from DTO validation
   - Display backend error messages directly to users

---

## Example Requests

### Login
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "mail": "user@example.com",
    "password": "SecurePass@123"
  }'
```

### Validate OTP
```bash
curl -X POST http://localhost:3001/login/validate-otp \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "mail": "user@example.com",
    "otp": "123456"
  }'
```

---

## Related Modules
- **Auth Module:** For session validation after login (`/auth/validate-cookie`)
- **Onboarding Module:** For new user registration
- **Mail Module:** For sending OTP emails
- **Users Module:** For user data management
