---
type: prd
module: ai
tags: [ai, prd, niche-commodity]
---

# BREYUS Niche Commodity Finder AI - Product Requirements Document

> **Document Type:** Product Requirements Document (PRD)
> **Version:** 2.0
> **Last Updated:** February 2026
> **Status:** Vision Document with Implementation Notes

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Stage 1: Discover Niche Commodities](#3-stage-1-discover-niche-commodities)
4. [Stage 2: Find Buyers & Sellers](#4-stage-2-find-buyers--sellers)
5. [Stage 3: Onboard Traders](#5-stage-3-onboard-traders)
6. [Stage 4: Retention & Intelligence Loop](#6-stage-4-retention--intelligence-loop)
7. [Data Sources & Collection](#7-data-sources--collection)
8. [Monthly Intelligence Predictions](#8-monthly-intelligence-predictions)
9. [Go-to-Market Strategy](#9-go-to-market-strategy)
10. [Success Metrics](#10-success-metrics)
11. [Risks & Assumptions](#11-risks--assumptions)

---

## 1. Executive Summary

### 1.1 Product Vision

The **BREYUS Niche Commodity Finder AI** is an intelligent system designed to discover underserved niche commodities, identify buyers and sellers in these markets, automate trader acquisition, and retain users through continuous market intelligence delivery.

### 1.2 Core Value Proposition

- **Discovery:** Automatically find emerging niche commodities that mainstream platforms miss
- **Connection:** Match buyers with sellers in specialized commodity markets
- **Intelligence:** Provide monthly predictions that users cannot get elsewhere
- **Retention:** Create permanent user dependency through continuously updated, high-value market insights

### 1.3 Implementation Approach

| Aspect | Phase 1 (Initial) | Future Phases |
|--------|-------------------|---------------|
| **Data Collection** | B2B marketplaces, Government portals, RSS/News | LinkedIn via data providers, expanded sources |
| **AI Analysis** | LLM-powered analysis (Claude/GPT) | Custom ML models as data grows |
| **Outreach** | Email-based acquisition | WhatsApp, LinkedIn, SMS expansion |
| **Development** | Founder-built, bootstrap | Scale team as traction proves |

### 1.4 High-Level Process Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BREYUS NICHE COMMODITY FINDER AI                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   STAGE 1: Discover NEW niche commodities (Internet scraping)                │
│       ↓                                                                      │
│   OUTPUT: Excel sheet with ALL NICHE COMMODITIES/Month                       │
│           + SPECIFIC MARKET SEGMENT                                          │
│           + USAGE and application of this commodity                          │
│                                                                              │
│       ↓                                                                      │
│   STAGE 2: Find who's BUYING & SELLING (Demand/Supply analysis)              │
│       ↓                                                                      │
│   OUTPUT: Excel sheet with:                                                  │
│           - NICHE COMMODITY NAME                                             │
│           - BUYERS COMPANY of this commodity                                 │
│           - Buyer Company's People name and contact details                  │
│             (phone, email, LinkedIn)                                         │
│                                                                              │
│       ↓                                                                      │
│   STAGE 3: Onboard traders (Automated acquisition)                           │
│       ↓                                                                      │
│   OUTPUT: Excel sheet with:                                                  │
│           - NICHE COMMODITY NAME                                             │
│           - SELLER COMPANY of this commodity                                 │
│           - Seller Company's People name and contact details                 │
│             (phone, email, LinkedIn)                                         │
│                                                                              │
│       ↓                                                                      │
│   STAGE 4: Retain permanently (Monthly intelligence loop)                    │
│       ↓                                                                      │
│   OUTPUT: None (Continuous engagement through dashboard + reports)           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Overview

### 2.1 Process Summary Table

| Stage | Task | Data Source | Method | Output | Frequency |
|-------|------|-------------|--------|--------|-----------|
| 1. Discover | Find niche commodities | APEDA, Reddit, LinkedIn, News | Web scraping + AI analysis | List of 50+ niche commodities | Weekly |
| 2. Demand | Find BUYERS | LinkedIn, TradeKey, Company websites | Selenium scraping + regex | 1000+ buyer emails | Weekly |
| 3. Supply | Find SELLERS | TradeKey, Cooperatives, LinkedIn | Web scraping | 500+ seller emails | Weekly |
| 4. Onboard | Send outreach | Email + WhatsApp + LinkedIn + SMS | Automated templates | Signup conversion: 10-15% | Weekly |
| 5. Retain | Send intelligence | Generated reports | AI predictions | Monthly reports to 1000s | Monthly |

> **Phase 1 Note:** Initial implementation focuses on B2B marketplaces (TradeKey, IndiaMART, Alibaba) and government data. LinkedIn data will be sourced via third-party providers (Apollo.io, ZoomInfo) in future phases. Email is the primary outreach channel initially.

### 2.2 End-to-End Flow Summary

```
Run niche commodity finder
    ↓
Outputs: Coffee leaf, Saffron, Turmeric (50+ commodities)

Run buyer finder
    ↓
Outputs: 1000+ pharma/food procurement managers with emails

Run seller finder
    ↓
Outputs: 500+ exporters + cooperatives with emails

Send personalized emails + WhatsApp
    ↓
Outputs: 100 signups (10% conversion)

END OF MONTH: Generate November predictions
    ↓
"Saffron prices drop 20%, coffee leaf shortage coming"

NICHE Traders Stay inside BREYUS 100% because of VALUE they never got

Repeat cycle
```

---

## 3. Stage 1: Discover Niche Commodities

### 3.1 Overview

The discovery stage involves systematic web scraping and AI-powered analysis to identify niche commodities that are underserved in the market.

### 3.2 Data Sources & Extraction Methods

#### 3.2.1 Government Export Data

| Source | What to Find | What to Scrape | Method |
|--------|--------------|----------------|--------|
| **APEDA.gov.in** | Agricultural Products Export Data | Public reports on what India exports, Commodity categories + annual volume | CSV exports, PDF reports |
| **Commerce Ministry Reports** | Monthly commodity trade reports | Trade volumes, commodity trends | Report downloads |
| **DGFT Database** (Directorate General of Foreign Trade) | HS codes + commodity classifications, Export data by sector | HS code mappings, sector data | Website scraping |
| **Directorate of Spices** | Spice production data, Market trends | Production volumes, pricing | Report extraction |

**How to Scrape Government Data:**
```
├─ Use Python requests + BeautifulSoup
├─ Target: Tables with commodity names + volumes
├─ Extract: Commodity name, HS code, annual export value
└─ Schedule: Weekly updates
```

> **Phase 1 Note:** Government data scraping will be built incrementally. Initial approach may involve manual downloads while automated scrapers are developed and tested.

#### 3.2.2 Industry Forums & Communities

| Source | What to Find | Search Terms | What to Extract |
|--------|--------------|--------------|-----------------|
| **Reddit** | r/commodities, r/agriculture, r/pharma, r/chemicals | "New material", "emerging commodity", "supply shortage" | Post titles, descriptions, comments |
| **LinkedIn** | Industry groups (Commodity traders, spice exporters, pharma suppliers) | Posts mentioning new commodities | Post content, engagement |
| **TradeKey.com** | B2B marketplace | Suppliers listing new products | Product listings, descriptions |
| **Alibaba.com** | Supplier listings | New products in each category | Product data, supplier info |
| **Industry Blogs** | Food industry blogs, Pharma blogs, Sustainability blogs | Articles mentioning emerging materials | Article content, trends |

**How to Scrape Forums & Communities:**
```
├─ Use Selenium for dynamic content
├─ Keywords: "new", "emerging", "shortage", "supply", "innovative"
├─ Extract: Product name, company, description, comments
└─ Schedule: Daily
```

> **Phase 1 Note:** Reddit API ($0.24 per 1000 calls) + RSS feeds for news. LinkedIn group monitoring via manual review initially; automation in future phases.

#### 3.2.3 News & Market Data

| Source | What to Find | What to Extract |
|--------|--------------|-----------------|
| **Google News** (free, no API needed) | Search: "commodity shortage", "new material discovery" | News articles mentioning commodities |
| **FoodNavigator.com** | Food ingredients news | Industry trends, new materials |
| **CosmeticsDesign.com** | Cosmetic materials | Beauty industry trends |
| **Pharma Journal** | Pharmaceutical ingredients | Pharma ingredient trends |
| **Company Press Releases** | LinkedIn posts about new products/partnerships | Partnership announcements, new product launches |

**How to Scrape News & Market Data:**
```
├─ RSS feeds (many sites offer free feeds)
├─ Google News scraping (via RSS)
├─ Keywords: "supply", "demand", "shortage", "emerging"
└─ Schedule: Daily
```

### 3.3 Complete Discovery Process Table

| Step | Data Source | How to Get Data | What to Extract | Frequency | Output |
|------|-------------|-----------------|-----------------|-----------|--------|
| 1 | APEDA.gov.in | Visit website + download reports | Commodity name, export volume, HS code | Weekly | List of 100+ exported commodities |
| 2 | DGFT Database | Visit dgft.gov.in, search HS codes | Commodity classification, trade data | Weekly | HS code mapping (1000+ items) |
| 3 | Reddit (r/commodities, r/pharma) | Search: "emerging", "new", "shortage" | Comments mentioning new materials | Daily | 50+ emerging commodities |
| 4 | LinkedIn Groups | Join: Commodity traders, spice exporters | Posts about supply issues, innovations | Daily | Trending commodities (30+) |
| 5 | TradeKey.com | Browse supplier listings | New products added, supplier feedback | Daily | Newly listed commodities (20+) |
| 6 | Alibaba.com | Search categories, filter by date | New supplier entries | Daily | New supplier products (50+) |
| 7 | Industry News | Google News search: "commodity shortage" | Articles mentioning emerging materials | Daily | News-driven commodities (10+) |

### 3.4 AI Filtering Rules

The AI filter applies **3 rules** to determine if a commodity qualifies as "niche":

| Rule | Criteria | Rationale |
|------|----------|-----------|
| **Rule 1** | Export volume < 100K tons | Small market (underserved) |
| **Rule 2** | Price volatility > 20% | High price movement (predictions matter) |
| **Rule 3** | New use cases in last 3 months | Emerging applications (trending) |

**Output:** Final list of **50+ NICHE commodities** (Weekly)

---

## 4. Stage 2: Find Buyers & Sellers

### 4.1 Stage 2A: Find BUYERS (Demand Analysis)

#### 4.1.1 Channel Strategy

| Channel | Where to Find | Search Terms | What to Extract | Volume | Data Quality |
|---------|---------------|--------------|-----------------|--------|--------------|
| **LinkedIn** | LinkedIn.com | "Procurement Manager" + commodity name, "Supply Chain Manager" | Name, Company, Title, Profile URL, Email (if public), Contact info, Company size, industry | 500-1,000 | High (verified) |
| | | Filter: Companies in Pharma/Food/Cosmetics | | | |
| **B2B Directories** | TradeKey.com | Browse: Buyer offers + requests | Email, Company, Contact, Product needs | 300-500 | Medium (public listings) |
| | Exporters.com | Search by commodity type | Contact details, company profile | | |
| | IndiaTradeNet.com | Advanced search: Buyers by sector | Buyer information, preferences | | |
| **Company Websites** | Pharma/Food sites | Visit: Contact us, Sourcing pages | Procurement email, department email | 200-300 | High (official) |
| | | Scrape: procurement@, sourcing@ | Contact info from public pages | | |
| **Industry Events** | LinkedIn Events | Search: Food/Pharma/Commodity events | Attendees, speakers, companies | 100-200 | High (engaged audience) |
| | FICCI, CII event listings | Event attendees (often public) | | | |
| **Associations** | Spice Board India | Visit: Member lists | Company contacts, buyer associations | 50-100 | High (official) |
| | Pharma associations | Download member directories | Pharma company contacts | | |

**Total Buyers Found:** 1,000-2,000 (Mix of channels)

> **Phase 1 Note:** Initial focus on B2B directories (TradeKey, IndiaMART, ExportersIndia) where contact data is publicly available. LinkedIn data will be sourced via third-party providers (Apollo.io, ZoomInfo) as budget allows. Volume targets are aspirational; actual numbers depend on data availability from sources.

### 4.2 Stage 2B: Find SELLERS (Supply Analysis)

#### 4.2.1 Channel Strategy

| Channel | Where to Find | What to Search | Extract Info | Volume | Quality |
|---------|---------------|----------------|--------------|--------|---------|
| **Agricultural Cooperatives** | NAFED.gov.in | Browse: Member directory | Coop name, contact, email, products | 100-200 | High (official) |
| | State govt sites | Search: Coop members, exporters | Coop details, contact person | | |
| **Export Associations** | Spice Exporters Assoc | Visit: Member lists | Company name, contact, specialization | 200-300 | High (verified) |
| | Botanical suppliers assoc | Download directories | Exporter information | | |
| **B2B Marketplaces** | TradeKey.com | Search: Suppliers + commodity | Email, company, location, ratings | 300-500 | Medium (public) |
| | Alibaba.com | Search: Suppliers by country (India) | Contact, company, product range | | |
| **LinkedIn** | LinkedIn.com | "Export Manager" + commodity | Name, Company, Title, Profile | 200-300 | High (verified) |
| | | "Exporter" + industry | Contact info (if public) | | |
| **Government Data** | APEDA website | Download: Exporter database | Company name, registration, products | 100-150 | High (official) |
| | Spice Board | Browse: Registered exporters | Exporter info, certifications | | |
| **Company Websites** | Company homepages | Contact/About us pages | Procurement, export emails | 100-200 | High (official) |
| | | Scrape: export@, supply@ addresses | Company contact details | | |

**Total Sellers Found:** 800-1,500 (Mix of channels)

> **Phase 1 Note:** Primary sources are B2B marketplaces and government databases. Python scrapers will be built for TradeKey, IndiaMART, and Alibaba. LinkedIn expansion via data providers in future phases.

---

## 5. Stage 3: Onboard Traders

### 5.1 Multi-Phase Outreach Strategy

| Phase | Target Group | Message Template | Channel | Frequency | Expected Response |
|-------|--------------|------------------|---------|-----------|-------------------|
| **Phase 1: Email** | 500 Buyers (Pharma) | "Hi [Name], Found 5 saffron suppliers at ₹400/kg (market ₹500). Join free + get monthly forecasts. Save 20-30%." | Email | Day 1-7 | 5-10% click (25-50 people) |
| | 500 Sellers (Exporters) | "Hi [Name], 5 pharma companies buying your saffron THIS MONTH. List free on Breyus. 50+ buyers waiting." | Email | Day 1-7 | 5-10% click (25-50 people) |
| **Phase 2: WhatsApp** | 200 Pharma (from clicks) | "Hey! Saffron prices dropping 20% next month. Lock suppliers NOW on Breyus. Free join + monthly intel." | WhatsApp | Day 8-14 | 10-20% conversion (20-40 signups) |
| | 200 Exporters (from clicks) | "Hey! Pharma buyers need your saffron. List free on Breyus. Get orders + monthly market prices." | WhatsApp | Day 8-14 | 10-20% conversion (20-40 signups) |
| **Phase 3: LinkedIn** | 100 Not responded yet | Personalized message: "Saw your profile in [company]. We connect with 500+ suppliers/buyers in [niche]." | LinkedIn | Day 15-21 | 3-5% conversion (3-5 signups) |
| **Phase 4: Second Email** | 300 Not responded | Different angle: "Missed our offer? Limited spots for free access. Closes [date]." | Email | Day 22-30 | 2-3% click (6-9 signups) |

### 5.2 Conversion Expectations

| Metric | Target |
|--------|--------|
| Total Outreach | 1,000 contacts |
| Total Conversions | 50-150 signups |
| Conversion Rate | 5-15% |

> **Phase 1 Note:** Initial outreach focuses on email only via Gmail/basic SMTP. Gmail limits ~500 emails/day; scaling requires Google Workspace or dedicated email service (SendGrid, Mailgun). WhatsApp (via Business API or WATI), LinkedIn, and SMS channels expand in future phases as infrastructure and budget allow. Conversion targets are aspirational; actual rates will be validated through testing.

### 5.3 Infrastructure Roadmap

| Phase | Email | WhatsApp | LinkedIn | SMS |
|-------|-------|----------|----------|-----|
| **Phase 1** | Gmail/SMTP (primary) | - | - | - |
| **Phase 2** | Dedicated service (Mailgun/SendGrid) | WhatsApp Business API | Manual outreach | - |
| **Phase 3** | Cold email tools (Instantly, Lemlist) | Automated via WATI/Interakt | Via Sales Navigator | SMS gateway |

---

## 6. Stage 4: Retention & Intelligence Loop

### 6.1 Retention Strategy Overview

**Display Location:** BREYUS Market Insight in Dashboard for GOLD BUYERS
**Delivery Cadence:** Monthly (split weekly = 4 updates/month)

### 6.2 Monthly Retention Schedule

| Month | What to Send | Prediction Content | How to Deliver | Key Metrics | Churn | Renewal Rate |
|-------|--------------|-------------------|----------------|-------------|-------|--------------|
| **Month 1** | Monthly Report (Saffron) | "Saffron drops 15% next month. Buy now at ₹500/kg, sell at ₹425/kg. Save 15%." | Email + WhatsApp + Dashboard | Open rate: 60%, Click rate: 40% | 30% | 70% |
| | | Confidence: 92%, Reason: Supply increasing | | | | |
| **Month 2** | Monthly Report (Saffron) | "Saffron rises 20%. DON'T buy now. Wait 2 weeks. Price will be ₹375/kg." | Email + WhatsApp + Dashboard | Open rate: 70%, Click rate: 50% | 10% | 90% |
| | | Confidence: 88%, Reason: Festival demand normalizing | | | | |
| **Month 3** | Monthly Report (Saffron) | "Saffron shortage predicted. SELL now at ₹425/kg. Won't be cheaper this year." | Email + WhatsApp | Open rate: 75% | 5% | 95% |
| | Plus: New commodity (Turmeric) | "Turmeric: Prices stable this month. Bulk buy at ₹50/kg." | Email + WhatsApp | | | |
| **Month 4-6** | 2-3 Commodities | Each commodity: Price forecast, supply outlook, buy/sell timing | Email + WhatsApp + Dashboard | Open: 75%, Click: 50% | <5% | >95% |
| | | Each report = different prediction (forces renewal) | | | | |
| **Month 7-12** | 3-5 Commodities | All different predictions each month | Email + WhatsApp + Dashboard | Open: 80%, Click: 55% | <2% | >98% |
| | | User has 12 reports = addicted to accuracy | | | | |

> **Note:** Retention metrics are targets based on the value hypothesis. Actual retention will be tracked post-launch and used to refine the model. Industry B2B SaaS benchmarks suggest 70-90% annual retention for valuable products is achievable.

### 6.3 Retention Mechanism

| Aspect | Strategy | Result |
|--------|----------|--------|
| **One message** | All predictions CHANGE every month | Key: Data expires |
| **Per subscriber** | Users NEED new data = FORCED to renew | Old data = worthless |
| **Monthly delivery** | Each month = new actionable intel | Churn drops to <2% (Permanent) |
| **Long-term outcome** | Value compounds over time | Renewal becomes 98%+ (Permanent) |

---

## 7. Data Sources & Collection

### 7.1 Data Collection Matrix by Commodity Type

| Commodity Type | Best Source | Data to Extract | How to Get | Refresh Rate | Reliability |
|----------------|-------------|-----------------|------------|--------------|-------------|
| **Spices** | APEDA + Spice Board | Production, export volume, prices | Download reports | Monthly | High (official) |
| | Reddit (r/agriculture) | Emerging issues, shortages | Search keyword | Daily | Medium |
| | News (Google News) | Market trends, price changes | Google search | Daily | High |
| **Pharmaceuticals** | DGFT + Pharma associations | Ingredient suppliers, exporters | Website directories | Quarterly | High |
| | LinkedIn Pharma groups | New ingredient trends | Join group + scan posts | Daily | Medium |
| | Company websites | Procurement contacts | Scrape contact pages | Monthly | High |
| **Cosmetics** | Trade publications | New ingredients/suppliers | Search databases | Weekly | High |
| | LinkedIn Cosmetic groups | Trending ingredients | Join group + scan | Daily | Medium |
| **Packaging** | Sustainability forums | New materials, suppliers | Forum browsing | Weekly | Medium |
| | Company websites | Packaging sourcing | B2B sites | Monthly | High |
| **Botanicals** | Export associations | Registered exporters | Member lists | Quarterly | High |
| | TradeKey + Alibaba | Supplier activity | Browse new listings | Daily | Medium |

---

## 8. Monthly Intelligence Predictions

### 8.1 Prediction Content Strategy

**Display Location:** BREYUS Market Insight in Dashboard for GOLD BUYERS
**Delivery Cadence:** Monthly (split weekly = 4 updates/month)

### 8.2 AI-Powered Prediction Approach

The system uses LLM APIs (Claude/GPT) combined with structured data to generate market intelligence:

**Data Inputs:**
- Government export data and trends (APEDA, DGFT)
- News and industry reports (sentiment analysis)
- B2B marketplace activity patterns
- Historical seasonal patterns
- Supply chain signals

**Potential Accuracy:** With proper data integration and model tuning, the system can achieve **88-92% accuracy** on directional predictions (up/down/stable). This is based on combining structured government data with LLM-powered analysis of qualitative signals.

> **Note:** Accuracy targets will be validated through backtesting on historical data and refined based on actual prediction performance. Initial predictions should be framed as "AI-assisted insights" while accuracy is being established.

### 8.3 Sample Prediction Schedule

| Commodity | Month 1 Prediction | Month 2 Prediction | Month 3 Prediction | Why Predictions Change |
|-----------|-------------------|-------------------|-------------------|----------------------|
| **Saffron** | "Drop 15%, buy now" | "Rise 20%, wait" | "Shortage coming, sell" | Seasonal harvest cycles |
| **Turmeric** | "Stable, bulk buy" | "Rise 10% expected" | "Prices peak, sell" | Crop rotation + monsoon |
| **Coffee Leaf** | "New pharma demand +30%" | "Supply catches up -15%" | "Oversupply -20%" | Emerging use cases |
| **Cardamom** | "Festival demand up 40%" | "Post-festival drop 25%" | "Stabilize at ₹300/kg" | Annual demand cycles |
| **Botanical Extract** | "Cosmetics boom +50%" | "Manufacturers scrambling" | "Price spike likely" | Industry trends |

### 8.4 Prediction Pattern

| Each Month | Characteristic | Result |
|------------|---------------|--------|
| Month 1 | Completely different prediction | Each month = new value |
| Month 2 | Completely different prediction | Old data worthless |
| Month 3 | Completely different prediction | Users must renew for latest intel |

---

## 9. Success Metrics

### 9.1 Discovery Stage KPIs

| Metric | Target |
|--------|--------|
| Niche commodities discovered per week | 50+ |
| HS code mappings maintained | 1,000+ |
| Trending commodities identified daily | 30+ |

### 9.2 Acquisition Stage KPIs

| Metric | Target |
|--------|--------|
| Buyer emails collected weekly | 1,000+ |
| Seller emails collected weekly | 500+ |
| Email click rate | 5-10% |
| WhatsApp conversion rate | 10-20% |
| Overall signup conversion | 5-15% |

> **Note:** These are target KPIs. Actual performance will be tracked and benchmarked against industry standards (B2B cold email typically sees 1-5% conversion). Targets will be refined based on initial campaign data.

### 9.3 Retention Stage KPIs

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| Open rate | 60% | 75% | 75% | 80% |
| Click rate | 40% | 50% | 50% | 55% |
| Churn rate | 30% | 5% | <5% | <2% |
| Renewal rate | 70% | 95% | >95% | >98% |

### 9.4 Business Outcomes

| Outcome | Description |
|---------|-------------|
| **User Lock-in** | Niche traders stay inside BREYUS 100% because of VALUE they never got elsewhere |
| **Data Moat** | Predictions expire monthly, forcing continuous engagement |
| **Network Effect** | More buyers attract more sellers, creating marketplace flywheel |

---

## 10. Risks & Assumptions

### 10.1 Key Assumptions

| Assumption | Risk if Wrong | Mitigation |
|------------|---------------|------------|
| B2B sites have scrapeable contact data | Low lead volume | Test scraping early, identify backup sources |
| Niche commodity traders need market intel | No product-market fit | Validate with interviews before scaling |
| LLM analysis provides valuable insights | Low perceived value | Test output quality with real users |
| Email outreach can reach target audience | Low conversion | A/B test messaging, improve targeting |
| 88-92% prediction accuracy is achievable | Trust erosion if inaccurate | Backtest on historical data, be transparent about confidence levels |

### 10.2 Known Unknowns

| Area | Status | Action Needed |
|------|--------|---------------|
| **Compliance** | Not fully researched | Research CAN-SPAM, India's DPDP Act for B2B outreach |
| **Data availability** | Unverified | Test government portal accessibility and data quality |
| **Conversion rates** | No baseline | Establish through initial campaigns |
| **Retention rates** | Cannot estimate | Track post-launch user behavior |
| **Prediction accuracy** | Theoretical | Validate through backtesting and live performance |

### 10.3 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gmail sending limits (500/day) | Slows outreach scaling | Plan upgrade to Google Workspace or SendGrid |
| B2B site structure changes | Breaks scrapers | Build modular scrapers, monitor for changes |
| LLM API costs at scale | Budget overrun | Monitor usage, optimize prompts, consider caching |
| LinkedIn ToS for data collection | Legal/account risk | Use third-party data providers instead of direct scraping |

### 10.4 Dependencies

| Dependency | Owner | Status |
|------------|-------|--------|
| Python scraper development | Founder | To be built |
| Reddit API access | External | Requires payment ($0.24/1000 calls) |
| LLM API access (Claude/GPT) | External | Available, cost-based |
| Email infrastructure | Founder | Gmail initially, scale later |
| WhatsApp Business API | External | Requires application and approval |

---

## Appendix A: Technical Implementation Notes

### A.1 Scraping Technology Stack

| Component | Technology |
|-----------|------------|
| Static HTML scraping | Python requests + BeautifulSoup |
| Dynamic content (JS-rendered) | Selenium |
| Email extraction | Regex patterns |
| Data storage | Excel/CSV (initial), Database (scaled) |

### A.2 Scraping Schedule

| Source Type | Frequency |
|-------------|-----------|
| Government data (APEDA, DGFT) | Weekly |
| Social platforms (Reddit, LinkedIn) | Daily |
| B2B marketplaces (TradeKey, Alibaba) | Daily |
| News sources | Daily |
| Industry associations | Quarterly |

### A.3 Key Search Keywords

```
Discovery Keywords:
- "new"
- "emerging"
- "shortage"
- "supply"
- "innovative"
- "commodity shortage"
- "new material discovery"

Buyer Search Keywords:
- "Procurement Manager"
- "Supply Chain Manager"
- Companies in Pharma/Food/Cosmetics

Seller Search Keywords:
- "Export Manager"
- "Exporter"
- Commodity-specific terms
```

---

## Appendix B: Output Deliverables Summary

| Stage | Output Format | Contents |
|-------|---------------|----------|
| Stage 1: Discovery | Excel Sheet | ALL NICHE COMMODITIES/Month + SPECIFIC MARKET SEGMENT + USAGE and application |
| Stage 2A: Buyers | Excel Sheet | NICHE COMMODITY NAME + BUYERS COMPANY + People name + Contact details (phone, email, LinkedIn) |
| Stage 2B: Sellers | Excel Sheet | NICHE COMMODITY NAME + SELLER COMPANY + People name + Contact details (phone, email, LinkedIn) |
| Stage 3: Onboard | Tracking Dashboard | Signup conversions, response rates |
| Stage 4: Retain | Dashboard + Reports | Monthly intelligence predictions, renewal metrics |

---

## Appendix C: Example Niche Commodities

Based on the document, example niche commodities include:

- **Spirulina** - Superfood algae
- **Gslag** - Industrial material
- **Coffee Leaf** - Emerging pharma ingredient
- **Saffron** - High-value spice with volatile pricing
- **Turmeric** - Agricultural commodity with seasonal patterns
- **Cardamom** - Festival-driven demand commodity
- **Botanical Extracts** - Cosmetics industry inputs

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | February 2026 | BREYUS Tech Team | Initial PRD created from source document |
| 2.0 | February 2026 | BREYUS Tech Team | Added implementation notes, risks section, realistic framing while maintaining vision |

---

*This PRD represents the vision for the BREYUS Niche Commodity Finder AI. Implementation notes indicate Phase 1 approach and areas requiring validation. Targets are aspirational and will be refined based on actual performance data.*

## Related
- [[ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE]]
- [[PRD_1_Government_Data_Extraction]]
- [[api/ai]]
- [[api/commodities]]
- [[MOC-AI]]
