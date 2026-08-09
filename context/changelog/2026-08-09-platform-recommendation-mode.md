---
type: changelog
date: 2026-08-09
change_type: feature
scope: [backend, frontend, docs]
tags: [ai, recommendations, render, portfolio, test]
---

# Platform Recommendation Mode

## Summary

Enabled useful AI-area matching on the free Render deployment without requiring the separate Python AI stack.

## Changes

- Added deterministic ranking for live marketplace products using commodity terms, HS-code prefix, seller reliability, requested country, and price range.
- Marked top results as Smart Matches with an explainable score and reason.
- Added deployment capability metadata so the UI starts market analysis only when an external AI service is configured.
- Made `/api/ai/health` report platform recommendations as available while clearly reporting generative market analysis as unavailable.
- Preserved the existing external AI integration for a future deployment with `AI_SERVER_URL` and `AI_API_KEY`.
- Added focused tests for ranking order, preference signals, and score bounds.

## Verification

- Backend recommendation tests: 3 passed.
- Backend production build: passed.
- Frontend production build: passed with existing repository warnings.
- New recommendation module and interfaces: ESLint passed.

## Files Modified

- `backend/src/ai/platform-recommendation.ts`
- `backend/src/ai/platform-recommendation.spec.ts`
- `backend/src/ai/ai-http.service.ts`
- `backend/src/ai/ai.service.ts`
- `frontend/src/components/ai/AIResultCard.tsx`
- `frontend/src/buyer/pages/ai-result.tsx`
- `frontend/src/seller/pages/ai-result.tsx`
- `context/operations/RENDER_DEPLOYMENT_RUNBOOK.md`

## Related

- [[MOC-AI]]
- [[operations/RENDER_DEPLOYMENT_RUNBOOK]]
- [[2026-07-18-render-deployment-runbook]]
