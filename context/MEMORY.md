---
type: memory
tags: [memory, index, keystone]
---
# MEMORY

> Keystone file for the Breyus Obsidian vault. Start here to navigate context.

## Vault Map

### Map of Contents (MOCs)
- [[MOC-API]] -- API documentation index (17 modules)
- [[MOC-Product]] -- Product requirements and specifications
- [[MOC-Operations]] -- Deployment, hosting, backups, capacity planning
- [[MOC-AI]] -- AI server PRDs and architecture
- [[MOC-Development]] -- Development guidelines, agents, and conventions
- [[MOC-Changelog]] -- Release notes and change tracking
- [[MOC-Trade]] -- Trade lifecycle, negotiation, documents

### Living Documents
- [[SESSION_CONTEXT]] -- Current session state and handoff notes
- [[development/lessons]] -- Lessons learned and recurring mistake patterns

### Key Entry Points
| Area | Start Here |
|------|------------|
| Product vision | [[breyus_product_doc]] |
| Technical architecture | [[Breyus_Technical_Documentation]] |
| API reference | [[MOC-API]] |
| AI system | [[ai/NICHE_COMMODITY_FINDER_PRD]] |
| Deployment | [[DEPLOYMENT]] |
| Server setup | [[SERVER_SETUP]] |

### Folder Guide
| Folder | Purpose |
|--------|---------|
| `api/` | Migrated API docs with YAML frontmatter |
| `ai/` | AI PRDs and technical architecture |
| `product/` | Product docs and PRDs |
| `operations/` | Deployment, hosting, backup, capacity |
| `development/` | Dev guidelines and agent configs |
| `changelog/` | Dated change entries |

## Quick Reference

- **Backend:** NestJS 11, MongoDB, Redis, port 3001
- **Frontend:** React 19, TailwindCSS, port 3000
- **Admin Portal:** React + Vite + shadcn/ui
- **AI Server:** FastAPI, PostgreSQL + pgvector, port 8000
- **Hosting:** DigitalOcean (Singapore), Cloudflare DNS
