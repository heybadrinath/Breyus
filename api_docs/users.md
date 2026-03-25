# Users API

## Overview
The Users API provides user-related functionality including retrieving user information and managing notification preferences (both standard and AI-related).

## Base URL
```
/users
```

## Authentication
All endpoints require authentication via signed cookie. Protected by AuthGuard which validates:
- Cookie-based JWT authentication
- User existence in database
- User is not suspended

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
  "name": "John Doe"
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

Retrieves the user's notification preferences for trade-related events.

**Endpoint:** `GET /users/notification-preferences`

**Authentication:** Required (signed cookie)

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Notification preferences retrieved successfully",
  "data": {
    "email": {
      "tradeCreated": true,
      "counterOffer": true,
      "tradeAccepted": true,
      "tradeRejected": true,
      "documentUploaded": true,
      "documentsInvalidated": true,
      "phaseAdvanced": true,
      "tradeCompleted": true,
      "tradeCancelled": true,
      "documentRejected": true,
      "lastAttemptWarning": true,
      "tradeAutoCancelled": true,
      "signedSpaRequired": true
    },
    "realtime": {
      "tradeCreated": true,
      "counterOffer": true,
      "tradeAccepted": true,
      "tradeRejected": true,
      "documentUploaded": true,
      "documentsInvalidated": true,
      "phaseAdvanced": true,
      "tradeCompleted": true,
      "tradeCancelled": true,
      "documentRejected": true,
      "lastAttemptWarning": true,
      "tradeAutoCancelled": true,
      "signedSpaRequired": true
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
  "message": "Internal Server Error"
}
```

**Implementation Notes:**
- Returns both email and real-time notification preferences
- All preferences default to `true` for new users
- Supports granular control over each notification type

---

### 3. Update Notification Preferences

Updates the user's notification preferences.

**Endpoint:** `PUT /users/notification-preferences`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "email": {
    "tradeCreated": true,
    "counterOffer": true,
    "tradeAccepted": true,
    "tradeRejected": true,
    "documentUploaded": true,
    "documentsInvalidated": true,
    "phaseAdvanced": true,
    "tradeCompleted": true,
    "tradeCancelled": true,
    "documentRejected": true,
    "lastAttemptWarning": true,
    "tradeAutoCancelled": true,
    "signedSpaRequired": true
  },
  "realtime": {
    "tradeCreated": true,
    "counterOffer": false,
    "tradeAccepted": true,
    "tradeRejected": true,
    "documentUploaded": false,
    "documentsInvalidated": true,
    "phaseAdvanced": true,
    "tradeCompleted": true,
    "tradeCancelled": true,
    "documentRejected": true,
    "lastAttemptWarning": true,
    "tradeAutoCancelled": true,
    "signedSpaRequired": true
  }
}
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Notification preferences updated successfully",
  "data": {
    "email": {
      "tradeCreated": true,
      "counterOffer": true,
      "tradeAccepted": true,
      "tradeRejected": true,
      "documentUploaded": true,
      "documentsInvalidated": true,
      "phaseAdvanced": true,
      "tradeCompleted": true,
      "tradeCancelled": true,
      "documentRejected": true,
      "lastAttemptWarning": true,
      "tradeAutoCancelled": true,
      "signedSpaRequired": true
    },
    "realtime": {
      "tradeCreated": true,
      "counterOffer": false,
      "tradeAccepted": true,
      "tradeRejected": true,
      "documentUploaded": false,
      "documentsInvalidated": true,
      "phaseAdvanced": true,
      "tradeCompleted": true,
      "tradeCancelled": true,
      "documentRejected": true,
      "lastAttemptWarning": true,
      "tradeAutoCancelled": true,
      "signedSpaRequired": true
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
  "message": "Internal Server Error"
}
```

**Implementation Notes:**
- Partial updates are supported - only include fields you want to change
- Returns the updated preferences after saving

---

### 4. Get AI Notification Preferences

Retrieves the user's AI Buddy notification preferences.

**Endpoint:** `GET /users/ai-notification-preferences`

**Authentication:** Required (signed cookie)

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "AI notification preferences retrieved successfully",
  "data": {
    "email": "custom@email.com",
    "useExistingEmail": true
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
  "message": "Internal Server Error"
}
```

**Implementation Notes:**
- `useExistingEmail: true` means AI notifications use the user's primary email
- `email` field is optional custom email for AI notifications
- Default is `useExistingEmail: true`

---

### 5. Update AI Notification Preferences

Updates the user's AI Buddy notification preferences.

**Endpoint:** `PUT /users/ai-notification-preferences`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "email": "ai-alerts@mycompany.com",  // Optional: custom email for AI notifications
  "useExistingEmail": false             // true = use primary email, false = use custom email
}
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "AI notification preferences updated successfully",
  "data": {
    "email": "ai-alerts@mycompany.com",
    "useExistingEmail": false
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
  "message": "Internal Server Error"
}
```

**Implementation Notes:**
- When `useExistingEmail` is `true`, the `email` field is ignored
- When `useExistingEmail` is `false`, the `email` field must be provided
- Used for receiving AI-related alerts and insights

---

## Data Models

### User Schema
```typescript
{
  _id: ObjectId;
  mail: string;                        // Unique email address
  password: string;                    // Hashed password (bcrypt)
  role: Role;                          // User role enum (Buyer, Seller, Seller and Buyer)
  company: ObjectId;                   // Ref: Company (required)
  failedLoginAttempts: number;         // Default: 0 (for account lockout)
  lockUntil: number | null;            // Timestamp for account lockout
  passwordResetToken: string | null;   // Token for password reset flow
  passwordResetExpires: Date | null;   // Expiry for password reset token
  notificationPreferences: NotificationPreferences;  // Trade notification settings
  aiNotificationPreferences: AINotificationPreferences;  // AI notification settings
  // Suspension fields
  isSuspended: boolean;                // Default: false
  suspendedAt?: Date | null;
  suspensionReason?: string | null;
  suspendedBy?: ObjectId | null;       // Ref: AdminUser
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

### NotificationPreferences Interface
```typescript
interface NotificationPreferences {
  email: {
    tradeCreated: boolean;
    counterOffer: boolean;
    tradeAccepted: boolean;
    tradeRejected: boolean;
    documentUploaded: boolean;
    documentsInvalidated: boolean;
    phaseAdvanced: boolean;
    tradeCompleted: boolean;
    tradeCancelled: boolean;
    documentRejected: boolean;
    lastAttemptWarning: boolean;
    tradeAutoCancelled: boolean;
    signedSpaRequired: boolean;
  };
  realtime: {
    tradeCreated: boolean;
    counterOffer: boolean;
    tradeAccepted: boolean;
    tradeRejected: boolean;
    documentUploaded: boolean;
    documentsInvalidated: boolean;
    phaseAdvanced: boolean;
    tradeCompleted: boolean;
    tradeCancelled: boolean;
    documentRejected: boolean;
    lastAttemptWarning: boolean;
    tradeAutoCancelled: boolean;
    signedSpaRequired: boolean;
  };
}
```

### AINotificationPreferences Interface
```typescript
interface AINotificationPreferences {
  email?: string;          // Custom email for AI notifications
  useExistingEmail: boolean;  // true = use user's primary email
}
```

---

## Notification Types

### Trade Notifications

| Type | Description |
|------|-------------|
| `tradeCreated` | New trade/purchase request created |
| `counterOffer` | Counter-offer received in negotiation |
| `tradeAccepted` | Trade accepted by other party |
| `tradeRejected` | Trade rejected by other party |
| `documentUploaded` | New document uploaded to trade |
| `documentsInvalidated` | Trade documents marked invalid |
| `phaseAdvanced` | Trade moved to next phase |
| `tradeCompleted` | Trade successfully completed |
| `tradeCancelled` | Trade cancelled |
| `documentRejected` | Document rejected by other party |
| `lastAttemptWarning` | Final attempt warning for document upload |
| `tradeAutoCancelled` | Trade auto-cancelled due to timeout |
| `signedSpaRequired` | Signed SPA document required |

### AI Notifications

AI notifications are sent for:
- Market insights and alerts
- Price change notifications
- Trade opportunity recommendations
- Partner matching suggestions

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

2. **Settings Page - Notification Preferences:**
   ```javascript
   // Fetch preferences on page load
   const fetchPreferences = async () => {
     const response = await api.get('/users/notification-preferences');
     setPreferences(response.data.data);
   };

   // Update preferences
   const updatePreferences = async (newPrefs) => {
     const response = await api.put('/users/notification-preferences', newPrefs);
     setPreferences(response.data.data);
     showToast('Preferences updated');
   };
   ```

3. **Settings Page - AI Notification Preferences:**
   ```javascript
   // Toggle between existing email and custom email
   const handleAIPreferenceChange = async (useExisting, customEmail) => {
     const response = await api.put('/users/ai-notification-preferences', {
       useExistingEmail: useExisting,
       email: useExisting ? undefined : customEmail
     });
     setAIPreferences(response.data.data);
   };
   ```

4. **Notification Preference Toggle UI:**
   ```jsx
   <NotificationSettings>
     <SectionTitle>Email Notifications</SectionTitle>
     {Object.entries(preferences.email).map(([key, value]) => (
       <ToggleRow key={key}>
         <Label>{formatNotificationType(key)}</Label>
         <Toggle
           checked={value}
           onChange={() => togglePreference('email', key)}
         />
       </ToggleRow>
     ))}

     <SectionTitle>Real-time Notifications</SectionTitle>
     {Object.entries(preferences.realtime).map(([key, value]) => (
       <ToggleRow key={key}>
         <Label>{formatNotificationType(key)}</Label>
         <Toggle
           checked={value}
           onChange={() => togglePreference('realtime', key)}
         />
       </ToggleRow>
     ))}
   </NotificationSettings>
   ```

---

## Best Practices

1. **Caching:**
   - Cache user name locally after first fetch
   - Refresh on login or profile update
   - Use from auth context for global access

2. **Optimistic Updates:**
   - Update UI immediately when toggling preferences
   - Rollback on API error

3. **Batch Updates:**
   - Debounce preference changes to avoid excessive API calls
   - Send single update after user finishes making changes

---

## Related Modules
- **Auth Module:** User authentication and session management
- **Login Module:** User login and account access
- **Onboarding Module:** User account creation
- **Company Module:** Users are associated with companies
- **Trade Module:** Users create and manage trades
- **Notification Module:** Handles notification delivery based on preferences
- **AI Module:** AI features use AI notification preferences
