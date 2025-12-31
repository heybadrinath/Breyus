# Breyus Product Requirements Document (PRD)

## 1. Product Overview

Breyus is a hybrid **B2B commodity trading marketplace + AI-powered negotiation and deal-enablement platform** designed for global import/export traders, suppliers, manufacturers, and large enterprises. The platform streamlines the end-to-end commodity trading lifecycle, integrating product discovery, AI demand forecasting, buyer-seller matching, negotiation, documentation workflow, shipment confirmation, and audit trails.

The system combines:

- A global commodity marketplace (mainstream + niche)
- Supplier inventory & product listing system
- AI-powered prediction, similarity search, and buyer scoring
- Negotiation engine with counter-offers and Incoterm editing
- Trade lifecycle tools (PR → SCO → ICPO → SPA → BoL → Completion)
- Secure real-time messaging with E2E encryption
- Compliance & KYC enforcement
- Document verification workflow

Only functionality visible in the Figma screens is included. No future features.

---

## 2. User Roles

### 2.1 Buyer

Buyers are importers, wholesalers, or large enterprise procurement teams.
They can:

- Browse marketplace (unverified)
- Access Breyus AI (only after KYC)
- Create PRs
- Negotiate counter-offers
- Upload signed ICPO, SPA, Payment Proof
- Chat with sellers
- View trade history

### 2.2 Seller

Suppliers, manufacturers, and export houses.
They can:

- List mainstream or niche products
- Manage inventory
- Receive PRs
- Upload SCO, SPA, BoL
- Negotiate counter-offers
- Chat with buyers
- Access Breyus AI (after KYC)

### 2.3 Role Rule

**Only one role per account.** A user cannot be both buyer and seller.

---

## 3. KYC & Access Control

### 3.1 KYC Requirements

Both buyers and sellers must complete KYC to access any core trading features.

### 3.2 Unverified Users Can Only:

- Browse marketplace
- View product pages
- See commodity list (mainstream + niche)

### 3.3 Verified Users Can:

- Use Breyus AI
- List products
- Create PRs
- Upload documents
- Negotiate
- Chat
- Use dashboards

All KYC screens include identity verification, company verification, and document uploads.

---

## 4. Commodity Types

### 4.1 Mainstream Commodity Definition

If commodity appears in the **Mainstream Commodity List**, it is classified automatically as mainstream.

### 4.2 Niche Commodity Definition

If a commodity is **not** on the mainstream list, it is automatically a niche commodity.

### 4.3 Auto-detection Logic

System determines commodity type automatically based on name.
No manual override.

---

## 5. Marketplace Module

### 5.1 Product Listing

A seller can list a product with:

- Basic info (name, category, MOQ, HSN)
- Pricing (cost, discount, selling price)
- Environmental impact
- Quality parameters
- Export information
- Incoterm options

### 5.2 Inventory Management

Sellers can:

- Toggle stock availability
- Update price and quantity
- Organize products by commodity type (mainstream vs niche)

### 5.3 Search & Filters

Buyers can search by:

- Commodity
- Location
- Price range
- MOQ
- Seller verification
- Incoterm preference

AI-based similarity search available for verified users only.

---

## 6. Breyus AI (KYC Required)

### 6.0 Entry Logic (Mainstream vs Niche)

When a buyer enters a commodity, the backend checks it against the mainstream commodity list:

- If **mainstream**, continue to the Breyus AI flow.
- If **not mainstream**, prompt the user to switch to Niche AI.

HS/HSN is required for AI requests:

- Accept 4, 6, 8, or 10 digit codes.
- Canonical AI key is **HS-6** (6 digits).
- If 8/10 digits are provided, truncate to 6 for AI calls.
- If 4 digits are provided (HSN-style), use prefix matching (e.g., `0901%`).

AI prediction payload (partner matching):
- Use company name for lookup in the AI trade dataset (AI DB IDs are not required).
- Send only useful context for matching/scoring: country, location (lat/lon), buyer port (from the form), price range, mean monthly revenue, and payment terms/credit score.
- Include `role` (buyer/seller) when sending profile context so the AI knows which side the profile belongs to.
- Link prediction uses the AI trade dataset with a commodity pool fallback to avoid empty results when direct matches are missing.

### 6.1 AI Demand Forecast

Graphs showing:

- Historical demand
- Current trend
- Future predictions (dotted lines)

### 6.2 Price Volatility

Shows monthly and yearly volatility with future projections.

### 6.3 Buyer Probability Score

Predicts top potential buyers for a seller.
Shown in:

- Commodity details
- PR negotiations
- Trade dashboard

### 6.4 Niche AI

Finds the correct niche commodity through AI and starts a niche-first flow:

1. User enters a commodity in Niche AI.
2. Backend calls `POST /v1/commodities/search-niche`.
3. UI shows a **grid of matching commodities** and flags each item using `is_niche` (true/false).
4. User selects a commodity from the grid.
5. The same Breyus AI pipeline runs on the selected commodity:
   - `POST /v1/analysis/initiate`
   - `POST /v1/links/predict`
   - `POST /v1/trades/score`

### 6.5 AI Result Actions (Platform Check)

For each AI result (buyer/seller):

- Check the Breyus user database by **email or phone**.
- If the user exists on platform, show **PO** and **Chat** buttons.
- If not, hide those buttons and show **contact info** + **AI scores** only.

---

## 7. Product Page

Each product shows:

- Description
- Applications
- Environmental impact
- Quality metrics
- Reviews
- Preferred trade terms
- Test reports
- AI insights (for verified users)
- Button: Send Purchase Request

---

## 8. Purchase Request (PR) Module

### 8.1 PR Creation

Buyer selects:

- Commodity
- Quantity
- Incoterm
- Port
- Delivery date
- Additional industry questions

### 8.2 PR Statuses

- Draft
- Submitted
- Negotiation
- Accepted
- Rejected

### 8.3 Counter-Offer Engine

Unlimited counter rounds.
Clear CTA to jump into chat at any time.

### 8.4 AI Suggestions

AI suggests better buyers/sellers, pricing confidence, and predicted success.

---

## 9. Negotiation Module

### 9.1 Features

- Both parties can counter-offer
- Edit Incoterms
- Compare price variations
- Use AI suggestions
- Switch to chat anytime

### 9.2 Counter Rules

No limit on counter rounds.

---

## 10. Incoterms Manager

### 10.1 Buyer & Seller Responsibilities

Matrix showing transport, insurance, risk, customs, etc.
Editable during negotiation.

### 10.2 Versioning

Finalized Incoterm attached to trade.

---

## 11. Document Workflow

### 11.1 Supported Docs

- SCO (Soft Corporate Offer)
- ICPO (Irrevocable Corporate Purchase Order)
- SPA (Sales Purchase Agreement)
- BoL (Bill of Lading)
- Payment Proof

### 11.2 Signing Workflow

**No e-signatures.**\
Users upload already-signed PDFs.

### 11.3 Verification Status

- Pending
- Verified
- Rejected

Each rejection shows reason and CTA to contact via chat.

---

## 12. Trade Lifecycle (Configurable Per Trade)

Default flow:

1. PR →
2. SCO →
3. ICPO →
4. Pre-SPA →
5. Re-SPA →
6. Payment Proof →
7. BoL →
8. Verification →
9. Trade Completion

Seller and buyer can skip or reorder certain steps depending on agreement.

---

## 13. Chat Module

### 13.1 Encryption

End-to-end encryption for users.

### 13.2 AI Access

AI can read messages for reply suggestions.

### 13.3 Features

- Attachments
- Trade-linked conversations
- System messages (status changes)

---

## 14. Dashboard

### 14.1 Buyer Dashboard

- Ongoing trades
- PR statuses
- Document statuses
- AI insights

### 14.2 Seller Dashboard

- Incoming PRs
- Trade pipeline
- Inventory alerts
- AI buyer recommendations

---

## 15. Analytics

Stored for 7 years.

Shows:

- Revenue stats
- Trade history
- Country distribution
- Top commodities
- Time-series graphs

---

## 16. Compliance

- Mandatory KYC for all trading actions
- Document audit trail
- Data retention: 7 years
- Marketplace viewing allowed without verification

---

## 17. Access Control Summary

| Feature            | Unverified | Verified Buyer | Verified Seller |
| ------------------ | ---------- | -------------- | --------------- |
| Browse marketplace | Yes        | Yes            | Yes             |
| Use Breyus AI      | No         | Yes            | Yes             |
| Create PR          | No         | Yes            | No              |
| List products      | No         | No             | Yes             |
| Negotiate          | No         | Yes            | Yes             |
| Upload documents   | No         | Yes            | Yes             |
| Chat               | No         | Yes            | Yes             |
| View dashboards    | No         | Yes            | Yes             |

---

## 18. System Principles

- No internal payments
- AI is contextual and trade-aware
- Doc workflow is manual-sign + upload
- Unlimited negotiation cycles
- Auto niche/mainstream classification
- Hybrid SaaS + marketplace model

---

## 19. Final Scope

This PRD contains **only** features visible and confirmed in the Figma UI. No future modules or speculative roadmap items are included.
