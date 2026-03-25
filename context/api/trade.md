---
type: api-doc
module: trade
tags: [api, trade]
---

# Trade API

## Overview
The Trade API manages the complete trade lifecycle including purchase requests, multi-round negotiations, document uploads, trade completion, and disputes. It handles all interactions between buyers and sellers from initial offer to final delivery.

## Base URL
```
/trade
```

## Authentication
All endpoints require authentication via signed cookie. The controller is protected by `AuthGuard` which validates:
- Cookie-based JWT authentication
- User existence in database
- User is not suspended

---

## Trade Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              TRADE LIFECYCLE PHASES                                   │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  [PR] → [NEGOTIATION] → [SCO] → [ICPO] → [SPA] → [PAYMENT] → [BOL] → [COMPLETED]   │
│   │          │            │        │       │         │         │          │            │
│   │          │            │        │       │         │         │          │            │
│   │    Multi-round       Seller   Buyer  Seller    Buyer    Seller     Trade          │
│   │    counter-offers   uploads  uploads uploads   uploads   uploads   archived       │
│   │    (buyer limited                     SPA →                                       │
│   │     to 2 counters)                    Buyer                                       │
│   │                                       uploads                                     │
│   Buyer creates                           signed                                      │
│   purchase request                        SPA                                         │
│   │                       │        │       │         │         │                       │
│   └───────────────────────┴────────┴───────┴─────────┴─────────┘                      │
│                           Any phase can → [CANCELLED]                                 │
│                           (user cancel or auto-cancel                                 │
│                            on rejection limit exceeded)                               │
│                                                                                       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Phase Descriptions:**
- **PR (Purchase Request):** Buyer initiates trade with offer
- **Negotiation:** Multi-round counter-offers between parties (within PR phase)
- **SCO:** Seller uploads Soft Corporate Offer document
- **ICPO:** Buyer uploads Irrevocable Corporate Purchase Order
- **SPA:** Seller uploads SPA → Buyer approves → Buyer uploads signed SPA → Seller approves
- **PAYMENT:** Buyer uploads payment proof
- **BOL:** Seller uploads Bill of Lading
- **COMPLETED:** Trade archived and completed
- **CANCELLED:** Trade cancelled by user or auto-cancelled due to document rejection limits

---

## Endpoints

### PHASE 1: Trade Creation & Negotiation

#### 1. Create Trade / Purchase Request

Creates a new trade/purchase request from a buyer.

**Endpoint:** `POST /trade/create`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "productId": "string",
  "quantity": "string",
  "quantityUnit": "string",

  "buyerOfferedPrice": "string",
  "buyerIncoterms": {
    "selectedIncoterm": "FOB",
    "selectedIncotermData": {
      "Insurance": "Buyer",
      "Freight": "Seller"
    },
    "defaults": {}
  },
  "buyerMessage": "string",

  "selectedAddress": {
    "fullName": "string",
    "mobileNumber": "string",
    "pincode": "string",
    "streetName": "string",
    "landmark": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "additionalDetails": "string"
  },

  "buyerIndustryType": "string",
  "buyerMarketYears": "string",
  "marketCapture": "string",
  "tradeYears": "string",
  "productUsage": "string",
  "nearestPort": "string",
  "buyerCisDocument": "string",

  "paymentMethod": {
    "type": "advance" | "credit" | "openAccount",
    "method": "RTGS" | "LetterOfCredit",
    "percentage": "string",
    "days": "string"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productId | string | Yes | Product MongoDB ObjectId |
| quantity | string | Yes | Requested quantity |
| quantityUnit | string | Yes | Unit for quantity |
| buyerOfferedPrice | string | No | Initial price offer (Step 1) |
| buyerIncoterms | object | No | Incoterm terms (Step 1) |
| buyerMessage | string | No | Message to seller (Step 1) |
| selectedAddress | object | Yes | Delivery address (Step 2) |
| buyerIndustryType | string | No | Buyer's industry type (Step 3) |
| buyerMarketYears | string | Yes | Years in market (Step 3) |
| marketCapture | string | No | Market capture percentage |
| tradeYears | string | Yes | Years in trade |
| productUsage | string | No | Intended product usage |
| nearestPort | string | No | Nearest importing port |
| buyerCisDocument | string | No | Buyer's CIS document path |
| paymentMethod | object | Yes | Payment details (Step 4) |

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Trade created successfully",
  "data": {
    "_id": "string",
    "product": "string",
    "buyer": "string",
    "seller": "string",
    "purchaseRequestStatus": "pending",
    "negotiationStatus": "pending",
    "tradePhase": "PR",
    ...
  }
}
```

---

#### 2. Get User's Trades (Buyer View)

**Endpoint:** `GET /trade/user-trades`

**Authentication:** Required (signed cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trades retrieved successfully",
  "data": [{ "trade objects with populated product, buyer, seller" }]
}
```

---

#### 3. Get Seller's Trades (Seller View)

**Endpoint:** `GET /trade/seller-trades`

**Authentication:** Required (signed cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trades retrieved successfully",
  "data": [{ "trade objects with populated product, buyer, seller" }]
}
```

---

---

#### Get User's Trades (Paginated)

**Endpoint:** `GET /trade/user-trades/paginated`

**Authentication:** Required (signed cookie)

**Query Parameters:**
- `page`: number (default 1)
- `limit`: number (default 10)
- `status`: string (optional)
- `phase`: string (optional)
- `search`: string (optional)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Paginated trades retrieved successfully",
  "data": {
    "trades": [...],
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

---

#### Get Seller's Trades (Paginated)

**Endpoint:** `GET /trade/seller-trades/paginated`

**Authentication:** Required (signed cookie)

Same parameters and response format as User's Trades.

---

#### Get Unread Counts

**Endpoint:** `GET /trade/unread-counts`

**Authentication:** Required (signed cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Unread counts retrieved successfully",
  "data": {
    "pr": 0,
    "po": 0,
    "spa": 0,
    "ongoing": 0,
    "history": 0
  }
}
```

**Implementation Notes:**
- Combines unread counts across buyer and seller roles
- Excludes cancelled trades older than 2 days
- Tab categorization: PR (pending negotiations), PO (accepted + PR/SCO/ICPO phase), SPA (SPA phase), Ongoing (PAYMENT/BOL phase), History (completed/rejected/cancelled)

---

#### Mark As Read

**Endpoint:** `PUT /trade/mark-read/:tabType`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `tabType`: 'pr' | 'po' | 'spa' | 'ongoing' | 'history'

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trades marked as read",
  "data": {
    "tabType": "pr",
    "markedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 4. Get Trade by ID

**Endpoint:** `GET /trade/:id`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Trade MongoDB ObjectId |

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trade retrieved successfully",
  "data": { "complete trade object with all fields populated" }
}
```

---

#### 5. Submit Counter Offer (Seller)

Seller submits a counter-offer to the buyer's initial or previous offer.

**Endpoint:** `POST /trade/:id/counter-offer`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Trade MongoDB ObjectId |

**Request Body:**
```json
{
  "offeredPrice": "string",
  "offeredIncoterms": {
    "selectedIncoterm": "CIF",
    "selectedIncotermData": {}
  },
  "message": "string"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Counter-offer submitted successfully",
  "data": { "full updated trade object" }
}
```

**Implementation Notes:**
- Only seller can submit counter-offers
- Validates negotiation state machine (must be in `pending` or `buyer_responded` state)
- If `isNegotiationLocked` is true (buyer exhausted counters), returns 403
- Updates `negotiationStatus` to "countered"
- Increments `currentNegotiationRound`
- Adds entry to `negotiationHistory`
- Parses `offeredPrice` from string to number via `parseFloat`
- Sets unread flag for buyer

---

#### 6. Buyer Respond to Counter Offer

Buyer responds to seller's counter-offer with acceptance or counter.

**Endpoint:** `POST /trade/:id/buyer-respond`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "offeredPrice": "string",
  "offeredIncoterms": {
    "selectedIncoterm": "FOB",
    "selectedIncotermData": {}
  },
  "message": "string"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Response submitted successfully",
  "data": { "full updated trade object" },
  "counterInfo": {
    "countersUsed": 1,
    "maxCounters": 2,
    "remainingCounters": 1,
    "isLocked": false
  }
}
```

**Implementation Notes:**
- Only buyer can respond to counter-offers
- Validates negotiation state machine (must be in `countered` state)
- Increments `buyerCounterCount`; if `buyerCounterCount >= maxBuyerCounters`, sets `isNegotiationLocked: true`
- Parses `offeredPrice` from string to number via `parseFloat`
- Sets unread flag for seller
- Sends last-counter warning email when one counter remains
- Sends final-offer notification to seller when negotiation locks

---

#### 7. Accept Trade

Either party accepts the current offer, moving to document phase.

**Endpoint:** `PUT /trade/:id/accept`

**Authentication:** Required (signed cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trade accepted successfully",
  "data": {
    "negotiationStatus": "accepted",
    "purchaseRequestStatus": "accepted",
    "tradePhase": "SCO",
    "acceptedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Implementation Notes:**
- Either buyer or seller can accept
- Sets `negotiationStatus` to "accepted"
- Advances `tradePhase` to "SCO"
- Records `acceptedAt` timestamp

---

#### 8. Reject Trade

Either party rejects the trade with an optional reason.

**Endpoint:** `PUT /trade/:id/reject`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "reason": "string"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trade rejected",
  "data": {
    "negotiationStatus": "rejected",
    "purchaseRequestStatus": "rejected",
    "rejectionReason": "string",
    "rejectedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

---

#### Cancel Trade

**Endpoint:** `PUT /trade/:id/cancel`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "reason": "string"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Conditional | Optional for PR phase; required for SCO phase. Max 500 characters |

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trade cancelled successfully",
  "data": { "full updated trade object" }
}
```

**Implementation Notes:**
- Either buyer or seller can cancel
- Trade must not already be closed (rejected, cancelled, or completed)
- Only cancellable in PR or SCO phases; trades past SCO with accepted negotiation cannot be cancelled
- Reason is required for SCO phase cancellations
- Sets `tradePhase` to "CANCELLED", `negotiationStatus` to "cancelled"
- Records `cancelledAt`, `cancelledBy`, `cancellationReason`
- Restores product stock on cancellation

---

#### 9. Get Negotiation History

Retrieves the complete negotiation history for a trade.

**Endpoint:** `GET /trade/:id/history`

**Authentication:** Required (signed cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Negotiation history retrieved successfully",
  "data": {
    "tradeId": "string",
    "negotiationStatus": "countered",
    "currentRound": 2,
    "history": [
      {
        "round": 1,
        "party": "buyer",
        "offeredPrice": 10000,
        "offeredIncoterms": {},
        "message": "Initial offer",
        "timestamp": "2024-01-01T00:00:00.000Z"
      },
      {
        "round": 2,
        "party": "seller",
        "offeredPrice": 12000,
        "message": "Counter offer",
        "timestamp": "2024-01-01T01:00:00.000Z"
      }
    ],
    "buyerCurrentOffer": {
      "price": 10000,
      "incoterms": {},
      "message": "string"
    },
    "sellerCurrentOffer": {
      "price": 12000,
      "incoterms": {},
      "message": "string"
    }
  }
}
```

---

---

#### Get Audit History

Returns a timeline of all actions performed on the trade.

**Endpoint:** `GET /trade/:id/audit-history`

**Authentication:** Required (signed cookie)

**Query Parameters:**
- `limit`: number (default: 50)
- `offset`: number (default: 0)
- `action`: string (filter by action type)

**Valid Action Types:** `trade_created`, `counter_offer`, `buyer_response`, `accepted`, `rejected`, `cancelled`, `document_uploaded`, `document_replaced`, `document_verified`, `document_rejected`, `phase_advanced`, `trade_completed`, `signature_added`

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Audit history retrieved successfully",
  "data": {
    "logs": [
      {
        "_id": "string",
        "trade": "string",
        "performedBy": { "_id": "string", "mail": "string" },
        "action": "trade_created",
        "details": "string",
        "previousState": {},
        "newState": {},
        "documentType": "string",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10
  }
}
```

---

### PHASE 2: Document Upload Endpoints

#### 10. Upload SCO (Soft Corporate Offer)

Seller uploads SCO document after negotiation acceptance.

**Endpoint:** `POST /trade/:id/upload-sco`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request:**
- File: Document file (PDF, etc.)
- Body:
```json
{
  "notes": "string",
  "termsAccepted": "true"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "SCO uploaded successfully",
  "data": {
    "scoDocument": {
      "filePath": "string",
      "originalName": "string",
      "mimeType": "application/pdf",
      "size": 12345,
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "uploadedBy": "string",
      "status": "uploaded"
    },
    "tradePhase": "SCO"
  }
}
```

**Permissions:** Only seller can upload SCO

---

#### 11. Upload ICPO (Irrevocable Corporate Purchase Order)

Buyer uploads ICPO document after receiving SCO.

**Endpoint:** `POST /trade/:id/upload-icpo`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request:**
- File: Document file
- Body:
```json
{
  "notes": "string",
  "icpoReference": "string"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "ICPO uploaded successfully",
  "data": {
    "icpoDocument": {...},
    "tradePhase": "ICPO"
  }
}
```

**Permissions:** Only buyer can upload ICPO

---

#### 12. Upload SPA (Sales Purchase Agreement)

Either party uploads SPA document.

**Endpoint:** `POST /trade/:id/upload-spa`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request:**
- File: Document file
- Body:
```json
{
  "notes": "string",
  "signingParty": "buyer" | "seller"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "SPA uploaded successfully",
  "data": {
    "spaDocument": {...},
    "tradePhase": "SPA"
  }
}
```

**Permissions:** Either buyer or seller can upload

---

#### 13. Upload Payment Proof

Buyer uploads payment proof document.

**Endpoint:** `POST /trade/:id/upload-payment-proof`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request:**
- File: Document file
- Body:
```json
{
  "notes": "string",
  "amount": "string",
  "transactionId": "string",
  "paymentDate": "string"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Payment proof uploaded successfully",
  "data": {
    "paymentProof": {...},
    "tradePhase": "PAYMENT"
  }
}
```

**Permissions:** Only buyer can upload payment proof

---

#### 14. Upload BoL (Bill of Lading)

Seller uploads Bill of Lading after payment verification.

**Endpoint:** `POST /trade/:id/upload-bol`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request:**
- File: Document file
- Body:
```json
{
  "notes": "string",
  "bolNumber": "string",
  "shippingCarrier": "string",
  "vesselName": "string"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Bill of Lading uploaded successfully",
  "data": {
    "bolDocument": {...},
    "tradePhase": "BOL"
  }
}
```

**Permissions:** Only seller can upload BoL

---

#### 15. Get Trade Documents

Retrieves all documents for a trade.

**Endpoint:** `GET /trade/:id/documents`

**Authentication:** Required (signed cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trade documents retrieved successfully",
  "data": {
    "tradeId": "string",
    "tradePhase": "SPA",
    "documents": {
      "sco": { "DocumentInfo or null" },
      "icpo": { "DocumentInfo or null" },
      "spa": { "SPADocumentInfo or null" },
      "signedSpa": { "DocumentInfo or null" },
      "bol": { "DocumentInfo or null" },
      "paymentProof": { "DocumentInfo or null" }
    },
    "timestamps": {
      "scoSubmittedAt": "date or null",
      "icpoSubmittedAt": "date or null",
      "spaUploadedAt": "date or null",
      "spaSellerSignedAt": "date or null",
      "spaBuyerSignedAt": "date or null",
      "signedSpaSubmittedAt": "date or null",
      "signedSpaApprovedAt": "date or null",
      "paymentVerifiedAt": "date or null",
      "bolUploadedAt": "date or null",
      "completedAt": "date or null",
      "autoCancelledAt": "date or null",
      "disputeEligibilityEndsAt": "date or null"
    },
    "spaStatus": {
      "uploaded": true,
      "sellerSigned": false,
      "buyerSigned": false,
      "fullySigned": false
    },
    "spaApprovalStatus": {
      "spaUploaded": true,
      "spaApproved": false,
      "signedSpaUploaded": false,
      "signedSpaApproved": false
    }
  }
}
```

**Implementation Notes:**
- `spaStatus` is legacy backward-compatibility field
- `spaApprovalStatus` is the new Phase 2 SPA approval flow status

---

---

#### Download Document

Streams the file back to the client with proper Content-Disposition header.

**Endpoint:** `GET /trade/:id/document/:type/download`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `type`: 'sco' | 'icpo' | 'spa' | 'bol' | 'payment-proof'

**Response:** File stream with headers `Content-Type` and `Content-Disposition`

---

#### Get Document Versions

**Endpoint:** `GET /trade/:id/document/:type/versions`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `type`: 'sco' | 'icpo' | 'spa' | 'bol' | 'payment-proof'

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Document versions retrieved successfully",
  "data": {
    "currentVersion": {
      "filePath": "string",
      "originalName": "string",
      "mimeType": "string",
      "size": 12345,
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "uploadedBy": "string",
      "version": 2,
      "isCurrent": true
    },
    "versions": [ "array of all versions (current + history), newest first" ],
    "totalVersions": 2
  }
}
```

---

#### Download Document Version

**Endpoint:** `GET /trade/:id/document/:type/version/:version/download`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `type`: 'sco' | 'icpo' | 'spa' | 'bol' | 'payment-proof'
- `version`: number (must be >= 1)

**Response:** File stream with headers `Content-Type` and `Content-Disposition`

---

#### 16. Verify Document

Verify or reject a document (for the receiving party).

**Endpoint:** `PUT /trade/:id/verify-document`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "documentType": "sco" | "icpo" | "spa" | "signed-spa" | "bol" | "payment-proof",
  "status": "pending" | "uploaded" | "approved" | "rejected",
  "verificationNotes": "string"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Document verified successfully",
  "data": {
    "trade": { "full updated trade object" },
    "document": { "updated document object" },
    "phaseAdvanced": true,
    "newPhase": "ICPO"
  }
}
```

**Response (200 OK - Auto-cancelled due to rejection limit exceeded):**
```json
{
  "statusCode": 200,
  "message": "Document rejected. Trade has been automatically cancelled due to exceeding maximum upload attempts.",
  "data": {
    "trade": { "full updated trade object" },
    "document": { "updated document object" },
    "autoCancelled": true,
    "newPhase": "CANCELLED"
  }
}
```

**Verification Rules:**
- SCO → Buyer verifies
- ICPO → Seller verifies
- SPA → Either party verifies
- Signed SPA → Seller verifies
- Payment Proof → Seller verifies
- BoL → Buyer verifies

**Phase Advancement on Approval:**
- SCO approved → advances to ICPO phase
- ICPO approved → advances to SPA phase
- SPA approved → no phase change (buyer must upload signed SPA)
- Signed SPA approved → advances to PAYMENT phase
- Payment Proof approved → advances to BOL phase

**Rejection Tracking:**
- Each rejection increments the document's `rejectionCount`
- If `rejectionCount >= maxAttempts`, trade is auto-cancelled
- Max attempts: 2 for most documents, 3 for BoL

---

---

#### Sign Document

Sign a document with e-signature.

**Endpoint:** `PUT /trade/:id/document/:type/sign`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `type`: 'sco' | 'icpo' | 'spa' | 'bol'

**Request Body:**
```json
{
  "signatureDataUrl": "string (Base64 PNG data URL, required)"
}
```

**Signing Rules:**
- SCO → Seller signs
- ICPO → Buyer signs
- SPA → Either party can sign
- BoL → Seller signs

---

### PHASE 3: Trade Completion

#### 17. Advance Trade Phase

Manually advance trade to next phase.

**Endpoint:** `PUT /trade/:id/advance-phase`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "newPhase": "PR" | "SCO" | "ICPO" | "SPA" | "PAYMENT" | "BOL" | "COMPLETED",
  "reason": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trade phase advanced",
  "data": {
    "tradePhase": "ICPO"
  }
}
```

---

#### 18. Complete Trade

Marks trade as completed (final step).

**Endpoint:** `PUT /trade/:id/complete`

**Authentication:** Required (signed cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trade completed successfully",
  "data": {
    "tradePhase": "COMPLETED",
    "completedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

---

#### Generate Invoice

Generates PDF invoice for completed trades.

**Endpoint:** `GET /trade/:id/invoice`

**Authentication:** Required (signed cookie)

**Response:** PDF File Stream with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="invoice-ORD-XXXXXXXX.pdf"`

**Error Responses:**

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
  "message": "Trade not found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to generate invoice"
}
```

---

#### Generate Purchase Request PDF

Generates PDF of the Purchase Request. Available as soon as a trade is created.

**Endpoint:** `GET /trade/:id/purchase-request-pdf`

**Authentication:** Required (signed cookie)

**Response:** PDF File Stream with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="purchase-request-PR-XXXXXXXX.pdf"`

**Error Responses:**

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
  "message": "Trade not found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to generate purchase request PDF"
}
```

---

#### Generate Purchase Order PDF

Generates PDF of the Purchase Order. Only available after negotiation is accepted.

**Endpoint:** `GET /trade/:id/purchase-order-pdf`

**Authentication:** Required (signed cookie)

**Response:** PDF File Stream with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="purchase-order-PO-XXXXXXXX.pdf"`

**Error Responses:**

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Purchase Order is only available after the trade has been accepted"
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
  "message": "Trade not found"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Failed to generate purchase order PDF"
}
```

---

#### Upload Signed SPA

Buyer uploads their signed copy of the SPA after seller's SPA is approved.

**Endpoint:** `POST /trade/:id/upload-signed-spa`

**Authentication:** Required (signed cookie)

**Content-Type:** `multipart/form-data`

**Request:**
- File: Document file
- Body:
```json
{
  "notes": "string",
  "signingParty": "buyer" | "seller"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Signed SPA uploaded successfully",
  "data": {
    "signedSpaDocument": {...},
    "tradePhase": "SPA"
  }
}
```

**Flow:** Seller uploads SPA -> Buyer approves -> Buyer uploads signed SPA -> Seller approves

**Permissions:** Only buyer can upload signed SPA

---

### PHASE 4: Dispute Management (User-facing)

#### Raise a Dispute

Creates a new dispute on a trade. Either buyer or seller can raise a dispute.

**Endpoint:** `POST /trade/:id/dispute`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Trade MongoDB ObjectId |

**Request Body:**
```json
{
  "reason": "payment_issue" | "quality_issue" | "delivery_delay" | "documentation_problem" | "communication_issue" | "pricing_dispute" | "contract_breach" | "other",
  "description": "string (20-2000 chars)",
  "priority": "low" | "medium" | "high" | "urgent"
}
```

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| reason | string | Yes | — | One of: `payment_issue`, `quality_issue`, `delivery_delay`, `documentation_problem`, `communication_issue`, `pricing_dispute`, `contract_breach`, `other` |
| description | string | Yes | — | Min 20, max 2000 characters |
| priority | string | No | `medium` | One of: `low`, `medium`, `high`, `urgent` |

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Dispute raised successfully",
  "data": {
    "_id": "string",
    "trade": "string",
    "raisedBy": "string",
    "raisedByRole": "buyer" | "seller",
    "reason": "string",
    "priority": "string",
    "status": "open",
    "description": "string",
    "createdAt": "2024-01-01T00:00:00.000Z"
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

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "You are not authorized to raise a dispute on this trade"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Trade not found"
}
```

---

#### Get Trade Dispute

Returns the active or most recent dispute for a trade.

**Endpoint:** `GET /trade/:id/dispute`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Trade MongoDB ObjectId |

**Response (200 OK - Dispute exists):**
```json
{
  "statusCode": 200,
  "message": "Dispute retrieved successfully",
  "data": {
    "_id": "string",
    "trade": "string",
    "type": "string",
    "priority": "string",
    "status": "open" | "in_progress" | "resolved" | "escalated" | "closed",
    "subject": "string",
    "description": "string",
    "assignedTo": "string",
    "resolution": "string",
    "messages": [...]
  }
}
```

**Response (200 OK - No dispute):**
```json
{
  "statusCode": 200,
  "message": "No dispute found for this trade",
  "data": null
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

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Trade not found"
}
```

---

#### Add Dispute Message

Adds a message to an existing dispute. Only buyer or seller involved in the trade can add messages.

**Endpoint:** `POST /trade/:id/dispute/message`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Trade MongoDB ObjectId |

**Request Body:**
```json
{
  "content": "string (1-2000 chars)",
  "isInternal": false
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| content | string | Yes | — | Message content (1-2000 chars) |
| isInternal | boolean | No | `false` | Admin-only notes, not visible to users |

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Message added successfully",
  "data": {
    "_id": "string",
    "dispute": "string",
    "sender": "string",
    "senderRole": "buyer" | "seller",
    "content": "string",
    "isInternal": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
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

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "You are not authorized to add messages to this dispute"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "No dispute found for this trade"
}
```

---

#### Get Dispute Messages

Returns all non-internal messages for the dispute on a trade.

**Endpoint:** `GET /trade/:id/dispute/messages`

**Authentication:** Required (signed cookie)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Trade MongoDB ObjectId |

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "_id": "string",
      "sender": "string",
      "senderRole": "buyer" | "seller" | "admin",
      "content": "string",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
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

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "No dispute found for this trade"
}
```

**Implementation Notes:**
- Internal admin messages are excluded from user-facing endpoint
- Messages are sorted by creation date

---

## Data Models

### Trade Schema
```typescript
{
  _id: ObjectId;
  product: ObjectId;
  buyer: ObjectId;
  seller: ObjectId;

  // Status
  purchaseRequestStatus: 'pending' | 'accepted' | 'rejected';
  purchaseOrderStatus: 'pending' | 'confirmed' | 'completed';
  negotiationStatus: 'pending' | 'countered' | 'buyer_responded' | 'accepted' | 'rejected' | 'cancelled';
  tradePhase: 'PR' | 'SCO' | 'ICPO' | 'SPA' | 'PAYMENT' | 'BOL' | 'COMPLETED' | 'CANCELLED';

  // Trade Details
  quantity: number;               // Min: 1
  quantityUnit: string;
  selectedAddress: Address;
  paymentMethod: PaymentMethod;

  // Buyer Terms
  buyerOfferedPrice?: number;     // Min: 0
  buyerIncoterms?: Incoterms;
  buyerMessage?: string;

  // Seller Terms
  sellerOfferedPrice?: number;    // Min: 0
  sellerOfferedIncoterms?: Incoterms;
  sellerMessage?: string;

  // Negotiation
  currentNegotiationRound: number;
  negotiationHistory: NegotiationEntry[];
  rejectionReason?: string;
  acceptedAt?: Date;
  rejectedAt?: Date;

  // Negotiation Counter Limits
  buyerCounterCount: number;       // Default: 0. Times buyer has countered
  maxBuyerCounters: number;        // Default: 2. Max allowed buyer counters
  isNegotiationLocked: boolean;    // Default: false. True when buyer exhausted counters
  lastCounterWarningAt?: Date;     // When "last counter" warning email was sent

  // Documents
  scoDocument?: DocumentInfo;
  icpoDocument?: DocumentInfo;
  spaDocument?: SPADocumentInfo;   // Extends DocumentInfo with deprecated dual-signature fields
  paymentProof?: DocumentInfo;
  bolDocument?: DocumentInfo;
  signedSpaDocument?: DocumentInfo; // Buyer's signed SPA (separate from seller's SPA)

  // Document Rejection Tracking
  scoRejectionTracking: DocumentRejectionTracking;           // Default: { rejectionCount: 0, maxAttempts: 2 }
  icpoRejectionTracking: DocumentRejectionTracking;          // Default: { rejectionCount: 0, maxAttempts: 2 }
  spaRejectionTracking: DocumentRejectionTracking;           // Default: { rejectionCount: 0, maxAttempts: 2 }
  signedSpaRejectionTracking: DocumentRejectionTracking;     // Default: { rejectionCount: 0, maxAttempts: 2 }
  paymentProofRejectionTracking: DocumentRejectionTracking;  // Default: { rejectionCount: 0, maxAttempts: 2 }
  bolRejectionTracking: DocumentRejectionTracking;           // Default: { rejectionCount: 0, maxAttempts: 3 }

  // Phase Timestamps
  scoSubmittedAt?: Date;
  icpoSubmittedAt?: Date;
  spaUploadedAt?: Date;            // When SPA was uploaded (by seller)
  spaSellerSignedAt?: Date;        // When seller signed the SPA
  spaBuyerSignedAt?: Date;         // When buyer counter-signed the SPA
  signedSpaSubmittedAt?: Date;     // When buyer uploaded signed SPA
  signedSpaApprovedAt?: Date;      // When seller approved signed SPA
  paymentVerifiedAt?: Date;
  bolUploadedAt?: Date;
  completedAt?: Date;

  // Cancellation Tracking
  cancelledAt?: Date;
  cancelledBy?: ObjectId;          // User who cancelled
  cancellationReason?: string;
  autoCancelledAt?: Date;          // Auto-cancelled due to document rejection limits
  autoCancellationReason?: string;

  // Dispute Eligibility
  disputeEligibilityEndsAt?: Date; // 30-day window after completion/cancellation
  activeDispute?: ObjectId;        // Ref to TradeDispute

  // Notification Badge Tracking
  buyerHasUnread: boolean;         // Default: false
  sellerHasUnread: boolean;        // Default: false
  lastBuyerViewedAt?: Date;
  lastSellerViewedAt?: Date;

  // Admin Management
  adminNotes: AdminNote[];         // Default: []. Internal admin notes (not visible to users)
  lastPhaseChangeAt?: Date;        // For stalled trade detection

  // User Deletion Tracking (soft-delete for audit trail)
  buyerDeleted: boolean;           // Default: false
  buyerDeletedAt?: Date;
  sellerDeleted: boolean;          // Default: false
  sellerDeletedAt?: Date;

  // Stock Restoration Tracking
  stockRestored: boolean;          // Default: false. Prevents double stock restoration

  // Race condition protection
  documentUploadInProgress: boolean; // Default: false

  createdAt: Date;
  updatedAt: Date;
}
```

### NegotiationEntry
```typescript
{
  round: number;
  party: 'buyer' | 'seller';
  offeredPrice?: number | string; // Number for new entries; string for legacy data
  offeredIncoterms?: Incoterms;
  message?: string;
  timestamp: Date;
}
```

### DocumentInfo
```typescript
{
  filePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: ObjectId;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  notes?: string;
  // E-signature fields
  signatureDataUrl?: string;   // Base64 PNG data URL of the signature
  signedAt?: Date;
  signedBy?: ObjectId;
  // Version tracking
  version?: number;            // Current version number (defaults to 1)
  history?: DocumentVersion[];  // Previous versions of this document
}
```

### DocumentVersion
```typescript
{
  filePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: ObjectId;
  version: number;
}
```

### SPADocumentInfo
Extends `DocumentInfo` with deprecated dual-signature fields (legacy backward compatibility).
```typescript
// Extends DocumentInfo
{
  // @deprecated - use signedSpaDocument instead
  sellerSignatureDataUrl?: string;
  sellerSignedAt?: Date;
  sellerSignedBy?: ObjectId;
  buyerSignatureDataUrl?: string;
  buyerSignedAt?: Date;
  buyerSignedBy?: ObjectId;
}
```

### AdminNote
```typescript
{
  _id: ObjectId;
  content: string;
  addedBy: ObjectId;         // Admin user ID
  addedByEmail: string;      // Admin email for display
  addedAt: Date;
}
```

### DocumentRejectionTracking
```typescript
{
  rejectionCount: number;      // Number of times rejected
  lastRejectionAt?: Date;
  lastRejectionReason?: string;
  maxAttempts: number;         // 2 for most documents, 3 for BoL
}
```

### Incoterms
```typescript
{
  selectedIncoterm?: 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';
  selectedIncotermData?: Record<string, 'Buyer' | 'Seller'>;
  defaults?: Record<IncotermType, Record<string, 'Buyer' | 'Seller'>>;
}
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "statusCode": 400 | 401 | 403 | 404 | 500,
  "message": "Error description"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request / No file uploaded / Invalid state transition |
| 401 | No valid cookie found / Invalid token |
| 403 | Access denied / Permission denied for this action |
| 404 | Trade not found / Document not found |
| 500 | Internal server error |

---

## Frontend Integration Notes

1. **Trade Creation Wizard:**
   - 4-step process: Negotiation → Address → Queries → Payment
   - Step 1 (Negotiation) is optional

2. **Negotiation UI:**
   - Display negotiation history timeline
   - Show current offer vs counter-offer
   - Enable counter-offer submission
   - Accept/Reject buttons

3. **Document Upload:**
   - Show upload UI based on current phase and user role
   - Display document status (pending/uploaded/approved/rejected)
   - Allow document re-upload if rejected (previous version saved to history)
   - Track remaining upload attempts via rejection tracking
   - Auto-cancellation occurs when max rejection attempts exceeded
   - Race condition protection: `documentUploadInProgress` flag prevents concurrent uploads

4. **Trade Status Tabs:**
   - PR Status: Pending negotiations (`pending`, `countered`, `buyer_responded`)
   - PO Status: Accepted trades in PR/SCO/ICPO phases
   - SPA: Trades in SPA phase
   - Ongoing: Active trades in PAYMENT/BOL phases
   - History: Completed, rejected, or cancelled trades

---

## Related Modules
- **Products Module:** Products are the basis for trades
- **Company Module:** Delivery addresses
- **Inbox Module:** Communication during negotiation
- **Analytics Module:** Trade statistics

## Related
- [[api/products]] — Product listings
- [[api/company]] — Company profiles
- [[api/inbox]] — Trade messaging
- [[api/notification]] — Trade notifications
- [[MOC-Trade]]
- [[MOC-API]]
