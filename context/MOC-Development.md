---
type: moc
tags: [moc, development, index]
---
# MOC: Development

> Development guidelines, agent configurations, conventions, and tooling.

## Documents
- [[AGENTS|Repository Guidelines]] -- Build commands, test commands, code conventions, module organization
- [[development/CODEX_SETUP|Codex Setup]] -- Codex-facing repo configuration, Claude-to-Codex mapping, and limitations

## Conventions
| Area | Convention |
|------|-----------|
| Backend framework | NestJS 11 with TypeScript |
| Frontend framework | React 19 (CRA) with TypeScript |
| Admin portal | React + Vite + shadcn/ui |
| Styling | TailwindCSS |
| Database ODM | Mongoose / Typegoose |
| Authentication | Signed HTTP-only cookies (JWT) |
| API response | `{ statusCode, message, data }` |
| File uploads | Multer (multipart/form-data) |

## Development Commands

### Backend (`backend/`)
```bash
npm run start:dev    # Watch mode (port 3001)
npm run build        # Compile to dist/
npm run test         # Unit tests
npm run lint         # ESLint + Prettier
```

### Frontend (`frontend/`)
```bash
npm start            # Dev server (port 3000)
npm run build        # Production bundle
npm test             # CRA test harness
```

### AI Server (`AI_NEW/`)
```bash
uvicorn server.main:app --reload --port 8000
```

## Dataview: Development Docs

```dataview
LIST
FROM "development"
SORT file.name ASC
```

## Related
- [[MEMORY]]
- [[MOC-API]]
- [[MOC-Operations]]
- [[development/lessons]]
