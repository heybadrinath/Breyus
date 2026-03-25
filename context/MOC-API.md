---
type: moc
tags: [moc, api, index]
---
# MOC: API Documentation

> Index of all API module documentation. Each file covers one functional area of the Breyus backend.

## Core Modules
- [[auth|Authentication]] -- Session validation, password management, rate limiting
- [[login|Login]] -- Email/password + OTP two-factor authentication
- [[onboarding|Onboarding]] -- 5-step user registration wizard

## Business Modules
- [[products|Products]] -- Product catalog, HSN search, marketplace listings
- [[trade|Trade]] -- Trade lifecycle (PR through BoL), negotiation, documents
- [[company|Company]] -- Company profiles, delivery addresses, KYC, media
- [[ai|AI]] -- Link prediction, market analysis, commodity search, gravity scoring
- [[commodities|Commodities]] -- Real-time commodity prices (Alpha Vantage)

## Supporting Modules
- [[wishlist|Wishlist]] -- Saved products, AI contacts, favourite companies
- [[inbox|Inbox]] -- Messaging system with WebSocket real-time gateway
- [[users|Users]] -- User profiles and notification preferences
- [[analytics|Analytics]] -- Dashboard metrics, charts, CSV/PDF export
- [[blog|Blog]] -- Public blog with personalization and newsletter
- [[feedback|Feedback]] -- Trade ratings (seller, delivery, product)
- [[notification|Notification]] -- 35+ notification types with pagination

## Admin Portal
- [[admin|Admin]] -- 15 controllers covering auth, users, companies, KYC, trades, disputes, dashboard, system health, content management, blog, products, alerts, security

## Dataview: All API Docs

```dataview
TABLE module as "Module", file.size as "Size"
FROM "api"
WHERE type = "api-doc"
SORT module ASC
```

## Related
- [[MEMORY]]
- [[Breyus_Technical_Documentation]]
- [[DEPLOYMENT]]
