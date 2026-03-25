---
type: changelog
date: 2026-03-10
tags: [operations, security, docs]
---

# 2026-03-10: Production Hardening Checklist

## Summary
Created comprehensive pre-production hardening checklist documenting 13 infrastructure issues found during architectural audit of docker-compose.yml, nginx config, storage service, and backup scripts.

## Key Findings

### Critical (5)
- Database ports exposed to internet (MongoDB, PostgreSQL, Redis)
- Hardcoded default credentials in docker-compose.yml
- Redis has no authentication (OTP bypass risk)
- Docker socket mount enables privilege escalation
- No S3 object versioning (permanent data loss risk)

### High (3)
- Missing HSTS header
- Missing Content Security Policy header
- Login rate limit zone defined but never applied

### Medium (5)
- KYC documents served with public cache headers
- No Docker log rotation configured
- AI service start_period may be too short (120s)
- Missing Permissions-Policy header
- Stale Hetzner comment in backup script

## User Decisions
- Document only, no code changes this session
- Keep weekly MongoDB backup frequency
- Enable S3 versioning with 90-day non-current expiry
- Replace Docker socket with Tecnativa docker-socket-proxy

## Files Created/Modified
- `context/operations/PRODUCTION_HARDENING.md` (NEW)
- `context/MOC-Operations.md` (added new doc link)
- `context/SESSION_CONTEXT.md` (updated)
