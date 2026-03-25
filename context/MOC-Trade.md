---
type: moc
tags: [moc, trade, index]
---
# MOC: Trade Lifecycle

> Complete reference for the Breyus trade system — from purchase request to completion.

## Trade Flow
```
PR → SCO → ICPO → SPA → Payment Proof → BoL → Completion
```

| Stage | Description | Who Uploads |
|-------|-------------|-------------|
| **PR** | Purchase Request — buyer initiates with offer | Buyer |
| **Negotiation** | Multi-round counter-offers between parties | Both |
| **SCO** | Soft Corporate Offer | Seller |
| **ICPO** | Irrevocable Corporate Purchase Order | Buyer |
| **SPA** | Sales Purchase Agreement | Either |
| **Payment** | External payment + proof upload | Buyer |
| **BoL** | Bill of Lading | Seller |
| **Complete** | Trade closure & archival | System |

## API Documentation
- [[trade]] — Trade endpoints (create, negotiate, documents, lifecycle)
- [[admin]] — Admin trade management (force phase, verify documents, stalled trades)

## Negotiation Flow
1. Buyer creates PR with initial offer (price, incoterms, payment terms)
2. Seller can accept, reject, or submit counter-offer
3. Buyer responds to counter (accept, reject, or counter back)
4. Unlimited negotiation rounds tracked in history
5. Either party can accept/reject at any point
6. After acceptance, document upload phase begins

## Key Code Locations

### Backend
- Schema: `backend/src/trade/schema/trade.schema.ts`
- Service: `backend/src/trade/trade.service.ts`
- Controller: `backend/src/trade/trade.controller.ts`
- Audit: `backend/src/trade/audit.service.ts`
- Invoice: `backend/src/trade/invoice.service.ts`
- Notifications: `backend/src/trade/trade-notification.service.ts`
- WebSocket: `backend/src/trade/trade.gateway.ts`

### Frontend
- Buyer trade page: `frontend/src/buyer/pages/trade.tsx`
- Seller trade page: `frontend/src/seller/pages/trade.tsx`
- Negotiation: `frontend/src/buyer/pages/negotiation.tsx`, `frontend/src/seller/pages/negotiation.tsx`
- Trade tabs: `frontend/src/components/tradeTabs.tsx`
- Trade tracking: `frontend/src/components/TrackTrade.tsx`
- Trade details modal: `frontend/src/components/TradeDetailsModal.tsx`
- Document modals: `frontend/src/components/DocumentUploadModal.tsx`, `ViewDocumentModal.tsx`

### Admin
- Admin trade management: `backend/src/admin/trades/`
- Admin disputes: `backend/src/admin/disputes/`

## Document Types
| Document | Format | Phase |
|----------|--------|-------|
| SCO | PDF/Image | After negotiation acceptance |
| ICPO | PDF/Image | After SCO upload |
| SPA | PDF/Image | After ICPO upload |
| Payment Proof | PDF/Image | After SPA signing |
| Bill of Lading | PDF/Image | After payment verification |

## Related
- [[MOC-API]]
- [[products]]
- [[company]]
- [[inbox]]
- [[analytics]]
