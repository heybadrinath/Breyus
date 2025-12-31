# Breyus Deployment Architecture & Flow

This document outlines the agreed-upon architecture, explaining how code flows from your computer to the users, where files live, and how services communicate.

## 1. High-Level Topology

```mermaid
graph TD
    User((User Browser))
    
    subgraph "Vercel Cloud"
        Frontend[Frontend App<br/>(React/Next.js)]
    end
    
    subgraph "Hetzner Server (Docker Host)"
        subgraph "Public Interface"
            Nginx[Nginx Gateway<br/>(SSL Termination)]
        end
        
        subgraph "Private Docker Network"
            Backend[Backend API<br/>(NestJS)]
            AI[AI Service<br/>(Python/FastAPI)]
            Postgres[(Postgres<br/>AI DB)]
            Mongo[(MongoDB<br/>Main DB)]
            Redis[(Redis<br/>Cache)]
        end
        
        Storage[/Storage Box Mount<br/>(BX11)/]
    end

    User -->|HTTPS| Frontend
    User -->|HTTPS /api| Nginx
    Frontend -->|HTTPS /api| Nginx
    Nginx -->|HTTP :3001| Backend
    Backend -->|HTTP :8000| AI
    Backend -->|TCP| Mongo
    Backend -->|TCP| Redis
    AI -->|TCP| Postgres
    AI -->|Read/Write| Storage
    Backend -->|Read/Write| Storage
```

---

## 2. Directory & Repo Structure

We treat your project as a **Monorepo**. The root folder `Breyus/` contains everything.

```text
Breyus/
├── frontend/             # Vercel deploys this directly
│   └── package.json
├── backend/              # Dockerized Node.js app
│   ├── Dockerfile        # Instructions to build Backend
│   └── src/
├── AI_NEW/               # Dockerized Python app
│   ├── Dockerfile        # Instructions to build AI
│   └── pipeline/
├── nginx/                # Gateway Config
│   └── nginx.conf        # Rules for routing traffic
├── docker-compose.prod.yml # THE MASTER PLAN
└── deploy.sh             # Script to run on server
```

---

## 3. The "Docker Flow" (Service by Service)

### A. The Backend
-   **Role**: Main logic, Authentication, WebSocket.
-   **Dockerfile Location**: `backend/Dockerfile`
-   **Build Process**:
    1.  Start with `node:20` image.
    2.  Copy `package.json` & install dependencies.
    3.  Copy source code (`backend/.`).
    4.  Run `npm run build` ==> creates `dist/`.
    5.  Command: `node dist/main`.
-   **Environment**: Needs `MONGODB_URI`, `REDIS_URL`.

### B. The AI Service
-   **Role**: Long-running jobs, Embeddings, Inference.
-   **Dockerfile Location**: `AI_NEW/Dockerfile`
-   **Build Process**:
    1.  Start with `python:3.11-slim` image.
    2.  Install system libs (like `libpq-dev`).
    3.  Install `requirements.txt`.
    4.  Copy source code (`AI_NEW/.`).
    5.  Command: `uvicorn server.main:app`.
-   **Environment**: Needs `POSTGRES_HOST`, `DATABASE_URL`.

### C. The Orchestrator (`docker-compose.prod.yml`)
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
    depends_on:
      - backend

  # 2. Main API
  backend:
    build: ./backend  # <-- Points to backend folder
    expose: ["3001"]  # Only visible inside Docker network
    environment:
      - MONGODB_URI=mongodb://mongo:27017/breyus # 'mongo' is the service name below
      - AI_SERVICE_URL=http://ai-service:8000    # 'ai-service' is the name below
    volumes:
      - /mnt/storage_box:/app/uploads # Shared storage

  # 3. AI Engine
  ai-service:
    build: ./AI_NEW   # <-- Points to AI folder
    expose: ["8000"]
    volumes:
      - ./AI_NEW/raw_data:/app/raw_data # Local folder for processing
      # If AI needs access to Storage Box files, we mount it separately:
      # - /mnt/storage_box:/app/storage_box

  # 4. Databases (Standard Images)
  mongo:
    image: mongo:latest
  postgres:
    image: postgres:15
  redis:
    image: redis:alpine
```

---

## 4. How Services "Talk" (Linking)
In Docker Compose, **Service Names are Hostnames**.

1.  **Backend -> MongoDB**:
    -   Inside the backend code/env, you use `mongodb://mongo:27017`.
    -   Docker magic resolves `mongo` to the internal IP of the database container.

2.  **Backend -> AI Service**:
    -   Backend calls `http://ai-service:8000/predict`.
    -   Only the backend needs to reach the AI. The outside world cannot hit the AI service directly (secure!).

3.  **Nginx -> Backend**:
    -   Nginx config says: `proxy_pass http://backend:3001;`
    -   When a user hits `api.breyus.com`, Nginx forwards it to the `backend` container.

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
4.  **Result**: Vercel triggers automatically. **No server action needed.**

#### Scenario 2: Backend / AI Changes
1.  **Action**: Modify NestJS logic or Python scripts.
2.  **Commit**: `git commit -am "Fix API logic"`
3.  **Push**: `git push origin main`
4.  **Server Action**:
    *   SSH into server: `ssh root@<ip>`
    *   Navigate to app: `cd /opt/app`
    *   Run deploy script: `./deploy.sh`
    *   **Verification**: Check logs with `docker compose logs -f --tail=100 backend`

### C. Managing Secrets (.env)
**Never commit `.env` files to GitHub.**
-   **Local**: Edit `.env` in your project folders.
-   **Production**:
    1.  SSH into server.
    2.  Edit file: `nano /opt/app/.env`
    3.  Update the variable (e.g., `NEW_API_KEY=xyz`).
    4.  Restart containers: `docker compose up -d` (The deploy script does this too).

### D. Required Files Checklist
To make this work, we will create these files in the next step:
1.  `docker-compose.prod.yml`: The map defined in Section 3.
2.  `nginx/nginx.conf`: The rules for the Gateway.
3.  `deploy.sh`: The easy-button script.
4.  `backend/Dockerfile`: (Already exists, we'll verify it).
5.  `AI_NEW/Dockerfile`: (Already exists, we'll verify it).

## 6. Where the Data Lives (Persistence)

-   **Databases**: We use **Docker Volumes**. Even if you destroy the containers, the volume `mongo_data` and `postgres_data` persist on the server disk.
-   **Files (PDFs/CSVs)**: These live on the **Information Superhighway (The Storage Box)**.
    -   We mount the Storage Box to `/mnt/storage_box` on the host Linux OS.
    -   We pass this path into containers: `volumes: ["/mnt/storage_box:/app/uploads"]`.
    -   If the server explodes, your files are safe on the Storage Box.
