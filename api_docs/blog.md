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
| q | string | - | Search query (searches title, excerpt, tags, categories) |
| category | string | - | Filter by category |
| tag | string | - | Filter by tag |
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
    "isSubscribed": true,
    "isActive": true,
    "subscribedAt": "2025-01-10T14:30:00.000Z"
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
  "message": "Newsletter subscription updated",
  "data": {
    "enabled": true
  }
}
```

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
| source | string | Optional, enum | Subscription source: `blog_homepage`, `blog_sidebar`, `blog_footer`, `settings_page` |

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
  BLOG_HOMEPAGE = 'blog_homepage',
  BLOG_SIDEBAR = 'blog_sidebar',
  BLOG_FOOTER = 'blog_footer',
  SETTINGS_PAGE = 'settings_page'
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
| 201 | Created (newsletter subscription) |
| 400 | Bad Request (validation errors) |
| 404 | Not Found |
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

---

## Related Modules
- **Admin Blog Module:** For content management (create, edit, publish)
- **Blog Portal Module:** For external writer access
- **Newsletter Module:** For managing newsletter campaigns
