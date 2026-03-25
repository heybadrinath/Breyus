---
type: api-doc
module: blog
tags: [api, blog]
---

# Blog API

## Overview
The Blog API provides public-facing endpoints for accessing blog posts, categories, tags, and newsletter subscriptions. These endpoints power the Breyus blog platform, supporting features like personalized content delivery, trending posts, search functionality, and newsletter management.

## Base URL
```
/blog
```

## Authentication
Most endpoints are **public** and do not require authentication. However:
- `GET /blog/posts/personalized` - Optionally uses the `account` cookie for personalization
- `GET /blog/posts/:slug` - Uses `blog_session` cookie for member-only content access

---

## Endpoints

### 1. Get Published Posts

Retrieves a paginated list of published blog posts with filtering and sorting options.

**Endpoint:** `GET /blog/posts`

**Authentication:** None required (public endpoint)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (min: 1) |
| limit | number | 10 | Items per page (min: 1, max: 50) |
| search | string | - | Search term for text search |
| category | string | - | Filter by category name (case-insensitive) |
| tag | string | - | Filter by tag (case-insensitive) |
| sortBy | string | publishedAt | Sort field: `publishedAt`, `viewCount`, `title`, `likeCount`, `commentCount` |
| sortOrder | string | desc | Sort direction: `asc` or `desc` |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Blog posts retrieved successfully",
  "data": {
    "posts": [
      {
        "_id": "64f2a1b3c4d5e6f7g8h9i0j1",
        "title": "Understanding Commodity Trading",
        "slug": "understanding-commodity-trading",
        "excerpt": "A comprehensive guide to commodity trading...",
        "featuredImage": "https://example.com/image.jpg",
        "status": "published",
        "accessLevel": "public",
        "categories": ["Market Analysis", "Trading"],
        "tags": ["commodities", "trading", "guide"],
        "author": {
          "_id": "admin123",
          "email": "admin@breyus.com",
          "name": "John Doe"
        },
        "publishedAt": "2025-01-15T10:30:00.000Z",
        "viewCount": 1250,
        "likeCount": 45,
        "commentCount": 12,
        "readTimeMinutes": 8,
        "isPinned": false,
        "isFeatured": true,
        "createdAt": "2025-01-14T08:00:00.000Z",
        "updatedAt": "2025-01-15T10:30:00.000Z"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5,
    "hasMore": true
  }
}
```

---

### 2. Get Featured Post

Returns the featured/hero post for the blog homepage. Prioritizes pinned posts, falls back to most viewed.

**Endpoint:** `GET /blog/posts/featured`

**Authentication:** None required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Featured post retrieved successfully",
  "data": {
    "post": {
      "_id": "64f2a1b3c4d5e6f7g8h9i0j1",
      "title": "2025 Commodity Market Outlook",
      "slug": "2025-commodity-market-outlook",
      "excerpt": "What to expect in the commodity markets...",
      "featuredImage": "https://example.com/featured.jpg",
      "tiptapContent": { "type": "doc", "content": [...] },
      "status": "published",
      "publishedAt": "2025-01-20T09:00:00.000Z",
      "viewCount": 5420,
      "isPinned": true
    }
  }
}
```

---

### 3. Get Pinned Posts

Returns all pinned posts for carousel display on the homepage.

**Endpoint:** `GET /blog/posts/pinned`

**Authentication:** None required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 10 | Maximum number of posts to return |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Pinned posts retrieved successfully",
  "data": {
    "posts": [...]
  }
}
```

---

### 4. Get Trending Posts

Returns trending posts sorted by view count and engagement.

**Endpoint:** `GET /blog/posts/trending`

**Authentication:** None required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 6 | Maximum number of posts to return |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trending posts retrieved successfully",
  "data": {
    "posts": [...]
  }
}
```

---

### 5. Search Posts

Search blog posts by query string with optional filters.

**Endpoint:** `GET /blog/posts/search`

**Authentication:** None required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| q | string | - | Search query (searches title, excerpt, tags, categories via regex) |
| category | string | - | Filter by category (case-insensitive, supports slug format) |
| tag | string | - | Filter by tag (case-insensitive) |
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Search results retrieved successfully",
  "data": {
    "posts": [...],
    "total": 15,
    "page": 1,
    "pages": 2,
    "hasMore": true
  }
}
```

**Note:** Unlike the main posts listing, the search response does not include a `limit` field.

---

### 6. Get Personalized Posts

Returns blog posts personalized based on user's product interests from multiple sources.

**Endpoint:** `GET /blog/posts/personalized`

**Authentication:** Optional (uses `account` cookie for personalization)

**Interest Sources (weighted):**
1. **Trade history (3x)** - Products bought/sold = actual business intent
2. **Own products (2x)** - Seller's inventory = core business focus
3. **Wishlist products (1.5x)** - Saved for later = active interest
4. **AI contacts (1x)** - Saved commodities from AI search = exploration

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (min: 1) |
| limit | number | 6 | Items per page (min: 1, max: 20) |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Personalized blog posts retrieved successfully",
  "data": {
    "posts": [...],
    "total": 45,
    "page": 1,
    "limit": 6,
    "pages": 8,
    "hasMore": true,
    "isPersonalized": true,
    "interestSources": {
      "hasOwnProducts": true,
      "hasWishlistProducts": true,
      "hasAiContacts": false,
      "hasTrades": true
    }
  }
}
```

**Note:** If no authentication or no user interests found, falls back to recent published posts with `isPersonalized: false`.

---

### 7. Get Single Post by Slug

Retrieves a single blog post by its URL slug. Increments view count on each fetch.

**Endpoint:** `GET /blog/posts/:slug`

**Authentication:** Optional (`blog_session` cookie for member-only content)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | URL-friendly post identifier |

**Response:**

**Success (200 OK) - Public Post:**
```json
{
  "statusCode": 200,
  "message": "Blog post retrieved successfully",
  "data": {
    "_id": "64f2a1b3c4d5e6f7g8h9i0j1",
    "title": "Understanding Commodity Trading",
    "slug": "understanding-commodity-trading",
    "excerpt": "A comprehensive guide...",
    "featuredImage": "https://example.com/image.jpg",
    "tiptapContent": {
      "type": "doc",
      "content": [
        { "type": "paragraph", "content": [...] }
      ]
    },
    "contentFormat": "tiptap",
    "status": "published",
    "accessLevel": "public",
    "categories": ["Market Analysis"],
    "tags": ["commodities", "trading"],
    "hsnCodePrefixes": ["09", "07"],
    "author": { "_id": "...", "email": "...", "name": "..." },
    "publishedAt": "2025-01-15T10:30:00.000Z",
    "viewCount": 1251,
    "likeCount": 45,
    "commentCount": 12,
    "readTimeMinutes": 8,
    "accessGranted": true,
    "accessReason": null
  }
}
```

**Success (200 OK) - Member-Only Post Without Access:**
```json
{
  "statusCode": 200,
  "message": "Blog post retrieved successfully",
  "data": {
    "title": "Premium Trading Insights",
    "slug": "premium-trading-insights",
    "excerpt": "...",
    "tiptapContent": {
      "type": "doc",
      "content": [...]
    },
    "accessLevel": "member_only",
    "accessGranted": false,
    "accessReason": "sign_in_required"
  }
}
```

**Access Reasons:**
- `sign_in_required` - User not authenticated
- `membership_required` - User authenticated but not a Breyus member

**Error (404 Not Found):**
```json
{
  "statusCode": 404,
  "message": "Blog post not found"
}
```

---

### 8. Get Related Posts

Returns posts related to a specific post based on shared categories, tags, and HSN prefixes.

**Endpoint:** `GET /blog/posts/:id/related`

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | MongoDB ObjectId of the post |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 4 | Maximum number of related posts |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Related posts retrieved successfully",
  "data": [...]
}
```

---

### 9. Get Categories

Returns all available blog categories with post counts.

**Endpoint:** `GET /blog/categories`

**Authentication:** None required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Categories retrieved successfully",
  "data": [
    { "category": "Market Analysis", "count": 15 },
    { "category": "Trading Strategies", "count": 12 },
    { "category": "Industry News", "count": 8 },
    { "category": "Shipping & Logistics", "count": 6 }
  ]
}
```

---

### 10. Get Popular Tags

Returns the most frequently used tags from published posts.

**Endpoint:** `GET /blog/tags/popular`

**Authentication:** None required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 20 | Maximum number of tags to return |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Popular tags retrieved successfully",
  "data": [
    { "tag": "commodities", "count": 25 },
    { "tag": "trading", "count": 18 },
    { "tag": "agriculture", "count": 14 },
    { "tag": "metals", "count": 12 }
  ]
}
```

---

## Newsletter Endpoints

### 11. Get Newsletter Status

Check newsletter subscription status for an email address.

**Endpoint:** `GET /blog/newsletter/status`

**Authentication:** None required

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| email | string | Email address to check (required) |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Newsletter status retrieved",
  "data": {
    "isSubscribed": true
  }
}
```

**Error (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Email is required"
}
```

---

### 12. Toggle Newsletter Subscription

Enable or disable newsletter subscription for an email.

**Endpoint:** `POST /blog/newsletter/toggle`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "enabled": true
}
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Successfully subscribed to the Breyus newsletter!",
  "data": {
    "enabled": true
  }
}
```

**Note:** The `message` varies depending on action: subscribe returns a welcome message, unsubscribe returns confirmation, and reactivation returns a welcome-back message.

---

### 13. Subscribe to Newsletter

Subscribe an email address to the newsletter.

**Endpoint:** `POST /blog/subscribe`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "source": "blog_homepage"
}
```

**Validation Rules (SubscribeDto):**

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| email | string | Required, valid email | Email to subscribe |
| source | string | Optional, enum | Subscription source: `blog_footer`, `blog_homepage`, `blog_post`, `blog_settings` |

**Response:**

**Success (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Successfully subscribed to newsletter"
}
```

---

### 14. Unsubscribe from Newsletter

Unsubscribe from newsletter using a token link (typically from email footer).

**Endpoint:** `GET /blog/unsubscribe/:token`

**Authentication:** None required

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| token | string | Unsubscribe token from newsletter email |

**Response:**

Returns an HTML page confirming unsubscription.

---

## Data Models

### BlogPost Schema

```typescript
{
  _id: ObjectId;
  title: string;                    // Max 200 chars
  slug: string;                     // URL-friendly, unique, lowercase
  excerpt: string;                  // Max 500 chars
  featuredImage?: string;           // Image URL
  contentFormat: 'tiptap';          // Content format type
  tiptapContent: object | null;     // Tiptap JSON document

  // Author attribution
  author: ObjectId | null;          // Ref: AdminUser (for admin posts)
  writerId: ObjectId | null;        // Ref: BlogUser (for external writers)
  writerDisplayName: string;
  writerBio: string;
  writerAvatar: string | null;

  // Status and workflow
  status: BlogStatus;               // draft, submitted, in_review, etc.
  publishedAt?: Date;

  // Access control
  accessLevel: 'public' | 'member_only';

  // Editorial workflow
  submittedAt: Date | null;
  reviewedBy: ObjectId | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  revisionNotes: string | null;

  // Categorization
  categories: string[];
  tags: string[];
  hsnCodePrefixes: string[];        // For commodity-related matching

  // Engagement metrics
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  uniqueViewCount: number;

  // Reading metadata
  readTimeMinutes: number;          // Min 1

  // SEO
  metaTitle?: string;               // Max 70 chars
  metaDescription?: string;         // Max 160 chars

  // Featured/pinned
  isFeatured: boolean;
  isPinned: boolean;

  // Soft delete
  isDeleted: boolean;
  deletedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### BlogStatus Enum

```typescript
type BlogStatus =
  | 'draft'              // Initial state, being written
  | 'submitted'          // Writer sent for review
  | 'in_review'          // Admin is reviewing
  | 'revision_requested' // Needs changes from writer
  | 'approved'           // Ready to publish
  | 'published'          // Live on the blog
  | 'rejected';          // Not approved

```

### BlogAccessLevel Enum

```typescript
type BlogAccessLevel = 'public' | 'member_only';
```

### SubscriptionSource Enum

```typescript
enum SubscriptionSource {
  BLOG_FOOTER = 'blog_footer',
  BLOG_HOMEPAGE = 'blog_homepage',
  BLOG_POST = 'blog_post',
  BLOG_SETTINGS = 'blog_settings'
}
```

### NewsletterSubscriber Schema

```typescript
{
  _id: ObjectId;
  email: string;                    // Unique, lowercase, trimmed
  subscribedAt: Date;
  isActive: boolean;                // Default: true
  unsubscribeToken: string;         // Unique, random hex
  source: SubscriptionSource;       // Default: 'blog_homepage'
  lastDigestSentAt: Date | null;    // Last weekly digest send time

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### BlogUser Schema

```typescript
{
  _id: ObjectId;
  email: string;                    // Unique, lowercase
  password: string;                 // bcrypt hashed
  firstName: string;
  lastName: string;
  companyName: string;
  website?: string;
  areaOfInterest: string;
  experience: string;
  areaOfExpertise: string;

  // Breyus integration
  breyusUserId: ObjectId | null;    // Ref: User
  isBrèyusMember: boolean;         // Verified Breyus user
  passwordSyncedFromBreyus: boolean;
  passwordChangedAt: Date | null;

  // Writer status
  isWriter: boolean;
  writerInviteToken: string | null;
  writerApprovedAt: Date | null;
  writerBio: string;               // Max 1000 chars
  writerAvatar: string | null;
  writerBanner: string | null;

  // Metadata
  lastLoginAt: Date | null;

  // Suspension
  isSuspended: boolean;
  suspendedAt: Date | null;
  suspendedBy: string | null;
  suspensionReason: string | null;

  // Soft delete
  isDeleted: boolean;
  deletedAt: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### BlogComment Schema

```typescript
{
  _id: ObjectId;
  blogPostId: ObjectId;             // Ref: BlogPost
  blogUserId: ObjectId;             // Ref: BlogUser
  content: string;                  // Max 2000 chars
  parentId: ObjectId | null;        // For nested replies

  // Moderation
  isFlagged: boolean;
  flagCount: number;
  flagReasons: string[];
  isHidden: boolean;                // Admin can hide

  // Soft delete
  deletedAt: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### BlogLike Schema

```typescript
{
  _id: ObjectId;
  blogPostId: ObjectId;             // Ref: BlogPost
  blogUserId: ObjectId;             // Ref: BlogUser
  createdAt: Date;
}
```

### BlogWriterInvite Schema

```typescript
{
  _id: ObjectId;
  token: string;                    // Unique, random hex
  createdBy: ObjectId;              // Ref: AdminUser
  usedBy: ObjectId | null;          // Ref: BlogUser
  usedAt: Date | null;
  expiresAt: Date;                  // +7 days from creation (TTL)
  emailHint: string | null;         // Targeted invite email
  adminNote: string | null;         // Max 500 chars
  createdAt: Date;
}
```

---

## Blog Portal Endpoints

The Blog Portal is a separate module providing authentication, post interactions, comments, writer profiles, writer dashboard, and invite management. All routes use the `/blog-portal` prefix.

### Base URL
```
/blog-portal
```

### Authentication
Blog portal uses its own session system via `blog_session` HTTP-only cookie (30-day expiry). Two user types:
- **Breyus Members** - SSO via main platform `account` cookie or OTP verification
- **Blog-only Readers** - Standalone signup with email/password

---

### Auth Endpoints

#### 15. Blog Signup

**Endpoint:** `POST /blog-portal/auth/signup`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePass123",
  "firstName": "Jane",
  "lastName": "Doe",
  "companyName": "Acme Trading",
  "website": "https://acme.com",
  "areaOfInterest": "Agricultural commodities",
  "experience": "5 years in commodity trading",
  "areaOfExpertise": "Supply chain management"
}
```

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| email | string | Required, valid email | User email |
| password | string | Required, min 8, max 100 | Account password |
| firstName | string | Required, max 100 | First name |
| lastName | string | Required, max 100 | Last name |
| companyName | string | Optional, max 200 | Company name |
| website | string | Optional, max 200 | Website URL |
| areaOfInterest | string | Optional, max 200 | Interest area |
| experience | string | Optional, max 200 | Experience level |
| areaOfExpertise | string | Optional, max 200 | Expertise area |

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Signup successful",
  "data": {
    "user": {
      "_id": "...",
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "companyName": "Acme Trading",
      "isBrèyusMember": false,
      "isWriter": false,
      "writerBio": "",
      "writerAvatar": null,
      "writerBanner": null
    }
  }
}
```

Sets `blog_session` cookie.

---

#### 16. Blog Login

**Endpoint:** `POST /blog-portal/auth/login`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePass123"
}
```

**Response (200 OK):** Same shape as signup. Sets `blog_session` cookie.

---

#### 17. Breyus Member OTP Request

**Endpoint:** `POST /blog-portal/auth/breyus/request-otp`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "member@breyus.com"
}
```

---

#### 18. Breyus Member OTP Verify

**Endpoint:** `POST /blog-portal/auth/breyus/verify-otp`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "member@breyus.com",
  "otp": "123456"
}
```

| Field | Type | Rules |
|-------|------|-------|
| email | string | Required, valid email |
| otp | string | Required, exactly 6 chars |

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Welcome to Breyus Blog!",
  "data": {
    "user": { ... },
    "isNewUser": true
  }
}
```

Sets `blog_session` cookie.

---

#### 19. Get Current User

**Endpoint:** `GET /blog-portal/auth/me`

**Authentication:** Required (`blog_session` cookie)

**Response (200 OK):** Returns sanitized user object.

---

#### 20. Logout

**Endpoint:** `POST /blog-portal/auth/logout`

**Authentication:** Required (`blog_session` cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

Clears `blog_session` cookie.

---

#### 21. Forgot Password

**Endpoint:** `POST /blog-portal/auth/forgot-password`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

#### 22. Reset Password

**Endpoint:** `POST /blog-portal/auth/reset-password`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePass123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| email | string | Required, valid email |
| otp | string | Required, exactly 6 chars |
| newPassword | string | Required, min 8, max 100 |

---

#### 23. Change Password

**Endpoint:** `POST /blog-portal/auth/change-password`

**Authentication:** Required (`blog_session` cookie)

**Request Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePass123"
}
```

---

#### 24. Check Email

Check if an email belongs to a Breyus member.

**Endpoint:** `POST /blog-portal/auth/check-email`

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

#### 25. Check Breyus Session (SSO)

Check for an active Breyus platform session. Reads the main `account` signed cookie.

**Endpoint:** `GET /blog-portal/auth/check-session`

**Authentication:** None required (reads `account` cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "hasSession": true,
    "email": "member@breyus.com",
    "firstName": "John"
  }
}
```

---

#### 26. SSO Login

Login using an active Breyus session without OTP. User must confirm identity.

**Endpoint:** `POST /blog-portal/auth/sso-login`

**Authentication:** None required (reads `account` cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "isNewUser": false
  }
}
```

Sets `blog_session` cookie.

---

### Post Interaction Endpoints

All post interaction endpoints require `blog_session` cookie authentication.

#### 27. Like a Post

**Endpoint:** `POST /blog-portal/posts/:postId/like`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Post liked successfully",
  "data": { "likeCount": 46 }
}
```

---

#### 28. Unlike a Post

**Endpoint:** `DELETE /blog-portal/posts/:postId/like`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Post unliked successfully",
  "data": { "likeCount": 45 }
}
```

---

#### 29. Get Like Status

**Endpoint:** `GET /blog-portal/posts/:postId/like`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Like status retrieved successfully",
  "data": { "isLiked": true }
}
```

---

#### 30. Record a Share

**Endpoint:** `POST /blog-portal/posts/:postId/share`

**Authentication:** Required

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Share recorded successfully"
}
```

---

### Comment Endpoints

#### 31. Get Comments for Post

**Endpoint:** `GET /blog-portal/comments/post/:postId`

**Authentication:** None required (public)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Comments retrieved successfully",
  "data": [...]
}
```

---

#### 32. Add Comment

**Endpoint:** `POST /blog-portal/comments/post/:postId`

**Authentication:** Required (`blog_session` cookie)

**Request Body:**
```json
{
  "content": "Great article on commodity pricing!",
  "parentId": "optional-comment-id-for-replies"
}
```

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| content | string | Required | Comment text (max 2000 chars) |
| parentId | string | Optional | Parent comment ID for nested replies |

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Comment added successfully",
  "data": { ... }
}
```

---

#### 33. Delete Own Comment

**Endpoint:** `DELETE /blog-portal/comments/:id`

**Authentication:** Required (`blog_session` cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Comment deleted successfully"
}
```

---

#### 34. Flag Comment

**Endpoint:** `POST /blog-portal/comments/:id/flag`

**Authentication:** Required (`blog_session` cookie)

**Request Body:**
```json
{
  "reason": "Spam content"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Comment flagged successfully"
}
```

---

### Writer Profile Endpoints (Public)

#### 35. List All Writers

**Endpoint:** `GET /blog-portal/writers`

**Authentication:** None required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | - | Search by name |

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Writers retrieved successfully",
  "data": { ... }
}
```

---

#### 36. Get Writer Profile

**Endpoint:** `GET /blog-portal/writers/:id`

**Authentication:** None required

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Writer profile retrieved successfully",
  "data": { ... }
}
```

---

#### 37. Get Writer's Posts

**Endpoint:** `GET /blog-portal/writers/:id/posts`

**Authentication:** None required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Writer posts retrieved successfully",
  "data": { ... }
}
```

---

### Writer Dashboard Endpoints

All writer dashboard endpoints require `blog_session` cookie authentication AND writer role (`BlogWriterGuard`).

#### 38. Get Own Posts

**Endpoint:** `GET /blog-portal/writer/posts`

**Authentication:** Required (writer only)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | - | Filter by status (draft, submitted, etc.) |
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Posts retrieved successfully",
  "data": { ... }
}
```

---

#### 39. Get Post for Editing

**Endpoint:** `GET /blog-portal/writer/posts/:id`

**Authentication:** Required (writer only, own posts)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Post retrieved successfully",
  "data": { ... }
}
```

---

#### 40. Create New Post

**Endpoint:** `POST /blog-portal/writer/posts`

**Authentication:** Required (writer only)

**Request Body:**
```json
{
  "title": "Understanding Agricultural Commodities",
  "tiptapContent": { "type": "doc", "content": [...] },
  "excerpt": "A guide to agricultural commodity trading",
  "featuredImage": "https://example.com/image.jpg",
  "categories": ["Agriculture"],
  "tags": ["commodities", "agriculture"]
}
```

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| title | string | Required | Post title |
| tiptapContent | object | Optional | Tiptap JSON document |
| excerpt | string | Optional | Post summary |
| featuredImage | string | Optional | Featured image URL |
| categories | string[] | Optional | Category list |
| tags | string[] | Optional | Tag list |

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Post created successfully",
  "data": { ... }
}
```

---

#### 41. Update Post

**Endpoint:** `PATCH /blog-portal/writer/posts/:id`

**Authentication:** Required (writer only, own posts)

**Request Body:** Partial object with any of: `title`, `tiptapContent`, `excerpt`, `featuredImage`, `categories`, `tags`.

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Post updated successfully",
  "data": { ... }
}
```

---

#### 42. Delete Draft Post

**Endpoint:** `DELETE /blog-portal/writer/posts/:id`

**Authentication:** Required (writer only, own draft posts)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Post deleted successfully"
}
```

---

#### 43. Submit Post for Review

**Endpoint:** `POST /blog-portal/writer/posts/:id/submit`

**Authentication:** Required (writer only, own posts)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Post submitted for review",
  "data": { ... }
}
```

---

#### 44. Get Writer Analytics

**Endpoint:** `GET /blog-portal/writer/analytics`

**Authentication:** Required (writer only)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Analytics retrieved successfully",
  "data": { ... }
}
```

---

#### 45. Update Writer Profile

**Endpoint:** `PATCH /blog-portal/writer/profile`

**Authentication:** Required (writer only)

**Request Body:**
```json
{
  "writerAvatar": "https://example.com/avatar.jpg",
  "writerBanner": "https://example.com/banner.jpg",
  "writerBio": "Experienced commodity trader and writer"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Profile updated successfully",
  "data": {
    "writerAvatar": "https://example.com/avatar.jpg",
    "writerBanner": "https://example.com/banner.jpg",
    "writerBio": "Experienced commodity trader and writer"
  }
}
```

---

#### 46. Upload Image

Upload an image for blog content (inline images, featured images).

**Endpoint:** `POST /blog-portal/writer/upload-image`

**Authentication:** Required (writer only)

**Request:** `multipart/form-data` with field `image`

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| image | file | Required, max 5MB | Image file (JPEG, PNG, GIF, WebP) |

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://storage.example.com/blog/image.jpg",
    "filename": "image.jpg"
  }
}
```

---

### Invite Endpoints

#### 47. Validate Invite Token

**Endpoint:** `GET /blog-portal/invite/:token/validate`

**Authentication:** None required (public)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Invite is valid",
  "data": { ... }
}
```

---

#### 48. Claim Invite

**Endpoint:** `POST /blog-portal/invite/:token/claim`

**Authentication:** Required (`blog_session` cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Writer access granted!",
  "data": { ... }
}
```

---

## Error Handling

All endpoints follow a consistent error pattern:

```json
{
  "statusCode": 404,
  "message": "Blog post not found"
}
```

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created (newsletter subscription, new comment, new post) |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (missing or invalid blog_session cookie) |
| 403 | Forbidden (not a writer, not own resource) |
| 404 | Not Found |
| 409 | Conflict (already subscribed to newsletter) |
| 500 | Internal Server Error |

---

## Example Requests

### Get Published Posts with Filters
```bash
curl -X GET "http://localhost:3001/blog/posts?category=Market%20Analysis&sortBy=viewCount&limit=5"
```

### Get Personalized Posts (Authenticated)
```bash
curl -X GET "http://localhost:3001/blog/posts/personalized?limit=6" \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Single Post
```bash
curl -X GET "http://localhost:3001/blog/posts/understanding-commodity-trading"
```

### Search Posts
```bash
curl -X GET "http://localhost:3001/blog/posts/search?q=agriculture&category=Trading"
```

### Subscribe to Newsletter
```bash
curl -X POST "http://localhost:3001/blog/subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "source": "blog_homepage"}'
```

---

## Frontend Integration Notes

1. **Content Rendering:** Blog post content uses Tiptap JSON format. Use a Tiptap renderer or convert to HTML for display.

2. **Personalization:** Include the `account` cookie in requests to `/blog/posts/personalized` for interest-based recommendations.

3. **Member-Only Content:** Check `accessGranted` field in post response. If `false`, show blurred preview with sign-in/membership prompt based on `accessReason`.

4. **View Counting:** View counts are automatically incremented when fetching individual posts via `/blog/posts/:slug`.

5. **Search:** Use `/blog/posts/search` for user-initiated searches with the `q` parameter.

6. **Pagination:** All list endpoints return `hasMore` boolean and total `pages` for implementing pagination UI.

7. **Blog Portal Auth:** The blog portal uses a separate `blog_session` cookie (HTTP-only, 30-day expiry). Breyus members can use SSO login via the `account` cookie without OTP.

8. **Writer System:** Writers are promoted via invite tokens created by admins. Any blog user (Breyus member or blog-only) can claim an invite to become a writer.

9. **Weekly Digest:** A cron job sends weekly digest emails every Monday at 9 AM to all active newsletter subscribers. Only includes posts published in the last 7 days.

---

## Related Modules
- **Admin Blog Module:** For content management (create, edit, publish) — see [[api/admin]]
- **Blog Portal Module:** Authentication, comments, likes, writer dashboard (documented above)
- **Newsletter Module:** Subscription management and weekly digest cron

## Related
- [[api/notification]] — Blog notifications
- [[MOC-API]]
