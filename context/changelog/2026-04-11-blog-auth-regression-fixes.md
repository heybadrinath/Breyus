---
type: changelog
date: 2026-04-11
change_type: fix
scope: blog-auth
tags: [changelog, fix, frontend, blog, auth]
---

# 2026-04-11 — Blog Auth Regression Fixes

## Summary
Closed two blog auth regressions uncovered by the daily bug scan memory: invite redirects now survive login/signup, and signup email membership checks no longer queue stale requests.

## Changes
- Updated blog login to honor `?redirect=` targets after auth and preserve that redirect when linking to signup
- Updated blog signup to honor the same redirect target after auth and when linking back to login
- Replaced the broken inline email debounce with an effect-backed timer guarded against stale async responses

## Files Modified
- `frontend/src/blog/pages/BlogLoginPage.tsx` — preserve safe redirect targets through login/signup navigation
- `frontend/src/blog/pages/BlogSignupPage.tsx` — fix post-auth redirects and debounce email membership checks
- `context/SESSION_CONTEXT.md` — prepended current session handoff
- `context/MOC-Changelog.md` — indexed this entry
- `context/changelog/2026-04-11-blog-auth-regression-fixes.md` — NEW

## Related
- [[SESSION_CONTEXT]]
- [[MOC-Changelog]]
