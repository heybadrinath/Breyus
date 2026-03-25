---
type: lesson-index
tags: [lesson, patterns]
---
# Lessons Learned

> Recurring patterns, mistakes, and rules to prevent them. Updated after every correction.

## Rules

### File Operations
1. **Always read before writing large files.** When migrating files, use `cat` with printf for prepending content rather than holding entire file contents in context.
2. **Check file sizes before reading.** Use `wc -l` to check line count. Files over 1000 lines should be handled with bash copy operations rather than Read + Write tool.
3. **Verify after write.** After creating or migrating files, spot-check with `head` to verify frontmatter and content integrity.

### Git
1. **Never amend commits after hook failure.** Create a new commit instead.
2. **Stage specific files.** Avoid `git add -A` in favor of named file adds.

### Context Management
1. **Update SESSION_CONTEXT.md at end of session.** This is the handoff file for the next session.
2. **Use tasks/todo.md for tracking.** Keep checkable items and mark as complete.

---

## Log

_No entries yet. Entries are added after corrections from the user._
