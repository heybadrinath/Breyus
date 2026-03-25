# Wishlist API

## Overview
The Wishlist API allows users to save items for later viewing. It supports three types of wishlist items:
1. **Products** - Platform products users are interested in
2. **Saved Contacts** - AI-sourced off-platform companies from search results
3. **Favourite Companies** - Platform companies users want to track

## Base URL
```
/wishlist
```

## Authentication
All endpoints require authentication via signed cookie. Protected by AuthGuard which validates:
- Cookie-based JWT authentication
- User existence in database
- User is not suspended

---

## Endpoints

### 1. Add Product to Wishlist

Adds a product to the user's wishlist.

**Endpoint:** `POST /wishlist`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "productId": "string"  // MongoDB ObjectId of the product
}
```

**Response:**

**Success (200 OK):**
```json
{
  "success": true,
  "item": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "product": "507f1f77bcf86cd799439013",
    "sourceType": "product",
    "dateAdded": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "Product already in wishlist"
}
```
*Possible reasons:*
- Product already in wishlist
- Invalid product ID
- Product not found

**401 Unauthorized:**
```json
"No valid cookie found"
```
or
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

**Implementation Notes:**
- Extracts `userId` from the JWT token
- Prevents duplicate entries for the same product
- Creates a new wishlist item document with `sourceType: "product"`

---

### 2. Remove Product from Wishlist

Removes a product from the user's wishlist.

**Endpoint:** `DELETE /wishlist`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "productId": "string"  // MongoDB ObjectId of the product to remove
}
```

**Response:**

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Removed from wishlist"
}
```

**Error Responses:**

**400 Bad Request / 404 Not Found:**
```json
{
  "error": "Wishlist item not found"
}
```
*Possible reasons:*
- Product not in wishlist
- Invalid product ID

**401 Unauthorized:**
```json
"No valid cookie found"
```
or
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

**Implementation Notes:**
- Removes the wishlist item matching userId and productId
- Throws NotFoundException if item doesn't exist

---

### 3. Get User's Wishlist (Products)

Retrieves all products in the user's wishlist.

**Endpoint:** `GET /wishlist`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Product Name",
    "description": "Product description",
    "price": 1000,
    "salePrice": 800,
    "currency": "USD",
    "onSale": true,
    "productImages": ["image1.jpg", "image2.jpg"],
    "images": ["image1.jpg", "image2.jpg"],
    "primaryImage": "image1.jpg",
    "category": "Electronics",
    "stock": 100,
    "stockUnit": "pieces",
    "moq": "10",
    "moqUnit": "pieces",
    "isFeatured": false,
    "companyName": "Seller Company",
    "sellerName": "seller@example.com",
    "dateAdded": "2024-01-01T00:00:00.000Z"
  }
]
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "error message"
}
```

**401 Unauthorized:**
```json
"No valid cookie found"
```
or
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

**Implementation Notes:**
- Returns populated product details for all wishlist items
- Returns empty array if wishlist is empty
- Products are sorted by addition date (most recent first)
- Only returns products that still exist (deleted products are filtered out)
- Includes seller company information

---

## Saved Contacts Endpoints (AI Off-Platform Companies)

### 4. Save AI Contact

Saves an AI-sourced contact (off-platform company) to the user's wishlist.

**Endpoint:** `POST /wishlist/contact`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "name": "string",           // Required: Company name
  "email": "string",          // Optional: Email address
  "phone": "string",          // Optional: Phone number
  "country": "string",        // Optional: Country
  "address": "string",        // Optional: Full address
  "commodity": "string",      // Optional: Commodity they trade
  "hsCode": "string",         // Optional: HS code
  "matchScore": 85.5,         // Optional: AI match score (0-100)
  "role": "buyer" | "seller", // Optional: Contact role
  "notes": "string"           // Optional: User notes
}
```

**Response:**

**Success (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Contact saved to wishlist",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "sourceType": "ai_contact",
    "savedContactName": "ABC Trading Co",
    "savedContactEmail": "contact@abc.com",
    "savedContactPhone": "+1234567890",
    "savedContactCountry": "United States",
    "savedContactAddress": "123 Trade St, NY",
    "savedCommodity": "Coffee",
    "savedHsCode": "0901",
    "savedMatchScore": 85.5,
    "savedContactRole": "seller",
    "notes": "Good potential partner",
    "dateAdded": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "error message"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**409 Conflict:**
```json
{
  "statusCode": 409,
  "message": "Contact already saved to wishlist"
}
```

**Implementation Notes:**
- Checks for duplicates by email or (name + country) combination
- Emails are stored lowercase for case-insensitive matching
- Creates wishlist item with `sourceType: "ai_contact"`

---

### 5. Get Saved Contacts

Retrieves all saved AI contacts for the user.

**Endpoint:** `GET /wishlist/contacts`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Saved contacts retrieved",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "ABC Trading Co",
      "email": "contact@abc.com",
      "phone": "+1234567890",
      "country": "United States",
      "address": "123 Trade St, NY",
      "commodity": "Coffee",
      "hsCode": "0901",
      "matchScore": 85.5,
      "role": "seller",
      "notes": "Good potential partner",
      "dateAdded": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "error message"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**Implementation Notes:**
- Returns contacts sorted by dateAdded (most recent first)
- Returns empty array if no contacts saved

---

### 6. Remove Saved Contact

Removes a saved contact from the user's wishlist.

**Endpoint:** `DELETE /wishlist/contact/:id`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `id` (string, required): MongoDB ObjectId of the saved contact

**Request Example:**
```
DELETE /wishlist/contact/507f1f77bcf86cd799439011
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Contact removed from wishlist"
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "error message"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Saved contact not found"
}
```

**Implementation Notes:**
- Only removes contacts owned by the authenticated user
- Verifies `sourceType: "ai_contact"` before deletion

---

### 7. Update Contact Notes

Updates the notes for a saved contact.

**Endpoint:** `PATCH /wishlist/contact/:id/notes`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `id` (string, required): MongoDB ObjectId of the saved contact

**Request Body:**
```json
{
  "notes": "string"  // New notes content
}
```

**Request Example:**
```
PATCH /wishlist/contact/507f1f77bcf86cd799439011/notes
{
  "notes": "Follow up next week about bulk pricing"
}
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Contact notes updated",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "sourceType": "ai_contact",
    "savedContactName": "ABC Trading Co",
    "notes": "Follow up next week about bulk pricing",
    "dateAdded": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "error message"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Saved contact not found"
}
```

**Implementation Notes:**
- Only updates contacts owned by the authenticated user
- Returns the full updated contact document

---

## Favourite Companies Endpoints (Platform Companies)

### 8. Add Favourite Company

Adds a platform company to the user's favourites.

**Endpoint:** `POST /wishlist/favourite-company`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "companyId": "string",  // Required: MongoDB ObjectId of the company
  "notes": "string"       // Optional: User notes about this company
}
```

**Response:**

**Success (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Company added to favourites",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "company": "507f1f77bcf86cd799439013",
    "sourceType": "company",
    "notes": "Great supplier",
    "dateAdded": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "error message"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**409 Conflict:**
```json
{
  "statusCode": 409,
  "message": "Company already in favourites"
}
```

**Implementation Notes:**
- Prevents duplicate company favourites
- Creates wishlist item with `sourceType: "company"`

---

### 9. Remove Favourite Company

Removes a company from the user's favourites.

**Endpoint:** `DELETE /wishlist/favourite-company/:companyId`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `companyId` (string, required): MongoDB ObjectId of the company to remove

**Request Example:**
```
DELETE /wishlist/favourite-company/507f1f77bcf86cd799439013
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Company removed from favourites"
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "error message"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Favourite company not found"
}
```

---

### 10. Get Favourite Companies

Retrieves all favourite companies for the user.

**Endpoint:** `GET /wishlist/favourite-companies`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Favourite companies retrieved",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "companyId": "507f1f77bcf86cd799439013",
      "companyName": "ABC Trading Company",
      "companyAddress": "123 Trade St, Mumbai, India",
      "profilePicture": "uploads/profile-123.jpg",
      "bannerImage": "uploads/banner-123.jpg",
      "isKycVerified": true,
      "primaryEmail": "contact@abc.com",
      "notes": "Great supplier",
      "dateAdded": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "error message"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**Implementation Notes:**
- Returns companies sorted by dateAdded (most recent first)
- Populates company details from Company collection
- Returns empty array if no companies favourited

---

### 11. Check if Company is Favourited

Checks if a specific company is in the user's favourites.

**Endpoint:** `GET /wishlist/favourite-company/:companyId/check`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `companyId` (string, required): MongoDB ObjectId of the company to check

**Request Example:**
```
GET /wishlist/favourite-company/507f1f77bcf86cd799439013/check
```

**Response:**

**Success (200 OK):**
```json
{
  "statusCode": 200,
  "data": {
    "isFavourite": true
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "error message"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "No valid cookie found"
}
```

**Implementation Notes:**
- Returns boolean indicating if company is favourited
- Useful for toggling favourite button state on company profiles

---

## Data Models

### Wishlist Schema
```typescript
{
  _id: ObjectId;
  user: ObjectId;                        // Ref: User (required)

  // For product wishlists
  product?: ObjectId;                    // Ref: Product

  // For company favourites
  company?: ObjectId;                    // Ref: Company

  // Type discriminator
  sourceType: 'product' | 'ai_contact' | 'company';

  // For AI contacts only
  savedContactName?: string;
  savedContactEmail?: string;
  savedContactPhone?: string;
  savedContactCountry?: string;
  savedContactAddress?: string;
  savedCommodity?: string;
  savedHsCode?: string;
  savedMatchScore?: number;
  savedContactRole?: 'buyer' | 'seller';

  // Common fields
  notes?: string;
  dateAdded: Date;                       // Default: Date.now
}
```

**Indexes:**
- Unique compound index on `(user, product)` for product wishlists
- Unique compound index on `(user, savedContactEmail)` for contacts with email
- Unique compound index on `(user, company)` for company favourites
- Compound index on `(user, sourceType)` for efficient type-based queries

---

## Frontend Integration Notes

1. **Product Wishlist Button:**
   - Show "Add to Wishlist" / "Remove from Wishlist" toggle
   - Use heart icon or bookmark icon
   - Indicate current state (filled vs outline)
   - Optimistic UI updates with rollback on error

2. **Saved Contacts Page:**
   - Display AI contacts in a searchable list
   - Allow editing notes inline
   - Show contact details with commodity/HS code
   - One-click remove functionality

3. **Favourite Companies:**
   - Add favourite button to company profile pages
   - Show favourite indicator on search results
   - Use `check` endpoint to determine initial state
   - Display favourites on dedicated page with company details

4. **State Management:**
   ```javascript
   // Example state management
   const [productWishlist, setProductWishlist] = useState([]);
   const [savedContacts, setSavedContacts] = useState([]);
   const [favouriteCompanies, setFavouriteCompanies] = useState([]);

   // Check if product is wishlisted
   const isWishlisted = (productId) =>
     productWishlist.some(p => p.id === productId);

   // Check if company is favourited
   const isFavourited = (companyId) =>
     favouriteCompanies.some(c => c.companyId === companyId);
   ```

5. **Optimistic Updates:**
   ```javascript
   const addToWishlist = async (productId) => {
     // Optimistic update
     setWishlisted(prev => new Set([...prev, productId]));

     try {
       await api.post('/wishlist', { productId });
     } catch (error) {
       // Rollback on error
       setWishlisted(prev => {
         const next = new Set(prev);
         next.delete(productId);
         return next;
       });
       showError('Failed to add to wishlist');
     }
   };
   ```

---

## Common Use Cases

### 1. Browsing Products
- User sees a product they like
- Clicks "Add to Wishlist" button
- Product is saved for later review

### 2. AI Search Results
- User searches for buyers/sellers via AI
- Finds interesting off-platform contacts
- Saves contacts with notes for follow-up

### 3. Company Discovery
- User browses seller profiles
- Favourites companies they want to track
- Reviews favourites when ready to trade

---

## Error Handling

### Common Errors and Solutions

**"Product already in wishlist"**
- Update UI to show "Remove" button
- Sync local state with server state

**"Contact already saved to wishlist"**
- Show notification that contact exists
- Optionally navigate to existing contact

**"Company already in favourites"**
- Update UI to show unfavourite option
- Sync local state

**"Invalid token"**
- Redirect to login
- Preserve intended action for after login

---

## Related Modules
- **Products Module:** Product wishlists contain product references
- **Company Module:** Company favourites reference platform companies
- **AI Module:** Saved contacts sourced from AI search results
- **Auth Module:** User authentication required
- **Trade Module:** Users can create trades from wishlisted products
