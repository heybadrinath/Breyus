# Breyus Backup & Recovery Strategy

**Last Updated**: December 24, 2025
**Criticality**: HIGH (Primary Data Safety Net)

---

## 1. The Strategy: "3-2-1" Adapter

Since we are using a **Hetzner Storage Box (10TB)** mounted to the server, our strategy is straightforward but robust:

1.  **Source**: Live Databases (Mongo & Postgres) running in Docker.
2.  **Destination**: `/mnt/storage_box/backups` (The mounted drive).
3.  **Frequency**:
    -   **MongoDB (Main Data)**: Weekly on Sundays at 02:00 UTC (Keep last 4 weeks).
    -   **PostgreSQL (AI Data)**: Monthly on the 1st at 03:00 UTC (Keep **only 1 latest copy**).

### Why this works?
-   **Storage Optimization**: AI data is static-ish, and now MongoDB is also archived weekly to reduce write cycles.
-   **Safety**: MongoDB (User data/Trades) is protected daily.
-   **Cost**: Keeps Storage Box usage efficient.

---

## 2. Implementation: The `backup.sh` Script

We will place this script at `/opt/scripts/backup.sh` on the server.

```bash
#!/bin/bash

# Usage: ./backup.sh [mongo|postgres]

MODE=$1
BACKUP_DIR="/mnt/storage_box/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Validation
if [[ "$MODE" != "mongo" && "$MODE" != "postgres" ]]; then
    echo "Usage: ./backup.sh [mongo|postgres]"
    exit 1
fi

mkdir -p "$BACKUP_DIR/$MODE"

echo "Starting $MODE Backup: $DATE"

# --- MONGODB STRATEGY (Weekly, Keep 4 weeks) ---
if [ "$MODE" == "mongo" ]; then
    CONTAINER="breyus-mongo-1"
    
    echo "Snapshotting MongoDB..."
    docker exec $CONTAINER mongodump --archive --gzip > "$BACKUP_DIR/mongo/mongo_$DATE.gz"
    
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB Backup Success"
        # Retention: Delete older than 30 days (4 weeks)
        find "$BACKUP_DIR/mongo" -name "mongo_*.gz" -mtime +30 -delete
    else
        echo "❌ MongoDB Backup FAILED"
        exit 1
    fi
fi

# --- POSTGRESQL STRATEGY (Monthly, Keep 1) ---
if [ "$MODE" == "postgres" ]; then
    CONTAINER="breyus-postgres-1"
    TARGET_FILE="$BACKUP_DIR/postgres/ai_data_latest.sql.gz"
    TEMP_FILE="$BACKUP_DIR/postgres/temp_backup.sql.gz"

    echo "Snapshotting PostgreSQL..."
    # Dump to temp file first to ensure atomic success
    docker exec $CONTAINER pg_dump -U breyus breyus_ai | gzip > "$TEMP_FILE"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo "✅ PostgreSQL Backup Success"
        # Replace the old 'latest' file with the new one
        mv -f "$TEMP_FILE" "$TARGET_FILE"
        echo "Updated $TARGET_FILE"
    else
        echo "❌ PostgreSQL Backup FAILED"
        rm -f "$TEMP_FILE"
        exit 1
    fi
fi

echo "Backup Complete!"
```

### 🧠 How this script works (Step-by-Step)

1.  **Input Check**: It looks for `$1` (the first argument). If you don't say `mongo` or `postgres`, it stops. Safety first.
2.  **Snapshotting (The "Dump")**:
    *   **Mongo**: It runs `mongodump` *inside* the container, but instead of saving the file *inside* (which would fill up the container), it streams the data (`stdout`) directly to a `.gz` file on your Storage Box.
    *   **Postgres**: Similar concept. It runs `pg_dump`, which outputs raw SQL text. We pipe `|` that text instantly into `gzip`. This means a 40GB database never actually exists as a 40GB file on your hard drive—it becomes a compressed 5-8GB file on the fly.
3.  **Atomic Swapping (Postgres only)**:
    *   It saves to `temp_backup.sql.gz` first.
    *   Only if the backup finishes *completely successfully* does it rename it to `ai_data_latest.sql.gz`.
    *   This prevents you from having a "half-finished" corrupt backup if the internet cuts out.
4.  **Retention (Mongo)**:
    *   The `find ... -delete` command looks at file dates. If a file is older than 30 days, it is removed instantly to free up space.

### Automation (Cron Job)
**Where to run this**: On the **HOST SERVER** (Ubuntu), **NOT** inside the backend container.
*Reason*: The host machine controls Docker (`docker exec`) and holds the mount to the Storage Box.

Run `crontab -e` as root on the server and add these lines:

```cron
# 1. MongoDB: Every Sunday at 02:00 AM
0 2 * * 0 /bin/bash /opt/scripts/backup.sh mongo >> /var/log/breyus_backup_mongo.log 2>&1

# 2. PostgreSQL (AI): 1st day of every month at 03:00 AM
0 3 1 * * /bin/bash /opt/scripts/backup.sh postgres >> /var/log/breyus_backup_ai.log 2>&1
```

---

## 3. Disaster Recovery (The "Oh Sh*t" Protocol)

**Scenario**: The server has crashed/burned. You have provisioned a NEW server (following `SERVER_SETUP.md`) and mounted the Storage Box.

### Step 1: Stop the Application
Ensure no new data is being written (or stop the empty fresh containers).
```bash
docker compose down
```

### Step 2: Restore MongoDB
**What happens here**: We reverse the backup process. We take the compressed file from the Storage Box and stream it back into the container.

1.  **Identify Backup**: Find the latest file in `/mnt/storage_box/backups/mongo/`.
    *   Example: `mongo_20251224_020000.gz`
2.  **Start DB only**:
    ```bash
    docker compose up -d mongo
    ```
    *   *Why?* We need the database running to accept data, but we don't want the Backend running yet (it might crash if DB is empty).
3.  **Restore**:
    ```bash
    # Command Breakdown:
    # 1. 'cat' reads the file from disk
    # 2. '|' pipes it to the docker container
    # 3. 'mongorestore' reads from that pipe and writes to the DB
    cat /mnt/storage_box/backups/mongo/mongo_20251224_020000.gz | docker exec -i breyus-mongo-1 mongorestore --archive --gzip --drop
    ```
    *   `--drop`: **Critical**. This deletes any existing junk data in the DB before restoring, ensuring a clean slate.

### Step 3: Restore PostgreSQL (Critical for AI)
**What happens here**: This is the "Big Data" operation. Since the file is 10GB+ compressed, we unzip it on the fly.

1.  **Identify Backup**: Look for `/mnt/storage_box/backups/postgres/ai_data_latest.sql.gz`.
    *   (There is only one file now).
2.  **Start DB only**:
    ```bash
    docker compose up -d postgres
    ```
3.  **Restore**:
    ```bash
    # Command Breakdown:
    # 1. 'zcat' unzips the file stream (without saving a huge temp file)
    # 2. 'psql' is the command-line DB tool
    # 3. '-d breyus_ai' tells it which database to fill
    zcat /mnt/storage_box/backups/postgres/ai_data_latest.sql.gz | docker exec -i breyus-postgres-1 psql -U breyus -d breyus_ai
    ```
    *   *Note*: This might take 30-60 minutes for 38GB of data. You will see a lot of text scrolling—that is normal.

### Step 4: Verify & Restart
1.  Start full stack:
    ```bash
    docker compose up -d
    ```
2.  Check logs:
    ```bash
    docker compose logs -f backend
    ```

---

## 4. Specific Considerations for Large (38GB) AI DB

### A. Timeout Risks
The `pg_dump` for 40GB might take 30-60 minutes.
-   **Risk**: Docker exec might timeout if the connection is unstable? (Unlikely on local exec).
-   **Mitigation**: The script runs locally on the host, so it is stable.

### B. Disk Space During Restore
When you run `zcat`, the uncompressed SQL is streamed directly to Docker.
-   **Benefit**: You do **NOT** need 40GB of free space on the host to hold the unzipped file. It streams directly from Storage Box -> Memory -> Docker Container.

### C. Weekly/Monthly Retention
The basic script above deletes everything older than 7 days. To keep weeklies/monthlies, we need a slightly smarter rotation script or a separate Cron job:

**Weekly Job (Every Sunday at 03:00)**:
```bash
cp /mnt/storage_box/backups/postgres/latest_daily.gz /mnt/storage_box/backups/weekly/week_$(date +%V).gz
```
*(We can refine the script to handle this if needed, but start with the Daily 7-day safety net).*
