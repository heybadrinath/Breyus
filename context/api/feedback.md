---
type: api-doc
module: feedback
tags: [api, feedback]
---

# Feedback API

## Overview
The Feedback API handles user feedback and ratings for completed trades. It allows buyers to rate sellers, delivery experiences, and products after a trade is completed. The system supports three types of feedback, each with a 1-5 star rating, optional comments, and customizable tags.

## Base URL
```
/feedback
```

## Authentication
All endpoints require authentication via signed HTTP-only cookie (`account`). The API validates the cookie and extracts the user ID for all operations.

---

## Feedback Types

| Type | Description | Who Provides | Who Receives |
|------|-------------|--------------|--------------|
| `seller` | Rating of the seller's service | Buyer | Seller |
| `delivery` | Rating of the delivery/shipping experience | Buyer | Seller |
| `product` | Rating of the product quality | Buyer | Product |

---

## Endpoints

### 1. Create Feedback

Submit feedback for a completed trade.

**Endpoint:** `POST /feedback`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "tradeId": "64f2a1b3c4d5e6f7g8h9i0j1",
  "feedbackType": "seller",
  "rating": 5,
  "comment": "Excellent seller, very responsive and professional.",
  "tags": ["responsive", "professional", "timely"],
  "details": {
    "communication": "Excellent",
    "packaging": "Well packaged"
  }
}
```

**Validation Rules (CreateFeedbackDto):**

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| tradeId | string | Required, valid MongoDB ObjectId | Trade being rated |
| feedbackType | string | Required, enum: `seller`, `delivery`, `product` | Type of feedback |
| rating | number | Required, min: 1, max: 5 | Star rating |
| comment | string | Optional | Text feedback |
| tags | string[] | Optional, array of strings | Descriptive tags |
| details | object | Optional | Key-value pairs for detailed feedback |

**Response:**

**Success (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Feedback submitted successfully",
  "data": {
    "_id": "64f3b2c4d5e6f7g8h9i0j2k3",
    "trade": "64f2a1b3c4d5e6f7g8h9i0j1",
    "reviewer": "64f1a0b2c3d4e5f6g7h8i9j0",
    "reviewee": "64f0a9b8c7d6e5f4g3h2i1j0",
    "feedbackType": "seller",
    "rating": 5,
    "comment": "Excellent seller, very responsive and professional.",
    "tags": ["responsive", "professional", "timely"],
    "details": {
      "communication": "Excellent",
      "packaging": "Well packaged"
    },
    "createdAt": "2025-01-15T16:45:00.000Z",
    "updatedAt": "2025-01-15T16:45:00.000Z"
  }
}
```

**Error (401 Unauthorized):**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

---

### 2. Get Feedback by Trade

Retrieve all feedback submitted for a specific trade.

**Endpoint:** `GET /feedback/trade/:tradeId`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| tradeId | string | MongoDB ObjectId of the trade |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Feedback retrieved successfully",
  "data": [
    {
      "_id": "64f3b2c4d5e6f7g8h9i0j2k3",
      "trade": "64f2a1b3c4d5e6f7g8h9i0j1",
      "feedbackType": "seller",
      "rating": 5,
      "comment": "Excellent seller",
      "reviewer": {
        "_id": "64f1a0b2c3d4e5f6g7h8i9j0",
        "mail": "buyer@example.com"
      },
      "reviewee": {
        "_id": "64f0a9b8c7d6e5f4g3h2i1j0",
        "mail": "seller@example.com"
      },
      "createdAt": "2025-01-15T16:45:00.000Z"
    },
    {
      "_id": "64f3b2c4d5e6f7g8h9i0j2k4",
      "trade": "64f2a1b3c4d5e6f7g8h9i0j1",
      "feedbackType": "delivery",
      "rating": 4,
      "comment": "Good delivery, minor delay",
      "reviewer": {
        "_id": "64f1a0b2c3d4e5f6g7h8i9j0",
        "mail": "buyer@example.com"
      },
      "reviewee": {
        "_id": "64f0a9b8c7d6e5f4g3h2i1j0",
        "mail": "seller@example.com"
      },
      "createdAt": "2025-01-15T16:50:00.000Z"
    }
  ]
}
```

---

### 3. Get Feedback for User

Retrieve all feedback received by a specific user.

**Endpoint:** `GET /feedback/user/:userId`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | MongoDB ObjectId of the user |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "User feedback retrieved successfully",
  "data": {
    "feedbacks": [
      {
        "_id": "64f3b2c4d5e6f7g8h9i0j2k3",
        "feedbackType": "seller",
        "rating": 5,
        "comment": "Excellent seller",
        "trade": {
          "_id": "64f2a1b3c4d5e6f7g8h9i0j1",
          "product": { "name": "Premium Rice" }
        },
        "createdAt": "2025-01-15T16:45:00.000Z"
      }
    ],
    "averageRating": 4.6,
    "totalReviews": 25,
    "ratingBreakdown": {
      "5": 15,
      "4": 7,
      "3": 2,
      "2": 1,
      "1": 0
    }
  }
}
```

---

### 4. Get Feedback by Type for User

Retrieve feedback of a specific type received by a user.

**Endpoint:** `GET /feedback/user/:userId/type/:feedbackType`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | MongoDB ObjectId of the user |
| feedbackType | string | Feedback type: `seller`, `delivery`, `product` |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Feedback by type retrieved successfully",
  "data": [
    {
      "_id": "64f3b2c4d5e6f7g8h9i0j2k3",
      "feedbackType": "seller",
      "rating": 5,
      "comment": "Excellent seller",
      "createdAt": "2025-01-15T16:45:00.000Z"
    }
  ]
}
```

---

### 5. Get My Feedback for Trade

Retrieve the current user's feedback for a specific trade and feedback type.

**Endpoint:** `GET /feedback/my/:tradeId/:feedbackType`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| tradeId | string | MongoDB ObjectId of the trade |
| feedbackType | string | Feedback type: `seller`, `delivery`, `product` |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Feedback retrieved successfully",
  "data": {
    "_id": "64f3b2c4d5e6f7g8h9i0j2k3",
    "trade": "64f2a1b3c4d5e6f7g8h9i0j1",
    "feedbackType": "seller",
    "rating": 5,
    "comment": "Excellent seller",
    "tags": ["responsive", "professional"],
    "details": {},
    "createdAt": "2025-01-15T16:45:00.000Z",
    "updatedAt": "2025-01-15T16:45:00.000Z"
  }
}
```

**Note:** Returns `null` in data if no feedback exists.

---

### 6. Update Feedback

Update the current user's existing feedback for a trade.

**Endpoint:** `PUT /feedback/my/:tradeId/:feedbackType`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| tradeId | string | MongoDB ObjectId of the trade |
| feedbackType | string | Feedback type: `seller`, `delivery`, `product` |

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Updated review - good overall experience",
  "tags": ["responsive"],
  "details": {
    "communication": "Good"
  }
}
```

**Validation Rules (UpdateFeedbackDto):**

| Field | Type | Rules | Description |
|-------|------|-------|-------------|
| rating | number | Required, min: 1, max: 5 | Updated star rating |
| comment | string | Optional | Updated text feedback |
| tags | string[] | Optional | Updated tags |
| details | object | Optional | Updated details |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Feedback updated successfully",
  "data": {
    "_id": "64f3b2c4d5e6f7g8h9i0j2k3",
    "rating": 4,
    "comment": "Updated review - good overall experience",
    "updatedAt": "2025-01-16T10:30:00.000Z"
  }
}
```

---

### 7. Get Seller Feedback Dashboard

Retrieve feedback dashboard data for the authenticated seller.

**Endpoint:** `GET /feedback/seller/dashboard`

**Authentication:** Required (signed cookie)

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Seller feedback dashboard retrieved successfully",
  "data": {
    "summary": {
      "totalReviews": 45,
      "averageRating": 4.7,
      "byType": {
        "seller": {
          "count": 20,
          "averageRating": 4.8
        },
        "delivery": {
          "count": 15,
          "averageRating": 4.5
        },
        "product": {
          "count": 10,
          "averageRating": 4.7
        }
      },
      "ratingBreakdown": {
        "5": 30,
        "4": 10,
        "3": 3,
        "2": 1,
        "1": 1
      }
    },
    "recentFeedback": [
      {
        "_id": "64f3b2c4d5e6f7g8h9i0j2k3",
        "feedbackType": "seller",
        "rating": 5,
        "comment": "Great experience!",
        "createdAt": "2025-01-15T16:45:00.000Z"
      }
    ],
    "productBreakdown": [
      {
        "productId": "...",
        "productName": "Premium Rice",
        "averageRating": 4.8,
        "count": 5
      }
    ]
  }
}
```

---

### 8. Get Average Rating for User

Retrieve the average rating and rating breakdown for a specific user.

**Endpoint:** `GET /feedback/user/:userId/rating`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | MongoDB ObjectId of the user |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Average rating retrieved successfully",
  "data": {
    "average": 4.6,
    "count": 25
  }
}
```

---

### 9. Check if User Left Feedback

Check if the current user has already submitted feedback for a specific trade and type.

**Endpoint:** `GET /feedback/check/:tradeId/:feedbackType`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| tradeId | string | MongoDB ObjectId of the trade |
| feedbackType | string | Feedback type: `seller`, `delivery`, `product` |

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Feedback check completed",
  "data": {
    "hasLeftFeedback": true
  }
}
```

---

## Data Models

### Feedback Schema

```typescript
{
  _id: ObjectId;
  trade: ObjectId;           // Ref: Trade (required)
  product?: ObjectId;        // Ref: Product (optional, for product feedback)
  reviewer: ObjectId;        // Ref: User - who submitted the feedback
  reviewee: ObjectId;        // Ref: User - who is being reviewed
  feedbackType: FeedbackType;
  rating: number;            // 1-5 stars
  comment: string;           // Text feedback (default: '')
  tags?: string[];           // Descriptive tags
  details?: Record<string, string>;  // Key-value detail pairs
  createdAt: Date;
  updatedAt: Date;
}
```

### FeedbackType Enum

```typescript
type FeedbackType = 'seller' | 'delivery' | 'product';
```

---

## Error Handling

All endpoints follow a consistent error pattern:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created (new feedback) |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (no valid cookie) |
| 404 | Not Found (trade or feedback not found) |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

---

## Example Requests

### Submit Seller Feedback
```bash
curl -X POST "http://localhost:3001/feedback" \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "tradeId": "64f2a1b3c4d5e6f7g8h9i0j1",
    "feedbackType": "seller",
    "rating": 5,
    "comment": "Excellent seller!",
    "tags": ["responsive", "professional"]
  }'
```

### Get My Feedback for Trade
```bash
curl -X GET "http://localhost:3001/feedback/my/64f2a1b3c4d5e6f7g8h9i0j1/seller" \
  -H "Cookie: account=s%3A<signed-token>"
```

### Update Feedback
```bash
curl -X PUT "http://localhost:3001/feedback/my/64f2a1b3c4d5e6f7g8h9i0j1/seller" \
  -H "Content-Type: application/json" \
  -H "Cookie: account=s%3A<signed-token>" \
  -d '{
    "rating": 4,
    "comment": "Good experience overall"
  }'
```

### Check if Feedback Exists
```bash
curl -X GET "http://localhost:3001/feedback/check/64f2a1b3c4d5e6f7g8h9i0j1/seller" \
  -H "Cookie: account=s%3A<signed-token>"
```

### Get Seller Dashboard
```bash
curl -X GET "http://localhost:3001/feedback/seller/dashboard" \
  -H "Cookie: account=s%3A<signed-token>"
```

---

## Frontend Integration Notes

1. **Feedback Flow:** After a trade is completed, prompt the buyer to leave feedback for seller, delivery, and product separately.

2. **Check Before Showing Form:** Use `/feedback/check/:tradeId/:feedbackType` to determine if the user has already submitted feedback before showing the form.

3. **Star Rating Component:** Implement a 1-5 star rating component. Rating is required for all feedback submissions.

4. **Edit Capability:** Users can update their feedback using the PUT endpoint. Show an "Edit" option if feedback already exists.

5. **Seller Profile:** Display average rating and recent feedback on seller profiles using `/feedback/user/:userId/rating`.

6. **Dashboard:** Sellers can view their feedback analytics via `/feedback/seller/dashboard`.

7. **Tags:** Provide predefined tag options (responsive, professional, timely, etc.) for consistent categorization.

---

## Related Modules
- **Trade Module:** Feedback is linked to completed trades
- **Users Module:** Reviewer and reviewee references
- **Products Module:** Product feedback links to specific products

## Related
- [[api/trade]] — Trade ratings
- [[MOC-API]]
