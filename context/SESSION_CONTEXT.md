---
type: session-context
tags: [session, handoff]
---
# Session Context

> Prepend new session blocks at top. Keep only 3 most recent. MAX 80 lines total. Parallel-safe.

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
- [ ] Deploy and connect the optional AI service

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

## Session: 2026-04-11 11:20
**Branch:** `development`
**Focus:** Daily bug scan follow-up for blog auth regressions

**Done:**
- Confirmed there were no new commits since the automation anchor or in the last 24 hours
- Fixed blog auth redirect handling so writer invite flows preserve `?redirect=` through login and signup
- Replaced the broken signup email debounce with an effect-backed timer that avoids duplicate and stale membership checks

**Open:**
- [ ] Frontend test validation is still pending because `frontend/node_modules/react-scripts` is missing in this environment
- [ ] Pre-existing backend/docs worktree changes remain untouched

**Decisions:** When the commit window is empty, this automation may carry forward prior memory-backed findings only if the current code still reproduces them concretely
