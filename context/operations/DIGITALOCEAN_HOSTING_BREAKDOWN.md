---
type: operations-doc
module: operations
tags: [operations, digitalocean_hosting_breakdown]
date: 2026-03-11
---

# Breyus Platform - Hosting Cost Breakdown

**For:** Breyus Founders
**Last Updated:** March 2026
**Exchange Rate:** ₹92 per USD (March 2026)

---

## Quick Summary

| Item | Monthly Cost (USD) | Monthly Cost (INR) |
|------|-------------------|-------------------|
| Server (DigitalOcean Droplet) | $112 | ₹10,304 |
| Object Storage (DigitalOcean Spaces) | $5 | ₹460 |
| AI API (Claude/Gemini for Market Analysis) | ~$80 | ~₹7,360 |
| Development (Claude Max 5x) | $100 | ₹9,200 |
| **Subtotal** | **$297** | **₹27,324** |
| GST (18% on infrastructure) | ~$21 | ~₹1,938 |
| **Total (estimated)** | **~$318** | **~₹29,262** |

> **Note:** These are estimates. AI API costs are usage-based and may be lower than projected. GST applies to DigitalOcean billing for Indian customers.

---

## Cost Details

### 1. Server (DigitalOcean Droplet) — $112/month (₹10,304)

A VPS running 24/7 hosting all Breyus services via Docker containers.

**Services running via Docker:**

| Component | Purpose |
|-----------|---------|
| Frontend | React app (Buyer/Seller portal) |
| Admin Dashboard | React app (Admin portal) |
| Backend API | NestJS (Business logic, auth, trades) |
| AI Engine | FastAPI (Partner matching, market analysis) |
| MongoDB | Main database (users, companies, products, trades) |
| PostgreSQL + pgvector | AI database (trade history, embeddings) |
| Redis | Cache + session storage |

**Server Specs:**

| Spec | Value |
|------|-------|
| CPU | 8 vCPU (Premium AMD EPYC) |
| RAM | 16 GB |
| Storage | 320 GB NVMe SSD |
| Bandwidth | 6 TB/month |

**Location:** Singapore (SGP1) — 50-80ms latency to India

> **Bangalore (BLR1) Alternative:** DigitalOcean now has a Bangalore datacenter with identical pricing. BLR1 would provide 10-30ms latency to Indian users (2-5x improvement over Singapore). **Evaluate BLR1 before production launch** — verify that Spaces and all required services are available in the region. See "BLR1 vs SGP1" section below.

---

### 2. File Storage (DigitalOcean Spaces) — $5/month (₹460)

S3-compatible object storage for user uploads.

**What gets stored here:**

| Folder | Contents |
|--------|----------|
| `/uploads/trade-documents/` | SCO, ICPO, SPA, Bill of Lading, Payment Proofs |
| `/uploads/product-images/` | Product photos uploaded by sellers |
| `/uploads/test-reports/` | Quality certificates and test reports |
| `/uploads/kyc-documents/` | Company verification documents |
| `/backups/` | Daily MongoDB + weekly PostgreSQL backups |

**Storage Details:**
- 250 GB storage included
- 1 TB monthly data transfer
- CDN included (free)
- Additional storage: $0.02/GB

**Capacity Planning:**
- 6,000 trades/month × 5 documents × 2 MB = ~60 GB/month
- After 12 months: ~720 GB (overage: ~$9.40/month for extra storage)

---

### 3. AI Features for Users (Claude + Gemini API) — ~$80/month (~₹7,360)

AI API costs for the Market Analysis feature. Other AI features use database queries — no API cost.

| Feature | Uses LLM API? | Provider | Cost |
|---------|---------------|----------|------|
| Partner Matching | No (Database lookup) | — | Free |
| Trade Scoring | No (Database calculation) | — | Free |
| Commodity Search | No (Database + embeddings) | — | Free |
| **Market Analysis** | **Yes** | Claude Haiku 4.5 or Gemini Flash | Paid |

**Cost Calculation (using Claude Haiku 4.5 — recommended for cost efficiency):**

| Factor | Value |
|--------|-------|
| Model | Claude Haiku 4.5 ($1/M input, $5/M output) |
| Active AI users | ~200 per month |
| Analyses per user | ~16 per month (3-5 times/week) |
| Cache duration | 2 days (results saved to avoid repeat charges) |
| API calls/month | ~2,240 (after cache savings) |

| Token Type | Amount | Rate (USD) | Cost |
|------------|--------|------------|------|
| Input tokens | 2,240,000 | $1.00/1M | $2.24 |
| Output tokens | 1,792,000 | $5.00/1M | $8.96 |
| **Subtotal** | | | **$11.20** |
| **With safety buffer (3x)** | | | **~$34** |

**Alternative: Gemini Flash** ($0.50/M input, $3.00/M output) would be ~$7.60 before buffer.

**Budget allocation: ~$80/month** covers both Claude and Gemini usage with generous buffer for growth.

> **Previous estimate used Claude 3.5 Sonnet** ($3/M input, $15/M output) which was 3x more expensive. Claude Haiku 4.5 provides sufficient quality for market analysis summaries at 1/3 the cost. If higher quality is needed, Claude Sonnet 4.6 ($3/M input, $15/M output) is available.

---

### 4. Development Tool (Claude Max 5x) — $100/month (₹9,200)

Claude Max 5x subscription for development work via Claude Code.

**Used for:**
- Building new features
- Fixing bugs
- DevOps & server maintenance
- Code reviews & documentation

**Note:** Higher tier (Max 20x at $200/month) available if development volume increases.

---

## Tax Considerations

**GST for Indian billing:** DigitalOcean charges **18% GST** for customers in India. This applies to infrastructure costs (Droplet + Spaces).

| Item | Base Cost | GST (18%) | Total |
|------|-----------|-----------|-------|
| Droplet | ₹10,304 | ₹1,855 | ₹12,159 |
| Spaces | ₹460 | ₹83 | ₹543 |
| **Infrastructure Total** | ₹10,764 | ₹1,938 | **₹12,702** |

> API costs (Claude, Gemini) are billed separately by Anthropic/Google and may have different tax treatment.

---

## Total Monthly Cost

| Item | Monthly (USD) | Monthly (INR) |
|------|--------------|--------------|
| Server (Premium Droplet) | $112 | ₹10,304 |
| File Storage (Spaces) | $5 | ₹460 |
| AI API for Users | ~$80 | ~₹7,360 |
| Development Tool (Claude Max 5x) | $100 | ₹9,200 |
| GST on Infrastructure (18%) | ~$21 | ~₹1,938 |
| **Total** | **~$318** | **~₹29,262** |

**Annual projection: ~₹3,51,144**

---

## BLR1 vs SGP1: Bangalore Datacenter Evaluation

DigitalOcean launched a **Bangalore (BLR1)** datacenter. This changes the latency equation significantly:

| Factor | SGP1 (Singapore) | BLR1 (Bangalore) |
|--------|-------------------|-------------------|
| Latency to Mumbai | 50-80ms | 10-30ms (estimated) |
| Latency to Delhi | 60-90ms | 20-40ms (estimated) |
| Latency to Chennai | 40-70ms | 5-15ms (estimated) |
| Pricing | $112/mo | $112/mo (same) |
| Spaces availability | Yes | Verify before migration |
| Managed DB availability | Yes | Verify before migration |

**Recommendation:** Run latency tests from your target user locations to both SGP1 and BLR1 before choosing. If Spaces is available in BLR1, **BLR1 is the better choice** for an India-focused platform — 2-5x lower latency at identical cost.

**Migration path:** If starting on SGP1, migrating to BLR1 later involves:
1. Create new Droplet in BLR1
2. Restore from backup (see [[operations/BACKUP_AND_RECOVERY]])
3. Update DNS records
4. ~1 hour downtime

---

## Cost Comparison with Alternatives

| Provider | Server (INR) | Storage (INR) | Total Infra (INR) | Latency to India | Notes |
|----------|-------------|--------------|-------------------|-----------------|-------|
| **DigitalOcean BLR1** | ₹10,304 | ₹460 | **₹10,764** + GST | 10-30ms | Best latency if services available |
| **DigitalOcean SGP1 (Current)** | ₹10,304 | ₹460 | **₹10,764** + GST | 50-80ms | Proven, all services available |
| AWS Mumbai | ~₹13,800 | ~₹2,100 | ~₹15,900 | 10-30ms | Lower latency, higher cost |
| Google Cloud Mumbai | ~₹12,900 | ~₹1,850 | ~₹14,750 | 10-30ms | Good but expensive |

**Why DigitalOcean?**
- Best balance of cost and performance
- Simple, predictable pricing (no hidden costs)
- Premium NVMe storage for fast database performance
- Bangalore datacenter now available for lowest latency

---

## Scaling Plan (As We Grow)

| Users | What Changes | Monthly Cost (INR) |
|-------|--------------|-------------------|
| 0 – 500 | Current setup | ~₹29,000 |
| 500 – 2,000 | Same server, optimize code | ~₹29,000 |
| 2,000 – 5,000 | Upgrade to 32GB RAM server (+₹5,200) | ~₹34,000 |
| 5,000 – 10,000 | Add second server + load balancer | ~₹50,000 |
| 10,000+ | Multiple servers, dedicated database | ~₹75,000+ |

---

## Payment & Billing

| Service | Billing Type | Payment |
|---------|--------------|---------|
| DigitalOcean (Server + Storage) | Monthly | Credit Card / PayPal |
| Claude API (AI for Users) | Pay-as-you-go | Credit Card |
| Claude Max (Development) | Monthly subscription | Credit Card |
| Gemini API (AI for Users) | Pay-as-you-go | Credit Card |

> **DigitalOcean reserved pricing** may be available for annual commitments. Check current offerings at [digitalocean.com/pricing](https://www.digitalocean.com/pricing).

---

## Summary Card

```
┌─────────────────────────────────────────────────────────────┐
│              BREYUS HOSTING - QUICK REFERENCE               │
│              Updated: March 2026                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   SERVER                                                    │
│   ├── Provider: DigitalOcean (SGP1, evaluate BLR1)         │
│   ├── Type: Premium Droplet (NVMe AMD)                     │
│   ├── Specs: 8 CPU, 16 GB RAM, 320 GB SSD                 │
│   └── Cost: ₹10,304/month ($112)                          │
│                                                             │
│   STORAGE                                                   │
│   ├── Provider: DigitalOcean Spaces                        │
│   ├── Capacity: 250 GB + 1 TB transfer                    │
│   └── Cost: ₹460/month ($5)                               │
│                                                             │
│   AI (USER FEATURES)                                        │
│   ├── Provider: Anthropic Claude + Google Gemini           │
│   ├── Model: Claude Haiku 4.5 / Gemini Flash              │
│   ├── Feature: Market Analysis only                        │
│   └── Cost: ~₹7,360/month (~$80, usage-based)             │
│                                                             │
│   DEVELOPMENT                                               │
│   ├── Tool: Claude Max 5x subscription                     │
│   └── Cost: ₹9,200/month ($100)                           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   MONTHLY TOTAL:  ~₹29,262 (incl. GST on infra)           │
│   ANNUAL TOTAL:   ~₹3,51,144                               │
│   EXCHANGE RATE:  ₹92 = $1 USD (March 2026)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## FAQs

**Q: Why Singapore and not Bangalore?**
A: DigitalOcean now has a **Bangalore (BLR1) datacenter** which would provide lower latency (10-30ms vs 50-80ms). We recommend evaluating BLR1 availability for Spaces and Managed Databases before choosing. SGP1 is the safe default with all services confirmed available.

**Q: Can we upgrade later?**
A: Yes. DigitalOcean allows resizing droplets with ~1 minute downtime.

**Q: What if AI costs are higher than expected?**
A: We use Claude Haiku 4.5 (cheapest option at $1/$5 per M tokens). With 2-day caching, costs stay low. If costs rise, increase cache duration or switch to Gemini Flash ($0.50/$3 per M tokens) for further savings.

**Q: Is our data safe?**
A: Yes — daily automated MongoDB backups (14-day retention), weekly PostgreSQL backups (4-copy retention), S3 versioning on Spaces, encrypted storage, firewall enabled. See [[operations/BACKUP_AND_RECOVERY]].

**Q: What's included in the $112 server?**
A: All components — frontend, backend, databases (MongoDB, PostgreSQL, Redis), AI engine. No separate database hosting costs.

**Q: What about GST?**
A: DigitalOcean charges 18% GST for Indian customers on infrastructure costs. This adds ~₹1,938/month to the infrastructure bill.

---

## Useful Links

| What | Link |
|------|------|
| DigitalOcean Pricing | https://www.digitalocean.com/pricing |
| DigitalOcean BLR1 Info | https://www.digitalocean.com/blog/introducing-our-bangalore-region-blr1 |
| Claude API Pricing | https://docs.anthropic.com/en/docs/about-claude/pricing |
| Claude Subscriptions | https://claude.ai/pricing |
| Gemini API Pricing | https://ai.google.dev/gemini-api/docs/pricing |

---

## Related

- [[operations/CAPACITY_PLANNING]] — Detailed resource analysis
- [[operations/DEPLOYMENT]] — Architecture and deployment flow
- [[operations/SERVER_SETUP]] — Server provisioning guide
- [[MOC-Operations]]
