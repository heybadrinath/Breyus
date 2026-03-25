Update API documentation in `context/api/` to match the actual backend code.

## Arguments

`$ARGUMENTS` controls scope:

- **Empty** (no args): Auto-detect changed modules from `git diff --name-only HEAD~5` plus the 3 most recent `context/changelog/` entries. Only process modules with backend changes.
- **Module names** (e.g. `trade auth`): Update only the specified modules.
- **`all`**: Full audit of all 16 modules.

---

## Module Map

Each row maps backend source paths to the API doc file. When a module is in scope, read ALL listed source paths.

| Module | Backend Source Paths | API Doc |
|--------|---------------------|---------|
| auth | `backend/src/auth/` | `context/api/auth.md` |
| login | `backend/src/login/` | `context/api/login.md` |
| users | `backend/src/users/` | `context/api/users.md` |
| company | `backend/src/company/` | `context/api/company.md` |
| onboarding | `backend/src/onboarding/` | `context/api/onboarding.md` |
| products | `backend/src/products/` | `context/api/products.md` |
| trade | `backend/src/trade/` | `context/api/trade.md` |
| inbox | `backend/src/inbox/` | `context/api/inbox.md` |
| wishlist | `backend/src/wishlist/` | `context/api/wishlist.md` |
| feedback | `backend/src/feedback/` | `context/api/feedback.md` |
| analytics | `backend/src/analytics/` | `context/api/analytics.md` |
| notification | `backend/src/notification/` | `context/api/notification.md` |
| ai | `backend/src/ai/` | `context/api/ai.md` |
| blog | `backend/src/blog/`, `backend/src/blog-portal/` | `context/api/blog.md` |
| commodities | `backend/src/commodities/` | `context/api/commodities.md` |
| admin | `backend/src/admin/` (15+ sub-controllers!) | `context/api/admin.md` |

**IMPORTANT — Admin module:** `backend/src/admin/` contains 15+ sub-modules (auth, users, companies, kyc, trades, disputes, dashboard, system, analytics, alerts, activity, blog, content, products, search, security, gateway). When admin is in scope, check ALL sub-directories under `backend/src/admin/`.

---

## Per-Module Workflow

For each module in scope, execute these 4 steps:

### Step 1: Read Backend Code
Read these files in parallel (use Glob to discover, then Read):
- **Controller(s):** `*.controller.ts` — extract all `@Get`, `@Post`, `@Put`, `@Patch`, `@Delete` routes, `@UseGuards`, `@Param`, `@Query`, `@Body` decorators
- **DTOs:** `dto/*.ts` or `*.dto.ts` — extract field names, types, validation decorators (`@IsString`, `@IsOptional`, `@Min`, `@Max`, `@IsEnum`, etc.)
- **Schemas:** `schema/*.ts` or `*.schema.ts` — extract model fields, types, refs, defaults
- **Service(s):** `*.service.ts` — scan for response shaping (what data is actually returned), error messages, and business logic that affects the API contract

### Step 2: Read Existing API Doc
Read the full `context/api/<module>.md` file. Note the current structure, sections, frontmatter, and wikilinks.

### Step 3: Diff and Identify Changes
Compare code against docs. Look for:
- **Missing endpoints** (in code but not in docs)
- **Removed endpoints** (in docs but not in code)
- **Wrong HTTP methods or paths**
- **Incorrect request body fields** (missing fields, wrong types, wrong validation rules)
- **Incorrect response shapes** (field names, nesting, types)
- **Missing/wrong query parameters**
- **Missing/wrong path parameters**
- **Incorrect status codes or error messages**
- **Missing guards or authentication requirements**
- **Stale enum values**

### Step 4: Apply Updates
Use the Edit tool to make minimal, targeted changes. Follow the update rules below.

---

## Update Rules

1. **Preserve existing structure.** Do not reorganize sections or change heading hierarchy.
2. **Preserve YAML frontmatter.** Keep `type`, `module`, `tags` exactly as they are.
3. **Preserve wikilinks.** Keep all `[[...]]` references intact at the bottom of files.
4. **Preserve formatting conventions.** Match the existing file's style (table format, code block language, indentation).
5. **Only change what's actually wrong.** If an endpoint is correctly documented, skip it entirely.
6. **Add new endpoints** at the end of the Endpoints section (before Data Models), following the same numbered heading pattern.
7. **Remove endpoints** that no longer exist in code. Don't leave stubs.
8. **For response shapes**, match what the service actually returns — check the service method, not just the controller signature.
9. **Large files (admin.md, trade.md):** These can be 800-1300 lines. Read the FULL file before editing to avoid data loss. Use targeted Edit calls, not full Write.

---

## Reference Format

Use `context/api/feedback.md` as the canonical reference for doc structure. Key patterns:
- YAML frontmatter with type/module/tags
- Overview section
- Base URL
- Authentication note
- Numbered endpoint headings (`### 1. Endpoint Name`)
- Request/response JSON blocks with field tables
- Data Models section with TypeScript schema
- Error Handling section
- Example Requests section (curl)
- Frontend Integration Notes
- Related Modules with wikilinks

---

## Post-Update Tasks

After all modules are processed:

1. **MOC Update:** If any new API doc files were created, add them to `context/MOC-API.md`.
2. **Changelog:** Create `context/changelog/YYYY-MM-DD-api-docs-sync.md` with a summary of what changed per module. Use today's date. Follow the template format from `context/templates/template-changelog.md`. MAX 60 lines.
3. **Summary Table:** Print a markdown table to the user showing:

| Module | Status | Changes |
|--------|--------|---------|
| trade | Updated | 3 endpoints fixed, 1 added |
| auth | No changes | Docs match code |
| ... | ... | ... |

If a module was skipped (not in scope), show "Skipped" in the Status column.
