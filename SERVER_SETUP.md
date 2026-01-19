# Production Server Setup Guide (End-to-End)

This guide covers everything required to take a fresh **Vultr High Performance Server** and turn it into the production host for **Breyus**.

## Infrastructure Overview

| Component | Specification | Monthly Cost |
|-----------|---------------|--------------|
| **VPS** | Vultr High Performance - 8 vCPU, 16 GB RAM, 320 GB NVMe | $96 |
| **Object Storage** | Vultr Standard Tier - 1 TB | $18 |
| **Total** | | **$114/month** |

## Prerequisites
1.  **Vultr Account**: Sign up at [vultr.com](https://www.vultr.com)
2.  **Domain Name**: Access to your DNS provider (e.g., GoDaddy, Cloudflare).
3.  **SSH Key**: Your local public key (`id_rsa.pub`) ready to copy.

---

## Phase 1: Provisioning Infrastructure

### 1. Create the Server

1. Log into [Vultr Cloud Console](https://my.vultr.com/)
2. Click **"Deploy +"** → **"Deploy New Server"**
3. Configure:
   -   **Choose Server**: Cloud Compute
   -   **CPU & Storage Technology**: **High Performance** (AMD/Intel with NVMe)
   -   **Server Location**: **Mumbai** (for India/South Asia users)
   -   **Server Image**: **Ubuntu 24.04 LTS x64**
   -   **Server Size**: **$96/month** (8 vCPU, 16 GB RAM, 320 GB NVMe, 4 TB bandwidth)
   -   **SSH Keys**: Add your public key
   -   **Server Hostname**: `breyus-prod`
4. Click **"Deploy Now"**

**Note**: Server will be ready in ~60 seconds. Note the IP address.

### 2. Create Object Storage

1. In Vultr Console, go to **Products** → **Object Storage**
2. Click **"Add Object Storage"**
3. Configure:
   -   **Location**: Choose closest to Mumbai (Singapore or same region if available)
   -   **Label**: `breyus-files`
   -   **Tier**: **Standard** ($18/month - 1 TB storage, 1 TB outbound)
4. Click **"Add Object Storage"**
5. Note the following credentials (you'll need these later):
   -   **Hostname**: `xxx.vultrobjects.com`
   -   **Access Key**: `XXXXXXXXXX`
   -   **Secret Key**: `XXXXXXXXXX`

### 3. DNS Configuration
Go to your domain registrar and set these **A Records**:
-   **Name**: `@` (root, e.g., `breyus.com`) -> `<Your-Vultr-Server-IP>`
-   **Name**: `api` (e.g., `api.breyus.com`) -> `<Your-Vultr-Server-IP>`
-   **Name**: `admin` (e.g., `admin.breyus.com`) -> `<Your-Vultr-Server-IP>`
-   **Optional**: `www` -> CNAME to `breyus.com` (or A record to the same IP)

---

## Phase 2: Server initialization

Login to your server:
```bash
ssh root@<server-ip>
```

### 1. Basic Security (Firewall)
Allow only SSH, HTTP, and HTTPS. Block everything else.
```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Install Docker & Docker Compose
We use the official install script for the latest version.
```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

### 3. Install Node.js (Frontend Build)
We build the React frontend on the VPS, so Node.js is required.
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

### 4. **Verification** (Do not skip)
Run this command to make sure Docker is alive:
```bash
docker run hello-world
```
*If you see "Hello from Docker!", you are ready.*
```

---

## Phase 3: Configure Object Storage (S3-Compatible)

Vultr Object Storage uses the S3 API. Unlike filesystem mounts, your application accesses storage via HTTP/SDK.

### 1. Install AWS CLI (for testing/management)
```bash
apt-get install awscli -y
```

### 2. Configure AWS CLI for Vultr Object Storage
```bash
aws configure
```
Enter:
-   **AWS Access Key ID**: Your Vultr Object Storage Access Key
-   **AWS Secret Access Key**: Your Vultr Object Storage Secret Key
-   **Default region name**: `sgp1` (or your storage region)
-   **Default output format**: `json`

### 3. Create Storage Buckets
```bash
# Set the Vultr endpoint
export VULTR_ENDPOINT="https://sgp1.vultrobjects.com"

# Create buckets for different file types
aws s3 mb s3://breyus-uploads --endpoint-url=$VULTR_ENDPOINT
aws s3 mb s3://breyus-ai-data --endpoint-url=$VULTR_ENDPOINT
aws s3 mb s3://breyus-backups --endpoint-url=$VULTR_ENDPOINT

# Verify buckets were created
aws s3 ls --endpoint-url=$VULTR_ENDPOINT
```

### 4. Test Upload/Download
```bash
# Test upload
echo "test file" > /tmp/test.txt
aws s3 cp /tmp/test.txt s3://breyus-uploads/test.txt --endpoint-url=$VULTR_ENDPOINT

# Test download
aws s3 cp s3://breyus-uploads/test.txt /tmp/test-downloaded.txt --endpoint-url=$VULTR_ENDPOINT
cat /tmp/test-downloaded.txt

# Clean up test file
aws s3 rm s3://breyus-uploads/test.txt --endpoint-url=$VULTR_ENDPOINT
```

### 5. Bucket Structure
```
breyus-uploads/          # User-uploaded files
├── trade-documents/     # SCO, ICPO, SPA, BoL, Payment Proofs
├── product-images/      # Product photos
└── test-reports/        # Product test reports

breyus-ai-data/          # AI service data
├── raw_data/            # Pipeline input files
├── embeddings/          # Vector embeddings
└── models/              # Trained models (if any)

breyus-backups/          # Database backups
├── mongodb/             # Daily MongoDB dumps
└── postgres/            # Daily PostgreSQL dumps
```

---

## Phase 4: Application Deployment

### 1. Clone Repository
You need to authenticate with GitHub.
-   **Option A (HTTPS)**: Use personal access token.
-   **Option B (SSH - Recommended)**: Generate a key on the server (`ssh-keygen`), add it to GitHub "Deploy Keys".

```bash
cd /opt
git clone git@github.com:YourUser/Breyus.git app
cd app
```

### 2. Environment Variables
Create the production config.
```bash
nano .env
```
Copy your `.env` content here. **Critical variables**:

**Database & Services:**
-   `MONGODB_URI=mongodb://mongo:27017/breyus` (Must use container name `mongo`)
-   `REDIS_URL=redis://redis:6379`
-   `AI_SERVICE_URL=http://ai-service:8000`
-   `CORS_ORIGIN=https://breyus.com` (comma-separate if multiple)
-   `POSTGRES_HOST=postgres`

**Vultr Object Storage (S3-Compatible):**
-   `S3_ENDPOINT=https://sgp1.vultrobjects.com`
-   `S3_REGION=sgp1`
-   `S3_ACCESS_KEY=<your-vultr-access-key>`
-   `S3_SECRET_KEY=<your-vultr-secret-key>`
-   `S3_BUCKET_UPLOADS=breyus-uploads`
-   `S3_BUCKET_AI_DATA=breyus-ai-data`
-   `S3_BUCKET_BACKUPS=breyus-backups`

### 3. Start the Application
Run the deployment scripts from `scripts/` (names may evolve as we finalize).
```bash
chmod +x scripts/*.sh
./scripts/deploy-backend.sh
./scripts/deploy-frontend.sh
```
*Note: The backend script builds containers (5-10 minutes on first run). The frontend script builds `frontend/build` and reloads Nginx.*

### 4. **Verification**
Check if containers are up:
```bash
docker ps
```
You should see: `nginx`, `backend`, `ai-service`, `mongo`, `postgres`, `redis`.

Verify routing:
- `https://breyus.com` loads the frontend.
- `https://admin.breyus.com` loads the admin portal.
- `https://api.breyus.com` responds (API endpoints).

If something is missing, check logs:
```bash
docker compose logs backend
```

---

## Phase 5: SSL Setup (Let's Encrypt)
Since we are using `nginx` in Docker, we need to generate certificates.

**Method 1: Certbot on Host (Recommended for Gateway)**
1.  Stop Nginx container temporarily: `docker stop breyus-nginx-1`
2.  Install Certbot: `apt install certbot -y`
3.  Generate Certs:
    ```bash
    certbot certonly --standalone -d breyus.com -d api.breyus.com -d admin.breyus.com
```
4.  The certs will be in `/etc/letsencrypt/live/breyus.com/`.
5.  **Important**: We need to map this into the Nginx container in `docker-compose.prod.yml`:
    ```yaml
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ```
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ```
6.  Start Nginx: `docker start breyus-nginx-1`

## Phase 6: Maintenance & Troubleshooting (The "What If")

### Server Restarted?
Everything should come back up automatically (`restart: unless-stopped` policy).
-   **Check**: `docker ps`
-   **Storage**: Object Storage is external (no mount needed). Test with: `aws s3 ls --endpoint-url=$VULTR_ENDPOINT`

### Code Update Failed?
If `./scripts/deploy-backend.sh` fails:
1.  Check git status: `git status` (Did you change files on server locally? Revert them).
2.  Check disk space: `df -h` (Docker fills disks; run `docker system prune -a` if desperate).

### Viewing Logs
-   **Live Logs**: `docker compose logs -f` (All services)
-   **Specific Service**: `docker compose logs -f backend`

---

## Summary Checklist
- [ ] Vultr High Performance server created in Mumbai datacenter
- [ ] SSH key added & firewall configured (UFW)
- [ ] Docker & Docker Compose installed
- [ ] Node.js 20.x installed (for frontend builds)
- [ ] Vultr Object Storage created & buckets configured
- [ ] AWS CLI configured for Vultr Object Storage
- [ ] Code cloned to `/opt/app`
- [ ] `.env` file created with production values (including S3 credentials)
- [ ] Backend, frontend, and admin portal deploy scripts run successfully
- [ ] SSL Certificates generated for `breyus.com`, `api.breyus.com`, and `admin.breyus.com`
- [ ] Frontend served by Nginx at `https://breyus.com`
- [ ] Admin Portal served by Nginx at `https://admin.breyus.com`
- [ ] API responding at `https://api.breyus.com`

## Infrastructure Summary

| Component | Provider | Location | Cost |
|-----------|----------|----------|------|
| VPS | Vultr High Performance | Mumbai | $96/mo |
| Object Storage | Vultr Standard | Singapore | $18/mo |
| **Total** | | | **$114/mo** |

## Vultr Console Links
- **Server Management**: https://my.vultr.com/
- **Object Storage**: https://my.vultr.com/objectstorage/
- **Billing**: https://my.vultr.com/billing/
- **Support**: https://my.vultr.com/support/
