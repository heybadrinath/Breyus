---
type: moc
tags: [moc, ai, index]
---
# MOC: AI System

> PRDs and architecture documents for the Breyus AI server (AI_NEW).

## Documents
- [[ai/NICHE_COMMODITY_FINDER_PRD|Niche Commodity Finder PRD]] -- Product requirements for AI-powered niche commodity discovery
- [[ai/NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE|Technical Architecture]] -- System design for commodity search, embeddings, link prediction
- [[ai/NICHE_COMMODITY_FINDER_UI_SPEC|UI/Design Specification]] -- Consolidated UI spec for admin portal and buyer frontend (all wireframes)
- [[ai/PRD_1_Government_Data_Extraction|Government Data Extraction PRD]] -- Requirements for government trade data ingestion (Stage 1)
- [[ai/PRD_2_3_Contact_Discovery|Contact Discovery PRD]] -- Buyer discovery (Stage 2) and seller discovery (Stage 3) with scraping, dedup, quality scoring
- [[ai/PRD_4_Market_Intelligence|Market Intelligence PRD]] -- Monthly predictions, confidence scoring, buyer dashboard (Stage 4)
- [[ai/PRD_5_Outreach|Outreach & Trader Acquisition PRD]] -- Email drip campaigns to convert discovered contacts into platform signups (Stage 5)

## Reviews
- [[ai/AI_PLANS_GAP_REVIEW_2026-04-02|AI Plans Gap Review]] -- Cross-check of AI plans against product docs, API docs, and live code

## AI Capabilities Summary
| Capability | Description |
|-----------|-------------|
| Link Prediction | 5-strategy waterfall for trade partner matching |
| Commodity Search | Semantic search with mainstream/niche detection |
| Market Analysis | Async job-based demand forecasting and trends |
| Gravity Score | Multi-factor trade opportunity scoring |
| 3-Tier Results | Confidence-based result organization |

## Tech Stack
- **Runtime:** Python 3.10+, FastAPI, Uvicorn
- **Database:** PostgreSQL + pgvector + PostGIS
- **Embeddings:** sentence-transformers
- **LLMs:** Claude (Anthropic), Gemini (Google)
- **Cache:** Redis

## API Reference
- [[api/ai|AI API Documentation]] -- REST endpoints for AI features

## Dataview: AI Docs

```dataview
LIST
FROM "ai"
WHERE file.name != "MOC-AI"
SORT file.name ASC
```

## Related
- [[MEMORY]]
- [[MOC-API]]
- [[MOC-Product]]
