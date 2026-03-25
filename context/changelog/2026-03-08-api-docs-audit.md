---
type: changelog
date: 2026-03-08
tags: [docs, api, backend]
---

# API Documentation Audit — Full Codebase Sync

Audited all 16 API documentation modules in `context/api/` against the actual NestJS backend code. Fixed every discrepancy found.

## Summary
- **13 docs updated**, **3 unchanged** (auth, commodities, wishlist)
- ~100+ individual fixes across response shapes, field names, types, and missing endpoints
- 50+ new endpoints documented (blog-portal, public content, global search)

## Key Changes by Module

| Module | Fixes | Highlights |
|--------|-------|-----------|
| login | 3 | bypassOtp, suspension check at OTP validation |
| users | 1 | return-name returns email, not name |
| onboarding | 15 | GST verification flow, removed false progress claims |
| ai | 8 | 11 gravity factors (was 6), risk thresholds, breakdown scores |
| inbox | 5 | Conversation response rewrite, idempotent create |
| analytics | 13 | Real views (not faked), currency inference, sales-metrics rewrite |
| trade | 20+ | CANCELLED phase, SPA approval flow, counter limits, rejection tracking, e-signatures |
| products | 10+ | string→number types, view tracking, admin moderation, featured |
| company | 7 | Profile fields, CIS/KYC status, public profile 403 not 404 |
| feedback | 4 | Response shapes (flat keys, dashboard structure) |
| notification | 1 | Field renames (data, totalPages, hasPrevPage) |
| blog | 5+34 | Enum fix + 34 new blog-portal endpoints |
| admin | 20+ | Search, public content (15), get-by-ID, reminder DTO |

## Files Modified
- `context/api/login.md`
- `context/api/users.md`
- `context/api/onboarding.md`
- `context/api/ai.md`
- `context/api/inbox.md`
- `context/api/analytics.md`
- `context/api/trade.md`
- `context/api/products.md`
- `context/api/company.md`
- `context/api/feedback.md`
- `context/api/notification.md`
- `context/api/blog.md`
- `context/api/admin.md`
- `context/SESSION_CONTEXT.md`

## Related
- [[MOC-API]]
- [[SESSION_CONTEXT]]
