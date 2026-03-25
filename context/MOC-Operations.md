---
type: moc
tags: [moc, operations, index]
---
# MOC: Operations

> Deployment, hosting, infrastructure, backup, and capacity planning documentation.

## Documents
- [[DEPLOYMENT|Deployment Architecture]] -- Code flow, Docker, Nginx, CI/CD
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
| Component | Provider | Region |
|-----------|----------|--------|
| VPS | DigitalOcean Droplet | Singapore |
| Object Storage | DigitalOcean Spaces | Singapore |
| DNS | Cloudflare | Global |
| Database | MongoDB (self-hosted) | Singapore |
| AI Database | PostgreSQL + pgvector | Singapore |

## Dataview: Operations Docs

```dataview
LIST
FROM "operations"
SORT file.name ASC
```

## Related
- [[MEMORY]]
- [[MOC-Development]]
- [[DEPLOYMENT]]
