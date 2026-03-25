---
type: decision
date: "2026-03-07"
status: accepted
tags: [decision, obsidian, documentation]
---
# ADR-001: Use Obsidian Vault for Project Documentation

## Context
Project documentation was scattered across `api_docs/`, `context/`, and root-level markdown files. There was no consistent metadata, no cross-linking between docs, and no structured navigation. Claude Code sessions had no persistent session state or handoff mechanism.

## Decision
Restructure the `context/` directory as an Obsidian vault with:
- YAML frontmatter on all documents for metadata and Dataview queries
- Wikilinks (`[[doc-name]]`) for cross-referencing
- MOC (Map of Contents) files as navigational indexes
- `MEMORY.md` as the keystone entry point
- `SESSION_CONTEXT.md` for Claude Code session handoff
- `lessons.md` for tracking corrections and patterns
- Templates for consistent note creation
- Dataview plugin for dynamic queries

## Consequences
### Positive
- Single source of truth for all project documentation
- Rich navigation via wikilinks and graph view
- Structured metadata enables queries (e.g., "all API docs", "all PRDs")
- Session handoff reduces context loss between Claude Code sessions
- Templates enforce consistency

### Negative
- Requires Obsidian (or compatible editor) for full experience
- YAML frontmatter adds minor boilerplate to every file
- `.obsidian/` config files add to repo size

### Risks
- Team members unfamiliar with Obsidian may not leverage the full feature set
- Wikilinks are Obsidian-specific (but degrade gracefully as plain text in other editors)

## Alternatives Considered
1. **Continue with flat markdown** -- Rejected because navigation was poor and no metadata support
2. **Use a wiki platform (Notion, Confluence)** -- Rejected to keep docs version-controlled alongside code
3. **Use MkDocs or Docusaurus** -- Rejected as overkill for internal docs; Obsidian is lighter weight

## Related
- [[MEMORY]]
- [[MOC-Changelog]]
