# Breyus — Complete Feature Specification & Implementation Tracker

> **Last Updated**: December 16, 2025
> **Document Purpose**: Track all features, their implementation status, file locations, and development progress

---

## Platform Overview

**Breyus** is an **AI-powered global commodity trading platform** connecting buyers and sellers of commodities. It combines trade management, AI insights, predictive partner scoring, legal document flow (SCO → SPA → BoL), and analytics.

### Goals
- Create a unified trade management backend
- Enable transparent, auditable trade lifecycle
- Integrate AI services for prediction, scoring, and market analysis
- Handle document verification, payments, and user communication seamlessly
- Scale globally for multi-country users

---

## Quick Stats

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Features | 93 | 100% |
| Fully Implemented | ~58 | 62% |
| Backend Only | ~6 | 6% |
| Frontend Only | ~8 | 9% |
| Not Started | ~21 | 23% |

---

## Status Legend

| Symbol | Status | Description |
|--------|--------|-------------|
| `[x]` | Done | Fully implemented and working |
| `[~]` | Partial | Partially implemented (see notes) |
| `[ ]` | Pending | Not yet started |
| `[!]` | Blocked | Blocked by dependency or issue |

### Priority Levels
- **P0**: Critical - Core functionality, must have
- **P1**: High - Important for MVP
- **P2**: Medium - Nice to have for launch
- **P3**: Low - Future enhancement

---

## Module A: User & Authentication

### Overview
Handles user registration, login, session management, and role-based access control.

### Files
```
Backend:
├── src/auth/auth.controller.ts
├── src/auth/auth.service.ts
├── src/auth/auth.module.ts
├── src/auth/dto/password-reset.dto.ts
├── src/login/login.controller.ts
├── src/login/login.service.ts
├── src/login/login.dto.ts
├── src/users/user.schema.ts
└── src/users/users.service.ts

Frontend:
├── src/main/login.tsx
├── src/main/forgot-password.tsx
├── src/main/Hero.tsx
├── src/routes/ProtectedRoute.tsx
└── src/services/auth.service.ts
```

### Features

#### A.1 Email/Password Registration
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `POST /auth/register` - login.controller.ts |
| Frontend | `src/main/Hero.tsx` (signup form) |
| Database | User schema with mail, password (bcrypt hashed) |
| Notes | Working end-to-end |

#### A.2 Login with Two-Factor Authentication (OTP)
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `POST /login` - Initial credentials, `POST /login/validate-otp` - OTP verification |
| Frontend | `src/main/login.tsx` with two-stage flow |
| Auth Method | Password + Email OTP → JWT stored in signed HTTP-only cookie (`account`) |
| Token Payload | `{ userId, companyId }` |
| OTP Storage | Redis with 10-minute TTL (in-memory fallback) |
| Notes | Full two-factor authentication implemented. OTP sent via Sendinblue email. 5-minute resend countdown on frontend. |

#### A.3 Logout
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `POST /auth/logout` - auth.controller.ts |
| Frontend | Logout button in sidebar, uses auth.service.ts |
| Implementation | Clears `account` cookie, redirects to login |
| Dependencies | None |

#### A.4 Multi-Factor Authentication (MFA)
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done (Email OTP) |
| Priority | P2 |
| Backend | OTP-based verification via email |
| Implementation | Login requires password + email OTP verification |
| Notes | TOTP/SMS options can be added as enhancement |

#### A.5 Password Reset & Change Password
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password` |
| Frontend | `src/main/forgot-password.tsx` (3-stage flow), `src/seller/pages/security.tsx` |
| DTOs | ForgotPasswordDto, ResetPasswordDto (8+ chars, complexity validation), ChangePasswordDto |
| Flow | Forgot: Email → OTP (10-min expiry) → New password. Change: Current password → New password |
| Dependencies | M.1 (Email service) |
| Notes | Full implementation with password complexity validation (uppercase, lowercase, number, special char) |
---

## Module B: Profiles & Verification

### Overview
User and company profile management, document uploads, and KYC verification.

### Files
```
Backend:
├── src/company/company.schema.ts
├── src/company/company.controller.ts
├── src/company/company.service.ts
├── src/onboarding/onboarding.controller.ts
└── src/onboarding/onboarding.service.ts

Frontend:
├── src/main/OnBoarding.tsx
├── src/main/selectRole.tsx
├── src/buyer/components/profile/
└── src/seller/components/profile/
```

### Features

#### B.1 User Profile
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | User schema with basic info |
| Frontend | Profile display in sidebar/settings |
| Fields | email, role, company reference |

#### B.2 Company Profile
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `company.schema.ts`, `GET /company/profile`, `PUT /company/profile` |
| Frontend | `OnBoarding.tsx` (creation), `src/seller/pages/settings.tsx` (edit) |
| Fields | companyName, address, mobile, taxId, role, tradeType, founderName, websiteUrl, mainLineBusiness, meanMonthlyRevenue |
| Notes | Settings page allows editing company profile with real-time API integration |

#### B.3 Document Upload (KYC Documents)
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | Multer file upload |
| Documents | GSTIN, PAN, Registration Certificate, License |
| Storage | Local filesystem (production: move to S3) |

#### B.4 KYC Verification Workflow
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P1 |
| Description | Admin reviews uploaded documents |
| Statuses | `unverified` → `pending` → `verified` / `rejected` |
| Dependencies | B.3, N.3 (Admin panel) |

#### B.5 Verification Status Display
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P1 |
| Backend | `[x]` Company.isVerified field |
| Frontend | `[~]` Basic status shown |
| API | Need endpoint to check/update status |

#### B.6 Profile Badges
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Visual badges for verified, premium, etc. |
| Dependencies | B.4 |

#### B.7 Bank Info (Encrypted)
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Fields | IFSC, Account Number, Holder Name, Branch |
| Security | Field-level encryption required |
| Dependencies | P.2 (Encryption) |

#### B.8 Activity Audit Trail
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Log all profile changes |
| Dependencies | P.3 (Audit logs) |

---

## Module C: Product & Inventory

### Overview
Product creation, listing, search, and inventory management.

### Files
```
Backend:
├── src/products/products.controller.ts
├── src/products/products.service.ts
├── src/products/schema/products.schema.ts
├── src/products/schema/hsn.schema.ts
├── src/products/dto/create-product.dto.ts
└── src/products/interceptors/file-upload.interceptor.ts

Frontend:
├── src/seller/pages/add-product.tsx
├── src/seller/pages/inventory.tsx
├── src/buyer/pages/Homepage.tsx
├── src/buyer/pages/product.tsx
└── src/seller/components/product/
```

### Features

#### C.1 Product Creation (5-Step Wizard)
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `POST /products` |
| Frontend | `src/seller/pages/add-product.tsx` |
| Steps | 1. Basic Info → 2. Application/Quality → 3. Pricing → 4. Export Details → 5. Incoterms |

**Wizard Steps Detail:**
1. **Basic Info**: name, category, HSN code, MOQ, stock, description
2. **Application**: usage, environmental impact, quality parameters
3. **Pricing**: cost, discount, profit margin, sale price
4. **Export**: delivery terms, insurance, proof of product, industry
5. **Incoterms**: select from 11 types, configure responsibility matrix

#### C.2 Product Listing
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `GET /products` with pagination |
| Frontend | Homepage grid, Inventory table |
| Query Params | page, limit, search, category, minPrice, maxPrice |

#### C.3 Product Search
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | Text search on name, description, category |
| Frontend | Search bar in marketplace |
| Notes | Basic text matching, no AI yet |

#### C.4 Product Filters
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Filters | Price range, category, MOQ, location |
| Backend | Query parameter filtering |

#### C.5 Inventory Management
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | Stock quantity, availability toggle |
| Frontend | `src/seller/pages/inventory.tsx` |
| Features | In Stock / Out of Stock toggle |

#### C.6 Commodity vs Niche Classification
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Logic | Auto-detect based on commodity database |
| Rule | If in mainstream list → Commodity, else → Niche |
| Notes | No manual override allowed |

#### C.7 Bulk CSV Upload
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Backend | `POST /products/bulk-upload` |
| Description | Upload CSV with multiple products |
| Dependencies | C.1 |

#### C.8 Product Images Upload
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | Multer multipart upload |
| Field | `productImages[]` array |
| Storage | Local filesystem |

#### C.9 Test Reports Upload
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | Multer file upload |
| Field | `testReports[]` array |
| Formats | PDF, images |

#### C.10 HSN Code Search
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `GET /products?q=` for HSN autocomplete |
| Database | HSN schema with code, description |
| Frontend | Autocomplete in product wizard |

#### C.11 Product Edit/Delete
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P1 |
| Backend | `PATCH /products/:id`, `DELETE /products/:id` |
| Frontend | Edit modal, delete confirmation |
| Notes | Schema supports it, controllers incomplete |

#### C.12 Product Audit Trail
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Track all product changes |
| Dependencies | P.3 |

---

## Module D: Marketplace & Search

### Overview
Public marketplace browsing, AI-powered search, and product discovery.

### Files
```
Backend:
├── src/products/products.controller.ts (search endpoints)
└── (AI endpoints not implemented)

Frontend:
├── src/buyer/pages/Homepage.tsx
├── src/buyer/pages/ai.tsx
├── src/buyer/pages/ai-result.tsx
└── src/seller/pages/SellerSearch*.tsx
```

### Features

#### D.1 Browse Marketplace
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Access | Public (no auth required) |
| Frontend | Homepage with product grid |

#### D.2 Search by Name/Category
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `GET /products?search=` |
| Frontend | Search bar component |

#### D.3 Multi-Filter Search
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Filters | Price, MOQ, location, category |
| Backend | Query params on GET /products |

#### D.4 AI-Powered Similarity Search
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P1 |
| Backend | `[ ]` Need embedding service (pgvector) |
| Frontend | `[x]` UI mockup ready |
| Dependencies | K.7 (Embeddings) |

#### D.5 Niche Commodity AI
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P2 |
| Backend | `[ ]` Orchestrator endpoint not implemented |
| Frontend | `[x]` `src/buyer/pages/ai.tsx` ready |
| Description | AI suggests related commodities via `/v1/commodities/search-niche`, then shows a grid of matches flagged with `is_niche` before running the main AI flow. |
| Notes | Entry gate: if commodity is not mainstream, redirect user from Breyus AI to Niche AI. |

#### D.6 Result Ranking Algorithm
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Description | Rank by relevance + AI score + history |
| Dependencies | K.2 (Gravity Score) |

#### D.7 Seller Verification Filter
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Description | Filter to show only verified sellers |
| Dependencies | B.4 |

---

## Module E: Trade Lifecycle

### Overview
Complete trade flow from Purchase Request to completion.

### Files
```
Backend:
├── src/trade/trade.controller.ts
├── src/trade/trade.service.ts
├── src/trade/schema/trade.schema.ts
├── src/trade/dto/create-trade.dto.ts
└── src/trade/dto/upload-document.dto.ts

Frontend:
├── src/buyer/pages/purchase-request.tsx
├── src/buyer/pages/purchase-request-success.tsx
├── src/buyer/pages/trade.tsx
├── src/buyer/pages/negotiation.tsx
├── src/seller/pages/trade.tsx
├── src/seller/pages/negotiation.tsx
├── src/buyer/components/purchaseRequestWaitingList.tsx
├── src/buyer/components/purchaseOrderWaitingList.tsx
├── src/seller/components/purchaseRequestStatus.tsx
├── src/seller/components/purchaseOrderStatus.tsx
├── src/components/ongoingTrades.tsx
├── src/components/tradeTabs.tsx
├── src/components/TrackTradeList.tsx
├── src/components/TradeHistory.tsx
├── src/components/TradeDetailsModal.tsx
└── src/components/NegotiationHistory.tsx
```

### Trade Flow
```
PR → SCO → ICPO → SPA → Payment Proof → BoL → Verification → Complete
```

### Features

#### E.1 Purchase Request (PR) Creation
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `POST /trade/create` |
| Frontend | `src/buyer/pages/purchase-request.tsx` |
| Fields | product, quantity, quantityUnit, buyerOfferedPrice, buyerIncoterms, buyerMessage, selectedAddress, buyerIndustryType, buyerMarketYears, marketCapture, tradeYears, productUsage, paymentMethod |

#### E.2 PR Status Tracking
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Statuses | pending → countered → buyer_responded → accepted / rejected |
| Backend | `purchaseRequestStatus`, `negotiationStatus` fields, full CRUD endpoints |
| Frontend | Status badges in trade list, 5-tab trade management (PR Status, PO Status, Ongoing, Track, History) |
| Components | purchaseRequestWaitingList.tsx, purchaseOrderWaitingList.tsx, ongoingTrades.tsx, TrackTradeList.tsx, TradeHistory.tsx |
| Notes | Full negotiation flow with visual progress indicators and TradeDetailsModal |

#### E.3 Soft Corporate Offer (SCO)
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Description | Seller uploads SCO document in response to PR |
| Backend | `POST /trade/:id/upload-sco` with Multer file upload |
| DTO | UploadSCODto: notes?, termsAccepted? |
| Statuses | Pending → Uploaded |
| Dependencies | E.1 (trade must be accepted first) |
| Notes | Only sellers can upload after negotiation accepted. Auto-advances trade phase. |

#### E.4 ICPO Upload
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Description | Buyer sends Irrevocable Corporate Purchase Order |
| Backend | `POST /trade/:id/upload-icpo` |
| DTO | UploadICPODto: notes?, icpoReference? |
| Dependencies | E.3 (requires SCO uploaded first) |

#### E.5 SPA (Sales Purchase Agreement)
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Description | Legal agreement between buyer and seller |
| Backend | `POST /trade/:id/upload-spa` |
| DTO | UploadSPADto: notes?, signingParty? |
| Dependencies | E.4 (requires ICPO uploaded first) |
| Notes | Dual signature supported via `PUT /trade/:id/document/spa/sign` |

#### E.6 Bill of Lading (BoL)
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Description | Seller uploads shipment document |
| Backend | `POST /trade/:id/upload-bol` |
| DTO | UploadBoLDto: notes?, bolNumber?, shippingCarrier?, vesselName? |
| Dependencies | E.7 (requires payment proof uploaded first) |
| Notes | Supports e-signature via `PUT /trade/:id/document/bol/sign` |

#### E.7 Payment Proof Upload
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Description | Buyer uploads payment confirmation |
| Backend | `POST /trade/:id/upload-payment-proof` |
| DTO | UploadPaymentProofDto: notes?, amount?, transactionId?, paymentDate? |
| Dependencies | E.5 (requires SPA uploaded first) |
| Notes | Payment handled externally, only proof verified |

#### E.8 Trade Completion
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `PUT /trade/:id/complete` |
| Description | Mark trade as complete after BoL uploaded |
| Dependencies | E.6 |

#### E.9 Document Verification Workflow
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P1 |
| Backend | `[x]` Document status fields exist (pending, uploaded, approved, rejected) |
| Admin UI | `[ ]` Admin panel for document approval not implemented |
| Dependencies | H.8, N.3 |

#### E.10 Trade Status Tracking UI
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Frontend | Progress bar showing trade stage, 5-tab trade management |
| Backend | `GET /trade/user-trades`, `GET /trade/seller-trades`, `GET /trade/:id` |
| Components | tradeTabs.tsx, TrackTrade.tsx, tradeStatusProgress.tsx |

#### E.11 Stock Reservation
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Description | Lock stock during PR negotiation |
| Dependencies | E.1, C.5 |
| Notes | Implemented with Optimistic Concurrency Control (OCC) in `createTrade` |

#### E.12 Trade Phase Advancement
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `PUT /trade/:id/advance-phase` |
| DTO | AdvancePhaseDto: newPhase (PR|SCO|ICPO|SPA|PAYMENT|BOL|COMPLETED), reason? |
| Notes | Manual phase advancement with validation |

#### E.13 Get Trade Documents
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `GET /trade/:id/documents` |
| Returns | All uploaded documents with metadata (size, MIME type, uploader, timestamp) |

---

## Module F: Negotiation Engine

### Overview
Counter-offer system for price and term negotiation.

### Files
```
Backend:
├── src/trade/trade.controller.ts (negotiation endpoints)
├── src/trade/trade.service.ts (negotiation logic)
└── src/trade/schema/trade.schema.ts (negotiation fields)

Frontend:
├── src/buyer/pages/negotiation.tsx
├── src/seller/pages/negotiation.tsx
├── src/components/NegotiationHistory.tsx
├── src/components/TradeDetailsModal.tsx (includes negotiation tab)
└── src/services/trade.service.ts
```

### Features

#### F.1 Counter-Offer Creation
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `POST /trade/:id/counter-offer` - trade.controller.ts |
| Frontend | Seller negotiation page with counter-offer form |
| Fields | sellerOfferedPrice, sellerOfferedIncoterms, sellerMessage |
| Notes | Full implementation with validation |

#### F.2 Offer Versioning
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Description | Track history of all offers |
| Backend | `GET /trade/:id/history` returns full negotiation timeline |
| Schema | negotiationHistory[] array with type, party, price, incoterms, message, timestamp, round |
| Frontend | NegotiationHistory component in TradeDetailsModal |

#### F.3 Price Negotiation
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | Trade schema has buyerOfferedPrice, sellerOfferedPrice with counter endpoint |
| Frontend | Price input in negotiation UI with comparison display |
| Flow | Buyer offers → Seller counters → Buyer responds → Accept/Reject |

#### F.4 Incoterm Negotiation
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | Trade schema has buyerIncoterms, sellerOfferedIncoterms |
| Frontend | Incoterm selector (11 options) in negotiation page |
| Supported | EXW, FCA, FAS, FOB, CFR, CIF, CPT, CIP, DAP, DPU, DDP |
| Notes | Counter-offer includes full incoterms data with responsibility matrix |

#### F.5 AI Negotiation Suggestions
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | AI suggests optimal counter-offers |
| Dependencies | K.2 |

#### F.6 Unlimited Counter Rounds
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Description | No limit on negotiation rounds |
| Implementation | currentNegotiationRound counter, negotiationHistory array with no max length |
| Backend | Tracks round number in each history entry |

#### F.7 Buyer Response to Counter
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `POST /trade/:id/buyer-respond` |
| Frontend | Buyer negotiation page with response form |
| Fields | responsePrice, responseIncoterms, responseMessage |
| Flow | After seller counters, buyer can respond with their own counter |

#### F.8 Accept Trade
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `PUT /trade/:id/accept` |
| Frontend | Accept button in negotiation and trade list pages |
| Logic | Either party can accept, updates negotiationStatus to 'accepted' |

#### F.9 Reject Trade
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `PUT /trade/:id/reject` with reason |
| Frontend | Reject button with reason modal |
| Logic | Either party can reject, updates negotiationStatus to 'rejected' |

---

## Module G: Incoterms Manager

### Overview
International Commercial Terms database and editor.

### Files
```
Backend:
├── src/products/schema/products.schema.ts (Incoterm types)
└── (no dedicated incoterms module)

Frontend:
├── src/seller/components/product/IncotermsEditor.tsx
└── src/types/incoterms.ts
```

### Supported Incoterms
| Code | Name | Transport |
|------|------|-----------|
| EXW | Ex Works | Any |
| FCA | Free Carrier | Any |
| FAS | Free Alongside Ship | Sea |
| FOB | Free on Board | Sea |
| CFR | Cost and Freight | Sea |
| CIF | Cost, Insurance, Freight | Sea |
| CPT | Carriage Paid To | Any |
| CIP | Carriage Insurance Paid | Any |
| DAP | Delivered at Place | Any |
| DPU | Delivered at Place Unloaded | Any |
| DDP | Delivered Duty Paid | Any |

### Features

#### G.1 Incoterms Database
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Implementation | TypeScript enum/types |
| Coverage | All 11 Incoterms 2020 |

#### G.2 Responsibility Matrix
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Description | Buyer/Seller responsibility split |
| Categories | Export customs, loading, freight, insurance, import customs, delivery |

#### G.3 Incoterm Editor
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Frontend | In product wizard step 5, in negotiation pages |
| Features | Select incoterm, view/edit responsibilities |

#### G.4 Incoterm Version Tracking
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P3 |
| Description | Track incoterm changes per trade |
| Implementation | Stored in negotiationHistory with each offer |

---

## Module H: Documents & Legal

### Overview
Document upload, storage, and verification workflow.

### Files
```
Backend:
├── src/products/interceptors/file-upload.interceptor.ts
├── src/trade/dto/upload-document.dto.ts
└── src/common/storage.service.ts

Frontend:
├── src/components/DocumentUploadModal.tsx
└── (document upload in trade components)
```

### Features

#### H.1 General Document Upload
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | Multer middleware |
| Supported | Images, PDFs |
| Storage | Organized by trade ID and document type |

#### H.2 SCO Document Upload
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `POST /trade/:id/upload-sco` |
| Permissions | Sellers only, after negotiation accepted |

#### H.3 SPA Document Upload
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `POST /trade/:id/upload-spa` |
| Permissions | Either party, after ICPO uploaded |

#### H.4 BoL Document Upload
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `POST /trade/:id/upload-bol` |
| Permissions | Sellers only, after payment proof uploaded |

#### H.5 E-Signature Integration
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P2 |
| Backend | `PUT /trade/:id/document/:type/sign` supports `signatureDataUrl` |
| Options | Custom signature pad implemented, DocuSign planned |
| Notes | Backend supports signing SCO, ICPO, SPA, BoL |

#### H.6 File Versioning
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P3 |
| Description | Track document versions |
| Backend | Implemented in `TradeService` (history array in DocumentInfo) |

#### H.7 Document Checksum
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Verify document integrity |

#### H.8 Document Verification Status
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P1 |
| Backend | `[x]` Status field exists (pending, uploaded, approved, rejected) |
| Admin UI | `[ ]` Verification UI not implemented |
| Dependencies | N.3 |

---

## Module I: Payments & Settlement

### Overview
Payment method selection and proof verification (actual payments handled externally).

### Features

#### I.1 Payment Method Selection
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Location | In Purchase Request flow |
| Types | Advance, Credit, Open Account |
| Methods | RTGS, Letter of Credit |
| Fields | type, method, percentage (for partial), days (for credit terms) |

#### I.2 Payment Proof Upload
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `POST /trade/:id/upload-payment-proof` |
| DTO | notes?, amount?, transactionId?, paymentDate? |
| Permissions | Buyers only, after SPA uploaded |

#### I.3 Payment Verification
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P1 |
| Backend | `[x]` Verification status field exists |
| Admin UI | `[ ]` Admin verifies payment proof |
| Dependencies | I.2, N.3 |

#### I.4 External Payment Integration
| Aspect | Details |
|--------|---------|
| Status | `[ ]` N/A |
| Notes | Payments handled externally between users |

---

## Module J: Communication & Inbox

### Overview
Real-time messaging between buyers and sellers.

### Files
```
Backend:
├── src/inbox/inbox.controller.ts
├── src/inbox/inbox.service.ts
├── src/inbox/inbox.gateway.ts (WebSocket)
├── src/inbox/schemas/conversation.schema.ts
└── src/inbox/schemas/message.schema.ts

Frontend:
├── src/buyer/pages/Inbox.tsx
├── src/seller/pages/inbox.tsx
├── src/components/InboxConversation.tsx
├── src/services/socket.service.ts
└── socket.io-client (installed)
```

### Features

#### J.1 Conversation Schema
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Fields | participants[], lastMessage, lastMessageTimestamp, unreadCount |

#### J.2 Message Schema
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Fields | conversationId, sender, content, timestamp, isRead |

#### J.3 Real-time Chat (WebSocket)
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `[x]` inbox.gateway.ts, inbox.controller.ts |
| Frontend | `[x]` socket.io-client installed, socket.service.ts exists |
| Notes | Full WebSocket implementation with rooms and event handling |

#### J.4 Message History
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `[x]` `GET /inbox/:conversationId/messages` implemented |
| Frontend | `[x]` UI ready |

#### J.5 File Attachments
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Dependencies | J.3, H.1 |

#### J.6 System Messages
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Description | Auto-generated trade status updates |
| Dependencies | J.3, E.10 |

#### J.7 AI Message Templates
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | AI-suggested responses |

#### J.8 Typing Indicators
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P3 |
| Implementation | Socket event `typing` / `user-typing` |
| Dependencies | J.3 |

#### J.9 Read Receipts
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P3 |
| Implementation | Socket event `mark-read` / `messages-marked-read` |
| Dependencies | J.3 |

---

## Module K: AI Services & Prediction

### Overview
AI-powered features for trade prediction, scoring, and market analysis.

### Files
```
Backend:
└── (AI module not implemented - planned as separate microservice)

Frontend:
├── src/buyer/pages/ai.tsx
├── src/buyer/pages/ai-result.tsx
├── src/seller/pages/SellerSearchOption.tsx
├── src/seller/pages/SellerSearchInput.tsx
└── src/seller/pages/SellerSearchResult.tsx
```

### Planned AI Endpoints
```
POST /v1/links/predict     → Buyer/Seller match prediction (AI trade dataset)
POST /v1/trades/score      → Gravity score calculation
POST /v1/analysis/initiate → Start market analysis (async)
GET  /v1/analysis/:jobId   → Get analysis results
POST /v1/commodities/search-niche → Niche commodity search (grid feed)
```

**HS/HSN Requirement (AI Flows)**
- Accept 4, 6, 8, or 10 digit codes.
- Canonical AI key is HS-6 (6 digits).
- 8/10 digit codes are truncated to HS-6 for AI calls.
- 4 digit codes are treated as a prefix match (e.g., `0901%`).

**AI prediction payload (partner matching)**
- Use company name for lookup in the AI trade dataset (AI DB IDs are optional).
- Send only useful context for matching/scoring: country, location (lat/lon), buyer port (from the form), price range, mean monthly revenue, and payment terms/credit score.
- Include `role` (buyer/seller) when profile context is sent.

### Features

#### K.1 Trade Link Prediction
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Technology | AI trade dataset (Postgres + embeddings) |
| Description | Predict best buyer-seller matches using name lookup + profile context (country, location, port, price range, financing) |
| UX Note | Show PO/Chat only when the predicted company exists on platform (match by email or phone); otherwise show contact info + AI scores only. |

#### K.2 Gravity Score Calculation
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Formula | See below |

**Gravity Score Formula:**
```
GravityScore = (Demand × 0.20) + (SourceGeography × 0.15) + (Port × 0.15) +
               (TransportCost × 0.10) + (Capital × 0.10) + (Financing × 0.07) +
               (PriceRange × 0.07) + (Weather × 0.05) + (Volatility × 0.05) +
               (Barrier × 0.03) + (Frequency × 0.03)

Probability = (GravityScore / Σ(GravityScores)) × 100
```

#### K.3 Market Analysis (Async)
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Description | Background job for market analysis |
| Topics | Supply chain, weather, barriers, volatility |

#### K.4 Demand Forecasting
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P2 |
| Backend | `[ ]` Not implemented |
| Frontend | `[x]` UI mockup with charts |

#### K.5 Price Volatility Analysis
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P2 |
| Backend | `[ ]` Not implemented |
| Frontend | `[x]` UI mockup ready |

#### K.6 Buyer Probability Score
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P2 |
| Backend | `[ ]` Not implemented |
| Frontend | `[x]` UI shows probability |

#### K.7 Similarity Search (Embeddings)
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Technology | pgvector / Pinecone |
| Description | Vector search for similar products |

---

## Module L: Analytics & Dashboard

### Overview
Business analytics, metrics, and reporting.

### Files
```
Backend:
├── src/analytics/analytics.module.ts
├── src/analytics/analytics.controller.ts
└── src/analytics/analytics.service.ts

Frontend:
├── src/seller/pages/dashboard.tsx
├── src/seller/pages/sales.tsx
├── src/services/analytics.service.ts
└── Chart.js, Recharts (installed)
```

### Features

#### L.1 Buyer Dashboard
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | Analytics API available via `/analytics/*` endpoints |
| Frontend | Dashboard layout with trade statistics |
| Metrics | Ongoing trades, PR statuses, trade history |

#### L.2 Seller Dashboard
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `GET /analytics/metrics`, `/bar-data`, `/scatter-data`, `/pie-data`, `/country-sales` |
| Frontend | `src/seller/pages/dashboard.tsx` with live charts |
| Metrics | Website visits, total sales, revenue, customers, sales by country |
| Notes | Full analytics module with Recharts integration |

#### L.3 Trade Statistics
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Backend | `GET /analytics/metrics` returns totalVisits, totalSales, totalRevenue, totalCustomers |

#### L.4 Revenue Analytics
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Backend | Revenue calculated from completed trades in analytics.service.ts |
| Frontend | Bar charts, scatter plots, pie charts integrated |

#### L.5 Country Distribution
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P3 |
| Backend | `GET /analytics/country-sales` returns sales by country with flags |
| Frontend | Country sales table in dashboard.tsx |

#### L.6 Time-Series Charts
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Backend | `GET /analytics/bar-data` (7-day), `/scatter-data` (30-day) |
| Frontend | Recharts bar and scatter/line charts integrated |

#### L.7 CSV/Excel Export
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Export analytics data |

#### L.8 7-Year Data Retention
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Notes | Policy defined, implementation pending |

---

## Module M: Notifications & Events

### Overview
Email, in-app, and push notifications.

### Files
```
Backend:
├── src/mail/mail.controller.ts
├── src/mail/mail.service.ts
├── src/mail/mail.module.ts
├── src/mail/redis.provider.ts
├── src/mail/templates/
└── sib-api-v3-sdk (Sendinblue)

Frontend:
└── (notification UI not implemented)
```

### Features

#### M.1 Email Notifications
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Service | Sendinblue (sib-api-v3-sdk) + SMTP fallback |
| Triggers | Registration, login OTP, password reset OTP |
| Storage | Redis for OTP (10-min TTL) with in-memory fallback |

#### M.2 In-App Notifications
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Description | Bell icon with notification list |
| Dependencies | J.6 |

#### M.3 Push Notifications
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Technology | Firebase Cloud Messaging |

#### M.4 Webhooks
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | External webhook integrations |

#### M.5 Notification Preferences
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done (Backend) |
| Priority | P2 |
| Description | User controls for notification types (User schema & Controller) |

#### M.6 Event-Based Triggers
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Events | PR received, SCO sent, counter-offer, trade accepted, etc. |
| Implementation | Handled via TradeNotificationService |
| Dependencies | E.* (Trade lifecycle) |

---

## Module N: Admin & Operations

### Overview
Admin panel for user management, verification, and monitoring.

### Files
```
Backend:
└── (admin module not implemented)

Frontend:
└── (admin panel not implemented)
```

### Features

#### N.1 User Management
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Features | View, edit, suspend users |

#### N.2 Account Suspension
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Dependencies | N.1 |

#### N.3 Verification Control Panel
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P1 |
| Description | Review and approve KYC documents |
| Dependencies | B.4 |

#### N.4 Dispute Resolution
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Handle trade disputes |

#### N.5 AI Job Monitor
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Monitor AI background jobs |
| Dependencies | K.* |

#### N.6 Audit Export
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Export audit logs |
| Dependencies | P.3 |

---

## Module O: Integrations

### Overview
Third-party service integrations.

### Features

#### O.1 E-Signature (DocuSign/Adobe)
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Dependencies | H.5 |

#### O.2 Logistics (Maersk/INTTRA)
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Shipping tracking integration |

#### O.3 Futures Market Price Feed
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P3 |
| Description | Real-time commodity prices |

#### O.4 KYC Verification (Onfido/Trulioo)
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Description | Automated identity verification |

#### O.5 Email/SMS (SendGrid/Twilio)
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Implementation | Sendinblue for email |
| Notes | SMS not implemented |

---

## Module P: Security & Compliance

### Overview
Security measures and compliance requirements.

### Features

#### P.1 TLS/HTTPS Enforcement
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P1 |
| Notes | Required for production |

#### P.2 Field-Level Encryption
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Use Cases | Bank info, PII |

#### P.3 Activity Audit Logs
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Description | Log all critical operations |

#### P.4 GDPR Compliance
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Requirements | Data export, consent management |

#### P.5 Right to be Forgotten
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P2 |
| Description | User data deletion |
| Dependencies | P.4 |

#### P.6 Automated Backups
| Aspect | Details |
|--------|---------|
| Status | `[ ]` Pending |
| Priority | P1 |
| Notes | MongoDB Atlas or manual setup |

#### P.7 Data Retention Policies
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P2 |
| Policy | 7 years for trade data |
| Implementation | `[ ]` Not enforced |

---

## Module Q: Additional Features

### Features

#### Q.1 Wishlist
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Backend | `src/wishlist/` module |
| Frontend | `src/buyer/pages/Wishlist.tsx` |

#### Q.2 Onboarding Flow
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Backend | `src/onboarding/` module |
| Frontend | `src/main/OnBoarding.tsx` |
| Steps | Company info → Role → Business details → Documents |

#### Q.3 Role Selection
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P0 |
| Frontend | `src/main/selectRole.tsx` |
| Options | Buyer, Seller |

#### Q.4 Meeting Scheduler
| Aspect | Details |
|--------|---------|
| Status | `[~]` Partial |
| Priority | P3 |
| Backend | `[ ]` Not implemented |
| Frontend | `[x]` `src/main/scheduleMeeting.tsx` |

#### Q.5 Delivery Address Management
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P1 |
| Location | Company profile, Trade creation |
| Schema | `deliveryAddresses[]` in Company, `selectedAddress` in Trade |

---

## Module R: Feedback & Ratings

### Overview
User feedback and rating system for trades.

### Files
```
Backend:
├── src/feedback/feedback.controller.ts
├── src/feedback/feedback.service.ts
├── src/feedback/feedback.schema.ts
└── src/feedback/dto/create-feedback.dto.ts
```

### Features

#### R.1 Submit Feedback
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Backend | `POST /feedback` |
| DTO | rating (1-5), comment, type (BUYER_TO_SELLER/SELLER_TO_BUYER) |

#### R.2 Trade Feedback History
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Backend | `GET /feedback/trade/:tradeId` |

#### R.3 User Ratings
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P2 |
| Backend | `GET /feedback/user/:userId/rating` (Average rating) |

#### R.4 Feedback Check
| Aspect | Details |
|--------|---------|
| Status | `[x]` Done |
| Priority | P3 |
| Backend | `GET /feedback/check/:tradeId/:feedbackType` |
| Description | Check if user has already left feedback |

## Implementation Roadmap

### Phase 1: Core MVP (Complete)
- [x] Authentication (A.1, A.2, A.9)
- [x] Profiles (B.1, B.2, B.3)
- [x] Products (C.1-C.5, C.8-C.10)
- [x] Marketplace (D.1-D.3)
- [x] Basic Trade (E.1, E.2, E.10)
- [x] Incoterms (G.1-G.3)
- [x] Wishlist (Q.1)
- [x] Onboarding (Q.2, Q.3, Q.5)

### Phase 2: Trade Completion (Complete)
- [x] Logout (A.3)
- [x] Password Reset & Change (A.5)
- [x] Two-Factor Auth (A.4 - Email OTP)
- [x] Negotiation Engine (F.1-F.4, F.6-F.9)
- [x] Document Uploads (E.3-E.7, H.2-H.4)
- [x] Trade Completion (E.8)
- [x] Trade Phase Advancement (E.12)
- [ ] Product Edit/Delete (C.11)

### Phase 3: Communication
- [x] Real-time Chat (J.3, J.4, J.8, J.9) - Fully implemented with socket.io
- [ ] System Messages (J.6)
- [ ] In-App Notifications (M.2)

### Phase 4: AI & Analytics (Partial Complete)
- [ ] AI Search (D.4, D.5)
- [ ] Gravity Score (K.2)
- [x] Analytics API (L.1-L.6) - Full analytics module with metrics, charts, country data
- [ ] Demand Forecasting (K.4)

### Phase 5: Admin & Compliance
- [ ] KYC Workflow (B.4)
- [ ] Admin Panel (N.1-N.3)
- [ ] Audit Logs (P.3)
- [ ] Security Enhancements (P.1, P.2)

### Phase 6: Integrations
- [ ] E-Signature (O.1)
- [ ] KYC Service (O.4)
- [ ] TOTP/SMS MFA enhancement (A.4)

---

## API Endpoints Summary

### Authentication & Login
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Initiate login (sends OTP) |
| POST | `/login/validate-otp` | Validate OTP, get JWT |
| GET | `/auth/validate-cookie` | Validate session |
| GET | `/auth/me` | Get current user |
| POST | `/auth/logout` | Clear session |
| POST | `/auth/forgot-password` | Request reset OTP |
| POST | `/auth/reset-password` | Reset with OTP |
| POST | `/auth/change-password` | Change password |

### Trade Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/trade/create` | Create purchase request |
| GET | `/trade/user-trades` | Get buyer's trades |
| GET | `/trade/seller-trades` | Get seller's trades |
| GET | `/trade/:id` | Get trade by ID |
| POST | `/trade/:id/counter-offer` | Seller counter-offer |
| POST | `/trade/:id/buyer-respond` | Buyer response |
| PUT | `/trade/:id/accept` | Accept trade |
| PUT | `/trade/:id/reject` | Reject trade |
| GET | `/trade/:id/history` | Negotiation history |
| POST | `/trade/:id/upload-sco` | Upload SCO |
| POST | `/trade/:id/upload-icpo` | Upload ICPO |
| POST | `/trade/:id/upload-spa` | Upload SPA |
| POST | `/trade/:id/upload-bol` | Upload BoL |
| POST | `/trade/:id/upload-payment-proof` | Upload payment proof |
| GET | `/trade/:id/documents` | Get all documents |
| PUT | `/trade/:id/advance-phase` | Advance trade phase |
| PUT | `/trade/:id/complete` | Complete trade |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/metrics` | Dashboard metrics |
| GET | `/analytics/bar-data` | 7-day chart data |
| GET | `/analytics/scatter-data` | 30-day chart data |
| GET | `/analytics/pie-data` | Distribution data |
| GET | `/analytics/country-sales` | Sales by country |

### Inbox & Communication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/inbox/create-conversation` | Start new chat |
| GET | `/inbox/get-conversations` | List user's chats |
| GET | `/inbox/:id/messages` | Get message history |
| POST | `/inbox/:id/send-message` | Send message |
| POST | `/inbox/:id/mark-read` | Mark messages read |

### Notifications & Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/notification-preferences` | Get user preferences |
| PUT | `/users/notification-preferences` | Update preferences |

### Feedback & Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback` | Submit feedback/rating |
| GET | `/feedback/trade/:tradeId` | Get trade feedback |
| GET | `/feedback/user/:userId` | Get all user feedback |
| GET | `/feedback/user/:userId/rating` | Get average rating |
| GET | `/feedback/check/:tradeId/:type` | Check feedback status |

---

## Notes for Development

### When Implementing a Feature
1. Check dependencies in this document
2. Update status from `[ ]` to `[~]` when starting
3. Update status to `[x]` when complete
4. Add implementation notes if relevant
5. Update "Last Updated" date at top

### Backend Implementation Pattern
```typescript
// 1. Create/update schema in schema/*.ts
// 2. Create DTO in dto/*.ts
// 3. Add service method in *.service.ts
// 4. Add controller endpoint in *.controller.ts
// 5. Update module if new dependencies
```

### Frontend Implementation Pattern
```typescript
// 1. Create/update types in types/*.ts
// 2. Add API service in services/*.ts
// 3. Create component in components/
// 4. Add page in pages/
// 5. Add route in routes/index.tsx
```

---

## UI/UX Reference

### Figma Mockups Location
`context/figma/` - 154 screens total
- `buyer_pages/` - 73 images (Homepage, Trade, AI, Settings, Inbox)
- `seller_pages/` - 81 images (Dashboard, Inventory, Trade, AI, Analytics)

### Key UI Screens
- Login: Desktop - 16.jpg (buyer_pages)
- Onboarding: Desktop - 42, 44, 50.jpg
- Buyer Dashboard: Desktop - 1.jpg
- Trade Management: Desktop - 7, 100, 103.jpg
- Seller Dashboard: Dashboard(Sales page).jpg variants
- Inventory: Desktop - 15.jpg (seller_pages)
- AI Search: Ai page -1 through -4.jpg
- Inbox: Desktop - 80.jpg
- Incoterms Table: Dashboard(Sales page).jpg

### Design Patterns
- Sidebar navigation (consistent across authenticated pages)
- 5-tab trade management (PR Status, PO Status, Ongoing, Track, History)
- Status badges: Green (success), Yellow (pending), Red (rejected), Blue (in progress)
- Card-based product and trade displays
- Modal-based detail views and forms
