---
type: moc
tags: [moc, operations, index]
---
# MOC: Operations

> Deployment, hosting, infrastructure, backup, and capacity planning documentation.

## Documents
- [[RENDER_DEPLOYMENT_RUNBOOK|Current Render Deployment Runbook]] -- Live portfolio deployment, changes, verification, and rollback
- [[DEPLOYMENT|Target DigitalOcean Architecture]] -- Future production code flow, Docker, Nginx, and CI/CD
- [[SERVER_SETUP|Server Setup]] -- VPS provisioning and configuration
- [[BACKUP_AND_RECOVERY|Backup & Recovery]] -- Database backup strategy and restore procedures
- [[CAPACITY_PLANNING|Capacity Planning]] -- Scaling thresholds and resource planning
- [[DIGITALOCEAN_HOSTING_BREAKDOWN|DigitalOcean Hosting]] -- Cost breakdown and service inventory
- [[CI_CD_PIPELINE|CI/CD Pipeline]] -- GitHub Actions automation for deployments
- [[PRODUCTION_HARDENING|Production Hardening]] -- Pre-production security and reliability checklist
- [[PRODUCTION_CODE_CHECKLIST|Production Code Checklist]] -- Code-level security and quality audit findings
- [[INCIDENT_RESPONSE|Incident Response]] -- Production incident runbooks and escalation procedures
- [[SECRET_MANAGEMENT|Secret Management]] -- Secret storage, rotation, and compromise response
- [[COMPLIANCE_AND_DATA_RETENTION|Compliance & Data Retention]] -- Regulatory framework, data classification, retention policies
- [[DATABASE_MAINTENANCE|Database Maintenance]] -- MongoDB, PostgreSQL, Redis maintenance runbooks
- [[MONITORING_AND_ALERTING|Monitoring & Alerting]] -- Uptime monitoring, alerting strategy, log aggregation
- [[LOAD_TESTING|Load Testing]] -- k6 test scenarios, acceptance criteria, results tracking

## Infrastructure Quick Reference
| Component | Current portfolio deployment | Future production target |
|-----------|------------------------------|--------------------------|
| Application runtime | Render Free web service, Singapore | DigitalOcean Droplet, Singapore |
| Object storage | Cloudflare R2 | DigitalOcean Spaces |
| Main database | MongoDB Atlas Free | Self-hosted MongoDB |
| AI runtime and database | In-app recommendation mode; full AI stack not deployed | FastAPI + PostgreSQL/pgvector |
| Transactional email | Vercel HTTPS relay to Gmail SMTP | Managed transactional email provider |
| Public URL / DNS | `breyus.onrender.com` | Custom domain through Cloudflare |

## Dataview: Operations Docs

```dataview
LIST
FROM "operations"
SORT file.name ASC
```

## Related
- [[MEMORY]]
- [[MOC-Development]]
- [[RENDER_DEPLOYMENT_RUNBOOK]]
- [[DEPLOYMENT]]
