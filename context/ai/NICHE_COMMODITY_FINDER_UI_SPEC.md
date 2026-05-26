---
type: ui-spec
module: ai
tags: [ai, ui, design, niche-commodity]
---

# Niche Commodity Finder — Consolidated UI/Design Specification

> **Document Type:** UI Specification
> **Version:** 1.0
> **Last Updated:** March 2026
> **Status:** Implementation Ready

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Principles](#2-design-principles)
3. [Admin Portal — Sidebar Navigation](#3-admin-portal--sidebar-navigation)
4. [Admin Portal Pages](#4-admin-portal-pages)
5. [Buyer Frontend Pages](#5-buyer-frontend-pages)
6. [Key User Flows](#6-key-user-flows)
7. [Notification UX](#7-notification-ux)
8. [Component Library Reference](#8-component-library-reference)
9. [Related Documents](#9-related-documents)

---

## 1. Overview

### Purpose

This document is the **single source of truth** for all Niche Commodity Finder UI across both the Admin Portal and the Buyer Frontend. It consolidates and replaces scattered wireframes that previously lived across multiple PRDs.

### Audiences

| Surface | Stack | Audience |
|---------|-------|----------|
| Admin Portal | Vite + shadcn/ui + TailwindCSS | Platform administrators |
| Buyer Frontend | React (CRA) + TailwindCSS + Recharts | Buyer users |

### PRD Cross-References

All UI in this document implements requirements from:

- [[ai/PRD_1_Government_Data_Extraction]] — Government data ingestion, scraper management, niche scoring, candidate review
- [[ai/PRD_2_3_Contact_Discovery]] — Buyer and seller contact discovery, quality scoring, verification
- [[ai/PRD_4_Market_Intelligence]] — Monthly predictions, confidence scoring, buyer dashboard, accuracy tracking
- [[ai/PRD_5_Outreach]] — Drip campaigns, outreach management, engagement tracking

Technical architecture backing these pages is defined in [[ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE]].

---

## 2. Design Principles

### Admin Portal

- Use **shadcn/ui** components exclusively (Button, Table, Dialog, Badge, Card, Tabs, Select, Input)
- Match existing admin pages: Users, Companies, KYC, Trades
- Consistent page layout: breadcrumb header, action buttons top-right, content area below
- All tables support sorting, filtering, pagination (20 rows default)
- Modals for detail views and review actions
- Toast notifications for success/error feedback

### Buyer Frontend

- **TailwindCSS** utility classes, card-based layouts
- **Recharts** for any charts or data visualizations
- Consistent with existing buyer pages (Homepage, AI, Trade)
- Mobile-responsive: single column below `md` breakpoint
- Skeleton loaders during data fetches

### Status Badge Colors (Global)

| Color | Meaning | Examples |
|-------|---------|---------|
| Green (`bg-green-100 text-green-800`) | Success, Active, Verified, Approved | Published, Active, Verified |
| Yellow (`bg-yellow-100 text-yellow-800`) | Pending, Warning, Needs Attention | Review, Pending, Unverified |
| Red (`bg-red-100 text-red-800`) | Failed, Rejected, Error, Flagged | Failed, Rejected, Flagged |
| Blue (`bg-blue-100 text-blue-800`) | Info, In Progress, Processing | Running, Processing |
| Gray (`bg-gray-100 text-gray-800`) | Inactive, Archived, Skipped | Archived, Skipped, Paused |

### Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< md (768px)` | Single column, sidebar collapses to hamburger, cards stack |
| `md - lg` | Two-column where applicable, sidebar visible |
| `>= lg (1024px)` | Full layout with sidebar, multi-column grids |

---

## 3. Admin Portal — Sidebar Navigation

The Niche Commodity Finder appears as a collapsible section in the admin sidebar. Badge counts update in real time via polling (30s interval).

```
┌─────────────────────────────────────┐
│  BREYUS ADMIN                       │
│                                     │
│  ├── Dashboard                      │
│  ├── Users                          │
│  ├── Companies                      │
│  ├── KYC                            │
│  ├── Trades                         │
│  ├── Disputes                       │
│  ├── Blog                           │
│  │                                  │
│  ▼ NICHE COMMODITY FINDER           │
│     │                               │
│     ├── Dashboard          (●2)     │  ← alert badge (pending items)
│     │                               │
│     ├─▼ Niche Discovery             │
│     │   ├── Runs                    │
│     │   ├── Commodities    (●5)     │  ← pending review count
│     │   └── Approved                │
│     │                               │
│     ├─▼ Contacts                    │
│     │   ├── Buyers                  │
│     │   └── Sellers                 │
│     │                               │
│     ├── Outreach                    │
│     │                               │
│     ├─▼ Market Intelligence         │
│     │   ├── Predictions    (●3)     │  ← pending review count
│     │   └── Accuracy                │
│     │                               │
│     ├── Job Logs           (●1)     │  ← error count
│     ├── Analytics                   │
│     └── Settings                    │
│                                     │
│  ├── System                         │
│  └── Logout                         │
└─────────────────────────────────────┘
```

**Badge Logic:**

| Badge | Source | Color |
|-------|--------|-------|
| Dashboard alerts | Sum of pending commodities + pending predictions + failed jobs | Red |
| Commodities pending | `niche_candidates WHERE status = 'pending'` count | Yellow |
| Predictions review | `monthly_predictions WHERE status = 'review'` count | Yellow |
| Job Logs errors | `scraper_runs WHERE status = 'failed' AND acknowledged = false` count | Red |

---

## 4. Admin Portal Pages

### 4.1 Niche Dashboard

The hub page. Shows high-level alerts, pipeline metrics, and recent activity. Admin lands here when clicking the Niche Commodity Finder section header.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    NICHE COMMODITY FINDER — DASHBOARD                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ALERTS                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠  5 commodity candidates pending review          [Go to Review →]  │  │
│  │ ⚠  3 predictions below confidence threshold       [Go to Review →]  │  │
│  │ ✗  1 scraper job failed (APEDA, 2h ago)           [View Logs →]     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  PIPELINE METRICS                                                          │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │  PENDING       │ │  APPROVED     │ │  CONTACTS     │ │  PREDICTIONS  │  │
│  │  REVIEW        │ │  THIS MONTH   │ │  TOTAL        │ │  SENT         │  │
│  │                │ │               │ │               │ │               │  │
│  │     5          │ │     12        │ │    847        │ │     28        │  │
│  │  ↑ 3 new       │ │  ↑ 4 from     │ │  ↑ 52 new    │ │  for 8        │  │
│  │  this week     │ │  last month   │ │  this month   │ │  commodities  │  │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘  │
│                                                                            │
│  PERFORMANCE METRICS                                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  Scraper Success Rate     [████████████████████░░] 91%               │  │
│  │  LLM Analysis Coverage    [██████████████████░░░░] 85%               │  │
│  │  Prediction Accuracy      [██████████████░░░░░░░░] 72%               │  │
│  │  Contact Verification     [██████████████████████] 95%               │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  RECENT ACTIVITY                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  12:34  Scraper run completed: DGCIS (142 records)            [→]   │  │
│  │  11:20  Admin approved: Moringa Leaf Powder (HS 12119090)     [→]   │  │
│  │  10:45  Prediction published: Saffron (↑ +12%, 92% conf.)    [→]   │  │
│  │  09:30  New contacts discovered: 14 buyers for Spirulina      [→]   │  │
│  │  08:15  Outreach drip sent: Day 8 for Ashwagandha (23 rcpts) [→]   │  │
│  │                                                                      │  │
│  │  [Show More ↓]                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Implementation Notes:**
- Alerts section: fetch from `/admin/niche/dashboard/alerts`. Dismiss individual alerts with X.
- Pipeline metric cards: `shadcn Card` with `shadcn Badge` for trends.
- Performance bars: custom `ScoreBar` component (see Section 8).
- Activity feed: 10 most recent events, paginated on "Show More". Each row is clickable, navigates to relevant detail page.

---

### 4.2 Discovery > Runs Tab

Shows scraper run history. Each row is clickable for detail view.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    NICHE DISCOVERY — RUNS                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Niche Discovery > Runs                        [+ Trigger New Run]  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  FILTERS: [Source ▼] [Status ▼] [Date Range ▼] [Search...]               │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Run #  │ Date            │ Status │ Sources │ Records │ Candidates  │  │
│  ├────────┼─────────────────┼────────┼─────────┼─────────┼─────────────┤  │
│  │ #047   │ 2026-03-25 14:30│ ✅ Done │ APEDA   │   142   │    8        │  │
│  │ #046   │ 2026-03-25 14:30│ ✅ Done │ DGCIS   │   310   │   12        │  │
│  │ #045   │ 2026-03-24 02:00│ ⚠ Warn │ ITC     │    89   │    3        │  │
│  │ #044   │ 2026-03-23 02:00│ ✅ Done │ APEDA   │   138   │    7        │  │
│  │ #043   │ 2026-03-22 02:00│ ❌ Fail │ COMTRADE│     0   │    0        │  │
│  └────────┴─────────────────┴────────┴─────────┴─────────┴─────────────┘  │
│                                                                            │
│  Showing 1-5 of 47 runs                        [← Prev]  1 2 3  [Next →] │
│                                                                            │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  CLICK ROW → RUN DETAIL PANEL (slides in from right)                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Run #047 — APEDA                                     [✗ Close]    │  │
│  │                                                                      │  │
│  │  Status: ✅ Completed                                               │  │
│  │  Started: 2026-03-25 14:30:12                                       │  │
│  │  Finished: 2026-03-25 14:32:45                                      │  │
│  │  Duration: 2m 33s                                                   │  │
│  │                                                                      │  │
│  │  Records Ingested:   142                                            │  │
│  │  New Records:         38                                            │  │
│  │  Updated Records:    104                                            │  │
│  │  Failed Records:       0                                            │  │
│  │  Candidates Found:     8                                            │  │
│  │                                                                      │  │
│  │  Checksum: sha256:a1b2c3d4...                                       │  │
│  │                                                                      │  │
│  │  WARNINGS (0)                                                       │  │
│  │  ERRORS (0)                                                         │  │
│  │                                                                      │  │
│  │  [View Logs]  [Re-run This Source]                                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**[+ Trigger New Run] Button:**
- Opens a dropdown with source options: All Sources, APEDA, DGCIS, ITC Trade Map, UN COMTRADE, FAOSTAT
- Clicking a source triggers an async job and navigates to Job Logs page

**Status Icons:**
- ✅ Done = green badge, all records processed
- ⚠ Warn = yellow badge, completed with warnings (partial failures)
- ❌ Fail = red badge, run failed entirely

---

### 4.3 Discovery > Commodities Tab

The primary review queue. Admin reviews niche commodity candidates here.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    NICHE DISCOVERY — COMMODITIES (Pending Review)           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Niche Discovery > Commodities                 [Generate Analysis ▼]│  │
│  │  [Pending (5)]  [Watchlist (2)]  [Rejected (14)]                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ☐ Select All                         Batch: [Generate Analysis ▼]        │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ │ Commodity          │ HS Code  │ Score │ Vol │ Vola│ Emrg│ LLM   │  │
│  ├───┼────────────────────┼──────────┼───────┼─────┼─────┼─────┼───────┤  │
│  │ ☐ │ Moringa Leaf Powder│ 12119090 │  82   │  28 │  31 │  23 │ ✅ Full│  │
│  │ ☐ │ Spirulina Extract  │ 12129990 │  76   │  22 │  29 │  25 │ ✅ Full│  │
│  │ ☐ │ Ashwagandha Root   │ 12119029 │  71   │  25 │  24 │  22 │ ⚠ Short│  │
│  │ ☐ │ Baobab Powder      │ 08109010 │  68   │  20 │  27 │  21 │ ⚠ None│  │
│  │ ☐ │ Turmeric Oleoresin │ 13021990 │  65   │  18 │  26 │  21 │ ⚠ None│  │
│  └───┴────────────────────┴──────────┴───────┴─────┴─────┴─────┴───────┘  │
│                                                                            │
│  Score = Vol + Vola + Emrg (each 0-33, total 0-100)                       │
│  LLM: ✅ Full = detailed analysis  |  ✅ Short = summary only             │
│        ⚠ Short = partial           |  ⚠ None = not yet generated          │
│                                                                            │
│  CLICK ROW → Opens Candidate Review Interface (Section 4.5)               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**[Generate Analysis ▼] Dropdown:**
- "Generate for Selected" — runs LLM analysis on checked rows
- "Generate for All Pending" — runs on entire pending queue
- "Re-generate (overwrite)" — re-runs LLM for items that already have analysis

**Column Definitions:**
- **Score**: Composite niche score (0-100), sum of three sub-scores
- **Vol**: Volume sub-score (0-33). Lower trade volume = higher score.
- **Vola**: Volatility sub-score (0-33). Higher price volatility = higher score.
- **Emrg**: Emergence sub-score (0-33). Higher year-over-year growth = higher score.
- **LLM**: Status of LLM-generated analysis

---

### 4.4 Discovery > Approved Tab

Commodities that passed admin review and are active in the system.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    NICHE DISCOVERY — APPROVED COMMODITIES                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Niche Discovery > Approved               Total: 34 commodities     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  FILTERS: [Status ▼] [Category ▼] [Search...]                            │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Commodity          │ HS Code  │ Approved     │ Status  │ Last Pred. │  │
│  ├────────────────────┼──────────┼──────────────┼─────────┼────────────┤  │
│  │ Moringa Leaf       │ 12119090 │ 2026-02-15   │ Active  │ Mar 2026   │  │
│  │ Saffron            │ 09102000 │ 2026-01-20   │ Active  │ Mar 2026   │  │
│  │ Spirulina          │ 12129990 │ 2026-01-10   │ Active  │ Mar 2026   │  │
│  │ Dragon Fruit       │ 08109020 │ 2025-12-05   │ Archived│ Feb 2026   │  │
│  │ Chia Seeds         │ 12079990 │ 2025-11-18   │ Active  │ Mar 2026   │  │
│  └────────────────────┴──────────┴──────────────┴─────────┴────────────┘  │
│                                                                            │
│  ROW ACTIONS (per-row dropdown):                                          │
│  ┌─────────────────────────┐                                              │
│  │ 👁  View History        │  → shows approval timeline + all reviews     │
│  │ ✎  Edit Details         │  → edit commodity metadata                   │
│  │ 📦  Archive             │  → move to Archived status (reversible)      │
│  │ ↻  Reactivate           │  → move Archived back to Active              │
│  │ 🔄  Re-score            │  → re-run niche scoring with latest data     │
│  └─────────────────────────┘                                              │
│                                                                            │
│  Showing 1-5 of 34                              [← Prev]  1 2 3  [Next →]│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.5 Candidate Review Interface

The core review screen. Opens when admin clicks a commodity row in the Commodities tab (Section 4.3). Full-page view, not a modal.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    CANDIDATE REVIEW                         [← Back]      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────┬──────────────────────────────────────┐│
│  │  COMMODITY DATA                 │  LLM ANALYSIS                       ││
│  │  ──────────────                 │  ────────────                        ││
│  │                                 │                                      ││
│  │  Name: Moringa Leaf Powder      │  Model: Claude Haiku 4.5             ││
│  │  HS Code: 12119090              │  Generated: 2026-03-25 14:35         ││
│  │  Category: Herbal Extracts      │                                      ││
│  │  First Seen: Run #042           │  MARKET OVERVIEW                     ││
│  │                                 │  Moringa leaf powder is an            ││
│  │  NICHE SCORE: 82/100           │  emerging superfood ingredient       ││
│  │                                 │  with growing demand in health-      ││
│  │  Volume     [████████░░] 28/33  │  conscious markets. India is the    ││
│  │  Volatility [█████████░] 31/33  │  dominant exporter, accounting      ││
│  │  Emergence  [███████░░░] 23/33  │  for ~80% of global supply.        ││
│  │                                 │                                      ││
│  │  TRADE DATA SNAPSHOT            │  KEY FINDINGS                        ││
│  │  ────────────────────           │  • Growing demand in US, EU, Japan  ││
│  │  Avg Monthly Volume: 340 MT     │  • Supply concentrated in India    ││
│  │  YoY Growth: +34%              │  • Price volatility driven by       ││
│  │  Price Range: $2,800-4,200/MT   │    monsoon seasonality             ││
│  │  Top Exporters: IN, PH, NG     │  • Organic certification premium   ││
│  │  Top Importers: US, DE, JP     │    of 30-45%                        ││
│  │                                 │                                      ││
│  │  DATA SOURCES                   │  RISK FACTORS                        ││
│  │  ☑ APEDA (Mar 2026)            │  • Weather dependency (moderate)    ││
│  │  ☑ DGCIS (Feb 2026)            │  • Quality standard variations     ││
│  │  ☐ ITC (stale, Nov 2025)       │  • Limited cold chain in source    ││
│  │  ☐ COMTRADE (unavailable)      │                                      ││
│  │                                 │  RECOMMENDATION                      ││
│  │                                 │  Strong niche candidate. High        ││
│  │                                 │  growth trajectory with adequate    ││
│  │                                 │  data coverage for predictions.     ││
│  └─────────────────────────────────┴──────────────────────────────────────┘│
│                                                                            │
│  ─── OR, if LLM analysis not yet generated: ───                           │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │  LLM analysis has not been generated for this candidate.               ││
│  │                                                                        ││
│  │  [Generate Analysis]   [Generate Short Summary]                        ││
│  │                                                                        ││
│  │  Estimated cost: ~$0.003 (Claude Haiku 4.5)                            ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│  ADMIN DECISION                                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │  Rejection Reason (required if rejecting):                             ││
│  │  [Select reason ▼]                                                     ││
│  │  ┌──────────────────────────────┐                                      ││
│  │  │ Too mainstream               │                                      ││
│  │  │ Insufficient data            │                                      ││
│  │  │ Already covered              │                                      ││
│  │  │ Regulatory concerns          │                                      ││
│  │  │ Other (type reason)          │                                      ││
│  │  └──────────────────────────────┘                                      ││
│  │                                                                        ││
│  │  Admin Notes (optional):                                               ││
│  │  ┌──────────────────────────────────────────────────────────────────┐  ││
│  │  │                                                                  │  ││
│  │  └──────────────────────────────────────────────────────────────────┘  ││
│  │                                                                        ││
│  │  [✓ Approve]          [✗ Reject]          [👁 Watchlist]              ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Decision Actions:**
- **Approve**: Moves commodity to Approved tab. Triggers contact discovery jobs. Green toast: "Moringa Leaf Powder approved and added to active commodities."
- **Reject**: Requires reason selection. Moves to Rejected sub-tab. Yellow toast: "Moringa Leaf Powder rejected."
- **Watchlist**: Keeps in pending but tagged as watchlist. Will be re-evaluated on next data refresh.

---

### 4.6 Contacts > Buyers Tab

Displays discovered buyer contacts for approved niche commodities.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    CONTACTS — BUYERS                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Contacts > Buyers                  Total: 412     [Export Selected ↓]│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  FILTERS: [Commodity ▼] [Score Range ▼] [Status ▼] [Search...]           │
│                                                                            │
│  ☐ Select All                 Bulk: [Export CSV] [Mark Verified] [Flag]   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ │ Company            │ Contact      │ Email          │ Phone      │  │
│  │   │                    │              │                │            │  │
│  │   │ Quality │ Status                                               │  │
│  ├───┼────────────────────┼──────────────┼────────────────┼────────────┤  │
│  │   │         │                                                      │  │
│  ├───┼────────────────────┼──────────────┼────────────────┼────────────┤  │
│  │ ☐ │ NutriHealth Corp   │ J. Smith     │ j@nutri.com    │ +1-555-012 │  │
│  │   │    92   │ ✓ Verified                                           │  │
│  ├───┼────────────────────┼──────────────┼────────────────┼────────────┤  │
│  │ ☐ │ GreenLeaf Imports  │ A. Mueller   │ am@green.de    │ +49-30-123 │  │
│  │   │    87   │ ✓ Verified                                           │  │
│  ├───┼────────────────────┼──────────────┼────────────────┼────────────┤  │
│  │ ☐ │ Tokyo Organics     │ K. Tanaka    │ kt@tokyoorg.jp │ +81-3-4567 │  │
│  │   │    74   │ ⚠ Unverified                                         │  │
│  ├───┼────────────────────┼──────────────┼────────────────┼────────────┤  │
│  │ ☐ │ SupplyCo Ltd       │ R. Patel     │ rp@supply.in   │ --         │  │
│  │   │    45   │ ❌ Flagged                                            │  │
│  └───┴────────────────────┴──────────────┴────────────────┴────────────┘  │
│                                                                            │
│  QUALITY SCORE BREAKDOWN (shown in row detail on click):                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Email Valid    [████████████████████] 30/30                         │  │
│  │  Phone Valid    [████████████████░░░░] 25/30                         │  │
│  │  Company Match  [████████████████████] 20/20                         │  │
│  │  Role Relevance [██████████████░░░░░░] 17/20                         │  │
│  │  Total:                                92/100                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Showing 1-20 of 412                        [← Prev]  1 2 3 ... [Next →] │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Status Definitions:**
- ✓ Verified — admin has confirmed contact is valid and reachable
- ⚠ Unverified — discovered but not yet confirmed
- ❌ Flagged — marked as invalid, bounced email, or duplicate

**[Export Selected ↓]:** Exports checked rows as CSV with columns: Company, Contact Name, Email, Phone, Quality Score, Commodity, Country.

---

### 4.7 Contacts > Sellers Tab

Same layout as Buyers (Section 4.6) with additional seller-specific columns.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    CONTACTS — SELLERS                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Contacts > Sellers                 Total: 435     [Export Selected ↓]│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  FILTERS: [Commodity ▼] [Score ▼] [Status ▼] [☑ Govt Verified Only]      │
│           [Country ▼] [Search...]                                         │
│                                                                            │
│  ☐ Select All                 Bulk: [Export CSV] [Mark Verified] [Flag]   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☐ │ Company         │ Contact  │ Email       │ Reg #       │ Govt  │  │
│  │   │                 │          │             │             │ Verif.│  │
│  │   │ Quality │ Status│ Export Countries                              │  │
│  ├───┼─────────────────┼──────────┼─────────────┼─────────────┼───────┤  │
│  │ ☐ │ AgriExport IN   │ V. Kumar │ vk@agri.in  │ APEDA-12345 │ ☑ Yes │  │
│  │   │    95   │ ✓ Ver.│ US, DE, JP, AE                                │  │
│  ├───┼─────────────────┼──────────┼─────────────┼─────────────┼───────┤  │
│  │ ☐ │ PhilMoringa Co  │ M. Cruz  │ mc@phil.ph  │ DTI-67890   │ ☑ Yes │  │
│  │   │    88   │ ✓ Ver.│ US, AU, KR                                    │  │
│  ├───┼─────────────────┼──────────┼─────────────┼─────────────┼───────┤  │
│  │ ☐ │ NigeriaFarms    │ O. Bello │ ob@nf.ng    │ --          │ ☐ No  │  │
│  │   │    62   │ ⚠ Unv.│ UK, NL                                       │  │
│  └───┴─────────────────┴──────────┴─────────────┴─────────────┴───────┘  │
│                                                                            │
│  ADDITIONAL COLUMNS vs BUYERS:                                            │
│  • Registration # — government trade registration ID (APEDA, DGCIS, etc.)│
│  • Govt Verified — badge if registration verified against govt database   │
│  • Export Countries — countries this seller exports to                    │
│                                                                            │
│  EXTRA FILTER: [☑ Government Verified Only] checkbox                      │
│  When checked, shows only sellers with verified registration numbers.     │
│                                                                            │
│  Showing 1-20 of 435                        [← Prev]  1 2 3 ... [Next →] │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.8 Outreach Management

Per-commodity campaign management with drip sequence status.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    OUTREACH MANAGEMENT                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Outreach                                  [⏸ Pause All Outreach]   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  COMMODITY CAMPAIGNS                                                       │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  MORINGA LEAF POWDER                          [▶ Active] [⏸ Pause]  │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  Total Contacts: 47   │  Phase: Day 8 (Follow-up)  │  Started: Mar 1│  │
│  │                                                                      │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  │
│  │  │  SENT       │ │  OPENED     │ │  CLICKED    │ │  CONVERTED  │   │  │
│  │  │    47       │ │    31       │ │    12       │ │     3       │   │  │
│  │  │   100%      │ │    66%      │ │    26%      │ │     6%      │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │  │
│  │                                                                      │  │
│  │  [▼ Expand Contact Details]                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  SAFFRON                                      [▶ Active] [⏸ Pause]  │  │
│  │  ──────────────────────────────────────────────────────────────────  │  │
│  │  Total Contacts: 32   │  Phase: Day 22 (Final)     │  Started: Feb 5│  │
│  │                                                                      │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  │
│  │  │  SENT       │ │  OPENED     │ │  CLICKED    │ │  CONVERTED  │   │  │
│  │  │    32       │ │    28       │ │    18       │ │     7       │   │  │
│  │  │   100%      │ │    88%      │ │    56%      │ │    22%      │   │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │  │
│  │                                                                      │  │
│  │  [▼ Expand Contact Details]                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│  EXPANDED CONTACT DETAILS (when ▼ clicked):                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Contact          │ Day 1 (Intro) │ Day 8 (Follow) │ Day 22 (Final) │  │
│  ├──────────────────┼───────────────┼────────────────┼────────────────┤  │
│  │ J. Smith         │ ✅ Opened      │ ✅ Clicked      │ ⏳ Scheduled   │  │
│  │ A. Mueller       │ ✅ Opened      │ ✅ Converted    │ -- Stopped     │  │
│  │ K. Tanaka        │ ✅ Sent        │ ⏳ Scheduled    │ ⏳ Scheduled   │  │
│  │ R. Patel         │ ❌ Bounced     │ -- Skipped     │ -- Skipped     │  │
│  └──────────────────┴───────────────┴────────────────┴────────────────┘  │
│                                                                            │
│  Drip Status Icons:                                                       │
│  ✅ Opened/Clicked/Converted  ⏳ Scheduled  ❌ Bounced  -- Stopped/Skipped │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**[⏸ Pause All Outreach]:** Red confirmation dialog: "This will pause ALL active drip campaigns. Resume individually per commodity."

**Drip Phases (configurable in Settings):**
- Day 1: Introduction email
- Day 8: Follow-up with value proposition
- Day 22: Final outreach with marketplace invitation

**Stopped:** Contact converted (signed up on platform) — no further emails sent.

---

### 4.9 Predictions Management

Manages monthly market intelligence predictions. Reuses wireframe from [[ai/PRD_4_Market_Intelligence]] Section 10.2 with the following tabs.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    MARKET INTELLIGENCE — PREDICTIONS                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Market Intelligence > Predictions          [Generate This Month's] │  │
│  │  [All Predictions] [Review Queue (3)] [Jobs]                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  FILTERS: [Month ▼] [Status ▼] [Commodity ▼] [Search...]                 │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Commodity       │ Direction │ Confidence │ Status      │ Actions    │  │
│  ├─────────────────┼───────────┼────────────┼─────────────┼────────────┤  │
│  │ Moringa Leaf    │ ↑ +12%    │ 78%        │ Published   │ [View]     │  │
│  │ Saffron         │ ↓ -15%    │ 92%        │ Published   │ [View]     │  │
│  │ Spirulina       │ ↑ +8%     │ 45%        │ ⚠ Review    │ [Review]   │  │
│  │ Cardamom        │ → 0%      │ 65%        │ ⚠ Review    │ [Review]   │  │
│  │ Ashwagandha     │ ↑ +5%     │ 71%        │ ⚠ Review    │ [Review]   │  │
│  │ Neem Extract    │ --        │ --         │ Skipped     │ [Details]  │  │
│  └─────────────────┴───────────┴────────────┴─────────────┴────────────┘  │
│                                                                            │
│  Direction Indicators:                                                     │
│  ↑ Green = price increasing    ↓ Red = price decreasing                   │
│  → Yellow = price stable       -- Gray = no prediction                    │
│                                                                            │
│  REVIEW QUEUE TAB (3):                                                    │
│  Shows only predictions with confidence < 75%                             │
│  Admin can: [✓ Publish Anyway] [✎ Edit & Publish] [✗ Skip This Month]   │
│                                                                            │
│  JOBS TAB:                                                                │
│  Monthly generation history with: Month, Status, Duration, Predictions    │
│  Generated, Auto-Published, Sent to Review                                │
│                                                                            │
│  Showing 1-6 of 34                             [← Prev]  1 2 3  [Next →] │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.10 Prediction Review Modal

Opens when admin clicks [Review] on a low-confidence prediction.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    PREDICTION REVIEW                          [✗ Close]    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────┬────────────────────────────────────┐ │
│  │  PREDICTION DATA                │  CONFIDENCE BREAKDOWN              │ │
│  │  ───────────────                │  ────────────────────              │ │
│  │                                  │                                    │ │
│  │  Commodity: Spirulina Extract    │  Overall: 45/100 (Below threshold)│ │
│  │  Month: March 2026              │                                    │ │
│  │  Source: LLM (Claude Haiku 4.5) │  ┌─────────────────────────────┐  │ │
│  │                                  │  │ Freshness     [████░░] 80   │  │ │
│  │  Direction: ↑ UP +8%            │  │ Completeness  [██░░░░] 35   │  │ │
│  │  Action: BUY                     │  │ Agreement     [░░░░░░]  0   │  │ │
│  │  Confidence: 45%                 │  │ History       [██░░░░] 50   │  │ │
│  │                                  │  │ LLM Conf.     [███░░░] 55   │  │ │
│  │  Current: $320/MT               │  │ Stability     [██░░░░] 40   │  │ │
│  │  Predicted: $340-360/MT         │  └─────────────────────────────┘  │ │
│  │                                  │                                    │ │
│  │  Key Factors:                    │  FLAGS:                            │ │
│  │  • Growing health food demand    │  ⚠ Low data completeness          │ │
│  │  • Supply steady from Indonesia  │  ⚠ Signals disagree               │ │
│  │                                  │  ⚠ First prediction (no history)  │ │
│  │  Risks:                          │                                    │ │
│  │  • Regulatory uncertainty        │  Data Sources: 2 of 5 available   │ │
│  │  • Limited price history         │  Price Points: 4 of 12            │ │
│  │                                  │  Signals: 1 agree, 1 disagree     │ │
│  └──────────────────────────────────┴────────────────────────────────────┘ │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ADMIN DECISION                                                      │  │
│  │                                                                      │  │
│  │  Admin Notes (optional):                                             │  │
│  │  ┌──────────────────────────────────────────────────────────────┐    │  │
│  │  │                                                              │    │  │
│  │  └──────────────────────────────────────────────────────────────┘    │  │
│  │                                                                      │  │
│  │  [✓ Publish Anyway]    [✗ Skip This Month]    [✎ Edit & Publish]   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Flag Types:**
- "Stale data" — primary data source older than 60 days
- "Limited data" — fewer than 3 data sources available
- "Signals disagree" — data sources give conflicting direction signals
- "First prediction" — no historical predictions to compare against
- "High-risk commodity" — commodity flagged as high regulatory risk

**[✎ Edit & Publish]:** Opens inline editing of direction, price range, and action before publishing.

---

### 4.11 Accuracy Dashboard

Admin-only analytics page for prediction accuracy tracking.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    MARKET INTELLIGENCE — ACCURACY                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Market Intelligence > Accuracy         [Time Range: Last 6 Months ▼]│  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  AGGREGATE METRICS                                                         │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │  DIRECTIONAL  │ │  PRICE RANGE  │ │  TOTAL        │ │  AVG ERROR    │  │
│  │  ACCURACY     │ │  ACCURACY     │ │  EVALUATED    │ │               │  │
│  │               │ │               │ │               │ │               │  │
│  │    72%        │ │    58%        │ │    156        │ │    8.3%       │  │
│  │  ↑ +4% vs    │ │  ↑ +2% vs    │ │  28 commods.  │ │  ↓ -1.2% vs  │  │
│  │  prior period │ │  prior period │ │  6 months     │ │  prior period │  │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘  │
│                                                                            │
│  PER-COMMODITY ACCURACY                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Commodity       │ Direction │ Price   │ Avg Err │ Predictions│ Trend │  │
│  ├─────────────────┼───────────┼─────────┼─────────┼────────────┼───────┤  │
│  │ Saffron         │ 83%       │ 71%     │ 5.2%    │ 6          │ ↑     │  │
│  │ Moringa Leaf    │ 80%       │ 65%     │ 7.1%    │ 4          │ →     │  │
│  │ Chia Seeds      │ 75%       │ 60%     │ 8.8%    │ 6          │ ↑     │  │
│  │ Spirulina       │ 67%       │ 50%     │ 11.4%   │ 3          │ ↓     │  │
│  │ Ashwagandha     │ 60%       │ 42%     │ 14.1%   │ 5          │ →     │  │
│  └─────────────────┴───────────┴─────────┴─────────┴────────────┴───────┘  │
│                                                                            │
│  Trend: ↑ = improving, → = stable, ↓ = declining (vs prior 3 months)     │
│                                                                            │
│  ACCURACY OVER TIME (Recharts Line Chart)                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  100% ┤                                                              │  │
│  │   80% ┤          ╭─╮     ╭──╮                                        │  │
│  │   60% ┤    ╭─────╯ ╰─────╯  ╰──── Directional                      │  │
│  │   40% ┤────╯                 ╭──── Price Range                       │  │
│  │   20% ┤                ──────╯                                       │  │
│  │    0% ┼────┬────┬────┬────┬────┬────                                 │  │
│  │       Oct  Nov  Dec  Jan  Feb  Mar                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.12 Job Logs

Central log viewer for all pipeline jobs (scrapers, LLM analysis, predictions, contact discovery, outreach).

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    JOB LOGS                                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Job Logs                                          [Trigger Run ▼]  │  │
│  │  [All Jobs] [Running (1)] [Failed (1)] [Completed]                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  [Trigger Run ▼] Dropdown:                                                │
│  ┌──────────────────────────┐                                             │
│  │ Scraper: All Sources     │                                             │
│  │ Scraper: APEDA           │                                             │
│  │ Scraper: DGCIS           │                                             │
│  │ Scraper: ITC Trade Map   │                                             │
│  │ Scraper: UN COMTRADE     │                                             │
│  │ Scraper: FAOSTAT         │                                             │
│  │ ─────────────────────── │                                             │
│  │ LLM: Generate Analyses  │                                             │
│  │ LLM: Monthly Predictions│                                             │
│  │ ─────────────────────── │                                             │
│  │ Contacts: Discover All  │                                             │
│  │ Outreach: Process Queue │                                             │
│  └──────────────────────────┘                                             │
│                                                                            │
│  LIVE JOBS                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ▶ RUNNING: Scraper — APEDA        Started: 14:30:12    [Cancel]   │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 14:30:12  Connecting to apeda.gov.in...                       │  │  │
│  │  │ 14:30:13  Connected. Checking for new files...                │  │  │
│  │  │ 14:30:15  Found 3 new Excel files since last run              │  │  │
│  │  │ 14:30:16  Downloading: export_stats_mar2026.xlsx (1/3)        │  │  │
│  │  │ 14:30:18  Downloading: product_wise_mar2026.xlsx (2/3)        │  │  │
│  │  │ 14:30:20  Parsing export_stats_mar2026.xlsx... 142 rows       │  │  │
│  │  │ ▌  (streaming...)                                              │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  COMPLETED JOBS                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Type         │ Source   │ Started          │ Duration │ Status      │  │
│  ├──────────────┼──────────┼──────────────────┼──────────┼─────────────┤  │
│  │ Scraper      │ DGCIS    │ Mar 25, 14:30    │ 4m 12s   │ ✅ Done     │  │
│  │ LLM Analysis │ Batch    │ Mar 25, 12:00    │ 2m 45s   │ ✅ Done     │  │
│  │ Scraper      │ COMTRADE │ Mar 22, 02:00    │ 0m 34s   │ ❌ Failed   │  │
│  └──────────────┴──────────┴──────────────────┴──────────┴─────────────┘  │
│                                                                            │
│  CLICK COMPLETED ROW → EXPANDABLE DETAILS:                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Scraper: DGCIS — Run #046                                          │  │
│  │                                                                      │  │
│  │  Records: 310 ingested (45 new, 265 updated, 0 failed)             │  │
│  │  Candidates: 12 new niche candidates generated                      │  │
│  │  Checksum: sha256:f4e5d6c7...                                       │  │
│  │                                                                      │  │
│  │  Sample Records (first 5):                                          │  │
│  │  │ Moringa Leaf Powder │ 12119090 │ 340 MT │ $1.2M │ +34% YoY │   │  │
│  │  │ Spirulina Extract   │ 12129990 │ 120 MT │ $0.5M │ +28% YoY │   │  │
│  │  │ ...                                                              │  │
│  │                                                                      │  │
│  │  Warnings: 0    Errors: 0                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  CLICK FAILED ROW → ERROR DETAILS:                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Scraper: COMTRADE — Run #043                      [Retry]         │  │
│  │                                                                      │  │
│  │  Error: ConnectionError — comtrade.un.org returned 503              │  │
│  │                                                                      │  │
│  │  Stack Trace:                                                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │ File "scrapers/comtrade.py", line 45, in fetch_raw            │  │  │
│  │  │   response = await self.client.get(url, timeout=30)           │  │  │
│  │  │ httpx.ConnectError: 503 Service Unavailable                   │  │  │
│  │  │                                                                │  │  │
│  │  │ Retried 3 times with exponential backoff.                     │  │  │
│  │  │ All attempts failed.                                           │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │  Last Successful Run: #041 (Mar 20, 02:00)                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Streaming Logs:** Live jobs use SSE (Server-Sent Events) to stream log lines in real time. Log container auto-scrolls to bottom.

---

### 4.13 Analytics

Platform-level analytics for the niche commodity system. No individual user tracking — aggregate metrics only.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    NICHE COMMODITY — ANALYTICS                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Analytics                                    [Time: Last 30 Days ▼] │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  PREDICTION PERFORMANCE                                                    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │  PREDICTIONS  │ │  AUTO-        │ │  MANUALLY     │ │  SKIPPED      │  │
│  │  GENERATED    │ │  PUBLISHED    │ │  REVIEWED     │ │               │  │
│  │               │ │               │ │               │ │               │  │
│  │     34        │ │     26        │ │      6        │ │      2        │  │
│  │  this month   │ │    76%        │ │    18%        │ │     6%        │  │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘  │
│                                                                            │
│  ENGAGEMENT METRICS (aggregate, no individual tracking)                    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │  TOTAL VIEWS  │ │  UNIQUE       │ │  FAVORITES    │ │  AVG TIME ON  │  │
│  │               │ │  VIEWERS      │ │  ADDED        │ │  DETAIL PAGE  │  │
│  │               │ │               │ │               │ │               │  │
│  │   1,247       │ │     312       │ │     89        │ │    2m 14s     │  │
│  │  ↑ +18%       │ │  ↑ +22%       │ │  ↑ +31%       │ │  ↑ +0:15      │  │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘  │
│                                                                            │
│  CATEGORY BREAKDOWN (Recharts Pie Chart)                                   │
│  ┌─────────────────────────────┐  VIEWS PER PREDICTION (Bar Chart)        │
│  │         ╭───╮               │  ┌──────────────────────────────────┐    │
│  │      ╭──╯   ╰──╮           │  │ Saffron     ████████████████ 312 │    │
│  │    ╭─╯ Herbal   ╰─╮        │  │ Moringa     ████████████    245 │    │
│  │   ╭╯   38%        ╰╮       │  │ Spirulina   ████████        178 │    │
│  │   │          Spices │       │  │ Chia Seeds  ██████          142 │    │
│  │   │            28%  │       │  │ Ashwagandha █████           112 │    │
│  │   ╰╮  Superfoods ╭╯        │  │ Others      ████████        258 │    │
│  │    ╰─╮  22%   ╭─╯          │  └──────────────────────────────────┘    │
│  │      ╰──╮ ╭──╯             │                                           │
│  │     Other╰╯12%             │                                           │
│  └─────────────────────────────┘                                          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.14 Settings

Central configuration for all niche commodity finder subsystems.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    NICHE COMMODITY FINDER — SETTINGS                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  [LLM Models] [Scoring] [Scrapers] [Outreach] [Predictions] [Notifs]     │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════   │
│  LLM MODEL CONFIGURATION                                                  │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                            │
│  Niche Validation Model:    [Claude Haiku 4.5        ▼]                   │
│  Market Predictions Model:  [Gemini 2.0 Flash        ▼]                   │
│                                                                            │
│  Available Models:                                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Model                │ Cost Tier │ Speed   │ Quality │ Status       │  │
│  ├──────────────────────┼───────────┼─────────┼─────────┼──────────────┤  │
│  │ Claude Opus 4        │ $$$       │ Slow    │ Best    │ Available    │  │
│  │ Claude Sonnet 4.6    │ $$        │ Medium  │ Great   │ Available    │  │
│  │ Claude Haiku 4.5     │ $         │ Fast    │ Good    │ ✓ Selected   │  │
│  │ Gemini 2.5 Pro       │ $$        │ Medium  │ Great   │ Available    │  │
│  │ Gemini 2.0 Flash     │ $         │ Fast    │ Good    │ ✓ Selected   │  │
│  └──────────────────────┴───────────┴─────────┴─────────┴──────────────┘  │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════   │
│  SCORING THRESHOLDS                                                        │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                            │
│  Volume Threshold (max MT/month):     [  500  ]  (below = niche signal)   │
│  Volatility Threshold (min CoV %):    [   25  ]  (above = niche signal)   │
│  Emergence Threshold (min YoY %):     [   15  ]  (above = niche signal)   │
│  Candidate Score Minimum:             [   60  ]  (below = auto-reject)    │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════   │
│  SCRAPER SCHEDULES                                                         │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ☑ APEDA          │ Every [Monday   ▼] at [02:00 ▼]  │ Last: Mar 25 │  │
│  │ ☑ DGCIS          │ Every [Monday   ▼] at [02:00 ▼]  │ Last: Mar 25 │  │
│  │ ☑ ITC Trade Map  │ Every [Wednesday▼] at [03:00 ▼]  │ Last: Mar 19 │  │
│  │ ☐ UN COMTRADE    │ Every [Friday   ▼] at [02:00 ▼]  │ Last: Mar 20 │  │
│  │ ☑ FAOSTAT        │ Every [Saturday ▼] at [04:00 ▼]  │ Last: Mar 22 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════   │
│  OUTREACH SETTINGS                                                         │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                            │
│  Drip Day 1 (Introduction):    Day [  1  ] after approval                 │
│  Drip Day 2 (Follow-up):       Day [  8  ] after approval                 │
│  Drip Day 3 (Final):           Day [ 22  ] after approval                 │
│  Global Pause:                  [☐ Pause all outreach]                    │
│                                                                            │
│  Email Templates:                                                          │
│  [View/Edit Introduction Template]                                         │
│  [View/Edit Follow-up Template]                                            │
│  [View/Edit Final Template]                                                │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════   │
│  PREDICTION REVIEW THRESHOLDS                                              │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                            │
│  Auto-publish above confidence:   [ 75 ] %                                │
│  Auto-flag below confidence:      [ 50 ] %  (highlight in review queue)   │
│  Minimum data sources required:   [  3 ]    (fewer = flag for review)     │
│  High-risk auto-flag:             [☑ Enabled]  (always review high-risk)  │
│                                                                            │
│  ═══════════════════════════════════════════════════════════════════════   │
│  ADMIN NOTIFICATIONS                                                       │
│  ═══════════════════════════════════════════════════════════════════════   │
│                                                                            │
│  ☑ Job failure alerts             (email + in-app)                        │
│  ☑ Pending review alerts          (in-app only, daily digest email)       │
│  ☑ Monthly prediction summary     (email on 1st of month)                 │
│  ☐ Outreach engagement reports    (weekly email)                          │
│                                                                            │
│                                              [Save Settings]               │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Buyer Frontend Pages

### 5.1 Market Intelligence Page

Route: `/buyer/market-intelligence`

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                              │
│  │ SIDEBAR  │  MARKET INTELLIGENCE — March 2026                           │
│  │          │                                                              │
│  │ Homepage │  ┌──────────────────────────────────────────────────────┐   │
│  │ Products │  │  YOUR FAVORITES (★)                                  │   │
│  │ Trade    │  │                                                      │   │
│  │ AI       │  │  ┌────────────────────────┐ ┌────────────────────┐  │   │
│  │ Market   │  │  │  ★ MORINGA LEAF        │ │  ★ SAFFRON         │  │   │
│  │ Intel. ← │  │  │                        │ │                    │  │   │
│  │ Inbox    │  │  │  ↑ +12%    BUY         │ │  ↓ -15%   SELL    │  │   │
│  │ Wishlist │  │  │                        │ │                    │  │   │
│  │ Settings │  │  │  Confidence: 78%       │ │  Confidence: 92%  │  │   │
│  │          │  │  │  $2,800 → $3,100/MT    │ │  $8,500 → $7,200  │  │   │
│  │          │  │  │                        │ │                    │  │   │
│  │          │  │  │  [View Details →]      │ │  [View Details →] │  │   │
│  │          │  │  └────────────────────────┘ └────────────────────┘  │   │
│  │          │  └──────────────────────────────────────────────────────┘   │
│  │          │                                                              │
│  │          │  ALL PREDICTIONS                                             │
│  │          │  [Search...          ] [Direction ▼] [Sort: Confidence ▼]   │
│  │          │                                                              │
│  │          │  ┌────────────────────────────────────────────────────────┐  │
│  │          │  │  SPIRULINA EXTRACT                              ☆     │  │
│  │          │  │                                                        │  │
│  │          │  │  ↑ +8%     BUY        Confidence: 45%                 │  │
│  │          │  │  $320 → $340-360/MT                                   │  │
│  │          │  │                                                        │  │
│  │          │  │  Growing health food demand; supply steady.            │  │
│  │          │  │                                             [View →]   │  │
│  │          │  └────────────────────────────────────────────────────────┘  │
│  │          │                                                              │
│  │          │  ┌────────────────────────────────────────────────────────┐  │
│  │          │  │  ASHWAGANDHA ROOT                               ☆     │  │
│  │          │  │                                                        │  │
│  │          │  │  ↑ +5%     BUY        Confidence: 71%                 │  │
│  │          │  │  $1,200 → $1,260/MT                                   │  │
│  │          │  │                                                        │  │
│  │          │  │  Steady demand growth in supplement markets.           │  │
│  │          │  │                                             [View →]   │  │
│  │          │  └────────────────────────────────────────────────────────┘  │
│  │          │                                                              │
│  │          │  ┌────────────────────────────────────────────────────────┐  │
│  │          │  │  CHIA SEEDS                                     ☆     │  │
│  │          │  │                                                        │  │
│  │          │  │  → 0%      HOLD       Confidence: 83%                 │  │
│  │          │  │  $1,800 → $1,800/MT                                   │  │
│  │          │  │                                                        │  │
│  │          │  │  Market saturated; prices expected to remain flat.     │  │
│  │          │  │                                             [View →]   │  │
│  │          │  └────────────────────────────────────────────────────────┘  │
│  │          │                                                              │
│  │          │  Showing 1-10 of 28              [← Prev] 1 2 3 [Next →]   │
│  └──────────┘                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

**Card Elements:**
- Commodity name (bold, large)
- Star toggle (top-right): ☆ = not favorited, ★ = favorited
- Direction arrow: ↑ green text, ↓ red text, → yellow text
- Percentage change (bold)
- Action headline: BUY (green), SELL (red), HOLD (yellow)
- Confidence percentage with subtle progress bar
- Current price → Predicted price
- One-line summary
- "View Details" link

**Filters:**
- Direction: All, Up, Down, Stable
- Sort: Confidence (desc), Change % (desc), Alphabetical

---

### 5.2 Homepage Summary Cards

Three prediction summary cards added to the existing buyer Homepage, below the main search area.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ... (existing Homepage content: search bar, featured products) ...        │
│                                                                            │
│  MARKET PREDICTIONS                                                        │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌────────────────────┐  │
│  │  ↑ MORINGA LEAF      │ │  ↓ SAFFRON           │ │  ↑ SPIRULINA      │  │
│  │                      │ │                      │ │                    │  │
│  │  +12%                │ │  -15%                │ │  +8%               │  │
│  │  BUY                 │ │  SELL                │ │  BUY               │  │
│  │                      │ │                      │ │                    │  │
│  │  Conf: 78%           │ │  Conf: 92%           │ │  Conf: 45%        │  │
│  └──────────────────────┘ └──────────────────────┘ └────────────────────┘  │
│                                                                            │
│  View All Predictions →                                                    │
│                                                                            │
│  ... (rest of Homepage) ...                                                │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Card Layout:**
- Direction arrow (↑/↓/→) + commodity name on first line
- Large percentage number (bold, colored: green/red/yellow)
- Action word (BUY/SELL/HOLD)
- Confidence bar
- Cards are clickable — navigate to detail view

**Card Selection Logic:**
- Show top 3 predictions by absolute change %, from latest month
- If buyer has favorites, prioritize favorited commodities
- "View All Predictions →" links to `/buyer/market-intelligence`

---

### 5.3 Commodity Prediction Detail View

Route: `/buyer/market-intelligence/:commodityId`

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                              │
│  │ SIDEBAR  │  [← Back to Predictions]              [★ Favorited]         │
│  │          │                                                              │
│  │          │  MORINGA LEAF POWDER                                         │
│  │          │  HS Code: 12119090                                           │
│  │          │                                                              │
│  │          │  ┌──────────────────────────────────────────────────────┐   │
│  │          │  │  PRICE FORECAST                                      │   │
│  │          │  │                                                      │   │
│  │          │  │  Direction:  ↑ UP                                    │   │
│  │          │  │  Change:     +12%                                    │   │
│  │          │  │  Current:    $2,800/MT                               │   │
│  │          │  │  Predicted:  $3,100 - $3,200/MT                     │   │
│  │          │  │  Timeframe:  Next 30 days                           │   │
│  │          │  │  Confidence: 78%  [██████████████████░░░░░░]         │   │
│  │          │  └──────────────────────────────────────────────────────┘   │
│  │          │                                                              │
│  │          │  ┌──────────────────────────────────────────────────────┐   │
│  │          │  │  RECOMMENDATION                                      │   │
│  │          │  │                                                      │   │
│  │          │  │  Action:   BUY                                       │   │
│  │          │  │  Urgency:  MODERATE                                  │   │
│  │          │  │                                                      │   │
│  │          │  │  Rationale: Demand from US and European health food  │   │
│  │          │  │  markets continues to rise. India's monsoon season   │   │
│  │          │  │  may constrain supply in Q2, pushing prices higher.  │   │
│  │          │  │  Consider securing supply contracts within 2 weeks.  │   │
│  │          │  └──────────────────────────────────────────────────────┘   │
│  │          │                                                              │
│  │          │  ┌─────────────────────────┐ ┌─────────────────────────┐    │
│  │          │  │  KEY FACTORS             │ │  RISK WARNINGS          │    │
│  │          │  │                          │ │                         │    │
│  │          │  │  • Health food trend     │ │  ⚠ Weather dependency  │    │
│  │          │  │    driving demand in     │ │    (monsoon impact)     │    │
│  │          │  │    US, EU, Japan         │ │    Risk: MEDIUM         │    │
│  │          │  │                          │ │                         │    │
│  │          │  │  • Organic certification │ │  ⚠ Quality standard    │    │
│  │          │  │    premium growing       │ │    variations between  │    │
│  │          │  │    (30-45% above conv.)  │ │    suppliers            │    │
│  │          │  │                          │ │    Risk: LOW            │    │
│  │          │  │  • Supply concentration  │ │                         │    │
│  │          │  │    in India (~80%)       │ │  ⚠ Supply concentra-   │    │
│  │          │  │                          │ │    tion risk (single   │    │
│  │          │  │  • YoY growth: +34%     │ │    origin dominance)    │    │
│  │          │  │                          │ │    Risk: MEDIUM         │    │
│  │          │  └─────────────────────────┘ └─────────────────────────┘    │
│  │          │                                                              │
│  │          │  ┌─────────────────────────┐ ┌─────────────────────────┐    │
│  │          │  │  TOP IMPORTERS          │ │  TOP EXPORTERS          │    │
│  │          │  │                         │ │                         │    │
│  │          │  │  🇺🇸 United States      │ │  🇮🇳 India              │    │
│  │          │  │     Vol: 2,400 MT  ↑    │ │     Vol: 8,200 MT  ↑   │    │
│  │          │  │                         │ │                         │    │
│  │          │  │  🇩🇪 Germany            │ │  🇵🇭 Philippines        │    │
│  │          │  │     Vol: 1,100 MT  ↑    │ │     Vol: 1,400 MT  →   │    │
│  │          │  │                         │ │                         │    │
│  │          │  │  🇯🇵 Japan              │ │  🇳🇬 Nigeria            │    │
│  │          │  │     Vol: 800 MT    →    │ │     Vol: 600 MT    ↑   │    │
│  │          │  │                         │ │                         │    │
│  │          │  │  🇬🇧 United Kingdom     │ │  🇰🇪 Kenya              │    │
│  │          │  │     Vol: 650 MT    ↑    │ │     Vol: 350 MT    ↑   │    │
│  │          │  │                         │ │                         │    │
│  │          │  │  🇦🇪 UAE                │ │  🇹🇿 Tanzania           │    │
│  │          │  │     Vol: 400 MT    ↑    │ │     Vol: 200 MT    →   │    │
│  │          │  └─────────────────────────┘ └─────────────────────────┘    │
│  │          │                                                              │
│  │          │  ┌──────────────────────────────────────────────────────┐   │
│  │          │  │  MARKET SUMMARY                                      │   │
│  │          │  │                                                      │   │
│  │          │  │  Moringa leaf powder continues to show strong niche  │   │
│  │          │  │  characteristics with growing global demand. The     │   │
│  │          │  │  market is transitioning from a traditional herbal   │   │
│  │          │  │  remedy to a mainstream superfood ingredient. Price  │   │
│  │          │  │  increases are expected to continue through Q2 2026  │   │
│  │          │  │  driven by seasonal supply constraints and rising    │   │
│  │          │  │  demand from health-conscious consumer segments.     │   │
│  │          │  └──────────────────────────────────────────────────────┘   │
│  │          │                                                              │
│  │          │  ┌──────────────────────────────────────────────────────┐   │
│  │          │  │  Data freshness: Mar 2026  │  Sources: 3/5 used     │   │
│  │          │  │  HS Code: 12119090         │  Last updated: Mar 25  │   │
│  │          │  └──────────────────────────────────────────────────────┘   │
│  │          │                                                              │
│  └──────────┘                                                              │
└────────────────────────────────────────────────────────────────────────────┘
```

**Importer/Exporter Trend Arrows:**
- ↑ = volume increasing YoY (green)
- → = volume stable (yellow)
- ↓ = volume decreasing (red)

**Risk Level Colors:**
- LOW = green badge
- MEDIUM = yellow badge
- HIGH = red badge

**[★ Favorited] Toggle:**
- Filled star = currently favorited, click to unfavorite
- Empty star = not favorited, click to add
- Smooth scale animation on toggle (framer-motion)

---

### 5.4 Favorites Interaction

```
┌────────────────────────────────────────────────────────────────────────────┐
│  FAVORITE TOGGLE BEHAVIOR                                                  │
│                                                                            │
│  State 1: Not Favorited                State 2: Favorited                 │
│  ┌──────────────────────────┐          ┌──────────────────────────┐       │
│  │  MORINGA LEAF        ☆  │   click   │  MORINGA LEAF        ★  │       │
│  │  ↑ +12%     BUY         │  ──────→  │  ↑ +12%     BUY         │       │
│  │  Conf: 78%              │          │  Conf: 78%              │       │
│  └──────────────────────────┘  ←──────  └──────────────────────────┘       │
│                                 click                                      │
│                                                                            │
│  Animation: Scale 1.0 → 1.3 → 1.0 (200ms) on star icon                   │
│  Color: ☆ gray-400 → ★ yellow-500                                        │
│                                                                            │
│  On Favorite:                                                              │
│  1. Star fills with yellow, scale animation plays                         │
│  2. Card smoothly moves to "Your Favorites" section (layout animation)    │
│  3. Toast: "Moringa Leaf added to favorites"                              │
│  4. POST /api/user/favorites { commodityId }                              │
│                                                                            │
│  On Unfavorite:                                                            │
│  1. Star empties, scale animation plays                                   │
│  2. Card smoothly moves out of favorites section back to "All"            │
│  3. Toast: "Moringa Leaf removed from favorites"                          │
│  4. DELETE /api/user/favorites/:commodityId                               │
│                                                                            │
│  Favorites persist across sessions (stored in user profile).              │
│  Buyers with favorites get push notifications when new predictions are    │
│  published for favorited commodities.                                     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Key User Flows

### 6.1 Admin: Commodity Discovery to Approval

```
┌────────────────────────────────────────────────────────────────────────────┐
│  FLOW: Commodity Discovery → Approval                                      │
│                                                                            │
│  Step 1: Admin opens Niche Dashboard                                       │
│          Sees alert: "5 commodity candidates pending review"               │
│          ↓                                                                 │
│  Step 2: Clicks "Go to Review →"                                          │
│          Navigates to Discovery > Commodities tab                          │
│          ↓                                                                 │
│  Step 3: Reviews pending candidates in table                              │
│          Notices 2 candidates have "⚠ None" in LLM column                 │
│          ↓                                                                 │
│  Step 4: Selects those 2 candidates (checkbox)                            │
│          Clicks "Generate Analysis ▼" → "Generate for Selected"           │
│          ↓                                                                 │
│  Step 5: Sees loading spinner on those rows                               │
│          LLM analysis completes in ~30 seconds                            │
│          Status changes to "✅ Full"                                       │
│          ↓                                                                 │
│  Step 6: Clicks "Moringa Leaf Powder" row                                 │
│          Opens Candidate Review Interface (Section 4.5)                    │
│          ↓                                                                 │
│  Step 7: Reviews left panel (trade data, niche score)                     │
│          Reviews right panel (LLM analysis, key findings, risks)          │
│          ↓                                                                 │
│  Step 8: Clicks [✓ Approve]                                               │
│          Toast: "Moringa Leaf Powder approved"                            │
│          Commodity moves to Approved tab                                   │
│          Contact discovery job auto-triggers in background                 │
│          ↓                                                                 │
│  Step 9: Repeats for remaining candidates                                 │
│          Some approved, some rejected (with reason), some watchlisted     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Admin: Contact Discovery to Outreach Launch

```
┌────────────────────────────────────────────────────────────────────────────┐
│  FLOW: Contact Discovery → Outreach Launch                                 │
│                                                                            │
│  Step 1: After approving Moringa Leaf Powder (flow 6.1 complete)          │
│          Contact discovery job runs automatically in background            │
│          Admin can monitor progress in Job Logs                            │
│          ↓                                                                 │
│  Step 2: Job completes. Notification: "47 contacts found for Moringa"     │
│          Admin navigates to Contacts > Buyers                             │
│          ↓                                                                 │
│  Step 3: Filters by Commodity: "Moringa Leaf Powder"                      │
│          Sees 47 contacts with quality scores                             │
│          ↓                                                                 │
│  Step 4: Reviews top-scoring contacts                                     │
│          Clicks row to expand quality score breakdown                      │
│          ↓                                                                 │
│  Step 5: Selects high-quality contacts (score > 80)                       │
│          Clicks "Mark Verified" (bulk action)                             │
│          Flags 2 contacts with bounced emails as "Invalid"                │
│          ↓                                                                 │
│  Step 6: Navigates to Outreach Management                                 │
│          Sees Moringa Leaf Powder card (no campaign yet)                   │
│          ↓                                                                 │
│  Step 7: Clicks "Launch Campaign for Moringa Leaf Powder"                 │
│          Confirmation dialog: "Send to 45 verified contacts?"             │
│          Clicks "Confirm"                                                  │
│          ↓                                                                 │
│  Step 8: Drip sequence begins                                             │
│          Day 1 emails sent immediately                                     │
│          Day 8 and Day 22 emails scheduled                                │
│          Campaign card shows [▶ Active] status                            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Admin: Monthly Prediction Cycle

```
┌────────────────────────────────────────────────────────────────────────────┐
│  FLOW: Monthly Prediction Cycle                                            │
│                                                                            │
│  Step 1: 1st of the month. Admin navigates to Predictions page            │
│          Clicks [Generate This Month's]                                    │
│          ↓                                                                 │
│  Step 2: Job starts for all 34 active commodities                         │
│          Progress visible in Jobs tab (streaming logs)                     │
│          Takes ~5-10 minutes                                              │
│          ↓                                                                 │
│  Step 3: Job completes.                                                   │
│          26 predictions auto-published (confidence > 75%)                 │
│          6 predictions sent to review queue (confidence < 75%)            │
│          2 predictions skipped (insufficient data)                        │
│          ↓                                                                 │
│  Step 4: Admin clicks [Review Queue (6)] tab                              │
│          Reviews each low-confidence prediction                           │
│          ↓                                                                 │
│  Step 5: For Spirulina (45% confidence):                                  │
│          Opens Review Modal (Section 4.10)                                │
│          Sees flags: "Low data completeness", "Signals disagree"          │
│          Decision: [✗ Skip This Month]                                    │
│          ↓                                                                 │
│  Step 6: For Cardamom (65% confidence):                                   │
│          Opens Review Modal                                               │
│          Adds note: "Market looks stable, publishing with caution."       │
│          Decision: [✓ Publish Anyway]                                     │
│          ↓                                                                 │
│  Step 7: Completes review of remaining predictions                        │
│          Published predictions go live on buyer frontend                   │
│          ↓                                                                 │
│  Step 8: Notifications dispatched to buyers who favorited commodities     │
│          "New prediction for Moringa Leaf: ↑ +12% (BUY)"                 │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Buyer: Discovering Market Intelligence

```
┌────────────────────────────────────────────────────────────────────────────┐
│  FLOW: Buyer Discovers Market Intelligence                                 │
│                                                                            │
│  Step 1: Buyer logs in, lands on Homepage                                 │
│          Sees 3 summary prediction cards (Section 5.2)                    │
│          Moringa ↑+12%, Saffron ↓-15%, Spirulina ↑+8%                    │
│          ↓                                                                 │
│  Step 2: Clicks "View All Predictions →"                                  │
│          Navigates to /buyer/market-intelligence                          │
│          ↓                                                                 │
│  Step 3: Browses all 28 predictions                                       │
│          Sorts by Confidence (descending)                                 │
│          ↓                                                                 │
│  Step 4: Finds Moringa Leaf interesting                                   │
│          Clicks ☆ star icon → becomes ★                                   │
│          Toast: "Moringa Leaf added to favorites"                         │
│          Card animates to "Your Favorites" section                        │
│          ↓                                                                 │
│  Step 5: Also stars Saffron                                               │
│          Now has 2 favorites pinned at top                                │
│          ↓                                                                 │
│  Step 6: Next month, receives notification:                               │
│          "New prediction published for Moringa Leaf: ↑ +9% BUY"          │
│          ↓                                                                 │
│  Step 7: Clicks notification                                              │
│          Navigates directly to Moringa detail view                        │
│          Reviews updated prediction data                                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Buyer: Acting on a Prediction

```
┌────────────────────────────────────────────────────────────────────────────┐
│  FLOW: Buyer Acts on a Prediction                                          │
│                                                                            │
│  Step 1: Buyer opens prediction detail for Moringa Leaf Powder            │
│          Route: /buyer/market-intelligence/moringa-leaf-12119090          │
│          ↓                                                                 │
│  Step 2: Reads Price Forecast section                                     │
│          Sees: ↑ UP +12%, $2,800 → $3,100-3,200/MT                      │
│          Confidence: 78%                                                  │
│          ↓                                                                 │
│  Step 3: Reads Recommendation section                                     │
│          Action: BUY, Urgency: MODERATE                                   │
│          Rationale: Monsoon may constrain supply in Q2                    │
│          ↓                                                                 │
│  Step 4: Checks Risk Warnings                                             │
│          Weather dependency: MEDIUM                                       │
│          Quality variations: LOW                                          │
│          Decides risk is acceptable                                       │
│          ↓                                                                 │
│  Step 5: Reviews Top Importers                                            │
│          US volume trending up — good demand signal                       │
│          ↓                                                                 │
│  Step 6: Reviews Top Exporters                                            │
│          India dominant (80% supply) — notes concentration risk           │
│          Philippines also exports — possible alternative source           │
│          ↓                                                                 │
│  Step 7: Decides to create a Purchase Request                             │
│          Navigates to marketplace: /buyer/product-page                    │
│          Searches for "Moringa Leaf Powder"                               │
│          Finds sellers and initiates PR                                   │
│                                                                            │
│  (Platform does NOT auto-create PRs from predictions — buyer decides.)    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Notification UX

### Header Bell Icon (Both Admin Portal and Buyer Frontend)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  NOTIFICATION BELL                                                         │
│                                                                            │
│  Header Bar:                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  BREYUS    [Search...]         [🔔 3]  [Avatar ▼]                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                           │                                │
│                                           ▼                                │
│  DROPDOWN (click bell):                                                    │
│  ┌──────────────────────────────────────┐                                 │
│  │  NOTIFICATIONS               [Clear] │                                 │
│  ├──────────────────────────────────────┤                                 │
│  │                                      │                                 │
│  │  ● New prediction: Moringa Leaf      │  ← unread dot (blue)           │
│  │    ↑ +12% — BUY                      │                                 │
│  │    2 hours ago                        │                                 │
│  │                                      │                                 │
│  │  ● New prediction: Saffron           │                                 │
│  │    ↓ -15% — SELL                     │                                 │
│  │    2 hours ago                        │                                 │
│  │                                      │                                 │
│  │  ● Prediction retracted: Neem        │                                 │
│  │    March prediction withdrawn         │                                 │
│  │    5 hours ago                        │                                 │
│  │                                      │                                 │
│  │    Job failed: COMTRADE scraper       │  ← read (no dot)              │
│  │    ConnectionError — 503              │                                 │
│  │    1 day ago                           │                                 │
│  │                                      │                                 │
│  │  [View All Notifications →]          │                                 │
│  └──────────────────────────────────────┘                                 │
│                                                                            │
│  Badge: Red circle with white number (3 = unread count)                   │
│  Badge hidden when count = 0                                              │
│                                                                            │
│  Click notification row → navigates to relevant page:                     │
│  • prediction_published → /buyer/market-intelligence/:id                  │
│  • prediction_retracted → /buyer/market-intelligence                      │
│  • job_failed → /admin/niche/job-logs                                     │
│  • review_pending → /admin/niche/discovery/commodities                    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Notification Types:**

| Type | Audience | Icon | Message Pattern |
|------|----------|------|-----------------|
| `prediction_published` | Buyer (favorited) | ↑/↓/→ | "New prediction: {commodity} — {direction} {action}" |
| `prediction_retracted` | Buyer (favorited) | ⚠ | "Prediction withdrawn: {commodity} — {reason}" |
| `job_failed` | Admin | ✗ | "Job failed: {source} — {error_type}" |
| `review_pending` | Admin | 📋 | "{N} candidates pending review" |
| `outreach_bounce` | Admin | ❌ | "Email bounced: {contact} for {commodity}" |
| `prediction_ready` | Admin | 📊 | "Monthly predictions ready: {N} auto-published, {M} need review" |

---

## 8. Component Library Reference

Reusable components used across the niche commodity finder pages.

| Component | Props | Usage | Notes |
|-----------|-------|-------|-------|
| **StatusBadge** | `status: 'active' \| 'pending' \| 'failed' \| 'info' \| 'archived'` | Tables, cards | Maps to color scheme in Section 2 |
| **ScoreBar** | `label: string, value: number, max: number, color?: string` | Niche score breakdown, confidence breakdown | Horizontal fill bar. Color defaults to blue, red if value < 30% of max |
| **PredictionCard** | `commodity, direction, changePercent, confidence, action, price, summary, isFavorited, onToggleFavorite` | Market Intelligence page, Homepage | Direction colors: ↑ green, ↓ red, → yellow |
| **MetricCard** | `title, value, subtitle, trend?: 'up' \| 'down' \| 'stable'` | Dashboard, Analytics | Big number + label + trend arrow. Reuses pattern from seller dashboard |
| **ReviewModal** | `title, leftContent, rightContent, actions[]` | Candidate review, Prediction review | Split-pane layout: data left, analysis right, action buttons bottom |
| **DataTable** | `columns[], data[], sortable, filterable, paginated, selectable` | All table views | Existing shadcn Table pattern with added features |
| **FavoriteButton** | `isFavorited, onToggle, size?: 'sm' \| 'md'` | Prediction cards, detail view | Star toggle with scale animation (framer-motion) |
| **DirectionIndicator** | `direction: 'up' \| 'down' \| 'stable', percent: number` | Tables, cards | Arrow + colored percentage text |
| **AlertBanner** | `type: 'warning' \| 'error' \| 'info', message, actionLabel?, onAction?` | Dashboard alerts | Dismissible banner with optional action button |
| **StreamingLog** | `jobId, isLive` | Job Logs page | SSE-connected log viewer with auto-scroll |
| **ConfidenceBar** | `value: number, threshold?: number` | Prediction cards, review modal | Shows green above threshold, yellow below, red below 50% |

---

## 9. Related Documents

- [[ai/PRD_1_Government_Data_Extraction]] — Scraper specs, niche scoring algorithm, candidate generation pipeline
- [[ai/PRD_2_3_Contact_Discovery]] — Buyer/seller contact discovery, quality scoring, verification workflows
- [[ai/PRD_4_Market_Intelligence]] — Monthly prediction engine, confidence scoring, accuracy tracking
- [[ai/PRD_5_Outreach]] — Drip campaign engine, email templates, engagement tracking
- [[ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE]] — System architecture, database schema, API contracts
- [[ai/NICHE_COMMODITY_FINDER_PRD]] — Original consolidated PRD
- [[MOC-AI]] — AI system index
