---
type: operations-doc
module: operations
tags: [operations, server_setup]
---

# Production Server Setup Guide (End-to-End)

This guide covers everything required to take a fresh **DigitalOcean Droplet** and turn it into the production host for **Breyus**.

## Infrastructure Overview

| Component | Specification | Monthly Cost |
|-----------|---------------|--------------|
| **VPS** | DigitalOcean Premium Droplet - 8 vCPU, 16 GB RAM, 320 GB NVMe | $112 |
| **Object Storage** | DigitalOcean Spaces - 250 GB + 1 TB transfer | $5 |
| **Total** | | **$117/month** |

## Prerequisites
1.  **DigitalOcean Account**: Sign up at [digitalocean.com](https://www.digitalocean.com)
2.  **Domain Name**: Access to your DNS provider (e.g., GoDaddy, Cloudflare).
3.  **SSH Key**: Your local public key (`id_ed25519.pub` preferred, or `id_rsa.pub`) ready to copy.

---

## Phase 1: Provisioning Infrastructure

### 1. Create the Server

1. Log into [DigitalOcean Cloud Console](https://cloud.digitalocean.com/)
2. Click **"Create"** → **"Droplets"**
3. Configure:
   -   **Choose Region**: **Singapore (SGP1)** (closest to India)
   -   **Choose Image**: **Ubuntu 24.04 LTS x64**
   -   **Choose Size**: **Basic** → **Premium (NVMe SSD)** → **$112/month** (8 vCPU, 16 GB RAM, 320 GB NVMe, 6 TB bandwidth)
   -   **Authentication**: Add your SSH key
   -   **Hostname**: `breyus-prod`
4. Click **"Create Droplet"**

**Note**: Server will be ready in ~60 seconds. Note the IP address.

### 2. Create Object Storage (Spaces)

We use a **single Space bucket** with folders inside for organization.

1. In DigitalOcean Console, go to **Spaces** (left sidebar)
2. Click **"Create a Spaces Bucket"**
3. Configure:
   -   **Region**: Singapore (SGP1) - same as your Droplet
   -   **Name**: `breyus-files`
   -   **File Listing**: Restrict
4. Click **"Create a Spaces Bucket"**
5. Go to **API** → **Spaces Keys** → **Generate New Key**
6. Note the following credentials (you'll need these later):
   -   **Endpoint**: `sgp1.digitaloceanspaces.com`
   -   **Access Key**: `XXXXXXXXXX`
   -   **Secret Key**: `XXXXXXXXXX`

### 3. DNS Configuration
Go to your domain registrar and set these **A Records**:
-   **Name**: `@` (root, e.g., `breyus.com`) -> `<Your-DigitalOcean-Droplet-IP>`
-   **Name**: `api` (e.g., `api.breyus.com`) -> `<Your-DigitalOcean-Droplet-IP>`
-   **Name**: `admin` (e.g., `admin.breyus.com`) -> `<Your-DigitalOcean-Droplet-IP>`
-   **Optional**: `www` -> CNAME to `breyus.com` (or A record to the same IP)

---

## Phase 2: Server Initialization

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

> **WARNING: Docker bypasses UFW.** Docker manipulates iptables directly, meaning `ufw deny` rules do NOT protect Docker-published ports. The fix is to never use `ports:` for database containers in docker-compose.yml — use `expose:` instead. See [[operations/PRODUCTION_HARDENING#17. Docker + UFW Interaction (CRITICAL)]] for details.

### 1.5. SSH Hardening

> **Do this before anything else.** Automated bots scan for SSH within minutes of a new server going online.

```bash
# Harden SSH configuration
cat >> /etc/ssh/sshd_config << 'EOF'

# --- Breyus SSH Hardening ---
PermitRootLogin prohibit-password  # Allow root key-auth during setup, disable later
PasswordAuthentication no
ChallengeResponseAuthentication no
MaxAuthTries 3
LoginGraceTime 30
EOF

# Restart SSH (keep your current session open as fallback!)
systemctl restart sshd
```

**Install fail2ban** (brute-force protection):
```bash
apt install fail2ban -y
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
maxretry = 5
bantime = 3600
findtime = 600
EOF
systemctl enable fail2ban && systemctl restart fail2ban
```

**Install automatic security updates:**
```bash
apt install unattended-upgrades -y
dpkg-reconfigure -plow unattended-upgrades
```

> **After deploy user is set up (Phase 2.5):** Come back and change `PermitRootLogin prohibit-password` to `PermitRootLogin no` to fully disable root SSH.

### 1.6. Swap Configuration

With only 9% RAM buffer, a swap file prevents OOM kills during memory spikes:

```bash
# Create 4GB swap file
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make persistent across reboots
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Optimize swappiness (prefer RAM, use swap only when needed)
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

Verify: `free -h` should show 4GB swap.

> **Why swap matters:** The server allocates 14.5 GB of 16 GB to services. A Node.js memory spike or PyTorch model reload without swap triggers the OOM killer, which randomly kills a container — potentially a database.

---

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
```

### 3. Install Node.js 22 LTS (Frontend Build)
We build the React frontend on the VPS, so Node.js is required.
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # Should show v22.x
npm -v
```

> **Note:** Node.js 20 exits Active LTS in April 2026. Node.js 22 is the current LTS track.

### 4. **Verification** (Do not skip)
Run this command to make sure Docker is alive:
```bash
docker run hello-world
```
*If you see "Hello from Docker!", you are ready.*

---

## Phase 2.5: Deploy User Setup

> **Required for:** CI/CD pipeline automation (see [[operations/CI_CD_PIPELINE]])
> **When to do this:** After Docker is installed, before application deployment

The CI/CD pipeline uses a dedicated non-root `deploy` user to SSH in and run deployment commands. This limits blast radius if the deploy key is compromised.

### 1. Create the Deploy User

```bash
# Create user with home directory
useradd -m -s /bin/bash deploy

# Add to docker group (allows running docker commands without sudo)
usermod -aG docker deploy
```

### 2. Set Up SSH Key Authentication

```bash
# Create .ssh directory
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Generate an Ed25519 key pair (or use an existing public key)
# The PRIVATE key goes into GitHub Secrets (DEPLOY_SSH_KEY)
# The PUBLIC key goes into authorized_keys below
ssh-keygen -t ed25519 -C "github-actions-deploy" -f /tmp/deploy_key -N ""

# Add public key to authorized_keys
cat /tmp/deploy_key.pub >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# Save the private key content — you'll paste this into GitHub Secrets
cat /tmp/deploy_key
# Then delete it from the server
rm /tmp/deploy_key /tmp/deploy_key.pub
```

### 3. Grant Application Directory Access

```bash
# Give deploy user ownership of the app directory
chown -R deploy:deploy /opt/app

# Ensure deploy user can read .env (but not write system files)
chmod 640 /opt/app/.env
chown root:deploy /opt/app/.env
```

### 4. Set Up GitHub Deploy Key for Git Pull

The deploy user needs to pull from GitHub:

```bash
# As the deploy user
su - deploy
ssh-keygen -t ed25519 -C "breyus-server-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
# Add this public key as a Deploy Key in GitHub repo settings (read-only)

# Configure SSH to use this key for GitHub
cat >> ~/.ssh/config << 'EOF'
Host github.com
  IdentityFile ~/.ssh/github_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
```

### 5. Verification

```bash
# Test that deploy user can run Docker
su - deploy -c "docker ps"

# Test GitHub access
su - deploy -c "ssh -T git@github.com"

# Test app directory access
su - deploy -c "cd /opt/app && git status"
```

---

## Phase 3: Configure Object Storage (S3-Compatible)

DigitalOcean Spaces uses the S3 API. Your application accesses storage via HTTP/SDK.

### 1. Install AWS CLI v2 (for testing/management)
```bash
# AWS CLI v2 (recommended — v1 from apt is legacy)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
apt-get install unzip -y
unzip awscliv2.zip
./aws/install
rm -rf awscliv2.zip aws/
aws --version  # Should show aws-cli/2.x
```

### 2. Configure AWS CLI for DigitalOcean Spaces
```bash
aws configure
```
Enter:
-   **AWS Access Key ID**: Your DigitalOcean Spaces Access Key
-   **AWS Secret Access Key**: Your DigitalOcean Spaces Secret Key
-   **Default region name**: `sgp1` (or your storage region)
-   **Default output format**: `json`

### 3. Test Spaces Access
```bash
# Set the DigitalOcean endpoint
export DO_ENDPOINT="https://sgp1.digitaloceanspaces.com"

# List buckets
aws s3 ls --endpoint-url=$DO_ENDPOINT

# You should see: breyus-files
```

### 4. Create Folder Structure
```bash
# Create folders inside the single bucket
aws s3api put-object --bucket breyus-files --key uploads/trade-documents/ --endpoint-url=$DO_ENDPOINT
aws s3api put-object --bucket breyus-files --key uploads/product-images/ --endpoint-url=$DO_ENDPOINT
aws s3api put-object --bucket breyus-files --key uploads/test-reports/ --endpoint-url=$DO_ENDPOINT
aws s3api put-object --bucket breyus-files --key uploads/kyc-documents/ --endpoint-url=$DO_ENDPOINT
aws s3api put-object --bucket breyus-files --key backups/mongodb/ --endpoint-url=$DO_ENDPOINT
aws s3api put-object --bucket breyus-files --key backups/postgres/ --endpoint-url=$DO_ENDPOINT
```

### 5. Bucket Structure
```
breyus-files/                    # Single Space bucket
├── uploads/
│   ├── trade-documents/         # SCO, ICPO, SPA, BoL, Payment Proofs
│   ├── product-images/          # Product photos uploaded by sellers
│   ├── test-reports/            # Quality certificates and test reports
│   └── kyc-documents/           # Company verification documents
└── backups/
    ├── mongodb/                 # Daily MongoDB dumps
    └── postgres/                # Daily PostgreSQL dumps
```

**Note about AI Data:**
The AI pipeline data (normalized trade CSVs) is stored in Google Drive and synced to the server on-demand via a script. This data is then processed and loaded into the PostgreSQL database. Raw AI data is NOT stored on Spaces.

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

**DigitalOcean Spaces (S3-Compatible):**
-   `S3_ENDPOINT=https://sgp1.digitaloceanspaces.com`
-   `S3_REGION=sgp1`
-   `S3_ACCESS_KEY=<your-spaces-access-key>`
-   `S3_SECRET_KEY=<your-spaces-secret-key>`
-   `S3_BUCKET=breyus-files`

**AI Data Pipeline (Google Drive):**
-   `GDRIVE_FOLDER_ID=<your-google-drive-folder-id>`
-   `GDRIVE_CLIENT_ID=<your-oauth-client-id>`
-   `GDRIVE_CLIENT_SECRET=<your-oauth-client-secret>`
-   `GDRIVE_REFRESH_TOKEN=<your-refresh-token>`

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

## Phase 5: AI Data Pipeline Setup

The AI service uses trade data that is stored in Google Drive and processed on the server.

### Data Flow:
```
Google Drive (Normalized CSVs)
       ↓
   [Sync Script]
       ↓
Server Disk (Temporary)
       ↓
   [Pipeline Script]
       ↓
PostgreSQL Database (Permanent)
       ↓
   [Embedding Script]
       ↓
Vector Embeddings in PostgreSQL
```

### Running the Pipeline:
```bash
# 1. Sync data from Google Drive
cd /opt/app/AI_NEW
python -m pipeline.scripts.cli drive-sync

# 2. Run the data pipeline (normalize → load → embed)
python -m pipeline.scripts.cli run-pipeline

# 3. Verify data in PostgreSQL
docker exec -it breyus_postgres psql -U postgres -d breyus_ai -c "SELECT COUNT(*) FROM trade_records;"
```

**Note:** The raw CSV files are temporary and can be deleted after loading into the database. Only the normalized data in PostgreSQL is needed for AI features to work.

---

## Phase 6: SSL Setup (Let's Encrypt)
Since we are using `nginx` in Docker, we need to generate certificates.

**Method 1: Certbot Standalone (Initial Setup)**

For the first certificate generation (before Nginx is configured for HTTPS):
```bash
# Install Certbot
apt install certbot -y

# Stop Nginx temporarily (first time only)
docker stop breyus-nginx-1

# Generate certificates
certbot certonly --standalone -d breyus.com -d api.breyus.com -d admin.breyus.com

# Start Nginx
docker start breyus-nginx-1
```

**Method 2: Certbot Webroot (Renewals — No Downtime)**

After initial setup, use webroot for renewals to avoid stopping Nginx:
```bash
# Create webroot directory
mkdir -p /var/www/certbot

# Add to Nginx config: location /.well-known/acme-challenge/ { root /var/www/certbot; }

# Renew without stopping Nginx
certbot renew --webroot -w /var/www/certbot
```

**Certificate Mount:** Map certs into the Nginx container in `docker-compose.yml`:
```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
  - /var/www/certbot:/var/www/certbot:ro  # For webroot renewals
```

**Auto-Renewal:** Certbot installs a systemd timer by default. Verify with `systemctl list-timers | grep certbot`.

> **Important:** After adding the certbot webroot method, Nginx reload is needed for the new cert: add `--deploy-hook "docker exec breyus_nginx nginx -s reload"` to the certbot renew command.

---

## Phase 7: Maintenance & Troubleshooting

### Server Restarted?
Everything should come back up automatically (`restart: unless-stopped` policy).
-   **Check**: `docker ps`
-   **Storage**: Object Storage is external. Test with: `aws s3 ls --endpoint-url=$DO_ENDPOINT`

### Code Update Failed?
If `./scripts/deploy-backend.sh` fails:
1.  Check git status: `git status` (Did you change files on server locally? Revert them).
2.  Check disk space: `df -h` (Docker fills disks; run `docker system prune -a` if desperate).

### Viewing Logs
-   **Live Logs**: `docker compose logs -f` (All services)
-   **Specific Service**: `docker compose logs -f backend`

---

## Summary Checklist
- [ ] DigitalOcean Premium Droplet created (SGP1 or BLR1)
- [ ] SSH key added & firewall configured (UFW)
- [ ] SSH hardened (root login disabled, key-only, fail2ban)
- [ ] Swap file configured (4GB)
- [ ] Automatic security updates enabled (unattended-upgrades)
- [ ] Docker & Docker Compose installed
- [ ] Node.js 22.x LTS installed (for frontend builds)
- [ ] DigitalOcean Spaces created (single bucket: `breyus-files`)
- [ ] AWS CLI configured for DigitalOcean Spaces
- [ ] Code cloned to `/opt/app`
- [ ] `.env` file created with production values
- [ ] Google Drive API credentials configured for AI pipeline
- [ ] Backend, frontend, and admin portal deploy scripts run successfully
- [ ] AI data pipeline run and verified
- [ ] SSL Certificates generated for all domains
- [ ] All services accessible via HTTPS

## Infrastructure Summary

| Component | Provider | Location | Cost |
|-----------|----------|----------|------|
| VPS | DigitalOcean Premium Droplet | Singapore | $112/mo |
| Object Storage | DigitalOcean Spaces | Singapore | $5/mo |
| **Total** | | | **$117/mo** |

## DigitalOcean Console Links
- **Droplet Management**: https://cloud.digitalocean.com/droplets
- **Spaces (Object Storage)**: https://cloud.digitalocean.com/spaces
- **Billing**: https://cloud.digitalocean.com/account/billing
- **Support**: https://cloud.digitalocean.com/support

## Related
- [[operations/DEPLOYMENT]]
- [[operations/DIGITALOCEAN_HOSTING_BREAKDOWN]]
- [[MOC-Operations]]
