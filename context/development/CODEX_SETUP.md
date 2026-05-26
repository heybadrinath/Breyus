---
type: docs
date: 2026-04-07
tags: [development, infrastructure, docs]
---

# Codex Setup For Breyus

## What Was Created

- `[[AGENTS]]` was rewritten as the main Codex-facing repository guide.
- This document explains the Codex setup choices and the remaining gaps.

## Mapping From Claude Code

- `CLAUDE.md` remains the broad project reference and current feature-status source.
- `AGENTS.md` is now the compact, Codex-oriented operating guide with verified repo structure, workflow, and vault conventions.
- `.claude/commands/update-api-docs.md` was not ported as a Codex command in this pass.
- `.claude/settings.local.json` was not mirrored because Claude permission settings are tool-specific and do not translate directly to Codex.
- `.agents/skills/update-docs/SKILL.md` already exists in-repo and is reusable from Codex sessions, so it was left in place instead of duplicated.

## Files Not Created On Purpose

- No `codex.md` pointer file was added because Codex already uses `AGENTS.md` as the standard repo instruction file in this environment.
- No repo-local `.codex/` directory was added because there is no clear auto-loaded project-level `.codex` convention here, and adding one would risk dead config or duplicated guidance.

## Gaps Compared To The Claude Setup

- Claude has explicit repo-local command scaffolding under `.claude/commands/`; Codex does not get a one-to-one replacement from docs alone.
- Claude local permission presets in `.claude/settings.local.json` are not portable to Codex.
- There are nested/untracked Claude-oriented directories in subprojects that were not migrated in this task.
- Feature status still lives in `CLAUDE.md`; this was intentional to avoid maintaining two drifting status matrices.

## Recommendations

- Keep `[[AGENTS]]` short and structural. Let `[[CLAUDE]]`, `[[MEMORY]]`, and the MOCs carry deep reference material.
- If `/update-api-docs` is a frequent workflow, port it into a Codex-native skill or documented script instead of relying on the Claude command file.
- When major modules move, update `[[AGENTS]]`, `[[MOC-Development]]`, and `[[SESSION_CONTEXT]]` together so Codex sessions stay well-oriented.
- If Codex-specific recurring workflows expand, prefer adding small repo-local skills under `.agents/skills/` rather than growing `AGENTS.md` into another 800-line document.

## Related

- [[AGENTS]]
- [[CLAUDE]]
- [[MOC-Development]]
- [[SESSION_CONTEXT]]

