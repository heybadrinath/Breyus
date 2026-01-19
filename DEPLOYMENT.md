# Breyus Deployment Architecture & Flow

This document outlines the agreed-upon architecture, explaining how code flows from your computer to the users, where files live, and how services communicate.

## Infrastructure Overview

| Component | Provider | Location | Monthly Cost |
|-----------|----------|----------|--------------|
| **VPS** | Vultr High Performance | Mumbai, India | $96 |
| **Object Storage** | Vultr Standard Tier | Singapore | $18 |
| **Total** | | | **$114** |

## 1. High-Level Topology

```mermaid
graph TD
    User((User Browser<br/>India/South Asia))
    Admin((Admin Browser))

    subgraph "Vultr Mumbai (Docker Host)"
        subgraph "Public Interface"
            Nginx[Nginx Gateway<br/>(SSL Termination + Static UI)]
        end

        Frontend[Frontend Static Build<br/>(React/CRA)<br/>breyus.com]
        AdminPortal[Admin Portal Static Build<br/>(React/Vite)<br/>admin.breyus.com]

        subgraph "Private Docker Network"
            Backend[Backend API<br/>(NestJS)]
            AI[AI Service<br/>(Python/FastAPI)]
            Postgres[(Postgres<br/>AI DB)]
            Mongo[(MongoDB<br/>Main DB)]
            Redis[(Redis<br/>Cache)]
        end
    end

    subgraph "Vultr Object Storage (S3-Compatible)"
        Uploads[breyus-uploads<br/>Trade Docs, Images]
        AIData[breyus-ai-data<br/>Pipeline Files]
        Backups[breyus-backups<br/>DB Backups]
    end

    User -->|HTTPS ~20ms| Nginx
    Admin -->|HTTPS| Nginx
    Nginx -->|Serves UI| Frontend
    Nginx -->|Serves Admin UI| AdminPortal
    User -->|HTTPS /api| Nginx
    Admin -->|HTTPS /api| Nginx
    Nginx -->|HTTP :3001| Backend
    Backend -->|HTTP :8000| AI
    Backend -->|TCP| Mongo
    Backend -->|TCP| Redis
    AI -->|TCP| Postgres
    AI -->|S3 API| AIData
    Backend -->|S3 API| Uploads
    Backend -->|S3 API| Backups
```

---

## 2. Directory & Repo Structure

We treat your project as a **Monorepo**. The root folder `Breyus/` contains everything.

```text
Breyus/
├── frontend/             # Built on VPS; static build served by Nginx (breyus.com)
│   └── package.json
├── admin/                # Admin Portal - Built on VPS (admin.breyus.com)
│   ├── package.json      # Vite + React + shadcn/ui
│   └── src/
├── backend/              # Dockerized Node.js app
│   ├── Dockerfile        # Instructions to build Backend
│   └── src/
├── AI_NEW/               # Dockerized Python app
│   ├── Dockerfile        # Instructions to build AI
│   └── pipeline/
├── nginx/                # Gateway Config
│   └── nginx.conf        # Rules for routing traffic (frontend + admin + api)
├── scripts/              # Deployment/ops scripts (per-service)
├── docker-compose.prod.yml # THE MASTER PLAN
└── .env                  # Production config on server (not committed)
```

---

## 3. The "Docker Flow" (Service by Service)

### A. The Frontend (Static Build)
-   **Role**: React SPA served by Nginx at `https://breyus.com`.
-   **Build Process (on VPS)**:
    1.  Run `npm ci` in `frontend/`.
    2.  Run `npm run build` to generate `frontend/build`.
-   **Runtime**: Nginx serves `frontend/build` from `/usr/share/nginx/html`.
-   **Environment**: `REACT_APP_BACKEND_URL=https://api.breyus.com` at build time.

### A.1 The Admin Portal (Static Build)
-   **Role**: React SPA for platform administration, served by Nginx at `https://admin.breyus.com`.
-   **Build Process (on VPS)**:
    1.  Run `npm ci` in `admin/`.
    2.  Run `npm run build` to generate `admin/dist`.
-   **Runtime**: Nginx serves `admin/dist` from `/usr/share/nginx/admin`.
-   **Environment**: `VITE_API_URL=https://api.breyus.com` at build time.
-   **Features Provided**:
    - User & Company management (KYC verification, account suspension)
    - Trade oversight and dispute resolution
    - AI pipeline monitoring and database operations
    - System health monitoring, logs viewer, alerts
    - Content management (commodities, Incoterms, countries)
    - GDPR compliance tools (data export, deletion requests)
-   **Tech Stack**: Vite + React + TypeScript + shadcn/ui + TailwindCSS
-   **Access Control**: Admin-only access (role-based authentication)

### B. The Backend
-   **Role**: Main logic, Authentication, WebSocket.
-   **Dockerfile Location**: `backend/Dockerfile`
-   **Build Process**:
    1.  Start with `node:20` image.
    2.  Copy `package.json` & install dependencies.
    3.  Copy source code (`backend/.`).
    4.  Run `npm run build` ==> creates `dist/`.
    5.  Command: `node dist/main`.
-   **Environment**: Needs `MONGODB_URI`, `REDIS_URL`.

### C. The AI Service
-   **Role**: Long-running jobs, Embeddings, Inference.
-   **Dockerfile Location**: `AI_NEW/Dockerfile`
-   **Build Process**:
    1.  Start with `python:3.11-slim` image.
    2.  Install system libs (like `libpq-dev`).
    3.  Install `requirements.txt`.
    4.  Copy source code (`AI_NEW/.`).
    5.  Command: `uvicorn server.main:app`.
-   **Environment**: Needs `POSTGRES_HOST`, `DATABASE_URL`.

### D. The Orchestrator (`docker-compose.prod.yml`)
This file lives at the **Root**. It links everything together. It stops you from running 5 separate `docker run` commands.

**How it looks (simplified):**
```yaml
services:
  # 1. The Gateway
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"] # Open to the world
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/build:/usr/share/nginx/html:ro
      - ./admin/dist:/usr/share/nginx/admin:ro
    depends_on:
      - backend

  # 2. Main API
  backend:
    build: ./backend  # <-- Points to backend folder
    expose: ["3001"]  # Only visible inside Docker network
    environment:
      - MONGODB_URI=mongodb://mongo:27017/breyus # 'mongo' is the service name below
      - AI_SERVICE_URL=http://ai-service:8000    # 'ai-service' is the name below
      # S3/Object Storage credentials (passed from .env)
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_REGION=${S3_REGION}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - S3_BUCKET_UPLOADS=${S3_BUCKET_UPLOADS}
    # No volume mount needed - uses S3 API for file storage

  # 3. AI Engine
  ai-service:
    build: ./AI_NEW   # <-- Points to AI folder
    expose: ["8000"]
    environment:
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_REGION=${S3_REGION}
      - S3_ACCESS_KEY=${S3_ACCESS_KEY}
      - S3_SECRET_KEY=${S3_SECRET_KEY}
      - S3_BUCKET_AI_DATA=${S3_BUCKET_AI_DATA}
    volumes:
      - ./AI_NEW/raw_data:/app/raw_data # Local folder for processing (temp files)

  # 4. Databases (Standard Images)
  mongo:
    image: mongo:latest
  postgres:
    image: postgres:15
  redis:
    image: redis:alpine
```

**Nginx notes:**
- `breyus.com` serves the static build from `/usr/share/nginx/html`.
- `admin.breyus.com` serves the admin portal from `/usr/share/nginx/admin`.
- `api.breyus.com` proxies to `http://backend:3001` with WebSocket upgrades enabled.

---

## 4. How Services "Talk" (Linking)
In Docker Compose, **Service Names are Hostnames**.

1.  **Backend -> MongoDB**:
    -   Inside the backend code/env, you use `mongodb://mongo:27017`.
    -   Docker magic resolves `mongo` to the internal IP of the database container.

2.  **Backend -> AI Service**:
    -   Backend calls `http://ai-service:8000/predict`.
    -   Only the backend needs to reach the AI. The outside world cannot hit the AI service directly (secure!).

3.  **Nginx -> Frontend Static Build**:
    -   Nginx serves `https://breyus.com` from `/usr/share/nginx/html`.
    -   The folder is a bind mount to `frontend/build` on the VPS.

4.  **Nginx -> Admin Portal Static Build**:
    -   Nginx serves `https://admin.breyus.com` from `/usr/share/nginx/admin`.
    -   The folder is a bind mount to `admin/dist` on the VPS.

5.  **Nginx -> Backend**:
    -   Nginx config says: `proxy_pass http://backend:3001;`
    -   When a user hits `api.breyus.com` (or `/api`), Nginx forwards it to the `backend` container.
    -   WebSocket upgrades pass through to Socket.IO namespaces (`/inbox`, `/trade`).

---

## 5. detailed Developer Workflow (The Process)

This section describes exactly what you need to do in your day-to-day work.

### A. Local Development (Standard Mode)
Run services locally to build features fast.
1.  **Frontend**: Run `npm start` in `frontend/`. Access at `http://localhost:3000`.
2.  **Backend**: Run `npm run start:dev` in `backend/`. Access at `http://localhost:3001`.
    *   Ensure your local `.env` points to local Mongo/Redis.
3.  **AI Service**: Run `python -m server.main` (or Uvicorn) in `AI_NEW`.
    *   Useful when developing new pipelines.

### B. Deployment Pipeline (releasing to Prod)
When you are ready to ship.

#### Scenario 1: Frontend Changes Only
1.  **Action**: Modify React components/pages.
2.  **Commit**: `git commit -am "Update landing page"`
3.  **Push**: `git push origin main`
4.  **Server Action**:
    *   SSH into server: `ssh root@<ip>`
    *   Navigate to app: `cd /opt/app`
    *   Run frontend build script: `./scripts/deploy-frontend.sh`
    *   **Verification**: Load `https://breyus.com` and confirm assets updated.

#### Scenario 1.1: Admin Portal Changes Only
1.  **Action**: Modify admin portal components/pages.
2.  **Commit**: `git commit -am "Update admin dashboard"`
3.  **Push**: `git push origin main`
4.  **Server Action**:
    *   SSH into server: `ssh root@<ip>`
    *   Navigate to app: `cd /opt/app`
    *   Run admin build script: `./scripts/deploy-admin.sh`
    *   **Verification**: Load `https://admin.breyus.com` and confirm assets updated.

#### Scenario 2: Backend / AI Changes
1.  **Action**: Modify NestJS logic or Python scripts.
2.  **Commit**: `git commit -am "Fix API logic"`
3.  **Push**: `git push origin main`
4.  **Server Action**:
    *   SSH into server: `ssh root@<ip>`
    *   Navigate to app: `cd /opt/app`
    *   Run backend/AI deploy script: `./scripts/deploy-backend.sh`
    *   **Verification**: Check logs with `docker compose logs -f --tail=100 backend`

### C. Managing Secrets (.env)
**Never commit `.env` files to GitHub.**
-   **Local**: Edit `.env` in your project folders.
-   **Production**:
    1.  SSH into server.
    2.  Edit file: `nano /opt/app/.env`
    3.  Update the variable (e.g., `NEW_API_KEY=xyz`).
    4.  Restart containers: `docker compose up -d` (backend deploy scripts do this too).

### D. Required Files Checklist
To make this work, we will create these files in the next step:
1.  `docker-compose.prod.yml`: The map defined in Section 3.
2.  `nginx/nginx.conf`: The rules for the Gateway (frontend, admin, api routing).
3.  `scripts/`: Deployment/ops scripts (frontend, admin, backend, AI, data jobs).
4.  `backend/Dockerfile`: (Already exists, we'll verify it).
5.  `AI_NEW/Dockerfile`: (Already exists, we'll verify it).
6.  `admin/`: Admin portal React app (Vite + shadcn/ui).

## 6. Where the Data Lives (Persistence)

-   **Databases**: We use **Docker Volumes**. Even if you destroy the containers, the volume `mongo_data` and `postgres_data` persist on the server disk (320 GB NVMe SSD).
-   **Files (PDFs/CSVs/Images)**: These live on **Vultr Object Storage** (S3-compatible).
    -   Application accesses via S3 API (not filesystem mount).
    -   Uses `@aws-sdk/client-s3` in Node.js backend.
    -   If the server explodes, your files are safe in Object Storage.
    -   Buckets:
        -   `breyus-uploads`: Trade documents, product images, test reports
        -   `breyus-ai-data`: AI pipeline files, embeddings
        -   `breyus-backups`: Daily database backups

### Object Storage Configuration

**Environment Variables (in `.env`):**
```env
S3_ENDPOINT=https://sgp1.vultrobjects.com
S3_REGION=sgp1
S3_ACCESS_KEY=<your-vultr-access-key>
S3_SECRET_KEY=<your-vultr-secret-key>
S3_BUCKET_UPLOADS=breyus-uploads
S3_BUCKET_AI_DATA=breyus-ai-data
S3_BUCKET_BACKUPS=breyus-backups
```

**File URL Pattern:**
```
https://sgp1.vultrobjects.com/breyus-uploads/trade-documents/{tradeId}/sco.pdf
https://sgp1.vultrobjects.com/breyus-uploads/product-images/{productId}/image-1.jpg
```
