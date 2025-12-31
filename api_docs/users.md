# Users API

## Overview
The Users API provides user-related functionality. Currently, it has minimal endpoints focused on retrieving basic user information.

## Base URL
```
/users
```

## Authentication
All endpoints require authentication via signed cookie.

---

## Endpoints

### 1. Get User Name

Retrieves the name of the authenticated user.

**Endpoint:** `POST /users/return-name`

**Authentication:** Required (signed cookie)

**Request Body:** None required

**Response:**

**Success (200 OK):**
```json
{
  "name": "string"
}
```

**Error Responses:**

**401 Unauthorized:**
```json
"No valid cookie found"
```

**404 Not Found:**
```json
"User not found"
```

**500 Internal Server Error:**
```json
"Internal Server Error"
```

**Implementation Notes:**
- Extracts `userId` from the JWT account token
- Returns the user's name from the User document
- Used for displaying user name in UI

---

### 2. Get Notification Preferences

Retrieves the user's notification preferences.

**Endpoint:** `GET /users/notification-preferences`

**Authentication:** Required (signed cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Notification preferences retrieved successfully",
  "data": {
    "email": true,
    "sms": false,
    "push": true,
    "whatsapp": true
  }
}
```

---

### 3. Update Notification Preferences

Updates the user's notification preferences.

**Endpoint:** `PUT /users/notification-preferences`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "email": boolean,
  "sms": boolean,
  "push": boolean,
  "whatsapp": boolean
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Notification preferences updated successfully",
  "data": {
    "email": true,
    "sms": false,
    "push": true,
    "whatsapp": true
  }
}
```

---

## Data Models

### User Schema
```typescript
{
  _id: ObjectId;
  mail: string;                        // Unique email address
  password: string;                    // Hashed password (bcrypt)
  role: Role;                          // User role enum
  company: ObjectId;                   // Ref: Company (required)
  failedLoginAttempts: number;         // Default: 0 (for account lockout)
  lockUntil: number | null;            // Timestamp for account lockout
  passwordResetToken: string | null;   // Token for password reset flow
  passwordResetExpires: Date | null;   // Expiry for password reset token
  createdAt: Date;
  updatedAt: Date;
}
```

### Role Enum
```typescript
enum Role {
  Buyer = 'admin',   // Maps to 'admin' internally
  Seller = 'user'    // Maps to 'user' internally
}
```

**Note:** The User `role` enum uses `"admin"` and `"user"` string values internally for legacy reasons, while the Company schema uses `"Buyer"`, `"Seller"`, `"Seller and Buyer"` for display purposes. The Company role determines the user's business role on the platform.

---

## Frontend Integration Notes

1. **Display User Name:**
   ```javascript
   const fetchUserName = async () => {
     const { name } = await api.post('/users/return-name');
     setUserName(name);
   };
   
   // Display in header/profile
   <UserProfile>
     <Avatar />
     <UserName>{userName}</UserName>
   </UserProfile>
   ```

2. **Profile Display:**
   - Show user name in navigation bar
   - Display in user dropdown menu
   - Use in greeting messages

3. **Caching:**
   - Cache user name locally after first fetch
   - Refresh on login or profile update
   - Use from auth context for global access

---

## Future Enhancements

Based on typical user management needs, future endpoints might include:

1. **User Profile:**
   - `GET /users/profile` - Get full user profile
   - `PUT /users/profile` - Update user profile
   - `PATCH /users/profile/picture` - Update profile picture

2. **User Preferences:**
   - `GET /users/preferences` - Get user settings
   - `PUT /users/preferences` - Update user settings
   - Notification preferences
   - Language preferences
   - Theme preferences

3. **Account Security:**
   - `POST /users/change-password` - Change password
   - `POST /users/enable-2fa` - Enable two-factor authentication
   - `GET /users/sessions` - List active sessions
   - `DELETE /users/sessions/:id` - Revoke session

4. **User Management (Admin):**
   - `GET /users` - List all users (admin only)
   - `PUT /users/:id/role` - Update user role (admin only)
   - `DELETE /users/:id` - Delete user (admin only)

---

## Related Modules
- **Auth Module:** User authentication and session management
- **Login Module:** User login and account access
- **Onboarding Module:** User account creation
- **Company Module:** Users are associated with companies
- **Trade Module:** Users create and manage trades
- **Products Module:** Users create and sell products
- **Wishlist Module:** Users save favorite products
- **Inbox Module:** Users communicate via messages
