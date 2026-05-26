---
type: review
module: ai
tags: [ai, review, gap-analysis, roadmap]
date: 2026-04-02
---

# AI Plans Gap Review

> Review scope: `context/ai/*` cross-checked against current product docs, API docs, operations docs, and live code.
> Working truth for this review:
> - KYC is not a near-term access gate.
> - Commodity classification is hybrid admin-governed.
> - Stage 4 is monthly and not Gold-gated for now.
> - The new niche pipeline is separate but connected to the existing buyer/seller AI.
> - Full cold outreach is in scope.
> - Third-party LLM usage may include business contact context.

## Findings

### 1. Critical: Stage 4 entitlement and access model is incompatible with the current product

The technical architecture still assumes a separate Gold-gated market-insight product, but the current platform has neither Gold subscription primitives nor market-intelligence routes.

**Evidence**
- `context/ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md:1441-1444` requires NestJS to validate a Gold subscription and gate `/api/market-insight`.
- `context/ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md:1190-1194` defines a separate `/api/market-insight/*` surface.
- `frontend/src/routes/index.tsx:211-214` exposes only `/buyer/ai`, `/buyer/ai-niche`, `/buyer/ai-select`, and `/buyer/ai-result`.
- `frontend/src/routes/ProtectedRoute.tsx:16` and `:58` validate only the auth cookie.
- `backend/src/auth/auth.guard.ts:53` enforces suspension, but not KYC or subscription gating.

**Why this matters**
- Any implementation that follows the architecture doc literally will build the wrong user access model.
- Stage 4 rollout sequencing, API naming, and dashboard placement all change depending on whether this is a premium product or an extension of the existing buyer AI surface.

**Recommendation**
- Treat Gold gating as future-state only.
- Rebase Stage 4 docs onto the current authenticated buyer experience first.
- If access control will change later, record it in a separate ADR instead of keeping premium assumptions embedded in Stage 4 architecture now.

### 2. Critical: The plans use two different commodity source-of-truth systems with no sync contract

The new niche pipeline treats PostgreSQL `approved_commodities` as the downstream registry, while the current product AI flow uses the MongoDB category system as its live classification source. The docs do not define how these two systems connect.

**Evidence**
- `context/ai/PRD_1_Government_Data_Extraction.md:1521-1540` defines `approved_commodities` as the Stage 1 active registry.
- `context/ai/PRD_1_Government_Data_Extraction.md:1540-1543` says only active registry entries proceed to Stages 2-4.
- `context/ai/PRD_2_3_Contact_Discovery.md:51` and `:570` depend on `approved_commodities`.
- `context/ai/PRD_4_Market_Intelligence.md:13`, `:63`, and `:314` depend on `approved_commodities`.
- `backend/src/ai/ai.service.ts:870` uses `CategoriesService.getCategoriesGroupedByClassification()` for live AI commodity search.
- `backend/src/ai/ai-http.service.ts:856-864` explicitly deprecates AI-side niche commodity search in favor of MongoDB categories.
- `backend/src/admin/content/admin-content.controller.ts:801-818` already supports admin mainstream/niche classification toggles.
- `backend/src/admin/content/services/categories.service.ts:476-490` and `:905-934` treat category classification as an operational admin-managed data set.

**Why this matters**
- A niche commodity approved in Stage 1 may never appear in the current buyer/seller AI experience.
- Admins could classify a commodity one way in MongoDB and another way in AI_NEW.
- Contact discovery, predictions, and the current AI search could drift into separate commodity universes.

**Recommendation**
- Define one operational source of truth for user-facing commodity classification.
- Under the current working truth, `approved_commodities` should be treated as a feeder/advisory registry until it is explicitly synced into the admin category system.
- Add a sync contract or admin review workflow that maps Stage 1 approved niches into MongoDB categories with traceable linkage.

### 3. High: Prediction cadence is contradictory at the schema, job, and UI level

Some AI docs define Stage 4 as weekly, while others define it as monthly. This is not a wording issue; it changes tables, cron schedules, UI copy, email cadence, and accuracy windows.

**Evidence**
- `context/ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md:896`, `:953-957`, `:1168-1169`, `:1468`, and `:1648` describe weekly predictions using `week_start`.
- `context/ai/PRD_4_Market_Intelligence.md:44`, `:72`, `:292-310`, `:817`, `:859`, `:994`, and `:1005` describe monthly predictions using `prediction_month`.
- `context/ai/NICHE_COMMODITY_FINDER_UI_SPEC.md:1371-1375` and `:1545` describe a monthly prediction cycle and monthly notifications.
- `context/ai/NICHE_COMMODITY_FINDER_PRD.md:42` frames retention value around monthly predictions.

**Why this matters**
- Weekly vs monthly changes schema keys, uniqueness constraints, scheduler cadence, notification content, and accuracy evaluation methodology.
- It also changes user expectations and the operational cost profile.

**Recommendation**
- Normalize Stage 4 to monthly across all AI docs.
- Replace `week_start` semantics in the architecture doc with `prediction_month`.
- Update all weekly email digest references to monthly summaries unless a separate weekly digest is intentionally added later.

### 4. High: Public interface naming drifts away from the live product surface

The planned user-facing routes and endpoints describe a new `market-intelligence` surface, while the live product still centers AI around `/ai/*` and `/buyer/ai*`. The docs do not define the bridge between them.

**Evidence**
- `context/ai/PRD_4_Market_Intelligence.md:1035-1040` proposes `/market-intelligence/*` user endpoints.
- `context/ai/NICHE_COMMODITY_FINDER_UI_SPEC.md:1027`, `:1146`, and `:1452` propose `/buyer/market-intelligence` routes.
- `context/ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md:1190-1194` proposes `/api/market-insight/*`.
- `context/api/ai.md:57`, `:228`, `:298`, `:358`, `:511`, `:622`, and `:678` document the current `/ai/*` backend surface.
- `frontend/src/routes/index.tsx:211-214` confirms the live buyer AI routes.
- `frontend/src/buyer/pages/ai.tsx:11-12`, `:381`, and `:384` confirm the current user flow ends in `/buyer/ai-result` or `/buyer/ai-select`.

**Why this matters**
- Without an explicit bridge plan, Stage 4 can accidentally become a disconnected side product instead of a connected extension.
- Frontend and backend teams could build against different namespace assumptions.

**Recommendation**
- Decide whether `market-intelligence` is a net-new user module or a staged extension of the current AI experience.
- Under the current working truth, document it as a separate but connected module with a clear bridge:
  1. current `/ai/*` remains the existing search/matching surface
  2. `market-intelligence` is net-new
  3. shared commodity ownership must be resolved before user rollout

### 5. High: Compliance rules for LLM data and scraped contact retention conflict with platform-wide policy

The AI plans introduce scraped contact databases, outreach tables, and business-contact-aware LLM workflows, but the platform-wide compliance policy still assumes AI providers receive no PII or company identifiers and does not formally cover most Stage 2-5 data sets.

**Evidence**
- `context/operations/COMPLIANCE_AND_DATA_RETENTION.md:123-130` says no PII, names, emails, or company identifiers should be sent to Claude/Gemini.
- `context/operations/COMPLIANCE_AND_DATA_RETENTION.md:64-72` only defines AI retention for embeddings, predicted partners, and short-lived market analysis cache.
- `context/ai/PRD_2_3_Contact_Discovery.md:1681-1744` defines retention and opt-out rules for scraped contacts and `contact_opt_outs`.
- `context/ai/PRD_5_Outreach.md:782-918` defines outreach campaign tables.
- `context/ai/PRD_5_Outreach.md:1086-1160` treats outreach compliance as mandatory, but still inside the AI PRD layer rather than the platform-wide compliance source.

**Why this matters**
- Right now, Stage 2-5 compliance lives in AI-specific docs, while the official platform policy does not recognize those data sets.
- That creates policy conflicts for retention, deletion, legal review, and third-party processor rules.

**Recommendation**
- Update `COMPLIANCE_AND_DATA_RETENTION.md` before implementation to explicitly cover:
  - scraped business contacts
  - suppression/opt-out records
  - outreach campaigns and events
  - any allowed business-contact context sent to external LLMs
- Until that policy is updated, treat the AI PRDs as insufficient for production compliance sign-off.

### 6. High: Stage 5 outreach still contains unresolved launch blockers that are written as open questions

Cold outreach is in scope, but the Stage 5 PRD still leaves operationally important questions open, including sender address, MX validation policy, and fallback content behavior.

**Evidence**
- `context/ai/PRD_5_Outreach.md:1319-1325` leaves MX validation, physical email footer address, and Email 2 fallback content open.
- `context/ai/PRD_5_Outreach.md:1327-1329` requires legal/compliance approval before first send.

**Why this matters**
- These are not polish questions if cold outreach is real scope; they directly affect deliverability, CAN-SPAM compliance, and campaign execution logic.

**Recommendation**
- Reclassify these as rollout blockers, not future nice-to-haves.
- Add a go-live checklist for Stage 5 that must be satisfied before first outbound campaign.

### 7. Medium: Some planned Stage 4 and Stage 5 persistence overlaps existing wishlist and notification primitives

The later-stage plans sometimes read like greenfield systems, but the platform already has reusable user-facing primitives for AI contact saving, favourite companies, and notifications.

**Evidence**
- `backend/src/wishlist/wishlist.schema.ts:28-62` already supports `ai_contact` and `company` entries.
- `backend/src/wishlist/wishlist.controller.ts:164`, `:286-327`, and `:391-394` exposes save-contact and favourite-company flows.
- `backend/src/wishlist/wishlist.service.ts:151-211` persists AI contacts with commodity, HS code, score, role, and notes.
- `backend/src/notification/schema/notification.schema.ts:4-38` and `:48-88` show an extensible notification type system.
- `backend/src/ai/ai.service.ts:1026` already creates `analysis_completed` notifications.
- `context/ai/PRD_4_Market_Intelligence.md:961-988` correctly says no new notification table is needed, but introduces a new `user_favorites` model.

**Why this matters**
- Stage 4 commodity favorites may still deserve their own model, but the docs do not explain why the existing user save/favorite primitives are insufficient.
- Without that decision, teams may build duplicate user-saving behavior across wishlist and market-intelligence modules.

**Recommendation**
- Make the commodity-favorite decision explicit:
  - either extend wishlist with a `commodity` source type
  - or keep a separate `user_favorites` model because the entity is a PostgreSQL commodity registry item, not a Mongo product/company/contact
- Treat prediction notifications as an extension of the existing notification system, not a new subsystem.

### 8. Medium: Current async AI job handling is far less durable than what later stages assume

The current AI module does support async analysis, but it tracks job-notification state in memory only. That is not sufficient precedent for the durable multi-pipeline scheduling, retries, audit trails, and job logs proposed in Stages 1-5.

**Evidence**
- `backend/src/ai/ai.service.ts:58-89` stores analysis job tracking in an in-memory `Map`.
- `backend/src/ai/ai.service.ts:959-1026` uses that map to send `analysis_completed` notifications.
- `context/ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md:60` assumes Redis + Celery or equivalent background processing.
- `context/ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md:1918-2059` assumes comprehensive job logs, streaming, and retention.

**Why this matters**
- The current code proves only that lightweight async polling exists.
- It does not reduce the implementation risk of the proposed niche pipelines nearly as much as the docs imply.

**Recommendation**
- Classify orchestration, retries, durable job state, and log streaming as net-new infrastructure.
- Do not treat the existing analysis job implementation as sufficient foundation beyond API polling patterns.

### 9. Medium: The live code still supports a legacy dual-role model that conflicts with the intended one-role product truth

The product truth for this review is one role per account, but the live code and current AI endpoints still accept `Seller and Buyer` in multiple places.

**Evidence**
- `backend/src/users/user.schema.ts:10-13` still defines `Seller and Buyer`.
- `backend/src/company/company.schema.ts:7-10` still defines `Seller and Buyer`.
- `backend/src/ai/ai.controller.ts:152-153` and `:185-186` explicitly allow `Seller and Buyer`.

**Why this matters**
- Role assumptions directly affect Stage 2/3 discovery targeting, Stage 4 entitlement logic, and any future outreach segmentation.

**Recommendation**
- If one-role-per-account is the product truth, add a migration/deprecation note to the AI review and future specs.
- Otherwise, the docs should stop treating the dual-role path as impossible.

## Contradiction Matrix

| Topic | Conflicting Sources | Current Truth for Planning | Risk if Unchanged | Required Action |
|------|---------------------|----------------------------|-------------------|-----------------|
| KYC / access gating | `context/product/breyus_product_doc.md:64-76`, `:141`; `context/ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md:1441-1444` vs `frontend/src/routes/ProtectedRoute.tsx:16`, `backend/src/auth/auth.guard.ts:53` | Authenticated access without KYC gating for now | Wrong entitlement model and wasted implementation | Update product + AI docs to current non-gating truth |
| Gold subscription | `context/ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md:1444`, `:1659` | No subscription system exists today | Stage 4 built on missing primitives | Remove Gold assumptions from near-term docs |
| Prediction cadence | Technical architecture weekly vs PRD/UI monthly | Monthly | Schema, cron, email, KPI drift | Normalize all Stage 4 docs to monthly |
| Commodity ownership | `approved_commodities` Stage docs vs Mongo categories in live code | Hybrid admin-governed categories for user-facing truth | Separate commodity universes | Add sync/approval contract |
| User route namespace | `/api/market-insight`, `/buyer/market-intelligence` vs live `/ai/*` and `/buyer/ai*` | Current AI routes remain live; market-intelligence is net-new | Frontend/backend drift | Add interface migration map |
| Commodity classification | old docs say no manual override; live admin system allows toggles | Hybrid admin-governed | Admin workflow vs algorithm conflict | Update older product docs and AI assumptions |
| LLM data policy | ops says no identifiers to AI APIs; working truth allows business-contact context | Must be explicitly re-approved in ops policy | Compliance contradiction | Update platform-wide compliance doc |
| Role model | product says one role; live code still supports `Seller and Buyer` | One role as future truth, legacy role still in code | Segmentation and auth ambiguity | Add deprecation or support decision |

## Implementation Realism Classification

| Capability | Current State | Classification | Notes |
|-----------|---------------|----------------|-------|
| Buyer AI search flow | Live `/buyer/ai*` routes + `/ai/*` endpoints | Already exists | Extend, do not replace blindly |
| Seller AI inventory-to-search flow | Live `/seller/ai*` routes + `/ai/seller/inventory`, `/ai/search/from-product` | Already exists | Extend |
| Commodity classification for live AI search | MongoDB categories + admin controls | Already exists | Source of truth today |
| Stage 1 niche discovery pipeline | Not present in product code | Net-new subsystem | AI_NEW + admin proxy + admin UI |
| Stage 2 buyer discovery | Not present | Net-new subsystem | Includes compliance and contact ownership work |
| Stage 3 seller discovery | Not present | Net-new subsystem | Same as above |
| Stage 4 market-intelligence user module | Not present | Net-new subsystem | Separate but connected to current AI |
| Stage 4 prediction notifications | Existing notification system available | Extend existing primitive | Add new types only |
| Stage 4 commodity favorites | No exact equivalent today | Partial overlap | Decide extend wishlist vs new model |
| Stage 5 outreach campaigns | Not present | Net-new subsystem | Legal + deliverability blockers |
| Async job polling | Current analysis jobs exist | Partial foundation | In-memory only, not durable |
| Audit trail / job logs / streaming | Partial admin activity logging exists | Net-new for niche pipelines | Cannot be treated as solved |

## Public Interface Inventory

| Proposed Interface | Current Support | Label | Review Note |
|--------------------|-----------------|-------|------------|
| `POST /ai/search` | Live | existing | Buyer/seller matching already exists |
| `POST /ai/commodity-search` | Live | existing | Uses MongoDB categories only |
| `POST /ai/analysis/start` | Live | existing | Async analysis exists |
| `GET /ai/analysis/:jobId` | Live | existing | Polling exists |
| `POST /ai/gravity-score` | Live | existing | Live |
| `GET /ai/seller/inventory` | Live | existing | Live |
| `POST /ai/search/from-product` | Live | existing | Live |
| `GET /market-intelligence/predictions` | Not present | net-new | Stage 4 user surface |
| `GET /market-intelligence/predictions/:commodityId` | Not present | net-new | Stage 4 user surface |
| `GET /market-intelligence/summary` | Not present | net-new | Stage 4 homepage integration |
| `GET /market-intelligence/favorites` | Not present | net-new | Overlaps existing save/favorite primitives |
| `POST /market-intelligence/favorites/:commodityId` | Not present | net-new | Needs ownership decision vs wishlist |
| `DELETE /market-intelligence/favorites/:commodityId` | Not present | net-new | Same as above |
| `/buyer/market-intelligence` | Not present | net-new | Route does not exist in current frontend |
| `/buyer/market-intelligence/:commodityId` | Not present | net-new | Route does not exist in current frontend |
| `/admin/niche/runs` and related Stage 1 endpoints | Not present | net-new | Full admin niche subsystem |
| `/admin/niche/buyers/*` and `/admin/niche/sellers/*` | Not present | net-new | Full contact-discovery subsystem |
| `/admin/market-intelligence/*` | Not present | net-new | Admin prediction management surface |
| `prediction_published` / `prediction_retracted` notification types | Notification system exists | extend | Add types to current notification schema |
| `user_favorites` Mongo model | No exact model exists | extend-or-net-new decision | Must be explicitly justified |
| `approved_commodities -> categories` sync contract | Not defined | missing dependency | Must be specified before integration |

## Data Sets: Retention, Backup, Monitoring, Ownership

| Data Set | Intended Owner | Current Retention Coverage | Backup / Restore Coverage | Monitoring Coverage | Gap |
|---------|----------------|----------------------------|---------------------------|--------------------|-----|
| Stage 1 tables (`runs`, `raw_data_files`, `parsed_records`, `niche_candidates`, `approved_commodities`) | AI_NEW niche pipeline + admin review | Not defined in platform-wide ops policy | Generic PostgreSQL weekly backup applies (`context/operations/BACKUP_AND_RECOVERY.md:117`) | Only generic AI health and PG monitoring exist | Need table-level retention and pipeline monitoring |
| Stage 2/3 contacts (`buyer_contacts`, `seller_contacts`, `contact_opt_outs`) | AI_NEW contact discovery + compliance | Defined only in `PRD_2_3_Contact_Discovery.md:1681-1744`; missing from ops policy | Generic PostgreSQL backup only | No contact-specific alerts or audits defined in ops docs | Must be folded into platform compliance and ops runbooks |
| Stage 4 predictions (`prediction_jobs`, `commodity_predictions`, `prediction_accuracy`) | AI_NEW market intelligence | Monthly schema defined in Stage 4 PRD, but cadence conflicts with weekly architecture | Generic PostgreSQL backup only | Current ops docs monitor only public AI health, not prediction freshness or admin review backlog | Need monthly ownership, monitoring, and freshness policy |
| Stage 4 `user_favorites` | Backend user-facing module | No formal retention policy | MongoDB backup applies generically | No MI-specific operational monitoring | Need explicit reuse/new-model decision |
| Stage 5 campaigns (`outreach_campaigns`, events, suppression, config) | Outreach system + legal/ops | Defined only in Stage 5 PRD; not recognized in platform policy | Generic PostgreSQL backup only | No deliverability, suppression, or cron alerts in core ops docs | Needs rollout checklist, legal approval, and deliverability runbook |

## Dependency / Blocker List

1. **Commodity ownership contract is missing.**
   `approved_commodities` cannot safely feed the live product until its relationship to Mongo categories is defined.

2. **Gold/subscription assumptions are unsupported.**
   Stage 4 cannot depend on premium gating until a subscription system actually exists.

3. **Stage 4 cadence must be normalized before implementation.**
   Weekly and monthly cannot coexist without deliberate multi-cadence design.

4. **Platform compliance docs must be updated for scraped contacts and outreach.**
   AI PRDs alone are not enough for production sign-off.

5. **Stage 5 has unresolved go-live questions.**
   Physical sender address, MX validation, and fallback content cannot stay open if cold outreach is real scope.

6. **Durable background-job infrastructure is still net-new.**
   Current in-memory analysis tracking is not enough foundation for Stages 1-5 scheduling and audit expectations.

7. **Legacy dual-role support needs an explicit position.**
   Otherwise targeting, authorization, and segmentation rules will keep drifting.

## Recommended Source-of-Truth Map

| Area | Recommended Source of Truth | Why |
|------|-----------------------------|-----|
| Current AI user routes and endpoint reality | Live code + `context/api/ai.md` | Best reflection of what exists now |
| Current access rules | Live auth/route code first, then updated product docs | Existing docs are internally inconsistent |
| User-facing commodity classification | MongoDB admin content/category system | This is what live AI search uses today |
| Stage 1 niche discovery output | AI_NEW `approved_commodities`, but only as feeder/advisory until sync is specified | Separate but connected pipeline |
| Stage 4 cadence | `PRD_4_Market_Intelligence.md` after monthly normalization | Matches working truth and UI spec |
| Stage 4 entitlement | Separate ADR or future product spec | Avoid reintroducing Gold assumptions into current docs |
| Outreach compliance | `context/operations/COMPLIANCE_AND_DATA_RETENTION.md` after update | Platform-wide policy must outrank AI PRDs |
| Notifications | Existing notification schema/service | Extend current primitive, do not redesign it |

## Doc Consolidation Plan

1. **Normalize Stage 4 cadence and entitlement**
   - Update `NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md` from weekly + Gold-gated to monthly + non-Gold near-term.
   - Remove `/api/market-insight` references or explicitly mark them future-state.

2. **Add a commodity-registry integration spec**
   - New short doc or section defining how `approved_commodities` maps into the current admin category system.
   - Include sync direction, review owner, IDs, and conflict resolution.

3. **Reconcile product truth around KYC and roles**
   - Update `context/product/breyus_product_doc.md` to match current non-KYC-gated near-term behavior and record future access-control intent separately.
   - Add a note on legacy `Seller and Buyer` support if it remains in code.

4. **Promote Stage 2-5 compliance rules into operations policy**
   - Extend `COMPLIANCE_AND_DATA_RETENTION.md` to cover scraped contacts, suppression lists, outreach events, and any approved external LLM business-contact usage.

5. **Add an interface inventory appendix**
   - For each planned endpoint/route, mark `existing`, `extend`, or `net-new`.
   - This should live in either the technical architecture doc or a dedicated implementation checklist.

6. **Separate “future monetization” from “near-term implementation”**
   - Gold tier, premium access, and future access control should move into a future-state roadmap section or ADR, not remain mixed into near-term system design.

## Assumptions Used In This Review

- Near-term implementation should optimize for the current product and code reality.
- The new niche pipeline is not replacing the current buyer/seller AI; it is feeding it over time.
- Full cold outreach is still in scope, so unresolved compliance and deliverability issues are treated as real blockers.
- Until a sync contract exists, `approved_commodities` and Mongo categories should be treated as separate systems with explicit integration risk.

