# Trade API

## Overview
The Trade API manages the complete trade lifecycle including purchase requests, multi-round negotiations, document uploads, and trade completion. It handles all interactions between buyers and sellers from initial offer to final delivery.

## Base URL
```
/trade
```

## Authentication
All endpoints require authentication via signed cookie.

---

## Trade Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRADE LIFECYCLE PHASES                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [PR] → [NEGOTIATION] → [SCO] → [ICPO] → [SPA] → [PAYMENT] → [BOL] → [COMPLETE] │
│   │          │            │        │       │         │         │          │      │
│   │          │            │        │       │         │         │          │      │
│   │    Multi-round       Seller   Buyer  Either    Buyer    Seller     Trade   │
│   │    counter-offers   uploads  uploads  party   uploads   uploads   archived │
│   │                                       signs                                  │
│   │                                                                              │
│   Buyer creates                                                                  │
│   purchase request                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Phase Descriptions:**
- **PR (Purchase Request):** Buyer initiates trade with offer
- **Negotiation:** Multi-round counter-offers between parties
- **SCO:** Seller uploads Soft Corporate Offer document
- **ICPO:** Buyer uploads Irrevocable Corporate Purchase Order
- **SPA:** Either party uploads Sales Purchase Agreement
- **PAYMENT:** Buyer uploads payment proof
- **BOL:** Seller uploads Bill of Lading
- **COMPLETED:** Trade archived and completed

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
    }
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

  "paymentMethod": {
    "type": "advance" | "credit" | "openAccount",
    "method": "RTGS" | "LetterOfCredit",
    "percentage": "string",
    "days": "string"
  }
}
```

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
  "data": {
    "pr": 0,
    "po": 0,
    "spa": 0,
    "ongoing": 0
  }
}
```

---

#### Mark As Read

**Endpoint:** `PUT /trade/mark-read/:tabType`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `tabType`: 'pr' | 'po' | 'spa' | 'ongoing'

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Marked as read"
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
  "message": "Counter offer submitted successfully",
  "data": {
    "negotiationStatus": "countered",
    "currentNegotiationRound": 1,
    "negotiationHistory": [...]
  }
}
```

**Implementation Notes:**
- Only seller can submit counter-offers initially
- Updates `negotiationStatus` to "countered"
- Increments `currentNegotiationRound`
- Adds entry to `negotiationHistory`

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
  "data": {
    "negotiationStatus": "buyer_responded",
    "currentNegotiationRound": 2,
    "negotiationHistory": [...]
  }
}
```

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

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Trade cancelled"
}
```

---

#### 9. Get Negotiation History

Retrieves the complete negotiation history for a trade.

**Endpoint:** `GET /trade/:id/history`

**Authentication:** Required (signed cookie)

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Negotiation history retrieved",
  "data": {
    "negotiationHistory": [
      {
        "round": 1,
        "party": "buyer",
        "offeredPrice": "10000",
        "offeredIncoterms": {},
        "message": "Initial offer",
        "timestamp": "2024-01-01T00:00:00.000Z"
      },
      {
        "round": 2,
        "party": "seller",
        "offeredPrice": "12000",
        "message": "Counter offer",
        "timestamp": "2024-01-01T01:00:00.000Z"
      }
    ],
    "currentNegotiationRound": 2,
    "negotiationStatus": "countered"
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
- `limit`: number
- `offset`: number
- `action`: string

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Audit history retrieved successfully",
  "data": [...]
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
  "message": "Documents retrieved successfully",
  "data": {
    "scoDocument": {...},
    "icpoDocument": {...},
    "spaDocument": {...},
    "paymentProof": {...},
    "bolDocument": {...}
  }
}
```

---

---

#### Download Document

Streams the file.

**Endpoint:** `GET /trade/:id/document/:type/download`

**Authentication:** Required (signed cookie)

**Path Parameters:**
- `type`: 'sco' | 'icpo' | 'spa' | 'bol' | 'payment-proof'

---

#### Get Document Versions

**Endpoint:** `GET /trade/:id/document/:type/versions`

**Authentication:** Required (signed cookie)

---

#### Download Document Version

**Endpoint:** `GET /trade/:id/document/:type/version/:version/download`

**Authentication:** Required (signed cookie)

---

#### 16. Verify Document

Verify or reject a document (for the receiving party).

**Endpoint:** `PUT /trade/:id/verify-document`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "documentType": "sco" | "icpo" | "spa" | "bol" | "payment-proof",
  "status": "approved" | "rejected",
  "verificationNotes": "string"
}
```

**Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Document status updated",
  "data": {
    "documentType": "sco",
    "status": "approved"
  }
}
```

**Verification Rules:**
- SCO → Buyer verifies
- ICPO → Seller verifies
- SPA → Either party verifies
- Payment Proof → Seller verifies
- BoL → Buyer verifies

---

---

#### Sign Document

Sign a document with e-signature.

**Endpoint:** `PUT /trade/:id/document/:type/sign`

**Authentication:** Required (signed cookie)

**Request Body:**
```json
{
  "signatureDataUrl": "string"
}
```

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
  "reason": "string"
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

**Response:** PDF File Stream

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
  negotiationStatus: 'pending' | 'countered' | 'buyer_responded' | 'accepted' | 'rejected';
  tradePhase: 'PR' | 'SCO' | 'ICPO' | 'SPA' | 'PAYMENT' | 'BOL' | 'COMPLETED';

  // Trade Details
  quantity: string;
  quantityUnit: string;
  selectedAddress: Address;
  paymentMethod: PaymentMethod;

  // Buyer Terms
  buyerOfferedPrice?: string;
  buyerIncoterms?: Incoterms;
  buyerMessage?: string;

  // Seller Terms
  sellerOfferedPrice?: string;
  sellerOfferedIncoterms?: Incoterms;
  sellerMessage?: string;

  // Negotiation
  currentNegotiationRound: number;
  negotiationHistory: NegotiationEntry[];
  rejectionReason?: string;
  acceptedAt?: Date;
  rejectedAt?: Date;

  // Documents
  scoDocument?: DocumentInfo;
  icpoDocument?: DocumentInfo;
  spaDocument?: DocumentInfo;
  paymentProof?: DocumentInfo;
  bolDocument?: DocumentInfo;

  // Phase Timestamps
  scoSubmittedAt?: Date;
  icpoSubmittedAt?: Date;
  spaSignedAt?: Date;
  paymentVerifiedAt?: Date;
  bolUploadedAt?: Date;
  completedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

### NegotiationEntry
```typescript
{
  round: number;
  party: 'buyer' | 'seller';
  offeredPrice?: string;
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
  "statusCode": 400 | 401 | 404 | 500,
  "message": "Error description"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request / No file uploaded |
| 401 | No valid cookie found |
| 404 | Trade not found |
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
   - Allow document re-upload if rejected

4. **Trade Status Tabs:**
   - PR Status: Pending purchase requests
   - PO Status: Accepted trades awaiting documents
   - Ongoing: Active trades in document phase
   - Track: Trade progress visualization
   - History: Completed/rejected trades

---

## Related Modules
- **Products Module:** Products are the basis for trades
- **Company Module:** Delivery addresses
- **Inbox Module:** Communication during negotiation
- **Analytics Module:** Trade statistics
