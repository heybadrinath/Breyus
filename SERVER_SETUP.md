# Production Server Setup Guide (End-to-End)

This guide covers everything required to take a fresh **Hetzner Cloud Server (CPX41)** and turn it into the production host for **Breyus**.

## Prerequisites
1.  **Hetzner Account**: Access to Cloud Console and Robot (for Storage Box).
2.  **Domain Name**: Access to your DNS provider (e.g., Godaddy, Cloudflare).
3.  **SSH Key**: Your local public key (`id_rsa.pub`) ready to copy.

---

## Phase 1: Provisioning Infrastructure

### 1. Create the Server
-   **Server Type**: CX41 / CPX41 (Start smaller if you want, upgrade later).
-   **Image**: **Ubuntu 24.04** (Recommended) or 22.04.
-   **Location**: Choose one closest to your users (e.g., Falkenstein or Helsinki).
-   **SSH Key**: Add your public key during creation. **Do not rely on email passwords.**
-   **Networking**: Enable "Public IPv4".

### 2. Create the Storage Box
-   Order a **Storage Box BX11**.
-   **Important**: Enable "Samba / CIFS" support in the Storage Box settings.
-   Set a generic password for the storage box and note the `<username>.your-storagebox.de` address.

### 3. DNS Configuration
Go to your domain registrar and set an **A Record**:
-   **Name**: `api` (e.g., `api.breyus.com`)
-   **Value**: `<Your-Hetzner-Server-IP>`
-   *Note: Frontend is handled by Vercel, so no A record needed for `www` pointing here.*

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

### 3. **Verification** (Do not skip)
Run this command to make sure Docker is alive:
```bash
docker run hello-world
```
*If you see "Hello from Docker!", you are ready.*
```

---

## Phase 3: Mounting the Storage Box

We will mount the Storage Box to `/mnt/storage_box` so it acts like a local folder.

1.  **Install Helpers**:
    ```bash
    apt-get install cifs-utils -y
    ```
2.  **Create Credentials File**:
    ```bash
    nano /etc/smbcredentials
    ```
    Add this content (replace with your storage box details):
    ```
    username=<u123456>
    password=<your-password>
    ```
    Secure it:
    ```bash
    chmod 600 /etc/smbcredentials
    ```
3.  **Add to fstab (Auto-mount on boot)**:
    ```bash
    nano /etc/fstab
    ```
    Add this line at the bottom:
    ```
    //<username>.your-storagebox.de/backup /mnt/storage_box cifs credentials=/etc/smbcredentials,uid=1000,gid=1000,file_mode=0660,dir_mode=0770 0 0
    ```
4.  **Mount**:
    ```bash
    mkdir -p /mnt/storage_box
    mount -a
    # Verify it works
    ls -la /mnt/storage_box
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
-   `MONGODB_URI=mongodb://mongo:27017/breyus` (Must use container name `mongo`)
-   `REDIS_URL=redis://redis:6379`
-   `AI_SERVICE_URL=http://ai-service:8000`
-   `CORS_ORIGIN=https://breyus.vercel.app`
-   `POSTGRES_HOST=postgres`

### 3. Start the Application
Run the deploy script (or manually the first time).
```bash
chmod +x deploy.sh
./deploy.sh
```
*Note: This builds the containers. It might take 5-10 minutes the first time.*

### 4. **Verification**
Check if containers are up:
```bash
docker ps
```
You should see: `nginx`, `backend`, `ai-service`, `mongo`, `postgres`, `redis`.

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
    certbot certonly --standalone -d api.breyus.com
    ```
4.  The certs will be in `/etc/letsencrypt/live/api.breyus.com/`.
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
-   **Storage**: Check `ls /mnt/storage_box` (Auto-mounted by fstab).

### Code Update Failed?
If `./deploy.sh` fails:
1.  Check git status: `git status` (Did you change files on server locally? Revert them).
2.  Check disk space: `df -h` (Docker fills disks; run `docker system prune -a` if desperate).

### Viewing Logs
-   **Live Logs**: `docker compose logs -f` (All services)
-   **Specific Service**: `docker compose logs -f backend`

---

## Summary Checklist
- [ ] Server created & SSH secured.
- [ ] Docker installed.
- [ ] Storage Box mounted at `/mnt/storage_box`.
- [ ] Code cloned to `/opt/app`.
- [ ] `.env` file created with production values.
- [ ] `deploy.sh` run successfully.
- [ ] SSL Certificates generated.
- [ ] Frontend on Vercel pointed to `https://api.breyus.com`.
