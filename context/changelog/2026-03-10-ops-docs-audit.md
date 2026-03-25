---
type: changelog
date: 2026-03-10
tags: [operations, docs, fix]
---

# 2026-03-10: Operations Docs Audit & Fixes

## Summary
Comprehensive audit of all 6 operations docs against actual codebase. Found 14 issues (4 critical, 3 high, 7 medium). Fixed all documentation issues.

## Critical Fixes

### BACKUP_AND_RECOVERY.md — Full Rewrite
- **Was:** Described Hetzner Storage Box mount strategy (`/mnt/storage_box/`), wrong container names (`breyus-mongo-1`), wrong PG user (`breyus`), missing MongoDB auth
- **Now:** Matches real `scripts/backup.sh` implementation — correct container names (`breyus_mongo`), correct PG user (`postgres`), proper auth flags, DigitalOcean Spaces for offsite, documents restore script

### CAPACITY_PLANNING.md — 15 Targeted Fixes
- Latency: `<20ms` → `50-80ms` (6 occurrences)
- Server price: `$96` → `$112` (cost tables, comparisons, conclusions)
- Storage pricing: `$20` → `$5` in comparison table
- Hetzner refs: `CPX41` → `DigitalOcean Droplet`, `€` → `$`, Storage Box → Spaces
- Dead link: `ADMIN_PORTAL_PLAN.md` → admin-portal source reference
- DR section: Updated backup strategy to match real scripts

### DEPLOYMENT.md — Bucket Strategy + Price
- Server price: `$96` → `$112`
- 3-bucket → single bucket (`breyus-files`) with `/uploads/`, `/backups/`, `/ai-data/` folders
- Updated env vars, mermaid diagram, file URL patterns

## Files Modified
- `context/operations/BACKUP_AND_RECOVERY.md` (full rewrite)
- `context/operations/CAPACITY_PLANNING.md` (15 edits)
- `context/operations/DEPLOYMENT.md` (8 edits)
- `context/SESSION_CONTEXT.md`
