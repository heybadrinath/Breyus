# syntax=docker/dockerfile:1.4
# ============================================
# Breyus AI Server - Optimized Multi-Stage Build
# ============================================
# Build with: DOCKER_BUILDKIT=1 docker-compose build
# Or: docker buildx build -t breyus-ai .
# ============================================

# ============================================
# Stage 1: Builder - Install dependencies
# ============================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies (needed for compiling some packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install Python dependencies to user directory
# Using BuildKit cache mount to persist pip cache across builds
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --user --no-warn-script-location -r requirements.txt

# ============================================
# Stage 2: Runtime - Minimal production image
# ============================================
FROM python:3.11-slim AS runtime

WORKDIR /app

# Install only runtime system dependencies (no build tools!)
# libpq5 is the runtime library for PostgreSQL (not libpq-dev)
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder stage
COPY --from=builder /root/.local /root/.local

# Ensure Python packages are in PATH
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy application code
# Note: In production, consider using .dockerignore to exclude unnecessary files
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Health check using Python (slim image doesn't include curl/wget)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=5)" || exit 1

# Run the application
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
