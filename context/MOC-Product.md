---
type: moc
tags: [moc, product, index]
---
# MOC: Product Documentation

> Product requirements, specifications, and vision documents.

## Documents
- [[breyus_product_doc|Product Requirements Document (PRD)]] -- Full product vision, user stories, feature specs
- [[Breyus_Technical_Documentation|Technical Documentation]] -- Architecture, schemas, implementation details

## Key Concepts
| Concept | Description |
|---------|-------------|
| Trade Lifecycle | PR > SCO > ICPO > SPA > Payment > BoL > Complete |
| User Roles | Buyer, Seller (one per account) |
| Incoterms | 11 standard terms (EXW through DDP) |
| KYC | Non-gating compliance documents |

## Dataview: Product Docs

```dataview
LIST
FROM "product"
SORT file.name ASC
```

## Related
- [[MEMORY]]
- [[MOC-API]]
- [[MOC-AI]]
