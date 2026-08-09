---
type: session-context
tags: [session, handoff]
---
# Session Context

> Prepend new session blocks at top. Keep only 3 most recent. MAX 80 lines total. Parallel-safe.

## Session: 2026-08-09 16:50
**Branch:** `deploy/portfolio-showcase`
**Focus:** Useful AI-area recommendations on the free deployment

**Done:**
- Added explainable marketplace ranking using commodity, HS code, seller reliability, country, and price signals
- Added Smart Match scores and reasons to buyer results
- Added deployment capability metadata and prevented unavailable market-analysis polling
- Made AI health distinguish platform recommendations from the optional external AI stack
- Passed focused recommendation tests and both production builds

**Open:**
- [ ] Connect a valid external AI provider only if generative market analysis is needed later

**Decisions:** Keep the free deployment lightweight and truthful; do not deploy the PostgreSQL, Redis, embedding-model, and Python stack merely to support the portfolio demo

## Session: 2026-07-20 11:30
**Branch:** `deploy/portfolio-showcase`
**Focus:** Reliable OTP delivery on the Render portfolio deployment

**Done:**
- Replaced the production OTP console fallback with a secured Vercel HTTPS relay and Gmail SMTP delivery
- Made OTP and password-reset failures visible to users instead of returning false success
- Reserved the free email allowance for security OTPs by disabling all non-OTP notification mail by default
- Added OTP endpoint throttling, failed-delivery cleanup, storage fallback validation, and focused tests
- Deployed the Vercel project as exactly `breyus`, stored SMTP values as sensitive Production variables, and verified its public health and authorization boundary
- Kept Mailjet credentials only in Render; the relay validates them before sending and never stores them
- Deployed Render commit `9dfbd35` and proved live send, Gmail inbox receipt, and submitted OTP verification with HTTP 201 responses
- Documented relay deployment, secret ownership, rotation, and troubleshooting

**Open:**
- [ ] Connect an external AI service only if generative market analysis is required

**Decisions:** Use Vercel as a narrow HTTPS-to-Gmail relay because Render Free blocks SMTP and direct Render-to-Mailjet requests reset; authenticate relay calls with existing Mailjet credentials; keep non-OTP email disabled; never log production OTP values

## Session: 2026-07-18 17:23
**Branch:** `deploy/portfolio-showcase`
**Focus:** Free Render deployment and operator handoff

**Done:**
- Documented the live `breyus` Render service, Docker topology, MongoDB Atlas database, and Cloudflare R2 storage
- Added repeatable change, deploy, verification, rollback, secret, and service recreation procedures
- Clearly separated the current portfolio deployment from the planned DigitalOcean production architecture

**Open:**
- [ ] Configure an HTTPS email provider for OTP delivery
- [ ] Deploy and connect the optional AI service
- [ ] Configure the commodity data API key

**Decisions:** Keep the public Render service name exactly `breyus`; treat Render dashboard secrets as live state; do not present unavailable integrations as working
