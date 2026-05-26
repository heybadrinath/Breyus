---
type: prd
module: ai
tags: [ai, prd, market-intelligence, predictions]
---

# PRD: Market Intelligence System (Stage 4)

> **Document Type:** Product Requirements Document (PRD)
> **Version:** 1.0
> **Last Updated:** March 2026
> **Status:** Implementation Ready
> **Depends On:** Stage 1 (Government Data Extraction) — specifically the `approved_commodities` table

---

## Table of Contents

1. [Background & Purpose](#1-background--purpose)
2. [Scope Definition](#2-scope-definition)
3. [Core Design Philosophy](#3-core-design-philosophy)
4. [Data Aggregation Pipeline](#4-data-aggregation-pipeline)
5. [Prediction Generation Pipeline](#5-prediction-generation-pipeline)
6. [Confidence Scoring Algorithm](#6-confidence-scoring-algorithm)
7. [Prediction Output Schema](#7-prediction-output-schema)
8. [Database Schema](#8-database-schema)
9. [API Endpoints](#9-api-endpoints)
10. [Admin Portal UI Specifications](#10-admin-portal-ui-specifications)
11. [Buyer Frontend UI Specifications](#11-buyer-frontend-ui-specifications)
12. [Notification Flow](#12-notification-flow)
13. [Accuracy Tracking (Admin-Only)](#13-accuracy-tracking-admin-only)
14. [Folder Structure & Implementation Phases](#14-folder-structure--implementation-phases)

---

## 1. Background & Purpose

The Market Intelligence System is the **user-facing prediction layer** of the Breyus Niche Commodity system. It consumes the approved niche commodities from Stage 1 and generates monthly market predictions that help buyers make informed procurement decisions.

This module exists to answer one core question reliably:

**"For this niche commodity I'm interested in, should I buy now, wait, or sell? What's the price going to do next month?"**

This is the **retention engine** of the Breyus platform. Users stay because they receive monthly predictions about niche commodity prices, supply chains, and trends that they cannot get from mainstream platforms like Alibaba or TradeKey.

### 1.1 Key Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| **Buyers** | Monthly price predictions, buy/sell/hold recommendations, risk alerts |
| **Admins** | Review low-confidence predictions, track accuracy, configure thresholds |
| **System** | Automated monthly generation, notification delivery, accuracy feedback loop |

### 1.2 Dependency Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STAGE 4 DEPENDENCY MAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Stage 1: Government Data Extraction                                        │
│      │                                                                      │
│      ├── approved_commodities table (is_active = true)                      │
│      │                                                                      │
│      ├── parsed_records table (historical volume/value data)                │
│      │                                                                      │
│      └── Supplementary scrapers (news, Reddit, B2B marketplace signals)    │
│              │                                                              │
│              ▼                                                              │
│     Stage 4: Market Intelligence System (THIS PRD)                         │
│              │                                                              │
│              ├── Monthly prediction generation                              │
│              ├── Auto-publish (confidence >= 75%) / Admin review queue      │
│              ├── Buyer dashboard + in-app notifications                     │
│              └── Accuracy tracking (admin-only)                            │
│                                                                              │
│  Stage 4 does NOT depend on Stage 2 (Buyer Discovery) or                   │
│  Stage 3 (Seller Discovery). They are fully independent.                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Scope Definition

### 2.1 In Scope

- Data aggregation pipeline (government data, supplementary signals, platform trade history)
- Monthly prediction generation via LLM with structured prompts
- Confidence scoring algorithm (deterministic, not from LLM)
- Auto-publish / admin review workflow (threshold: 75% confidence)
- Buyer-facing Market Intelligence dashboard page
- Homepage summary cards (top 3 predictions)
- User favorites system (star commodities, pinned at top of dashboard)
- In-app notifications for favorited commodities when new predictions publish
- Accuracy tracking (admin-only, internal)

### 2.2 Out of Scope (v1)

- Email delivery of predictions (in-app only for v1)
- Subscription tiers, paywall, or Gold Buyer gating (all buyers get access)
- User-visible accuracy metrics (admin-only in v1)
- Weekly or daily predictions (monthly only)
- Price alerts or custom user-set thresholds
- PDF report export
- Historical prediction comparison UI for users
- Mobile push notifications

---

## 3. Core Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Government data is ground truth** | Price/volume signals anchored to APEDA, DGFT, Spice Board data |
| **LLMs synthesize, algorithms score confidence** | LLM generates the narrative; confidence is calculated deterministically |
| **Auto-publish with guardrails** | >= 75% confidence auto-publishes; below goes to admin review |
| **Separate system from existing market_analyzer** | New code in `AI_NEW/server/niche/intelligence/` — does not extend existing analysis |
| **Predictions are append-only** | Published predictions are never deleted; retracted predictions are flagged |
| **Accuracy is internal** | Users do not see accuracy stats in v1; admins track for system improvement |
| **Every prediction is auditable** | Full data lineage: which sources, which data, which LLM call produced each prediction |

---

## 4. Data Aggregation Pipeline

### 4.1 Data Sources & Priority

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    PREDICTION DATA SOURCES                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  P0 (CRITICAL) — Government Trade Data                                     │
│  ─────────────────────────────────────                                     │
│  Source: Stage 1 parsed_records table (APEDA, DGFT)                       │
│  Data: Export volume (MT), export value (USD), derived unit price ($/MT)   │
│  Freshness: <= 30 days                                                     │
│  Coverage: Rolling 12 months of monthly data points                       │
│                                                                             │
│  P1 (HIGH) — Spice Board Price Data                                       │
│  ────────────────────────────────────                                      │
│  Source: Stage 1 parsed_records table (Spice Board scraper)               │
│  Data: Spot prices (INR/kg) for spice commodities                         │
│  Freshness: <= 30 days                                                     │
│  Coverage: Monthly updates for ~20 spice types                            │
│                                                                             │
│  P2 (MEDIUM) — Supplementary Signals                                      │
│  ─────────────────────────────────────                                     │
│  Source: Stage 1 supplementary scrapers (Reddit, News RSS, B2B monitors)  │
│  Data: Sentiment scores, emerging keywords, listing trends                │
│  Freshness: <= 7 days                                                      │
│  Coverage: Last 90 days of signals per commodity                          │
│                                                                             │
│  P3 (SUPPORTING) — Platform Trade History                                 │
│  ──────────────────────────────────────────                                │
│  Source: Existing trade_records table in PostgreSQL                        │
│  Data: Historical trades on Breyus (volume, value, countries)             │
│  Freshness: Real-time                                                      │
│  Coverage: All trades for matched HS code / commodity name                │
│                                                                             │
│  P3 (SUPPORTING) — Previous Predictions                                   │
│  ──────────────────────────────────────                                    │
│  Source: commodity_predictions table (this system)                         │
│  Data: Last 3 predictions for this commodity (direction, accuracy)        │
│  Freshness: N/A                                                            │
│  Coverage: Available after first month of operation                       │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Aggregation Service

Location: `AI_NEW/server/niche/intelligence/data_aggregator.py`

```python
class PredictionDataAggregator:
    """
    Collects and normalizes all data sources for a single commodity prediction.
    Returns a structured DataBundle used by the prediction generator.
    """

    async def aggregate(self, commodity_id: str, hs_code: str) -> DataBundle:
        """
        Parallel fetch from all sources, then merge into DataBundle.

        DataBundle contains:
        - price_series: List[PricePoint]       # monthly $/MT over 12 months
        - volume_series: List[VolumePoint]     # monthly MT over 12 months
        - sentiment_signals: List[Signal]      # news/Reddit/B2B from last 90 days
        - platform_activity: PlatformActivity  # trade count, avg value, trend
        - previous_predictions: List[PredSummary]  # last 3 predictions
        - data_quality: DataQualityReport      # freshness, completeness, source count
        """
```

### 4.3 Data Quality Assessment

Each aggregation produces a `DataQualityReport` that feeds into confidence scoring:

```python
@dataclass
class DataQualityReport:
    total_sources_available: int       # how many source types had data
    total_sources_expected: int        # always 5 (see source table)
    price_points_count: int            # monthly price data points (0-12)
    volume_points_count: int           # monthly volume data points (0-12)
    newest_gov_data_age_days: int      # days since newest government data
    sentiment_signal_count: int        # signals in last 90 days
    platform_trade_count: int          # trades in last 12 months
    freshness_score: float             # 0-100 (penalizes stale data)
    completeness_score: float          # 0-100 (penalizes missing sources)
    overall_quality: str               # "high" | "medium" | "low" | "insufficient"
```

**Quality Thresholds:**

| Quality Level | Criteria | Action |
|---------------|----------|--------|
| **High** | >= 6 price points, >= 2 sources, gov data < 30 days | Normal prediction generation |
| **Medium** | >= 3 price points, >= 1 source, gov data < 45 days | Prediction with reduced confidence |
| **Low** | < 3 price points OR gov data > 45 days | Prediction with `limited_data` flag, likely triggers admin review |
| **Insufficient** | < 2 price points AND no sentiment signals | Skip prediction, log reason |

### 4.4 Edge Case: New Commodity (First Month After Approval)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                 EDGE CASE: FIRST PREDICTION FOR NEW COMMODITY               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Scenario: Commodity approved this month, minimal historical data           │
│                                                                             │
│  1. Aggregator collects whatever data exists from Stage 1 parsed_records   │
│     (commodity MUST have data to have been approved — Stage 1 guarantees)  │
│                                                                             │
│  2. If only 2-3 months of price data: proceed with quality = "low"        │
│                                                                             │
│  3. Confidence score will naturally be lower due to:                       │
│     - Low completeness_score (fewer data points)                           │
│     - No historical_accuracy (first prediction — defaults to 50/100)      │
│     → Likely triggers admin review (confidence < 75%)                     │
│                                                                             │
│  4. Prediction metadata includes:                                          │
│     - "first_prediction": true                                             │
│     - "limited_data_warning": "Only X months of data available"           │
│                                                                             │
│  5. Admin sees "First Prediction" badge in review queue                    │
│                                                                             │
│  6. previous_predictions list will be empty — handled gracefully           │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Edge Case: Stale Government Data (> 30 days old)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                 EDGE CASE: STALE GOVERNMENT DATA                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Scenario: Government source hasn't updated in > 30 days                   │
│                                                                             │
│  1. Aggregator checks newest_gov_data_age_days                             │
│                                                                             │
│  2. Freshness scoring:                                                     │
│     - <= 15 days: freshness_score = 100                                    │
│     - <= 30 days: freshness_score = 80                                     │
│     - <= 45 days: freshness_score = 50                                     │
│     - <= 60 days: freshness_score = 25                                     │
│     - > 60 days:  freshness_score = 0                                      │
│                                                                             │
│  3. Confidence is penalized proportionally (see Section 6)                 │
│                                                                             │
│  4. Prediction metadata includes:                                          │
│     - "stale_data_warning": true                                           │
│     - "data_age_days": N                                                   │
│                                                                             │
│  5. Admin dashboard shows "Stale Data" badge on affected predictions       │
│                                                                             │
│  6. If > 60 days AND no supplementary signals: quality = "insufficient"    │
│     → prediction skipped for this commodity this month                     │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Prediction Generation Pipeline

### 5.1 Monthly Batch Job Flow

Location: `AI_NEW/server/niche/intelligence/prediction_generator.py`

**Trigger:** Admin manual trigger OR cron-scheduled (1st of each month at 02:00 UTC)

**LLM Model:** Reads `market_predictions_model` from `niche_settings` table.
Default: `gemini-2.0-flash`. Admin configurable via Settings page.
See [[PRD_1_Government_Data_Extraction#10.3 LLM Model Configuration]] for the full model registry.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    MONTHLY PREDICTION PIPELINE                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: CREATE JOB                                                        │
│  ───────────────────                                                       │
│  Create prediction_job record (status: "pending")                          │
│  Set prediction_month = current month (YYYY-MM)                            │
│                                                                             │
│  STEP 2: FETCH COMMODITIES                                                 │
│  ─────────────────────────                                                 │
│  Query all approved_commodities WHERE is_active = true                     │
│  Log count: "Generating predictions for N commodities"                     │
│                                                                             │
│  STEP 3: FOR EACH COMMODITY (parallel, max 5 concurrent)                   │
│  ──────────────────────────────────────────────────────                    │
│                                                                             │
│     3a. AGGREGATE DATA (Section 4)                                         │
│         └── Fetch from all 5 sources in parallel                           │
│         └── Calculate DataQualityReport                                    │
│                                                                             │
│     3b. CHECK DATA QUALITY                                                 │
│         └── If "insufficient" → skip, log reason, continue to next        │
│                                                                             │
│     3c. BUILD LLM PROMPT (Section 5.2)                                     │
│         └── Format all data into structured prompt                         │
│         └── Include previous predictions if available                      │
│                                                                             │
│     3d. CALL LLM (via ai_factory.py)                                       │
│         └── Read model from niche_settings.market_predictions_model        │
│         └── Call ai_factory.get_client(provider, model)                    │
│         └── Enforce JSON response schema                                   │
│                                                                             │
│     3e. VALIDATE RESPONSE (Section 5.3)                                    │
│         └── Parse JSON, schema validation, sanity checks                   │
│         └── If invalid: retry once with strict prompt                      │
│         └── If still invalid: statistical fallback (Section 5.4)           │
│                                                                             │
│     3f. CALCULATE CONFIDENCE (Section 6)                                    │
│         └── Deterministic scoring from data quality + signals              │
│         └── NOT from LLM self-assessment alone                             │
│                                                                             │
│     3g. CREATE PREDICTION RECORD                                            │
│         └── Store in commodity_predictions table                           │
│         └── If confidence >= 75% → status = "published"                    │
│         └── If confidence < 75%  → status = "pending_review"               │
│                                                                             │
│     3h. RECORD DATA LINEAGE                                                │
│         └── Store in prediction_data_sources table                         │
│                                                                             │
│  STEP 4: COMPLETE JOB                                                      │
│  ────────────────────                                                      │
│  Update prediction_job (status: "completed")                               │
│  Log: "Generated N predictions, P published, R pending review, S skipped" │
│                                                                             │
│  STEP 5: DISPATCH NOTIFICATIONS                                            │
│  ───────────────────────────────                                           │
│  For each published prediction:                                            │
│  └── Find users who favorited this commodity                               │
│  └── Create in-app notification via NestJS notification service            │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 LLM Prompt Template

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         LLM PROMPT TEMPLATE                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SYSTEM PROMPT                                                             │
│  ═════════════                                                             │
│                                                                             │
│  """                                                                        │
│  You are a commodity market intelligence analyst for a B2B trading         │
│  platform specializing in niche commodities (small-volume, high-          │
│  volatility markets that mainstream platforms miss).                       │
│                                                                             │
│  Generate a monthly market prediction based on the provided data.         │
│  Your predictions help commodity traders decide when to buy, sell,        │
│  or hold.                                                                  │
│                                                                             │
│  Rules:                                                                    │
│  - Base predictions on PROVIDED DATA, not general knowledge               │
│  - State confidence honestly — if data is limited, say so                 │
│  - Price predictions should be realistic (within 2x of current price)     │
│  - Always provide at least 2 key factors and 1 risk warning               │
│  - Respond with ONLY valid JSON matching the provided schema              │
│  """                                                                        │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  USER PROMPT                                                               │
│  ═══════════                                                               │
│                                                                             │
│  """                                                                        │
│  ## Commodity                                                              │
│  - Name: {commodity_name}                                                  │
│  - HS Code: {hs_code}                                                      │
│                                                                             │
│  ## Price History (Last 12 Months)                                         │
│  {price_series_formatted}                                                  │
│  - Current Price: {current_price} $/MT                                     │
│  - 12-Month Average: {avg_price} $/MT                                      │
│  - Price Volatility: {volatility_pct}%                                     │
│  - YoY Change: {yoy_change_pct}%                                           │
│                                                                             │
│  ## Volume History (Last 12 Months)                                        │
│  {volume_series_formatted}                                                 │
│  - Current Monthly Volume: {current_volume} MT                             │
│  - 12-Month Total: {annual_volume} MT                                      │
│  - Volume Trend: {volume_trend}                                            │
│                                                                             │
│  ## Market Signals ({signal_count} signals in last 90 days)                │
│  {signals_formatted}                                                       │
│                                                                             │
│  ## Platform Activity                                                      │
│  - Trades in last 12 months: {platform_trade_count}                       │
│  - Average trade value: {avg_trade_value}                                  │
│  - Demand trend: {demand_trend}                                            │
│                                                                             │
│  ## Previous Prediction (if available)                                     │
│  {previous_prediction_summary}                                             │
│                                                                             │
│  ## Instructions                                                           │
│  Respond with ONLY a JSON object matching this exact schema:              │
│  {output_schema}                                                           │
│  """                                                                        │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 LLM Response Validation

Location: `AI_NEW/server/niche/intelligence/prediction_validator.py`

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    RESPONSE VALIDATION PIPELINE                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: JSON PARSE                                                        │
│  ───────────────────                                                       │
│  If unparseable → retry once with simplified prompt                       │
│  If still fails → mark prediction as "failed"                             │
│                                                                             │
│  STEP 2: SCHEMA VALIDATION                                                 │
│  ─────────────────────────                                                 │
│  Validate against Pydantic model                                          │
│  Required fields: price_forecast, recommendation, key_factors,            │
│                    risk_warnings, top_importers, top_exporters             │
│  Reject if required fields missing                                        │
│                                                                             │
│  STEP 3: SANITY CHECKS                                                     │
│  ─────────────────────                                                     │
│  • expected_change_pct within -80% to +200% (reject outliers)             │
│  • predicted_price_mid within 3x of current price (reject extreme)        │
│  • At least 2 key_factors present                                          │
│  • At least 1 risk_warning present                                         │
│  • llm_confidence between 0 and 100                                        │
│  • top_importers and top_exporters each have 1-10 entries                 │
│                                                                             │
│  STEP 4: INCONSISTENCY DETECTION                                           │
│  ────────────────────────────────                                          │
│  • direction = "up" but expected_change_pct < 0 → auto-correct            │
│  • direction = "down" but expected_change_pct > 0 → auto-correct          │
│  • action = "buy" but direction = "down" with confidence > 80% → flag     │
│  • action = "sell" but direction = "up" with confidence > 80% → flag      │
│  • predicted_price_low > predicted_price_high → swap values               │
│                                                                             │
│  RESULT:                                                                   │
│  ────────                                                                  │
│  • VALID: proceed to confidence scoring                                    │
│  • CORRECTED: proceed with auto-corrected values, log corrections         │
│  • INVALID (after retry): use statistical fallback (Section 5.4)          │
│  • FAILED (after all retries): mark as "failed", admin notified           │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Statistical Fallback (When LLM Fails)

When the LLM produces invalid output after retry:

```python
def generate_statistical_fallback(data_bundle: DataBundle) -> PredictionResult:
    """
    Simple statistical prediction when LLM fails.
    Uses linear regression on price series + volume trend.
    Always sets source = "statistical_fallback" and forces admin review.
    """
    prices = data_bundle.price_series
    volumes = data_bundle.volume_series

    # Linear regression on last 6 months of prices
    price_trend = linear_regression_slope(prices[-6:])
    predicted_change_pct = price_trend * 100

    # Direction from trend
    if predicted_change_pct > 5:
        direction = "up"
        action = "buy"
    elif predicted_change_pct < -5:
        direction = "down"
        action = "sell"
    else:
        direction = "stable"
        action = "hold"

    return PredictionResult(
        source="statistical_fallback",
        status="pending_review",  # ALWAYS requires admin review
        # ... fill remaining fields from statistical analysis
    )
```

---

## 6. Confidence Scoring Algorithm

Location: `AI_NEW/server/niche/intelligence/confidence_scorer.py`

Confidence is calculated **deterministically** — NOT from the LLM. The LLM's self-assessed confidence is ONE of six inputs.

### 6.1 Scoring Components

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    CONFIDENCE SCORING ALGORITHM                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  COMPONENT 1: DATA FRESHNESS (Weight: 25%)                                 │
│  ═════════════════════════════════════════                                  │
│                                                                             │
│  Purpose: Penalize predictions based on stale government data              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def freshness_score(newest_gov_data_age_days: int) -> float:       │  │
│  │      if newest_gov_data_age_days <= 15: return 100                  │  │
│  │      if newest_gov_data_age_days <= 30: return 80                   │  │
│  │      if newest_gov_data_age_days <= 45: return 50                   │  │
│  │      if newest_gov_data_age_days <= 60: return 25                   │  │
│  │      return 0  # data too old                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  COMPONENT 2: DATA COMPLETENESS (Weight: 20%)                              │
│  ═════════════════════════════════════════════                              │
│                                                                             │
│  Purpose: More data sources and data points = higher confidence            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def completeness_score(report: DataQualityReport) -> float:        │  │
│  │      # Sources contribution (0-50 points)                           │  │
│  │      source_pts = (report.total_sources_available                    │  │
│  │                    / report.total_sources_expected) * 50            │  │
│  │      # Price points contribution (0-30 points)                      │  │
│  │      price_pts = min(report.price_points_count / 6, 1.0) * 30      │  │
│  │      # Sentiment signals contribution (0-20 points)                 │  │
│  │      signal_pts = min(report.sentiment_signal_count / 3, 1.0) * 20  │  │
│  │      return source_pts + price_pts + signal_pts                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  COMPONENT 3: SIGNAL AGREEMENT (Weight: 20%)                               │
│  ═══════════════════════════════════════════                                │
│                                                                             │
│  Purpose: Multiple sources agreeing on direction = higher confidence       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def agreement_score(                                                │  │
│  │      price_trend: str,    # "up" | "down" | "stable"                │  │
│  │      volume_trend: str,   # "up" | "down" | "stable"                │  │
│  │      sentiment: str       # "bullish" | "bearish" | "neutral"       │  │
│  │  ) -> float:                                                        │  │
│  │      # Normalize to common direction labels                         │  │
│  │      signals = [normalize(price_trend),                              │  │
│  │                 normalize(volume_trend),                              │  │
│  │                 normalize(sentiment)]                                │  │
│  │      most_common = max(set(signals), key=signals.count)              │  │
│  │      agreement_count = signals.count(most_common)                    │  │
│  │      return {3: 100, 2: 66, 1: 0}[agreement_count]                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  COMPONENT 4: HISTORICAL ACCURACY (Weight: 15%)                            │
│  ══════════════════════════════════════════════                             │
│                                                                             │
│  Purpose: Past predictions for this commodity being accurate = confidence  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def historical_accuracy_score(commodity_id: str) -> float:         │  │
│  │      # Check prediction_accuracy table for past predictions         │  │
│  │      past = get_recent_accuracy(commodity_id, limit=6)              │  │
│  │      if not past:                                                    │  │
│  │          return 50  # Neutral (no history = no penalty/bonus)        │  │
│  │      correct = sum(1 for p in past if p.direction_correct)          │  │
│  │      return (correct / len(past)) * 100                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  COMPONENT 5: LLM SELF-CONFIDENCE (Weight: 10%)                            │
│  ══════════════════════════════════════════════                             │
│                                                                             │
│  Purpose: LLM's own assessment (used as signal, not authority)             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def llm_confidence_score(llm_confidence: int) -> float:            │  │
│  │      return max(0, min(100, llm_confidence))  # Clamp 0-100         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  COMPONENT 6: PRICE STABILITY (Weight: 10%)                                │
│  ══════════════════════════════════════════                                 │
│                                                                             │
│  Purpose: Stable prices = easier to predict = higher confidence            │
│           (Counterintuitive: volatile commodities get LOWER confidence     │
│            even though they're more interesting as niche plays)            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def stability_score(volatility_pct: float) -> float:               │  │
│  │      if volatility_pct <= 10: return 100  # Very stable              │  │
│  │      if volatility_pct <= 20: return 80                              │  │
│  │      if volatility_pct <= 35: return 60                              │  │
│  │      if volatility_pct <= 50: return 40                              │  │
│  │      return 20  # Highly volatile = hard to predict                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ════════════════════════════════════════════════════════════════════════  │
│                                                                             │
│  FINAL CONFIDENCE CALCULATION                                              │
│  ════════════════════════════                                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def calculate_confidence(                                           │  │
│  │      data_quality: DataQualityReport,                                │  │
│  │      price_trend: str,                                               │  │
│  │      volume_trend: str,                                              │  │
│  │      sentiment: str,                                                 │  │
│  │      commodity_id: str,                                              │  │
│  │      llm_confidence: int,                                            │  │
│  │      volatility_pct: float                                           │  │
│  │  ) -> ConfidenceResult:                                              │  │
│  │                                                                      │  │
│  │      c1 = freshness_score(data_quality.newest_gov_data_age_days)     │  │
│  │      c2 = completeness_score(data_quality)                           │  │
│  │      c3 = agreement_score(price_trend, volume_trend, sentiment)      │  │
│  │      c4 = historical_accuracy_score(commodity_id)                    │  │
│  │      c5 = llm_confidence_score(llm_confidence)                       │  │
│  │      c6 = stability_score(volatility_pct)                            │  │
│  │                                                                      │  │
│  │      final = (c1 * 0.25) + (c2 * 0.20) + (c3 * 0.20)               │  │
│  │            + (c4 * 0.15) + (c5 * 0.10) + (c6 * 0.10)               │  │
│  │                                                                      │  │
│  │      return ConfidenceResult(                                        │  │
│  │          score=round(final, 1),                                      │  │
│  │          components={                                                │  │
│  │              "data_freshness": c1,                                    │  │
│  │              "data_completeness": c2,                                 │  │
│  │              "signal_agreement": c3,                                  │  │
│  │              "historical_accuracy": c4,                               │  │
│  │              "llm_self_confidence": c5,                               │  │
│  │              "price_stability": c6,                                   │  │
│  │          },                                                          │  │
│  │          auto_publish=final >= 75.0,                                  │  │
│  │      )                                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  AUTO-PUBLISH THRESHOLD: >= 75%                                            │
│  Configurable via admin Settings page.                                     │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Prediction Output Schema

The complete JSON structure stored in `commodity_predictions.prediction_data`:

```json
{
  "price_forecast": {
    "direction": "up",
    "expected_change_pct": 12.5,
    "current_price": { "value": 245, "currency": "USD", "unit": "MT" },
    "predicted_price": {
      "low": 260,
      "mid": 276,
      "high": 290,
      "currency": "USD",
      "unit": "MT"
    },
    "timeframe": "next_30_days"
  },

  "recommendation": {
    "action": "buy",
    "urgency": "soon",
    "headline": "BUY: Moringa prices set to rise 12% on US supplement demand",
    "rationale": "Growing demand from US supplement market combined with delayed harvest in South India regions. Three major brands announced moringa-based products this quarter."
  },

  "key_factors": [
    {
      "factor": "Demand surge",
      "impact": "positive",
      "description": "3 major US supplement brands announced moringa-based products"
    },
    {
      "factor": "Supply constraint",
      "impact": "positive",
      "description": "Karnataka harvest delayed 2 weeks due to unseasonal rains"
    },
    {
      "factor": "Export policy",
      "impact": "neutral",
      "description": "No DGFT policy changes expected in prediction window"
    }
  ],

  "risk_warnings": [
    {
      "risk": "Weather dependency",
      "severity": "medium",
      "description": "Extended monsoon could further impact harvest timelines"
    },
    {
      "risk": "Quality certification",
      "severity": "low",
      "description": "EU organic certification requirements tightening in Q3"
    }
  ],

  "top_importers": [
    { "country": "United States", "volume_mt": 12500, "trend": "up" },
    { "country": "Germany", "volume_mt": 8200, "trend": "stable" },
    { "country": "United Arab Emirates", "volume_mt": 6100, "trend": "up" },
    { "country": "United Kingdom", "volume_mt": 4800, "trend": "down" },
    { "country": "Japan", "volume_mt": 3200, "trend": "up" }
  ],

  "top_exporters": [
    { "country": "India", "volume_mt": 28000, "trend": "stable" },
    { "country": "Philippines", "volume_mt": 5600, "trend": "up" },
    { "country": "Nigeria", "volume_mt": 3400, "trend": "up" }
  ],

  "summary": "Moringa leaf powder prices are expected to rise 10-15% over the next month driven by surging US supplement demand and temporary supply constraints from delayed harvests in Karnataka. Buyers should consider locking in current prices. Monitor weather patterns in South India for potential further disruption."
}
```

### 7.1 Metadata (Stored Alongside Prediction)

```json
{
  "confidence": {
    "score": 78.5,
    "components": {
      "data_freshness": 80,
      "data_completeness": 72,
      "signal_agreement": 100,
      "historical_accuracy": 50,
      "llm_self_confidence": 82,
      "price_stability": 60
    },
    "auto_publish": true
  },

  "data_quality": {
    "overall_quality": "high",
    "price_points_count": 9,
    "volume_points_count": 11,
    "newest_gov_data_age_days": 12,
    "sentiment_signal_count": 7,
    "sources_used": ["apeda", "dgft", "spice_board", "reddit", "news_rss"]
  },

  "generation": {
    "job_id": "pred-job-2026-03",
    "llm_model": "claude-haiku-4-5",
    "llm_tokens_used": 1847,
    "llm_cost_usd": 0.02,
    "generated_at": "2026-03-01T02:15:32Z",
    "source": "llm",
    "validation_corrections": []
  },

  "flags": {
    "first_prediction": false,
    "limited_data_warning": null,
    "stale_data_warning": false,
    "statistical_fallback": false
  }
}
```

---

## 8. Database Schema

### 8.1 Table: prediction_jobs

Tracks each monthly batch generation run.

```sql
CREATE TABLE prediction_jobs (
    job_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_month    VARCHAR(7) NOT NULL,          -- "2026-03"
    trigger_type        VARCHAR(20) NOT NULL,          -- 'manual' | 'scheduled'
    triggered_by        VARCHAR(100),                  -- admin_id or 'system'
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
                        -- 'pending' | 'running' | 'completed' | 'failed'
    config              JSONB DEFAULT '{}',            -- threshold overrides, LLM settings

    -- Results summary
    commodities_total   INT DEFAULT 0,
    commodities_published INT DEFAULT 0,
    commodities_pending_review INT DEFAULT 0,
    commodities_skipped INT DEFAULT 0,
    commodities_failed  INT DEFAULT 0,
    total_llm_cost_usd  DECIMAL(8,4) DEFAULT 0,

    -- Timestamps
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Error info
    error_summary       TEXT
);

CREATE INDEX idx_pred_jobs_month ON prediction_jobs(prediction_month);
CREATE INDEX idx_pred_jobs_status ON prediction_jobs(status);
```

### 8.2 Table: commodity_predictions

The core predictions table — one row per commodity per month.

```sql
CREATE TABLE commodity_predictions (
    prediction_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID NOT NULL REFERENCES prediction_jobs(job_id),
    commodity_id        UUID NOT NULL,                 -- FK to approved_commodities
    commodity_name      VARCHAR(200) NOT NULL,         -- denormalized for display
    hs_code             VARCHAR(20),

    -- Prediction period
    prediction_month    VARCHAR(7) NOT NULL,           -- "2026-03"
    prediction_period   JSONB NOT NULL,                -- { start, end }

    -- Core prediction (full JSON from Section 7)
    prediction_data     JSONB NOT NULL,

    -- Confidence
    confidence_score    DECIMAL(5,1) NOT NULL,
    confidence_breakdown JSONB NOT NULL,               -- { components... }

    -- Status & publishing
    status              VARCHAR(20) NOT NULL DEFAULT 'pending_review',
                        -- 'pending_review' | 'published' | 'retracted' | 'failed' | 'skipped'
    published_at        TIMESTAMPTZ,
    published_by        VARCHAR(100),                  -- 'auto' or admin_id
    retracted_at        TIMESTAMPTZ,
    retracted_by        VARCHAR(100),
    retraction_reason   TEXT,

    -- Generation metadata
    source              VARCHAR(30) NOT NULL DEFAULT 'llm',
                        -- 'llm' | 'statistical_fallback'
    llm_model           VARCHAR(50),
    llm_tokens_used     INT,
    llm_cost_usd        DECIMAL(8,4),

    -- Data quality
    data_quality        JSONB NOT NULL,                -- DataQualityReport
    flags               JSONB DEFAULT '{}',            -- first_prediction, stale_data, etc.

    -- Admin review
    admin_notes         TEXT,

    -- Timestamps
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_commodity ON commodity_predictions(commodity_id);
CREATE INDEX idx_predictions_month ON commodity_predictions(prediction_month);
CREATE INDEX idx_predictions_status ON commodity_predictions(status);
CREATE UNIQUE INDEX idx_predictions_unique ON commodity_predictions(commodity_id, prediction_month);
```

### 8.3 Table: prediction_data_sources

Data lineage — which data fed into each prediction.

```sql
CREATE TABLE prediction_data_sources (
    source_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id       UUID NOT NULL REFERENCES commodity_predictions(prediction_id),
    source_type         VARCHAR(50) NOT NULL,          -- 'gov_apeda' | 'gov_dgft' | 'spice_board' | 'reddit' | 'news_rss' | 'b2b_monitor' | 'platform_trades' | 'previous_predictions'
    source_name         VARCHAR(100) NOT NULL,
    data_summary        JSONB NOT NULL,                -- key metrics from this source
    records_count       INT DEFAULT 0,
    freshness_days      INT,                           -- age of newest record from this source
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_sources_prediction ON prediction_data_sources(prediction_id);
```

### 8.4 Table: prediction_accuracy

Admin-only accuracy tracking — compares predictions vs actual outcomes.

```sql
CREATE TABLE prediction_accuracy (
    accuracy_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id       UUID NOT NULL REFERENCES commodity_predictions(prediction_id),
    commodity_id        UUID NOT NULL,
    prediction_month    VARCHAR(7) NOT NULL,

    -- What was predicted
    predicted_direction VARCHAR(10) NOT NULL,           -- 'up' | 'down' | 'stable'
    predicted_change_pct DECIMAL(6,2),
    predicted_price_mid DECIMAL(12,2),

    -- What actually happened
    actual_direction    VARCHAR(10),                    -- 'up' | 'down' | 'stable'
    actual_change_pct   DECIMAL(6,2),
    actual_price        DECIMAL(12,2),

    -- Accuracy metrics
    direction_correct   BOOLEAN,
    price_error_pct     DECIMAL(6,2),                  -- abs(predicted - actual) / actual * 100

    -- Tracking
    evaluated_at        TIMESTAMPTZ,
    evaluation_source   VARCHAR(50),                   -- 'automatic' | 'manual'
    notes               TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accuracy_commodity ON prediction_accuracy(commodity_id);
CREATE INDEX idx_accuracy_month ON prediction_accuracy(prediction_month);
```

### 8.5 MongoDB: user_favorites

User favorites are stored in MongoDB (via NestJS) because they're user-scoped and follow existing notification/preference patterns.

```typescript
// backend/src/market-intelligence/schemas/user-favorite.schema.ts
@Schema({ timestamps: true })
export class UserFavorite extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  commodityId: string;         // UUID from approved_commodities (PostgreSQL)

  @Prop({ required: true })
  commodityName: string;       // denormalized for display

  @Prop()
  hsCode: string;

  createdAt: Date;
  updatedAt: Date;
}

// Compound unique index: { userId: 1, commodityId: 1 }
```

### 8.6 Notification Integration

No new table needed. Uses existing `Notification` schema with new notification types:

| Type | Trigger | Content |
|------|---------|---------|
| `prediction_published` | New prediction published for a favorited commodity | "{commodity} monthly prediction is ready — {direction} {change}%" |
| `prediction_retracted` | Admin retracts a published prediction (rare) | "{commodity} prediction has been updated" |

---

## 9. API Endpoints

### 9.1 Admin Endpoints (AI_NEW FastAPI)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/v1/niche/predictions/generate` | Trigger monthly prediction generation |
| `GET` | `/v1/niche/predictions/jobs` | List prediction jobs (paginated) |
| `GET` | `/v1/niche/predictions/jobs/{job_id}` | Get job details and per-commodity status |
| `GET` | `/v1/niche/predictions` | List all predictions (filterable by month, status) |
| `GET` | `/v1/niche/predictions/{prediction_id}` | Get full prediction with metadata |
| `GET` | `/v1/niche/predictions/review-queue` | List predictions pending admin review |
| `POST` | `/v1/niche/predictions/{prediction_id}/publish` | Publish a pending prediction |
| `POST` | `/v1/niche/predictions/{prediction_id}/retract` | Retract a published prediction |
| `GET` | `/v1/niche/predictions/accuracy` | Get accuracy metrics (aggregated) |
| `GET` | `/v1/niche/predictions/accuracy/{commodity_id}` | Get accuracy for specific commodity |
| `POST` | `/v1/niche/predictions/accuracy/evaluate` | Trigger accuracy evaluation |

### 9.2 Admin Endpoints (NestJS Proxy)

NestJS proxies admin endpoints through `AdminAuthGuard` + `@AdminAction` decorator:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/market-intelligence/generate` | Trigger prediction generation |
| `GET` | `/admin/market-intelligence/jobs` | List prediction jobs |
| `GET` | `/admin/market-intelligence/predictions` | List all predictions |
| `GET` | `/admin/market-intelligence/review-queue` | Pending review queue |
| `POST` | `/admin/market-intelligence/predictions/:id/publish` | Publish prediction |
| `POST` | `/admin/market-intelligence/predictions/:id/retract` | Retract prediction |
| `GET` | `/admin/market-intelligence/accuracy` | Accuracy dashboard data |

### 9.3 User Endpoints (NestJS)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/market-intelligence/predictions` | Get current month's published predictions |
| `GET` | `/market-intelligence/predictions/:commodityId` | Get specific commodity prediction |
| `GET` | `/market-intelligence/summary` | Top 3 predictions for homepage cards |
| `GET` | `/market-intelligence/favorites` | Get user's favorited commodities |
| `POST` | `/market-intelligence/favorites/:commodityId` | Add commodity to favorites |
| `DELETE` | `/market-intelligence/favorites/:commodityId` | Remove from favorites |

---


---

## 10. Admin Portal UI Specifications

> **Full wireframes and user flows have been migrated to the dedicated UI spec.**
> See [[ai/NICHE_COMMODITY_FINDER_UI_SPEC]] for all admin portal wireframes.

### 10.1 Pages Summary

| Page | Purpose | UI Spec Section |
|------|---------|-----------------|
| **Predictions Management** | All predictions list, review queue, generation jobs | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.9]] |
| **Prediction Review Modal** | Confidence breakdown, flags, publish/skip/edit actions | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.10]] |
| **Accuracy Dashboard** | Internal tracking — directional accuracy, price error, per-commodity table | [[NICHE_COMMODITY_FINDER_UI_SPEC#4.11]] |

### 10.2 Settings (Model Selection + Thresholds)

Market Intelligence settings live in the **shared Niche Commodity Finder Settings page** (see [[ai/PRD_1_Government_Data_Extraction#10.3 LLM Model Configuration]]).

Key settings for Market Intelligence:

| Setting | Key | Default | Description |
|---------|-----|---------|-------------|
| **Predictions Model** | `market_predictions_model` | `gemini-2.0-flash` | LLM model for monthly predictions |
| **Auto-publish Threshold** | `auto_publish_threshold` | `75` | Confidence % above which predictions auto-publish |
| **Cost Alert** | `cost_alert_threshold_usd` | `50` | Monthly LLM cost alert threshold |

The **model dropdown** shows all 5 models from the shared model registry (see [[ai/PRD_1_Government_Data_Extraction#10.3.1 Available Model Registry]]):
- Claude Opus 4 ($$$), Claude Sonnet 4.6 ($$), Claude Haiku 4.5 ($)
- Gemini 2.5 Pro ($$), Gemini 2.0 Flash ($)

The selected model is read from `niche_settings` table at generation time and recorded in each prediction's metadata (`llm_model` field).

---

## 11. Buyer Frontend UI Specifications

> **Full wireframes and user flows have been migrated to the dedicated UI spec.**
> See [[ai/NICHE_COMMODITY_FINDER_UI_SPEC]] for all buyer frontend wireframes.

### 11.1 Pages Summary

| Page | Route | Purpose | UI Spec Section |
|------|-------|---------|-----------------|
| **Market Intelligence** | `/buyer/market-intelligence` | All predictions, favorites pinned at top, search/filter | [[NICHE_COMMODITY_FINDER_UI_SPEC#5.1]] |
| **Homepage Cards** | `/buyer/homepage` (section) | Top 3 predictions as summary cards | [[NICHE_COMMODITY_FINDER_UI_SPEC#5.2]] |
| **Prediction Detail** | `/buyer/market-intelligence/:commodityId` | Full prediction report with factors, risks, importers/exporters | [[NICHE_COMMODITY_FINDER_UI_SPEC#5.3]] |
| **Favorites** | (interaction on cards) | Star/unstar commodities, pinned to top, notification on new predictions | [[NICHE_COMMODITY_FINDER_UI_SPEC#5.4]] |

### 11.2 Key User Flows

For complete click-by-click user journeys, see:
- [[NICHE_COMMODITY_FINDER_UI_SPEC#6.4]] — Buyer: Market Intelligence Discovery
- [[NICHE_COMMODITY_FINDER_UI_SPEC#6.5]] — Buyer: Acting on a Prediction

---

## 12. Notification Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION DISPATCH FLOW                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRIGGER: Prediction status changes to "published"                         │
│                                                                             │
│  STEP 1: Identify affected users                                           │
│  ──────────────────────────────                                            │
│  Query MongoDB: UserFavorite WHERE commodityId = prediction.commodity_id   │
│  Result: List of userId values                                             │
│                                                                             │
│  STEP 2: Create notifications                                              │
│  ────────────────────────────                                              │
│  For each userId:                                                          │
│  └── notificationService.createNotification({                              │
│        userId,                                                             │
│        type: "prediction_published",                                       │
│        category: "market_intelligence",                                    │
│        title: "New prediction: {commodityName}",                           │
│        message: "{commodityName}: {direction} {change}% — {action}",       │
│        data: { commodityId, predictionId, direction, action },             │
│      })                                                                    │
│                                                                             │
│  STEP 3: User sees notification                                            │
│  ───────────────────────────                                               │
│  Bell icon shows unread count                                              │
│  Click notification → navigates to prediction detail page                  │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  RETRACTION NOTIFICATION (rare):                                           │
│  When admin retracts a published prediction:                               │
│  └── Same flow but type = "prediction_retracted"                          │
│  └── message: "{commodityName} prediction has been updated"               │
│  └── Prediction detail page shows "Retracted" badge                       │
│                                                                             │
│  NO NOTIFICATION for:                                                      │
│  • Predictions the user has NOT favorited                                  │
│  • Skipped or failed predictions                                           │
│  • Pending review predictions (not visible to users yet)                   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Accuracy Tracking (Admin-Only)

### 13.1 Evaluation Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    ACCURACY EVALUATION FLOW                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRIGGER: Admin clicks "Evaluate" OR monthly cron (after new gov data)    │
│                                                                             │
│  For each published prediction from PREVIOUS month:                        │
│                                                                             │
│  STEP 1: Get the prediction                                                │
│  ──────────────────────────                                                │
│  prediction = commodity_predictions WHERE                                  │
│    prediction_month = last_month AND status = "published"                  │
│                                                                             │
│  STEP 2: Get actual outcome                                                │
│  ──────────────────────────                                                │
│  Fetch current month's parsed_records for the same commodity               │
│  Calculate actual_price (derived unit price: value/volume)                 │
│  Calculate actual_change_pct vs prediction's current_price                 │
│  Determine actual_direction: up/down/stable                                │
│                                                                             │
│  STEP 3: Compare                                                           │
│  ────────────                                                              │
│  direction_correct = (predicted_direction == actual_direction)              │
│  price_error_pct = abs(predicted_mid - actual_price) / actual_price * 100  │
│                                                                             │
│  STEP 4: Store result                                                      │
│  ─────────────────                                                         │
│  INSERT into prediction_accuracy table                                     │
│                                                                             │
│  ────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  EDGE CASE: First month (no previous predictions to evaluate)             │
│  → Nothing to evaluate. prediction_accuracy table is empty.               │
│  → Historical accuracy component defaults to 50 (neutral).                │
│                                                                             │
│  EDGE CASE: No new government data for evaluation                          │
│  → Cannot evaluate. Mark as "evaluation_pending" with reason.             │
│  → Re-attempt on next evaluation trigger.                                  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Accuracy Metrics

| Metric | Calculation | Target |
|--------|-------------|--------|
| **Directional Accuracy** | correct_predictions / total_evaluated * 100 | > 65% |
| **Price Range Accuracy** | predictions_within_range / total_evaluated * 100 | > 50% |
| **Average Price Error** | mean(abs(predicted - actual) / actual * 100) | < 15% |

---

## 14. Folder Structure & Implementation Phases

### 14.1 AI_NEW Repository

```
AI_NEW/server/niche/
└── intelligence/                      # NEW: Market Intelligence (Stage 4)
    ├── __init__.py
    ├── router.py                      # FastAPI router for prediction endpoints
    ├── data_aggregator.py             # Multi-source data collection
    ├── prediction_generator.py        # Monthly batch job orchestration
    ├── prediction_validator.py        # LLM response validation
    ├── confidence_scorer.py           # 6-component confidence calculation
    ├── accuracy_evaluator.py          # Predicted vs actual comparison
    ├── statistical_fallback.py        # Fallback when LLM fails
    │
    ├── models/                        # Pydantic models
    │   ├── __init__.py
    │   ├── prediction.py              # PredictionResult, DataBundle, etc.
    │   ├── confidence.py              # ConfidenceResult, DataQualityReport
    │   └── accuracy.py                # AccuracyResult
    │
    └── prompts/                       # LLM prompt templates
        ├── __init__.py
        └── prediction_prompts.py      # System + user prompts
```

### 14.2 NestJS Backend

```
backend/src/
└── market-intelligence/               # NEW: User-facing + admin proxy
    ├── market-intelligence.module.ts
    ├── market-intelligence.controller.ts     # User endpoints
    ├── market-intelligence.service.ts        # Business logic + AI_NEW proxy
    ├── market-intelligence-admin.controller.ts  # Admin endpoints
    ├── dto/
    │   ├── prediction-query.dto.ts
    │   └── favorite.dto.ts
    └── schemas/
        └── user-favorite.schema.ts    # MongoDB schema
```

### 14.3 Admin Portal

```
admin-portal/src/features/
└── market-intelligence/               # NEW: Admin management pages
    ├── index.ts
    ├── pages/
    │   ├── PredictionsPage.tsx         # All predictions + review queue + jobs
    │   ├── PredictionReviewPage.tsx    # Single prediction review modal
    │   ├── AccuracyPage.tsx            # Accuracy dashboard
    │   └── MISettingsPage.tsx          # Configuration
    ├── components/
    │   ├── PredictionCard.tsx
    │   ├── ConfidenceBreakdown.tsx
    │   └── AccuracyChart.tsx
    ├── hooks/
    │   ├── usePredictions.ts
    │   └── useAccuracy.ts
    └── types/
        └── index.ts
```

### 14.4 Buyer Frontend

```
frontend/src/
├── buyer/pages/
│   ├── market-intelligence.tsx         # NEW: Full predictions page
│   └── market-intelligence-detail.tsx  # NEW: Commodity detail view
├── components/
│   └── market-intelligence/            # NEW: MI-specific components
│       ├── PredictionCard.tsx
│       ├── PredictionDetail.tsx
│       ├── HomepageInsightCards.tsx
│       └── FavoriteButton.tsx
├── services/
│   └── market-intelligence.service.ts  # NEW: API calls
└── types/
    └── marketIntelligenceTypes.ts      # NEW: TypeScript types
```

### 14.5 Implementation Phases

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION ROADMAP                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: FOUNDATION (Week 1-2)                                            │
│  ──────────────────────────────                                            │
│  ☐ PostgreSQL migration: prediction_jobs, commodity_predictions,           │
│    prediction_data_sources, prediction_accuracy tables                     │
│  ☐ Create AI_NEW/server/niche/intelligence/ folder structure              │
│  ☐ Pydantic models for predictions, confidence, accuracy                  │
│  ☐ FastAPI router skeleton with basic CRUD endpoints                      │
│  ☐ NestJS market-intelligence module skeleton                             │
│  ☐ MongoDB UserFavorite schema                                            │
│                                                                             │
│  PHASE 2: PREDICTION PIPELINE (Week 3-5)                                   │
│  ────────────────────────────────────────                                  │
│  ☐ Data aggregator (fetch from parsed_records, trade_records, signals)    │
│  ☐ Data quality assessment                                                │
│  ☐ LLM prompt templates                                                   │
│  ☐ Prediction generator (batch job orchestration)                         │
│  ☐ Response validation + sanity checks                                    │
│  ☐ Statistical fallback                                                    │
│  ☐ Confidence scoring algorithm (all 6 components)                        │
│  ☐ Auto-publish / pending_review logic                                    │
│  ☐ End-to-end pipeline test                                               │
│                                                                             │
│  PHASE 3: ADMIN UI (Week 6-7)                                              │
│  ─────────────────────────────                                             │
│  ☐ NestJS admin proxy endpoints                                           │
│  ☐ Admin Portal: Predictions page (all + review queue + jobs)             │
│  ☐ Admin Portal: Prediction review modal                                  │
│  ☐ Admin Portal: Publish / retract actions                                │
│  ☐ Admin Portal: Accuracy dashboard                                       │
│  ☐ Admin Portal: Settings page                                            │
│  ☐ Accuracy evaluator                                                     │
│                                                                             │
│  PHASE 4: BUYER UI + NOTIFICATIONS (Week 8-10)                             │
│  ──────────────────────────────────────────────                            │
│  ☐ NestJS user endpoints (predictions, favorites)                         │
│  ☐ Frontend: Market Intelligence page                                     │
│  ☐ Frontend: Homepage summary cards                                       │
│  ☐ Frontend: Commodity detail view                                        │
│  ☐ Frontend: Favorites (star/unstar)                                      │
│  ☐ Notification dispatch (favorited commodity → in-app notification)      │
│  ☐ Frontend route registration + sidebar update                           │
│  ☐ User acceptance testing                                                │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 14.6 Success Criteria

| Phase | Criteria |
|-------|----------|
| **Phase 1** | Schema deployed, empty prediction list visible in admin portal |
| **Phase 2** | Manual trigger produces predictions for all approved commodities |
| **Phase 3** | Admin can review, publish, retract predictions; accuracy data visible |
| **Phase 4** | Buyers see predictions on dashboard, can favorite commodities, receive notifications |

### 14.7 Dependencies

| Dependency | Required By | Status |
|------------|-------------|--------|
| PostgreSQL niche schema (Stage 1) | Phase 1 | Must be deployed first |
| approved_commodities data | Phase 2 | Needs at least 1 approved commodity |
| LLM API access (Claude/Gemini) | Phase 2 | Available via existing ai_factory.py |
| Stage 1 parsed_records data | Phase 2 | Needs government data ingested |
| Existing notification service | Phase 4 | Available at backend/src/notification/ |

---

## 15. Risks & Mitigations

### 15.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **LLM output quality** | Poor predictions damage trust | Validation pipeline + statistical fallback + admin review |
| **Data staleness** | Predictions based on old data | Freshness scoring penalizes confidence; skip if > 60 days |
| **LLM cost overrun** | Budget exceeded | Token budgeting, use Haiku for routine predictions, track cost per job |
| **Prediction consistency** | Contradictory predictions month-to-month | Include previous predictions in prompt context |

### 15.2 Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Admin bottleneck** | Low-confidence predictions pile up unreviewed | Auto-publish threshold + admin notification if review queue > 24h |
| **Low accuracy** | Users stop trusting predictions | Internal tracking, iterate on prompts, adjust confidence thresholds |
| **No government data available** | Cannot generate predictions | Graceful skip with "insufficient data" status, admin alerted |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 2026 | BREYUS Team | Initial PRD for Market Intelligence System |

---

*This PRD defines the Market Intelligence System (Stage 4) of the Breyus Niche Commodity Finder AI. For the foundational data extraction module, see [[ai/PRD_1_Government_Data_Extraction|Government Data Extraction PRD]]. For the complete system architecture covering all 4 stages, see [[ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE|Technical Architecture]].*

## Related
- [[PRD_1_Government_Data_Extraction]]
- [[NICHE_COMMODITY_FINDER_PRD]]
- [[ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE]]
- [[MOC-AI]]
