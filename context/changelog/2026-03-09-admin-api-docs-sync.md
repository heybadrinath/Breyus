---
type: changelog
date: 2026-03-09
tags: [docs, admin, trade, ai]
---

# API Docs Sync — Admin + Trade + AI

Audited `context/api/admin.md` against all 17 admin backend sub-modules, then spot-checked trade and AI docs.

## Changes by Section

### Section 2 — User Management
- **2.4 Update User**: Fixed request body fields from `fullName`/`phoneNumber` to actual DTO fields `mail`/`role`; added validation rules table

### Section 3 — Company Management
- **3.1 List Companies**: Added 5 missing query params (`hasKycDocuments`, `gstPendingManualReview`, `sortBy`, `sortOrder`, `startDate`, `endDate`); fixed role enum to include `Seller and Buyer`; added max limit 100
- **3.5 Update Company**: Added full request body with all 12 DTO fields and validation rules table

### Section 4 — KYC Document Review
- **4.1 List KYC Documents**: Added `search`, `sortBy`, `sortOrder` params; removed `companyId`; added document type enum values; fixed limit max 100

### Section 5 — Trade Management
- **5.1 List Trades**: Added 10 missing query params (`buyerId`, `sellerId`, `hasDispute`, `dateFrom`, `dateTo`, `minValue`, `maxValue`, `sortBy`, `sortOrder`, `stalledDays`); added `buyer_responded` and `cancelled` to negotiationStatus; added `CANCELLED` to tradePhase
- **5.7 Add Trade Note**: Removed non-existent `isInternal` field; added validation rules
- **5.9 Verify Document**: Fixed `documentType` from uppercase (`SCO`) to lowercase (`sco`); added `payment-proof` type; added validation rules
- **5.10 Force Phase**: Added `CANCELLED` to phases; added `notifyParties` optional field; added validation rules

### Section 6 — Dispute Management
- **6.1 List Disputes**: Fixed status `in_progress` → `under_review`; fixed priority `critical` → `urgent`; added 8 missing query params
- **6.7 Update Dispute Status**: Fixed status value `in_progress` → `under_review`; added validation rules
- **6.8 Resolve Dispute**: Replaced wrong fields (`resolution`, `outcome`, `notes`) with actual DTO field `resolutionNotes`

### Section 8 — System Management
- **8.12 Update Maintenance**: Added `allowedIPs` field; added validation rules table

### Section 9 — Content Management
- **9.1 Create Currency**: Added missing `symbolPosition` and `decimalPlaces` fields; added validation rules

### Section 13 — Alert Rules
- **13.2 Create Alert Rule**: Completely replaced wrong request body (had `condition`/`channels`/`isEnabled` objects) with actual DTO fields (`threshold`, `timeWindowMinutes`, `recipients`, `cooldownMinutes`); added AlertEventType enum values

### Section 14 — Security
- **14.2 Failed Logins**: Added missing `reason` filter param; added defaults and max limits

### Section 17 — Public Content
- **17.13 Suggest Category**: Removed non-existent `description` field; added validation rules

### Trade Module (spot-check)
- **Dispute Creation**: Fixed field `type` → `reason` with correct enum values; removed non-existent `subject` field; changed `critical` → `urgent`; made priority optional (default `medium`)
- **Document Download/Versions**: Removed `signed-spa` from download type params (not in controller validation)
- **Verify Document**: Added `pending` and `uploaded` to status enum (was only `approved`/`rejected`)
- **Advance Phase**: Marked `reason` as optional
- **Dispute Message**: Added `isInternal` optional boolean field

### AI Module (spot-check)
- **Gravity Score Response**: Removed fabricated `rawFactors` block (11 fields that don't exist in code)

## Files Modified
- `context/api/admin.md` — 16 targeted edits
- `context/api/trade.md` — 6 targeted edits
- `context/api/ai.md` — 1 targeted edit
- `context/changelog/2026-03-09-admin-api-docs-sync.md` — this file
