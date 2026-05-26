---
type: prd
module: ai
tags: [ai, prd, government-data]
---

# PRD: Government Data Extraction & Niche Commodity Candidate Generation

> **Document Type:** Product Requirements Document (PRD)
> **Version:** 2.0
> **Last Updated:** February 2026
> **Status:** Implementation Ready

---

## Table of Contents

1. [Background & Purpose](#1-background--purpose)
2. [Scope Definition](#2-scope-definition)
3. [Core Design Philosophy](#3-core-design-philosophy)
4. [Data Sources & Update Cadence](#4-data-sources--update-cadence)
5. [Detailed Scraper Specifications](#5-detailed-scraper-specifications)
6. [Run-Based Processing Model](#6-run-based-processing-model)
7. [Raw Data Ingestion Layer](#7-raw-data-ingestion-layer)
8. [Parsing & Normalization Layer](#8-parsing--normalization-layer)
9. [Niche Scoring Algorithm Details](#9-niche-scoring-algorithm-details)
10. [LLM Integration Specification](#10-llm-integration-specification)
11. [Admin Portal UI Specifications](#11-admin-portal-ui-specifications)
12. [Database Schema (Conceptual)](#12-database-schema-conceptual)
13. [API Endpoints (High-Level)](#13-api-endpoints-high-level)
14. [Approved Niche Commodity Registry](#14-approved-niche-commodity-registry)
15. [Auditability & Observability](#15-auditability--observability)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Phase 1 Success Criteria](#17-phase-1-success-criteria)

---

## 1. Background & Purpose

The Government Data Extraction module is the foundational intelligence layer of the Breyus Niche Commodity system. Its responsibility is to ingest official, public government trade data and convert it into a structured, auditable, and explainable pipeline for identifying potential niche commodities.

This module exists to answer one core question reliably:

**"What commodities are actually being traded, at what scale, and which of them are small, volatile, or emerging enough to qualify as niche opportunities?"**

All downstream systems (buyer discovery, seller discovery, market intelligence, predictions) depend on the outputs of this module. If this layer is incorrect, downstream intelligence becomes unreliable.

### 1.1 Key Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| **Admins** | Review candidates, approve/reject niches, monitor system health |
| **System** | Reliable data for downstream processing |
| **End Users** | (Indirect) Accurate niche commodity identification |

---

## 2. Scope Definition

### 2.1 In Scope

This PRD defines the system responsible for:
- Government data ingestion from official sources
- Data parsing and normalization
- Niche candidate generation via algorithmic scoring
- LLM-powered validation and enrichment (admin-only)
- Admin approval workflow

### 2.2 Out of Scope

This PRD explicitly excludes:
- Buyer/seller contact discovery (covered in Stage 2/3)
- User-facing market intelligence predictions (covered in Stage 4)
- Pricing information display to users
- End-user dashboards
- Outreach and acquisition automation

---

## 3. Core Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Government data is ground truth** | All niche candidates originate from official trade data |
| **Algorithms determine eligibility** | 3-rule scoring system gates candidate generation |
| **Humans determine activation** | Admins approve/reject; no auto-activation |
| **LLMs explain, not decide** | LLM outputs are advisory metadata only |
| **Every transformation is auditable** | Full lineage from source to decision |
| **Data is append-only by default** | No deletion of raw data or audit logs |

---

## 4. Data Sources & Update Cadence

### 4.1 Primary Government Sources

| Source | URL | Data Type | Format | Update Frequency | Priority |
|--------|-----|-----------|--------|------------------|----------|
| **APEDA** | apeda.gov.in | Agricultural exports | CSV, Excel, PDF | Monthly | P0 (Critical) |
| **DGFT** | dgft.gov.in | HS codes, trade data | HTML tables, PDF | Monthly | P0 (Critical) |
| **Spice Board** | indianspices.com | Spice production/exports | PDF reports | Monthly | P1 (High) |
| **Tea Board** | teaboard.gov.in | Tea trade data | Excel, PDF | Quarterly | P2 (Medium) |
| **Coffee Board** | indiacoffee.org | Coffee exports | PDF reports | Quarterly | P2 (Medium) |
| **Rubber Board** | rubberboard.org.in | Rubber trade | Excel | Quarterly | P3 (Low) |

### 4.2 Supplementary Sources

| Source | Data Type | Purpose | Frequency |
|--------|-----------|---------|-----------|
| **Reddit** | Community discussions | Emerging signals detection | Daily |
| **Google News RSS** | Industry news | Sentiment & trend signals | Daily |
| **TradeKey/IndiaMART** | New listings | Market activity signals | Daily |

### 4.3 Data Freshness Requirements

| Data Type | Maximum Age | Alert Threshold |
|-----------|-------------|-----------------|
| Government exports | 30 days | 45 days |
| Price data | 7 days | 14 days |
| Supplementary signals | 24 hours | 48 hours |

---

## 5. Detailed Scraper Specifications

### 5.1 APEDA Scraper

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          APEDA SCRAPER SPECIFICATION                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TARGET: apeda.gov.in                                                      │
│  TYPE: Government agricultural export database                              │
│  METHOD: Direct download + HTML scraping                                   │
│                                                                             │
│  DATA ENDPOINTS                                                            │
│  ──────────────                                                            │
│                                                                             │
│  1. Export Statistics Portal                                               │
│     URL: apeda.gov.in/apedawebsite/SubHead_Products/                      │
│     Format: HTML tables with downloadable Excel/CSV                        │
│                                                                             │
│  2. Product-wise Export Data                                               │
│     URL: apeda.gov.in/agriexchange/                                        │
│     Format: Excel files (.xls, .xlsx)                                      │
│                                                                             │
│  3. Monthly Export Reports                                                 │
│     URL: apeda.gov.in/apedawebsite/data_report/                           │
│     Format: PDF reports                                                    │
│                                                                             │
│  EXTRACTION LOGIC                                                          │
│  ────────────────                                                          │
│                                                                             │
│  Step 1: Navigate to data portal                                           │
│  Step 2: Identify available report files (check for new uploads)           │
│  Step 3: Download all new files since last run                             │
│  Step 4: Parse files based on format:                                      │
│          - Excel: pandas read_excel()                                      │
│          - CSV: pandas read_csv()                                          │
│          - PDF: pdfplumber / tabula-py                                     │
│                                                                             │
│  FIELDS TO EXTRACT                                                         │
│  ─────────────────                                                         │
│                                                                             │
│  ┌─────────────────────┬────────────────────────────────────────────────┐  │
│  │ Field               │ Description                                    │  │
│  ├─────────────────────┼────────────────────────────────────────────────┤  │
│  │ commodity_name      │ Product name (e.g., "Moringa Leaves")         │  │
│  │ hs_code             │ 8-digit HS code (e.g., "12119090")            │  │
│  │ export_volume_mt    │ Export quantity in metric tons                │  │
│  │ export_value_usd    │ Export value in USD millions                  │  │
│  │ export_value_inr    │ Export value in INR crores                    │  │
│  │ time_period         │ Month/Year of data (e.g., "2025-12")          │  │
│  │ destination_countries│ Top importing countries                      │  │
│  │ yoy_change_percent  │ Year-over-year change                         │  │
│  └─────────────────────┴────────────────────────────────────────────────┘  │
│                                                                             │
│  ERROR HANDLING                                                            │
│  ──────────────                                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Error Type           │ Handling Strategy                            │   │
│  ├──────────────────────┼─────────────────────────────────────────────┤   │
│  │ Connection timeout   │ Retry 3x with exponential backoff           │   │
│  │ 404 Not Found        │ Log warning, continue with other endpoints  │   │
│  │ File format change   │ Alert admin, mark run as partial failure    │   │
│  │ Parse error          │ Log row-level error, continue processing    │   │
│  │ Data validation fail │ Quarantine record, flag for review          │   │
│  └──────────────────────┴─────────────────────────────────────────────┘   │
│                                                                             │
│  RATE LIMITING                                                             │
│  ─────────────                                                             │
│  • 1 request per 5 seconds                                                 │
│  • Maximum 100 requests per run                                            │
│  • Respect robots.txt directives                                           │
│                                                                             │
│  CODE STRUCTURE                                                            │
│  ──────────────                                                            │
│                                                                             │
│  class APEDAScraper(BaseScraper):                                          │
│      source_name = "APEDA"                                                 │
│      source_url = "https://apeda.gov.in"                                   │
│      data_format = ["excel", "csv", "pdf"]                                 │
│      update_frequency = "monthly"                                          │
│                                                                             │
│      def fetch_raw(self) -> List[RawFile]:                                 │
│          # 1. Scrape available files                                       │
│          # 2. Filter to new files only                                     │
│          # 3. Download each file                                           │
│          # 4. Return list of raw files                                     │
│                                                                             │
│      def parse(self, raw_file: RawFile) -> List[ParsedRecord]:            │
│          # Route to appropriate parser based on file type                  │
│          # Return normalized records                                       │
│                                                                             │
│      def validate(self, record: ParsedRecord) -> ValidationResult:        │
│          # Check required fields present                                   │
│          # Validate HS code format                                         │
│          # Validate numeric ranges                                         │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 DGFT Scraper

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          DGFT SCRAPER SPECIFICATION                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TARGET: dgft.gov.in                                                       │
│  TYPE: Directorate General of Foreign Trade                                 │
│  METHOD: HTML scraping + PDF extraction                                    │
│                                                                             │
│  DATA ENDPOINTS                                                            │
│  ──────────────                                                            │
│                                                                             │
│  1. HS Code Database                                                       │
│     URL: dgft.gov.in/CP/...  (multiple paths)                             │
│     Format: HTML tables                                                    │
│                                                                             │
│  2. Export Import Data Bank                                                │
│     URL: commerce-app.gov.in/eidb/                                        │
│     Format: Dynamic tables (requires Selenium)                             │
│                                                                             │
│  3. Foreign Trade Policy Notices                                           │
│     URL: dgft.gov.in/CP/?opt=public-notice                                │
│     Format: PDF documents                                                  │
│                                                                             │
│  FIELDS TO EXTRACT                                                         │
│  ─────────────────                                                         │
│                                                                             │
│  ┌─────────────────────┬────────────────────────────────────────────────┐  │
│  │ Field               │ Description                                    │  │
│  ├─────────────────────┼────────────────────────────────────────────────┤  │
│  │ hs_code             │ 8-digit HS code                                │  │
│  │ hs_description      │ Official commodity description                 │  │
│  │ chapter             │ HS chapter (2-digit)                           │  │
│  │ heading             │ HS heading (4-digit)                           │  │
│  │ subheading          │ HS subheading (6-digit)                        │  │
│  │ export_duty         │ Applicable export duty (if any)               │  │
│  │ import_duty         │ Applicable import duty                        │  │
│  │ export_policy       │ Free/Restricted/Prohibited                    │  │
│  │ import_policy       │ Free/Restricted/Prohibited                    │  │
│  │ last_updated        │ Policy update date                            │  │
│  └─────────────────────┴────────────────────────────────────────────────┘  │
│                                                                             │
│  SPECIAL CONSIDERATIONS                                                    │
│  ──────────────────────                                                    │
│                                                                             │
│  • Site uses dynamic JavaScript rendering                                  │
│  • Requires Selenium WebDriver for some sections                           │
│  • Session management needed for data bank access                          │
│  • CAPTCHA may be present (manual intervention flag)                       │
│                                                                             │
│  ERROR HANDLING                                                            │
│  ──────────────                                                            │
│                                                                             │
│  • CAPTCHA detected → Pause run, notify admin                              │
│  • Session expired → Re-authenticate, resume                               │
│  • Rate limited → Exponential backoff (max 30 min)                         │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Spice Board Scraper

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      SPICE BOARD SCRAPER SPECIFICATION                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TARGET: indianspices.com                                                  │
│  TYPE: Indian Spices Board (under Ministry of Commerce)                    │
│  METHOD: PDF download + HTML scraping                                      │
│                                                                             │
│  DATA ENDPOINTS                                                            │
│  ──────────────                                                            │
│                                                                             │
│  1. Export Statistics                                                      │
│     URL: indianspices.com/statistics/export-statistics                    │
│     Format: PDF reports (monthly)                                          │
│                                                                             │
│  2. Production Statistics                                                  │
│     URL: indianspices.com/statistics/production-statistics                │
│     Format: HTML tables                                                    │
│                                                                             │
│  3. Price Trends                                                           │
│     URL: indianspices.com/statistics/price-statistics                     │
│     Format: HTML tables with historical data                               │
│                                                                             │
│  SPICES COVERED                                                            │
│  ──────────────                                                            │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ • Pepper (black, white)    • Cardamom (small, large)                  │ │
│  │ • Chilli                   • Ginger                                   │ │
│  │ • Turmeric                 • Coriander                                │ │
│  │ • Cumin                    • Celery                                   │ │
│  │ • Fennel                   • Fenugreek                                │ │
│  │ • Nutmeg & Mace            • Garlic                                   │ │
│  │ • Tamarind                 • Vanilla                                  │ │
│  │ • Curry Powder             • Spice Oils & Oleoresins                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  FIELDS TO EXTRACT                                                         │
│  ─────────────────                                                         │
│                                                                             │
│  • spice_name (standardized)                                               │
│  • variety (if applicable)                                                 │
│  • export_volume_mt                                                        │
│  • export_value_usd                                                        │
│  • production_mt (if available)                                            │
│  • price_inr_per_kg (spot price)                                          │
│  • price_date                                                              │
│  • major_destinations                                                      │
│                                                                             │
│  PDF PARSING STRATEGY                                                      │
│  ────────────────────                                                      │
│                                                                             │
│  Spice Board PDFs follow consistent format:                                │
│  • Table headers on row 1-2                                                │
│  • Data rows with: Item | Qty | Value | Country breakdown                 │
│  • Use pdfplumber with table extraction                                    │
│  • Post-process to handle merged cells                                     │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Reddit Scraper (Supplementary)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        REDDIT SCRAPER SPECIFICATION                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TARGET: reddit.com via API                                                │
│  TYPE: Community signal detection                                          │
│  METHOD: Reddit API (OAuth)                                                │
│  COST: $0.24 per 1000 API calls                                           │
│                                                                             │
│  SUBREDDITS TO MONITOR                                                     │
│  ─────────────────────                                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Subreddit          │ Focus Area                                     │   │
│  ├─────────────────────┼───────────────────────────────────────────────┤   │
│  │ r/commodities      │ General commodity trading discussion          │   │
│  │ r/agriculture      │ Farming, crop production                      │   │
│  │ r/pharma           │ Pharmaceutical ingredients                    │   │
│  │ r/supplychain      │ Supply chain discussions                      │   │
│  │ r/supplements      │ Supplement ingredients (moringa, spirulina)   │   │
│  │ r/spices           │ Spice trading and sourcing                    │   │
│  │ r/IndianAgriculture│ India-specific agriculture                    │   │
│  └─────────────────────┴───────────────────────────────────────────────┘   │
│                                                                             │
│  SEARCH KEYWORDS                                                           │
│  ───────────────                                                           │
│                                                                             │
│  Discovery keywords:                                                       │
│  • "emerging commodity"      • "supply shortage"                           │
│  • "new material"            • "price surge"                               │
│  • "niche ingredient"        • "hard to source"                            │
│  • "alternative supplier"    • "import difficulty"                         │
│                                                                             │
│  EXTRACTION LOGIC                                                          │
│  ────────────────                                                          │
│                                                                             │
│  1. Search each subreddit with keywords                                    │
│  2. Filter posts from last 30 days                                         │
│  3. Extract: title, body, score, comments_count, created_utc              │
│  4. Run NLP to identify commodity mentions                                 │
│  5. Score signal strength: engagement + recency + specificity              │
│                                                                             │
│  SIGNAL SCORING                                                            │
│  ──────────────                                                            │
│                                                                             │
│  signal_score = (upvotes * 0.3) + (comments * 0.4) + (recency * 0.3)      │
│  Where recency = max(0, 1 - (days_old / 30))                              │
│                                                                             │
│  OUTPUT                                                                    │
│  ──────                                                                    │
│                                                                             │
│  {                                                                         │
│    "commodity_mention": "moringa",                                         │
│    "signal_type": "emerging_demand",                                       │
│    "source_url": "reddit.com/r/supplements/...",                          │
│    "signal_score": 78,                                                     │
│    "extracted_text": "Anyone else seeing moringa prices spike...",        │
│    "detected_at": "2026-02-03T10:00:00Z"                                  │
│  }                                                                         │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 News/RSS Scraper (Supplementary)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         NEWS SCRAPER SPECIFICATION                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  METHOD: RSS feed parsing + content extraction                              │
│  COST: Free (public RSS feeds)                                             │
│                                                                             │
│  RSS FEEDS                                                                 │
│  ─────────                                                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Feed                         │ URL                                  │   │
│  ├──────────────────────────────┼──────────────────────────────────────┤   │
│  │ Google News (commodities)    │ news.google.com/rss/...             │   │
│  │ FoodNavigator                │ foodnavigator.com/rss               │   │
│  │ Nutraceuticals World         │ nutraceuticalsworld.com/rss         │   │
│  │ Economic Times Commodities   │ economictimes.com/markets/commodities│  │
│  │ Reuters Commodities          │ reuters.com/commodities (limited)    │   │
│  └──────────────────────────────┴──────────────────────────────────────┘   │
│                                                                             │
│  SEARCH QUERIES (Google News)                                              │
│  ────────────────────────────                                              │
│                                                                             │
│  • "commodity shortage India"                                              │
│  • "agricultural exports India"                                            │
│  • "spice prices surge"                                                    │
│  • "pharmaceutical ingredient supply"                                      │
│  • "new superfood ingredient"                                              │
│                                                                             │
│  EXTRACTION                                                                │
│  ──────────                                                                │
│                                                                             │
│  For each article:                                                         │
│  1. Parse RSS entry (title, link, pubDate, description)                   │
│  2. Fetch full article content                                            │
│  3. Extract commodity mentions via NLP                                     │
│  4. Calculate sentiment score                                              │
│  5. Identify key claims (price change, shortage, etc.)                    │
│                                                                             │
│  OUTPUT                                                                    │
│  ──────                                                                    │
│                                                                             │
│  {                                                                         │
│    "commodity_mention": "cardamom",                                        │
│    "headline": "Cardamom prices hit 3-year high...",                      │
│    "source": "Economic Times",                                             │
│    "sentiment": "bullish",                                                 │
│    "sentiment_score": 0.78,                                                │
│    "key_claim": "price_increase",                                          │
│    "published_at": "2026-02-02T14:30:00Z"                                 │
│  }                                                                         │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Run-Based Processing Model

### 6.1 Run Entity Definition

A **Run** represents a single execution of the commodity discovery pipeline.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            RUN ENTITY                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CORE ATTRIBUTES                                                           │
│  ───────────────                                                           │
│                                                                             │
│  ┌─────────────────────┬───────────────────────────────────────────────┐   │
│  │ Attribute           │ Description                                   │   │
│  ├─────────────────────┼───────────────────────────────────────────────┤   │
│  │ run_id              │ Unique identifier (UUID)                      │   │
│  │ run_number          │ Sequential number (Run #47)                   │   │
│  │ trigger_type        │ 'scheduled' | 'manual'                        │   │
│  │ triggered_by        │ 'system' or admin_id                          │   │
│  │ status              │ Current state (see state machine)             │   │
│  │ started_at          │ UTC timestamp                                 │   │
│  │ completed_at        │ UTC timestamp (null if running)               │   │
│  │ duration_seconds    │ Total execution time                          │   │
│  └─────────────────────┴───────────────────────────────────────────────┘   │
│                                                                             │
│  CONFIGURATION                                                             │
│  ─────────────                                                             │
│                                                                             │
│  ┌─────────────────────┬───────────────────────────────────────────────┐   │
│  │ Attribute           │ Description                                   │   │
│  ├─────────────────────┼───────────────────────────────────────────────┤   │
│  │ sources_config      │ List of sources to scrape                     │   │
│  │ llm_detail_level    │ 'minimal' | 'standard' | 'comprehensive'      │   │
│  │ score_thresholds    │ Override niche scoring thresholds             │   │
│  │ skip_llm_validation │ Boolean - run without LLM enrichment          │   │
│  │ priority            │ 'low' | 'normal' | 'high'                     │   │
│  └─────────────────────┴───────────────────────────────────────────────┘   │
│                                                                             │
│  RESULTS SUMMARY                                                           │
│  ───────────────                                                           │
│                                                                             │
│  ┌─────────────────────┬───────────────────────────────────────────────┐   │
│  │ Attribute           │ Description                                   │   │
│  ├─────────────────────┼───────────────────────────────────────────────┤   │
│  │ raw_files_count     │ Number of raw files downloaded                │   │
│  │ parsed_records_count│ Number of normalized records                  │   │
│  │ parse_errors_count  │ Number of parse failures                      │   │
│  │ candidates_count    │ Number of niche candidates generated          │   │
│  │ llm_cost_usd        │ Total LLM API cost for this run              │   │
│  │ error_summary       │ High-level error description (if any)         │   │
│  └─────────────────────┴───────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Run Status State Machine

> **IMPORTANT:** LLM analysis is NOT part of the run pipeline. LLM generation is a
> separate, per-candidate admin action (see Section 10). The run pipeline ends at SCORING.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         RUN STATUS STATE MACHINE                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ┌───────────┐                                 │
│                              │  PENDING  │                                 │
│                              │ (created) │                                 │
│                              └─────┬─────┘                                 │
│                                    │                                       │
│                          trigger (manual/cron)                             │
│                                    │                                       │
│                                    ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                         RUNNING STATES                              │   │
│  │                                                                     │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │   │
│  │   │   SCRAPING   │───▶│   PARSING    │───▶│   SCORING    │        │   │
│  │   │              │    │              │    │              │        │   │
│  │   │ Fetching raw │    │ Normalizing  │    │ Applying 3   │        │   │
│  │   │ data files   │    │ records      │    │ scoring rules│        │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘        │   │
│  │                                                                     │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                         │                                  │
│                   ┌─────────────────────┼───────────────────┐             │
│                   │                     │                   │             │
│                   ▼                     ▼                   ▼             │
│           ┌──────────────┐     ┌──────────────┐     ┌───────────┐        │
│           │  COMPLETED   │     │PARTIAL_FAILURE│     │  FAILED   │        │
│           │              │     │              │     │           │        │
│           │ All sources  │     │ Some sources │     │ Critical  │        │
│           │ successful   │     │ had errors   │     │ error     │        │
│           └──────────────┘     └──────────────┘     └───────────┘        │
│                                                                            │
│  TERMINAL STATES: COMPLETED, PARTIAL_FAILURE, FAILED                      │
│  Runs are immutable once in a terminal state                              │
│                                                                            │
│  NOTE: After COMPLETED/PARTIAL_FAILURE, candidates are available for      │
│  admin review. LLM analysis is triggered separately per-candidate.        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Run Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sources` | string[] | ["apeda", "dgft", "spice_board"] | Sources to scrape |
| `include_supplementary` | boolean | true | Include Reddit, News scrapers |
| `volume_threshold_mt` | number | 100000 | Override Rule 1 threshold |
| `volatility_threshold_pct` | number | 20 | Override Rule 2 threshold |
| `priority` | enum | "normal" | Job queue priority |

---

## 7. Raw Data Ingestion Layer

### 7.1 Raw File Storage

Raw files are stored immutably with full metadata.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        RAW DATA FILE ENTITY                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ATTRIBUTES                                                                │
│  ──────────                                                                │
│                                                                             │
│  ┌─────────────────────┬───────────────────────────────────────────────┐   │
│  │ Attribute           │ Description                                   │   │
│  ├─────────────────────┼───────────────────────────────────────────────┤   │
│  │ file_id             │ UUID                                          │   │
│  │ run_id              │ FK to discovery_runs                          │   │
│  │ source_name         │ 'apeda' | 'dgft' | etc.                       │   │
│  │ source_url          │ URL where file was downloaded                 │   │
│  │ file_name           │ Original filename                             │   │
│  │ file_type           │ 'csv' | 'excel' | 'pdf' | 'html'             │   │
│  │ file_size_bytes     │ Size of stored file                          │   │
│  │ file_path           │ Storage path (S3 or local)                    │   │
│  │ checksum_sha256     │ File integrity hash                           │   │
│  │ publish_date        │ Date data was published by source            │   │
│  │ fetched_at          │ Timestamp of download                        │   │
│  │ is_duplicate        │ Boolean - matches previous file checksum     │   │
│  └─────────────────────┴───────────────────────────────────────────────┘   │
│                                                                             │
│  CONSTRAINTS                                                               │
│  ───────────                                                               │
│                                                                             │
│  • Files are NEVER deleted (append-only)                                   │
│  • Duplicate files (same checksum) are marked but still stored            │
│  • Admins can view and download any raw file                              │
│  • Raw files cannot be modified after storage                             │
│                                                                             │
│  STORAGE STRATEGY                                                          │
│  ────────────────                                                          │
│                                                                             │
│  Path format: /niche/raw/{run_id}/{source_name}/{file_name}               │
│  Example: /niche/raw/abc123/apeda/exports_jan2026.xlsx                    │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Parsing & Normalization Layer

### 8.1 Parsed Record Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        PARSED RECORD ENTITY                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CORE ATTRIBUTES                                                           │
│  ───────────────                                                           │
│                                                                             │
│  ┌─────────────────────┬───────────────────────────────────────────────┐   │
│  │ Attribute           │ Description                                   │   │
│  ├─────────────────────┼───────────────────────────────────────────────┤   │
│  │ record_id           │ UUID                                          │   │
│  │ run_id              │ FK to discovery_runs                          │   │
│  │ raw_file_id         │ FK to raw_data_files                          │   │
│  │ source_name         │ Origin source                                 │   │
│  │ row_number          │ Original row in source file                   │   │
│  └─────────────────────┴───────────────────────────────────────────────┘   │
│                                                                             │
│  NORMALIZED COMMODITY DATA                                                 │
│  ─────────────────────────                                                 │
│                                                                             │
│  ┌─────────────────────┬───────────────────────────────────────────────┐   │
│  │ Attribute           │ Description                                   │   │
│  ├─────────────────────┼───────────────────────────────────────────────┤   │
│  │ commodity_name_raw  │ Original name from source                     │   │
│  │ commodity_name_norm │ Normalized/standardized name                  │   │
│  │ hs_code_raw         │ Original HS code                              │   │
│  │ hs_code_8digit      │ Normalized 8-digit HS code                    │   │
│  │ volume_value        │ Numeric volume                                │   │
│  │ volume_unit         │ 'MT' | 'KG' | 'L' (normalized)               │   │
│  │ value_amount        │ Numeric value                                 │   │
│  │ value_currency      │ 'USD' | 'INR'                                │   │
│  │ time_period_start   │ Start of data period                         │   │
│  │ time_period_end     │ End of data period                           │   │
│  │ destination_country │ Primary destination (if available)           │   │
│  │ yoy_change_pct      │ Year-over-year change                        │   │
│  └─────────────────────┴───────────────────────────────────────────────┘   │
│                                                                             │
│  QUALITY METADATA                                                          │
│  ────────────────                                                          │
│                                                                             │
│  ┌─────────────────────┬───────────────────────────────────────────────┐   │
│  │ Attribute           │ Description                                   │   │
│  ├─────────────────────┼───────────────────────────────────────────────┤   │
│  │ parse_status        │ 'success' | 'partial' | 'failed'             │   │
│  │ parse_warnings      │ Array of warning messages                     │   │
│  │ parse_errors        │ Array of error messages                       │   │
│  │ confidence_score    │ 0-100 parse quality confidence               │   │
│  │ requires_review     │ Boolean - flagged for manual check           │   │
│  │ parsed_at           │ Timestamp                                     │   │
│  └─────────────────────┴───────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Normalization Rules

| Field | Normalization Logic |
|-------|---------------------|
| **commodity_name** | Trim whitespace, title case, map synonyms |
| **hs_code** | Extract digits only, pad to 8 digits |
| **volume_unit** | Convert all to metric tons (MT) |
| **value_currency** | Convert INR to USD using monthly avg rate |
| **time_period** | Standardize to YYYY-MM format |

---

## 9. Niche Scoring Algorithm Details

### 9.1 Three-Rule Scoring Implementation

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     NICHE SCORING ALGORITHM                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RULE 1: VOLUME THRESHOLD (Weight: 40%)                                    │
│  ══════════════════════════════════════                                    │
│                                                                             │
│  Purpose: Identify small markets underserved by mainstream platforms        │
│                                                                             │
│  Implementation:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def calculate_volume_score(monthly_volumes: List[float])           │  │
│  │      -> Optional[int]:                                              │  │
│  │      """                                                            │  │
│  │      Volume Aggregation Rules:                                      │  │
│  │      - Uses rolling 12-month window from current date               │  │
│  │      - Requires minimum 3 months of data                            │  │
│  │      - Sums available months only (NO extrapolation)                │  │
│  │      - Returns None if < 3 months available                         │  │
│  │      """                                                            │  │
│  │      if len(monthly_volumes) < 3:                                   │  │
│  │          return None  # Insufficient data — weight redistributes   │  │
│  │                                                                      │  │
│  │      annual_volume_mt = sum(monthly_volumes)                        │  │
│  │                                                                      │  │
│  │      if annual_volume_mt < 10_000:                                  │  │
│  │          return 100  # Micro-niche                                  │  │
│  │      elif annual_volume_mt < 50_000:                                │  │
│  │          return 75   # Small niche                                  │  │
│  │      elif annual_volume_mt < 100_000:                               │  │
│  │          return 50   # Niche                                        │  │
│  │      else:                                                          │  │
│  │          return 0    # Mainstream (disqualified)                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Data Source: APEDA annual export statistics                               │
│  Aggregation: Sum of available months in rolling 12-month window           │
│  Minimum Data: 3 months required. Show admin "X MT over Y months".        │
│  NO extrapolation: Never multiply partial data to estimate annual total.  │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  RULE 2: PRICE VOLATILITY (Weight: 35%)                                    │
│  ══════════════════════════════════════                                    │
│                                                                             │
│  Purpose: High volatility = predictions matter more to traders             │
│                                                                             │
│  Price Data Sources (Priority Order):                                      │
│  1. Spice Board spot prices (for spices only — highest accuracy)          │
│  2. Derived unit price from APEDA: value_usd / volume_mt = $/MT           │
│     (available for ALL commodities that have both value and volume)        │
│  3. B2B marketplace price signals (future — IndiaMART, TradeKey)          │
│                                                                             │
│  NOTE: Derived unit price (source #2) captures real trade price movements │
│  even though it's not spot price. It reflects actual FOB export pricing.   │
│                                                                             │
│  Implementation:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def calculate_volatility_score(prices: List[float])                │  │
│  │      -> Optional[int]:                                              │  │
│  │      """                                                            │  │
│  │      Prices = monthly unit prices ($/MT) over rolling 12 months.   │  │
│  │      Returns None if < 3 data points — weight redistributes.       │  │
│  │      """                                                            │  │
│  │      if len(prices) < 3:                                            │  │
│  │          return None  # Insufficient data — weight redistributes   │  │
│  │                                                                      │  │
│  │      max_price = max(prices)                                        │  │
│  │      min_price = min(prices)                                        │  │
│  │      avg_price = sum(prices) / len(prices)                          │  │
│  │                                                                      │  │
│  │      if avg_price == 0:                                             │  │
│  │          return None  # Invalid data                                │  │
│  │                                                                      │  │
│  │      volatility_pct = ((max_price - min_price) / avg_price) * 100   │  │
│  │                                                                      │  │
│  │      if volatility_pct > 50:                                        │  │
│  │          return 100  # Highly volatile                              │  │
│  │      elif volatility_pct > 35:                                      │  │
│  │          return 75   # Volatile                                     │  │
│  │      elif volatility_pct > 20:                                      │  │
│  │          return 50   # Moderate volatility                          │  │
│  │      else:                                                          │  │
│  │          return 0    # Stable (no prediction value)                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Data Source: Spice Board spot prices OR derived unit price (value/volume) │
│  Timeframe: Rolling 12 months of price data                                │
│  Minimum Data: 3 monthly data points required.                            │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  RULE 3: EMERGING USE CASES (Weight: 25%)                                  │
│  ════════════════════════════════════════                                  │
│                                                                             │
│  Purpose: Detect commodities with new applications creating demand          │
│                                                                             │
│  Implementation:                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def calculate_emergence_score(signals: List[Signal]) -> int:       │  │
│  │      # Filter signals from last 90 days                             │  │
│  │      recent_signals = [s for s in signals                           │  │
│  │                        if s.detected_at > now() - days(90)]         │  │
│  │                                                                      │  │
│  │      # Deduplicate by topic/theme                                   │  │
│  │      unique_signals = deduplicate_by_topic(recent_signals)          │  │
│  │                                                                      │  │
│  │      signal_count = len(unique_signals)                             │  │
│  │                                                                      │  │
│  │      if signal_count >= 5:                                          │  │
│  │          return 100  # Strong emergence                             │  │
│  │      elif signal_count >= 3:                                        │  │
│  │          return 75   # Emerging                                     │  │
│  │      elif signal_count >= 1:                                        │  │
│  │          return 50   # Early signals                                │  │
│  │      else:                                                          │  │
│  │          return 0    # No emergence detected                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Signal Sources:                                                           │
│  • Reddit posts with emerging keywords                                     │
│  • News articles about new applications                                    │
│  • B2B marketplace new category listings                                   │
│  • Research/patent mentions (future)                                       │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  FINAL SCORE CALCULATION                                                   │
│  ═══════════════════════                                                   │
│                                                                             │
│  When a rule returns None (insufficient data), its weight is               │
│  redistributed proportionally to the rules that DO have data.              │
│                                                                             │
│  Example: Rule 2 = None (no price data)                                    │
│    Active weights: Rule1=0.40, Rule3=0.25 → total=0.65                    │
│    Redistributed:  Rule1=0.40/0.65=0.615, Rule3=0.25/0.65=0.385          │
│    final_score = (rule1 * 0.615) + (rule3 * 0.385)                        │
│                                                                             │
│  If ALL rules return None → final_score = 0 (NOT_NICHE)                   │
│  At least 1 rule must have data for a meaningful score.                    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def calculate_niche_score(commodity: Commodity) -> NicheScore:     │  │
│  │      rule1 = calculate_volume_score(commodity.monthly_volumes)      │  │
│  │      rule2 = calculate_volatility_score(commodity.price_history)    │  │
│  │      rule3 = calculate_emergence_score(commodity.signals)           │  │
│  │                                                                      │  │
│  │      # Build active rules (exclude None scores)                     │  │
│  │      weights = {                                                    │  │
│  │          'rule1': (rule1, 0.40),                                    │  │
│  │          'rule2': (rule2, 0.35),                                    │  │
│  │          'rule3': (rule3, 0.25),                                    │  │
│  │      }                                                              │  │
│  │      active = {k: v for k, v in weights.items()                     │  │
│  │                if v[0] is not None}                                  │  │
│  │                                                                      │  │
│  │      if not active:                                                 │  │
│  │          final_score = 0                                            │  │
│  │      else:                                                          │  │
│  │          total_weight = sum(w for _, w in active.values())          │  │
│  │          final_score = sum(                                         │  │
│  │              (score * (weight / total_weight))                       │  │
│  │              for score, weight in active.values()                    │  │
│  │          )                                                          │  │
│  │                                                                      │  │
│  │      # Determine classification                                     │  │
│  │      if final_score >= 60:                                          │  │
│  │          status = "NICHE_CANDIDATE"  # Requires admin review        │  │
│  │      elif final_score >= 40:                                        │  │
│  │          status = "WATCHLIST"        # Track for future             │  │
│  │      else:                                                          │  │
│  │          status = "NOT_NICHE"        # Excluded                     │  │
│  │                                                                      │  │
│  │      # Track data coverage for admin visibility                     │  │
│  │      data_coverage = {                                              │  │
│  │          'rules_with_data': len(active),                            │  │
│  │          'rules_total': 3,                                          │  │
│  │          'missing_rules': [k for k in weights                       │  │
│  │                            if weights[k][0] is None],               │  │
│  │      }                                                              │  │
│  │                                                                      │  │
│  │      return NicheScore(                                             │  │
│  │          rule1_score=rule1,  # None if insufficient data            │  │
│  │          rule2_score=rule2,  # None if insufficient data            │  │
│  │          rule3_score=rule3,  # None if insufficient data            │  │
│  │          final_score=final_score,                                   │  │
│  │          status=status,                                              │  │
│  │          data_coverage=data_coverage,                                │  │
│  │      )                                                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Score Normalization

| Component | Min | Max | Notes |
|-----------|-----|-----|-------|
| Rule 1 Score | 0 or None | 100 | Discrete values: 0, 50, 75, 100, or None (< 3 months data) |
| Rule 2 Score | 0 or None | 100 | Discrete values: 0, 50, 75, 100, or None (< 3 price points) |
| Rule 3 Score | 0 | 100 | Discrete values: 0, 50, 75, 100 (always calculable, 0 if no signals) |
| Final Score | 0 | 100 | Weighted sum with proportional redistribution for None rules |

### 9.3 Cross-Run Candidate Deduplication

> **Problem Solved:** Government data updates monthly but runs execute weekly.
> Without deduplication, the same commodity enters the review queue every run.

After scoring, before presenting candidates to admin, run a **deduplication check** against existing records:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     CROSS-RUN DEDUPLICATION LOGIC                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  For each scored candidate in the current run:                             │
│                                                                             │
│  STEP 1: MATCH against existing records                                    │
│  ──────────────────────────────────────                                    │
│  Match by: 8-digit HS code (exact) OR normalized name (>90% similarity)   │
│                                                                             │
│  STEP 2: ASSIGN STATUS based on match result                               │
│  ────────────────────────────────────────────                              │
│                                                                             │
│  ┌───────────────────────┬───────────────────────────────────────────────┐ │
│  │ Match Result          │ Action                                        │ │
│  ├───────────────────────┼───────────────────────────────────────────────┤ │
│  │ No match found        │ status = "pending_review" (normal flow)       │ │
│  │ Matches APPROVED item │ status = "already_approved" (auto-skip)       │ │
│  │                       │ Log: "Skipped — approved in Run #X"           │ │
│  │ Matches REJECTED item │ If rejected < 90 days ago:                    │ │
│  │ (within 90 days)      │   status = "recently_rejected" (auto-skip)   │ │
│  │                       │   Log: "Skipped — rejected in Run #X"         │ │
│  │ Matches REJECTED item │ If rejected >= 90 days ago:                   │ │
│  │ (older than 90 days)  │   status = "pending_review" (re-evaluate)     │ │
│  │                       │   Flag: "Previously rejected — new data"      │ │
│  │ Matches WATCHLIST item│ status = "watchlist_rescore" (see 9.4)        │ │
│  │                       │ Show: old score vs new score side by side     │ │
│  └───────────────────────┴───────────────────────────────────────────────┘ │
│                                                                             │
│  ADMIN QUEUE shows only: pending_review + watchlist_rescore candidates     │
│  Auto-skipped items visible in Run Details > "Skipped" tab                 │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 9.4 Watchlist Re-evaluation Mechanism

> **Problem Solved:** Watchlist was previously a label with no operational consequence.
> Now it actively monitors commodities and surfaces them when new data arrives.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     WATCHLIST RE-EVALUATION                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WHEN watchlisted commodity appears in a new run:                          │
│  ────────────────────────────────────────────────                          │
│  1. Re-score with fresh data from current run                              │
│  2. Set status = "watchlist_rescore"                                       │
│  3. Admin sees BOTH scores in review UI:                                   │
│                                                                             │
│     ┌──────────────────────────────────────────────────────────────────┐  │
│     │  📋 WATCHLIST RE-EVALUATION: Cardamom (Small)                    │  │
│     │                                                                   │  │
│     │  Previous Score (Run #48, Jan 15):  48/100                       │  │
│     │  Current Score  (Run #52, Feb 12):  67/100  ↑ +19               │  │
│     │                                                                   │  │
│     │  Score Delta Breakdown:                                          │  │
│     │  • Volume:    50 → 50  (unchanged)                               │  │
│     │  • Volatility: 0 → 75  (price spike detected)                   │  │
│     │  • Emergence: 50 → 75  (3 new signals)                          │  │
│     │                                                                   │  │
│     │  [✓ Approve]  [✗ Reject]  [👁 Keep on Watchlist]                │  │
│     └──────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  WHEN watchlisted commodity does NOT appear in 3 consecutive runs:         │
│  ──────────────────────────────────────────────────────────────────        │
│  • Auto-transition to status = "watchlist_expired"                         │
│  • Notify admin: "Cardamom — no fresh data in 3 runs, watchlist expired"  │
│  • If it reappears later, treated as a new candidate (pending_review)      │
│                                                                             │
│  WATCHLIST SECTION in Admin Review Queue:                                  │
│  ────────────────────────────────────────                                  │
│  Separate section at top of Commodities tab showing only re-scored        │
│  watchlist items with score deltas. Distinct from new candidates.         │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. LLM Integration Specification

### 10.1 Purpose & Scope

The LLM generates **explanatory content for admin decision-making**. This is NOT the user-facing market intelligence system.

| Aspect | Specification |
|--------|---------------|
| Purpose | Explain WHY a commodity qualifies as niche |
| Audience | Admins only (internal) |
| Output | Reasoning + evidence for approval decision |
| Authority | Advisory only - cannot change scores or status |

### 10.2 Key Decisions: Admin-Triggered Generation

**IMPORTANT:** LLM analysis is NOT automatically generated during scoring. Instead, it follows a **Batch After Scoring** model where admins explicitly trigger analysis generation.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    LLM GENERATION WORKFLOW                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SCORING COMPLETES                                                       │
│     └── Candidates scored via 3-rule algorithm                             │
│     └── NO LLM analysis generated yet                                      │
│                                                                             │
│  2. ADMIN REVIEWS CANDIDATES                                                │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  Candidates visible with:                                        │    │
│     │  • Niche score (algorithm-based)                                │    │
│     │  • Rule breakdown (Volume, Volatility, Emergence)               │    │
│     │  • LLM Status: "Not Generated" ⚠️                               │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  3. ADMIN TRIGGERS LLM GENERATION                                          │
│     Two options:                                                            │
│     ┌───────────────────────┐     ┌───────────────────────┐               │
│     │  BATCH GENERATION     │     │  PER-CANDIDATE        │               │
│     │  ─────────────────    │     │  ─────────────────    │               │
│     │  "Generate Analysis"  │     │  Dropdown per row:    │               │
│     │  button for all or    │     │  • Generate Short     │               │
│     │  selected candidates  │     │  • Generate Full      │               │
│     └───────────────────────┘     └───────────────────────┘               │
│                                                                             │
│  4. ADMIN DECISION (Allow with Warning)                                    │
│     Admins CAN approve/reject without analysis, but see warning:           │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  ⚠️ "No LLM analysis generated for this candidate."             │    │
│     │     Are you sure you want to proceed?                            │    │
│     │     [Cancel] [Proceed Anyway]                                    │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 10.2.1 Why Admin-Triggered?

| Benefit | Explanation |
|---------|-------------|
| **Cost Control** | Admins only generate for candidates they're actually reviewing |
| **Flexibility** | Choose detail level per candidate based on complexity |
| **Speed** | Scoring runs complete faster without LLM bottleneck |
| **Transparency** | Clear separation: algorithms score, humans decide when to get AI explanation |

#### 10.2.2 Detail Level Selection

Admins choose detail level **per candidate** or **batch default**:

| Level | When to Use | Tokens | Cost (Haiku) | Cost (Sonnet) | Cost (Opus) |
|-------|-------------|--------|-------------|--------------|-------------|
| **Short** | High-confidence scores (>75), clear-cut cases | 200-400 | ~$0.001 | ~$0.01 | ~$0.03 |
| **Full** | Borderline scores (50-75), complex commodities | 800-1200 | ~$0.003 | ~$0.04 | ~$0.10 |
| **Comprehensive** | Disputed cases, strategic importance | 2000-3000 | ~$0.008 | ~$0.10 | ~$0.25 |

> **Note:** Costs above are estimates based on the selected model. Actual costs depend on prompt length + output tokens. The Settings page shows the currently selected model so admins can estimate costs before generating analysis.

### 10.3 LLM Model Configuration

Admins select which LLM model to use for niche validation analysis via the Settings page. This allows cost/quality optimization — use cheap models for routine validation, expensive models for strategic decisions.

#### 10.3.1 Available Model Registry

> **IMPORTANT:** This model registry is shared across the entire Niche Commodity Finder system.
> Stage 4 (Market Intelligence) references this same registry for prediction model selection.
> When adding new models, update this table AND the Stage 4 PRD reference.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        LLM MODEL REGISTRY                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┬───────────┬────────────────────┬──────┬────────────┐ │
│  │ Model ID         │ Provider  │ Display Name       │ Cost │ Best For   │ │
│  ├──────────────────┼───────────┼────────────────────┼──────┼────────────┤ │
│  │ claude-opus-4    │ Anthropic │ Claude Opus 4      │ $$$  │ Complex/   │ │
│  │                  │           │                    │      │ strategic  │ │
│  ├──────────────────┼───────────┼────────────────────┼──────┼────────────┤ │
│  │ claude-sonnet-4-6│ Anthropic │ Claude Sonnet 4.6  │ $$   │ Balanced   │ │
│  │                  │           │                    │      │ analysis   │ │
│  ├──────────────────┼───────────┼────────────────────┼──────┼────────────┤ │
│  │ claude-haiku-4-5 │ Anthropic │ Claude Haiku 4.5   │ $    │ Routine    │ │
│  │                  │           │                    │      │ validation │ │
│  ├──────────────────┼───────────┼────────────────────┼──────┼────────────┤ │
│  │ gemini-2.0-flash │ Google    │ Gemini 2.0 Flash   │ $    │ Fast       │ │
│  │                  │           │                    │      │ structured │ │
│  ├──────────────────┼───────────┼────────────────────┼──────┼────────────┤ │
│  │ gemini-2.5-pro   │ Google    │ Gemini 2.5 Pro     │ $$   │ Complex    │ │
│  │                  │           │                    │      │ reasoning  │ │
│  └──────────────────┴───────────┴────────────────────┴──────┴────────────┘ │
│                                                                             │
│  DEFAULT for Niche Validation: claude-haiku-4-5 (cheapest Claude)          │
│  DEFAULT for Market Predictions: gemini-2.0-flash (cheapest Gemini)        │
│                                                                             │
│  Cost Tiers:                                                               │
│  $   = < $1/M input tokens  (Haiku, Flash)                                │
│  $$  = $1-5/M input tokens  (Sonnet, Gemini Pro)                          │
│  $$$ = > $5/M input tokens  (Opus)                                         │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 10.3.2 Model Selection Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    MODEL SELECTION FLOW                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Admin sets "Niche Validation Model" in Settings page                   │
│     └── Stored in: niche_settings table (PostgreSQL)                       │
│         Key: "niche_validation_model"                                      │
│         Value: "claude-haiku-4-5"                                          │
│                                                                             │
│  2. Admin triggers LLM generation for a candidate                          │
│     └── API call includes: candidate_id, detail_level                     │
│     └── Model is read from settings (NOT passed by admin per request)     │
│                                                                             │
│  3. Backend reads model from niche_settings                                │
│     └── Determines provider from model ID prefix:                         │
│         "claude-*" → provider = "claude"                                   │
│         "gemini-*" → provider = "gemini"                                   │
│                                                                             │
│  4. Calls ai_factory.get_client(provider=provider, model=model_id)        │
│     └── Factory creates appropriate client with specified model            │
│     └── Overrides the global AI_PROVIDER / LLM_MODEL env vars             │
│                                                                             │
│  5. LLM analysis generated + stored with metadata                          │
│     └── llm_metadata.model = "claude-haiku-4-5"                           │
│     └── llm_metadata.tokens_used = 1247                                    │
│     └── llm_metadata.cost_usd = 0.003                                      │
│                                                                             │
│  NOTE: The global AI_PROVIDER env var remains as the FALLBACK.            │
│  If no model is configured in settings, the system uses the env var.       │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 10.3.3 Database: niche_settings Table

```sql
CREATE TABLE niche_settings (
    setting_key     VARCHAR(100) PRIMARY KEY,
    setting_value   JSONB NOT NULL,
    updated_by      VARCHAR(100),      -- admin_id
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default settings inserted on first deploy:
INSERT INTO niche_settings (setting_key, setting_value) VALUES
('niche_validation_model', '"claude-haiku-4-5"'),
('market_predictions_model', '"gemini-2.0-flash"'),
('auto_publish_threshold', '75'),
('default_detail_level', '"short"'),
('cost_alert_threshold_usd', '50');
```

#### 10.3.4 API: Settings Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/niche/settings` | Get all niche settings |
| `PUT` | `/admin/niche/settings/{key}` | Update a setting |
| `GET` | `/admin/niche/models` | List available models with cost info |

### 10.4 Prompt Templates

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        LLM PROMPT TEMPLATES                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SHORT PROMPT (200-400 tokens output)                                      │
│  ═════════════════════════════════════                                    │
│                                                                             │
│  """                                                                        │
│  You are a commodity market analyst. Briefly classify this commodity       │
│  as niche or mainstream based on the provided data.                        │
│                                                                             │
│  Commodity: {commodity_name}                                                │
│  HS Code: {hs_code}                                                         │
│  Annual Export Volume: {volume_mt} metric tons                             │
│  Price Volatility: {volatility_pct}%                                       │
│  Emerging Signals: {signal_count} detected                                 │
│  Algorithmic Score: {final_score}/100                                      │
│                                                                             │
│  Provide:                                                                  │
│  1. Classification (niche/borderline/mainstream)                           │
│  2. One-sentence summary of why                                            │
│  """                                                                        │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  FULL PROMPT (800-1200 tokens output)                                      │
│  ═════════════════════════════════════                                  │
│                                                                             │
│  """                                                                        │
│  You are a commodity market analyst evaluating potential niche             │
│  commodities for a B2B trading platform. Analyze this commodity            │
│  and provide a detailed assessment.                                        │
│                                                                             │
│  ## Commodity Data                                                         │
│  - Name: {commodity_name}                                                   │
│  - HS Code: {hs_code}                                                       │
│  - Data Source: {source_name}                                              │
│                                                                             │
│  ## Volume Analysis                                                        │
│  - Annual Export Volume: {volume_mt} metric tons                           │
│  - Year-over-Year Change: {yoy_change_pct}%                                │
│  - Top Destinations: {destinations}                                        │
│                                                                             │
│  ## Price Volatility                                                       │
│  - 12-Month Price Range: {price_min} - {price_max} {currency}/kg          │
│  - Volatility: {volatility_pct}%                                           │
│                                                                             │
│  ## Emerging Signals ({signal_count} detected)                             │
│  {signals_summary}                                                         │
│                                                                             │
│  ## Algorithmic Scoring                                                    │
│  - Rule 1 (Volume): {rule1_score}/100                                      │
│  - Rule 2 (Volatility): {rule2_score}/100                                  │
│  - Rule 3 (Emergence): {rule3_score}/100                                   │
│  - Final Score: {final_score}/100                                          │
│                                                                             │
│  Provide:                                                                  │
│  1. Classification: niche / borderline / mainstream                        │
│  2. Confidence level: 0-100%                                               │
│  3. Summary (2-3 sentences)                                                │
│  4. Evidence for each scoring rule                                         │
│  5. Key risks or caveats                                                   │
│  6. Recommendation: APPROVE / REJECT / WATCHLIST                           │
│  """                                                                        │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  COMPREHENSIVE PROMPT (2000-3000 tokens output)                            │
│  ═══════════════════════════════════════════════                           │
│                                                                             │
│  [Includes all of STANDARD plus:]                                          │
│                                                                             │
│  - Full market context analysis                                            │
│  - Competitor landscape                                                    │
│  - Supply chain considerations                                             │
│  - Historical trend analysis                                               │
│  - Potential market opportunities                                          │
│  - Risk matrix with severity ratings                                       │
│  - Detailed recommendation with action items                               │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 10.5 Cost Estimation (Admin-Triggered)

Since analysis is admin-triggered rather than automatic, costs are controlled by admin behavior:

| Scenario | Candidates Reviewed | Typical Pattern | Est. Cost |
|----------|---------------------|-----------------|-----------|
| Selective review | 20 of 150 | Short for most, Full for 5 | ~$1.00 |
| Full review | 150 | Short for all | ~$1.50 |
| Full review | 150 | Full for all | ~$6.00 |
| Deep analysis | 10 borderline | Comprehensive | ~$1.00 |

**Cost savings vs. automatic generation:** 60-80% reduction by only generating for candidates admins actively review.

### 10.6 LLM Output Schema

```json
{
  "classification": "niche | borderline | mainstream",
  "confidence": 87,
  "summary": "Moringa qualifies as niche due to...",

  "rule_analysis": {
    "volume_rule": {
      "met": true,
      "evidence": "Annual exports: 45,000 MT...",
      "data_source": "APEDA FY2025-26"
    },
    "volatility_rule": {
      "met": true,
      "evidence": "Price range: ₹180-₹310/kg...",
      "data_source": "Commodity tracker"
    },
    "emergence_rule": {
      "met": true,
      "evidence": "8 signals detected...",
      "data_sources": ["Reddit", "FoodNavigator"]
    }
  },

  "market_context": "Growing global demand...",

  "risks": [
    "Seasonal availability",
    "Certification requirements"
  ],

  "recommendation": "APPROVE",
  "recommendation_rationale": "Strong niche indicators..."
}
```

---

## 11. Admin Portal UI Specifications

> **Full wireframes and user flows have been migrated to the dedicated UI spec.**
> See [[ai/NICHE_COMMODITY_FINDER_UI_SPEC]] for all admin portal wireframes.

### 11.1 Pages Summary

The admin portal includes the following pages for Stage 1 (Government Data Extraction):

| Page | Purpose | UI Spec Section |
|------|---------|-----------------|
| **Niche Dashboard** | Hub with alerts, pipeline metrics, recent activity | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.1]] |
| **Discovery > Runs** | Run history, trigger new runs, retry failed | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.2]] |
| **Discovery > Commodities** | Pending review queue with LLM generation controls | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.3]] |
| **Discovery > Approved** | Active niche registry with CRUD actions | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.4]] |
| **Candidate Review** | Score breakdown, LLM analysis panel, approve/reject/watchlist | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.5]] |
| **Job Logs** | Real-time streaming + historical audit trail | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.12]] |
| **Settings** | LLM model selection, scoring thresholds, scraper schedules | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.14]] |


### 11.2 Approval/Rejection Workflow

This workflow is preserved here because it defines business logic (not just UI). For the visual wireframe of the review interface, see [[NICHE_COMMODITY_FINDER_UI_SPEC#4.5]].

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     ADMIN DECISION WORKFLOW                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  APPROVE FLOW                                                              │
│  ────────────                                                              │
│  1. Admin clicks [✓ Approve]                                               │
│  2. IF no LLM analysis: Warning modal                                      │
│     "No analysis generated. Proceed anyway?"                               │
│     [Cancel] [Proceed]                                                     │
│  3. Confirmation modal: "Approve as Active Niche?"                         │
│  4. On confirm → Log decision, activate commodity                          │
│                                                                             │
│  REJECT FLOW                                                               │
│  ───────────                                                               │
│  1. Admin clicks [✗ Reject]                                                │
│  2. Reason selection (required)                                            │
│  3. Confirmation modal with reason                                         │
│  4. On confirm → Log decision with reason                                  │
│                                                                             │
│  WATCHLIST FLOW                                                            │
│  ──────────────                                                            │
│  1. Admin clicks [👁 Watchlist]                                            │
│  2. On confirm → Status = watchlist, re-evaluate next run                 │
│                                                                             │
│  CONSTRAINTS                                                               │
│  ───────────                                                               │
│  ✗ Cannot add commodities not discovered by system                        │
│  ✗ Cannot modify scores or underlying data                                │
│  ✗ Cannot delete candidates or raw data                                   │
│  ✓ All actions logged with timestamp and admin ID                         │
│  ✓ Rejection requires mandatory reason                                    │
│  ✓ Can approve/reject without LLM analysis (with warning)                 │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Database Schema (Conceptual)

### 12.1 Entity Relationship Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      ENTITY RELATIONSHIP DIAGRAM                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          ┌─────────────────┐                               │
│                          │ discovery_runs  │                               │
│                          │ ───────────────│                               │
│                          │ run_id (PK)     │                               │
│                          │ run_number      │                               │
│                          │ trigger_type    │                               │
│                          │ triggered_by    │                               │
│                          │ status          │                               │
│                          │ config          │                               │
│                          │ started_at      │                               │
│                          │ completed_at    │                               │
│                          │ results_summary │                               │
│                          └────────┬────────┘                               │
│                                   │                                        │
│                  ┌────────────────┼────────────────┐                       │
│                  │                │                │                       │
│                  ▼                ▼                ▼                       │
│  ┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────┐          │
│  │ raw_data_files      │ │ parsed_records  │ │ niche_candidates │          │
│  │ ───────────────     │ │ ───────────────│ │ ────────────────│          │
│  │ file_id (PK)        │ │ record_id (PK)  │ │ candidate_id(PK)│          │
│  │ run_id (FK)         │ │ run_id (FK)     │ │ run_id (FK)     │          │
│  │ source_name         │ │ raw_file_id(FK) │ │ commodity_name  │          │
│  │ source_url          │ │ source_name     │ │ hs_code         │          │
│  │ file_name           │ │ commodity_name  │ │ rule1_score     │          │
│  │ file_type           │ │ hs_code         │ │ rule2_score     │          │
│  │ file_path           │ │ volume_mt       │ │ rule3_score     │          │
│  │ checksum_sha256     │ │ value_usd       │ │ final_score     │          │
│  │ publish_date        │ │ time_period     │ │ llm_analysis    │          │
│  │ fetched_at          │ │ parse_status    │ │ status          │          │
│  └─────────────────────┘ │ parsed_at       │ │ created_at      │          │
│                          └─────────────────┘ └────────┬────────┘          │
│                                                       │                    │
│                              ┌────────────────────────┼───────────────┐    │
│                              │                        │               │    │
│                              ▼                        ▼               │    │
│              ┌─────────────────────────┐  ┌─────────────────────┐    │    │
│              │ approved_commodities    │  │ admin_decisions     │    │    │
│              │ ────────────────────    │  │ ────────────────    │    │    │
│              │ commodity_id (PK)       │  │ decision_id (PK)    │    │    │
│              │ candidate_id (FK)       │  │ candidate_id (FK)   │◀───┘    │
│              │ commodity_name          │  │ admin_id            │         │
│              │ hs_code                 │  │ action              │         │
│              │ approved_at             │  │ reason              │         │
│              │ approved_by             │  │ notes               │         │
│              │ is_active               │  │ decided_at          │         │
│              │ deactivated_at          │  └─────────────────────┘         │
│              │ deactivated_reason      │                                  │
│              └─────────────────────────┘                                  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Table Descriptions

| Table | Purpose | Estimated Size |
|-------|---------|----------------|
| **discovery_runs** | Track pipeline executions | ~50 rows/month |
| **raw_data_files** | Immutable source file storage | ~200 rows/month |
| **parsed_records** | Normalized commodity data | ~2,000 rows/month |
| **niche_candidates** | Scored potential niches | ~200 rows/month |
| **approved_commodities** | Active niche registry | ~500 total |
| **admin_decisions** | Audit trail | ~200 rows/month |

---

## 13. API Endpoints (High-Level)

### 13.1 Admin Run Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/niche/runs` | List all discovery runs |
| `GET` | `/admin/niche/runs/{run_id}` | Get run details |
| `POST` | `/admin/niche/runs` | Trigger new run |
| `POST` | `/admin/niche/runs/{run_id}/retry` | Retry failed run |

### 13.2 Admin Raw Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/niche/runs/{run_id}/files` | List raw files for run |
| `GET` | `/admin/niche/files/{file_id}/download` | Download raw file |

### 13.3 Admin Candidates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/niche/candidates` | List candidates (filterable) |
| `GET` | `/admin/niche/candidates/{id}` | Get candidate details |
| `POST` | `/admin/niche/candidates/{id}/approve` | Approve as niche |
| `POST` | `/admin/niche/candidates/{id}/reject` | Reject with reason |
| `POST` | `/admin/niche/candidates/{id}/watchlist` | Add to watchlist |

### 13.4 Admin Approved Registry

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/niche/approved` | List approved commodities |
| `GET` | `/admin/niche/approved/{id}` | Get approved commodity |
| `POST` | `/admin/niche/approved/{id}/deactivate` | Deactivate niche |

### 13.5 Internal Endpoints (Worker Communication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/internal/niche/runs/{run_id}/scraper-complete` | Scraper signals completion |
| `POST` | `/internal/niche/runs/{run_id}/scoring-complete` | Scoring signals completion |
| `POST` | `/internal/niche/runs/{run_id}/llm-complete` | LLM validation complete |

---

## 14. Approved Niche Commodity Registry

### 14.1 Registry Characteristics

| Characteristic | Implementation |
|----------------|----------------|
| **Versioning** | Each approval creates new version |
| **Linkage** | Always linked to originating run |
| **Immutability** | Historical approvals never deleted |
| **Activation** | Only active commodities proceed downstream |

### 14.2 Lifecycle States

```
APPROVED (active) → DEACTIVATED → (never deleted)
```

### 14.3 Downstream Usage

Only commodities in this registry with `is_active = true` proceed to:
- Stage 2: Buyer Discovery
- Stage 3: Seller Discovery
- Stage 4: Market Intelligence Predictions

---

## 15. Auditability & Observability

### 15.1 Audit Questions

The system must always be able to answer:

| Question | Data Source |
|----------|-------------|
| Why was this commodity surfaced? | `niche_candidates.llm_analysis` |
| Which sources contributed? | `raw_data_files.source_name` |
| Which Run produced it? | `niche_candidates.run_id` |
| What scoring logic applied? | `niche_candidates.rule1/2/3_score` |
| Who approved or rejected it? | `admin_decisions.admin_id` |

### 15.2 Structured Logging

All layers emit structured logs:

```json
{
  "timestamp": "2026-02-03T10:30:00Z",
  "level": "INFO",
  "component": "discovery.scraper.apeda",
  "run_id": "abc-123",
  "event": "file_downloaded",
  "details": {
    "file_name": "exports_jan2026.xlsx",
    "file_size_bytes": 2457600,
    "source_url": "https://apeda.gov.in/..."
  }
}
```

### 15.3 Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `niche.runs.total` | Counter | Total runs executed |
| `niche.runs.duration_seconds` | Histogram | Run execution time |
| `niche.candidates.generated` | Counter | Candidates per run |
| `niche.candidates.approved_rate` | Gauge | Approval rate |
| `niche.llm.tokens_used` | Counter | LLM API usage |
| `niche.llm.cost_usd` | Counter | LLM API cost |

---

## 16. Risks & Mitigations

### 16.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Over-reliance on LLMs** | Decision quality | Strict separation: LLM advises, doesn't decide |
| **Data format drift** | Parse failures | Schema validation, format change alerts |
| **Source unavailability** | Missing data | Partial run support, retry logic |
| **LLM cost overrun** | Budget | Token budgeting, detail level configuration |

### 16.2 Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Admin subjectivity** | Inconsistent decisions | Algorithmic gating, mandatory logging |
| **Data staleness** | Outdated candidates | Freshness alerts, automatic revalidation |
| **Audit gaps** | Compliance issues | Append-only storage, comprehensive logging |

---

## 17. Phase 1 Success Criteria

### 17.1 Functional Criteria

| Criterion | Measurement |
|-----------|-------------|
| Reliable monthly runs | 95%+ completion rate |
| Explainable candidates | All candidates have LLM analysis |
| Confident admin decisions | <10% decisions requiring escalation |
| Full audit trails | 100% of decisions logged |

### 17.2 Performance Criteria

| Criterion | Target |
|-----------|--------|
| Run completion time | <2 hours |
| Parse success rate | >98% |
| LLM cost per run | <$10 |
| Admin review time | <5 min per candidate |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | February 2026 | BREYUS Team | Initial PRD |
| 2.0 | February 2026 | BREYUS Team | Enhanced with detailed scraper specs, run management, scoring details, LLM integration, UI wireframes, database schema, and API endpoints |

---

*This PRD defines the Government Data Extraction module of the Breyus Niche Commodity Finder AI. For the complete system architecture covering all 4 stages, see NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE.md.*

## Related
- [[NICHE_COMMODITY_FINDER_PRD]]
- [[ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE]]
- [[PRD_4_Market_Intelligence]]
- [[MOC-AI]]
