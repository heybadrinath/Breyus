# Wishlist API

## Overview
The Wishlist API allows users to save products they're interested in for later viewing. It provides functionality to add, remove, and retrieve wishlist items.

## Base URL
```
/wishlist
```

## Authentication
All endpoints require authentication via signed cookie.

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
    "_id": "string",
    "userId": "string",
    "productId": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "error message"
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
- Creates a new wishlist item document

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
  "message": "Product removed from wishlist",
  "deletedCount": 1
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": "error message"
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
- Returns success even if item doesn't exist (idempotent operation)

---

### 3. Get User's Wishlist

Retrieves all products in the user's wishlist.

**Endpoint:** `GET /wishlist`

**Authentication:** Required (signed cookie)

**Request:** No parameters required

**Response:**

**Success (200 OK):**
```json
[
  {
    "_id": "string",
    "name": "string",
    "description": "string",
    "price": "string",
    "currency": "string",
    "category": "string",
    "productImages": ["string"],
    "stock": "string",
    "stockUnit": "string",
    "moq": "string",
    "moqUnit": "string",
    "hsnCode": "string",
    "userId": "string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  // ... more products
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
- Products are sorted by addition date (most recent first, typically)
- Only returns products that still exist (deleted products are filtered out)

---

## Data Models

### Wishlist Schema
```typescript
{
  _id: ObjectId;
  user: ObjectId;      // Ref: User (required)
  product: ObjectId;   // Ref: Product (required)
  dateAdded: Date;     // When added to wishlist (default: Date.now)
}
```

**Indexes:**
- Unique compound index on `(user, product)` to prevent duplicate entries

**Note:** The GET endpoint populates the full product details from the Product collection.

---

## Frontend Integration Notes

1. **Wishlist Button:**
   - Show "Add to Wishlist" / "Remove from Wishlist" toggle
   - Use heart icon or bookmark icon
   - Indicate current state (filled vs outline)
   - Optimistic UI updates with rollback on error

2. **Product Cards:**
   - Add wishlist button to each product card
   - Update button state after add/remove
   - Show loading state during API call
   - Handle errors gracefully

3. **Wishlist Page:**
   - Fetch wishlist on page load using GET endpoint
   - Display products in grid or list layout
   - Each product should have:
     - Product image
     - Name and description
     - Price
     - "Remove from Wishlist" button
     - "View Details" link
     - "Create Trade" button
   - Show empty state when wishlist is empty

4. **State Management:**
   ```javascript
   // Example state management
   const [wishlist, setWishlist] = useState([]);
   const [wishlisted, setWishlisted] = useState(new Set());
   
   // Check if product is wishlisted
   const isWishlisted = (productId) => wishlisted.has(productId);
   
   // Toggle wishlist
   const toggleWishlist = async (productId) => {
     if (isWishlisted(productId)) {
       await removeFromWishlist(productId);
     } else {
       await addToWishlist(productId);
     }
   };
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

6. **Wishlist Count:**
   - Display wishlist count in navigation/header
   - Update count after add/remove operations
   - Use `wishlist.length` from GET response

7. **Product Availability:**
   - Handle cases where product has been deleted
   - Show "Product no longer available" message
   - Provide option to remove unavailable products

8. **Empty State:**
   ```jsx
   {wishlist.length === 0 ? (
     <EmptyState>
       <Icon />
       <h3>Your wishlist is empty</h3>
       <p>Save products you're interested in</p>
       <Button to="/products">Browse Products</Button>
     </EmptyState>
   ) : (
     <ProductGrid products={wishlist} />
   )}
   ```

---

## Common Use Cases

### 1. Browsing Products
- User sees a product they like
- Clicks "Add to Wishlist" button
- Product is saved for later review

### 2. Comparing Options
- User saves multiple similar products
- Reviews wishlist to compare prices and features
- Makes decision and creates trade

### 3. Delayed Purchase
- User finds product but isn't ready to buy
- Saves to wishlist
- Returns later to complete purchase

---

## Best Practices

1. **Duplicate Prevention:**
   - Check if product is already wishlisted before showing "Add" button
   - Show "Remove" button if already wishlisted
   - Backend prevents duplicate entries

2. **User Feedback:**
   - Show toast notification on add/remove
   - Animate button state changes
   - Provide visual confirmation

3. **Performance:**
   - Cache wishlist data locally
   - Update cache on add/remove
   - Refresh on page load or user action

4. **Accessibility:**
   - Use aria-label for wishlist buttons
   - Announce state changes to screen readers
   - Keyboard navigation support

---

## Error Handling

### Common Errors and Solutions

**"Product already in wishlist"**
- Update UI to show "Remove" button
- Sync local state with server state

**"Product not found"**
- Product may have been deleted
- Remove from wishlist
- Show notification to user

**"Invalid token"**
- Redirect to login
- Preserve intended action for after login

**Network errors**
- Retry failed operations
- Show offline indicator
- Queue operations for when online

---

## Related Modules
- **Products Module:** Wishlist contains product references
- **Auth Module:** User authentication required
- **Users Module:** Wishlist associated with userId
- **Trade Module:** Users can create trades from wishlisted products
