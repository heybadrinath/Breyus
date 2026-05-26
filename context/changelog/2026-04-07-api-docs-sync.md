---
type: changelog
date: 2026-04-07
change_type: docs
scope: api
tags: [changelog, docs, backend, ai, blog, notification]
---

# 2026-04-07 — API Docs Sync: AI, Blog, Notification

## Summary
Synced API documentation to match current backend behavior for AI analysis notifications, personalized blog interest extraction, and wishlist-triggered alerts.

## Changes
- AI API: documented fallback `market_context` forwarding and role-aware analysis completion notification links
- Blog API: clarified that seller inventory interests come from `Product.userId` ownership
- Notification API: documented buyer/seller analysis deep links and `Wishlist.product`-based stock and price alerts
- MOC-Changelog: added today's API docs sync entry

## Files Modified
- `context/api/ai.md` — updated market analysis implementation notes
- `context/api/blog.md` — clarified personalized interest source behavior
- `context/api/notification.md` — documented notification routing and wishlist alert wiring
- `context/MOC-Changelog.md` — added today's changelog entry
- `context/changelog/2026-04-07-api-docs-sync.md` — NEW

## Related
- [[SESSION_CONTEXT]]
- [[MOC-API]]
