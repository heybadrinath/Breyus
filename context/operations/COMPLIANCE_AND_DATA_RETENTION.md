---
type: operations-doc
module: operations
tags: [operations, compliance, data-retention, gdpr, legal]
date: 2026-03-11
---

# Compliance & Data Retention Policy

> **Last Updated**: March 2026
> **Criticality**: CRITICAL (Regulatory Risk)

---

## 1. Regulatory Framework

Breyus operates as a B2B commodity trading platform handling legally significant trade documents, KYC identity data, and cross-border transaction records. The following regulations apply:

| Regulation | Jurisdiction | Relevance |
|------------|-------------|-----------|
| **India DPDP Act 2023** | India (primary market) | User consent, data processing, right to erasure |
| **GDPR** | EU (if EU users onboard) | Stricter consent, DPO requirement, 72h breach notification |
| **Indian Income Tax Act** | India | 7-year retention for trade/financial documents |
| **PMLA / AML-KYC** | India | 5-year retention for KYC records post-relationship |
| **Information Technology Act 2000** | India | Data security practices, breach reporting |
| **Foreign Trade Policy** | India | Export/import documentation requirements |

**Current Status:** Pre-production. These policies should be implemented before the first paying user.

---

## 2. Data Classification

Every data type handled by Breyus is classified by sensitivity, retention period, and deletion policy.

### 2.1 Critical (Legal Hold Required)

| Data Type | Examples | Storage | Retention | Deletion Policy |
|-----------|----------|---------|-----------|----------------|
| **Trade Documents** | SPA, BoL, ICPO, SCO, Payment Proofs | DigitalOcean Spaces | **7 years** (Indian tax) | Auto-archive after 7y, manual deletion only |
| **KYC Documents** | CIS, Passport, Tax Certificate | DigitalOcean Spaces | **5 years** post-relationship end | Cannot delete while relationship active |
| **Financial Records** | Trade amounts, payment proofs, invoices | MongoDB (trade schema) | **7 years** (Indian tax) | Anonymize after 7y (zero amounts, hash IDs) |
| **Audit Logs** | Admin actions, trade state changes | MongoDB (audit-log schema) | **7 years** | Read-only, no deletion |

### 2.2 Sensitive (Controlled Retention)

| Data Type | Examples | Storage | Retention | Deletion Policy |
|-----------|----------|---------|-----------|----------------|
| **User PII** | Name, email, phone, address | MongoDB (user schema) | Account lifetime + 30 days | Anonymize on deletion request (see Section 3) |
| **Company Data** | Company name, GST, registration | MongoDB (company schema) | Account lifetime + 30 days | Anonymize on deletion request |
| **Chat Messages** | Inbox conversations | MongoDB (messages schema) | **3 years** | Soft-delete after 3y, hard-delete after 4y |
| **Negotiation History** | Counter-offers, price terms | MongoDB (trade schema) | Same as trade (7 years) | Part of trade record, cannot separate |

### 2.3 Operational (Standard Retention)

| Data Type | Examples | Storage | Retention | Deletion Policy |
|-----------|----------|---------|-----------|----------------|
| **Session Tokens** | JWT cookies, admin sessions | Memory / MongoDB | Session duration | Auto-expire (JWT TTL) |
| **OTPs** | Login/reset OTPs | Redis | 10 minutes | Auto-expire (Redis TTL) |
| **Analytics (Raw)** | Page views, click events | MongoDB | **2 years** | Aggregate then delete raw |
| **Analytics (Aggregated)** | Monthly summaries, trends | MongoDB | **Indefinite** | No PII, safe to keep |
| **Product Images** | Product photos, test reports | DigitalOcean Spaces | Account lifetime | Delete with product or account |

### 2.4 AI Data (Regeneratable)

| Data Type | Examples | Storage | Retention | Deletion Policy |
|-----------|----------|---------|-----------|----------------|
| **Vector Embeddings** | Product/company embeddings | PostgreSQL (pgvector) | **No retention requirement** | Regeneratable from source data |
| **Trade Links** | Historical match graph | PostgreSQL | Mirrors source trade data | Rebuild from pipeline |
| **Predicted Partners** | Pre-computed predictions | PostgreSQL | **30 days** (stale quickly) | Auto-refresh via pipeline |
| **Market Analysis Cache** | Job results, forecasts | Redis | **15 minutes** (TTL) | Auto-expire |

---

## 3. Right to Deletion (Data Subject Requests)

When a user requests account deletion or data erasure:

### What CAN Be Deleted

1. **User profile** — Anonymize: replace name with "Deleted User", email with hash, phone with null
2. **Company profile** — Anonymize name and contact details, retain structure for trade history integrity
3. **Product listings** — Deactivate and anonymize (retain for trade reference)
4. **Chat messages** — Soft-delete user's messages, retain counterparty's
5. **Wishlist** — Hard-delete
6. **Session data** — Hard-delete all tokens and sessions
7. **AI embeddings** — Remove from vector store, regenerate without this user's data

### What CANNOT Be Deleted (Legal Hold)

1. **Trade documents** (SPA, BoL, etc.) — Required for 7-year tax retention
2. **KYC documents** — Required for 5-year AML retention
3. **Audit logs** — Required for compliance trail
4. **Financial transaction records** — Required for 7-year tax retention
5. **Negotiation records** — Part of trade lifecycle, required for dispute resolution

### Deletion Procedure

1. User submits deletion request (Settings page or email to support)
2. Admin reviews request within 72 hours
3. System checks for active trades — if any, deletion is deferred until completion
4. Anonymization script runs on eligible data
5. Legal-hold data is flagged as "retention only" (no active use)
6. Confirmation sent to user's email (last communication before email is anonymized)
7. 30-day grace period before anonymization is permanent

**Implementation:** Create `scripts/anonymize-user.ts` seed script (does not exist yet).

---

## 4. Data Processing Register

### Third-Party Data Processors

| Processor | Data Shared | Purpose | DPA Status |
|-----------|------------|---------|------------|
| **Sendinblue (Brevo)** | Email addresses, user names | Transactional email, OTP delivery | DPA required before production |
| **DigitalOcean Spaces** | Trade docs, KYC docs, product images | Object storage | Covered by DO Terms of Service |
| **Anthropic (Claude API)** | Commodity names, trade parameters (no PII) | Market analysis, AI insights | Review data retention policy |
| **Google (Gemini API)** | Commodity names, market queries (no PII) | Market analysis fallback | Review data retention policy |
| **Redis Cloud** (if used) | OTPs, session IDs (no PII) | Caching | N/A (ephemeral, no PII) |

### Data Flow Rules

1. **No PII to AI APIs** — Commodity names and trade parameters only. Never send user names, emails, or company identifiers to Claude/Gemini.
2. **No KYC docs to third parties** — KYC documents stay on DigitalOcean Spaces. Never forwarded.
3. **Email processor** — Sendinblue receives only the minimum data needed (email address, user first name for personalization).
4. **Logging** — Never log passwords, tokens, or full credit card numbers. Mask sensitive fields in application logs.

---

## 5. Implementation Checklist

| # | Item | Priority | Status |
|---|------|----------|--------|
| 1 | Define MongoDB TTL indexes for session/OTP collections | High | Not Started |
| 2 | Create `scripts/anonymize-user.ts` for deletion requests | Critical | Not Started |
| 3 | Add data retention metadata to trade document uploads | Medium | Not Started |
| 4 | Execute DPA with Sendinblue/Brevo | Critical | Not Started |
| 5 | Review Anthropic and Google data retention policies | High | Not Started |
| 6 | Add privacy policy page to frontend | Critical | Not Started |
| 7 | Add cookie consent banner (if GDPR applies) | Medium | Not Started |
| 8 | Create cron job for 3-year chat message archival | Low | Not Started |
| 9 | Create cron job for 2-year raw analytics cleanup | Low | Not Started |
| 10 | Document breach notification procedure (72h for GDPR) | High | Not Started |
| 11 | Add "Delete My Account" button to Settings page | High | Not Started |
| 12 | Implement audit log for all deletion requests | High | Not Started |

---

## 6. Breach Notification

If a data breach is detected:

1. **Within 1 hour** — Contain the breach (see [[operations/INCIDENT_RESPONSE]])
2. **Within 24 hours** — Assess scope: what data, how many users, what sensitivity level
3. **Within 72 hours** — Notify affected users (GDPR requirement if EU users exist)
4. **Within 72 hours** — Report to CERT-In (Indian law) if > 500 users affected
5. **Document** — Record in incident log with timeline, root cause, and remediation

---

## Related

- [[operations/SECRET_MANAGEMENT]] — Secret storage and rotation
- [[operations/INCIDENT_RESPONSE]] — Incident handling procedures
- [[operations/PRODUCTION_HARDENING]] — Security hardening checklist
- [[operations/BACKUP_AND_RECOVERY]] — Data backup (supports retention)
- [[MOC-Operations]]
