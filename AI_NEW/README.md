# Breyus AI Microservices

## Overview

This directory contains the AI microservices for Breyus - a B2B commodity trading platform. The AI layer provides intelligent matching, scoring, and analysis capabilities to help buyers and sellers find optimal trade partners.

### AI Features

| Feature | Description | User Benefit |
|---------|-------------|--------------|
| **Trade Partner Link Prediction** | Finds upstream suppliers or downstream customers using multi-source scoring | Discover new trade partners automatically |
| **Trade Probability Scoring** | Calculates "Gravity Score" for potential partners | Prioritize high-probability deals |
| **Market Analysis** | LLM-powered market insights with charts | Make informed trading decisions |
| **Demand Forecasting** | Historical + predicted demand trends | Plan inventory and pricing |
| **Price Volatility Analysis** | Monthly/yearly price movement predictions | Hedge against market risks |
| **Similarity Search** | Find similar commodities/companies | Expand product discovery |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│                         (React + TypeScript)                                 │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MAIN BACKEND (NestJS)                                │
│                         "The Orchestrator"                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Handles all public-facing API requests                                    │
│  • User authentication & authorization                                       │
│  • Business logic & validation                                               │
│  • Makes secure internal calls to AI server (API key auth)                   │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTP (gRPC later)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AI SERVER (Single FastAPI Instance)                      │
│                              Port 8000                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│   │  /v1/links/*    │  │  /v1/trades/*   │  │  /v1/analysis/* │            │
│   │  Link Predict   │  │  Trade Score    │  │  Market Analysis│            │
│   ├─────────────────┤  ├─────────────────┤  ├─────────────────┤            │
│   │ • Partner find  │  │ • Gravity score │  │ • LLM insights  │            │
│   │ • Multi-source │  │ • 11 metrics    │  │ • Async jobs    │            │
│   │ • SQL + vector  │  │ • Deterministic │  │ • Charts data   │            │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                              │
│   Shared: DB connections, embeddings model, utilities                        │
│                                                                              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
├─────────────────────────────────────────────┬───────────────────────────────┤
│              PostgreSQL                     │          Redis                │
│        + pgvector + PostGIS                 │         (Cache)               │
├─────────────────────────────────────────────┼───────────────────────────────┤
│ • companies                                 │ • LLM response cache          │
│ • trade_records                             │ • Job status (PENDING/PROCESSING/COMPLETED)   │
│ • trade_links (relationships)               │ • Frequent query results      │
│ • predicted_partners                        │ • TTL: 10-15 minutes          │
│ • Vector embeddings (pgvector)              │                               │
│ • Geospatial queries (PostGIS)              │                               │
└─────────────────────────────────────────────┴───────────────────────────────┘
```

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| AI Server | Python + FastAPI | Single server, multiple routers |
| Database | PostgreSQL | All data storage |
| Vector Search | pgvector extension | Similarity search (up to 500k records) |
| Geospatial | PostGIS extension | Location-based queries |
| Cache | Redis | LLM responses + job status |
| LLM Provider | Gemini 1.5 (default) / Claude 3 Sonnet (optional) | Market analysis generation |
| Embeddings | sentence-transformers | Local vector generation |
| Deployment | Docker Compose | All services in one compose file |

### Design Principles

1. **Single Server**: All AI endpoints run on one FastAPI instance (not microservices)
2. **Single Database**: PostgreSQL handles everything (structured, vector, geospatial, relationships)
3. **Stateless**: AI server doesn't know about users - receives all context in requests
4. **Internal Only**: AI server is not public-facing; main backend is the gatekeeper
5. **API Key Auth**: Main backend authenticates to AI server via API key
6. **Async Where Needed**: LLM calls are async with job polling; scoring is sync

---

### Deployment & Auth Summary

- Docker-only deployment (Compose stack with Postgres, Redis, FastAPI server)
- Backend owns and injects the AI API key; outbound calls use a simple `X-API-Key` header
- AI server remains internal-only; no direct public exposure
- Async endpoints use polling from the main backend; UI surfaces the polled results

### Caching & Retention

- Results are persisted in the AI Postgres for reuse; served from cache when fresh
- TTL by type: link prediction 14d, gravity scores 7d, market analysis outputs 30d
- Cache invalidation: expiry by TTL plus purge on new data imports (pipeline runs/build-links/compute-predictions)
- Redis remains for short-lived LLM/job status caching; long-lived result cache stays in Postgres
- Postgres cache tables: `ai_cache_link_predictions`, `ai_cache_trade_scores`, `ai_cache_analysis_results`
- Similarity search endpoint is deferred (future); embeddings remain generated for current flows


## API Endpoints

All responses are wrapped in the standard API envelope:
```json
{ "statusCode": 200, "message": "Success", "data": { ... } }
```

The main backend calls these internal AI endpoints:

| # | Endpoint | Method | Type | Purpose |
|---|----------|--------|------|---------|
| 1 | `/v1/links/predict` | POST | Sync | Find trade partners |
| 2 | `/v1/trades/score` | POST | Sync | Score potential partners |
| 3 | `/v1/analysis/initiate` | POST | Async | Start market analysis |
| 4 | `/v1/analysis/results/{jobId}` | GET | Polling | Get analysis results |
| 5 | `/v1/commodities/search-niche` | POST | Sync | Find related niche commodities |

---

### API 1: Predict Trade Link

**`POST /v1/links/predict`**

Finds the most probable upstream supplier (for seller) or downstream customer (for buyer) using multi-source scoring.

Backend request intent (trade dataset only):
- Use company name for lookup (AI DB IDs are optional and often unavailable).
- Send only useful context for matching/scoring: country, location (lat/lon), buyer port (from the form), price range, and financing/capital context.
  These fields improve geospatial matching and gravity score accuracy without replacing AI trade data.

#### Request Body

```json
{
  "role": "buyer",
  "buyer_name": "Acme Imports",
  "commodity": "Coffee Beans Grade A",
  "hs_code": "090111",
  "mode": "normal",
  "top_k": 25,
  "country_preference": "Netherlands",
  "port_preference": "Port of Rotterdam",
  "price_range": { "min": 2000, "max": 2500 },
  "profile": {
    "country": "Netherlands",
    "location": { "lat": 51.92, "lon": 4.48 },
    "mean_monthly_revenue": 550000,
    "payment_terms": "LC",
    "credit_score": 720
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `buyer_id` | string | Optional | Buyer UUID (only if AI DB ID is available) |
| `seller_id` | string | Optional | Seller UUID (only if AI DB ID is available) |
| `buyer_name` / `seller_name` | string | Yes (one required) | Name-based lookup in AI trade dataset |
| `role` | string | Required when `profile` is provided | `buyer` or `seller` (profile owner) |
| `commodity` | string | Yes | Commodity being traded |
  | `hs_code` | string | No | HS code filter (falls back to commodity text match if coverage < 100 records) |
| `mode` | string | No | `"normal"` (fast) or `"deep"` (larger search) |
| `top_k` | number | No | Max number of matches to return (default 25 in normal, 200 in deep; max 100 normal, 500 deep) |
| `country_preference` | string | No | Target country filter |
| `port_preference` | string | No | Target port filter |
| `price_range.min` | number | No | Minimum price |
| `price_range.max` | number | No | Maximum price |
| `profile` | object | No | Optional seeker context for scoring (country, location, revenue, payment terms, credit score) |

Legacy shape (`entity` + `reference_entity`) is still accepted.

Notes:
- Name lookup is the primary match path when AI DB IDs are not available.
- Geospatial matching requires `profile.location` (lat/lon).
- Pre-computed predictions prefer an AI DB company ID; name-based lookup is used when ID is missing.
- Results are aggregated across multiple sources; each match includes `sources`.
- `match_strategy` reflects the highest-priority source present, not necessarily the only source used.
- Commodity pool fallback pulls top traders for the commodity so the endpoint avoids empty results.
- `mode="deep"` expands per-source candidate limits; expect slower responses.
- Seller-side commodity pool falls back to exporter/supplier records when importer/consignee data is unavailable.
- `profile.mean_monthly_revenue` should be numeric (backend should map ranges to a midpoint).
- `profile.payment_terms` examples: "letter of credit", "advance", "net 30".

#### Success Response (200 OK)

```json
{
  "matches": [
    {
      "company_id": "uuid",
      "company_name": "Noval Pvt LTD",
      "country": "India",
      "location": "Karnataka, Bengaluru",
      "product": {
        "name": "Coffee Beans Grade A",
        "price": "2000.00",
        "moq": "100.00"
      },
      "probability": 78.5,
      "next_month_price_fluctuation": 6.2,
      "risk_level": "Low",
      "gravity_score": 0.87
    }
  ],
  "match_strategy": "historical",
  "legacy": {
    "found": true,
    "predicted_partner": {
      "name": "Predicted Buyer 2",
      "address": "123 Trade Street, Hamburg, Germany"
    },
    "confidence": "high",
    "method": "historical_match"
  }
}
```

| Field | Type | Values |
|-------|------|--------|
| `found` | boolean | `true` / `false` |
| `confidence` | string | `"high"`, `"medium"`, `"low"`, `"inferred"` |
| `method` | string | `"historical_match"`, `"similarity_match"`, `"geospatial_cluster"`, `"graph_ai_inference"`, `"commodity_pool"`, `"global_fallback"` |

#### No Match Response (200 OK)

```json
{
  "found": false,
  "predicted_partner": null,
  "confidence": null,
  "method": null
}
```

#### Internal Workflow (Multi-source Aggregation)

```
┌─────────────────────────────────────────────────────────────────┐
│                    LINK PREDICTION FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. COLLECT CANDIDATES (parallel)                                │
│  ├── trade_records commodity pool                               │
│  ├── trade_links historical relationships                       │
│  ├── pgvector similarity + trade_links                          │
│  ├── PostGIS geospatial cluster                                 │
│  └── predicted_partners (batch predictions)                     │
│                                                                  │
│  2. MERGE + DEDUPE                                               │
│  ├── Combine matches by company                                 │
│  └── Track all contributing sources                             │
│                                                                  │
│  3. SCORE + RANK                                                 │
│  ├── Gravity score + source boost + preference bonus            │
│  └── Return sorted matches                                      │
│                                                                  │
│  4. FALLBACK                                                     │
│  ├── If no candidates → global top companies                    │
│  └── Return empty if even global fallback has none              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Commodity pool uses trade_records to avoid empty results, and global fallback is used only when no candidates are found.

---

### API 2: Score Potential Trades

**`POST /v1/trades/score`**

Calculates a weighted "Gravity Score" probability for a buyer/seller pair. Legacy batch scoring is still supported.

#### Request Body

```json
{
  "buyer_id": "uuid",
  "seller_id": "uuid",
  "commodity": "Coffee Beans Grade A",
  "hs_code": "090111",
  "buyer_country": "Switzerland",
  "seller_country": "India",
  "buyer_port": "Nhava Sheva"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `buyer_id` | string | Yes | Buyer UUID |
| `seller_id` | string | Yes | Seller UUID |
| `buyer_name` / `seller_name` | string | Optional | Name-based fallback |
| `commodity` | string | Yes | Commodity being traded |
| `hs_code` | string | No | HS code filter |
| `buyer_country` | string | No | Buyer country context |
| `seller_country` | string | No | Seller country context |
| `buyer_port` | string | No | Buyer port preference |

#### Success Response (200 OK)

```json
{
  "gravity_score": 0.87,
  "probability": 78.5,
  "breakdown": {
    "demand": 0.18,
    "source_geography": 0.13,
    "port_proximity": 0.12,
    "transport_cost": 0.08,
    "capital": 0.09,
    "financing": 0.06,
    "price_range": 0.06,
    "weather": 0.04,
    "volatility": 0.04,
    "barrier": 0.03,
    "frequency": 0.02
  }
}
```

Legacy batch scoring (`reference_entity` + `candidates`) is still accepted and returns `scores`.

#### Internal Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCORING FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. FAN-OUT DATA FETCHING (Parallel)                            │
│     ├── For each candidate, fetch from PostgreSQL + Neo4j:      │
│     │   • Demand metrics                                        │
│     │   • Port proximity                                        │
│     │   • Capital requirements                                  │
│     │   • Historical trade frequency                            │
│     │   • Company size/verification                             │
│     │   • ... (11 total scoring metrics)                        │
│     └── Use Promise.all for parallel execution                  │
│                         │                                        │
│                         ▼                                        │
│  2. CALL SCORING SERVICE                                         │
│     └── Package all data and send to FastAPI service            │
│                         │                                        │
│                         ▼                                        │
│  3. CALCULATE GRAVITY SCORES                                     │
│     ├── Run deterministic formula for each candidate            │
│     ├── Apply weights to each metric                            │
│     └── No LLM involved - pure computation                      │
│                         │                                        │
│                         ▼                                        │
│  4. NORMALIZE & RETURN                                           │
│     ├── Calculate probabilities (relative to sum)               │
│     └── Return sorted list by probability                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Gravity Score Metrics (11 Factors)

| # | Metric | Description |
|---|--------|-------------|
| 1 | Demand | Historical demand for this commodity |
| 2 | Source Geography | Geographic fit between parties |
| 3 | Port Proximity | Port alignment for the route |
| 4 | Transport Cost | Distance-based transport factor |
| 5 | Capital | Financial capacity indicators |
| 6 | Financing | Financing availability signals |
| 7 | Price Range | Budget alignment |
| 8 | Weather | Weather risk proxy |
| 9 | Volatility | Price volatility proxy |
| 10 | Barrier | Trade barrier score |
| 11 | Frequency | Recent trade frequency |

---

### API 3: Initiate Market Analysis

**`POST /v1/analysis/initiate`**

Starts an async LLM-powered market analysis and immediately returns quantitative data + a jobId for polling.

Notes:
- If `hs_code` coverage is below 100 dated records, analysis falls back to commodity text matching.
- The LLM drives the narrative analysis; internal DB stats are attached to the response as supporting evidence only.
- Demand forecasts are LLM-driven (0-100 index) with a small DB weighting (~10%) for stability.

#### Request Body

```json
{
  "commodity": "Coffee Beans Grade A",
  "hs_code": "090111",
  "market_context": {
    "buyer_country": "Switzerland",
    "seller_country": "India",
    "port": "Nhava Sheva",
    "price_range": { "min": 2000, "max": 2500 },
    "role": "buyer"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commodity` | string | Yes | Commodity to analyze |
| `hs_code` | string | No | HS code filter |
| `market_context` | object | No | Market context for analysis |
| `market_context.buyer_country` | string | No | Buyer country |
| `market_context.seller_country` | string | No | Seller country |
| `market_context.port` | string | No | Port preference |
| `market_context.price_range` | object | No | Price band |
| `market_context.role` | string | No | `"buyer"` or `"seller"` |

Legacy fields (`source_country`, `destination_country`, `role`) are still accepted.

#### Success Response (202 Accepted)

```json
{
  "statusCode": 202,
  "message": "Market analysis job created",
  "data": {
    "jobId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "status": "ACCEPTED",
    "commodity": "Coffee Beans Grade A",
    "hs_code": "090111",
    "initial_charts": {
      "price_trend": {
        "labels": ["Jan 2024", "Feb 2024", "Mar 2024"],
        "values": [2000, 2100, 1900]
      },
      "volume_trend": {
        "labels": ["Jan 2024", "Feb 2024", "Mar 2024"],
        "values": [100, 120, 90]
      },
      "top_exporters": [
        { "country": "India", "volume": 320 }
      ],
      "top_importers": [
        { "country": "Switzerland", "volume": 210 }
      ]
    }
  }
}
```

#### Internal Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                ANALYSIS INITIATION FLOW                          │
│                   (Target: < 500ms)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. GENERATE JOB ID                                              │
│     └── Create unique UUID for tracking                         │
│                         │                                        │
│                         ▼                                        │
│  2. FETCH QUICK DATA (Parallel)                                  │
│     ├── Query PostgreSQL for quantitative data                  │
│     │   • Current prices                                        │
│     │   • Open interest                                         │
│     │   • Historical demand points                              │
│     └── Fast indexed queries only                               │
│                         │                                        │
│                         ▼                                        │
│  3. KICK OFF BACKGROUND JOB                                      │
│     ├── Async trigger for full LLM analysis                     │
│     ├── Store job status (PENDING) in Redis                     │
│     └── Background job will:                                    │
│         • Gather detailed context                               │
│         • Call LLM provider (Gemini/Claude)                                  │
│         • Store result in Redis when done                       │
│                         │                                        │
│                         ▼                                        │
│  4. RETURN IMMEDIATELY                                           │
│     └── Return jobId + initial_data                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### API 4: Retrieve Analysis Results

**`GET /v1/analysis/results/{jobId}`**

Retrieves the result of a market analysis job. Frontend should poll every 2-3 seconds.

#### Request Parameters

| Parameter | Location | Description |
|-----------|----------|-------------|
| `jobId` | Path | UUID returned from `/initiate` |

#### Pending Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Job status: PENDING",
  "data": {
    "jobId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "status": "PENDING"
  }
}
```

#### Completed Response (200 OK)

`db_stats` reports internal dataset coverage and should be treated as supporting context, not the primary analysis driver.
`analysis_raw` is included when the LLM response cannot be parsed into structured JSON.

```json
{
  "statusCode": 200,
  "message": "Job status: COMPLETED",
  "data": {
    "jobId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "status": "COMPLETED",
    "result": {
      "commodity": "Coffee Beans Grade A",
      "hs_code": "090111",
      "db_stats": {
        "match_scope": "commodity_text",
        "records_total": 7527,
        "records_last_12_months": 1184,
        "date_range": "2021-01-01 to 2024-12-01",
        "avg_unit_price_usd": 2.48,
        "unit_price_range_usd": { "min": 0.12, "max": 18.75 },
        "total_volume": 498211.0,
        "avg_volume": 66.2,
        "route_records_total": 214,
        "route_records_last_12_months": 38,
        "hs_code_requested": "090111",
        "hs_code_used": null,
        "hs_code_rows_with_dates": 12,
        "hs_code_fallback": true,
        "hs_code_fallback_reason": "HS code coverage below 100 records; used commodity text match.",
        "hs_code_min_rows": 100
      },
      "market_context": {
        "export_country": "India",
        "import_country": "Switzerland",
        "nearest_port": "Nhava Sheva",
        "price_range": "$2000-2500 per tonne",
        "weather_impact": "Seasonal weather patterns in India may affect production."
      },
      "charts": {
        "demand_forecast": {
          "countries": ["Italy", "Germany"],
          "stable_demand": [82.5, 76.2],
          "current_demand": [88.1, 73.4],
          "forecast_3m": [90.2, 75.0],
          "forecast_6m": [92.7, 77.8],
          "forecast_9m": [95.1, 79.0]
        },
        "capital_required": {
          "timeline": ["Jan 2024", "Feb 2024", "Mar 2024"],
          "historical": [120.0, 135.0, 128.0],
          "projected": [132.0, 138.0, 141.0]
        },
        "price_volatility": {
          "timeline": ["Jan 2024", "Feb 2024", "Mar 2024"],
          "prices": [2000.0, 2100.0, 1900.0],
          "volatility_high": [2120.0, 2226.0, 2014.0],
          "volatility_low": [1880.0, 1974.0, 1786.0],
          "volatility_percent": 6.0,
          "predicted": { "month3": 4.5, "month6": 4.8, "month9": 5.2 }
        }
      },
      "insights": {
        "summary": "Steady demand, moderate volatility.",
        "recommendations": ["Secure flexible contracts", "Monitor freight rates"]
      },
      "analysis": {
        "market": {
          "export_side": {
            "general_info": "Major exporters include India.",
            "choice": "India provides steady supply.",
            "suggestion": "Lock contracts before monsoon."
          },
          "import_side": {
            "general_info": "EU demand remains steady.",
            "choice": "Switzerland favors quality beans.",
            "suggestion": "Highlight certifications."
          },
          "price_range": {
            "general_info": "Prices range by grade.",
            "choice": "Route premium pricing likely.",
            "suggestion": "Use hedging for spikes."
          }
        },
        "supplyChain": {
          "ports_movement": {
            "general_info": "Key ports handle coffee exports.",
            "choice": "Nhava Sheva is reliable.",
            "suggestion": "Book slots early."
          },
          "transport_costs": {
            "general_info": "Freight costs stable.",
            "choice": "Route costs moderate.",
            "suggestion": "Compare carriers quarterly."
          },
          "financing_support": {
            "general_info": "LC usage common.",
            "choice": "Banks support this route.",
            "suggestion": "Negotiate LC terms."
          }
        },
        "groundCheck": {
          "weather_storage": {
            "general_info": "Humidity affects storage.",
            "choice": "Monsoon risk moderate.",
            "suggestion": "Use dry storage."
          },
          "market_barriers": {
            "general_info": "EU rules apply.",
            "choice": "Compliance needed.",
            "suggestion": "Confirm certifications."
          },
          "trade_frequency": {
            "general_info": "Regular trade flow.",
            "choice": "Route active.",
            "suggestion": "Plan steady shipments."
          }
        },
        "futures": {
          "open_interest": "Moderate interest.",
          "contract_price": "Aligned with spot.",
          "volatility": "Stable near-term.",
          "prediction": "Slightly higher volatility."
        }
      },
      "analysis_raw": null,
      "predictions": {
        "price_volatility_next_month": 6.0,
        "futures_volatility": "Slightly higher volatility."
      },
      "company_contacts": [
        {
          "company_name": "Sample Exporter",
          "country": "India",
          "location": "Karnataka, India",
          "contact_email": "contact@example.com",
          "sources": ["trade_records"]
        }
      ]
    }
  }
}
```

#### Failed Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Job status: FAILED",
  "data": {
    "jobId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "status": "FAILED",
    "error": "LLM timeout after 30 seconds"
  }
}
```

| Status | Description |
|--------|-------------|
| `PENDING` | Job queued |
| `PROCESSING` | Job running |
| `COMPLETED` | Results available |
| `FAILED` | Job failed (check logs) |

---

### API 5: Search Niche Commodities

**`POST /v1/commodities/search-niche`**

Finds niche commodities related to a base commodity using embedding similarity plus optional filters.

Notes:
- Response is wrapped in the standard API response shape; example below shows the `data` payload.
- UI should show all results and flag each item using `is_niche` (true/false).

#### Request Body

```json
{
  "commodity": "Coffee",
  "country_preference": "India",
  "port_preference": "Nhava Sheva",
  "price_range": { "min": 1000, "max": 3000 },
  "limit": 8
}
```

#### Success Response (200 OK)

```json
{
  "query": "Coffee",
  "query_normalized": "coffee",
  "query_classification": {
    "type": "mainstream",
    "match_strategy": "exact",
    "matched_name": "Coffee",
    "matched_category": "added_for_coverage",
    "matched_source": "added_for_coverage"
  },
  "filters_applied": {
    "country_preference": "India",
    "port_preference": "Nhava Sheva",
    "price_range": { "min": 1000, "max": 3000 },
    "limit": 8
  },
  "result_summary": {
    "total": 1,
    "mainstream": 0,
    "niche": 1
  },
  "filter_summary": {
    "total_candidates": {
      "trade_records": 30,
      "products": 20
    },
    "filter_matches": {
      "country": 8,
      "port": 4,
      "price_range": 5
    },
    "price_presence": {
      "with_price": 10,
      "missing_price": 40
    }
  },
  "results": [
    {
      "name": "Coffee Husk",
      "normalized_name": "coffee husk",
      "similarity": 0.89,
      "sample_country": "India",
      "sample_price": 1500,
      "classification": {
        "type": "niche",
        "match_strategy": "partial",
        "matched_name": "Coffee Husk",
        "matched_category": "niche_override",
        "matched_source": "niche_override"
      },
      "is_niche": true
    }
  ]
}
```

#### Internal Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                RESULTS RETRIEVAL FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CHECK JOB STATUS                                             │
│     └── Query Redis for jobId status                            │
│                         │                                        │
│              ┌──────────┼──────────┐                            │
│              ▼          ▼          ▼                            │
│         [PENDING]  [PROCESSING]  [COMPLETED]  [FAILED]           │
│              │          │          │                            │
│              ▼          ▼          ▼                            │
│         Return     Retrieve    Return                           │
│         status     full JSON   status +                         │
│         only       from Redis  error msg                        │
│                         │                                        │
│                         ▼                                        │
│  2. CACHE RESULT                                                 │
│     └── TTL: 10-15 minutes for repeated requests                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Pipeline

The detailed pipeline guide now lives in `AI_NEW/PIPELINE.md`.

Flow (at a glance): raw Excel → csv → normalized → summarized → dedupe (data_import_log) → pending_db_insert → in_db → embeddings; duplicates are parked in `pipeline/duplicates/`.

Key commands (see PIPELINE.md for full detail):
- convert, normalize, insert (summarize + dedupe + queue insert), embed, build-links, compute-predictions
- run-all, run-all-pending, convert-all, status/list/types/retry-errors, reconcile-duplicates (stub)

## Database Schema

### Design Philosophy

The schema is designed with **flexibility** in mind to handle diverse commodity trading data:

1. **Core normalized fields** - Frequently queried/indexed columns for common operations
2. **JSONB `extra` column** - For row-specific additional data that doesn't apply to all rows
3. **JSONB nested structures** - For complex objects (contact info, address components, trade details)
4. **Vector embeddings** - pgvector for AI similarity search
5. **Geospatial** - PostGIS for location-based queries

### PostgreSQL Tables

All tables use PostgreSQL with `pgvector`, `PostGIS`, and `pg_trgm` extensions.

Full schema: `shared/db/schema.sql`
Field mappings: `shared/db/field_mappings.py`

#### Table: `companies`

Stores all company/entity data from various sources (Indian/international exporters, importers, manufacturers, wholesalers).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(500) | Company name |
| `name_normalized` | VARCHAR(500) | Auto-generated: lowercase, cleaned for dedup |
| `iec_code` | VARCHAR(50) | India Export Code (Indian companies) |
| `entity_types` | entity_type[] | Array: exporter, importer, manufacturer, etc. |
| `country` | VARCHAR(100) | Country name |
| `country_code` | CHAR(3) | ISO 3166-1 alpha-3 code |
| `state` | VARCHAR(100) | State/Province |
| `city` | VARCHAR(100) | City |
| `pin_code` | VARCHAR(20) | Postal/ZIP code |
| `address_full` | TEXT | Full address as provided |
| `address_details` | JSONB | Structured: `{line1, line2, landmark, ...}` |
| `location` | GEOGRAPHY(POINT) | PostGIS point for geo queries |
| `contact_info` | JSONB | **See structure below** |
| `business_details` | TEXT | Description of business |
| `product_categories` | TEXT[] | Array of product categories |
| `hs_codes_dealt` | INTEGER[] | Array of HS codes they trade |
| `total_exports` | INTEGER | Aggregated export count |
| `total_imports` | INTEGER | Aggregated import count |
| `total_trade_value_usd` | DECIMAL | Total trade value |
| `countries_traded_with` | TEXT[] | List of trading partner countries |
| `is_verified` | BOOLEAN | Verification status |
| `data_source` | data_source_type | Enum: indian_trade_records, company_directory, etc. |
| `source_file` | VARCHAR(255) | Original file name |
| `source_row_id` | VARCHAR(100) | Original row identifier |
| `name_embedding` | vector(384) | For company name similarity |
| `profile_embedding` | vector(384) | For business profile similarity |
| **`extra`** | **JSONB** | **Row-specific additional fields** |
| `raw_data` | JSONB | Original row as imported |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last update (auto-updated) |

**`contact_info` JSONB structure:**
```json
{
  "phone": ["91-22-12345678", "91-22-87654321"],
  "mobile": ["91-9876543210"],
  "email": ["info@company.com", "sales@company.com"],
  "website": "https://company.com",
  "contact_person": "John Doe",
  "fax": "91-22-11111111"
}
```

**`extra` JSONB - for row-specific data:**
```json
{
  "source_specific_field": "value",
  "custom_attribute": "value",
  "any_field_not_in_schema": "stored here"
}
```

#### Table: `trade_records`

All trade transaction records (exports and imports).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `record_type` | record_type | Enum: export, import |
| `sb_number` | VARCHAR(50) | Shipping Bill Number |
| `sb_date` | DATE | Shipping Bill Date |
| `reg_date` | DATE | Registration Date |
| `exporter_id` | UUID | FK to companies (optional) |
| `exporter_name` | VARCHAR(500) | Exporter name |
| `exporter_address` | TEXT | Exporter address |
| `exporter_iec` | VARCHAR(50) | Exporter IEC code |
| `importer_id` | UUID | FK to companies (optional) |
| `importer_name` | VARCHAR(500) | Importer/buyer name |
| `importer_address` | TEXT | Importer address |
| `supplier_id` | UUID | FK to companies (optional) |
| `supplier_name` | VARCHAR(500) | Supplier name |
| `supplier_address` | TEXT | Supplier address |
| `consignee_id` | UUID | FK to companies (optional) |
| `consignee_name` | VARCHAR(500) | Consignee name |
| `consignee_address` | TEXT | Consignee address |
| `hs_code` | VARCHAR(20) | Harmonized System code |
| `hs_chapter` | INTEGER | HS Chapter (first 2 digits) |
| `product_description` | TEXT | Product description |
| `item_description` | TEXT | Alternative description |
| `quantity` | DECIMAL(18,4) | Quantity traded |
| `unit_of_measurement` | VARCHAR(20) | KGS, MTS, PCS, NOS, etc. |
| `net_weight_kg` | DECIMAL(18,4) | Net weight in KG |
| `unit_price` | DECIMAL(18,6) | Price per unit |
| `unit_price_usd` | DECIMAL(18,6) | Price in USD |
| `currency` | VARCHAR(10) | Original currency |
| `exchange_rate` | DECIMAL(12,6) | Exchange rate used |
| `total_value_fc` | DECIMAL(18,2) | Total in foreign currency |
| `total_value_usd` | DECIMAL(18,2) | Total in USD |
| `total_value_inr` | DECIMAL(18,2) | Total in INR |
| `fob_value` | DECIMAL(18,2) | FOB value |
| `duty_value` | DECIMAL(18,2) | Duty amount |
| `drawback_value` | DECIMAL(18,2) | Drawback amount |
| `indian_port` | VARCHAR(100) | Indian port name |
| `indian_port_code` | VARCHAR(20) | Port/customs code |
| `foreign_port` | VARCHAR(100) | Foreign port name |
| `foreign_port_code` | VARCHAR(20) | Foreign port code |
| `mode_of_transport` | VARCHAR(50) | SEA, AIR, ROAD, RAIL |
| `customs_house_code` | VARCHAR(20) | Customs house code |
| `origin_country` | VARCHAR(100) | Origin country |
| `destination_country` | VARCHAR(100) | Destination country |
| `trade_month` | VARCHAR(20) | Month name |
| `trade_year` | INTEGER | Year |
| `cha_name` | VARCHAR(255) | Customs House Agent |
| `shipment_type` | VARCHAR(100) | Type of shipment |
| `shipment_status` | VARCHAR(50) | Status |
| `product_embedding` | vector(384) | For product similarity |
| **`trade_details`** | **JSONB** | **Trade-specific extra info** |
| `data_source` | data_source_type | Source type enum |
| `source_file` | VARCHAR(255) | Original file |
| `source_sheet` | VARCHAR(100) | Excel sheet name |
| `source_row_id` | VARCHAR(100) | Original row ID |
| `raw_data` | JSONB | Original row data |
| **`extra`** | **JSONB** | **Row-specific additional fields** |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last update |

**`trade_details` JSONB - for trade-specific info:**
```json
{
  "incoterms": "FOB",
  "payment_terms": "LC 90 days",
  "additional_charges": {"insurance": 500, "handling": 200},
  "special_conditions": "Phytosanitary certificate required"
}
```

#### Table: `products`

Product catalog entries (from product lists, not trade records).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(500) | Product name |
| `name_normalized` | VARCHAR(500) | Auto-cleaned name |
| `hs_code` | VARCHAR(20) | HS code |
| `hs_chapter` | INTEGER | HS chapter |
| `category` | VARCHAR(200) | Product category |
| `subcategory` | VARCHAR(200) | Subcategory |
| `product_type` | VARCHAR(100) | Product type |
| `consumer_types` | TEXT[] | Target consumers (cattle, poultry, etc.) |
| `price_value` | DECIMAL(18,4) | Price value |
| `price_unit` | VARCHAR(50) | Per KG, per tonne, etc. |
| `price_currency` | VARCHAR(10) | Currency |
| `is_negotiable` | BOOLEAN | Price negotiable flag |
| `packaging_info` | VARCHAR(255) | Packaging details |
| `weight_value` | DECIMAL(12,4) | Weight value |
| `weight_unit` | VARCHAR(20) | Weight unit |
| `manufacturer_id` | UUID | FK to companies |
| `manufacturer_name` | VARCHAR(500) | Manufacturer name |
| `city` | VARCHAR(100) | City |
| `country` | VARCHAR(100) | Country |
| `product_embedding` | vector(384) | For similarity search |
| **`specifications`** | **JSONB** | **Technical specs** |
| **`extra`** | **JSONB** | **Row-specific fields** |
| `data_source` | data_source_type | Source type |
| `source_file` | VARCHAR(255) | Original file |
| `raw_data` | JSONB | Original row |
| `created_at` | TIMESTAMPTZ | Created |
| `updated_at` | TIMESTAMPTZ | Updated |

#### Table: `trade_links`

Aggregated trade relationships between entities (derived from trade_records).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `source_company_id` | UUID | FK to companies |
| `source_company_name` | VARCHAR(500) | Denormalized name |
| `target_company_id` | UUID | FK to companies |
| `target_company_name` | VARCHAR(500) | Denormalized name |
| `link_type` | VARCHAR(50) | export_to, import_from, supplier_buyer |
| `relationship_strength` | DECIMAL(5,4) | 0.0 to 1.0 |
| `total_trades` | INTEGER | Count of transactions |
| `total_value_usd` | DECIMAL(18,2) | Total trade value |
| `first_trade_date` | DATE | First transaction |
| `last_trade_date` | DATE | Most recent transaction |
| `commodities_traded` | TEXT[] | List of commodities |
| `hs_codes_traded` | INTEGER[] | List of HS codes |
| `is_active` | BOOLEAN | Had trade in last 12 months |
| `extra` | JSONB | Additional data |
| `created_at` | TIMESTAMPTZ | Created |
| `updated_at` | TIMESTAMPTZ | Updated |

**Unique constraint:** `(source_company_id, target_company_id, link_type)`

#### Table: `predicted_partners`

Pre-computed partner predictions from AI matching.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `company_id` | UUID | FK to companies |
| `company_name` | VARCHAR(500) | Company name |
| `partner_company_id` | UUID | FK to companies |
| `partner_company_name` | VARCHAR(500) | Partner name |
| `prediction_type` | VARCHAR(50) | buyer_for, seller_for, similar_trade_pattern |
| `probability_score` | DECIMAL(5,4) | 0.0 to 1.0 |
| `confidence_level` | VARCHAR(20) | high, medium, low |
| `prediction_reasons` | JSONB | **See structure below** |
| `for_commodity` | VARCHAR(200) | Commodity context |
| `for_hs_code` | VARCHAR(20) | HS code context |
| `computed_at` | TIMESTAMPTZ | When computed |
| `valid_until` | TIMESTAMPTZ | Recompute after |
| `extra` | JSONB | Additional data |

**`prediction_reasons` JSONB structure:**
```json
[
  {"factor": "same_commodity", "weight": 0.3, "score": 0.85},
  {"factor": "geographic_proximity", "weight": 0.2, "score": 0.7},
  {"factor": "business_similarity", "weight": 0.25, "score": 0.9},
  {"factor": "trade_history", "weight": 0.25, "score": 0.6}
]
```

#### Table: `data_import_log`

Tracks all data imports for pipeline management.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `file_name` | VARCHAR(500) | File name |
| `file_path` | TEXT | Full path |
| `file_hash` | VARCHAR(64) | SHA256 hash |
| `file_size_bytes` | BIGINT | File size |
| `import_type` | VARCHAR(50) | companies, trade_records, products |
| `source_type` | data_source_type | Source type enum |
| `sheet_name` | VARCHAR(100) | Excel sheet name |
| `status` | VARCHAR(20) | pending, processing, completed, failed |
| `total_rows` | INTEGER | Total rows in file |
| `rows_imported` | INTEGER | Successfully imported |
| `rows_skipped` | INTEGER | Skipped (duplicates) |
| `rows_failed` | INTEGER | Failed rows |
| `errors` | JSONB | Array of error messages |
| `started_at` | TIMESTAMPTZ | Processing start |
| `completed_at` | TIMESTAMPTZ | Processing end |
| `created_at` | TIMESTAMPTZ | Record created |

### Using JSONB Extra Fields

The `extra` JSONB column allows storing row-specific data that doesn't fit the normalized schema:

```sql
-- Insert with extra data
INSERT INTO companies (name, country, extra)
VALUES ('Acme Corp', 'USA', '{"legacy_id": "OLD-12345", "source_db": "crm_2020"}');

-- Query extra fields
SELECT * FROM companies WHERE extra->>'legacy_id' = 'OLD-12345';

-- Add new field to existing row
UPDATE companies SET extra = extra || '{"verified_by": "admin"}'::jsonb WHERE id = '...';

-- Filter by extra field existence
SELECT * FROM trade_records WHERE extra ? 'special_handling';
```

### Indexes

```sql
-- Companies (includes fuzzy text search with pg_trgm)
CREATE INDEX idx_companies_name ON companies USING gin (name gin_trgm_ops);
CREATE INDEX idx_companies_name_normalized ON companies (name_normalized);
CREATE INDEX idx_companies_country ON companies (country);
CREATE INDEX idx_companies_iec ON companies (iec_code) WHERE iec_code IS NOT NULL;
CREATE INDEX idx_companies_entity_types ON companies USING gin (entity_types);
CREATE INDEX idx_companies_hs_codes ON companies USING gin (hs_codes_dealt);
CREATE INDEX idx_companies_location ON companies USING gist (location);
CREATE INDEX idx_companies_name_embedding ON companies USING hnsw (name_embedding vector_cosine_ops);
CREATE INDEX idx_companies_profile_embedding ON companies USING hnsw (profile_embedding vector_cosine_ops);

-- Trade Records
CREATE INDEX idx_trade_records_type ON trade_records (record_type);
CREATE INDEX idx_trade_records_sb_date ON trade_records (sb_date);
CREATE INDEX idx_trade_records_hs_code ON trade_records (hs_code);
CREATE INDEX idx_trade_records_hs_chapter ON trade_records (hs_chapter);
CREATE INDEX idx_trade_records_exporter_name ON trade_records USING gin (exporter_name gin_trgm_ops);
CREATE INDEX idx_trade_records_importer_name ON trade_records USING gin (importer_name gin_trgm_ops);
CREATE INDEX idx_trade_records_origin_country ON trade_records (origin_country);
CREATE INDEX idx_trade_records_destination_country ON trade_records (destination_country);
CREATE INDEX idx_trade_records_trade_year ON trade_records (trade_year);
CREATE INDEX idx_trade_records_product_embedding ON trade_records USING hnsw (product_embedding vector_cosine_ops);

-- Trade Links
CREATE INDEX idx_trade_links_source ON trade_links (source_company_id);
CREATE INDEX idx_trade_links_target ON trade_links (target_company_id);
CREATE INDEX idx_trade_links_type ON trade_links (link_type);
CREATE INDEX idx_trade_links_active ON trade_links (is_active);

-- Predicted Partners
CREATE INDEX idx_predicted_partners_company ON predicted_partners (company_id);
CREATE INDEX idx_predicted_partners_score ON predicted_partners (probability_score DESC);
CREATE INDEX idx_predicted_partners_commodity ON predicted_partners (for_commodity);
```

---

## Vector Embeddings

### Model

**`sentence-transformers/all-MiniLM-L12-v2`**

| Property | Value |
|----------|-------|
| Dimensions | 384 |
| Max Sequence | 256 tokens |
| Speed | Fast (local inference) |
| Cost | Free |

### What Gets Embedded

| Table | Embedded Fields |
|-------|-----------------|
| `companies` | `name` + `business_details` + `products_keywords` |
| `trade_records` | `item_description` |

### Similarity Search Examples

```sql
-- Find similar companies
SELECT name, business_details,
       embedding <=> $query_embedding AS distance
FROM companies
ORDER BY distance
LIMIT 10;

-- Find similar products in trade records
SELECT item_description, exporter_name,
       embedding <=> $query_embedding AS distance
FROM trade_records
WHERE hsn_chapter = '09'  -- Coffee chapter
ORDER BY distance
LIMIT 20;
```

---

## Folder Structure

```
AI_NEW/
├── raw_data/                    # Raw Excel files (source data)
│   └── *.xlsx                   # Trade records, company data, etc.
│
├── pipeline/                    # Data processing pipeline
│   ├── csv/                     # Stage 1: Converted CSVs
│   ├── normalized/              # Stage 2: Schema-ready CSVs
│   ├── errors/                  # Failed rows for review
│   ├── scripts/
│   │   ├── cli.py               # Main CLI entry point
│   │   ├── convert.py           # Excel → CSV
│   │   ├── normalize.py         # CSV → Normalized
│   │   ├── insert.py            # Insert to PostgreSQL
│   │   ├── build_links.py       # Build trade_links table
│   │   ├── embed.py             # Generate vector embeddings
│   │   └── compute_predictions.py  # Batch link prediction job
│   ├── mappings/                # Data type mappings
│   │   ├── __init__.py          # Type registry
│   │   ├── trade_export.py
│   │   ├── trade_import.py
│   │   ├── company_indian.py
│   │   └── company_international.py
│   └── manifest.json            # Pipeline state tracking
│
├── server/                      # Single AI Server (FastAPI)
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Environment & settings
│   ├── dependencies.py          # Shared dependencies (DB, auth)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── links.py             # /v1/links/* endpoints
│   │   ├── trades.py            # /v1/trades/* endpoints
│   │   └── analysis.py          # /v1/analysis/* endpoints
│   ├── services/                # Business logic layer
│   │   ├── link_predictor.py    # Multi-source prediction logic
│   │   ├── trade_scorer.py      # Gravity score calculation
│   │   ├── market_analyzer.py   # LLM analysis generation
│   │   └── embedding_service.py # Vector embedding utilities
│   ├── models/                  # Pydantic request/response models
│   │   ├── links.py
│   │   ├── trades.py
│   │   └── analysis.py
│   └── db/                      # Database clients
│       ├── postgres.py          # PostgreSQL + pgvector + PostGIS
│       └── redis.py             # Redis cache
│
├── shared/                      # Shared code across services
│   ├── db/
│   │   ├── schema.sql           # Full PostgreSQL schema
│   │   ├── field_mappings.py    # Raw data → schema field mappings
│   │   └── migrations/          # Versioned migrations
│   └── schemas/                 # Pydantic/shared schemas
│
│
├── docker-compose.yml           # PostgreSQL, Redis, AI Server
├── Dockerfile                   # AI Server container
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment template
└── README.md                    # This file
```

---

## Manifest Structure

The `pipeline/manifest.json` tracks all data processing state:

```json
{
  "version": "1.0",
  "files": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "original": "EXP31DEC24.xlsx",
      "csv": "EXP31DEC24.csv",
      "normalized": "trade_records_EXP31DEC24.csv",
      "type": "trade_record",
      "status": "embedded",
      "stats": {
        "rows_raw": 574,
        "rows_normalized": 570,
        "rows_inserted": 568,
        "rows_embedded": 568,
        "duplicates_skipped": 2,
        "errors": 4
      },
      "error_file": "errors/EXP31DEC24_errors.csv",
      "processed_at": "2025-12-15T10:30:00Z",
      "processed_by": "dev_name",
      "checksum": "sha256:abc123..."
    }
  ],
  "summary": {
    "total_files": 35,
    "total_trade_records": 50000,
    "total_companies": 130620,
    "total_embedded": 180620,
    "files_by_status": {
      "raw": 5,
      "csv": 3,
      "normalized": 2,
      "in_db": 10,
      "embedded": 15
    },
    "last_updated": "2025-12-15T10:30:00Z"
  }
}
```

---

## Raw Data Analysis

The following data has been analyzed from the `raw_data/` folder to design the schema:

### Current Data Files (32 files)

| Category | Files | Rows (approx) | Key Columns |
|----------|-------|---------------|-------------|
| **Export Records** | 17 files | ~15,000+ | SBDATE, EXPORTER, CONSIGNEE, HS_CODE, QUANTITY, UNIT_PRICE, FOB, PORT, COUNTRY |
| **Import Records** | 5 files | ~25,000+ | REG_DATE, IMPORTER, SUPPLIER, HS_CODE, ProductDescription, QUANTITY, DUTY |
| **Company Directories** | 2 files | ~130,000+ | Company Name, Address, Country, Contact, Email, Website, Business Details |
| **Product Catalogs** | 2 files | ~40 | Product Detail, Category, Consumer Type, Price, Manufacturer |
| **Multi-Country Trade** | 1 file | 89 sheets | Country-specific export/import data |

### Data Structures Discovered

**Export/Import Records (21-33 columns):**
```
SBDATE, EXPORTERNAME, EXPORTERADDRESS, Pin_Code, City, State, CONTACTNO, EMAILID,
CONSINEENAME, CONSINEEADDRESS, FOREIGNPORT, FOREIGNCOUNTRY, HS_CODE, CHAPTER,
PRODUCTDESCRIPITION, QUANTITY, UNITQUANTITY, ITEM_RATE_IN_FC, CURRENCY,
Total_Value_IN_FC, Total_Value_IN_USD, FOB, DRAWBACK, MODE, INDIAN_PORT
```

**Company Directory (8-11 columns):**
```
Company Name, Add., Country, Contact No., Email Ids., Website, Details
S. No., COMPANY NAME, ADD., CITY, Pin Code, STATE, PHONE, MOBILE, EMAIL, WEBSITE, BUSINESS DETAILS
```

**Product Catalog (7-8 columns):**
```
Product Detail, Product Category, Consumer Type, Exporter Name, Price, City
Product Detail, Price (₹/Kg), Weight/Packaging, Product Category, Wholesaler/Manufacturer
```

### Column Mapping Strategy

The schema handles diverse column naming via `shared/db/field_mappings.py`:

| Target Field | Source Columns (any of these) |
|--------------|-------------------------------|
| `exporter_name` | EXPORTERNAME, Exporter_Name, EXPORTER, Exporter Name |
| `hs_code` | HS_CODE, HS_Code, RITC_Code, RITS code, HS CODE |
| `quantity` | QUANTITY, Quantity, QTY COMMERCIAL |
| `country` | Country, COUNTRY, FOREIGNCOUNTRY, ORIGIN_COUNTRY |
| `contact_info.email` | EMAIL, E_MAIL_ID, Email Ids., EMAILID |

Unmapped columns automatically go into the `extra` JSONB field.

---

## Raw Data Types

The pipeline is designed to handle **any commodity trading data** that comes in. New data types can be added by creating a normalization mapping in `pipeline/scripts/normalize.py`.

### Data Type Registry

| Type ID | Category | Target Table | Description |
|---------|----------|--------------|-------------|
| `trade_export` | Trade Records | `trade_records` | Export transaction records |
| `trade_import` | Trade Records | `trade_records` | Import transaction records |
| `company_indian` | Companies | `companies` | Indian importers/exporters |
| `company_international` | Companies | `companies` | International buyers/sellers |
| `commodity_prices` | Market Data | `commodity_prices` | Historical price data |
| `port_data` | Infrastructure | `ports` | Port information & volumes |
| `shipping_routes` | Logistics | `shipping_routes` | Route & transit times |
| `hsn_codes` | Reference | `hsn_codes` | HSN/HS code master data |
| `country_trade_stats` | Analytics | `country_stats` | Country-level trade statistics |
| `futures_data` | Market Data | `futures` | Commodity futures & OI |
| `weather_data` | External | `weather` | Weather affecting commodities |
| `currency_rates` | External | `currency_rates` | FX rates for trade valuation |
| *custom* | *varies* | *varies* | Add new types as needed |

### Adding New Data Types

1. **Create column mapping** in `pipeline/scripts/mappings/`

```python
# pipeline/scripts/mappings/commodity_prices.py
MAPPING = {
    "type_id": "commodity_prices",
    "target_table": "commodity_prices",
    "file_patterns": ["*price*.xlsx", "*rates*.xlsx"],
    "columns": {
        "Date": {"target": "price_date", "type": "date", "required": True},
        "Commodity": {"target": "commodity_name", "type": "string", "required": True},
        "HSN": {"target": "hsn_code", "type": "string", "required": False},
        "Price": {"target": "price", "type": "decimal", "required": True},
        "Currency": {"target": "currency", "type": "string", "default": "USD"},
        "Unit": {"target": "unit", "type": "string", "required": True},
        "Source": {"target": "source", "type": "string", "required": False},
    },
    "dedup_keys": ["price_date", "commodity_name", "currency"],
    "embed_fields": ["commodity_name"],  # Fields to generate embeddings for
}
```

2. **Register in type registry**

```python
# pipeline/scripts/mappings/__init__.py
from .trade_export import MAPPING as trade_export
from .commodity_prices import MAPPING as commodity_prices
# ... add new imports

TYPE_REGISTRY = {
    "trade_export": trade_export,
    "commodity_prices": commodity_prices,
    # ... add new types
}
```

3. **Create DB migration** (if new table needed)

```sql
-- db/migrations/003_add_commodity_prices.sql
CREATE TABLE commodity_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_date DATE NOT NULL,
    commodity_name VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(20),
    price DECIMAL(15,4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    unit VARCHAR(50) NOT NULL,
    source VARCHAR(255),
    embedding vector(384),
    source_file VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
```

4. **Run pipeline**

```bash
python -m pipeline.scripts.cli normalize prices.xlsx --type=commodity_prices
python -m pipeline.scripts.cli insert commodity_prices_prices.csv
```

### Auto-Detection

The normalizer attempts to auto-detect file type based on:

1. **Filename patterns** - e.g., `EXP*.xlsx` → `trade_export`
2. **Column headers** - Matches known column sets
3. **Manual override** - `--type=<type_id>` flag

```bash
# Auto-detect
python -m pipeline.scripts.cli normalize data.xlsx

# Force specific type
python -m pipeline.scripts.cli normalize data.xlsx --type=commodity_prices

# List available types
python -m pipeline.scripts.cli types
```

### Current Sample Mappings

These are examples of data currently in `raw_data/`. The system can handle many more types.

**Trade Records:**
```
Columns: Month, DATE, IEC, EXPORTER, EXPORTER ADD, EXPORTER CITY,
         EXPORTER PIN, CONSIGNEE, CONSIGNEE ADD, Forign Port,
         foreign Country, RITCCODE, ITME, QUANTITY, UNIT,
         UNIT PRICE FC, CURR, FOB INR, PORT, CHAPTER
```

**Company Data:**
```
Columns: Company Name, Address, City, Country, Phone, Email,
         Website, Business Details, Products/Services
```

### Extensibility Principles

1. **Schema-first**: Define target schema, then map source columns
2. **Loose coupling**: Each data type is independent
3. **Graceful handling**: Unknown columns are logged but don't fail
4. **Versioned mappings**: Mappings can evolve without breaking old data
5. **Embed anything**: Any text field can be embedded for similarity search

---

## Setup

### Prerequisites

- Python 3.10+
- Docker & Docker Compose
- (Or manual: PostgreSQL 14+ with pgvector & PostGIS, Redis 7+)

### Quick Start (Docker Compose)

```bash
cd AI_NEW

# Copy environment template
cp .env.example .env
# Edit .env with your API keys

# Start everything (PostgreSQL, Redis, AI Server)
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f ai-server
```

### Manual Installation

```bash
cd AI_NEW

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up PostgreSQL with extensions
createdb breyus_ai
psql breyus_ai -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql breyus_ai -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql breyus_ai -f shared/db/schema.sql

# Apply migrations when upgrading an existing DB
psql breyus_ai -f shared/db/migrations/001_add_ai_cache_tables.sql

# Configure environment
cp .env.example .env
# Edit .env with credentials

# Run AI Server
uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload
```

### Environment Variables

```env
# AI Server
AI_SERVER_PORT=8000
AI_API_KEY=your-secret-api-key  # For main backend auth

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=breyus_ai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379

# LLM (Anthropic)
ANTHROPIC_API_KEY=your_api_key
LLM_MODEL=claude-3-sonnet-20240229
AI_PROVIDER=gemini

# LLM (Gemini - default)
GEMINI_API_KEY=your_gemini_key_1,your_gemini_key_2
GEMINI_MODEL=gemini-1.5-pro

# Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L12-v2
EMBEDDING_BATCH_SIZE=100

# Pipeline
PIPELINE_DEV_NAME=your_name
```

### Docker Compose Services

```yaml
# docker-compose.yml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: breyus_ai
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./shared/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  ai-server:
    build: .
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
    environment:
      - POSTGRES_HOST=postgres
      - REDIS_URL=redis://redis:6379

volumes:
  postgres_data:
```

### Verify Setup

```bash
# Health check
curl http://localhost:8000/health

# Test endpoint (with API key)
curl -X POST http://localhost:8000/v1/trades/score \
  -H "X-API-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"buyer_id":"11111111-1111-1111-1111-111111111111","seller_id":"22222222-2222-2222-2222-222222222222","commodity":"Coffee Beans"}'
```

---

## Admin Portal Integration (Future)

### API Endpoints

```
GET  /api/admin/pipeline/status      # Manifest summary
GET  /api/admin/pipeline/files       # List all files
POST /api/admin/pipeline/convert     # Trigger conversion
POST /api/admin/pipeline/run-all     # Run full pipeline
GET  /api/admin/pipeline/errors      # Get error files
POST /api/admin/pipeline/retry       # Retry failed rows
```

---

## Changelog

### v1.0.0 (Planned)
- Link prediction with multi-source scoring
- Gravity score calculation
- Async market analysis with LLM
- Data pipeline with manifest tracking
- PostgreSQL + pgvector + PostGIS integration
- Flexible JSONB schema for diverse data sources
- Automated field mapping from raw data


