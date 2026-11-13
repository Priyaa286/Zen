# ZEN GLOBAL – DISASTER RECOVERY & BUSINESS CONTINUITY PLAN (DRP)

**Document ID:** SEC-DRP-2026-11  
**Scope:** Zen Global Application, Database, Static Assets & Payment Services  
**Standard:** ISO 22301 / NIST SP 800-34 Rev. 1  
**Classification:** Operational Infrastructure Specification  

---

## 1. Objectives & Metrics

| Metric | Target SLA | Definition |
| :--- | :---: | :--- |
| **Recovery Point Objective (RPO)** | **< 1 Hour** | Maximum acceptable data loss duration measured from the point of failure. |
| **Recovery Time Objective (RTO)** | **< 30 Minutes** | Maximum acceptable duration to restore full operational service. |
| **Availability Target** | **99.9%** | Platform uptime target across commerce, checkout, and AI routing. |

---

## 2. Backup Strategy & Automation

### 2.1. Primary Database Backup (SQLite / PostgreSQL)
1. **SQLite WAL Mode Checkpoint:**
   Zen utilizes SQLite with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`), ensuring atomic transactions and lock-free read consistency during hot backups.
2. **Automated Snapshot Schedule:**
   - **Hourly Incremental Snapshots:** Exported using SQLite online backup API (`VACUUM INTO '/backups/zen_backup_<timestamp>.db'`).
   - **Daily Full Backups:** Compressed with gzip, encrypted with AES-256 (`gpg --symmetric --cipher-algo AES256`), and replicated to geo-redundant offsite storage.
3. **Retention Policy:**
   - Hourly snapshots: Retained for 48 hours.
   - Daily backups: Retained for 30 days.
   - Monthly compliance archives: Retained for 365 days.

### 2.2. Media & Static Assets Backup
- Directory: `Zen/backend/static/uploads/`
- Synchronization: Incremental sync every 6 hours to immutable object storage with versioning enabled (prevents ransomware overwrite).

### 2.3. Configuration & Infrastructure State
- Dockerfiles, Nginx configurations, and environment templates are version-controlled in the private Git repository.
- Secrets are backed up in an encrypted HashiCorp Vault / AWS Secrets Manager store.

---

## 3. Step-by-Step Restoration Procedure

### Step 1: Prepare Clean Target Host
```bash
# Verify Docker and Docker Compose availability
docker --version
docker-compose --version
```

### Step 2: Restore Configuration & Environment
```bash
# Clone clean repository
git clone https://github.com/zen-global/zen.git /app/zen
cd /app/zen

# Decrypt production environment file
gpg --decrypt /safe/secrets/.env.production.gpg > Zen/backend/.env
cp Zen/backend/.env Zen/.env
```

### Step 3: Restore Database Snapshot
```bash
# Verify backup integrity and decrypt
gpg --decrypt /backups/zen_backup_latest.db.gpg > /tmp/zen_restored.db

# Integrity check using SQLite CLI
sqlite3 /tmp/zen_restored.db "PRAGMA integrity_check;"
# Output must read: "ok"

# Move restored database into persistent volume
mkdir -p /app/zen/Zen/backend/data
cp /tmp/zen_restored.db /app/zen/Zen/backend/data/zen.db
```

### Step 4: Restore Media Assets
```bash
# Sync static media uploads
mkdir -p /app/zen/Zen/backend/static/uploads
tar -xzf /backups/zen_uploads_latest.tar.gz -C /app/zen/Zen/backend/static/uploads/
```

### Step 5: Launch Containers & Validate Health Probes
```bash
cd /app/zen/Zen
docker-compose up -d --build

# Probe liveness and deep readiness
curl -f http://localhost:8000/health/live
curl -f http://localhost:8000/health/ready
```

---

## 4. Disaster Recovery Testing & Verification

1. **Annual Simulation:** Scheduled disaster recovery game-day testing every 6 months in an isolated staging environment.
2. **Automated Verification Script:** A CI pipeline task automatically restores the latest database snapshot into a scratch SQLite database and executes `pytest tests/test_production_e2e.py` to confirm transaction integrity.

