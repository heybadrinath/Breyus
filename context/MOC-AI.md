---
type: moc
tags: [moc, ai, index]
---
# MOC: AI System

> PRDs and architecture documents for the Breyus AI server (AI_NEW).

## Documents
- [[BREYUS_NICHE_COMMODITY_FINDER_AI_PRD|Niche Commodity Finder PRD]] -- Product requirements for AI-powered niche commodity discovery
- [[NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE|Technical Architecture]] -- System design for commodity search, embeddings, link prediction
- [[PRD_Government_Data_Extraction|Government Data Extraction PRD]] -- Requirements for government trade data ingestion

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
- [[ai|AI API Documentation]] -- REST endpoints for AI features

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
