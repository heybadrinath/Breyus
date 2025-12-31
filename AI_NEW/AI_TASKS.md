# Breyus AI Module - Task Tracker

Source of truth for AI server, data pipeline, and integrations. Status reflects current repo state.

**Last Updated:** 2025-12-21

## Assumptions
- Deployment: Docker-only; backend owns `X-API-Key`; AI server is internal-only.
- Caching/TTL: Link prediction 14d, gravity scores 7d, market analysis 30d; purge on new data imports.
- Notifications: `analysis_completed` notification (normal priority) must fire when analysis jobs finish.
- Polling: Async analysis uses polling; synchronous for link predict and gravity scoring.

## Legend
- Status: ✅ done | 🔄 partial | ⏳ todo | 🔍 stub (code exists but needs implementation)
- P#: Priority (0 highest)

## Tasks

### Core Services
- [✅] P0 AI FastAPI server up-to-date with 4 endpoints (`/v1/links/predict`, `/v1/trades/score`, `/v1/analysis/initiate`, `/v1/analysis/results/{jobId}`); align request/response models with README.
  - ✅ All 4 endpoints defined with proper routing
  - ✅ Request/response Pydantic models aligned with README
  - ✅ Service logic implemented (link prediction, scoring, analysis)
- [✅] P0 Implement waterfall link prediction (historical   similarity   geospatial   precomputed) using Postgres + pgvector + PostGIS.
  - ✅ LinkPredictor service class exists
  - ✅ Database clients ready (postgres.py, redis.py)
  - ✅ Waterfall logic implemented with filters + strategy mapping
- [✅] P0 Implement gravity score calculation with configurable weights (11 factors); expose weights in code/env.
  - ✅ TradeScorer service class exists
  - ✅ Gravity score model structure documented
  - ✅ Calculation logic implemented; weights configurable via env
- [✅] P0 Implement async market analysis job (LLM) with initial chart data + polling; include optional sections (risks, logistics, recommendations, pricing bands).
  - ✅ MarketAnalyzer service class exists
  - ✅ Async job initiation endpoint returns jobId
  - ✅ Results polling endpoint implemented (returns PENDING/COMPLETED)
  - ✅ LLM integration wired (Anthropic client called)
- [⏳] P1 Add future similarity search endpoint (deferred; keep embeddings ready).
  - ✅ Embedding service infrastructure ready

### Data & Schema
- [✅] P0 Design Postgres schema (`shared/db/schema.sql`) with tables, indexes, extensions vector+postgis.
  - ✅ 6 core tables + audit log designed
  - ✅ pgvector + PostGIS extensions specified
  - ✅ HNSW indexes for vector search
  - ⚠ Schema not yet applied to running database (run migrations)
  - ✅ Baseline migration added (shared/db/migrations/000_init_schema.sql)
- [⏳] P0 Create result cache tables for AI responses with TTL metadata (links 14d, scores 7d, analysis 30d); add indexes for key lookups + expiry.
  - ✅ Migration added (001_add_ai_cache_tables.sql)
- [⏳] P0 Implement cache read/write with TTL enforcement + purge on new data imports or derived jobs.
  - ✅ Redis client ready
  - ✅ Cache logic implemented (Redis + Postgres TTL) with purge on new imports
- [⏳] P1 Add migration/versioning process for AI DB (SQL migrations tracked in repo).
  - ✅ migrations/ directory created
  - ✅ Baseline + cache migrations added

### Pipeline
- [🔄] P0 Wire pipeline CLI (`convert`, `normalize`, `insert`, `embed`, `build-links`, `compute-predictions`, `run-all`) to Postgres instance; validate manifest updates.
  - ✅ All CLI commands defined in cli.py
  - ✅ Convert: Fully working (32 Excel → 129 CSV, 1.5GB)
  - ✅ Normalize: Working (28MB normalized data generated)
  - ✅ Manifest tracking: Implemented and updating
  - ✅ Insert: Wired to Postgres; infers trade record targets + record_type when missing
  - ✅ Embed: Runs embeddings + updates manifest totals
  - ✅ Build-links: Implemented (historical/similarity/geospatial/commodity)
  - ✅ Compute-predictions: Implemented
- [🔍] P0 Implement dedupe via `data_import_log` (hash-based) with statuses and counts.
  - ✅ Hash-based logic designed
  - ✅ data_import_log table schema ready
  - ⏳ Wired in insert flow (skips duplicates + logs import)
- [🔍] P0 Ensure embeddings generation runs for new rows; retry failed batches.
  - ✅ Embedding service ready (sentence-transformers)
  - ✅ Batch processing implemented in embed.py; run embed to generate
- [✅] P1 Add reconcile-duplicates / retry-errors flows (CLI wired).
  - ✅ Scripts exist (reconcile_duplicates.py)
  - ✅ Logic implemented (row-level dedupe + insert)
- [⏳] P1 Add metrics/logging around pipeline stages and durations.

### Integrations (Main Backend)
- [⏳] P0 Secure calls from Nest backend to AI server with backend-owned API key; centralize in service client.
  - ✅ API key validation implemented on AI server
  - ⏳ Backend service client not created yet
- [⏳] P0 Add polling integration for `/v1/analysis/results/{jobId}` and surface `analysis_completed` notification on completion.
- [⏳] P0 Add caching layer on backend to reuse AI Postgres results when fresh (avoid re-running).
- [⏳] P1 Add retry/backoff + error handling for AI server downtime.

### Frontend
- [⏳] P0 Wire buyer/seller AI UI flows to call backend endpoints; ensure polling UX for analysis jobs; add mainstream gate → Niche AI redirect.
- [⏳] P0 Display AI results (link prediction, gravity score, analysis charts) using the documented response contracts; filter Niche AI grid to `is_niche=true`; gate PO/Chat actions by email/phone lookup.
- [⏳] P1 Add toast/badge handling for `analysis_completed` via notification system.

### Notifications
- [⏳] P0 Extend notification types with `analysis_completed` in backend + frontend (type unions, enums).
- [⏳] P0 Emit `analysis_completed` when AI analysis job finishes; include actionUrl to analysis results.
- [⏳] P1 Add tests to cover notification emit + UI display for the new type.

### Observability & Ops
- [✅] P0 Health check endpoint for AI server; include DB/Redis connectivity.
  - ✅ Comprehensive health endpoint at /health
  - ✅ Returns: server status, DB tables count, manifest stats, embedding model status
- [⏳] P0 Add logging/metrics for endpoint latency, cache hits/misses, LLM calls, pipeline stages.
  - ✅ Basic request logging with sampling
  - ⏳ Detailed metrics not implemented
- [⏳] P1 Add alerts for job failures and cache purge errors.

### Security
- [✅] P0 Enforce API key validation on AI server; reject missing/invalid keys.
  - ✅ Implemented via dependencies.py
  - ✅ X-API-Key header validation on all endpoints
- [⏳] P1 Consider IP allowlist between backend and AI server (if infra supports).
- [⏳] P1 Sanitize/limit LLM inputs; redact sensitive data in logs.

### Testing
- [🔍] P0 Unit tests for link prediction, gravity scoring, cache logic, and analysis job lifecycle.
  - ⏳ No unit test files yet; only scripts/test_api_flow.py exists.
- [⏳] P0 Integration tests hitting AI endpoints with seeded Postgres/Redis.
- [⏳] P1 E2E path: backend → AI → notification (`analysis_completed`) → frontend display.
- [⏳] P1 Data pipeline tests (conversion, normalization, dedupe, insert, embed).

### Deployment
- [✅] P0 Docker Compose validation (postgres + redis + ai-server); health/ready checks.
  - ✅ docker-compose.yml with 3 services
  - ✅ Custom postgres.Dockerfile with pgvector + PostGIS
  - ✅ Health checks configured on all services
  - ✅ Persistent volumes for data
  - ⏳ Not yet tested/validated
- [⏳] P1 CI to run tests/lint for AI_NEW; optional image build.
- [⏳] P1 Backup/restore plan for AI Postgres (vectors + caches + trade_links).

### Backlog / Future
- [⏳] P2 Similarity search endpoint (products/companies) using existing embeddings.
  - ✅ Infrastructure ready (embedding_service.py)
- [⏳] P2 Admin monitors for AI jobs, cache state, and pipeline manifest.
- [⏳] P2 Configurable TTL overrides per environment.

---

## Current Data Pipeline Status

**Raw Data:** 32 Excel files (497MB) ✅
**Converted:** 129 CSV files (1.5GB) ✅
**Normalized:** 28MB normalized CSVs ✅
**In Database:** Partial (some inserts complete; pending_db_insert remains for earlier misclassified trade files)
**Embeddings Generated:** 0 vectors ⏳
**Trade Links Built:** 0 relationships ⏳
**Predictions Computed:** 0 predictions ⏳

**Manifest State:** Mixed statuses; see pipeline/manifest.json for exact counts.

---

## Immediate Next Steps (Priority Order)

1. **Database Setup** (Blocker)
   - Run migrations: `python shared/db/migrate.py`
   - Verify extensions (pgvector, PostGIS)

2. **Data Insertion**
   - Re-run inserts for remaining files (e.g., `python -m pipeline.scripts.cli run-all-pending --size small`)
   - Confirm manifest counts and `data_import_log` entries

3. **Pipeline Completion**
   - Generate embeddings (`python -m pipeline.scripts.cli embed --table companies`, then `trade_records`, then `products`)
   - Build links + predictions (`python -m pipeline.scripts.cli build-links`, `python -m pipeline.scripts.cli compute-predictions`)

4. **Service Validation**
   - Smoke-test `/v1/links/predict`, `/v1/trades/score`, `/v1/analysis/initiate` + polling

