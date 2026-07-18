---
type: session-context
tags: [session, handoff]
---
# Session Context

> Prepend new session blocks at top. Keep only 3 most recent. MAX 80 lines total. Parallel-safe.

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

## Session: 2026-04-10 20:03
**Branch:** `development`
**Focus:** AI vault sync and docs handoff cleanup

**Done:**
- Indexed the consolidated AI PRDs plus the April 2 gap review in `context/MOC-AI.md`
- Fixed stale renamed-doc references in the AI planning docs and added `context/changelog/2026-04-10-ai-vault-sync.md`
- Refreshed this handoff while keeping the feature-status source of truth in `CLAUDE.md`

**Open:**
- [ ] Decide whether deleted Obsidian template/daily-note/ADR files should be replaced or their `.obsidian` references pruned
- [ ] Backend AI/blog/notification code changes remain uncommitted; API docs already reflect their observable behavior

**Decisions:** No feature-status update was needed in this pass because the live code changes were behavior fixes already covered by the April 7 API docs sync
