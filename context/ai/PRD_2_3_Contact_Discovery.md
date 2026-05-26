---
type: prd
module: ai
tags: [ai, prd, contact-discovery, buyers, sellers]
---

# PRD: Contact Discovery — Buyer Discovery (Stage 2) & Seller Discovery (Stage 3)

> **Document Type:** Product Requirements Document (PRD)
> **Version:** 1.0
> **Last Updated:** March 2026
> **Status:** Implementation Ready

---

## Table of Contents

1. [Background & Purpose](#1-background--purpose)
2. [Scope Definition](#2-scope-definition)
3. [Core Design Philosophy](#3-core-design-philosophy)
4. [Stage 2: Buyer Discovery](#4-stage-2-buyer-discovery)
5. [Stage 3: Seller Discovery](#5-stage-3-seller-discovery)
6. [Shared Infrastructure](#6-shared-infrastructure)
7. [Compliance & Privacy](#7-compliance--privacy)
8. [Admin UI](#8-admin-ui)
9. [Scheduling & Automation](#9-scheduling--automation)
10. [Folder Structure & Implementation Phases](#10-folder-structure--implementation-phases)
11. [Success Criteria & Risks](#11-success-criteria--risks)

---

## 1. Background & Purpose

The Contact Discovery module is the partner identification layer of the Breyus Niche Commodity Finder. Its responsibility is to locate real-world buyers and sellers for commodities that Stage 1 has validated and an admin has approved. It converts an approved niche commodity record into an actionable list of contacts scored by reachability and trustworthiness.

This module exists to answer one core question reliably:

**"Who is buying or selling this niche commodity, and how do we reach them?"**

### 1.1 Dependency Map

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          DEPENDENCY MAP                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  UPSTREAM                                                                  │
│  ────────                                                                  │
│                                                                             │
│  Stage 1 (Government Data Extraction)                                      │
│    └── approved_commodities table (is_active = true)                       │
│        ├── commodity_id       (FK reference for all contact records)       │
│        ├── commodity_name     (used to generate search queries)            │
│        ├── hs_code            (used for government DB matching)            │
│        └── approved_at        (determines discovery scheduling)            │
│                                                                             │
│  DOWNSTREAM                                                                │
│  ──────────                                                                │
│                                                                             │
│  Stage 4 (Market Intelligence)                                             │
│    └── Uses buyer_contacts + seller_contacts for market sizing             │
│                                                                             │
│  Stage 5 (Outreach — separate PRD)                                         │
│    └── Consumes contacts with quality_score >= 50 ("outreach-ready")       │
│    └── Uses buyer_requirements + seller_capabilities for personalization   │
│                                                                             │
│  NOTE: This module produces CONTACTS. It does NOT initiate outreach.       │
│  All outreach logic lives in Stage 5 (PRD_5_Outreach.md).                 │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| **Admins** | Review discovered contacts, trigger discovery jobs, export data, verify sellers |
| **System** | Feed quality contacts to outreach pipeline (Stage 5) |
| **End Users** | (Indirect) Eventually receive curated buyer/seller matches |

---

## 2. Scope Definition

### 2.1 In Scope

This PRD defines the system responsible for:
- B2B marketplace scraping for buyer leads (TradeKey, IndiaMART, Alibaba, ExportersIndia)
- Government exporter database extraction (APEDA, Spice Board, DGFT)
- Industry association and cooperative member extraction (NAFED, state co-ops)
- Contact extraction (company, person, email, phone, location)
- Cross-source deduplication with fuzzy matching
- Quality scoring for contact reachability
- Admin curation UI (trigger, filter, export, verify)
- Automated daily discovery scheduling

### 2.2 Out of Scope

This PRD explicitly excludes:
- LinkedIn data integration (Apollo.io, ZoomInfo, Lusha) — Phase 2+
- Outreach automation, drip campaigns, email sequences — covered in [[PRD_5_Outreach]]
- User-facing contact display — Gold Buyer features are separate
- Payment for premium data providers — Phase 2+
- Direct messaging to discovered contacts from within the platform

---

## 3. Core Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Public data only** | Never scrape behind authentication walls; respect robots.txt |
| **Quality over quantity** | Quality scoring gates outreach readiness (score >= 50 for Stage 5) |
| **Government first for sellers** | Government-verified exporters rank highest in seller discovery |
| **Marketplace first for buyers** | Active RFQs and buying leads are the strongest buyer signals |
| **Every contact traceable to source** | `contact_sources` table links every record to its origin URL |
| **Compliance-aware collection** | DPDP Act, CAN-SPAM, GDPR considerations baked into design |
| **Idempotent re-runs** | Re-running discovery for the same commodity merges, never duplicates |

---

## 4. Stage 2: Buyer Discovery

### 4.1 Data Sources

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        BUYER DISCOVERY SOURCES                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┬──────────────────────┬──────────────────────┬──────────┐ │
│  │ Source       │ What to Search       │ What to Extract      │ Rate     │ │
│  │              │                      │                      │ Limit    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ TradeKey     │ Buyer RFQs,          │ Company, contact,    │ 1 req /  │ │
│  │              │ want-to-buy listings │ email, phone, loc,   │ 3 sec    │ │
│  │              │                      │ requirements         │          │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ IndiaMART    │ Buying leads,        │ Company, contact,    │ 1 req /  │ │
│  │              │ requirement posts    │ email, phone, loc,   │ 3 sec    │ │
│  │              │                      │ requirements         │          │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ Alibaba      │ RFQ section,         │ Company, contact,    │ 1 req /  │ │
│  │              │ buyer inquiries      │ email, phone, loc,   │ 5 sec    │ │
│  │              │                      │ requirements         │          │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ ExportersIn- │ Buyer directory      │ Company, contact,    │ 1 req /  │ │
│  │ dia          │                      │ email, phone, loc    │ 3 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ Company      │ Contact/sourcing     │ Email, phone,        │ 1 req /  │ │
│  │ Websites     │ pages                │ contact name, role   │ 5 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ Industry     │ LinkedIn events,     │ Company, attendee,   │ Manual   │ │
│  │ Events       │ FICCI/CII listings   │ topic, location      │ trigger  │ │
│  └──────────────┴──────────────────────┴──────────────────────┴──────────┘ │
│                                                                             │
│  VOLUME ESTIMATES (per commodity, per run)                                 │
│  ────────────────────────────────────────                                  │
│                                                                             │
│  TradeKey:       20-80 leads (2-8 pages)                                   │
│  IndiaMART:      30-150 leads (3-15 pages)                                 │
│  Alibaba:        10-50 leads (1-5 pages)                                   │
│  ExportersIndia: 5-30 leads (1-3 pages)                                    │
│  Websites:       5-10 enrichment lookups                                   │
│  Events:         0-20 leads (periodic)                                     │
│                                                                             │
│  TOTAL: ~70-340 raw leads per commodity per run                            │
│  After deduplication: ~40-200 unique contacts                              │
│                                                                             │
│  FUTURE (Phase 2+)                                                         │
│  ─────────────────                                                         │
│  LinkedIn Data Providers: Apollo.io, ZoomInfo, Lusha                       │
│  • Procurement Manager profiles                                            │
│  • Supply Chain Manager contacts                                           │
│  • Company decision-makers                                                 │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Search Generation

For each approved commodity, the system generates search queries with variations and filters to maximize recall across sources.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     BUYER SEARCH GENERATION                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT: approved_commodity record                                          │
│                                                                             │
│  STEP 1: QUERY VARIATION GENERATION                                        │
│  ──────────────────────────────────                                        │
│                                                                             │
│  For commodity "Moringa Leaf Powder" (HS: 12119090):                       │
│                                                                             │
│  Primary queries:                                                          │
│    • "moringa leaf powder"                                                 │
│    • "moringa powder"                                                      │
│    • "moringa extract"                                                     │
│    • "moringa oleifera"                                                    │
│                                                                             │
│  Generated via:                                                            │
│    1. commodity_name (exact)                                               │
│    2. commodity_name without generic suffixes ("powder", "extract", etc.)  │
│    3. Scientific/alternative names from LLM enrichment (Stage 1 data)      │
│    4. HS code description keywords                                         │
│                                                                             │
│  STEP 2: CATEGORY FILTERS                                                  │
│  ────────────────────────                                                  │
│                                                                             │
│  Map commodity to marketplace categories:                                  │
│    • "health supplements"                                                  │
│    • "pharma ingredients"                                                  │
│    • "food additives"                                                      │
│    • "cosmetic raw materials"                                              │
│                                                                             │
│  Category mapping stored in commodity_search_profiles table.               │
│                                                                             │
│  STEP 3: GEOGRAPHIC FILTERS                                                │
│  ──────────────────────────                                                │
│                                                                             │
│  Use destination_countries from Stage 1 parsed data to target:             │
│    • Top 5 importing countries for this commodity                          │
│    • All countries if destination data unavailable                         │
│                                                                             │
│  STEP 4: SEARCH URL ASSEMBLY                                               │
│  ────────────────────────────                                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def generate_search_urls(commodity: ApprovedCommodity)             │  │
│  │      -> List[SearchTask]:                                           │  │
│  │      """                                                            │  │
│  │      Returns a list of SearchTask objects, each containing:        │  │
│  │      - source: str (tradekey, indiamart, alibaba, exportersindia)  │  │
│  │      - url: str (fully constructed search URL)                     │  │
│  │      - query: str (the search term used)                           │  │
│  │      - max_pages: int (pagination limit)                           │  │
│  │      """                                                            │  │
│  │      queries = build_query_variations(commodity)                    │  │
│  │      tasks = []                                                     │  │
│  │                                                                      │  │
│  │      for source in BUYER_SOURCES:                                   │  │
│  │          for query in queries[:3]:  # Top 3 queries per source     │  │
│  │              tasks.append(SearchTask(                               │  │
│  │                  source=source.name,                                │  │
│  │                  url=source.build_buyer_search_url(query),          │  │
│  │                  query=query,                                       │  │
│  │                  max_pages=10,                                      │  │
│  │              ))                                                     │  │
│  │      return tasks                                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Scrape Execution

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     BUYER SCRAPE EXECUTION                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PARALLEL STRATEGY                                                         │
│  ─────────────────                                                         │
│                                                                             │
│  Sources are scraped in parallel (one async worker per source).            │
│  Within each source, requests are sequential with rate limiting.           │
│                                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐               │
│  │ TradeKey │  │IndiaMART │  │ Alibaba  │  │ExportersIndia│               │
│  │ Worker   │  │ Worker   │  │ Worker   │  │ Worker       │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘               │
│       │              │              │               │                      │
│       │  1 req/3s    │  1 req/3s    │  1 req/5s     │  1 req/3s            │
│       │              │              │               │                      │
│       ▼              ▼              ▼               ▼                      │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                      Raw Results Aggregator                          │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  PAGINATION                                                                │
│  ──────────                                                                │
│                                                                             │
│  • Maximum 10 pages per search query per source                            │
│  • Stop early if: page returns 0 results, or results become irrelevant    │
│  • Relevance check: if <20% of listings on a page match the commodity     │
│    keyword, stop pagination for that query                                 │
│                                                                             │
│  RATE LIMITING ENFORCEMENT                                                 │
│  ─────────────────────────                                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  class RateLimiter:                                                  │  │
│  │      def __init__(self, source: str, min_delay_sec: float):         │  │
│  │          self.source = source                                        │  │
│  │          self.min_delay = min_delay_sec                              │  │
│  │          self.last_request_at = 0.0                                  │  │
│  │                                                                      │  │
│  │      async def wait(self):                                           │  │
│  │          elapsed = time.time() - self.last_request_at               │  │
│  │          if elapsed < self.min_delay:                                │  │
│  │              await asyncio.sleep(self.min_delay - elapsed)          │  │
│  │          self.last_request_at = time.time()                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ERROR HANDLING                                                            │
│  ──────────────                                                            │
│                                                                             │
│  ┌──────────────────────┬─────────────────────────────────────────────┐   │
│  │ Error Type           │ Handling Strategy                           │   │
│  ├──────────────────────┼─────────────────────────────────────────────┤   │
│  │ HTTP 429 (Rate Limit)│ Exponential backoff: 30s → 60s → 120s     │   │
│  │ HTTP 403 (Blocked)   │ Mark source as blocked, skip, alert admin  │   │
│  │ HTTP 5xx             │ Retry 3x with backoff, then skip page      │   │
│  │ Connection timeout   │ Retry 2x, then skip page                   │   │
│  │ Parse error          │ Log raw HTML, skip listing, continue       │   │
│  │ CAPTCHA detected     │ Mark source blocked, alert admin           │   │
│  └──────────────────────┴─────────────────────────────────────────────┘   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Contact Extraction

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     BUYER CONTACT EXTRACTION                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  For each scraped listing page, extract the following fields:              │
│                                                                             │
│  FIELDS                                                                    │
│  ──────                                                                    │
│                                                                             │
│  ┌──────────────────────┬──────────┬─────────────────────────────────────┐ │
│  │ Field                │ Required │ Extraction Method                   │ │
│  ├──────────────────────┼──────────┼─────────────────────────────────────┤ │
│  │ company_name         │ Yes      │ CSS selector per source template   │ │
│  │ contact_person       │ No       │ CSS selector, fallback to "N/A"    │ │
│  │ email                │ No       │ Regex: see below                   │ │
│  │ phone                │ No       │ Regex: see below                   │ │
│  │ country              │ No       │ CSS selector + country normalizer  │ │
│  │ city                 │ No       │ CSS selector                       │ │
│  │ requirement_details  │ No       │ CSS selector (description text)    │ │
│  │ post_date            │ No       │ CSS selector + date parser         │ │
│  │ source_url           │ Yes      │ URL of the listing page            │ │
│  └──────────────────────┴──────────┴─────────────────────────────────────┘ │
│                                                                             │
│  EMAIL EXTRACTION REGEX                                                    │
│  ─────────────────────                                                     │
│                                                                             │
│  Pattern: [a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}               │
│                                                                             │
│  Post-processing:                                                          │
│  • Lowercase the entire address                                            │
│  • Reject if domain is a known disposable email provider                   │
│  • Reject if domain matches the marketplace itself (e.g., @tradekey.com)  │
│                                                                             │
│  PHONE EXTRACTION REGEX                                                    │
│  ─────────────────────                                                     │
│                                                                             │
│  Pattern: \+?[0-9\s\-\(\)]{7,20}                                           │
│                                                                             │
│  Post-processing:                                                          │
│  • Strip spaces, dashes, parens                                            │
│  • Normalize to E.164 format where possible (e.g., +919876543210)          │
│  • Reject if fewer than 7 digits after stripping                           │
│                                                                             │
│  EXTRACTION IMPLEMENTATION                                                 │
│  ─────────────────────────                                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  class BuyerContactExtractor:                                        │  │
│  │      """                                                             │  │
│  │      Source-specific extractors inherit this base class.             │  │
│  │      Each source overrides CSS selectors and parsing logic.         │  │
│  │      """                                                             │  │
│  │                                                                      │  │
│  │      def extract_from_listing(self, html: str, url: str)            │  │
│  │          -> Optional[RawBuyerContact]:                               │  │
│  │          soup = BeautifulSoup(html, 'html.parser')                  │  │
│  │                                                                      │  │
│  │          company = self.extract_company_name(soup)                   │  │
│  │          if not company:                                             │  │
│  │              return None  # company_name is required                 │  │
│  │                                                                      │  │
│  │          return RawBuyerContact(                                     │  │
│  │              company_name=company,                                   │  │
│  │              contact_person=self.extract_contact_person(soup),       │  │
│  │              email=self.extract_email(soup),                         │  │
│  │              phone=self.extract_phone(soup),                         │  │
│  │              country=self.extract_country(soup),                     │  │
│  │              city=self.extract_city(soup),                           │  │
│  │              requirement_details=self.extract_requirements(soup),    │  │
│  │              post_date=self.extract_post_date(soup),                 │  │
│  │              source_url=url,                                         │  │
│  │          )                                                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Deduplication

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     BUYER CONTACT DEDUPLICATION                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Deduplication runs after all sources are scraped for a commodity.         │
│  Two-pass matching:                                                        │
│                                                                             │
│  PASS 1: EMAIL EXACT MATCH                                                 │
│  ─────────────────────────                                                 │
│                                                                             │
│  If two contacts share the same email address (case-insensitive),          │
│  they are the same entity. Merge them.                                     │
│                                                                             │
│  PASS 2: COMPANY NAME FUZZY MATCH                                          │
│  ─────────────────────────────────                                         │
│                                                                             │
│  For contacts without email, or with different emails:                     │
│  • Normalize company names: lowercase, strip "pvt", "ltd", "inc", etc.    │
│  • Compute Levenshtein similarity ratio                                    │
│  • Threshold: >85% similarity = same company                              │
│                                                                             │
│  MERGE STRATEGY                                                            │
│  ──────────────                                                            │
│                                                                             │
│  When merging duplicate contacts:                                          │
│  • Keep the record with the most fields populated                          │
│  • For conflicting values, prefer the most recent source                   │
│  • Preserve ALL source URLs in contact_sources table                       │
│  • Sum quality score contributions from all sources                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def deduplicate_contacts(                                           │  │
│  │      contacts: List[RawBuyerContact]                                 │  │
│  │  ) -> List[DeduplicatedContact]:                                     │  │
│  │                                                                      │  │
│  │      # Pass 1: group by email                                        │  │
│  │      email_groups = group_by_email(contacts)                         │  │
│  │                                                                      │  │
│  │      # Pass 2: fuzzy match on company name within no-email group    │  │
│  │      no_email = [c for c in contacts if not c.email]                 │  │
│  │      name_groups = fuzzy_group_by_company(no_email, threshold=0.85) │  │
│  │                                                                      │  │
│  │      # Merge each group into a single canonical contact              │  │
│  │      merged = []                                                     │  │
│  │      for group in email_groups + name_groups:                        │  │
│  │          canonical = merge_contact_group(group)                      │  │
│  │          merged.append(canonical)                                    │  │
│  │                                                                      │  │
│  │      return merged                                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  CROSS-JOB DEDUPLICATION                                                   │
│  ────────────────────────                                                  │
│                                                                             │
│  When a new job discovers contacts for a commodity that already has         │
│  existing contacts in the database:                                        │
│  • Match against existing buyer_contacts for the same commodity_id         │
│  • If match found: update fields if new data is more complete              │
│  • If no match: insert as new contact                                      │
│  • Always add new contact_sources entry for audit trail                    │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.6 Quality Scoring Algorithm

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     BUYER QUALITY SCORING                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Score range: 0-100                                                        │
│  Outreach-ready threshold: >= 50                                           │
│                                                                             │
│  SCORING BREAKDOWN                                                         │
│  ─────────────────                                                         │
│                                                                             │
│  ┌──────────────────────────┬────────┬───────────────────────────────────┐ │
│  │ Factor                   │ Points │ Condition                         │ │
│  ├──────────────────────────┼────────┼───────────────────────────────────┤ │
│  │ Email present             │ +30    │ Valid email address extracted     │ │
│  │ Phone present             │ +20    │ Valid phone number extracted      │ │
│  │ Contact name present      │ +15    │ Named individual (not generic)   │ │
│  │ Recent post (<30 days)    │ +20    │ Post date within last 30 days    │ │
│  │ Verified profile          │ +15    │ Source indicates verified status  │ │
│  └──────────────────────────┴────────┴───────────────────────────────────┘ │
│                                                                             │
│  Maximum possible score: 100                                               │
│                                                                             │
│  CLASSIFICATION                                                            │
│  ──────────────                                                            │
│                                                                             │
│  ┌──────────────────────┬───────────────────────────────────────────────┐ │
│  │ Score Range           │ Classification                               │ │
│  ├──────────────────────┼───────────────────────────────────────────────┤ │
│  │ 80-100                │ HIGH — Outreach-ready, prioritize            │ │
│  │ 50-79                 │ MEDIUM — Outreach-ready, standard queue      │ │
│  │ 30-49                 │ LOW — Needs enrichment before outreach       │ │
│  │ 0-29                  │ INSUFFICIENT — Archive, do not outreach      │ │
│  └──────────────────────┴───────────────────────────────────────────────┘ │
│                                                                             │
│  IMPLEMENTATION                                                            │
│  ──────────────                                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def calculate_buyer_quality_score(                                   │  │
│  │      contact: DeduplicatedContact                                    │  │
│  │  ) -> BuyerQualityScore:                                             │  │
│  │      score = 0                                                       │  │
│  │      factors = []                                                    │  │
│  │                                                                      │  │
│  │      if contact.email and is_valid_email(contact.email):             │  │
│  │          score += 30                                                 │  │
│  │          factors.append("email_present")                             │  │
│  │                                                                      │  │
│  │      if contact.phone and is_valid_phone(contact.phone):             │  │
│  │          score += 20                                                 │  │
│  │          factors.append("phone_present")                             │  │
│  │                                                                      │  │
│  │      if contact.contact_person and contact.contact_person != "N/A":  │  │
│  │          score += 15                                                 │  │
│  │          factors.append("contact_name_present")                      │  │
│  │                                                                      │  │
│  │      if contact.post_date:                                           │  │
│  │          days_old = (datetime.utcnow() - contact.post_date).days    │  │
│  │          if days_old <= 30:                                          │  │
│  │              score += 20                                             │  │
│  │              factors.append("recent_post")                           │  │
│  │                                                                      │  │
│  │      if contact.is_verified_profile:                                 │  │
│  │          score += 15                                                 │  │
│  │          factors.append("verified_profile")                          │  │
│  │                                                                      │  │
│  │      # Determine classification                                      │  │
│  │      if score >= 80:                                                 │  │
│  │          classification = "HIGH"                                     │  │
│  │      elif score >= 50:                                               │  │
│  │          classification = "MEDIUM"                                   │  │
│  │      elif score >= 30:                                               │  │
│  │          classification = "LOW"                                      │  │
│  │      else:                                                           │  │
│  │          classification = "INSUFFICIENT"                             │  │
│  │                                                                      │  │
│  │      return BuyerQualityScore(                                       │  │
│  │          score=score,                                                │  │
│  │          classification=classification,                              │  │
│  │          factors=factors,                                            │  │
│  │          is_outreach_ready=(score >= 50),                            │  │
│  │      )                                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 4.7 Database Schema

```sql
-- ============================================================
-- STAGE 2: BUYER DISCOVERY TABLES
-- ============================================================

-- Buyer scrape jobs — one per discovery trigger per commodity
CREATE TABLE buyer_scrape_jobs (
    job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity_id    UUID NOT NULL REFERENCES approved_commodities(commodity_id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed',
                                      'partial_failure', 'failed')),
    trigger_type    VARCHAR(20) NOT NULL DEFAULT 'manual'
                    CHECK (trigger_type IN ('manual', 'scheduled')),
    triggered_by    VARCHAR(100),              -- admin ID or 'system'
    sources_config  JSONB NOT NULL DEFAULT '[]',  -- which sources to scrape
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    contacts_found  INTEGER DEFAULT 0,
    contacts_new    INTEGER DEFAULT 0,          -- new contacts (not deduped)
    contacts_merged INTEGER DEFAULT 0,          -- merged with existing
    error_summary   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buyer_jobs_commodity ON buyer_scrape_jobs(commodity_id);
CREATE INDEX idx_buyer_jobs_status ON buyer_scrape_jobs(status);
CREATE INDEX idx_buyer_jobs_created ON buyer_scrape_jobs(created_at DESC);

-- Buyer contacts — deduplicated contact records
CREATE TABLE buyer_contacts (
    contact_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity_id        UUID NOT NULL REFERENCES approved_commodities(commodity_id),
    first_discovered_job UUID NOT NULL REFERENCES buyer_scrape_jobs(job_id),
    last_updated_job    UUID REFERENCES buyer_scrape_jobs(job_id),
    company_name        VARCHAR(500) NOT NULL,
    company_name_norm   VARCHAR(500) NOT NULL,   -- normalized for dedup
    contact_person      VARCHAR(300),
    email               VARCHAR(320),            -- RFC 5321 max length
    email_verified      BOOLEAN DEFAULT FALSE,
    phone               VARCHAR(50),
    phone_normalized    VARCHAR(20),              -- E.164 format
    country             VARCHAR(100),
    city                VARCHAR(200),
    quality_score       INTEGER NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    quality_class       VARCHAR(20) NOT NULL DEFAULT 'INSUFFICIENT'
                        CHECK (quality_class IN ('HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT')),
    is_outreach_ready   BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
    archived_reason     VARCHAR(100),
    first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buyer_contacts_commodity ON buyer_contacts(commodity_id);
CREATE INDEX idx_buyer_contacts_email ON buyer_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_buyer_contacts_quality ON buyer_contacts(quality_score DESC);
CREATE INDEX idx_buyer_contacts_outreach ON buyer_contacts(is_outreach_ready)
    WHERE is_outreach_ready = TRUE AND is_archived = FALSE;
CREATE INDEX idx_buyer_contacts_company_norm ON buyer_contacts(company_name_norm);

-- Buyer requirements — specific buying needs per contact
CREATE TABLE buyer_requirements (
    requirement_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id          UUID NOT NULL REFERENCES buyer_contacts(contact_id) ON DELETE CASCADE,
    commodity_name      VARCHAR(500),            -- as stated by buyer
    quantity            VARCHAR(200),            -- "500 MT/month" (free text)
    specifications      TEXT,                    -- buyer's detailed specs
    post_date           DATE,                    -- when the RFQ was posted
    source_url          VARCHAR(2000),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_buyer_reqs_contact ON buyer_requirements(contact_id);
CREATE INDEX idx_buyer_reqs_post_date ON buyer_requirements(post_date DESC);

-- Contact sources — audit trail linking contacts to scrape origins
CREATE TABLE contact_sources (
    source_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id      UUID NOT NULL,              -- FK to buyer_contacts or seller_contacts
    contact_type    VARCHAR(10) NOT NULL CHECK (contact_type IN ('buyer', 'seller')),
    source_name     VARCHAR(50) NOT NULL,       -- 'tradekey', 'indiamart', 'alibaba', etc.
    source_url      VARCHAR(2000) NOT NULL,
    raw_data        JSONB,                      -- original extracted fields
    scraped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_sources_contact ON contact_sources(contact_id, contact_type);
CREATE INDEX idx_contact_sources_source ON contact_sources(source_name);
```

### 4.8 API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/admin/niche/buyers/discover` | Trigger buyer discovery for a commodity | `{ commodity_id, sources?: string[] }` |
| `GET` | `/admin/niche/buyers/jobs` | List buyer scrape jobs | Query: `?commodity_id=&status=&page=&limit=` |
| `GET` | `/admin/niche/buyers/jobs/{job_id}` | Get job details with progress | — |
| `GET` | `/admin/niche/buyers/contacts` | List discovered buyers (filterable) | Query: `?commodity_id=&quality_class=&country=&has_email=&page=&limit=&sort=` |
| `GET` | `/admin/niche/buyers/contacts/{id}` | Get buyer contact details with sources and requirements | — |
| `POST` | `/admin/niche/buyers/contacts/export` | Export contacts to CSV | `{ commodity_id, quality_min?: number, format: "csv" }` |
| `PATCH` | `/admin/niche/buyers/contacts/{id}/archive` | Archive a contact | `{ reason: string }` |

### 4.9 Edge Cases

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     BUYER DISCOVERY EDGE CASES                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. NO CONTACTS FOUND FOR A COMMODITY                                      │
│     ──────────────────────────────────                                     │
│     • Job completes with status "completed", contacts_found = 0            │
│     • Admin notified: "No buyers found for [commodity]"                    │
│     • System suggests: broaden search queries, check category mapping      │
│     • Do NOT retry automatically — admin reviews search config first       │
│                                                                             │
│  2. DUPLICATE COMPANIES ACROSS MULTIPLE SOURCES                            │
│     ──────────────────────────────────────────                             │
│     • Same company listed on TradeKey AND IndiaMART                        │
│     • Merge into single contact with highest quality data                  │
│     • contact_sources preserves both origins                               │
│     • "Multiple source corroboration" does NOT add bonus points for        │
│       buyers (unlike sellers) — buyer scoring uses presence-based factors  │
│                                                                             │
│  3. LISTINGS OLDER THAN 90 DAYS                                            │
│     ──────────────────────────────                                         │
│     • Still extract the contact (company may still be active)              │
│     • post_date field accurately reflects age                              │
│     • Quality score penalizes: "Recent post" factor = 0                    │
│     • Admin can filter by recency in UI                                    │
│                                                                             │
│  4. B2B SITE STRUCTURE CHANGES BREAKING SCRAPERS                           │
│     ────────────────────────────────────────────                           │
│     • Each scraper has a health_check() method that validates expected     │
│       CSS selectors against a known test page                              │
│     • If health check fails before a run: mark source as "degraded"       │
│     • Job proceeds with remaining healthy sources (partial_failure)        │
│     • Alert admin: "[Source] scraper needs maintenance"                    │
│     • Scraper version tracked in scraper_health table                     │
│                                                                             │
│  5. RATE LIMIT EXHAUSTION MID-JOB                                          │
│     ─────────────────────────────                                          │
│     • If exponential backoff exceeds 10 minutes, skip remaining pages     │
│     • Record: "Source X: scraped 4/10 pages before rate limit"            │
│     • Job status: partial_failure (not failed — we have partial data)     │
│                                                                             │
│  6. EMAIL FOUND BUT BELONGS TO MARKETPLACE (e.g., @tradekey.com)          │
│     ──────────────────────────────────────────────────────────             │
│     • Reject the email, treat contact as "no email"                        │
│     • Quality score reflects: email_present = 0                            │
│     • Maintained in reject_email_domains list                              │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Stage 3: Seller Discovery

### 5.1 Data Sources

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        SELLER DISCOVERY SOURCES                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┬──────────────────────┬──────────────────────┬──────────┐ │
│  │ Source       │ What to Search       │ What to Extract      │ Rate     │ │
│  │              │                      │                      │ Limit    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ APEDA        │ Registered exporter  │ Company, reg number, │ 1 req /  │ │
│  │ Exporters    │ database by HS code  │ products, contact    │ 5 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ Spice Board  │ Registered exporters │ Company, license,    │ 1 req /  │ │
│  │ Exporters    │ by product specialty │ specialties, contact │ 5 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ DGFT IEC     │ IEC holder database  │ Company, IEC number, │ 1 req /  │ │
│  │ Holders      │ by export history    │ export history       │ 5 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ NAFED        │ Member directory     │ Company, member ID,  │ 1 req /  │ │
│  │ Members      │                      │ commodities, contact │ 5 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ State        │ State marketing      │ Company, region,     │ 1 req /  │ │
│  │ Cooperatives │ federation lists     │ commodities, contact │ 5 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ Industry     │ Spice Exporters Assoc│ Company, member ID,  │ 1 req /  │ │
│  │ Associations │ Tea/Coffee exporters │ specializations      │ 5 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ TradeKey     │ Supplier profiles    │ Company, products,   │ 1 req /  │ │
│  │ Suppliers    │ for commodity        │ contact, ratings     │ 3 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ IndiaMART    │ Seller profiles      │ Company, products,   │ 1 req /  │ │
│  │ Sellers      │ for commodity        │ contact, ratings     │ 3 sec    │ │
│  ├──────────────┼──────────────────────┼──────────────────────┼──────────┤ │
│  │ Alibaba      │ India-based supplier │ Company, products,   │ 1 req /  │ │
│  │ Suppliers    │ profiles             │ export capability    │ 5 sec    │ │
│  └──────────────┴──────────────────────┴──────────────────────┴──────────┘ │
│                                                                             │
│  VOLUME ESTIMATES (per commodity, per run)                                 │
│  ────────────────────────────────────────                                  │
│                                                                             │
│  Government DBs:   10-100 exporters (highly targeted)                      │
│  Associations:     5-50 members                                            │
│  B2B Marketplaces: 20-100 suppliers                                        │
│                                                                             │
│  TOTAL: ~35-250 raw contacts per commodity per run                         │
│  After deduplication: ~25-150 unique contacts                              │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Source Prioritization

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     SELLER SOURCE PRIORITIZATION                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Seller discovery follows a strict priority order based on data quality.   │
│  Higher-priority sources produce contacts with higher base trust.          │
│                                                                             │
│  PRIORITY 1: GOVERNMENT EXPORTER DATABASES (Verified)                      │
│  ─────────────────────────────────────────────────────                     │
│  • APEDA registered exporters                                              │
│  • DGFT IEC (Import Export Code) holders                                   │
│  • Spice Board licensed exporters                                          │
│                                                                             │
│  Rationale: Government-registered exporters have undergone official        │
│  verification. Their registration implies active export capability.        │
│  These contacts receive the "government_registered" quality bonus (+30).   │
│                                                                             │
│  PRIORITY 2: INDUSTRY ASSOCIATION MEMBERS (Verified)                       │
│  ────────────────────────────────────────────────────                      │
│  • NAFED members                                                           │
│  • State cooperatives                                                      │
│  • Spice Exporters Association of India                                    │
│  • Tea / Coffee / Rubber specific associations                             │
│                                                                             │
│  Rationale: Association membership requires dues and peer vetting.         │
│  Members are typically active businesses. Receive "association_member"     │
│  quality bonus (+20).                                                      │
│                                                                             │
│  PRIORITY 3: B2B MARKETPLACE SUPPLIERS (Unverified)                        │
│  ──────────────────────────────────────────────────                        │
│  • TradeKey supplier profiles                                              │
│  • IndiaMART seller listings                                               │
│  • Alibaba India-based supplier pages                                      │
│                                                                             │
│  Rationale: Marketplace profiles are self-declared. No independent         │
│  verification. These contacts start at lower base trust and need           │
│  enrichment or corroboration from other sources to score well.             │
│                                                                             │
│  EXECUTION ORDER                                                           │
│  ───────────────                                                           │
│                                                                             │
│  Government sources run FIRST. Their results are used to cross-reference   │
│  association and marketplace contacts (boosting "multiple_sources" score). │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ Government  │───▶│ Association │───▶│ B2B Market- │                     │
│  │ DBs (P1)    │    │ Members (P2)│    │ places (P3) │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│        │                  │                   │                             │
│        └──────────────────┼───────────────────┘                             │
│                           ▼                                                │
│                  ┌─────────────────┐                                        │
│                  │ Cross-Reference │                                        │
│                  │ & Enrichment    │                                        │
│                  └─────────────────┘                                        │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Government Database Extraction

```
┌────────────────────────────────────────────────────────────────────────────┐
│                 GOVERNMENT DATABASE EXTRACTION                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT: approved_commodity with hs_code and commodity_name                 │
│                                                                             │
│  APEDA EXPORTER LOOKUP                                                     │
│  ─────────────────────                                                     │
│                                                                             │
│  1. Use HS code (8-digit) to search APEDA registered exporter database    │
│  2. Fallback to HS chapter (2-digit) if 8-digit yields 0 results          │
│  3. Extract:                                                               │
│     • Company name                                                         │
│     • APEDA registration number (RCMC number)                              │
│     • Registered product categories                                        │
│     • Address + contact details (if public)                                │
│     • Registration status (active/expired)                                 │
│  4. Filter: only active registrations                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  class APEDAExporterScraper(BaseContactScraper):                     │  │
│  │      source_name = "apeda_exporters"                                 │  │
│  │      source_priority = 1  # Government                               │  │
│  │      rate_limit_seconds = 5.0                                        │  │
│  │                                                                      │  │
│  │      def search_exporters(self, hs_code: str)                        │  │
│  │          -> List[RawSellerContact]:                                   │  │
│  │          # 1. Query APEDA portal by HS code                          │  │
│  │          results = self.fetch_exporter_list(hs_code)                  │  │
│  │                                                                      │  │
│  │          # 2. If no results, try broader HS chapter                  │  │
│  │          if not results and len(hs_code) > 2:                        │  │
│  │              results = self.fetch_exporter_list(hs_code[:2])          │  │
│  │                                                                      │  │
│  │          # 3. Extract contacts from each result                      │  │
│  │          contacts = []                                                │  │
│  │          for result in results:                                       │  │
│  │              contact = self.extract_contact(result)                   │  │
│  │              if contact and contact.registration_status == "active":  │  │
│  │                  contacts.append(contact)                             │  │
│  │                                                                      │  │
│  │          return contacts                                              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  DGFT IEC HOLDER LOOKUP                                                    │
│  ──────────────────────                                                    │
│                                                                             │
│  1. Search DGFT IEC database by commodity description keywords             │
│  2. Cross-reference with Export Import Data Bank for trade history          │
│  3. Extract:                                                               │
│     • Company name                                                         │
│     • IEC number (10-digit)                                                │
│     • Export commodity categories                                          │
│     • Trade history (if available via data bank)                           │
│     • Address + contact                                                    │
│                                                                             │
│  SPECIAL: DGFT site uses dynamic JS rendering. Selenium required.          │
│  CAPTCHA may be present — if detected, pause and alert admin.              │
│                                                                             │
│  SPICE BOARD EXPORTER LOOKUP                                               │
│  ────────────────────────────                                              │
│                                                                             │
│  1. Only applicable for spice commodities (auto-detect via HS chapter 09) │
│  2. Search by spice name in registered exporter directory                  │
│  3. Extract:                                                               │
│     • Company name                                                         │
│     • Spice Board license number                                           │
│     • Licensed spice categories                                            │
│     • Contact details                                                      │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Association Member Extraction

```
┌────────────────────────────────────────────────────────────────────────────┐
│                 ASSOCIATION MEMBER EXTRACTION                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  NAFED MEMBER DIRECTORY                                                    │
│  ─────────────────────                                                     │
│                                                                             │
│  1. NAFED (National Agricultural Cooperative Marketing Federation)          │
│  2. Scrape member directory pages                                          │
│  3. Filter by commodity category matching:                                 │
│     • Use commodity_name keywords against member "Products" field          │
│     • Use HS code chapter against member "Trade Categories"                │
│  4. Extract: Company, member ID, contact, product list, region             │
│                                                                             │
│  STATE COOPERATIVE DIRECTORIES                                             │
│  ─────────────────────────────                                             │
│                                                                             │
│  1. Target state marketing federations in top producing states             │
│  2. Map commodity to producing states using Stage 1 data                   │
│  3. Scrape cooperative member lists from state federation websites          │
│  4. Extract: Cooperative name, region, commodities handled, contact        │
│                                                                             │
│  INDUSTRY ASSOCIATIONS                                                     │
│  ─────────────────────                                                     │
│                                                                             │
│  ┌─────────────────────────────┬───────────────────────────────────────┐  │
│  │ Association                 │ Applicable When                       │  │
│  ├─────────────────────────────┼───────────────────────────────────────┤  │
│  │ All India Spice Exporters   │ HS chapter 09 (spices)               │  │
│  │   Forum (AISEF)             │                                       │  │
│  ├─────────────────────────────┼───────────────────────────────────────┤  │
│  │ Indian Tea Association      │ HS 0902 (tea)                         │  │
│  ├─────────────────────────────┼───────────────────────────────────────┤  │
│  │ Coffee Exporters Assoc.     │ HS 0901 (coffee)                      │  │
│  ├─────────────────────────────┼───────────────────────────────────────┤  │
│  │ Shellac Export Promotion    │ HS 1301 (lac, gums)                   │  │
│  │   Council                   │                                       │  │
│  ├─────────────────────────────┼───────────────────────────────────────┤  │
│  │ Cashew Export Promotion     │ HS 0801 (cashews)                     │  │
│  │   Council                   │                                       │  │
│  └─────────────────────────────┴───────────────────────────────────────┘  │
│                                                                             │
│  Association membership is detected by HS code prefix matching.            │
│  Only relevant associations are scraped for a given commodity.             │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.5 B2B Supplier Extraction

```
┌────────────────────────────────────────────────────────────────────────────┐
│                 B2B SUPPLIER EXTRACTION                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  B2B marketplace scraping for sellers follows the same parallel worker     │
│  pattern as buyer discovery (Section 4.3), with different search targets.  │
│                                                                             │
│  SEARCH STRATEGY                                                           │
│  ───────────────                                                           │
│                                                                             │
│  • TradeKey: GET /search?type=supplier&keyword={commodity}                 │
│  • IndiaMART: GET /search/products?q={commodity}&type=seller               │
│  • Alibaba: GET /trade/search?keyword={commodity}&origin=India             │
│                                                                             │
│  FILTER CRITERIA                                                           │
│  ───────────────                                                           │
│                                                                             │
│  • Product match: listing must contain commodity keyword                   │
│  • Location: India-based (for export capability)                           │
│  • Export capability: prefer profiles indicating export experience         │
│                                                                             │
│  FIELDS EXTRACTED                                                          │
│  ────────────────                                                          │
│                                                                             │
│  • Company name                                                            │
│  • Product catalog keywords (matched products)                             │
│  • Contact person                                                          │
│  • Email / phone                                                           │
│  • Location (state, city)                                                  │
│  • Marketplace ratings/reviews count (if visible)                          │
│  • Years in business (if visible)                                          │
│  • Certifications mentioned (FSSAI, ISO, organic, etc.)                   │
│  • Export countries mentioned                                              │
│                                                                             │
│  Pagination: max 10 pages per query per source (same as buyer flow)        │
│  Rate limiting: per-source delays as specified in Section 6.2              │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Data Enrichment

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     SELLER DATA ENRICHMENT                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  After initial extraction from all sources, run enrichment passes:         │
│                                                                             │
│  PASS 1: CROSS-REFERENCE SOURCES                                          │
│  ────────────────────────────────                                          │
│                                                                             │
│  For each seller contact found in a B2B marketplace:                       │
│  • Check if the same company appears in government DB results              │
│  • Match by: company_name_norm fuzzy >85% OR registration number          │
│  • If match found: mark "multiple_sources = true", record corroboration   │
│                                                                             │
│  For each seller from government DB:                                       │
│  • Check if the company has a B2B marketplace presence                     │
│  • If yes: extract additional data (ratings, reviews, product photos)      │
│                                                                             │
│  PASS 2: COMPANY WEBSITE SCRAPING                                          │
│  ────────────────────────────────                                          │
│                                                                             │
│  For HIGH quality contacts (score >= 50 after initial scoring):            │
│  • Attempt to find company website via:                                    │
│    - Explicit URL in marketplace profile                                   │
│    - Google search: "{company_name} {commodity} exporter site"             │
│  • If website found, scrape:                                               │
│    - Contact page → additional emails, phone numbers                       │
│    - About page → certifications, capacity, history                        │
│    - Product page → detailed product catalog                               │
│  • Rate limit: 1 req/5 sec for company websites                           │
│  • Respect robots.txt                                                      │
│                                                                             │
│  PASS 3: CERTIFICATION VERIFICATION (Lightweight)                          │
│  ─────────────────────────────────────────────────                         │
│                                                                             │
│  If seller claims certifications (FSSAI, ISO, USDA Organic):              │
│  • Cross-check FSSAI license number against fssai.gov.in (if number       │
│    is available in profile)                                                │
│  • Record verification status in seller_verifications table                │
│  • Do NOT block on verification — it is async enrichment                   │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Quality Scoring Algorithm

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     SELLER QUALITY SCORING                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Score range: 0-100                                                        │
│  Outreach-ready threshold: >= 50                                           │
│                                                                             │
│  NOTE: Seller scoring uses DIFFERENT weights than buyer scoring.           │
│  Government registration and multi-source corroboration are valued         │
│  more highly than recency, because sellers are established businesses.     │
│                                                                             │
│  SCORING BREAKDOWN                                                         │
│  ─────────────────                                                         │
│                                                                             │
│  ┌───────────────────────────────┬────────┬──────────────────────────────┐ │
│  │ Factor                        │ Points │ Condition                    │ │
│  ├───────────────────────────────┼────────┼──────────────────────────────┤ │
│  │ Government registered          │ +30    │ Found in APEDA/DGFT/Spice  │ │
│  │                                │        │ Board exporter database     │ │
│  ├───────────────────────────────┼────────┼──────────────────────────────┤ │
│  │ Association member             │ +20    │ Found in NAFED/industry     │ │
│  │                                │        │ association directory       │ │
│  ├───────────────────────────────┼────────┼──────────────────────────────┤ │
│  │ Email verified                 │ +20    │ Valid email with MX record  │ │
│  │                                │        │ lookup passing              │ │
│  ├───────────────────────────────┼────────┼──────────────────────────────┤ │
│  │ Website present                │ +15    │ Company website found and   │ │
│  │                                │        │ responding (HTTP 200)       │ │
│  ├───────────────────────────────┼────────┼──────────────────────────────┤ │
│  │ Multiple source corroboration  │ +15    │ Company found in 2+ of the │ │
│  │                                │        │ above source categories     │ │
│  └───────────────────────────────┴────────┴──────────────────────────────┘ │
│                                                                             │
│  Maximum possible score: 100                                               │
│                                                                             │
│  CLASSIFICATION                                                            │
│  ──────────────                                                            │
│                                                                             │
│  ┌──────────────────────┬───────────────────────────────────────────────┐ │
│  │ Score Range           │ Classification                               │ │
│  ├──────────────────────┼───────────────────────────────────────────────┤ │
│  │ 80-100                │ HIGH — Government-verified, outreach-ready   │ │
│  │ 50-79                 │ MEDIUM — Outreach-ready, standard queue      │ │
│  │ 30-49                 │ LOW — Needs enrichment before outreach       │ │
│  │ 0-29                  │ INSUFFICIENT — Archive, do not outreach      │ │
│  └──────────────────────┴───────────────────────────────────────────────┘ │
│                                                                             │
│  IMPLEMENTATION                                                            │
│  ──────────────                                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  def calculate_seller_quality_score(                                  │  │
│  │      contact: DeduplicatedSellerContact,                             │  │
│  │      verifications: List[SellerVerification],                        │  │
│  │  ) -> SellerQualityScore:                                            │  │
│  │      score = 0                                                       │  │
│  │      factors = []                                                    │  │
│  │      source_categories = set()                                       │  │
│  │                                                                      │  │
│  │      # Check government registration                                 │  │
│  │      govt_sources = {"apeda_exporters", "dgft_iec", "spice_board"}  │  │
│  │      for v in verifications:                                         │  │
│  │          if v.source_type in govt_sources:                           │  │
│  │              source_categories.add("government")                     │  │
│  │                                                                      │  │
│  │      if "government" in source_categories:                           │  │
│  │          score += 30                                                 │  │
│  │          factors.append("government_registered")                     │  │
│  │                                                                      │  │
│  │      # Check association membership                                  │  │
│  │      assoc_sources = {"nafed", "state_cooperative",                  │  │
│  │                        "industry_association"}                        │  │
│  │      for v in verifications:                                         │  │
│  │          if v.source_type in assoc_sources:                          │  │
│  │              source_categories.add("association")                     │  │
│  │                                                                      │  │
│  │      if "association" in source_categories:                          │  │
│  │          score += 20                                                 │  │
│  │          factors.append("association_member")                         │  │
│  │                                                                      │  │
│  │      # Email verification                                            │  │
│  │      if contact.email and contact.email_mx_valid:                    │  │
│  │          score += 20                                                 │  │
│  │          factors.append("email_verified")                            │  │
│  │                                                                      │  │
│  │      # Website presence                                              │  │
│  │      if contact.website_url and contact.website_reachable:           │  │
│  │          score += 15                                                 │  │
│  │          factors.append("website_present")                           │  │
│  │                                                                      │  │
│  │      # Multiple source corroboration                                 │  │
│  │      b2b_sources = {"tradekey", "indiamart", "alibaba"}             │  │
│  │      for v in verifications:                                         │  │
│  │          if v.source_type in b2b_sources:                            │  │
│  │              source_categories.add("b2b")                            │  │
│  │                                                                      │  │
│  │      if len(source_categories) >= 2:                                 │  │
│  │          score += 15                                                 │  │
│  │          factors.append("multiple_sources")                          │  │
│  │                                                                      │  │
│  │      # Classification                                                │  │
│  │      if score >= 80:                                                 │  │
│  │          classification = "HIGH"                                     │  │
│  │      elif score >= 50:                                               │  │
│  │          classification = "MEDIUM"                                   │  │
│  │      elif score >= 30:                                               │  │
│  │          classification = "LOW"                                      │  │
│  │      else:                                                           │  │
│  │          classification = "INSUFFICIENT"                             │  │
│  │                                                                      │  │
│  │      return SellerQualityScore(                                      │  │
│  │          score=score,                                                │  │
│  │          classification=classification,                              │  │
│  │          factors=factors,                                            │  │
│  │          source_categories=list(source_categories),                  │  │
│  │          is_outreach_ready=(score >= 50),                            │  │
│  │      )                                                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 5.8 Database Schema

```sql
-- ============================================================
-- STAGE 3: SELLER DISCOVERY TABLES
-- ============================================================

-- Seller scrape jobs — one per discovery trigger per commodity
CREATE TABLE seller_scrape_jobs (
    job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity_id    UUID NOT NULL REFERENCES approved_commodities(commodity_id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'running', 'completed',
                                      'partial_failure', 'failed')),
    trigger_type    VARCHAR(20) NOT NULL DEFAULT 'manual'
                    CHECK (trigger_type IN ('manual', 'scheduled')),
    triggered_by    VARCHAR(100),
    sources_config  JSONB NOT NULL DEFAULT '[]',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    contacts_found  INTEGER DEFAULT 0,
    contacts_new    INTEGER DEFAULT 0,
    contacts_merged INTEGER DEFAULT 0,
    govt_contacts   INTEGER DEFAULT 0,          -- government DB contacts
    assoc_contacts  INTEGER DEFAULT 0,          -- association contacts
    b2b_contacts    INTEGER DEFAULT 0,          -- marketplace contacts
    error_summary   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_jobs_commodity ON seller_scrape_jobs(commodity_id);
CREATE INDEX idx_seller_jobs_status ON seller_scrape_jobs(status);
CREATE INDEX idx_seller_jobs_created ON seller_scrape_jobs(created_at DESC);

-- Seller contacts — deduplicated contact records
CREATE TABLE seller_contacts (
    contact_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity_id        UUID NOT NULL REFERENCES approved_commodities(commodity_id),
    first_discovered_job UUID NOT NULL REFERENCES seller_scrape_jobs(job_id),
    last_updated_job    UUID REFERENCES seller_scrape_jobs(job_id),
    company_name        VARCHAR(500) NOT NULL,
    company_name_norm   VARCHAR(500) NOT NULL,
    contact_person      VARCHAR(300),
    email               VARCHAR(320),
    email_verified      BOOLEAN DEFAULT FALSE,
    email_mx_valid      BOOLEAN,                 -- MX record lookup result
    phone               VARCHAR(50),
    phone_normalized    VARCHAR(20),
    country             VARCHAR(100) DEFAULT 'India',
    state               VARCHAR(100),
    city                VARCHAR(200),
    website_url         VARCHAR(2000),
    website_reachable   BOOLEAN,
    registration_number VARCHAR(100),             -- APEDA RCMC / DGFT IEC / etc.
    registration_type   VARCHAR(50),              -- 'apeda', 'dgft_iec', 'spice_board'
    quality_score       INTEGER NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    quality_class       VARCHAR(20) NOT NULL DEFAULT 'INSUFFICIENT'
                        CHECK (quality_class IN ('HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT')),
    is_outreach_ready   BOOLEAN NOT NULL DEFAULT FALSE,
    is_govt_verified    BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
    archived_reason     VARCHAR(100),
    first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_contacts_commodity ON seller_contacts(commodity_id);
CREATE INDEX idx_seller_contacts_email ON seller_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_seller_contacts_quality ON seller_contacts(quality_score DESC);
CREATE INDEX idx_seller_contacts_outreach ON seller_contacts(is_outreach_ready)
    WHERE is_outreach_ready = TRUE AND is_archived = FALSE;
CREATE INDEX idx_seller_contacts_govt ON seller_contacts(is_govt_verified)
    WHERE is_govt_verified = TRUE;
CREATE INDEX idx_seller_contacts_company_norm ON seller_contacts(company_name_norm);
CREATE INDEX idx_seller_contacts_reg ON seller_contacts(registration_number)
    WHERE registration_number IS NOT NULL;

-- Seller capabilities — export capabilities per contact
CREATE TABLE seller_capabilities (
    capability_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id          UUID NOT NULL REFERENCES seller_contacts(contact_id) ON DELETE CASCADE,
    product_categories  TEXT[],                   -- array of commodity categories
    certifications      TEXT[],                   -- FSSAI, ISO, USDA Organic, etc.
    export_countries    TEXT[],                   -- countries they export to
    annual_capacity     VARCHAR(200),            -- "500 MT/year" (free text)
    years_in_business   INTEGER,
    source_url          VARCHAR(2000),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_caps_contact ON seller_capabilities(contact_id);

-- Seller verifications — source verification records
CREATE TABLE seller_verifications (
    verification_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id          UUID NOT NULL REFERENCES seller_contacts(contact_id) ON DELETE CASCADE,
    source_type         VARCHAR(50) NOT NULL,     -- 'apeda_exporters', 'dgft_iec', 'nafed', etc.
    source_name         VARCHAR(100) NOT NULL,    -- human-readable name
    source_url          VARCHAR(2000),
    registration_number VARCHAR(100),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified'
                        CHECK (verification_status IN ('verified', 'unverified',
                                                       'expired', 'not_found')),
    verified_at         TIMESTAMPTZ,
    raw_data            JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seller_verif_contact ON seller_verifications(contact_id);
CREATE INDEX idx_seller_verif_source ON seller_verifications(source_type);
CREATE INDEX idx_seller_verif_status ON seller_verifications(verification_status);

-- NOTE: contact_sources table (defined in Section 4.7) is shared between
-- buyer and seller contacts. The contact_type column distinguishes them.
```

### 5.9 API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| `POST` | `/admin/niche/sellers/discover` | Trigger seller discovery for a commodity | `{ commodity_id, sources?: string[] }` |
| `GET` | `/admin/niche/sellers/jobs` | List seller scrape jobs | Query: `?commodity_id=&status=&page=&limit=` |
| `GET` | `/admin/niche/sellers/jobs/{job_id}` | Get job details with per-source breakdown | — |
| `GET` | `/admin/niche/sellers/contacts` | List discovered sellers (filterable) | Query: `?commodity_id=&quality_class=&is_govt_verified=&state=&page=&limit=&sort=` |
| `GET` | `/admin/niche/sellers/contacts/{id}` | Get seller contact with capabilities and verifications | — |
| `POST` | `/admin/niche/sellers/contacts/export` | Export contacts to CSV | `{ commodity_id, quality_min?: number, govt_only?: boolean, format: "csv" }` |
| `GET` | `/admin/niche/sellers/verified` | List government-verified sellers only | Query: `?commodity_id=&registration_type=&page=&limit=` |
| `PATCH` | `/admin/niche/sellers/contacts/{id}/archive` | Archive a contact | `{ reason: string }` |

### 5.10 Edge Cases

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     SELLER DISCOVERY EDGE CASES                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CAPTCHA ON GOVERNMENT SITES                                            │
│     ─────────────────────────────                                          │
│     • DGFT and some APEDA pages may present CAPTCHA                        │
│     • Detection: check for CAPTCHA form elements in response HTML          │
│     • Action: immediately pause that source, mark "captcha_blocked"        │
│     • Alert admin: "DGFT scraper blocked by CAPTCHA"                       │
│     • Job proceeds with other sources (partial_failure)                     │
│     • Admin can manually resolve CAPTCHA and re-trigger single source      │
│                                                                             │
│  2. OUTDATED REGISTRATIONS                                                 │
│     ──────────────────────────                                             │
│     • Government DBs may list expired registrations                        │
│     • Check registration_status / expiry_date if available                 │
│     • Expired registrations: extract but flag "registration_expired"       │
│     • Quality score: "government_registered" bonus still applies           │
│       (expired registration still indicates a real exporter)               │
│     • Admin can see "expired" badge in contact detail view                 │
│                                                                             │
│  3. SELLERS WITHOUT EMAIL                                                  │
│     ─────────────────────────                                              │
│     • Government DBs often provide address but not email                   │
│     • Still valuable: government registration confirms legitimacy          │
│     • Quality score: email_verified = 0, but govt_registered = +30         │
│     • Enrichment pass (Section 5.6) attempts to find email via website     │
│     • If enrichment succeeds, quality score is recalculated                │
│                                                                             │
│  4. OVERLAPPING EXPORTER REGISTRATIONS ACROSS BOARDS                       │
│     ──────────────────────────────────────────────────                     │
│     • Same company may be registered with APEDA AND Spice Board            │
│     • Deduplication merges into single contact                             │
│     • Both registration numbers preserved in seller_verifications          │
│     • Quality score: "government_registered" counts once (+30),            │
│       "multiple_sources" bonus adds (+15)                                  │
│                                                                             │
│  5. STATE COOPERATIVE WEBSITES DOWN OR RESTRUCTURED                        │
│     ──────────────────────────────────────────────                         │
│     • State government websites have variable uptime                       │
│     • Scraper health check before each run                                 │
│     • If unreachable: skip, log, continue with other sources               │
│     • Maintain last-known-good data from previous successful scrapes       │
│                                                                             │
│  6. SAME COMPANY LISTED AS BOTH BUYER AND SELLER                          │
│     ──────────────────────────────────────────────                         │
│     • Completely valid — trading companies both buy and sell               │
│     • buyer_contacts and seller_contacts are separate tables               │
│     • No cross-table deduplication (intentional)                           │
│     • Admin can see both roles if they search by company name              │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Shared Infrastructure

### 6.1 Base Scraper Pattern

All contact scrapers (buyer and seller) inherit from a common abstract base class that enforces consistent behavior.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     BASE CONTACT SCRAPER                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  from abc import ABC, abstractmethod                                 │  │
│  │  from typing import List, Optional                                   │  │
│  │  import asyncio                                                      │  │
│  │  import time                                                         │  │
│  │  import logging                                                      │  │
│  │                                                                      │  │
│  │  class BaseContactScraper(ABC):                                      │  │
│  │      """                                                             │  │
│  │      Abstract base class for all contact discovery scrapers.        │  │
│  │      Enforces: rate limiting, error handling, health checks.        │  │
│  │      """                                                             │  │
│  │                                                                      │  │
│  │      source_name: str          # e.g., "tradekey", "apeda"          │  │
│  │      source_url: str           # base URL                           │  │
│  │      source_priority: int      # 1=govt, 2=assoc, 3=b2b            │  │
│  │      rate_limit_seconds: float # min delay between requests         │  │
│  │      max_pages: int = 10       # pagination cap                     │  │
│  │                                                                      │  │
│  │      def __init__(self):                                             │  │
│  │          self.logger = logging.getLogger(                            │  │
│  │              f"scraper.{self.source_name}"                           │  │
│  │          )                                                           │  │
│  │          self.rate_limiter = RateLimiter(                            │  │
│  │              self.source_name, self.rate_limit_seconds               │  │
│  │          )                                                           │  │
│  │          self.session = None                                         │  │
│  │          self.is_healthy = True                                      │  │
│  │                                                                      │  │
│  │      async def execute(self, commodity, job_id: str)                 │  │
│  │          -> ScraperResult:                                           │  │
│  │          """Main entry point. Calls fetch, parse, validate."""       │  │
│  │          try:                                                        │  │
│  │              # Health check                                          │  │
│  │              if not await self.health_check():                       │  │
│  │                  return ScraperResult(                                │  │
│  │                      source=self.source_name,                        │  │
│  │                      status="degraded",                              │  │
│  │                      contacts=[],                                    │  │
│  │                      error="Health check failed",                    │  │
│  │                  )                                                   │  │
│  │                                                                      │  │
│  │              raw_pages = await self.fetch_raw(commodity)             │  │
│  │              contacts = []                                           │  │
│  │              errors = []                                             │  │
│  │                                                                      │  │
│  │              for page in raw_pages:                                  │  │
│  │                  try:                                                │  │
│  │                      parsed = self.parse(page)                      │  │
│  │                      valid = [c for c in parsed                     │  │
│  │                               if self.validate(c)]                  │  │
│  │                      contacts.extend(valid)                         │  │
│  │                  except Exception as e:                              │  │
│  │                      errors.append(str(e))                          │  │
│  │                      self.logger.warning(                            │  │
│  │                          f"Parse error on {page.url}: {e}"          │  │
│  │                      )                                              │  │
│  │                                                                      │  │
│  │              return ScraperResult(                                   │  │
│  │                  source=self.source_name,                            │  │
│  │                  status="completed" if not errors                    │  │
│  │                         else "partial_failure",                      │  │
│  │                  contacts=contacts,                                  │  │
│  │                  errors=errors,                                      │  │
│  │              )                                                       │  │
│  │          except Exception as e:                                      │  │
│  │              return ScraperResult(                                   │  │
│  │                  source=self.source_name,                            │  │
│  │                  status="failed",                                    │  │
│  │                  contacts=[],                                        │  │
│  │                  error=str(e),                                       │  │
│  │              )                                                       │  │
│  │                                                                      │  │
│  │      @abstractmethod                                                 │  │
│  │      async def fetch_raw(self, commodity) -> List[RawPage]:         │  │
│  │          """Fetch raw HTML/data pages from source."""                │  │
│  │          ...                                                         │  │
│  │                                                                      │  │
│  │      @abstractmethod                                                 │  │
│  │      def parse(self, raw_page: RawPage) -> List[RawContact]:        │  │
│  │          """Parse raw page into contact records."""                  │  │
│  │          ...                                                         │  │
│  │                                                                      │  │
│  │      @abstractmethod                                                 │  │
│  │      def validate(self, contact: RawContact) -> bool:               │  │
│  │          """Validate required fields are present."""                 │  │
│  │          ...                                                         │  │
│  │                                                                      │  │
│  │      async def health_check(self) -> bool:                          │  │
│  │          """Verify source is reachable and parseable."""             │  │
│  │          try:                                                        │  │
│  │              resp = await self.session.get(                          │  │
│  │                  self.source_url, timeout=10                         │  │
│  │              )                                                       │  │
│  │              self.is_healthy = resp.status_code == 200               │  │
│  │              return self.is_healthy                                  │  │
│  │          except Exception:                                           │  │
│  │              self.is_healthy = False                                 │  │
│  │              return False                                            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Rate Limiting Strategy

| Source | Rate Limit | Max Pages | Notes |
|--------|-----------|-----------|-------|
| APEDA Exporters | 1 req / 5 sec | 10 | Government site — conservative |
| DGFT IEC | 1 req / 5 sec | 10 | Selenium required; CAPTCHA risk |
| Spice Board | 1 req / 5 sec | 10 | Government site — conservative |
| NAFED | 1 req / 5 sec | 10 | Government-adjacent |
| State Cooperatives | 1 req / 5 sec | 5 | Often slow servers |
| Industry Associations | 1 req / 5 sec | 5 | Small sites |
| TradeKey | 1 req / 3 sec | 10 | B2B marketplace |
| IndiaMART | 1 req / 3 sec | 10 | B2B marketplace |
| Alibaba | 1 req / 5 sec | 10 | Aggressive anti-bot; conservative |
| ExportersIndia | 1 req / 3 sec | 10 | B2B directory |
| Company Websites | 1 req / 5 sec | 3 | Enrichment only |
| Reddit API | 60 req / min | N/A | OAuth API with rate headers |

### 6.3 Contact Name Resolution

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     CONTACT NAME RESOLUTION                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PURPOSE: Identify decision-makers vs. generic contacts                    │
│                                                                             │
│  ROLE DETECTION KEYWORDS                                                   │
│  ────────────────────────                                                  │
│                                                                             │
│  Buyer-side roles (high value):                                            │
│  • "procurement", "purchasing", "sourcing", "supply chain"                 │
│  • "import manager", "buyer", "category manager"                           │
│  • "head of procurement", "CPO", "chief procurement"                       │
│                                                                             │
│  Seller-side roles (high value):                                           │
│  • "export manager", "export director", "international sales"              │
│  • "business development", "trade manager"                                 │
│  • "MD", "CEO", "director" (small companies = decision maker)              │
│                                                                             │
│  Generic roles (lower value — not penalized, just not bonus):              │
│  • "info", "admin", "support", "customer service"                          │
│  • "webmaster", "marketing"                                                │
│                                                                             │
│  IMPLEMENTATION                                                            │
│  ──────────────                                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  DECISION_MAKER_KEYWORDS = {                                         │  │
│  │      "procurement", "purchasing", "sourcing", "supply chain",       │  │
│  │      "import", "export", "trade", "business development",           │  │
│  │      "director", "manager", "head", "chief", "CEO", "MD",          │  │
│  │      "international sales", "category manager", "buyer",            │  │
│  │  }                                                                   │  │
│  │                                                                      │  │
│  │  def classify_contact_role(title: Optional[str]) -> str:            │  │
│  │      """Returns: 'decision_maker', 'relevant', or 'generic'."""     │  │
│  │      if not title:                                                   │  │
│  │          return "generic"                                            │  │
│  │      title_lower = title.lower()                                    │  │
│  │      matches = [kw for kw in DECISION_MAKER_KEYWORDS                │  │
│  │                 if kw in title_lower]                                │  │
│  │      if len(matches) >= 2:                                          │  │
│  │          return "decision_maker"                                     │  │
│  │      elif len(matches) >= 1:                                        │  │
│  │          return "relevant"                                           │  │
│  │      return "generic"                                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  NOTE: Role classification is stored as metadata but does NOT affect       │
│  quality score in Phase 1. It will be used in Stage 5 (Outreach) to       │
│  personalize messaging. Future scoring versions may add bonus points.     │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Email Validation

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     EMAIL VALIDATION PIPELINE                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Three-stage validation, each stage progressively more expensive:          │
│                                                                             │
│  STAGE A: FORMAT VALIDATION (Instant, all contacts)                        │
│  ──────────────────────────────────────────────────                        │
│                                                                             │
│  Regex: ^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$              │
│                                                                             │
│  Reject if:                                                                │
│  • Fails regex                                                             │
│  • Domain is in REJECT_DOMAINS list (marketplace domains, disposable)     │
│  • Local part is generic: "info@", "noreply@", "admin@", "test@"          │
│                                                                             │
│  STAGE B: MX RECORD LOOKUP (Async, outreach-ready contacts only)          │
│  ────────────────────────────────────────────────────────────              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  import dns.resolver                                                 │  │
│  │                                                                      │  │
│  │  async def check_mx_record(email: str) -> bool:                     │  │
│  │      """Check if email domain has valid MX records."""               │  │
│  │      domain = email.split("@")[1]                                    │  │
│  │      try:                                                            │  │
│  │          records = dns.resolver.resolve(domain, "MX")               │  │
│  │          return len(records) > 0                                    │  │
│  │      except (dns.resolver.NoAnswer,                                 │  │
│  │              dns.resolver.NXDOMAIN,                                  │  │
│  │              dns.resolver.NoNameservers):                            │  │
│  │          return False                                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  MX lookup is batched and cached:                                          │
│  • Cache MX results per domain for 24 hours                               │
│  • Most contacts from same marketplace share domains                      │
│  • ~50 unique domains per commodity run (estimated)                       │
│                                                                             │
│  STAGE C: BOUNCE DETECTION (Future — Phase 2+)                             │
│  ─────────────────────────────────────────────                             │
│                                                                             │
│  When Stage 5 (Outreach) sends emails:                                     │
│  • Track bounces per email address                                         │
│  • After 2 hard bounces: mark email_verified = false                       │
│  • Feed back into quality score recalculation                              │
│  • NOT implemented in this PRD — documented for architecture awareness     │
│                                                                             │
│  REJECT_DOMAINS LIST (maintained in config)                                │
│  ───────────────────────────────────────────                               │
│                                                                             │
│  Marketplace domains: tradekey.com, indiamart.com, alibaba.com,            │
│    exportersindia.com                                                      │
│  Disposable: mailinator.com, guerrillamail.com, tempmail.com, etc.         │
│  Generic: example.com, test.com                                            │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Commodity-to-HS-Code Mapping

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     COMMODITY TO HS CODE MAPPING                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Reuses Stage 1 approved_commodities data. No separate mapping needed.     │
│                                                                             │
│  LOOKUP CHAIN                                                              │
│  ────────────                                                              │
│                                                                             │
│  1. approved_commodities.hs_code → 8-digit exact match                    │
│  2. If government DB returns no results → fallback to 6-digit (subheading)│
│  3. If still no results → fallback to 4-digit (heading)                   │
│  4. If still no results → fallback to 2-digit (chapter)                   │
│  5. Log the fallback level used for each search                            │
│                                                                             │
│  COMMODITY SEARCH PROFILE                                                  │
│  ────────────────────────                                                  │
│                                                                             │
│  On first discovery trigger for a commodity, create a search profile:      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  commodity_search_profiles table:                                    │  │
│  │                                                                      │  │
│  │  commodity_id     UUID FK → approved_commodities                    │  │
│  │  query_variations TEXT[]    -- generated search terms                 │  │
│  │  category_tags    TEXT[]    -- marketplace category mappings         │  │
│  │  target_countries TEXT[]    -- from Stage 1 destination data         │  │
│  │  hs_code_fallbacks TEXT[]  -- [8-digit, 6-digit, 4-digit, 2-digit] │  │
│  │  created_at       TIMESTAMPTZ                                        │  │
│  │  updated_at       TIMESTAMPTZ                                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Admins can edit search profiles to improve query quality.                 │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Compliance & Privacy

### 7.1 Data Collection Rules

| Rule | Implementation |
|------|----------------|
| **Public data only** | Never scrape pages requiring login or authentication |
| **robots.txt compliance** | Check robots.txt before first request to any domain; obey Disallow directives |
| **ToS awareness** | Document each source's Terms of Service; flag sources where scraping is explicitly prohibited |
| **No credential stuffing** | Never attempt to bypass CAPTCHAs automatically; alert admin for manual resolution |
| **Rate limit respect** | Honor HTTP 429 responses with exponential backoff |
| **Source attribution** | Every contact record links to its source URL via contact_sources table |

### 7.2 India DPDP Act (Digital Personal Data Protection) Considerations

| Consideration | Implementation |
|---------------|----------------|
| **Lawful purpose** | B2B contact discovery for trade partnership — legitimate business interest |
| **Data minimization** | Collect only: name, email, phone, company, location. No personal identifiers beyond business contact |
| **Storage limitation** | Active contacts retained 2 years from last_seen_at; archived contacts deleted after 2 years |
| **Right to access** | If a contact requests their data, admin can export their record via contact detail API |
| **Right to correction** | Contacts can request corrections; admin updates via PATCH endpoint |
| **Right to erasure** | Contacts can request deletion; admin archives with reason "erasure_requested" and data is purged from active tables within 30 days |

### 7.3 CAN-SPAM Compliance for B2B Contact Usage

| Requirement | Implementation |
|-------------|----------------|
| **No spam** | Contacts are NOT emailed from this module. Outreach is Stage 5's responsibility |
| **Opt-out tracking** | `contact_opt_outs` table tracks contacts who request no further contact |
| **B2B exemption** | CAN-SPAM applies more loosely to B2B; however, we treat all contacts with B2C-level care |
| **Unsubscribe mechanism** | Stage 5 (Outreach) must include unsubscribe; this module tracks opt-out status |

### 7.4 Contact Retention Policy

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     CONTACT RETENTION POLICY                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ACTIVE CONTACTS (is_archived = false)                                     │
│  • Retained for 2 years from last_seen_at                                  │
│  • Re-discovered contacts reset the 2-year clock                          │
│  • After 2 years without re-discovery: auto-archive                       │
│                                                                             │
│  ARCHIVED CONTACTS (is_archived = true)                                    │
│  • Retained for 2 additional years in archived state                      │
│  • After 2 years in archive: hard delete (data purge)                     │
│  • Exception: contacts with active outreach history preserved longer      │
│                                                                             │
│  OPT-OUT CONTACTS                                                          │
│  • Contact data purged within 30 days of opt-out request                  │
│  • Opt-out record (email hash only) retained permanently to prevent       │
│    re-scraping the same contact                                            │
│                                                                             │
│  CRON: retention_cleanup runs monthly at 06:00 UTC                        │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 7.5 Opt-Out Tracking

```sql
-- Opt-out tracking table
CREATE TABLE contact_opt_outs (
    opt_out_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_hash      VARCHAR(64) NOT NULL,       -- SHA-256 of lowercase email
    contact_type    VARCHAR(10),                 -- 'buyer', 'seller', or NULL (both)
    reason          VARCHAR(200),
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    purged_at       TIMESTAMPTZ                  -- when contact data was deleted
);

CREATE UNIQUE INDEX idx_opt_out_email ON contact_opt_outs(email_hash);
```

Before any outreach or re-scrape, check `contact_opt_outs` by hashing the candidate email. If match found, skip.

### 7.6 GDPR Considerations for EU-Based Contacts

| Consideration | Implementation |
|---------------|----------------|
| **Legitimate interest** | B2B trade partnership outreach qualifies under Art. 6(1)(f) for business contacts |
| **Proportionality** | Only business emails/phones collected; no personal social profiles |
| **Right to object** | Opt-out mechanism (Section 7.5) satisfies Art. 21 |
| **Data portability** | Export endpoint provides contact's full record in JSON/CSV |
| **Cross-border transfers** | All data stored in same region as AI_NEW PostgreSQL (document hosting region) |
| **DPO notification** | If >5000 EU contacts accumulated, flag for legal review |

---

## 8. Admin UI

Admin manages contacts via the **Contacts** section of the Niche Commodity Finder admin portal. The contact discovery UI is part of the broader admin interface. For full wireframes, layout specifications, component details, and interaction flows, see [[NICHE_COMMODITY_FINDER_UI_SPEC]].

### Key Admin Pages

| Page | Purpose |
|------|---------|
| **Buyers Tab** | List discovered buyers, filter by commodity/quality/country, trigger discovery |
| **Sellers Tab** | List discovered sellers, filter by commodity/quality/verification, trigger discovery |
| **Quality Filters** | Filter contacts by quality classification (HIGH/MEDIUM/LOW/INSUFFICIENT) |
| **Export** | Export filtered contact lists to CSV for offline use |
| **Verification Actions** | View seller verification sources, mark contacts as verified/archived |
| **Job Logs** | View discovery job history, status, duration, errors per source |
| **Contact Detail** | Full contact profile with sources, requirements/capabilities, quality breakdown |

---

## 9. Scheduling & Automation

### 9.1 Cron Schedule

| Job | Schedule | Description | Timeout |
|-----|----------|-------------|---------|
| Buyer discovery (all active commodities) | Daily 02:00 UTC | Scrape B2B marketplaces for new buyer leads | 2 hours |
| Seller discovery (all active commodities) | Daily 04:00 UTC | Scrape government DBs, associations, marketplaces | 2 hours |
| Email MX validation (new contacts) | Daily 06:00 UTC | Validate MX records for contacts discovered in last 24h | 30 min |
| Contact retention cleanup | Monthly 1st, 06:00 UTC | Archive/purge contacts per retention policy | 1 hour |
| Scraper health check | Daily 01:00 UTC | Verify all source URLs are reachable | 10 min |

### 9.2 Manual Trigger Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/niche/buyers/discover` | Trigger buyer discovery for a specific commodity |
| `POST` | `/admin/niche/sellers/discover` | Trigger seller discovery for a specific commodity |
| `POST` | `/admin/niche/contacts/discover-all` | Trigger both buyer + seller for ALL active commodities |

### 9.3 Job Monitoring

Job progress and history visible in the **Job Logs** page of the admin portal. Each job tracks:
- Start time, end time, duration
- Per-source status (completed / partial_failure / failed / degraded)
- Contacts found, new, merged counts
- Error summary with source attribution

---

## 10. Folder Structure & Implementation Phases

### 10.1 AI_NEW Folder Structure

```
AI_NEW/server/niche/contacts/
├── __init__.py
├── buyer_discovery.py            # Buyer discovery orchestrator
├── seller_discovery.py           # Seller discovery orchestrator
├── quality_scorer.py             # Shared scoring logic (buyer + seller)
├── deduplicator.py               # Deduplication logic
├── scrapers/
│   ├── __init__.py
│   ├── base.py                   # BaseContactScraper abstract class
│   ├── tradekey_buyer.py         # TradeKey buyer RFQ scraper
│   ├── tradekey_supplier.py      # TradeKey supplier profile scraper
│   ├── indiamart_buyer.py        # IndiaMART buying leads scraper
│   ├── indiamart_seller.py       # IndiaMART seller profile scraper
│   ├── alibaba_buyer.py          # Alibaba RFQ scraper
│   ├── alibaba_supplier.py       # Alibaba supplier scraper
│   ├── exportersindia.py         # ExportersIndia buyer directory scraper
│   ├── apeda_exporters.py        # APEDA registered exporter scraper
│   ├── dgft_iec.py               # DGFT IEC holder scraper
│   ├── spice_board_exporters.py  # Spice Board exporter scraper
│   ├── nafed.py                  # NAFED member directory scraper
│   ├── state_cooperatives.py     # State marketing federation scraper
│   └── association.py            # Industry association directory scraper
├── extractors/
│   ├── __init__.py
│   ├── email_extractor.py        # Email regex extraction + validation
│   ├── phone_extractor.py        # Phone regex extraction + normalization
│   └── company_normalizer.py     # Company name normalization for dedup
├── models/
│   ├── __init__.py
│   ├── buyer_models.py           # Pydantic models: RawBuyerContact, BuyerQualityScore
│   ├── seller_models.py          # Pydantic models: RawSellerContact, SellerQualityScore
│   ├── job_models.py             # Pydantic models: ScrapeJob, ScraperResult
│   └── search_models.py          # Pydantic models: SearchTask, SearchProfile
└── routes/
    ├── __init__.py
    ├── buyer_routes.py           # FastAPI router for buyer endpoints
    └── seller_routes.py          # FastAPI router for seller endpoints
```

### 10.2 NestJS Backend Module Structure

```
backend/src/admin/niche/
├── niche.module.ts               # NestJS module definition
├── contacts/
│   ├── contacts.controller.ts    # REST endpoints proxying to AI_NEW
│   ├── contacts.service.ts       # Business logic, auth, validation
│   └── dto/
│       ├── trigger-discovery.dto.ts
│       ├── export-contacts.dto.ts
│       └── archive-contact.dto.ts
```

### 10.3 Implementation Phases

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     IMPLEMENTATION PHASES                                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: FOUNDATION (Week 1-2)                                           │
│  ─────────────────────────────                                             │
│  • BaseContactScraper abstract class                                       │
│  • RateLimiter and health check infrastructure                             │
│  • Database migrations (all tables in Sections 4.7, 5.8, 6.5, 7.5)       │
│  • Pydantic models                                                         │
│  • Email/phone extractors                                                  │
│  • Company name normalizer                                                 │
│  • Deduplication logic                                                     │
│  • Quality scorer (both buyer and seller)                                  │
│  • FastAPI route stubs                                                     │
│  • NestJS proxy module                                                     │
│                                                                             │
│  PHASE 2: BUYER PIPELINE (Week 3-4)                                       │
│  ──────────────────────────────────                                        │
│  • TradeKey buyer scraper                                                  │
│  • IndiaMART buyer scraper                                                 │
│  • Alibaba buyer scraper                                                   │
│  • ExportersIndia buyer scraper                                            │
│  • Buyer discovery orchestrator                                            │
│  • Search generation logic                                                 │
│  • Integration tests with mock HTML fixtures                               │
│  • Manual trigger endpoint working end-to-end                              │
│                                                                             │
│  PHASE 3: SELLER PIPELINE (Week 5-6)                                      │
│  ────────────────────────────────────                                      │
│  • APEDA exporter scraper                                                  │
│  • DGFT IEC scraper (Selenium)                                             │
│  • Spice Board exporter scraper                                            │
│  • NAFED member scraper                                                    │
│  • B2B supplier scrapers (TradeKey, IndiaMART, Alibaba)                   │
│  • Seller discovery orchestrator (priority-based execution)                │
│  • Cross-reference enrichment logic                                        │
│  • Seller verification tracking                                            │
│  • Integration tests                                                       │
│                                                                             │
│  PHASE 4: ADMIN UI & AUTOMATION (Week 7-8)                                │
│  ──────────────────────────────────────────                                │
│  • Admin portal Buyers tab                                                 │
│  • Admin portal Sellers tab                                                │
│  • CSV export                                                              │
│  • Quality filter UI                                                       │
│  • Job logs page                                                           │
│  • Contact detail modal                                                    │
│  • Cron scheduling (daily buyer + seller discovery)                        │
│  • MX validation cron                                                      │
│  • Retention cleanup cron                                                  │
│  • Scraper health check cron                                               │
│  • End-to-end testing with real sources (sandboxed)                        │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Success Criteria & Risks

### 11.1 Functional Criteria

| Criterion | Measurement |
|-----------|-------------|
| Reliable daily scrapes | >90% of scheduled jobs complete without failure |
| Parse success rate | >80% of scraped pages yield at least 1 valid contact |
| Quality scoring functional | 100% of contacts receive a quality score |
| Deduplication accuracy | <5% duplicate contacts in output (spot-check monthly) |
| Government DB coverage | >3 government sources producing results for relevant commodities |
| Source traceability | 100% of contacts linkable to source URL |

### 11.2 Performance Criteria

| Criterion | Target |
|-----------|--------|
| Full buyer scrape (all commodities) | <2 hours |
| Full seller scrape (all commodities) | <2 hours |
| Deduplication pass | <10 minutes per commodity |
| MX validation batch | <30 minutes for daily new contacts |
| CSV export | <30 seconds for up to 10,000 contacts |

### 11.3 Risk Table

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     RISKS & MITIGATIONS                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┬──────────┬───────────────────────────────────┐  │
│  │ Risk                 │ Impact   │ Mitigation                        │  │
│  ├──────────────────────┼──────────┼───────────────────────────────────┤  │
│  │ B2B site structure   │ High     │ Per-source health checks before   │  │
│  │ changes break        │          │ each run; CSS selector versioning │  │
│  │ scrapers             │          │ in config (not hardcoded);        │  │
│  │                      │          │ admin alerts on parse failure     │  │
│  ├──────────────────────┼──────────┼───────────────────────────────────┤  │
│  │ CAPTCHA blocking on  │ High     │ Conservative rate limits; detect  │  │
│  │ government sites     │          │ and pause immediately; manual     │  │
│  │                      │          │ resolution path; proceed with     │  │
│  │                      │          │ other sources                     │  │
│  ├──────────────────────┼──────────┼───────────────────────────────────┤  │
│  │ Low data quality     │ Medium   │ Quality scoring gates outreach;   │  │
│  │ (wrong emails, stale │          │ MX record validation; recency     │  │
│  │ listings)            │          │ penalties in scoring; admin       │  │
│  │                      │          │ review before outreach            │  │
│  ├──────────────────────┼──────────┼───────────────────────────────────┤  │
│  │ Compliance risk      │ High     │ Public data only; robots.txt      │  │
│  │ (scraping ToS,       │          │ compliance; DPDP/GDPR-aware      │  │
│  │ privacy laws)        │          │ retention; opt-out tracking;      │  │
│  │                      │          │ legal review for EU contacts      │  │
│  ├──────────────────────┼──────────┼───────────────────────────────────┤  │
│  │ IP blocking by       │ Medium   │ Rate limiting; user-agent         │  │
│  │ target sites         │          │ rotation; exponential backoff;    │  │
│  │                      │          │ proxy rotation (Phase 2+)         │  │
│  ├──────────────────────┼──────────┼───────────────────────────────────┤  │
│  │ Government DB        │ Low      │ Partial run support; fallback     │  │
│  │ downtime             │          │ to cached data; retry on next     │  │
│  │                      │          │ scheduled run                     │  │
│  ├──────────────────────┼──────────┼───────────────────────────────────┤  │
│  │ Commodity with zero  │ Low      │ Job completes successfully with   │  │
│  │ discoverable         │          │ 0 contacts; admin notified;       │  │
│  │ contacts             │          │ search profile review suggested   │  │
│  └──────────────────────┴──────────┴───────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 2026 | BREYUS Team | Initial PRD combining Stage 2 (Buyer Discovery) and Stage 3 (Seller Discovery) with full specifications |

---

*This PRD defines the Contact Discovery module (Stages 2 and 3) of the Breyus Niche Commodity Finder AI. For the complete system architecture covering all stages, see [[NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE]]. For Stage 1 (Government Data Extraction), see [[PRD_1_Government_Data_Extraction]]. For Stage 4 (Market Intelligence), see [[PRD_4_Market_Intelligence]]. For admin UI wireframes, see [[NICHE_COMMODITY_FINDER_UI_SPEC]].*

## Related
- [[PRD_1_Government_Data_Extraction]]
- [[PRD_4_Market_Intelligence]]
- [[NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE]]
- [[NICHE_COMMODITY_FINDER_PRD]]
- [[NICHE_COMMODITY_FINDER_UI_SPEC]]
- [[MOC-AI]]
