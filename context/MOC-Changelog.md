---
type: moc
tags: [moc, changelog, index]
---
# MOC: Changelog

> Release notes, change tracking, and session summaries.

## Recent Changes

- [[2026-07-20-transactional-email-delivery]] — Real OTP delivery through Mailjet's HTTPS API with truthful errors and throttling
- [[2026-07-18-render-deployment-runbook]] — Current Render deployment, verification, rollback, and maintenance runbook
- [[2026-04-11-blog-auth-regression-fixes]] — Blog auth redirect fix and signup email debounce repair
- [[2026-04-10-ai-vault-sync]] — AI vault reindex, stale reference fixes, and handoff refresh
- [[2026-04-07-codex-setup]] — Codex repository guide refresh and development-doc sync
- [[2026-04-07-api-docs-sync]] — API docs sync: AI analysis routing, blog personalization, wishlist alert wiring
- [[2026-03-11-docs-sync]] — Docs sync: MOC-Changelog backfill, session context update
- [[2026-03-10-production-code-checklist]] — Docker proxy migration guide + 25-item production code audit
- [[2026-03-10-production-hardening-checklist]] — Pre-production security and reliability checklist (13 items)
- [[2026-03-10-ci-cd-pipeline-docs]] — CI/CD pipeline documentation
- [[2026-03-10-ops-docs-audit]] — Operations docs audit and rewrite (backup, capacity, deployment, server setup)
- [[2026-03-09-docs-sync-all-domains]] — Full docs sync across 504 changed files (blog, GST, AI niche, profiles)
- [[2026-03-09-admin-api-docs-sync]] — API docs audit: admin (16 edits), trade (6 edits), AI (1 edit)
- [[2026-03-08-api-docs-audit]] — Comprehensive API docs audit across all 16 modules
- [[2026-03-07-obsidian-vault-migration]] — Migrated docs to Obsidian vault structure
- [[2026-03-07-project-genesis]] — Initial project documentation setup

## How to Add a Changelog Entry

1. Create a new file in `changelog/` named `YYYY-MM-DD-brief-description.md`
2. Include YAML frontmatter: `type: changelog`, `date`, `change_type`, `scope`, `tags`
3. Add Summary, Changes, Files Modified, and Related sections
4. Link to related docs with wikilinks

## Dataview: All Changelog Entries

```dataview
TABLE change_type as "Type", scope as "Scope", date as "Date"
FROM "changelog"
WHERE type = "changelog"
SORT date DESC
```

## Related
- [[MEMORY]]
- [[SESSION_CONTEXT]]
- [[development/lessons]]
