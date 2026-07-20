---
type: changelog
date: 2026-07-20
change_type: fix
scope: [backend, frontend, infrastructure, docs]
tags: [backend, frontend, infrastructure, docs, fix, test, ops, auth, onboarding]
---

# Transactional Email Delivery

## Summary

Replaced the deployed OTP flow's false-success development fallback with Brevo transactional email over HTTPS.

## Changes

- Added Brevo API delivery for OTP and password-reset emails while retaining SMTP for compatible environments.
- Return a service-unavailable error when required production email cannot be delivered and remove the unusable OTP.
- Added per-IP throttling for OTP send and verification endpoints.
- Disabled welcome, trade, newsletter, admin-status, and alert emails by default so the free allowance is reserved for security OTP codes.
- Corrected Redis-to-memory OTP fallback validation and rejected malformed stored data.
- Updated onboarding copy to confirm delivery only after the provider accepts the message.
- Added focused mail-service tests for delivery, failure, disabled and opt-in notifications, and storage fallback.
- Documented sender verification, Render secret setup, key rotation, limits, and troubleshooting.

## Files Modified

- `backend/src/mail/mail.service.ts`
- `backend/src/mail/mail.service.spec.ts`
- `backend/src/onboarding/onboarding.controller.ts`
- `backend/src/onboarding/onboarding.service.ts`
- `frontend/src/main/OnBoarding.tsx`
- `render.yaml`
- `context/operations/RENDER_DEPLOYMENT_RUNBOOK.md`

## Related

- [[operations/RENDER_DEPLOYMENT_RUNBOOK]]
- [[2026-07-18-render-deployment-runbook]]
