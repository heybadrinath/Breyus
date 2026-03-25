---
type: operations-doc
module: operations
tags: [operations, security, code-quality]
date: 2026-03-10
---

# Production Code Checklist

> **Status:** Pre-production code audit findings. Separate from [[operations/PRODUCTION_HARDENING]] (infrastructure).
> **Last Updated:** March 2026
> **Source:** Code audit across all backend, frontend, and AI modules.

---

## Priority Legend

| Priority | Meaning | When to Fix |
|----------|---------|-------------|
| **CRITICAL** | Security vulnerability or data integrity risk | Before any public traffic |
| **HIGH** | Significant security or reliability gap | Before production launch |
| **MEDIUM** | Best practice improvement | First maintenance window |
| **LOW** | Code quality / hygiene | When touching nearby code |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **OPEN** | Not yet fixed |
| **FIXED** | Fix implemented and verified |
| **WON'T FIX** | Accepted risk with documented rationale |

---

## CRITICAL Issues (5)

### 1. OTP Bypass Enabled in Login Service — `OPEN`

**File:** `backend/src/login/login.service.ts` (~line 55)
**Issue:** `bypassOtp: true` flag skips email OTP verification entirely — any valid password grants full access.
**Note:** Intentional for development. Must be toggled off before production.
**Fix:** Remove or gate behind `NODE_ENV !== 'production'`:
```typescript
if (process.env.NODE_ENV === 'production') {
  // Always require OTP in production
  await this.sendOtp(user.email);
  return { message: 'OTP sent', requiresOtp: true };
}
```
**Find:** `grep -rn "bypassOtp\|bypass_otp\|skipOtp" backend/src/`

---

### 2. Error Messages Leak Internal Details — `OPEN`

**File:** `backend/src/auth/auth.service.ts`, multiple controllers
**Issue:** Error responses include raw exception messages (`'Error: ' + e`) which can expose stack traces, file paths, and database structure to clients.
**Fix:** Log the full error internally, return generic messages to clients:
```typescript
// BAD:  throw new InternalServerErrorException('Error: ' + e);
// GOOD: this.logger.error('Auth validation failed', e); throw new InternalServerErrorException('An error occurred');
```
**Find:** `grep -rn "'Error: ' + e\|'Error:' + e\|message: e\\.message" backend/src/ --include="*.ts"`
**Count:** ~12 instances across auth, trade, company, and product services

---

### 3. CORS Falls Back to Localhost Origins — `OPEN`

**File:** `backend/src/main.ts`
**Issue:** If `CORS_ORIGIN` env var is missing or empty, the code falls back to allowing `http://localhost:3000` and `http://localhost:5173`. In production with a misconfigured `.env`, this silently opens CORS to localhost.
**Fix:** Fail fast if `CORS_ORIGIN` is not set in production:
```typescript
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN must be set in production');
}
```

---

### 4. Missing MongoDB Transactions on Trade State Transitions — `OPEN`

**File:** `backend/src/trade/trade.service.ts`
**Issue:** Trade phase advances, document uploads, and negotiation state changes update multiple fields without transactions. A crash mid-update can leave trades in inconsistent states (e.g., phase advanced but document status not updated).
**Fix:** Wrap multi-field trade updates in Mongoose sessions:
```typescript
const session = await this.connection.startSession();
await session.withTransaction(async () => {
  await this.tradeModel.findByIdAndUpdate(tradeId, phaseUpdate, { session });
  await this.auditService.logPhaseChange(tradeId, details, { session });
});
```
**Find:** `grep -rn "findByIdAndUpdate\|updateOne\|save()" backend/src/trade/trade.service.ts`

---

### 5. Race Condition on Document Upload Flag — `OPEN`

**File:** `backend/src/trade/schema/trade.schema.ts`, `trade.service.ts`
**Issue:** `documentUploadInProgress` is checked and set in separate operations (read-then-write). Two concurrent uploads can both pass the check before either sets the flag.
**Fix:** Use atomic `findOneAndUpdate` with the condition in the query:
```typescript
const trade = await this.tradeModel.findOneAndUpdate(
  { _id: tradeId, documentUploadInProgress: { $ne: true } },
  { $set: { documentUploadInProgress: true } },
  { new: true }
);
if (!trade) throw new ConflictException('Upload already in progress');
```

---

## HIGH Issues (7)

### 6. Hardcoded Localhost URLs in Frontend — `OPEN`

**Issue:** Frontend files contain hardcoded `localhost` references that will break or cause security issues in production.
**Find:** `grep -rn "localhost" frontend/src/ --include="*.ts" --include="*.tsx" | grep -v node_modules`
**Count:** ~9 files
**Fix:** Replace all instances with `process.env.REACT_APP_BACKEND_URL`. Common locations: `socket.service.ts`, `auth.service.ts`, `ai.service.ts`.

---

### 7. DOMPurify Imported But Not Used on User Content — `OPEN`

**Issue:** `DOMPurify` is in `package.json` but user-generated HTML content (blog posts, trade notes, negotiation messages) is rendered without sanitization.
**Find:** `grep -rn "dangerouslySetInnerHTML\|innerHTML" frontend/src/ --include="*.tsx"`
**Fix:** Wrap all user-content rendering with `DOMPurify.sanitize()`:
```tsx
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

---

### 8. File Upload MIME Type Too Permissive — `OPEN`

**File:** `backend/src/products/file-upload.interceptor.ts`
**Issue:** MIME check uses `startsWith('image/')` which allows `image/svg+xml`. SVG files can contain embedded JavaScript (XSS vector).
**Fix:** Explicit whitelist:
```typescript
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
if (!ALLOWED_MIMES.includes(file.mimetype)) throw new BadRequestException('Invalid file type');
```

---

### 9. Regex DoS in Product Search — `OPEN`

**File:** `backend/src/products/products.service.ts`, `backend/src/commodities/commodities.service.ts`
**Issue:** User input is passed directly to `new RegExp(query, 'i')` without escaping special characters. Crafted inputs like `(a+)+$` cause catastrophic backtracking.
**Fix:** Escape regex special chars before constructing:
```typescript
const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(escaped, 'i');
```
**Find:** `grep -rn "new RegExp(" backend/src/ --include="*.ts"`

---

### 10. Missing forbidNonWhitelisted in ValidationPipe — `OPEN`

**File:** `backend/src/main.ts`
**Issue:** Global `ValidationPipe` is missing `forbidNonWhitelisted: true`. Extra fields in request bodies pass through silently, potentially allowing mass assignment attacks.
**Fix:**
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,  // ADD THIS
  transform: true,
}));
```

---

### 11. AI API Key Defaults to Empty String — `OPEN`

**File:** `AI_NEW/server/config.py`
**Issue:** API key config defaults to empty string. Server starts without authentication, accepting unauthenticated requests.
**Fix:** Make API key required with no default. Fail at startup if missing:
```python
AI_API_KEY = os.environ.get("AI_API_KEY")
if not AI_API_KEY:
    raise ValueError("AI_API_KEY environment variable is required")
```

---

### 12. Email Header Injection Possible — `OPEN`

**Issue:** Email fields in DTOs accept newline characters (`\r`, `\n`). An attacker can inject additional email headers (BCC, CC) via the email field.
**Fix:** Add regex validation to all email DTO fields:
```typescript
@Matches(/^[^\r\n]+$/, { message: 'Email must not contain newlines' })
@IsEmail()
email: string;
```
**Find:** `grep -rn "@IsEmail()" backend/src/ --include="*.dto.ts"`

---

## MEDIUM Issues (9)

### 13. Excessive console.log in Frontend — `OPEN`

**Find:** `grep -rn "console\.\(log\|warn\|error\|debug\)" frontend/src/ --include="*.ts" --include="*.tsx" | wc -l`
**Count:** ~86 files
**Fix:** Remove or wrap in development check:
```typescript
if (process.env.NODE_ENV === 'development') console.log(...);
```
Or use a logger utility that no-ops in production.

---

### 14. Cookie sameSite Inconsistent — `OPEN`

**File:** `backend/src/auth/auth.service.ts`, `backend/src/login/login.service.ts`
**Issue:** Complex conditional logic for `sameSite` that varies by endpoint. Should be `strict` in production.
**Fix:** Centralize cookie config:
```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  signed: true,
};
```

---

### 15. Missing Rate Limiting on Creation Endpoints — `OPEN`

**File:** `backend/src/products/products.controller.ts`, `backend/src/trade/trade.controller.ts`
**Issue:** No `@Throttle()` decorator on product creation, trade creation, or message sending endpoints. Users can spam-create resources.
**Fix:** Add per-route throttling:
```typescript
@Throttle({ default: { ttl: 60, limit: 10 } })
@Post('create')
async createTrade(...) { ... }
```

---

### 16. OTP Entropy Too Low — `OPEN`

**File:** `backend/src/mail/mail.service.ts`
**Issue:** 6-digit OTP = 1,000,000 possible combinations. With no rate limiting on the OTP validation endpoint, brute-force is feasible (~17 minutes at 1000 req/s).
**Fix:** Consider 8-digit OTP (100M combinations) and add rate limiting to `POST /login/validate-otp`.

---

### 17. OTP Race Condition — Concurrent Validation — `OPEN`

**File:** `backend/src/login/login.service.ts`
**Issue:** OTP is read from Redis and deleted in separate operations. Two concurrent requests with the same OTP can both succeed if timed correctly.
**Fix:** Use Redis atomic `GETDEL` (Redis 6.2+) or Lua script for check-and-delete:
```typescript
const otp = await this.redis.getdel(`otp:${email}`);
if (otp !== submittedOtp) throw new UnauthorizedException('Invalid OTP');
```

---

### 18. Missing @MaxLength on String DTO Fields — `OPEN`

**Issue:** Many DTO string fields lack `@MaxLength()` validation. A client can send megabyte-sized strings in name, description, or note fields.
**Find:** `grep -rn "@IsString()" backend/src/ --include="*.dto.ts" | head -20`
**Fix:** Add `@MaxLength(N)` to all string fields. Common limits: names (100), descriptions (5000), notes (2000).

---

### 19. WebSocket Message Validation Missing — `OPEN`

**File:** `backend/src/inbox/inbox.gateway.ts`, `backend/src/trade/trade.gateway.ts`
**Issue:** WebSocket message handlers accept payload without size or content validation. A client can send arbitrarily large messages.
**Fix:** Add payload size checks and DTO validation in gateway handlers.

---

### 20. AI Response Schema Validation Missing — `OPEN`

**File:** `backend/src/ai/ai-http.service.ts`
**Issue:** Responses from the FastAPI AI server are trusted and passed through without schema validation. Malformed AI responses could crash the backend or expose unexpected data.
**Fix:** Validate AI responses against expected schemas before returning to frontend.

---

### 21. Missing Compound Database Indexes — `OPEN`

**Issue:** Several frequently-queried collections lack compound indexes:
- KYC documents queue: `{ 'kycDocuments.status': 1, 'kycDocuments.submittedAt': -1 }`
- Buyer pending trades: `{ buyerId: 1, status: 1, createdAt: -1 }`
- Product search: `{ category: 1, isActive: 1 }` with text index on name/description
**Find:** Check existing indexes: `db.collection.getIndexes()` in MongoDB shell
**Fix:** Add compound indexes in schema definitions or via migration script.

---

## LOW Issues (4)

### 22. console.error Instead of Logger in Backend — `OPEN`

**Find:** `grep -rn "console\.\(log\|error\|warn\)" backend/src/ --include="*.ts" | grep -v node_modules | grep -v ".spec.ts"`
**Issue:** Backend services use `console.error` instead of NestJS `Logger`. Loses structured logging, log levels, and context.
**Fix:** Replace with `this.logger.error()` using the injected NestJS `Logger`.

---

### 23. Magic Numbers in Trade Phases — `OPEN`

**File:** `backend/src/trade/trade.service.ts`
**Issue:** Hardcoded retry limits, timeout durations, and phase indices as raw numbers. Makes maintenance error-prone.
**Fix:** Extract to named constants or config:
```typescript
const TRADE_CONSTANTS = {
  MAX_NEGOTIATION_ROUNDS: 10,
  DOCUMENT_UPLOAD_TIMEOUT_MS: 300000,
  STALLED_TRADE_THRESHOLD_DAYS: 14,
};
```

---

### 24. Missing Helmet Middleware — `OPEN`

**File:** `backend/src/main.ts`
**Issue:** No `helmet` middleware for setting security headers (X-Frame-Options, X-Content-Type-Options, etc.). While Nginx adds some headers, defense-in-depth requires backend headers too.
**Fix:**
```bash
npm install helmet
```
```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

### 25. AI_NEW Environment Variables Not Validated at Startup — `OPEN`

**File:** `AI_NEW/server/config.py`
**Issue:** Missing env vars silently default to empty strings or `None`. Server starts but fails at runtime when a feature needs the missing config.
**Fix:** Validate all required env vars at import time:
```python
REQUIRED_VARS = ['POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD']
missing = [v for v in REQUIRED_VARS if not os.environ.get(v)]
if missing:
    raise EnvironmentError(f"Missing required env vars: {', '.join(missing)}")
```

---

## NEW: Additional Audit Items (Added March 2026)

### 26. Missing CSRF Protection — `OPEN`

**Priority:** HIGH
**Issue:** NestJS apps using cookie-based authentication need CSRF protection. No `csurf` or equivalent middleware configured. An attacker can craft a form on a malicious site that submits requests to Breyus API using the victim's session cookie.
**Find:** `grep -rn "csurf\|csrf" backend/src/ backend/package.json`
**Fix:** Add CSRF middleware for state-changing endpoints:
```bash
npm install csurf
```
```typescript
import * as csurf from 'csurf';
app.use(csurf({ cookie: { httpOnly: true, sameSite: 'strict' } }));
```
**Alternative:** If `sameSite: strict` cookies are enforced (Issue #14), CSRF risk is significantly reduced. Document the decision either way.

---

### 27. No Dependency Vulnerability Scanning — `OPEN`

**Priority:** MEDIUM
**Issue:** No automated scanning for known vulnerabilities in npm/pip dependencies. Supply chain attacks are a growing threat.
**Fix:** Add to CI pipeline and run periodically:
```bash
# Backend (npm)
npm audit --production
# or use Snyk/Socket.dev for deeper analysis

# AI Server (pip)
pip audit
# or use safety check
```
**Recommendation:** Add `npm audit` to CI checks (see [[operations/CI_CD_PIPELINE]]) and run `npm audit fix` in each maintenance window.

---

### 28. No JWT Refresh Token Mechanism — `OPEN`

**Priority:** MEDIUM
**Issue:** JWT expires in 1 hour (`JWT_EXPIRES_IN=3600`). No refresh token mechanism exists. Users must re-login with full OTP flow every hour, or the frontend silently loses auth.
**Find:** `grep -rn "JWT_EXPIRES\|expiresIn\|refresh" backend/src/auth/ backend/src/login/`
**Fix options:**
1. **Sliding sessions:** Extend JWT on each authenticated request (simplest)
2. **Refresh tokens:** Issue a long-lived refresh token alongside the short-lived JWT
3. **Increase JWT lifetime:** Set to 24h for MVP (simplest, least secure)
**Decision needed:** Choose a strategy based on security vs UX trade-off.

---

### 29. No Request Body Size Limits — `OPEN`

**Priority:** MEDIUM
**Issue:** No explicit body size limits configured in NestJS. Default `body-parser` limit is 100KB, but large JSON payloads (e.g., blog post content, trade notes) may need higher limits while preventing abuse.
**Fix:** Set explicit limits in `main.ts`:
```typescript
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ limit: '1mb', extended: true }));
```

---

## Verification Checklist

### Critical
- [ ] OTP bypass disabled (`bypassOtp` removed or gated by NODE_ENV)
- [ ] Error messages return generic text (no stack traces in API responses)
- [ ] CORS fails fast if `CORS_ORIGIN` unset in production
- [ ] Trade state transitions use MongoDB transactions
- [ ] Document upload uses atomic check-and-set

### High
- [ ] No `localhost` references in frontend production build
- [ ] DOMPurify sanitizes all user-generated HTML
- [ ] SVG uploads blocked (explicit MIME whitelist)
- [ ] Regex input escaped before `new RegExp()`
- [ ] `forbidNonWhitelisted: true` in ValidationPipe
- [ ] AI API key required (no empty default)
- [ ] Email fields reject newlines

### Medium
- [ ] No `console.log` in production frontend bundle
- [ ] Cookie `sameSite: strict` in production
- [ ] Rate limiting on creation/mutation endpoints
- [ ] OTP uses atomic GETDEL
- [ ] String DTOs have `@MaxLength()`
- [ ] WebSocket payloads validated
- [ ] AI responses schema-validated
- [ ] Compound indexes added for common queries

### High (New)
- [ ] CSRF protection configured or `sameSite: strict` documented as mitigation

### Medium (New)
- [ ] Dependency vulnerability scanning in CI
- [ ] JWT refresh/session extension strategy chosen and implemented
- [ ] Request body size limits explicitly configured

### Low
- [ ] Backend uses NestJS Logger consistently
- [ ] Trade constants extracted from magic numbers
- [ ] Helmet middleware added
- [ ] AI_NEW validates env vars at startup

---

## Related

- [[operations/PRODUCTION_HARDENING]] — Infrastructure-level security (Docker, Nginx, databases)
- [[operations/DEPLOYMENT]] — Deployment architecture and service communication
- [[SESSION_CONTEXT]]
- [[MOC-Operations]]
