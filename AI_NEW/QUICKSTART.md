# AI Module Quick Start Guide

**Last Updated:** 2025-12-19

## Prerequisites

### Required Software
- Python 3.11+
- PostgreSQL 15+ (with pgvector and PostGIS extensions)
- Redis 7+
- Docker + Docker Compose (for containerized deployment)

### Required API Keys
- Gemini API key(s) (default LLM provider)
- Anthropic API key (optional, for Claude integration)

---

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure it:

```bash
cd AI_NEW
cp .env.example .env
```

**Edit `.env` with your settings:**

```env
# Server
DEBUG=true
AI_SERVER_PORT=8000
AI_API_KEY=breyus-ai-secret-key-2024
LOG_LEVEL=INFO
REQUEST_LOG_SAMPLE_RATE=1.0

# PostgreSQL (adjust for local or Docker)
POSTGRES_HOST=localhost          # Use 'postgres' when running in Docker
POSTGRES_PORT=5432
POSTGRES_DB=breyus_ai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_MIN_CONN=5
POSTGRES_MAX_CONN=20

# Redis (adjust for local or Docker)
REDIS_URL=redis://localhost:6379  # Use 'redis://redis:6379' when running in Docker
REDIS_JOB_TTL_SEC=900
REDIS_CACHE_TTL_SEC=900

# LLM (Anthropic - optional)
ANTHROPIC_API_KEY=sk-ant-api03-...your-key-here
LLM_MODEL=claude-3-sonnet-20240229

# LLM (Gemini - default)
GEMINI_API_KEY=your_gemini_key_1,your_gemini_key_2
GEMINI_MODEL=gemini-1.5-pro
AI_PROVIDER=gemini

# Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L12-v2
EMBEDDING_BATCH_SIZE=100

# Retention (Postgres cache TTLs, in days)
TTL_LINK_PREDICTION_DAYS=14
TTL_TRADE_SCORE_DAYS=7
TTL_ANALYSIS_DAYS=30

# Pipeline
PIPELINE_DEV_NAME=developer
```

---

## Running the AI Server

### Option 1: Docker Compose (Recommended)

**Start all services (Postgres + Redis + AI Server):**

```bash
cd AI_NEW

# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f ai-server
docker-compose logs -f postgres
docker-compose logs -f redis

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

**Access Points:**
- AI Server: http://localhost:8000
- Health Check: http://localhost:8000/health
- API Docs: http://localhost:8000/docs (DEBUG=true only)
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Local Python (Development)

**Prerequisites:** Local PostgreSQL and Redis must be running.

```bash
cd AI_NEW

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply database schema
psql -h localhost -U postgres -d breyus_ai -f shared/db/schema.sql

# Run the server
cd server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or use the main.py directly
python main.py
```

**Access Points:**
- AI Server: http://localhost:8000
- Health Check: http://localhost:8000/health
- API Docs: http://localhost:8000/docs (Swagger UI, DEBUG=true only)
- Redoc: http://localhost:8000/redoc

---

## Database Setup

### Option 1: Docker (Automatic)

When using Docker Compose, the database is automatically created with the correct extensions.
If you're upgrading an existing database, apply migrations:

```bash
docker-compose exec -T postgres psql -U postgres -d breyus_ai < shared/db/migrations/001_add_ai_cache_tables.sql
```

### Option 2: Manual Setup (Local PostgreSQL)

```bash
# Create database
psql -U postgres -c "CREATE DATABASE breyus_ai;"

# Connect and enable extensions
psql -U postgres -d breyus_ai <<EOF
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOF

# Apply schema
psql -U postgres -d breyus_ai -f shared/db/schema.sql

# Apply migrations (existing DBs)
psql -U postgres -d breyus_ai -f shared/db/migrations/001_add_ai_cache_tables.sql

# Verify tables
psql -U postgres -d breyus_ai -c "\dt"
```

**Expected Tables:**
- companies
- trade_records
- products
- entities
- trade_links
- predicted_partners
- data_import_log
- embedding_queue
- ai_cache_link_predictions
- ai_cache_trade_scores
- ai_cache_analysis_results

---

## Data Pipeline Commands

### Pipeline CLI Location

```bash
cd AI_NEW/pipeline/scripts
```

### Check Current Status

```bash
# View manifest status
python cli.py status

# List all files
python cli.py list

# List files by status
python cli.py list --status csv
python cli.py list --status normalized
python cli.py list --status in_db
```

---

## Processing Sample Files (Small & Large)

### Small Files (Quick Testing - < 500KB)

#### 1. Process "2309 export.xlsx" (18KB - Smallest file)

```bash
cd AI_NEW/pipeline/scripts

# Full pipeline: convert → normalize → insert → embed
python cli.py run-all "2309 export.xlsx"

# Or step by step:
python cli.py convert "2309 export.xlsx"
python cli.py normalize "2309_export__Export_Records.csv"
python cli.py insert "../normalized/2309_export__Export_Records.csv" --mapping trade_export
```

#### 2. Process "Nov24EXP1.xlsx_31.xlsx" (72KB)

```bash
python cli.py run-all "Nov24EXP1.xlsx_31.xlsx"
```

### Medium Files (Moderate Testing - 100KB-2MB)

#### 3. Process "23 import sample 2309.xlsx" (418KB)

```bash
python cli.py run-all "23 import sample 2309.xlsx"
```

#### 4. Process "export 23 april 2309.xlsx" (1.3MB)

```bash
python cli.py run-all "export 23 april 2309.xlsx"
```

### Large Files (Production Testing - 4MB-80MB)

#### 5. Process "International Buyer,Importer From 200 Countries Data.xlsx" (4.6MB)

```bash
# This file contains international company data
python cli.py run-all "International Buyer,Importer From 200 Countries Data.xlsx"
```

#### 6. Process "indian importer exporter data final.xlsx" (14MB)

```bash
# This file contains Indian company data
python cli.py run-all "indian importer exporter data final.xlsx"
```

#### 7. Process "71 ALL PORT  EXPORT  FEB 2025.xlsx" (78MB - Largest file)

```bash
# WARNING: This is a very large file and will take significant time
# Recommended to run in background or screen session

# Full pipeline
python cli.py run-all "71 ALL PORT  EXPORT  FEB 2025.xlsx"

# Or step-by-step with monitoring
python cli.py convert "71 ALL PORT  EXPORT  FEB 2025.xlsx"
python cli.py status  # Check progress

python cli.py normalize "71_ALL_PORT_EXPORT_FEB_2025__Sheet1.csv"
python cli.py status

python cli.py insert "../normalized/71_ALL_PORT_EXPORT_FEB_2025__Sheet1.csv" --mapping trade_export
python cli.py status
```

---

## Batch Processing Commands

### Convert All Unconverted Files

```bash
cd AI_NEW/pipeline/scripts
python cli.py convert-all
```

### Process All Pending Files

```bash
# This runs full pipeline for all files that haven't been fully processed
python cli.py run-all-pending
```

### Process Specific Data Types

```bash
# Process only company files
python cli.py run-all "indian importer exporter data final.xlsx"
python cli.py run-all "International Buyer,Importer From 200 Countries Data.xlsx"

# Process only trade record files
python cli.py run-all "2309 export.xlsx"
python cli.py run-all "23 import sample 2309.xlsx"
python cli.py run-all "export 23 april 2309.xlsx"
```

---

## Post-Processing: Embeddings & Derived Data

### Generate Embeddings

```bash
cd AI_NEW/pipeline/scripts

# Generate embeddings for all companies without vectors
python cli.py embed --table companies

# Generate embeddings for all trade records without vectors
python cli.py embed --table trade_records

# Generate embeddings for all products without vectors
python cli.py embed --table products
```

### Build Trade Links

```bash
# Aggregate trade_records into trade_links
python cli.py build-links

# Check results
psql -U postgres -d breyus_ai -c "SELECT COUNT(*) FROM trade_links;"
```

### Compute Predictions

```bash
# Generate predicted_partners from trade_links and embeddings
python cli.py compute-predictions

# Check results
psql -U postgres -d breyus_ai -c "SELECT COUNT(*) FROM predicted_partners;"
```

---

## New Features Implemented

### Caching Layer
The AI server uses Redis for short-lived cache and Postgres for long-lived cached responses:
- Link predictions: 14-day cache
- Trade scores: 7-day cache
- Market analysis: 30-day cache

Check cache statistics:
```bash
curl http://localhost:8000/cache/stats \
  -H "X-API-Key: dev-secret-key-change-in-production"
```

### Async Job Queue
Market analysis runs asynchronously with job status tracking:
1. Create job via `POST /v1/analysis/initiate`
2. Receive immediate job_id + initial data
3. Poll `GET /v1/analysis/results/{job_id}` until COMPLETED (PENDING/PROCESSING while running)
4. Background worker processes jobs automatically

### Background Worker
Analysis worker automatically starts with the server and processes pending jobs every 5 seconds with max 3 concurrent jobs.

### Enhanced Logging
Structured logging with:
- Request correlation IDs
- Log rotation (10MB max, 5 backups)
- Separate console (INFO+) and file (DEBUG+) outputs
- Logs stored in `logs/ai_server.log`

---

## Testing the AI Endpoints

### Curl Test Script (Recommended)

Run the local curl-based smoke test script against a running Docker server.
It logs each step, request/response, status code, and timing, then prints a summary.

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run_api_curl_tests.ps1
```

Note: `scripts/run_api_curl_tests.ps1` currently hardcodes the base URL and API key from `.env`.
Edit the script directly if you need to change them.

### Health Check

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-19T12:00:00Z",
  "database": {
    "connected": true,
    "companies_count": 150000,
    "trade_records_count": 500000,
    "products_count": 1000
  },
  "redis": {
    "connected": true
  },
  "embedding_model": {
    "loaded": true,
    "model": "sentence-transformers/all-MiniLM-L12-v2"
  },
  "manifest": {
    "total_files": 42,
    "in_db": 10,
    "pending": 32
  }
}
```

### Link Prediction

```bash
curl -X POST http://localhost:8000/v1/links/predict \
  -H "Content-Type: application/json" \
  -H "X-API-Key: breyus-ai-secret-key-2024" \
  -d '{
    "role": "buyer",
    "buyer_name": "Buyer Co",
    "commodity": "Coffee Beans",
    "hs_code": "090111",
    "price_range": { "min": 2000, "max": 2500 },
    "port_preference": "Nhava Sheva",
    "profile": {
      "country": "Switzerland",
      "location": { "lat": 47.3769, "lon": 8.5417 },
      "mean_monthly_revenue": 550000,
      "payment_terms": "letter of credit"
    }
  }'
```

### Gravity Score

```bash
curl -X POST http://localhost:8000/v1/trades/score \
  -H "Content-Type: application/json" \
  -H "X-API-Key: breyus-ai-secret-key-2024" \
  -d '{
    "role": "buyer",
    "buyer_name": "Buyer Co",
    "seller_name": "Seller Co",
    "commodity": "Coffee Beans",
    "hs_code": "090111",
    "buyer_country": "Switzerland",
    "seller_country": "India",
    "buyer_port": "Nhava Sheva",
    "profile": {
      "country": "Switzerland",
      "location": { "lat": 47.3769, "lon": 8.5417 },
      "mean_monthly_revenue": 550000,
      "payment_terms": "letter of credit"
    }
  }'
```

### Market Analysis

```bash
# Initiate analysis
curl -X POST http://localhost:8000/v1/analysis/initiate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: breyus-ai-secret-key-2024" \
  -d '{
    "commodity": "Coffee Beans",
    "hs_code": "090111",
    "market_context": {
      "buyer_country": "Switzerland",
      "seller_country": "India",
      "port": "Nhava Sheva",
      "price_range": { "min": 2000, "max": 2500 },
      "role": "buyer"
    }
  }'

# Response:
# {"jobId": "abc123", "status": "ACCEPTED"}

# Poll for results
curl http://localhost:8000/v1/analysis/results/abc123 \
  -H "X-API-Key: breyus-ai-secret-key-2024"
```

**Note:** Poll until status is `COMPLETED` to retrieve results (PENDING/PROCESSING while running).

### Niche Commodity Search

```bash
curl -X POST http://localhost:8000/v1/commodities/search-niche \
  -H "Content-Type: application/json" \
  -H "X-API-Key: breyus-ai-secret-key-2024" \
  -d '{
    "commodity": "Coffee",
    "country_preference": "India",
    "price_range": { "min": 1000, "max": 3000 },
    "limit": 5
  }'
```

---

## Monitoring & Debugging

### Check Docker Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ai-server
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Check Database Content

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d breyus_ai

# Or locally
psql -U postgres -d breyus_ai

# Check record counts
SELECT
  (SELECT COUNT(*) FROM companies) as companies,
  (SELECT COUNT(*) FROM trade_records) as trade_records,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM trade_links) as trade_links,
  (SELECT COUNT(*) FROM predicted_partners) as predicted_partners;

# Check data import status
SELECT
  status,
  COUNT(*) as count,
  SUM(total_rows) as total_rows,
  SUM(rows_imported) as imported,
  SUM(rows_failed) as failed
FROM data_import_log
GROUP BY status;

# View recent imports
SELECT file_name, status, rows_imported, rows_failed, completed_at
FROM data_import_log
ORDER BY created_at DESC
LIMIT 10;
```

### Check Redis Content

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Or locally
redis-cli

# Check keys
KEYS *

# Check job status (example)
GET job:abc123
```

### Check Pipeline Manifest

```bash
cd AI_NEW/pipeline/scripts
python cli.py status

# View full manifest
cat ../manifest.json | jq '.'

# Count by status
cat ../manifest.json | jq '.files | group_by(.status) | map({status: .[0].status, count: length})'
```

---

## Troubleshooting

### Issue: "Connection refused" to PostgreSQL

**Docker:**
```bash
# Check if postgres container is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

**Local:**
```bash
# Check if PostgreSQL is running
# Windows:
sc query postgresql-x64-15

# Linux:
sudo systemctl status postgresql

# Start PostgreSQL
# Windows:
net start postgresql-x64-15

# Linux:
sudo systemctl start postgresql
```

### Issue: "Extension 'vector' not found"

```bash
# Enter postgres container
docker-compose exec postgres psql -U postgres -d breyus_ai

# Install extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: Pipeline insert fails

```bash
# Check error logs
cat pipeline/errors/*.csv

# Check manifest status
cd pipeline/scripts
python cli.py status

# Retry failed files
python cli.py retry-errors
```

### Issue: Embeddings not generating

```bash
# Check if embedding model is downloaded
python -c "from sentence_transformers import SentenceTransformer; model = SentenceTransformer('sentence-transformers/all-MiniLM-L12-v2'); print('Model loaded successfully')"

# Force re-download
pip uninstall sentence-transformers -y
pip install sentence-transformers
```

### Issue: Out of memory during large file processing

```bash
# Process files in smaller batches
# Edit the file to split into smaller chunks before processing

# Or increase Docker memory limits in docker-compose.yml
# Add under ai-server service:
#   deploy:
#     resources:
#       limits:
#         memory: 4G
```

---

## Recommended Processing Order

### Phase 1: Small Files (Quick Validation - ~5 minutes)
1. `2309 export.xlsx` (18KB)
2. `Nov24EXP1.xlsx_31.xlsx` (72KB)

### Phase 2: Medium Files (Data Variety - ~15 minutes)
3. `23 import sample 2309.xlsx` (418KB)
4. `export 23 april 2309.xlsx` (1.3MB)

### Phase 3: Company Data (High-Value - ~30 minutes)
5. `International Buyer,Importer From 200 Countries Data.xlsx` (4.6MB)
6. `indian importer exporter data final.xlsx` (14MB)

### Phase 4: Large Trade Records (Production Scale - ~1-2 hours)
7. `71 ALL PORT  EXPORT  FEB 2025.xlsx` (78MB)
8. `85 ALL PORT  EXPORT  FEB 2025.xlsx` (42MB)

### Phase 5: Derived Data (~10 minutes)
9. Build trade links
10. Compute predictions
11. Generate all embeddings

---

## Next Steps After Data Loading

1. **Verify Data Quality**
   ```bash
   # Check for missing embeddings
   psql -U postgres -d breyus_ai -c "SELECT COUNT(*) FROM companies WHERE name_embedding IS NULL;"

   # Check trade link distribution
   psql -U postgres -d breyus_ai -c "SELECT relationship_type, COUNT(*) FROM trade_links GROUP BY relationship_type;"
   ```

2. **Implement Service Logic**
   - Edit `server/services/link_predictor.py`
   - Edit `server/services/trade_scorer.py`
   - Edit `server/services/market_analyzer.py`

3. **Test Endpoints**
   - Use Swagger UI at http://localhost:8000/docs
   - Test with curl commands above
   - Integrate with main backend

4. **Backend Integration**
   - Create AI service client in `backend/src/ai/ai.service.ts`
   - Add polling for analysis jobs
   - Implement notification emit on completion

5. **Frontend Integration**
   - Wire buyer/seller AI UI flows
   - Add polling UX for analysis jobs
   - Display results with proper error handling

---

## Performance Benchmarks (Estimated)

| File Size | Records | Convert | Normalize | Insert | Embed | Total |
|-----------|---------|---------|-----------|--------|-------|-------|
| 18KB      | ~500    | 1s      | 2s        | 3s     | 5s    | ~11s  |
| 418KB     | ~2,000  | 5s      | 10s       | 15s    | 20s   | ~50s  |
| 1.3MB     | ~10,000 | 15s     | 30s       | 60s    | 120s  | ~4m   |
| 4.6MB     | ~50,000 | 45s     | 90s       | 300s   | 600s  | ~17m  |
| 14MB      | ~130,000| 120s    | 240s      | 900s   | 1800s | ~52m  |
| 78MB      | ~500,000| 600s    | 1200s     | 3600s  | 7200s | ~3.5h |

**Note:** Times vary based on hardware, database speed, and network conditions.

---

## Support & Documentation

- **Full Documentation**: See `README.md` in AI_NEW folder
- **Pipeline Details**: See `PIPELINE.md`
- **Task Tracker**: See `AI_TASKS.md`
- **Development Guide**: See `DEV_RUNBOOK.md`
- **Database Schema**: See `shared/db/CANONICAL_SCHEMA.md`
- **API Documentation**: http://localhost:8000/docs (when server running)

---

## Quick Command Reference

```bash
# Start services
docker-compose up -d

# Check health
curl http://localhost:8000/health

# Process a small file
cd pipeline/scripts && python cli.py run-all "2309 export.xlsx"

# Check status
python cli.py status

# Build derived data
python cli.py build-links
python cli.py compute-predictions

# Stop services
docker-compose down
```
