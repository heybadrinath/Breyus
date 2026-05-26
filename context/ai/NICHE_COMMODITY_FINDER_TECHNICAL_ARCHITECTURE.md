---
type: technical-doc
module: ai
tags: [ai, architecture, niche-commodity]
---

# Niche Commodity Finder AI - Technical Architecture Document

> **Document Type:** Technical Architecture Specification
> **Version:** 1.1
> **Last Updated:** February 2026
> **Status:** Implementation Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Stage 1: Commodity Discovery System](#3-stage-1-commodity-discovery-system)
4. [Stage 2: Buyer Discovery System](#4-stage-2-buyer-discovery-system)
5. [Stage 3: Seller Discovery System](#5-stage-3-seller-discovery-system)
6. [Stage 4: Market Intelligence System](#6-stage-4-market-intelligence-system)
7. [Folder Structure](#7-folder-structure)
8. [Integration Points](#8-integration-points)
9. [Scheduling & Automation](#9-scheduling--automation)
10. [Security & Compliance](#10-security--compliance)
11. [Implementation Phases](#11-implementation-phases)
12. [Admin Portal UI Specification](#12-admin-portal-ui-specification)
13. [User-Facing UI Specification (Gold Buyers)](#13-user-facing-ui-specification-gold-buyers)
14. [Job Logs & Audit Trail Specification](#14-job-logs--audit-trail-specification)

---

## 1. Executive Summary

### 1.1 System Purpose

The **Niche Commodity Finder AI** is an intelligent pipeline that discovers underserved niche commodities, identifies potential trading partners (buyers and sellers), and provides ongoing market intelligence to create permanent user engagement. This document provides the technical architecture for implementing this system within the Breyus platform.

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Extend AI_NEW (FastAPI) | Leverage existing Python AI infrastructure |
| **Scraper Location** | AI_NEW repo, separate `niche/` folder | Clear separation from existing services |
| **Storage** | PostgreSQL only (AI_NEW database) | Centralized AI data management |
| **Processing Model** | Batch (scheduled) + Manual triggers | Admin control over pipeline execution |
| **Approval Flow** | Individual commodity approval | Human-in-the-loop quality control |
| **LLM Detail Level** | Configurable per run | Cost/quality tradeoff flexibility |
| **Stage 2/3 Architecture** | New contact discovery system | Not extending existing `link_predictor` |

### 1.3 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **API Framework** | FastAPI | REST endpoints, async processing |
| **Database** | PostgreSQL + pgvector | Relational data + embeddings |
| **Scraping** | requests, BeautifulSoup, Selenium | Static + dynamic content |
| **Task Queue** | Redis + Celery (or native async) | Background job processing |
| **LLM Integration** | Claude API / Google Gemini | Analysis and enrichment |
| **Embeddings** | sentence-transformers | Semantic similarity search |
| **Caching** | Redis | Rate limiting, session data |

### 1.4 Two Separate AI Analysis Systems

The architecture distinguishes between two fundamentally different AI analysis systems:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI ANALYSIS SYSTEMS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. NICHE VALIDATION ANALYSIS (Admin-Only)                                  │
│     ├── Purpose: Explain WHY a commodity qualifies as niche                 │
│     ├── Output: Reasoning + proof for admin decision-making                 │
│     ├── Audience: Admins only (internal)                                    │
│     └── Timing: Per discovery run                                           │
│                                                                              │
│  2. MARKET INTELLIGENCE PREDICTIONS (User-Facing)                           │
│     ├── Purpose: Actionable market forecasts                                │
│     ├── Output: Price predictions, buy/sell signals, trends                 │
│     ├── Audience: Gold Buyers (paying users)                                │
│     └── Timing: Weekly updates                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Architecture Overview

### 2.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BREYUS PLATFORM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐ │
│  │   Frontend   │     │  Admin Portal │     │        NestJS Backend        │ │
│  │   (React)    │     │   (React)    │     │                              │ │
│  └──────┬───────┘     └──────┬───────┘     └──────────────┬───────────────┘ │
│         │                    │                             │                 │
│         └────────────────────┼─────────────────────────────┘                 │
│                              │                                               │
│                              ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          AI_NEW (FastAPI)                              │  │
│  │                                                                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │  │
│  │  │ Existing        │  │ NICHE COMMODITY │  │ Background      │        │  │
│  │  │ Services        │  │ FINDER          │  │ Workers         │        │  │
│  │  │ ─────────────── │  │ ─────────────── │  │ ─────────────── │        │  │
│  │  │ link_predictor  │  │ discovery/      │  │ discovery_worker│        │  │
│  │  │ commodity_search│  │ contacts/       │  │ contact_worker  │        │  │
│  │  │ market_analyzer │  │ intelligence/   │  │ intel_worker    │        │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │  │
│  │                              │                                         │  │
│  │                              ▼                                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    PostgreSQL (AI Database)                      │  │  │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │  │  │
│  │  │  │   runs      │ │ candidates  │ │  contacts   │ │predictions │ │  │  │
│  │  │  │   raw_data  │ │ approved    │ │  buyers     │ │reports     │ │  │  │
│  │  │  │   parsed    │ │ decisions   │ │  sellers    │ │delivery    │ │  │  │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow Between Stages

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  STAGE 1: COMMODITY DISCOVERY                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │ Govt Data   │───▶│ Parse &     │───▶│ Score &     │───▶│ Admin       │    │
│  │ Scrapers    │    │ Normalize   │    │ Validate    │    │ Approval    │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘    │
│        │                                                          │           │
│        │                                     ┌────────────────────┘           │
│        ▼                                     ▼                                │
│  ┌─────────────┐                      ┌─────────────────┐                     │
│  │ raw_data_   │                      │ approved_       │                     │
│  │ files       │                      │ commodities     │                     │
│  └─────────────┘                      └────────┬────────┘                     │
│                                                │                              │
│                    ┌───────────────────────────┴───────────────────────┐      │
│                    ▼                                                   ▼      │
│  STAGE 2: BUYER DISCOVERY                         STAGE 3: SELLER DISCOVERY  │
│  ┌─────────────────────────────┐                  ┌─────────────────────────┐ │
│  │ B2B Marketplace Scrapers   │                  │ Cooperative Scrapers    │ │
│  │ ─────────────────────────── │                  │ ─────────────────────── │ │
│  │ TradeKey (buyer requests)  │                  │ NAFED, State co-ops     │ │
│  │ IndiaMART (buying leads)   │                  │ APEDA exporter lists    │ │
│  │ Alibaba (RFQ data)         │                  │ Trade associations      │ │
│  └──────────────┬──────────────┘                  └────────────┬────────────┘ │
│                 │                                              │              │
│                 ▼                                              ▼              │
│  ┌─────────────────────────────┐                  ┌─────────────────────────┐ │
│  │ buyer_contacts             │                  │ seller_contacts         │ │
│  │ quality_scores             │                  │ quality_scores          │ │
│  └──────────────┬──────────────┘                  └────────────┬────────────┘ │
│                 │                                              │              │
│                 └──────────────────────┬───────────────────────┘              │
│                                        ▼                                      │
│  STAGE 4: MARKET INTELLIGENCE                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │                                                                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │ Govt Data   │  │ News/RSS    │  │ B2B Market  │  │ Historical  │   │   │
│  │  │ Aggregator  │  │ Sentiment   │  │ Activity    │  │ Patterns    │   │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │   │
│  │         └─────────────────┼─────────────────┼────────────────┘         │   │
│  │                           ▼                                            │   │
│  │                    ┌─────────────┐                                     │   │
│  │                    │ LLM Analysis│                                     │   │
│  │                    │ Pipeline    │                                     │   │
│  │                    └──────┬──────┘                                     │   │
│  │                           ▼                                            │   │
│  │         ┌─────────────────────────────────────┐                        │   │
│  │         │     Weekly Prediction Reports       │                        │   │
│  │         │  ─────────────────────────────────  │                        │   │
│  │         │  • Price direction forecasts        │                        │   │
│  │         │  • Buy/sell timing signals          │                        │   │
│  │         │  • Risk assessments                 │                        │   │
│  │         │  • Supply chain alerts              │                        │   │
│  │         └─────────────────────────────────────┘                        │   │
│  │                           │                                            │   │
│  │                           ▼                                            │   │
│  │         ┌─────────────────────────────────────┐                        │   │
│  │         │     Delivery Channels               │                        │   │
│  │         │  • Dashboard (Gold Buyers)          │                        │   │
│  │         │  • Email notifications              │                        │   │
│  │         └─────────────────────────────────────┘                        │   │
│  │                                                                        │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Integration with Existing Breyus Systems

| System | Integration Type | Purpose |
|--------|-----------------|---------|
| NestJS Backend | REST API | Admin operations, user authentication |
| MongoDB (Main) | Read-only | User profiles, company data enrichment |
| Admin Portal | REST + WebSocket | Run management, approval workflows |
| Frontend | REST | Market intelligence dashboard |
| Existing AI Services | None (separate) | Independent operation |

---

## 3. Stage 1: Commodity Discovery System

### 3.1 Overview

The Commodity Discovery System is the foundational layer that identifies potential niche commodities from government trade data and supplementary sources. It operates on a run-based model where each execution creates an immutable record of the discovery process.

### 3.2 Scraper Architecture

#### 3.2.1 Primary Scrapers

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        COMMODITY DISCOVERY SCRAPERS                         │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GOVERNMENT DATA SCRAPERS (High Priority - Ground Truth)                   │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  APEDA Scraper                      DGFT Scraper                      │ │
│  │  ─────────────                      ────────────                      │ │
│  │  Source: apeda.gov.in               Source: dgft.gov.in               │ │
│  │  Data: Agricultural exports         Data: HS codes, trade data        │ │
│  │  Format: CSV, Excel, PDF            Format: Website tables, PDFs      │ │
│  │  Fields:                            Fields:                           │ │
│  │  • Commodity name                   • HS code (8-digit)               │ │
│  │  • HS code                          • Commodity description           │ │
│  │  • Export volume (MT)               • Export/import values            │ │
│  │  • Export value (USD/INR)           • Country breakdown               │ │
│  │  • Destination countries            • Policy updates                  │ │
│  │  • Year-over-year changes           • Tariff information              │ │
│  │  Frequency: Monthly                 Frequency: Monthly                │ │
│  │                                                                        │ │
│  │  Spice Board Scraper                Commodity Boards                  │ │
│  │  ──────────────────                 ─────────────────                 │ │
│  │  Source: indianspices.com           Sources: Multiple boards          │ │
│  │  Data: Spice production/export      • Tea Board                       │ │
│  │  Format: Reports, PDFs              • Coffee Board                    │ │
│  │  Fields:                            • Rubber Board                    │ │
│  │  • Spice name                       • Tobacco Board                   │ │
│  │  • Production volume                Data: Sector-specific stats       │ │
│  │  • Export volume                    Frequency: Quarterly              │ │
│  │  • Price trends                                                       │ │
│  │  Frequency: Monthly                                                   │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  SUPPLEMENTARY SCRAPERS (Medium Priority - Signal Detection)               │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  Reddit Scraper                     News/RSS Aggregator               │ │
│  │  ──────────────                     ───────────────────               │ │
│  │  Subreddits:                        Sources:                          │ │
│  │  • r/commodities                    • Google News RSS                 │ │
│  │  • r/agriculture                    • FoodNavigator                   │ │
│  │  • r/pharma                         • CosmeticsDesign                 │ │
│  │  • r/chemicals                      • Industry blogs                  │ │
│  │  Keywords:                          Keywords:                         │ │
│  │  • "emerging commodity"             • "commodity shortage"            │ │
│  │  • "new material"                   • "supply chain disruption"       │ │
│  │  • "supply shortage"                • "price surge"                   │ │
│  │  API: Reddit API ($0.24/1000)       Method: RSS parsing               │ │
│  │  Frequency: Daily                   Frequency: Daily                  │ │
│  │                                                                        │ │
│  │  B2B Marketplace Monitor            Industry Association Scraper      │ │
│  │  ─────────────────────              ─────────────────────────────     │ │
│  │  Sources:                           Sources:                          │ │
│  │  • TradeKey new listings            • Spice Exporters Association     │ │
│  │  • IndiaMART trending               • FICCI member lists              │ │
│  │  • Alibaba new products             • CII directories                 │ │
│  │  Data: New commodity listings       Data: Member commodities          │ │
│  │  Frequency: Daily                   Frequency: Quarterly              │ │
│  │                                                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 3.2.2 Scraper Implementation Pattern

```python
# Conceptual pattern for all scrapers
class BaseScraper:
    """
    Base class for all discovery scrapers.
    Each scraper must implement:
    - fetch_raw(): Get raw data from source
    - parse(): Convert to normalized records
    - validate(): Check data quality
    """

    source_name: str
    source_url: str
    data_format: str  # csv, excel, pdf, html
    update_frequency: str  # daily, weekly, monthly

    def execute(self, run_id: str) -> ScraperResult:
        # 1. Fetch raw data
        raw_data = self.fetch_raw()

        # 2. Store raw file
        raw_file_id = self.store_raw(run_id, raw_data)

        # 3. Parse to records
        records = self.parse(raw_data)

        # 4. Validate records
        valid_records, errors = self.validate(records)

        # 5. Return result
        return ScraperResult(
            run_id=run_id,
            source=self.source_name,
            raw_file_id=raw_file_id,
            records=valid_records,
            errors=errors
        )
```

### 3.3 Run-Based Processing Model

#### 3.3.1 Run Lifecycle

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          RUN STATE MACHINE                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                         ┌──────────────┐                                   │
│                         │   PENDING    │                                   │
│                         │ (created)    │                                   │
│                         └──────┬───────┘                                   │
│                                │                                           │
│                         Manual trigger                                     │
│                         or Cron schedule                                   │
│                                │                                           │
│                                ▼                                           │
│                         ┌──────────────┐                                   │
│                         │   RUNNING    │◀────────────────┐                 │
│                         │ (scraping)   │                 │                 │
│                         └──────┬───────┘                 │                 │
│                                │                         │                 │
│           ┌────────────────────┼────────────────────┐    │                 │
│           │                    │                    │    │                 │
│           ▼                    ▼                    ▼    │                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│                 │
│  │   SCORING    │───▶│  VALIDATING  │───▶│  COMPLETED   ││                 │
│  │ (algorithms) │    │  (LLM check) │    │  (ready)     ││                 │
│  └──────────────┘    └──────────────┘    └──────────────┘│                 │
│           │                    │                         │                 │
│           │                    │                         │                 │
│           ▼                    ▼                         │                 │
│  ┌──────────────────────────────────────────────────────┐│                 │
│  │                   FAILED                              ││                 │
│  │   (with error details and partial results)           │◀─ Retry         │
│  └──────────────────────────────────────────────────────┘                  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 Run Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `sources` | array | Which scrapers to execute | All active |
| `llm_detail_level` | enum | minimal/standard/comprehensive | standard |
| `score_thresholds` | object | Override niche scoring rules | System defaults |
| `skip_llm_validation` | boolean | Run without LLM enrichment | false |
| `priority` | enum | low/normal/high | normal |

### 3.4 Niche Scoring Algorithm

#### 3.4.1 Three-Rule Scoring System

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       NICHE SCORING ALGORITHM                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RULE 1: VOLUME THRESHOLD                                                  │
│  ════════════════════════                                                  │
│                                                                             │
│  Criteria: Annual export volume < 100,000 metric tons                      │
│  Rationale: Small markets are underserved by mainstream platforms          │
│                                                                             │
│  Scoring:                                                                   │
│  ├── Volume < 10,000 MT    → Score: 100 (micro-niche)                      │
│  ├── Volume < 50,000 MT    → Score: 75  (small niche)                      │
│  ├── Volume < 100,000 MT   → Score: 50  (niche)                            │
│  └── Volume >= 100,000 MT  → Score: 0   (mainstream, disqualified)         │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  RULE 2: PRICE VOLATILITY                                                  │
│  ════════════════════════                                                  │
│                                                                             │
│  Criteria: Price movement > 20% in trailing 12 months                      │
│  Rationale: High volatility = predictions matter more to traders           │
│                                                                             │
│  Calculation:                                                               │
│  volatility = (max_price - min_price) / avg_price * 100                    │
│                                                                             │
│  Scoring:                                                                   │
│  ├── Volatility > 50%    → Score: 100 (highly volatile)                    │
│  ├── Volatility > 35%    → Score: 75  (volatile)                           │
│  ├── Volatility > 20%    → Score: 50  (moderate volatility)                │
│  └── Volatility <= 20%   → Score: 0   (stable, no prediction value)        │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  RULE 3: EMERGING USE CASES                                                │
│  ══════════════════════════                                                │
│                                                                             │
│  Criteria: New applications mentioned in last 3 months                     │
│  Rationale: Emerging demand creates opportunity windows                    │
│                                                                             │
│  Signals (from supplementary scrapers):                                    │
│  ├── Reddit mentions with "new use" keywords                               │
│  ├── News articles about novel applications                                │
│  ├── B2B listings in new categories                                        │
│  └── Research publication mentions                                         │
│                                                                             │
│  Scoring:                                                                   │
│  ├── 5+ unique signals    → Score: 100 (strong emergence)                  │
│  ├── 3-4 unique signals   → Score: 75  (emerging)                          │
│  ├── 1-2 unique signals   → Score: 50  (early signals)                     │
│  └── 0 signals            → Score: 0   (no emergence detected)             │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  FINAL SCORE CALCULATION                                                   │
│  ═══════════════════════                                                   │
│                                                                             │
│  final_score = (rule1_score * 0.4) + (rule2_score * 0.35) + (rule3 * 0.25) │
│                                                                             │
│  Qualification:                                                            │
│  ├── Score >= 60   → NICHE CANDIDATE (requires admin review)               │
│  ├── Score 40-59   → WATCHLIST (track for future evaluation)               │
│  └── Score < 40    → NOT NICHE (excluded from pipeline)                    │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 LLM Validation Analysis (Admin-Only)

The LLM generates explanatory content for admin decision-making. This is **NOT** the user-facing market intelligence (Stage 4).

#### 3.5.1 LLM Analysis Output Structure

```json
{
  "commodity_id": "NC-2026-0042",
  "commodity_name": "Moringa Leaf Powder",
  "hs_code": "1211.90.90",

  "niche_validation": {
    "classification": "niche",
    "confidence": 0.87,
    "summary": "Moringa qualifies as niche due to low export volume, high price volatility, and emerging pharma applications.",

    "rule_analysis": {
      "volume_rule": {
        "met": true,
        "evidence": "Annual exports: 45,000 MT (below 100K threshold)",
        "data_source": "APEDA FY2025-26 report"
      },
      "volatility_rule": {
        "met": true,
        "evidence": "Price range: ₹180-₹310/kg (72% volatility)",
        "data_source": "Commodity price tracker"
      },
      "emergence_rule": {
        "met": true,
        "evidence": "8 signals detected: pharma formulations (3), superfood demand (2), cosmetics (3)",
        "data_sources": ["Reddit r/supplements", "FoodNavigator", "TradeKey listings"]
      }
    },

    "market_context": "Growing global demand for plant-based supplements. Key importers: USA, UAE, Germany. Supply concentrated in South India.",

    "risks": [
      "Seasonal availability affects supply consistency",
      "Quality certification requirements in EU/US markets"
    ],

    "recommendation": "APPROVE - Strong niche indicators with growing demand trajectory"
  },

  "llm_metadata": {
    "model": "claude-3-opus",
    "detail_level": "standard",
    "tokens_used": 1247,
    "generated_at": "2026-02-03T10:30:00Z"
  }
}
```

#### 3.5.2 Detail Level Configuration

| Level | Tokens (est.) | Cost (est.) | Content |
|-------|--------------|-------------|---------|
| **minimal** | 200-400 | ~$0.01 | Classification + one-line summary |
| **standard** | 800-1200 | ~$0.04 | Full analysis with evidence |
| **comprehensive** | 2000-3000 | ~$0.10 | Deep analysis + market context + competitor landscape |

### 3.6 Admin Approval Workflow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      ADMIN APPROVAL WORKFLOW                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. RUN COMPLETES                                                          │
│     └── Candidates generated with scores + LLM analysis                    │
│                                                                             │
│  2. ADMIN REVIEWS CANDIDATES                                               │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │  For each candidate, admin sees:                                │    │
│     │  • Commodity name, HS code                                      │    │
│     │  • Niche score breakdown (3 rules)                              │    │
│     │  • LLM analysis and recommendation                              │    │
│     │  • Source data links                                            │    │
│     │  • Historical data (if repeat candidate)                        │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  3. ADMIN ACTIONS                                                          │
│     ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│     │   APPROVE   │   │   REJECT    │   │  WATCHLIST  │                   │
│     │             │   │             │   │             │                   │
│     │ → Active    │   │ → Excluded  │   │ → Monitored │                   │
│     │   Niche     │   │   (reason   │   │   (future   │                   │
│     │             │   │   required) │   │   review)   │                   │
│     └─────────────┘   └─────────────┘   └─────────────┘                   │
│                                                                             │
│  4. CONSTRAINTS                                                            │
│     • Admins cannot add commodities not discovered by system               │
│     • Admins cannot modify scores or underlying data                       │
│     • All actions logged with timestamp and admin ID                       │
│     • Rejection requires mandatory reason selection                        │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.7 Database Entities (Stage 1)

#### 3.7.1 Entity Descriptions

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **discovery_runs** | Track each pipeline execution | run_id, trigger_type, status, started_at, completed_at, source_config, error_summary |
| **raw_data_files** | Immutable storage of source files | file_id, run_id, source_name, file_type, file_path, checksum, fetched_at, publish_date |
| **parsed_records** | Normalized commodity data | record_id, run_id, source_name, commodity_name, hs_code, volume, value, time_period, parse_errors |
| **niche_candidates** | Scored potential niches | candidate_id, run_id, commodity_name, hs_code, rule1_score, rule2_score, rule3_score, final_score, llm_analysis, status |
| **approved_commodities** | Active niche registry | commodity_id, candidate_id, approved_at, approved_by, is_active, deactivated_at, deactivated_reason |
| **admin_decisions** | Audit trail | decision_id, candidate_id, admin_id, action, reason, notes, decided_at |

#### 3.7.2 Entity Relationships

```
discovery_runs (1) ────────────────── (N) raw_data_files
       │
       │ (1)
       │
       └───────────────────────────── (N) parsed_records
       │
       │ (1)
       │
       └───────────────────────────── (N) niche_candidates
                                              │
                                              │ (1)
                                              │
                                              ├──── (1) approved_commodities
                                              │
                                              └──── (N) admin_decisions
```

### 3.8 API Endpoints (Stage 1)

#### 3.8.1 Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/niche/runs` | List all discovery runs with status |
| `GET` | `/admin/niche/runs/{run_id}` | Get run details, files, and candidates |
| `POST` | `/admin/niche/runs` | Trigger a new discovery run |
| `POST` | `/admin/niche/runs/{run_id}/retry` | Retry a failed run |
| `GET` | `/admin/niche/candidates` | List candidates (filterable by status) |
| `GET` | `/admin/niche/candidates/{id}` | Get candidate with full analysis |
| `POST` | `/admin/niche/candidates/{id}/approve` | Approve as active niche |
| `POST` | `/admin/niche/candidates/{id}/reject` | Reject with reason |
| `POST` | `/admin/niche/candidates/{id}/watchlist` | Add to watchlist |
| `GET` | `/admin/niche/approved` | List all approved commodities |
| `POST` | `/admin/niche/approved/{id}/deactivate` | Deactivate an approved niche |
| `GET` | `/admin/niche/raw-files/{file_id}/download` | Download raw source file |

#### 3.8.2 Internal Endpoints (Worker Communication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/internal/niche/runs/{run_id}/scraper-complete` | Scraper signals completion |
| `POST` | `/internal/niche/runs/{run_id}/scoring-complete` | Scoring signals completion |
| `POST` | `/internal/niche/runs/{run_id}/llm-complete` | LLM validation complete |

---

## 4. Stage 2: Buyer Discovery System

### 4.1 Overview

The Buyer Discovery System identifies potential buyers for approved niche commodities by scraping B2B marketplaces and other public sources. This is a **NEW** system, not an extension of the existing `link_predictor` service.

### 4.2 Data Sources

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        BUYER DISCOVERY SOURCES                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PRIMARY SOURCES (B2B Marketplaces)                                        │
│  ──────────────────────────────────                                        │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │   TradeKey    │  │   IndiaMART   │  │   Alibaba     │                   │
│  │               │  │               │  │               │                   │
│  │ • Buyer RFQs  │  │ • Buying      │  │ • RFQ section │                   │
│  │ • Want-to-buy │  │   leads       │  │ • Buyer       │                   │
│  │   listings    │  │ • Requirement │  │   inquiries   │                   │
│  │ • Company     │  │   posts       │  │ • Company     │                   │
│  │   profiles    │  │               │  │   profiles    │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
│                                                                             │
│  SECONDARY SOURCES                                                         │
│  ─────────────────                                                         │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │  ExportersIndia│ │  Company      │  │  Industry     │                   │
│  │               │  │  Websites     │  │  Events       │                   │
│  │ • Buyer       │  │               │  │               │                   │
│  │   directory   │  │ • Contact     │  │ • LinkedIn    │                   │
│  │               │  │   pages       │  │   events      │                   │
│  │               │  │ • Sourcing    │  │ • FICCI/CII   │                   │
│  │               │  │   team info   │  │   listings    │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
│                                                                             │
│  FUTURE SOURCES (Phase 2+)                                                 │
│  ─────────────────────────                                                 │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  LinkedIn Data Providers (Apollo.io, ZoomInfo, Lusha)                  │ │
│  │  • Procurement Manager profiles                                        │ │
│  │  • Supply Chain Manager contacts                                       │ │
│  │  • Company decision-makers                                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Contact Extraction Pipeline

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     BUYER CONTACT EXTRACTION PIPELINE                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT: Approved commodity from Stage 1                                    │
│                                                                             │
│  STEP 1: SEARCH GENERATION                                                 │
│  ─────────────────────────                                                 │
│  For commodity "Moringa Leaf Powder":                                      │
│  • Query variations: "moringa", "moringa powder", "moringa extract"        │
│  • Category filters: health supplements, pharma ingredients, food          │
│  • Geographic filters: target import markets                               │
│                                                                             │
│  STEP 2: SCRAPE EXECUTION                                                  │
│  ────────────────────────                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Parallel scraping across sources:                                   │  │
│  │                                                                      │  │
│  │  TradeKey: GET /search?type=buyer&keyword=moringa                   │  │
│  │  IndiaMART: GET /search/buying-leads?q=moringa                      │  │
│  │  Alibaba: GET /rfq/search?keyword=moringa                           │  │
│  │                                                                      │  │
│  │  Rate limiting: 1 request/2 seconds per source                      │  │
│  │  Pagination: Up to 10 pages per search                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  STEP 3: DATA EXTRACTION                                                   │
│  ───────────────────────                                                   │
│  For each listing:                                                         │
│  • Company name                                                            │
│  • Contact person (if available)                                           │
│  • Email (regex: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})          │
│  • Phone (regex: international formats)                                    │
│  • Location (country, city)                                                │
│  • Requirement details                                                     │
│  • Post date                                                               │
│                                                                             │
│  STEP 4: DEDUPLICATION                                                     │
│  ─────────────────────                                                     │
│  • Match by email (exact)                                                  │
│  • Match by company name (fuzzy, >85% similarity)                          │
│  • Merge duplicate records, keep most complete data                        │
│                                                                             │
│  STEP 5: QUALITY SCORING                                                   │
│  ───────────────────────                                                   │
│  Score 0-100 based on:                                                     │
│  • Email present: +30                                                      │
│  • Phone present: +20                                                      │
│  • Contact name present: +15                                               │
│  • Recent post (<30 days): +20                                             │
│  • Verified profile: +15                                                   │
│                                                                             │
│  OUTPUT: Buyer contacts with quality scores                                │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Database Entities (Stage 2)

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **buyer_scrape_jobs** | Track buyer discovery jobs | job_id, commodity_id, status, started_at, sources_config, contacts_found |
| **buyer_contacts** | Discovered buyer information | contact_id, job_id, commodity_id, company_name, contact_name, email, phone, location, quality_score, source |
| **buyer_requirements** | Specific buying needs | requirement_id, contact_id, commodity_name, quantity, specifications, post_date |
| **contact_sources** | Track which sources provided data | source_id, contact_id, source_name, source_url, scraped_at |

### 4.5 API Endpoints (Stage 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/niche/buyers/discover` | Trigger buyer discovery for commodity |
| `GET` | `/admin/niche/buyers/jobs` | List buyer scrape jobs |
| `GET` | `/admin/niche/buyers/jobs/{job_id}` | Get job details and results |
| `GET` | `/admin/niche/buyers/contacts` | List discovered buyers (filterable) |
| `GET` | `/admin/niche/buyers/contacts/{id}` | Get buyer contact details |
| `POST` | `/admin/niche/buyers/contacts/export` | Export contacts to CSV |

---

## 5. Stage 3: Seller Discovery System

### 5.1 Overview

The Seller Discovery System identifies suppliers and exporters for approved niche commodities. It focuses on different sources than Stage 2, targeting cooperatives, export associations, and government exporter databases.

### 5.2 Data Sources

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        SELLER DISCOVERY SOURCES                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GOVERNMENT EXPORTER DATABASES (High Quality)                              │
│  ────────────────────────────────────────────                              │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │   APEDA       │  │  Spice Board  │  │   DGFT        │                   │
│  │  Exporters    │  │  Registered   │  │  Registered   │                   │
│  │               │  │  Exporters    │  │  Exporters    │                   │
│  │ • Registered  │  │               │  │               │                   │
│  │   exporter    │  │ • License     │  │ • IEC holders │                   │
│  │   database    │  │   holders     │  │ • Export      │                   │
│  │ • Product     │  │ • Product     │  │   history     │                   │
│  │   categories  │  │   specialties │  │               │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
│                                                                             │
│  COOPERATIVE & ASSOCIATION SOURCES                                         │
│  ─────────────────────────────────                                         │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │    NAFED      │  │ State Coops   │  │   Industry    │                   │
│  │   Members     │  │               │  │ Associations  │                   │
│  │               │  │               │  │               │                   │
│  │ • Agricultural│  │ • State       │  │ • Spice       │                   │
│  │   cooperative │  │   marketing   │  │   Exporters   │                   │
│  │   directory   │  │   federations │  │   Association │                   │
│  │               │  │               │  │ • Tea/Coffee  │                   │
│  │               │  │               │  │   Exporters   │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
│                                                                             │
│  B2B MARKETPLACES (Supplier Listings)                                      │
│  ────────────────────────────────────                                      │
│                                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │   TradeKey    │  │   IndiaMART   │  │   Alibaba     │                   │
│  │   Suppliers   │  │   Sellers     │  │   Suppliers   │                   │
│  │               │  │               │  │               │                   │
│  │ • Supplier    │  │ • Seller      │  │ • India-based │                   │
│  │   profiles    │  │   profiles    │  │   suppliers   │                   │
│  │ • Product     │  │ • Product     │  │ • Export      │                   │
│  │   catalogs    │  │   listings    │  │   capability  │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Seller Extraction Pipeline

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     SELLER CONTACT EXTRACTION PIPELINE                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT: Approved commodity from Stage 1                                    │
│                                                                             │
│  STEP 1: SOURCE PRIORITIZATION                                             │
│  ─────────────────────────────                                             │
│  Priority order (by data quality):                                         │
│  1. Government exporter databases (verified)                               │
│  2. Industry association members (verified)                                │
│  3. B2B marketplace suppliers (unverified)                                 │
│                                                                             │
│  STEP 2: GOVERNMENT DATABASE EXTRACTION                                    │
│  ──────────────────────────────────────                                    │
│  • Search APEDA registered exporters by commodity category                 │
│  • Match HS codes to exporter registrations                                │
│  • Extract: Company, registration number, products, contact                │
│                                                                             │
│  STEP 3: ASSOCIATION MEMBER EXTRACTION                                     │
│  ─────────────────────────────────────                                     │
│  • Scrape member directories                                               │
│  • Match by commodity specialty                                            │
│  • Extract: Company, member ID, contact, specializations                   │
│                                                                             │
│  STEP 4: B2B SUPPLIER EXTRACTION                                           │
│  ───────────────────────────────                                           │
│  • Search marketplaces for suppliers                                       │
│  • Filter by: product match, India location, export capability             │
│  • Extract: Company, products, contact, ratings                            │
│                                                                             │
│  STEP 5: DATA ENRICHMENT                                                   │
│  ───────────────────────                                                   │
│  • Company website scraping for additional contacts                        │
│  • LinkedIn company page (manual/future automation)                        │
│  • Cross-reference multiple sources                                        │
│                                                                             │
│  STEP 6: QUALITY SCORING                                                   │
│  ───────────────────────                                                   │
│  Score 0-100 based on:                                                     │
│  • Government registered: +30                                              │
│  • Association member: +20                                                 │
│  • Email verified: +20                                                     │
│  • Website present: +15                                                    │
│  • Multiple source corroboration: +15                                      │
│                                                                             │
│  OUTPUT: Seller contacts with quality scores and source verification       │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Database Entities (Stage 3)

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **seller_scrape_jobs** | Track seller discovery jobs | job_id, commodity_id, status, started_at, sources_config, contacts_found |
| **seller_contacts** | Discovered seller information | contact_id, job_id, commodity_id, company_name, registration_number, contact_name, email, phone, location, quality_score |
| **seller_capabilities** | Export capabilities | capability_id, contact_id, product_categories, certifications, export_countries, capacity |
| **seller_verifications** | Source verification records | verification_id, contact_id, source_type, source_name, verification_status, verified_at |

### 5.5 API Endpoints (Stage 3)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/niche/sellers/discover` | Trigger seller discovery for commodity |
| `GET` | `/admin/niche/sellers/jobs` | List seller scrape jobs |
| `GET` | `/admin/niche/sellers/jobs/{job_id}` | Get job details and results |
| `GET` | `/admin/niche/sellers/contacts` | List discovered sellers (filterable) |
| `GET` | `/admin/niche/sellers/contacts/{id}` | Get seller contact details |
| `POST` | `/admin/niche/sellers/contacts/export` | Export contacts to CSV |
| `GET` | `/admin/niche/sellers/verified` | List government-verified sellers only |

---

## 6. Stage 4: Market Intelligence System

### 6.1 Overview

The Market Intelligence System provides ongoing value to paying users (Gold Buyers) through weekly prediction reports. This is a **separate system** from the admin-facing LLM validation in Stage 1.

### 6.2 Data Aggregation Sources

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   MARKET INTELLIGENCE DATA SOURCES                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DATA AGGREGATION LAYER                            │   │
│  │                                                                      │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │   │
│  │  │   GOVT    │ │   NEWS    │ │   B2B     │ │ HISTORICAL│            │   │
│  │  │   DATA    │ │ SENTIMENT │ │  ACTIVITY │ │  PATTERNS │            │   │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘            │   │
│  │        │             │             │             │                   │   │
│  │        └─────────────┼─────────────┼─────────────┘                   │   │
│  │                      │             │                                 │   │
│  │                      ▼             ▼                                 │   │
│  │              ┌───────────────────────────┐                           │   │
│  │              │    UNIFIED DATA STORE     │                           │   │
│  │              │  ─────────────────────    │                           │   │
│  │              │  Per commodity:           │                           │   │
│  │              │  • Price history          │                           │   │
│  │              │  • Volume trends          │                           │   │
│  │              │  • Sentiment scores       │                           │   │
│  │              │  • Supply indicators      │                           │   │
│  │              │  • Demand signals         │                           │   │
│  │              └───────────────────────────┘                           │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SOURCE DETAILS                                                            │
│  ──────────────                                                            │
│                                                                             │
│  GOVERNMENT DATA                 NEWS & SENTIMENT                          │
│  • APEDA monthly reports         • Google News (commodity + "price")       │
│  • DGFT export statistics        • FoodNavigator articles                  │
│  • Commodity board updates       • Industry press releases                 │
│  • Policy announcements          • Reddit community sentiment              │
│                                                                             │
│  B2B MARKETPLACE ACTIVITY        HISTORICAL PATTERNS                       │
│  • TradeKey inquiry volume       • 3-year price history                    │
│  • IndiaMART buyer activity      • Seasonal demand cycles                  │
│  • Alibaba RFQ trends            • Festival/event impacts                  │
│  • New supplier listings         • Weather correlation data                │
│                                                                             │
│  SUPPLY CHAIN SIGNALS                                                      │
│  • Shipping rate changes                                                   │
│  • Container availability                                                  │
│  • Weather in production regions                                           │
│  • Harvest/production calendars                                            │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Weekly Prediction Generation

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   WEEKLY PREDICTION PIPELINE                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SCHEDULE: Every Sunday at 00:00 UTC                                       │
│                                                                             │
│  STEP 1: DATA COLLECTION (Saturday)                                        │
│  ─────────────────────────────────                                         │
│  • Aggregate government data updates from past week                        │
│  • Collect news articles and compute sentiment scores                      │
│  • Capture B2B marketplace activity metrics                                │
│  • Update historical pattern analysis                                      │
│                                                                             │
│  STEP 2: ANALYSIS PREPARATION                                              │
│  ────────────────────────────                                              │
│  For each approved niche commodity:                                        │
│  • Compile data package with all relevant signals                          │
│  • Identify any anomalies or significant changes                           │
│  • Flag commodities with strong signals (positive or negative)             │
│                                                                             │
│  STEP 3: LLM PREDICTION GENERATION                                         │
│  ─────────────────────────────────                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  LLM Prompt Template:                                                │  │
│  │                                                                      │  │
│  │  "You are a commodity market analyst. Based on the following data   │  │
│  │   for {commodity_name}, provide a prediction for the next 4 weeks:  │  │
│  │                                                                      │  │
│  │   Government Data: {govt_data_summary}                              │  │
│  │   Price Trend: {price_history_30_days}                              │  │
│  │   News Sentiment: {sentiment_score} ({sentiment_summary})           │  │
│  │   Market Activity: {b2b_activity_summary}                           │  │
│  │   Seasonal Pattern: {historical_pattern}                            │  │
│  │                                                                      │  │
│  │   Provide:                                                          │  │
│  │   1. Price direction prediction (up/down/stable)                    │  │
│  │   2. Confidence level (0-100%)                                      │  │
│  │   3. Recommended action (buy/sell/hold)                             │  │
│  │   4. Key factors driving prediction                                 │  │
│  │   5. Risk factors to monitor"                                       │  │
│  │                                                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  STEP 4: REPORT GENERATION                                                 │
│  ─────────────────────────                                                 │
│  Output structure per commodity:                                           │
│  • Headline prediction (e.g., "Saffron: Prices expected to drop 15%")     │
│  • Confidence score (e.g., 87%)                                            │
│  • Action recommendation (e.g., "BUY NOW - prices rising next month")     │
│  • Supporting evidence (bullet points)                                     │
│  • Risk warnings (if any)                                                  │
│                                                                             │
│  STEP 5: QUALITY ASSURANCE                                                 │
│  ─────────────────────────                                                 │
│  • Automated checks for prediction consistency                             │
│  • Flag extreme predictions for manual review                              │
│  • Validate confidence scores are calibrated                               │
│                                                                             │
│  STEP 6: DELIVERY                                                          │
│  ────────────                                                              │
│  • Update user dashboard (Sunday AM)                                       │
│  • Send email digest to subscribed users                                   │
│  • Store prediction for accuracy tracking                                  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Prediction Output Structure

```json
{
  "prediction_id": "PRED-2026-W05-MORINGA",
  "commodity": {
    "id": "NC-2026-0042",
    "name": "Moringa Leaf Powder",
    "hs_code": "1211.90.90"
  },
  "prediction_period": {
    "start": "2026-02-03",
    "end": "2026-03-02"
  },

  "price_forecast": {
    "direction": "up",
    "expected_change_percent": 12,
    "confidence": 78,
    "current_price": {
      "value": 245,
      "currency": "INR",
      "unit": "kg"
    },
    "predicted_price": {
      "low": 260,
      "mid": 274,
      "high": 290,
      "currency": "INR",
      "unit": "kg"
    }
  },

  "recommendation": {
    "action": "buy",
    "urgency": "medium",
    "headline": "BUY: Moringa prices set to rise 12% over next 4 weeks",
    "rationale": "Growing demand from US supplement market combined with delayed harvest in South India regions."
  },

  "key_factors": [
    {
      "factor": "Demand surge",
      "impact": "positive",
      "detail": "3 major US supplement brands announced moringa-based products"
    },
    {
      "factor": "Supply constraint",
      "impact": "positive",
      "detail": "Karnataka harvest delayed by 2 weeks due to unseasonal rains"
    },
    {
      "factor": "Export policy",
      "impact": "neutral",
      "detail": "No policy changes expected in prediction window"
    }
  ],

  "risk_warnings": [
    {
      "risk": "Weather dependency",
      "severity": "medium",
      "detail": "Extended monsoon could further impact harvest timelines"
    }
  ],

  "data_quality": {
    "govt_data_freshness": "7 days",
    "news_articles_analyzed": 23,
    "b2b_signals_captured": 156,
    "confidence_calibration": "verified"
  },

  "metadata": {
    "generated_at": "2026-02-02T23:45:00Z",
    "model": "claude-3-opus",
    "version": "1.0"
  }
}
```

### 6.5 User Dashboard Integration

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    BREYUS MARKET INSIGHT DASHBOARD                          │
│                         (Gold Buyers Only)                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  WEEKLY PREDICTIONS - Week of Feb 3, 2026                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  🟢 MORINGA LEAF POWDER                           ↑ +12% | 78% conf  │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  BUY NOW - Growing US supplement demand + delayed harvest            │   │
│  │  Current: ₹245/kg → Predicted: ₹274/kg                              │   │
│  │  [View Full Analysis]                                                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  🔴 SAFFRON                                       ↓ -15% | 92% conf  │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  WAIT TO BUY - Post-festival demand drop incoming                    │   │
│  │  Current: ₹425/g → Predicted: ₹361/g                                │   │
│  │  [View Full Analysis]                                                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  🟡 CARDAMOM                                      → 0% | 65% conf    │   │
│  │  ─────────────────────────────────────────────────────────────────   │   │
│  │  HOLD - Market stable, no significant movement expected              │   │
│  │  Current: ₹1,850/kg → Predicted: ₹1,850/kg                          │   │
│  │  [View Full Analysis]                                                │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  📊 PREDICTION ACCURACY (Last 12 Months)                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Direction Accuracy: 89%  |  Price Range Accuracy: 76%               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.6 Delivery Channels

| Channel | Audience | Content | Frequency |
|---------|----------|---------|-----------|
| **Dashboard** | Gold Buyers | Full predictions with charts | Weekly (Sunday) |
| **Email Digest** | Subscribed users | Summary + top 3 predictions | Weekly (Monday AM) |
| **Push Notifications** | Mobile app users | High-confidence alerts only | As needed |

### 6.7 Database Entities (Stage 4)

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **prediction_jobs** | Track prediction generation | job_id, week_start, status, commodities_processed, generated_at |
| **commodity_predictions** | Weekly predictions per commodity | prediction_id, commodity_id, week_start, direction, confidence, price_forecast, recommendation, key_factors, risks |
| **prediction_data_sources** | Data used for each prediction | source_id, prediction_id, source_type, data_summary, freshness_hours |
| **prediction_accuracy** | Track prediction performance | accuracy_id, prediction_id, actual_direction, actual_price, accuracy_score, evaluated_at |
| **user_prediction_views** | Track user engagement | view_id, user_id, prediction_id, viewed_at, action_taken |
| **prediction_deliveries** | Track delivery status | delivery_id, prediction_id, user_id, channel, delivered_at, opened_at |

### 6.8 API Endpoints (Stage 4)

#### 6.8.1 Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/niche/predictions/generate` | Trigger prediction generation |
| `GET` | `/admin/niche/predictions/jobs` | List prediction jobs |
| `GET` | `/admin/niche/predictions/accuracy` | View accuracy metrics |
| `POST` | `/admin/niche/predictions/{id}/publish` | Publish prediction to users |

#### 6.8.2 User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/market-insight/predictions` | Get current week's predictions |
| `GET` | `/api/market-insight/predictions/{commodity_id}` | Get specific commodity prediction |
| `GET` | `/api/market-insight/history/{commodity_id}` | Get historical predictions |
| `GET` | `/api/market-insight/accuracy` | View prediction track record |
| `POST` | `/api/market-insight/subscribe` | Subscribe to email updates |

---

## 7. Folder Structure

### 7.1 AI_NEW Repository Organization

```
AI_NEW/
├── server/
│   ├── main.py                         # FastAPI application entry
│   ├── config.py                       # Configuration management
│   │
│   ├── services/                       # EXISTING AI services
│   │   ├── commodity_search.py         # (existing)
│   │   ├── link_predictor.py           # (existing)
│   │   ├── market_analyzer.py          # (existing)
│   │   ├── embedding_service.py        # (existing)
│   │   └── ...
│   │
│   └── niche/                          # NEW: Niche Commodity Finder
│       │
│       ├── __init__.py
│       ├── router.py                   # FastAPI router for /niche/* endpoints
│       │
│       ├── discovery/                  # STAGE 1: Commodity Discovery
│       │   ├── __init__.py
│       │   ├── run_manager.py          # Run lifecycle management
│       │   │
│       │   ├── scrapers/               # Data source scrapers
│       │   │   ├── __init__.py
│       │   │   ├── base_scraper.py     # Abstract base class
│       │   │   ├── apeda_scraper.py    # APEDA government data
│       │   │   ├── dgft_scraper.py     # DGFT trade data
│       │   │   ├── spice_board_scraper.py
│       │   │   ├── reddit_scraper.py   # Reddit API integration
│       │   │   ├── news_scraper.py     # RSS/news aggregation
│       │   │   └── b2b_monitor.py      # Marketplace new listings
│       │   │
│       │   ├── scoring/                # Niche scoring algorithms
│       │   │   ├── __init__.py
│       │   │   ├── niche_scorer.py     # 3-rule scoring engine
│       │   │   ├── volume_analyzer.py
│       │   │   ├── volatility_calculator.py
│       │   │   └── emergence_detector.py
│       │   │
│       │   └── validation/             # LLM validation (admin-only)
│       │       ├── __init__.py
│       │       ├── llm_validator.py    # LLM integration
│       │       └── prompts.py          # Prompt templates
│       │
│       ├── contacts/                   # STAGE 2 & 3: Contact Discovery
│       │   ├── __init__.py
│       │   │
│       │   ├── scrapers/               # B2B marketplace scrapers
│       │   │   ├── __init__.py
│       │   │   ├── base_contact_scraper.py
│       │   │   ├── tradekey_scraper.py
│       │   │   ├── indiamart_scraper.py
│       │   │   ├── alibaba_scraper.py
│       │   │   ├── nafed_scraper.py    # Cooperative data
│       │   │   └── association_scraper.py
│       │   │
│       │   ├── extractors/             # Contact extraction logic
│       │   │   ├── __init__.py
│       │   │   ├── email_extractor.py
│       │   │   ├── phone_extractor.py
│       │   │   └── company_normalizer.py
│       │   │
│       │   ├── buyer_discovery.py      # Stage 2 orchestration
│       │   ├── seller_discovery.py     # Stage 3 orchestration
│       │   └── quality_scorer.py       # Contact quality scoring
│       │
│       └── intelligence/               # STAGE 4: Market Intelligence
│           ├── __init__.py
│           ├── data_aggregator.py      # Multi-source data collection
│           ├── prediction_generator.py # Weekly prediction pipeline
│           ├── report_builder.py       # Report formatting
│           ├── delivery_service.py     # Dashboard + email delivery
│           ├── accuracy_tracker.py     # Prediction accuracy monitoring
│           │
│           └── prompts/                # LLM prompts for predictions
│               ├── __init__.py
│               └── prediction_prompts.py
│
├── pipeline/
│   ├── ...                             # Existing pipeline scripts
│   │
│   └── niche/                          # NEW: Niche pipeline scripts
│       ├── run_discovery.py            # Manual discovery trigger
│       ├── run_contact_scrape.py       # Contact discovery trigger
│       └── run_predictions.py          # Prediction generation trigger
│
├── workers/                            # Background workers
│   ├── ...                             # Existing workers
│   │
│   └── niche/                          # NEW: Niche workers
│       ├── discovery_worker.py         # Stage 1 background jobs
│       ├── contact_worker.py           # Stage 2/3 background jobs
│       └── prediction_worker.py        # Stage 4 background jobs
│
├── shared/
│   └── db/
│       ├── schema.sql                  # Existing schema
│       └── niche_schema.sql            # NEW: Niche-specific tables
│
└── tests/
    └── niche/                          # NEW: Niche module tests
        ├── test_discovery.py
        ├── test_scoring.py
        ├── test_contacts.py
        └── test_predictions.py
```

### 7.2 Backend (NestJS) Changes

```
backend/src/
├── admin/
│   └── niche/                          # NEW: Admin niche management
│       ├── niche.module.ts
│       ├── niche.controller.ts         # Admin endpoints
│       ├── niche.service.ts            # Business logic
│       └── dto/
│           ├── run-config.dto.ts
│           ├── candidate-decision.dto.ts
│           └── ...
│
└── ai/
    └── niche/                          # NEW: User-facing niche features
        ├── niche-insight.module.ts
        ├── niche-insight.controller.ts # User prediction endpoints
        └── niche-insight.service.ts
```

### 7.3 Admin Portal Changes

```
admin-portal/src/features/
└── niche/                              # NEW: Niche management feature
    ├── index.ts
    ├── hooks/
    │   ├── useRuns.ts
    │   ├── useCandidates.ts
    │   └── usePredictions.ts
    ├── pages/
    │   ├── NicheRunsPage.tsx           # Run management
    │   ├── NicheRunDetailPage.tsx      # Run details + candidates
    │   ├── NicheCandidatesPage.tsx     # Candidate review queue
    │   ├── NicheApprovedPage.tsx       # Approved registry
    │   ├── NicheBuyersPage.tsx         # Buyer contacts
    │   ├── NicheSellersPage.tsx        # Seller contacts
    │   └── NichePredictionsPage.tsx    # Prediction management
    ├── components/
    │   ├── RunCard.tsx
    │   ├── CandidateCard.tsx
    │   ├── ScoreBreakdown.tsx
    │   ├── LLMAnalysisPanel.tsx
    │   └── ...
    └── types/
        └── index.ts
```

---

## 8. Integration Points

### 8.1 NestJS Backend Integration

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    NESTJS ↔ AI_NEW INTEGRATION                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ADMIN OPERATIONS (via admin-niche.service.ts)                             │
│  ────────────────────────────────────────────                              │
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │   Admin Portal      │────────▶│   NestJS Backend    │                   │
│  │   (React)           │  REST   │   /admin/niche/*    │                   │
│  └─────────────────────┘         └──────────┬──────────┘                   │
│                                             │                               │
│                                   HTTP calls to AI_NEW                      │
│                                             │                               │
│                                             ▼                               │
│                                  ┌─────────────────────┐                   │
│                                  │     AI_NEW          │                   │
│                                  │   /niche/*          │                   │
│                                  └─────────────────────┘                   │
│                                                                             │
│  Endpoints proxied:                                                        │
│  • GET/POST /runs → AI_NEW /niche/runs                                    │
│  • GET/POST /candidates → AI_NEW /niche/candidates                        │
│  • GET/POST /buyers → AI_NEW /niche/buyers                                │
│  • GET/POST /sellers → AI_NEW /niche/sellers                              │
│  • GET/POST /predictions → AI_NEW /niche/predictions                      │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  USER OPERATIONS (via niche-insight.service.ts)                            │
│  ──────────────────────────────────────────────                            │
│                                                                             │
│  ┌─────────────────────┐         ┌─────────────────────┐                   │
│  │   User Frontend     │────────▶│   NestJS Backend    │                   │
│  │   (React)           │  REST   │   /api/market-insight│                  │
│  └─────────────────────┘         └──────────┬──────────┘                   │
│                                             │                               │
│                           Fetch predictions from AI_NEW                     │
│                           + Enrich with user subscription data              │
│                                             │                               │
│                                             ▼                               │
│                                  ┌─────────────────────┐                   │
│                                  │     AI_NEW          │                   │
│                                  │   /niche/predictions│                   │
│                                  └─────────────────────┘                   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 MongoDB Read Access

The AI_NEW system needs read-only access to MongoDB for data enrichment:

| Data | Purpose | Access Pattern |
|------|---------|----------------|
| User profiles | Subscription validation | By user_id |
| Company profiles | Contact enrichment | By company_id |
| Product data | Commodity validation | By HS code / name |

### 8.3 Authentication Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       AUTHENTICATION FLOW                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ADMIN ACCESS                                                              │
│  ────────────                                                              │
│  1. Admin authenticates via NestJS /admin/auth/login                       │
│  2. Session token stored in cookie                                         │
│  3. NestJS validates token on each request                                 │
│  4. NestJS includes admin_id in calls to AI_NEW                           │
│  5. AI_NEW logs admin_id for audit trail                                  │
│                                                                             │
│  USER ACCESS                                                               │
│  ───────────                                                               │
│  1. User authenticates via NestJS /auth/login                              │
│  2. JWT token stored in cookie                                             │
│  3. NestJS validates token + checks Gold subscription                      │
│  4. Only Gold subscribers can access /api/market-insight                   │
│  5. NestJS fetches predictions from AI_NEW                                │
│                                                                             │
│  AI_NEW INTERNAL AUTH                                                      │
│  ────────────────────                                                      │
│  • AI_NEW accepts requests only from NestJS (API key validation)           │
│  • Internal endpoints require X-Internal-Key header                        │
│  • Worker-to-API communication uses shared secret                          │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Scheduling & Automation

### 9.1 Cron Job Definitions

| Job | Schedule | Description | Trigger |
|-----|----------|-------------|---------|
| **Discovery Run** | Weekly (Sunday 00:00 UTC) | Execute full commodity discovery pipeline | Automatic + Manual |
| **Buyer Scrape** | Daily (02:00 UTC) | Update buyer contacts for approved commodities | Automatic |
| **Seller Scrape** | Daily (04:00 UTC) | Update seller contacts for approved commodities | Automatic |
| **Data Aggregation** | Daily (06:00 UTC) | Collect market data for predictions | Automatic |
| **Prediction Generation** | Weekly (Sunday 12:00 UTC) | Generate weekly predictions | Automatic |
| **Accuracy Evaluation** | Weekly (Saturday 23:00 UTC) | Evaluate previous week's predictions | Automatic |

### 9.2 Manual Trigger Mechanisms

| Trigger | Endpoint | Access | Use Case |
|---------|----------|--------|----------|
| Discovery Run | `POST /admin/niche/runs` | Admin | Test run, urgent update |
| Buyer Discovery | `POST /admin/niche/buyers/discover` | Admin | New commodity approved |
| Seller Discovery | `POST /admin/niche/sellers/discover` | Admin | New commodity approved |
| Prediction Generation | `POST /admin/niche/predictions/generate` | Admin | Manual refresh |

### 9.3 Job Monitoring

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         JOB MONITORING                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MONITORING DASHBOARD (Admin Portal)                                       │
│  ───────────────────────────────────                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  JOB STATUS - Last 24 Hours                                         │   │
│  │                                                                      │   │
│  │  Discovery Run      ✅ Completed   02:45:32   147 candidates        │   │
│  │  Buyer Scrape       ✅ Completed   04:12:18   1,247 contacts        │   │
│  │  Seller Scrape      ✅ Completed   06:23:45   892 contacts          │   │
│  │  Data Aggregation   ✅ Completed   08:01:22   All sources updated   │   │
│  │  Prediction Gen     🔄 Running     12:15:00   Processing...         │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ALERTING                                                                  │
│  ────────                                                                  │
│  • Job failure → Slack notification to #breyus-alerts                     │
│  • Job timeout (>2 hours) → Email to admin team                           │
│  • Data quality issues → Dashboard warning badge                          │
│                                                                             │
│  METRICS TRACKED                                                           │
│  ───────────────                                                           │
│  • Job duration                                                            │
│  • Records processed                                                       │
│  • Error count                                                             │
│  • Data freshness                                                          │
│  • API call counts (rate limiting)                                         │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Security & Compliance

### 10.1 Data Handling

| Data Type | Sensitivity | Storage | Retention |
|-----------|-------------|---------|-----------|
| Government trade data | Public | PostgreSQL | Indefinite |
| Scraped contact data | Medium | PostgreSQL (encrypted columns) | 2 years |
| User subscription data | High | MongoDB (encrypted) | Account lifetime |
| LLM prompts/responses | Low | PostgreSQL | 90 days |
| Prediction reports | Low | PostgreSQL + CDN | Indefinite |

### 10.2 Rate Limiting

| Source | Rate Limit | Implementation |
|--------|------------|----------------|
| APEDA/DGFT | 1 req/5 sec | Request queue |
| TradeKey | 1 req/3 sec | Selenium with delays |
| IndiaMART | 1 req/3 sec | Selenium with delays |
| Alibaba | 1 req/5 sec | API rate limiting |
| Reddit API | 60 req/min | API quota management |
| LLM APIs | Per provider limits | Token budgeting |

### 10.3 Compliance Considerations

| Area | Consideration | Mitigation |
|------|---------------|------------|
| **Data Scraping** | Terms of service | Respect robots.txt, rate limits |
| **Contact Data** | Privacy regulations | Only collect publicly listed contacts |
| **Email Outreach** | CAN-SPAM, DPDP Act | Opt-out mechanisms, consent tracking |
| **Prediction Accuracy** | User reliance | Clear disclaimers, confidence levels |
| **Data Retention** | GDPR-style rights | User data export, deletion capabilities |

### 10.4 Security Measures

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       SECURITY ARCHITECTURE                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NETWORK SECURITY                                                          │
│  ────────────────                                                          │
│  • AI_NEW only accessible from NestJS backend (internal network)           │
│  • No direct public access to AI_NEW endpoints                             │
│  • All inter-service communication over HTTPS                              │
│                                                                             │
│  AUTHENTICATION                                                            │
│  ──────────────                                                            │
│  • Admin: Session-based with MFA (future)                                  │
│  • User: JWT with refresh tokens                                           │
│  • Internal: API keys rotated monthly                                      │
│                                                                             │
│  DATA PROTECTION                                                           │
│  ───────────────                                                           │
│  • Contact emails/phones: AES-256 encryption at rest                       │
│  • API keys: Hashed storage                                                │
│  • Audit logs: Append-only, immutable                                      │
│                                                                             │
│  INPUT VALIDATION                                                          │
│  ────────────────                                                          │
│  • All inputs sanitized before database operations                         │
│  • Parameterized queries (no raw SQL)                                      │
│  • File upload validation (type, size, content)                            │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Implementation Phases

### 11.1 Phase Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      IMPLEMENTATION ROADMAP                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: FOUNDATION (Weeks 1-2)                                           │
│  ───────────────────────────────                                           │
│  ☐ Create niche/ folder structure in AI_NEW                               │
│  ☐ Implement PostgreSQL schema for niche tables                            │
│  ☐ Set up run management system                                            │
│  ☐ Create admin portal feature module skeleton                             │
│  ☐ Implement basic CRUD endpoints                                          │
│                                                                             │
│  PHASE 2: STAGE 1 - DISCOVERY (Weeks 3-5)                                  │
│  ────────────────────────────────────────                                  │
│  ☐ Build APEDA scraper                                                     │
│  ☐ Build DGFT scraper                                                      │
│  ☐ Build supplementary scrapers (Reddit, News)                             │
│  ☐ Implement 3-rule niche scoring algorithm                                │
│  ☐ Integrate LLM validation                                                │
│  ☐ Build admin approval workflow UI                                        │
│  ☐ End-to-end testing                                                      │
│                                                                             │
│  PHASE 3: STAGE 2 & 3 - CONTACT DISCOVERY (Weeks 6-8)                      │
│  ─────────────────────────────────────────────────────                     │
│  ☐ Build TradeKey scraper                                                  │
│  ☐ Build IndiaMART scraper                                                 │
│  ☐ Build Alibaba scraper                                                   │
│  ☐ Build government exporter scrapers                                      │
│  ☐ Implement contact extraction pipeline                                   │
│  ☐ Implement quality scoring                                               │
│  ☐ Build contact management UI                                             │
│  ☐ Integration testing                                                     │
│                                                                             │
│  PHASE 4: STAGE 4 - MARKET INTELLIGENCE (Weeks 9-12)                       │
│  ───────────────────────────────────────────────────                       │
│  ☐ Build data aggregation pipeline                                         │
│  ☐ Implement prediction generation system                                  │
│  ☐ Build report generation                                                 │
│  ☐ Integrate user dashboard                                                │
│  ☐ Implement email delivery                                                │
│  ☐ Build accuracy tracking                                                 │
│  ☐ User acceptance testing                                                 │
│  ☐ Production deployment                                                   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Success Criteria

| Phase | Criteria |
|-------|----------|
| **Phase 1** | Schema deployed, admin can view empty run list |
| **Phase 2** | Automated runs produce candidates, admin can approve/reject |
| **Phase 3** | Contact discovery produces quality-scored contacts |
| **Phase 4** | Weekly predictions delivered to Gold subscribers |

### 11.3 Dependencies

| Dependency | Required By | Status |
|------------|-------------|--------|
| PostgreSQL niche schema | Phase 1 | To be created |
| Admin portal feature module | Phase 1 | To be created |
| LLM API access (Claude) | Phase 2 | Available |
| Reddit API key | Phase 2 | Requires payment |
| B2B marketplace access | Phase 3 | Public access |
| User subscription system | Phase 4 | Existing (Gold tier) |

---

## 12. Admin Portal UI Specification

### 12.1 Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **LLM Generation** | Batch After Scoring (Admin-Triggered) | Cost control, flexibility |
| **Detail Level** | Per-Candidate Selection | Short vs Full based on complexity |
| **Without Analysis** | Allow with Warning | Admins can decide without LLM |
| **Navigation** | Dashboard + Details Hub | One hub with cards linking to detail pages |
| **Multi-Admin** | Soft Assignment | Admins can claim candidates, not enforced |
| **Prediction Review** | Selective | Only high-risk/low-confidence need approval |

### 12.2 Sidebar Structure

```
Niche Commodity Finder (collapsible section)
├── Dashboard                    Hub with status + alerts + error badges
├── Niche Discovery (Stage 1)
│   ├── Runs tab                 History, status, errors
│   ├── Commodities tab          Pending approval queue
│   └── Approved tab             Manage approved niches (full CRUD)
├── Contacts (Stage 2/3)
│   ├── Buyers tab               Curate & edit buyer contacts
│   └── Sellers tab              Curate & edit seller contacts
├── Outreach (Stage 3)           Drip campaign management per commodity
├── Predictions (Stage 4)        All / Calendar / Review Queue views
├── Job Logs                     Centralized audit trail (NEW)
├── Analytics                    User engagement (aggregate only)
└── Settings                     Full configuration
```

### 12.3 Page Specifications

#### 12.3.1 Dashboard (Hub)

**Purpose:** Quick overview with status + alerts. No actions, just visibility and links.

**Components:**
- **Alert Banner:** Items needing attention (pending reviews, failed jobs, flagged predictions)
- **Pipeline Metrics:** Pending candidates, Approved this month, Contacts discovered
- **Performance Metrics:** Prediction accuracy, Email open rates, Conversion rate
- **Recent Activity:** Last 5-10 actions with timestamps

**Click Behavior:** All cards link to relevant detail pages.

#### 12.3.2 Niche Discovery Page

**Runs Tab:**
- List of discovery runs with: Run #, Date, Status (✓/⚠️/❌), Sources, Records parsed
- Click run → Drill-down page with tabs: Overview, Raw Data, Commodities, Errors

**Commodities Tab:**
- All pending commodities across runs
- Columns: Name, HS Code, Score, Rule breakdown, LLM Status, Actions
- **LLM Generation Controls:**
  - "Generate Analysis" button (batch for selected or all)
  - Per-candidate dropdown: "Generate Short" / "Generate Full"
  - Warning icon if no analysis (can still approve with modal warning)
- Actions: Approve / Reject (with reason) / Watchlist

**Approved Tab:**
- List of approved niche commodities with full CRUD
- Actions: Edit details, Archive, Reactivate, Delete permanently

#### 12.3.3 Contacts Page

**Tabs:** Buyers | Sellers (same structure)

**Features:**
- Contact list with: Company, Name, Email, Phone, Commodity, Quality Score, Source, Status
- Filters: By commodity, quality score, status
- **Curate & Edit Actions:**
  - Mark as verified ✓
  - Edit contact details
  - Flag as invalid
  - Remove duplicate
  - Export selected to CSV

#### 12.3.4 Outreach Page

**View:** By Commodity

**Per Commodity Card:**
- Total Contacts, Current Phase (Day 1/8/15), Status metrics
- [Pause] / [Resume] buttons
- Expandable contact-level status showing drip phase per contact

**Drip Sequence:** Day 1 Email → Day 8 WhatsApp → Day 15 Follow-up

#### 12.3.5 Predictions Page

**Views:**
- **All Predictions:** List/grid with filters (Published/Draft/Needs Review/Rejected)
- **Calendar View:** Weekly calendar showing scheduled predictions
- **Review Queue:** Only high-risk predictions needing approval

**Admin Actions:** Approve / Edit / Reject with reason

#### 12.3.6 Job Logs Page

**Purpose:** Centralized audit trail for ALL pipelines

**Features:**
- Real-time streaming for running jobs
- Historical view for completed jobs
- Full text search across logs
- Filters: Job type, status, date range, severity

**Job Control:**
- Trigger new runs manually
- Retry failed jobs
- Cancel running jobs

#### 12.3.7 Analytics Page

**Metrics (Aggregate Only - No Individual User Tracking):**
- Views per prediction
- Most popular commodities
- Category engagement breakdown
- Accuracy feedback/ratings
- Trends over time

#### 12.3.8 Settings Page

**Configuration Sections:**
- LLM Settings: Default detail level, cost alerts
- Scoring Thresholds: Volume, volatility, emergence signals
- Scraper Schedules: Per-source enable/disable and timing
- Outreach Settings: Drip timing, pause all
- Email Templates: View/edit predefined templates
- Prediction Review Thresholds: Confidence triggers
- Admin Notifications: Alert preferences

---

## 13. User-Facing UI Specification (Gold Buyers)

### 13.1 Access & Location

| Aspect | Specification |
|--------|---------------|
| **Access** | Gold Buyers only (premium feature) |
| **Primary Location** | Core AI page (new section in AI pages) |
| **Secondary Location** | Marketplace page - cards/snippets with redirect |
| **Delivery Channels** | Dashboard + Email (user configurable) |

### 13.2 Category Subscription

Users subscribe to commodity categories directly on the predictions dashboard:

**Categories:**
- Spices (Cardamom, Saffron, Turmeric, etc.)
- Botanicals (Moringa, Ashwagandha, Neem, etc.)
- Pharma Ingredients
- Superfoods
- Essential Oils
- Other

**Behavior:**
- Toggle filters directly on dashboard
- Subscribe/unsubscribe anytime
- Subscribed categories appear first in card order

### 13.3 Prediction Dashboard

#### 13.3.1 Summary Card (Collapsed)

```
┌─────────────────────────────────────────────────────────────┐
│ 🟢 MORINGA LEAF POWDER                      ↑ +12% | 78%   │
│ BUY NOW - Growing US supplement demand                      │
│ Current: ₹245/kg → Predicted: ₹274/kg                      │
│ [View Full Analysis]                                        │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Color indicator: 🟢 Buy / 🔴 Wait / 🟡 Hold
- Commodity name
- Direction arrow with percentage change
- Confidence percentage
- Action headline
- Price summary
- Expand button

#### 13.3.2 Expanded View (Full Report)

**Content:**
- Comprehensive AI analysis text (LLM-generated)
- Visual charts: Price history, trend graphs
- Key factors driving prediction (bullet points)
- Risk warnings with severity
- Historical accuracy for this commodity
- Data freshness indicators

#### 13.3.3 Card Order

1. User's subscribed categories (alphabetical within)
2. Other highlights (highest confidence predictions)

### 13.4 Email Digest

**Frequency:** Weekly (Monday AM)

**Format:** Hybrid approach
- Full content for top 2-3 predictions (from subscribed categories)
- Teaser/summary for others with "View on Dashboard" CTA

**Example Template:**

```
This Week's Market Intelligence

YOUR SUBSCRIBED CATEGORIES:

🟢 Moringa Leaf Powder - BUY NOW
Price expected to rise 12% over next 4 weeks.
Growing US supplement demand + delayed Karnataka harvest.
[Read full analysis]

🔴 Saffron - WAIT TO BUY
Price expected to drop 15% post-festival.
[Read full analysis]

OTHER HIGHLIGHTS:
• Cardamom: Stable (no action needed)
• Spirulina: Slight uptick expected
[View all on dashboard →]

---
Manage your subscriptions: [Settings]
Unsubscribe: [Link]
```

### 13.5 Delivery Preferences

User settings allow choosing:
- Dashboard only
- Email only
- Both (default)

### 13.6 LLM Output Tiering

| View | Content Level | Purpose |
|------|---------------|---------|
| **Summary Card** | Short (200-400 tokens) | Quick scan, action headline |
| **Expanded View** | Comprehensive (2000+ tokens) | Full analysis, charts, factors |
| **Email Teaser** | Ultra-short (50-100 tokens) | Drive to dashboard |
| **Email Full** | Standard (800 tokens) | Actionable without clicking |

---

## 14. Job Logs & Audit Trail Specification

### 14.1 Overview

The Job Logs system provides a centralized, full-trace audit logging capability for ALL pipelines in the Niche Commodity Finder.

### 14.2 Pipelines Logged

| Pipeline | Stage | Jobs Tracked |
|----------|-------|--------------|
| **Niche Discovery** | Stage 1 | Scraper runs, parsing, scoring, LLM generation |
| **Contact Discovery** | Stage 2/3 | Buyer scraping, seller scraping, deduplication |
| **Outreach** | Stage 3 | Email sends, WhatsApp sends, drip status changes |
| **Prediction Generation** | Stage 4 | Data aggregation, LLM prediction, delivery |

### 14.3 Log Entry Format

**Structured Card Format:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ✓ APEDA Scraper                           10:30:15 AM          │
│ ─────────────────────────────────────────────────────────────── │
│ Downloaded: exports_jan2026.xlsx (2.4MB)                        │
│ Records found: 147                                              │
│ [▼ Expand for details]                                          │
│                                                                 │
│ Expanded shows:                                                 │
│ - File checksum: sha256:abc123...                              │
│ - Sample records: Moringa (45,000 MT), Saffron (12,000 MT)...  │
│ - Parse warnings: 3 rows skipped (invalid format)              │
└─────────────────────────────────────────────────────────────────┘
```

### 14.4 Log Entry Schema

```json
{
  "log_id": "uuid",
  "job_id": "uuid",
  "pipeline": "discovery | contacts | outreach | predictions",
  "job_type": "apeda_scraper | dgft_scraper | buyer_scrape | email_send | ...",
  "status": "running | success | warning | error",
  "timestamp": "2026-02-03T10:30:15Z",
  "duration_ms": 45230,
  "summary": "Downloaded exports_jan2026.xlsx (2.4MB)",
  "details": {
    "records_found": 147,
    "file_checksum": "sha256:abc123...",
    "warnings": ["3 rows skipped"],
    "sample_data": ["Moringa (45K MT)", "..."]
  },
  "error_trace": null,
  "triggered_by": "scheduled | manual | admin_id"
}
```

### 14.5 Real-Time Streaming

**Running Jobs:**
- Live log updates via WebSocket
- Progress indicators
- Cancel button

**Implementation:**
```
WebSocket: /ws/admin/niche/job-logs/{job_id}
Events: log_entry, progress_update, job_complete, job_error
```

### 14.6 Job Control Features

| Feature | Description |
|---------|-------------|
| **Trigger New Runs** | Manual trigger for any pipeline |
| **Retry Failed Jobs** | One-click retry with same config |
| **Cancel Running Jobs** | Graceful cancellation |
| **Adjust Schedules** | On-the-fly schedule changes (via Settings) |

### 14.7 Error Handling

**Error Visibility:**
- Error badge appears on Dashboard when job fails
- Detailed error trace in logs with stack info
- No email push to admins (check Dashboard)

**Error Entry Format:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ❌ DGFT Scraper                           10:25:02 AM          │
│ ─────────────────────────────────────────────────────────────── │
│ Error: Connection timeout after 60s                             │
│ [▼ Expand for stack trace]                      [Retry]        │
│                                                                 │
│ Expanded shows:                                                 │
│ - Full stack trace                                             │
│ - Request details (URL, headers)                               │
│ - Retry count: 3/3 exhausted                                   │
│ - Suggested action: Check DGFT site availability               │
└─────────────────────────────────────────────────────────────────┘
```

### 14.8 Quick View Integration

Each page in the Admin Portal has a "Recent Logs" section:
- Shows last 10-20 relevant log entries for that page's context
- "View All Logs" link to full Job Logs page with pre-applied filter

### 14.9 Database Schema for Logs

```sql
CREATE TABLE job_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    pipeline VARCHAR(50) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    summary TEXT,
    details JSONB,
    error_trace TEXT,
    triggered_by VARCHAR(100),

    INDEX idx_job_logs_job_id (job_id),
    INDEX idx_job_logs_pipeline (pipeline),
    INDEX idx_job_logs_status (status),
    INDEX idx_job_logs_timestamp (timestamp DESC)
);

CREATE TABLE job_runs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline VARCHAR(50) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    config JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    triggered_by VARCHAR(100),
    result_summary JSONB
);
```

### 14.10 Retention Policy

| Log Type | Retention | Rationale |
|----------|-----------|-----------|
| Job summaries | Indefinite | Audit trail |
| Detailed logs | 90 days | Storage management |
| Error traces | 180 days | Debugging history |
| Raw data files | Indefinite | Compliance |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | February 2026 | BREYUS Tech Team | Initial technical architecture document |
| 1.1 | February 2026 | BREYUS Tech Team | Added Admin Portal UI Spec (§12), User-Facing UI Spec (§13), Job Logs Spec (§14) |

---

*This document provides the complete technical architecture for the Breyus Niche Commodity Finder AI system. It should be read in conjunction with the [[ai/NICHE_COMMODITY_FINDER_PRD|main PRD]] and the [[ai/PRD_1_Government_Data_Extraction|Government Data Extraction PRD]] for full context.*

## Related
- [[NICHE_COMMODITY_FINDER_PRD]]
- [[api/ai]]
- [[api/commodities]]
- [[MOC-AI]]
