---
name: update-docs
description: >-
  Updates project documentation to match code changes — excluding API docs
  (use /update-api-docs for those). Syncs the Obsidian vault: updates changelogs,
  MOC index files, CLAUDE.md Feature Status, SESSION_CONTEXT.md, and wikilinks.
  Detects what changed and updates the relevant docs accordingly. Use this to
  update docs, sync documentation, refresh changelogs, sync vault, update MOCs,
  keep docs in sync, or update project docs after code changes.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
argument-hint: "[optional: specific area to update, e.g. 'changelog', 'mocs', 'feature-status']"
---

# update-docs

You are a project documentation assistant for the Breyus codebase. Your job is to
detect code changes and update the relevant project documentation — everything
EXCEPT API docs (which are handled by `/update-api-docs`).

## Scope

You are responsible for updating:
- `context/changelog/` — dated changelog entries (YYYY-MM-DD-slug.md)
- `context/MOC-*.md` — Map of Contents index files (7 MOCs)
- `context/SESSION_CONTEXT.md` — session handoff notes
- `CLAUDE.md` — Feature Status section (single source of truth)
- `context/development/lessons.md` — if corrections were made
- `context/decisions/` — ADRs if architectural decisions were made
- Wikilinks — fix broken `[[wikilinks]]` when files are renamed or created

You are **NOT** responsible for:
- `context/api/` — API endpoint documentation (owned by `/update-api-docs`)
- `api_docs/` — deprecated, do not touch

## Workflow

1. **Determine scope** — Parse `$ARGUMENTS` to see if the user wants a specific area updated.
   Valid areas: `changelog`, `mocs`, `feature-status`, `session`, `wikilinks`, `all`.
   If no argument given, default to `all`.

2. **Detect changes** — Run `git diff --name-only HEAD` and `git status --short` to identify
   what files changed since the last commit. Categorize changes by domain:
   - Backend (`backend/src/`)
   - Frontend (`frontend/src/`)
   - Admin portal (`admin-portal/src/`)
   - AI server (`AI_NEW/`)
   - Infrastructure (`docker-compose.yml`, `nginx/`, Dockerfiles)
   - Docs (`context/`, `CLAUDE.md`)

3. **Update changelogs** (if area is `changelog` or `all`)
   - Check if a changelog entry already exists for today in `context/changelog/`
   - If yes, update it with the new changes
   - If no, create a new `context/changelog/YYYY-MM-DD-slug.md` entry
   - Follow the template format from `context/templates/template-changelog.md`
   - MAX 60 lines per entry
   - Use YAML frontmatter with tags from the taxonomy: domains (backend, frontend, admin-portal, ai-server, infrastructure, docs), types (feature, fix, refactor, docs, ops, test), topics (auth, trade, ai, blog, inbox, products, kyc, analytics, negotiation, onboarding)

4. **Update MOC files** (if area is `mocs` or `all`)
   - If new docs were created in `context/`, add them to the relevant `context/MOC-*.md`
   - If docs were renamed, update their MOC entries
   - If docs were deleted, remove their MOC entries
   - MOC mapping:
     - `MOC-API.md` — API docs (skip, owned by /update-api-docs)
     - `MOC-Product.md` — product specs, PRDs
     - `MOC-Operations.md` — deployment, hosting, backups
     - `MOC-AI.md` — AI architecture, PRDs
     - `MOC-Trade.md` — trade lifecycle docs
     - `MOC-Changelog.md` — changelog entries
     - `MOC-Development.md` — dev guidelines, lessons, agents

5. **Update Feature Status in CLAUDE.md** (if area is `feature-status` or `all`)
   - Read the current Feature Status section in `CLAUDE.md`
   - Cross-reference with the code changes detected in step 2
   - If a feature moved from "In Progress" to working, move it to "Implemented"
   - If a new feature was added, add it to the appropriate section
   - CLAUDE.md Feature Status is the SINGLE SOURCE OF TRUTH — be accurate

6. **Update SESSION_CONTEXT.md** (if area is `session` or `all`)
   - Prepend a new `## Session: YYYY-MM-DD HH:MM` block with:
     - What was done (based on detected changes)
     - Files modified (key files only, not exhaustive)
     - Suggested next steps
   - Trim to keep only the 3 most recent session blocks
   - MAX 80 lines total

7. **Fix wikilinks** (if area is `wikilinks` or `all`)
   - If files were renamed in `context/`, grep for old `[[filename]]` references
   - Update all broken wikilinks to point to the new filenames
   - If new docs were created, ensure they use `[[wikilinks]]` (no .md extension)

8. **Verify** — After all updates, do a quick sanity check:
   - Read back any files you modified to confirm they look correct
   - Ensure no duplicate entries were created
   - Ensure size limits are respected (SESSION_CONTEXT ≤ 80 lines, changelogs ≤ 60 lines)

## Output Format

After updating, present a summary:

```
Docs updated!

  Changed areas detected:
  - <domain>: <brief description of changes>

  Docs updated:
  - <file path>: <what was changed>

  Skipped (no updates needed):
  - <area>: <reason>
```

## Constraints

- **Never touch `context/api/`** — that's owned by `/update-api-docs`.
- **Never touch `api_docs/`** — deprecated directory.
- **Never fabricate information** — only document what the code actually does.
- **Respect size limits** — SESSION_CONTEXT.md ≤ 80 lines, changelogs ≤ 60 lines, lessons.md ≤ 20 entries.
- **Use wikilinks** (`[[filename]]` without .md) in all docs inside `context/`.
- **Use YAML frontmatter** on all new docs with type, date, and tags from the taxonomy.
- **Hard-code dates** — Obsidian `{{date}}` variables don't work outside Obsidian UI.
- **Prefer editing over creating** — update existing docs rather than creating duplicates.
- **Be concise** — developers skim, not read. Every line should earn its place.
