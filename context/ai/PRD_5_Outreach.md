---
type: prd
module: ai
tags: [ai, prd, outreach, email, acquisition]
---

# PRD: Outreach & Trader Acquisition (Stage 5)

> **Document Type:** Product Requirements Document (PRD)
> **Version:** 1.0
> **Last Updated:** March 2026
> **Status:** Implementation Ready
> **Depends On:** Stage 2/3 (Contact Discovery) — specifically `buyer_contacts` and `seller_contacts` tables

---

## Table of Contents

1. [Background & Purpose](#1-background--purpose)
2. [Scope Definition](#2-scope-definition)
3. [Core Design Philosophy](#3-core-design-philosophy)
4. [Email Infrastructure](#4-email-infrastructure)
5. [Drip Sequence Design](#5-drip-sequence-design)
6. [Template Variables](#6-template-variables)
7. [Email Template Design](#7-email-template-design)
8. [Campaign Management](#8-campaign-management)
9. [Future Channels (Vision)](#9-future-channels-vision)
10. [Tracking & Analytics](#10-tracking--analytics)
11. [Database Schema](#11-database-schema)
12. [API Endpoints](#12-api-endpoints)
13. [Admin UI](#13-admin-ui)
14. [Compliance](#14-compliance)
15. [Folder Structure & Implementation Phases](#15-folder-structure--implementation-phases)
16. [Success Criteria & Risks](#16-success-criteria--risks)
17. [Document Control & Related](#17-document-control--related)

---

## 1. Background & Purpose

The Outreach module is the **trader acquisition engine** of the Breyus Niche Commodity system. It consumes the buyer and seller contacts discovered in Stage 2/3 and converts them into platform signups through automated, personalized email campaigns.

This module exists to answer one core question:

**"How do we convert discovered contacts into Breyus platform users at a 5-15% signup rate, while maintaining compliance and deliverability?"**

### 1.1 Key Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| **Admins** | Create/manage campaigns, monitor conversion rates, pause/resume outreach |
| **System** | Automated drip scheduling, bounce handling, suppression list management |
| **Discovered Contacts** | Receive relevant, non-spammy outreach about commodities they trade |
| **Platform** | New user acquisition for niche commodity verticals |

### 1.2 Dependency Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STAGE 5 DEPENDENCY MAP                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Stage 1: Government Data Extraction                                        │
│      │                                                                      │
│      ├── approved_commodities table (commodity metadata)                    │
│      │                                                                      │
│      ▼                                                                      │
│  Stage 2/3: Contact Discovery                                               │
│      │                                                                      │
│      ├── buyer_contacts table (emails, companies, quality scores)           │
│      ├── seller_contacts table (emails, companies, quality scores)          │
│      │                                                                      │
│      ▼                                                                      │
│  Stage 4: Market Intelligence                                               │
│      │                                                                      │
│      ├── predictions table (price forecasts — used in Email 2 content)     │
│      │                                                                      │
│      ▼                                                                      │
│  Stage 5: Outreach & Trader Acquisition (THIS PRD)                         │
│      │                                                                      │
│      ├── Campaign creation from Stage 2/3 contacts                         │
│      ├── Personalized email drip sequences (3 emails over 22 days)         │
│      ├── Open/click/bounce tracking                                        │
│      ├── Unsubscribe handling + global suppression list                    │
│      └── Admin dashboard for campaign management                           │
│                                                                              │
│  Full vision: Email → WhatsApp → LinkedIn → Follow-up (4-channel drip)     │
│  v1 scope: EMAIL ONLY                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Conversion Funnel

```
Stage 2/3 Contacts (filtered by quality score >= 45)
    │
    ▼
Email 1: Introduction + Value Prop (Day 1)
    │   Expected: 25-35% open rate, 5-10% click rate
    ▼
Email 2: Market Intelligence Teaser (Day 8)
    │   Expected: 20-30% open rate, 8-12% click rate
    ▼
Email 3: Urgency + Final Push (Day 22)
    │   Expected: 15-25% open rate, 3-8% click rate
    ▼
Platform Signup
    Target: 5-15% of contacted leads sign up
```

---

## 2. Scope Definition

### 2.1 In Scope (v1 — Email Only)

- Email drip sequences (3 emails per contact over 22 days)
- Separate buyer and seller drip templates with per-commodity personalization
- Send scheduling with rate limiting and batch processing
- Open/click/bounce/unsubscribe tracking
- Global suppression list (hard bounces + unsubscribes)
- Per-commodity campaign management (create, start, pause, resume, cancel)
- Global emergency stop (pause all outreach)
- Admin dashboard for campaign metrics
- Minimum contact quality score threshold before outreach (default: 45)
- Domain deliverability setup (SPF, DKIM, DMARC)
- Domain warmup strategy

### 2.2 Out of Scope (v1)

| Feature | Planned Phase | Notes |
|---------|---------------|-------|
| WhatsApp Business API | Phase 2 | WATI/Interakt integration |
| LinkedIn outreach | Phase 3 | Sales Navigator or manual |
| SMS gateway | Phase 3 | MSG91/Twilio for high-value contacts |
| A/B testing | v2 | Subject line and content variants |
| Custom landing pages per commodity | v2 | Dedicated signup pages |
| AI-generated subject lines | v2 | LLM-optimized copy |
| Multi-language templates | v2 | Currently English only |
| Webhook-based event tracking | v2 | Currently polling/pixel-based |

---

## 3. Core Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| **Compliance-first** | CAN-SPAM + India DPDP Act compliance baked into every send; mandatory unsubscribe; global suppression list checked before every email |
| **Personalization per commodity + role** | Buyer templates emphasize supplier discovery and price advantage; seller templates emphasize demand signals and buyer counts |
| **Every email is measurable** | Tracking pixel for opens, redirect URLs for clicks, bounce webhooks, unsubscribe tracking — no email sent without full observability |
| **Admin-controlled** | Pause/resume per commodity, per campaign, or globally; no autonomous escalation without admin action |
| **Quality contacts only** | Minimum quality score threshold (configurable, default 45) from Stage 2/3 before any contact enters an outreach campaign |
| **Deliverability over volume** | Domain warmup, rate limiting, clean list hygiene — protect sender reputation above all else |
| **Reuse existing infrastructure** | Build on `backend/src/mail/mail.service.ts` (Nodemailer/SMTP) and `backend/src/mail/templates/email.templates.ts` for v1; don't introduce new email providers until volume demands it |

---

## 4. Email Infrastructure

### 4.1 Sending Stack

**v1 Architecture:**

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  AI_NEW      │────▶│  NestJS Backend  │────▶│  SMTP Server    │
│  (Campaign   │     │  mail.service.ts │     │  (Gmail/Workspace│
│   Manager)   │     │  (Nodemailer)    │     │   or SendGrid)  │
└──────────────┘     └──────────────────┘     └─────────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐     ┌──────────────────┐
│  PostgreSQL  │     │  Tracking Pixel  │
│  (campaigns, │     │  + Redirect URLs │
│   emails)    │     │  (NestJS routes) │
└──────────────┘     └──────────────────┘
```

- **v1:** SMTP via existing `mail.service.ts` (Nodemailer). The AI_NEW server manages campaign logic and scheduling; NestJS handles the actual email dispatch via its existing mail infrastructure.
- **Scale path:** When daily volume exceeds 500, migrate to SendGrid or Mailgun with dedicated API integration. The `mail.service.ts` abstraction makes this a provider swap, not an architecture change.

### 4.2 Daily Sending Limits

| Provider | Daily Limit | Monthly Cost | When to Use |
|----------|-------------|--------------|-------------|
| Gmail SMTP | 500/day | Free | v1 launch, < 500 contacts/day |
| Google Workspace | 2,000/day | ~$6/user/month | Early growth, < 2K contacts/day |
| SendGrid (Free) | 100/day | Free | Testing only |
| SendGrid (Essentials) | 100,000/day | ~$20/month | Production scale |
| Mailgun (Flex) | Unlimited | $0.80/1000 emails | Alternative to SendGrid |

**v1 target:** Stay within Gmail/Workspace limits. Batch campaigns to respect daily caps.

### 4.3 Domain & Deliverability

**Sender identity:**
- From: `outreach@breyus.com` (not `noreply@`)
- Reply-To: `hello@breyus.com` (monitored inbox)
- Display Name: `Breyus Trade Intelligence`

**DNS records required before first send:**

| Record | Type | Purpose |
|--------|------|---------|
| SPF | TXT | `v=spf1 include:_spf.google.com ~all` |
| DKIM | TXT | Domain-specific signing key from provider |
| DMARC | TXT | `v=DMARC1; p=none; rua=mailto:dmarc@breyus.com` (start with `none`, move to `quarantine` after warmup) |

**Domain warmup strategy:**

| Week | Daily Volume | Notes |
|------|-------------|-------|
| 1 | 50/day | Known-good addresses only (internal + opted-in) |
| 2 | 75/day | +50% increase |
| 3 | 100/day | Begin monitoring bounce rates |
| 4 | 150/day | If bounce rate < 3%, continue scaling |
| 5 | 200/day | Monitor spam folder placement |
| 6+ | +25%/week | Scale until hitting provider limit |

**Hard rule:** If bounce rate exceeds 5% at any point, pause all sends for 48 hours and clean the list.

### 4.4 Bounce Handling

| Bounce Type | Action | Timeline |
|-------------|--------|----------|
| **Hard bounce** (invalid address, domain not found) | Mark contact as `invalid`, add to suppression list, remove from all future sends | Immediate |
| **Soft bounce** (mailbox full, server timeout) | Retry up to 3 times | Retry at +4h, +24h, +72h |
| **Soft bounce (3x failed)** | Mark as `undeliverable`, exclude from current campaign | After 72h |
| **Spam complaint** | Add to suppression list, remove from all future sends | Immediate |

---

## 5. Drip Sequence Design

### 5.1 Buyer Drip Sequence (3 Emails, 22 Days)

#### Email 1 — Day 1: Introduction + Value Prop

**Subject:** `{commodity_name} suppliers found — prices 20-30% below market`

**Content structure:**
```
Hi {contact_name},

We identified {supplier_count} verified suppliers of {commodity_name}
with pricing averaging {avg_price} — significantly below the current
market rate.

Here's what we found for {company_name}:

  • {supplier_count} active suppliers across {supplier_countries}
  • Average pricing: {avg_price} ({price_advantage} below market)
  • Suppliers verified through government trade records

Breyus is a B2B commodity trading platform where you can connect with
these suppliers directly, negotiate terms, and complete trades — all
in one place.

Join free and get:
  ✓ Direct access to verified {commodity_name} suppliers
  ✓ Monthly price forecasts and market intelligence
  ✓ Negotiation tools with Incoterm support

[Join Breyus Free →] {signup_url}

No credit card required. Takes 2 minutes.

Best,
The Breyus Trade Intelligence Team
```

**Template key:** `buyer_intro`

---

#### Email 2 — Day 8: Market Intelligence Teaser

**Subject:** `This month's {commodity_name} forecast — should you buy now?`

**Content structure:**
```
Hi {contact_name},

Our AI analyzed {data_points} trade data points for {commodity_name}
this month. Here's a preview:

  📊 Price direction: {price_direction} ({predicted_change})
  📈 Demand trend: {demand_direction}
  ⚠️ Key risk: {top_risk_factor}

Full analysis includes:
  • 30-day price prediction with confidence score
  • Top exporting countries ranked by reliability
  • Supply chain risk assessment
  • Seasonal buying window recommendation

Breyus members get this report every month — for every commodity
they follow.

[View Full Analysis →] {signup_url}

Already have hundreds of {commodity_name} buyers and sellers
active on the platform.

Best,
The Breyus Trade Intelligence Team
```

**Template key:** `buyer_intelligence`

---

#### Email 3 — Day 22: Urgency + Final Push

**Subject:** `Last chance: {commodity_name} supplier access closing for new signups`

**Content structure:**
```
Hi {contact_name},

Quick follow-up — we're closing {commodity_name} supplier access
for new signups this month to maintain quality matches.

What you're missing:
  • {supplier_count} suppliers you could be negotiating with today
  • This month's price forecast (members already acting on it)
  • Direct messaging with verified traders

[Claim Your Free Spot →] {signup_url}

This is the last email we'll send about this. If {commodity_name}
sourcing isn't a priority right now, no worries — we won't follow
up again.

Best,
The Breyus Trade Intelligence Team
```

**Template key:** `buyer_urgency`

---

### 5.2 Seller Drip Sequence (3 Emails, 22 Days)

#### Email 1 — Day 1: Demand Signal

**Subject:** `{buyer_count} companies looking for your {commodity_name} — this month`

**Content structure:**
```
Hi {contact_name},

We found {buyer_count} verified companies actively looking to
purchase {commodity_name} — and your company ({company_name})
matches what they need.

Buyer demand snapshot:
  • {buyer_count} active buyers across {top_buyer_countries}
  • Top importing countries: {top_buyer_countries}
  • Demand trend: {demand_direction} over last 3 months

List your {commodity_name} on Breyus (free) and we'll match you
with these buyers automatically.

What you get:
  ✓ Direct access to verified {commodity_name} buyers
  ✓ Free product listing with full Incoterm support
  ✓ Negotiation tools and trade document management
  ✓ Monthly demand forecasts for your commodities

[List Free on Breyus →] {signup_url}

No subscription fees. No commission on your first 3 trades.

Best,
The Breyus Trade Intelligence Team
```

**Template key:** `seller_demand`

---

#### Email 2 — Day 8: Competitor Activity

**Subject:** `Your competitor just listed {commodity_name} on Breyus`

**Content structure:**
```
Hi {contact_name},

Heads up — {competitor_count} suppliers in your space have listed
{commodity_name} on Breyus in the last 30 days. They're getting
matched with buyers you could be selling to.

Platform activity for {commodity_name}:
  • {competitor_count} suppliers now active
  • {buyer_count} buyers submitted purchase requests this month
  • Average deal size: {avg_deal_size}

The suppliers already on Breyus are receiving buyer inquiries
directly. Early listers get matched first.

[List Your Products →] {signup_url}

Takes 5 minutes. Free forever.

Best,
The Breyus Trade Intelligence Team
```

**Template key:** `seller_competitor`

---

#### Email 3 — Day 22: Free Listing Final Push

**Subject:** `Free listing offer: {commodity_name} on Breyus`

**Content structure:**
```
Hi {contact_name},

Last note from us — we're currently offering free listings for
{commodity_name} suppliers.

The opportunity:
  • {buyer_count} buyers waiting for suppliers like you
  • Free listing (no subscription, no hidden fees)
  • Full trade lifecycle support (PR → SCO → ICPO → completion)

[Claim Your Free Listing →] {signup_url}

This is our last email. If selling {commodity_name} online isn't
a priority right now, we understand — we won't email again.

Best,
The Breyus Trade Intelligence Team
```

**Template key:** `seller_final`

---

## 6. Template Variables

### 6.1 Complete Variable Reference

| Variable | Source | Used In | Fallback |
|----------|--------|---------|----------|
| `{contact_name}` | `buyer_contacts.contact_name` or `seller_contacts.contact_name` | All emails | `"there"` (e.g., "Hi there") |
| `{company_name}` | `buyer_contacts.company_name` or `seller_contacts.company_name` | Email 1 (both) | Omit the company reference line |
| `{commodity_name}` | `approved_commodities.name` via campaign | All emails | **Required — no fallback** |
| `{supplier_count}` | Count from `seller_contacts` for this commodity | Buyer emails 1, 3 | `"multiple"` |
| `{buyer_count}` | Count from `buyer_contacts` for this commodity | Seller emails 1, 2, 3 | `"several"` |
| `{avg_price}` | Computed from Stage 2/3 pricing data | Buyer email 1 | Omit the pricing line |
| `{price_advantage}` | Computed: market price - avg discovered price | Buyer email 1 | `"significantly"` |
| `{supplier_countries}` | Distinct countries from `seller_contacts` | Buyer email 1 | Omit the geography line |
| `{top_buyer_countries}` | Distinct countries from `buyer_contacts` | Seller email 1 | `"multiple countries"` |
| `{price_direction}` | From Stage 4 latest prediction | Buyer email 2 | `"Trending"` |
| `{predicted_change}` | From Stage 4 latest prediction | Buyer email 2 | Omit the percentage |
| `{demand_direction}` | From Stage 4 latest prediction | Buyer email 2, Seller email 1 | `"growing"` |
| `{top_risk_factor}` | From Stage 4 latest prediction | Buyer email 2 | `"Supply chain volatility"` |
| `{data_points}` | Count of trade records analyzed | Buyer email 2 | `"thousands of"` |
| `{competitor_count}` | Count of active sellers for commodity on platform | Seller email 2 | `"several"` |
| `{avg_deal_size}` | Average trade value for commodity | Seller email 2 | Omit the line |
| `{signup_url}` | Generated URL with UTM params + tracking ID | All emails | `https://breyus.com/onboarding` |
| `{unsubscribe_url}` | Generated per-contact unsubscribe link | All emails (footer) | **Required — no fallback** |

### 6.2 UTM Parameter Format

All signup URLs include tracking parameters:

```
https://breyus.com/onboarding
  ?utm_source=outreach
  &utm_medium=email
  &utm_campaign={campaign_id}
  &utm_content={template_key}
  &ref={email_id}
```

This enables tracking the full funnel from email click to platform signup.

---

## 7. Email Template Design

### 7.1 Design Principles

- **Plain text with minimal HTML** — better deliverability, fewer spam triggers
- **Mobile-responsive single-column layout** — 600px max width
- **No heavy images** — Breyus logo at top (hosted, not embedded), no other images
- **Clear CTA button** — single primary action per email, contrasting color
- **Unsubscribe link at bottom** — visible, one-click, no login required
- **Physical address** — CAN-SPAM requirement in footer

### 7.2 Template Structure (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">

  <!-- Logo -->
  <img src="https://breyus.com/assets/logo.png" alt="Breyus" width="120" style="margin-bottom: 24px;">

  <!-- Body content (personalized per template) -->
  {email_body}

  <!-- CTA Button -->
  <a href="{signup_url}" style="display: inline-block; background: #2563eb; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 24px 0;">
    {cta_text}
  </a>

  <!-- Footer -->
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;">
  <p style="font-size: 12px; color: #9ca3af;">
    Breyus Technologies Pvt. Ltd.<br>
    {physical_address}<br><br>
    You received this email because your company was identified as a
    {commodity_name} trader through public trade records.<br><br>
    <a href="{unsubscribe_url}" style="color: #9ca3af;">Unsubscribe</a> from
    future emails about this commodity.
  </p>

  <!-- Tracking pixel (1x1 transparent) -->
  <img src="{tracking_pixel_url}" width="1" height="1" style="display:none;" alt="">

</body>
</html>
```

### 7.3 Plain Text Fallback

Every email includes a `text/plain` MIME part with the same content, minus HTML tags. This is required for deliverability — email clients that block HTML still render the plain text version.

---

## 8. Campaign Management

### 8.1 Campaign Structure

- **One campaign per commodity** — a campaign targets all discovered buyers and sellers for a specific niche commodity
- **Campaign contacts** pulled from Stage 2/3 `buyer_contacts` and `seller_contacts` tables
- **Minimum quality score:** 45 (configurable via admin Settings, stored in `outreach_config`)
- **Max contacts per campaign:** 1,000 (configurable) — prevents runaway sends
- **Deduplication:** If a contact appears in multiple commodity campaigns, they receive the first campaign only (suppress duplicates across active campaigns)

### 8.2 Campaign State Machine

```
              create
                │
                ▼
          ┌──────────┐
          │  DRAFT   │
          └────┬─────┘
               │ start
               ▼
          ┌──────────┐     pause      ┌──────────┐
          │  ACTIVE  │───────────────▶│  PAUSED  │
          └────┬─────┘                └────┬─────┘
               │                           │ resume
               │                           ▼
               │                     ┌──────────┐
               │◄────────────────────│  ACTIVE  │
               │                     └──────────┘
               │ all emails sent
               ▼
          ┌───────────┐
          │ COMPLETED │
          └───────────┘
```

**State transitions:**

| From | To | Trigger | Validation |
|------|----|---------|------------|
| `draft` | `active` | Admin clicks "Start" | At least 1 contact, commodity exists, sending limits configured |
| `active` | `paused` | Admin clicks "Pause" or global pause | None |
| `paused` | `active` | Admin clicks "Resume" | Global pause not active |
| `active` | `completed` | All Email 3s sent or all contacts processed | Automatic |
| Any | `draft` | Admin clicks "Cancel" (deletes unsent emails) | Confirmation required |

### 8.3 Send Scheduling

**Optimal send windows:**
- Default: 10:00 AM recipient local time (when detectable), otherwise 10:00 AM IST
- Preferred days: Tuesday, Wednesday, Thursday (highest B2B open rates)
- Avoid: Friday afternoon, weekends, major holidays

**Batch processing (v1):**
- Batch size: 50 emails per batch
- Batch interval: 2 minutes between batches (to stay within SMTP rate limits)
- Daily cap check: Before each batch, verify remaining daily quota
- If daily cap reached: Queue remaining for next day

**Scheduling algorithm:**
```
1. Campaign starts → generate all Email 1s for contacts (status: pending)
2. Cron job runs every 15 minutes
3. For each pending email where scheduled_at <= now:
   a. Check global suppression list
   b. Check daily sending limit
   c. Check contact hasn't unsubscribed
   d. Send email, update status
4. After Email 1 delivered → schedule Email 2 for Day 8
5. After Email 2 delivered → schedule Email 3 for Day 22
6. If contact clicks signup_url at any point → cancel remaining emails
```

### 8.4 Admin Controls

| Control | Scope | Effect |
|---------|-------|--------|
| **Start Campaign** | Per-commodity | Begins drip for all contacts in campaign |
| **Pause Campaign** | Per-commodity | Stops all pending sends; resumes where it left off |
| **Resume Campaign** | Per-commodity | Re-activates paused campaign |
| **Cancel Campaign** | Per-commodity | Deletes all unsent emails, moves campaign to draft |
| **Pause All Outreach** | Global | Emergency stop — pauses ALL active campaigns immediately |
| **Resume All Outreach** | Global | Re-activates all campaigns that were active before global pause |
| **Skip Contact** | Per-contact | Removes individual contact from campaign without unsubscribing globally |
| **Resend Email** | Per-email | Re-sends a specific email (e.g., after soft bounce resolution) |

---

## 9. Future Channels (Vision)

> **Note:** This section documents the full multi-channel vision. Only Email (Section 5) is in v1 scope. Everything below is Phase 2+.

### 9.1 WhatsApp Business API (Phase 2)

| Aspect | Detail |
|--------|--------|
| **Provider** | WATI or Interakt (both support India + international) |
| **Message type** | Template messages (pre-approved by WhatsApp) |
| **Drip position** | Day 8 (parallel with Email 2, or replace it for contacts with phone numbers) |
| **Opt-in** | Required by WhatsApp Business Policy — initial message must be transactional or user-initiated |
| **Expected conversion** | 10-20% (significantly higher than email due to higher open rates) |
| **Cost** | ~$0.05-0.10 per message (varies by country) |

**Phase 2 drip sequence with WhatsApp:**
```
Day 1:  Email 1 (Introduction)
Day 8:  WhatsApp message (Market Intelligence teaser) — if phone available
Day 8:  Email 2 (fallback if no phone number)
Day 15: LinkedIn connection (Phase 3)
Day 22: Email 3 (Final push)
```

**Template message example (pre-approved):**
```
Hi {contact_name}! 📊 {commodity_name} prices are {price_direction}
{predicted_change} this month. {buyer_count} buyers on Breyus are
looking for suppliers like you. List free: {signup_url}
```

### 9.2 LinkedIn Outreach (Phase 3)

| Aspect | Detail |
|--------|--------|
| **Method** | LinkedIn Sales Navigator API or semi-automated manual outreach |
| **Drip position** | Day 15 (between Email 2 and Email 3) |
| **Action** | Personalized connection request + follow-up message after acceptance |
| **Rate limit** | ~100 connection requests/week (LinkedIn enforced) |
| **Cost** | Sales Navigator: ~$80/month |

**Connection request template:**
```
Hi {contact_name}, I noticed {company_name} works with {commodity_name}.
We've identified {buyer_or_supplier_count} potential trade partners
for you on Breyus. Would love to connect and share the details.
```

### 9.3 SMS Gateway (Phase 3)

| Aspect | Detail |
|--------|--------|
| **Provider** | MSG91 (India-focused) or Twilio (international) |
| **Use case** | High-value contacts only (quality score >= 80) |
| **Message type** | Transactional SMS with commodity + CTA |
| **Cost** | ~$0.01-0.05 per SMS (varies by country) |
| **Compliance** | DND registry check required (India), TCPA (US) |

### 9.4 Follow-up Email (Phase 4)

A fourth email sent 45 days after initial contact, only to contacts who opened but did not sign up:

**Subject:** `Missed our offer? {commodity_name} suppliers still available`

This email re-engages warm leads with updated data (new supplier/buyer counts, latest price forecast).

---

## 10. Tracking & Analytics

### 10.1 Per-Email Metrics

| Metric | How Tracked | Stored In |
|--------|-------------|-----------|
| `sent_at` | Set when SMTP accepts the email | `outreach_emails.sent_at` |
| `delivered_at` | Inferred (sent + no bounce within 4h) or via provider webhook | `outreach_emails.delivered_at` |
| `opened_at` | 1x1 tracking pixel loaded by email client | `outreach_emails.opened_at` |
| `clicked_at` | Redirect URL with tracking ID clicked | `outreach_emails.clicked_at` |
| `bounced_at` | SMTP error response or provider webhook | `outreach_emails.bounced_at` |
| `unsubscribed_at` | Unsubscribe link clicked | `outreach_emails.unsubscribed_at` |

**Open tracking implementation:**
- Each email embeds a unique tracking pixel URL: `GET /api/outreach/track/open/{email_id}`
- Endpoint returns a 1x1 transparent PNG and records the open event
- First open only — subsequent opens update `last_opened_at` but don't recount

**Click tracking implementation:**
- All links in email body are wrapped: `GET /api/outreach/track/click/{email_id}?url={original_url}`
- Endpoint records the click, then 302 redirects to the original URL
- Tracks which specific link was clicked (signup vs unsubscribe)

### 10.2 Per-Campaign Metrics (Aggregated)

| Metric | Formula |
|--------|---------|
| **Total contacts** | Count of contacts in campaign |
| **Emails sent** | Count where `sent_at IS NOT NULL` |
| **Delivery rate** | `(sent - bounced) / sent * 100` |
| **Open rate** | `opened / delivered * 100` |
| **Click rate** | `clicked / delivered * 100` |
| **Bounce rate** | `bounced / sent * 100` |
| **Unsubscribe rate** | `unsubscribed / delivered * 100` |
| **Conversion rate** | `signups_from_campaign / total_contacts * 100` |

**Conversion tracking:** When a user signs up via a `{signup_url}` with `ref={email_id}`, the signup event is attributed to the campaign. Tracked via UTM params on the onboarding page.

### 10.3 Admin Dashboard Metrics (Global)

| Widget | Description |
|--------|-------------|
| **Overall conversion rate** | Signups / total contacts across all campaigns |
| **Best-performing commodities** | Top 5 commodities by conversion rate |
| **Best-performing email** | Comparison of Email 1 vs 2 vs 3 by open/click rate |
| **Bounce rate trend** | Weekly bounce rate trend (alert if > 5%) |
| **Active campaigns** | Count and list of currently active campaigns |
| **Suppression list size** | Total hard bounces + unsubscribes |
| **Daily send volume** | Emails sent per day (vs daily limit) |

---

## 11. Database Schema

All tables live in the AI_NEW PostgreSQL database alongside the existing niche commodity tables.

```sql
-- ============================================================
-- Outreach Configuration (singleton, admin-managed)
-- ============================================================
CREATE TABLE outreach_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(100)
);

-- Default config entries:
-- INSERT INTO outreach_config VALUES
--   ('min_quality_score', '45', NOW(), 'system'),
--   ('max_contacts_per_campaign', '1000', NOW(), 'system'),
--   ('daily_send_limit', '500', NOW(), 'system'),
--   ('batch_size', '50', NOW(), 'system'),
--   ('batch_interval_seconds', '120', NOW(), 'system'),
--   ('global_pause', 'false', NOW(), 'system'),
--   ('warmup_mode', 'true', NOW(), 'system'),
--   ('warmup_daily_limit', '50', NOW(), 'system');


-- ============================================================
-- Outreach Campaigns
-- ============================================================
CREATE TABLE outreach_campaigns (
    campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity_id UUID NOT NULL,
    commodity_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
        -- ENUM: draft, active, paused, completed
    config JSONB DEFAULT '{}',
        -- Override per-campaign settings (send times, batch size, etc.)
    total_contacts INT DEFAULT 0,
    contacts_buyer INT DEFAULT 0,
    contacts_seller INT DEFAULT 0,
    min_quality_score INT DEFAULT 45,
    emails_sent INT DEFAULT 0,
    emails_delivered INT DEFAULT 0,
    emails_opened INT DEFAULT 0,
    emails_clicked INT DEFAULT 0,
    emails_bounced INT DEFAULT 0,
    emails_unsubscribed INT DEFAULT 0,
    signups_attributed INT DEFAULT 0,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    paused_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status constraint
ALTER TABLE outreach_campaigns
    ADD CONSTRAINT chk_campaign_status
    CHECK (status IN ('draft', 'active', 'paused', 'completed'));


-- ============================================================
-- Outreach Emails (individual send records)
-- ============================================================
CREATE TABLE outreach_emails (
    email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES outreach_campaigns(campaign_id) ON DELETE CASCADE,
    contact_id UUID NOT NULL,
        -- References buyer_contacts.contact_id or seller_contacts.contact_id
    contact_type VARCHAR(10) NOT NULL,
        -- 'buyer' | 'seller'
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    company_name VARCHAR(255),
    sequence_number INT NOT NULL,
        -- 1, 2, or 3 (which email in the drip)
    template_key VARCHAR(50) NOT NULL,
        -- e.g. 'buyer_intro', 'seller_demand', etc.
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    personalization JSONB DEFAULT '{}',
        -- All template variables used for this send
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
        -- ENUM: pending, queued, sent, delivered, opened, clicked, bounced, failed, cancelled
    scheduled_at TIMESTAMPTZ,
    queued_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    last_opened_at TIMESTAMPTZ,
    open_count INT DEFAULT 0,
    clicked_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    click_count INT DEFAULT 0,
    bounced_at TIMESTAMPTZ,
    bounce_type VARCHAR(10),
        -- 'hard' | 'soft'
    bounce_reason TEXT,
    retry_count INT DEFAULT 0,
    unsubscribed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status constraint
ALTER TABLE outreach_emails
    ADD CONSTRAINT chk_email_status
    CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'cancelled'));

-- Contact type constraint
ALTER TABLE outreach_emails
    ADD CONSTRAINT chk_contact_type
    CHECK (contact_type IN ('buyer', 'seller'));

-- Bounce type constraint
ALTER TABLE outreach_emails
    ADD CONSTRAINT chk_bounce_type
    CHECK (bounce_type IS NULL OR bounce_type IN ('hard', 'soft'));


-- ============================================================
-- Global Suppression List
-- ============================================================
CREATE TABLE outreach_suppression (
    suppression_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    reason VARCHAR(30) NOT NULL,
        -- 'hard_bounce' | 'unsubscribe' | 'spam_complaint' | 'manual'
    source_campaign_id UUID REFERENCES outreach_campaigns(campaign_id),
    source_email_id UUID REFERENCES outreach_emails(email_id),
    suppressed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

-- Unique on email (a contact is suppressed once, first reason wins)
CREATE UNIQUE INDEX idx_suppression_email ON outreach_suppression(email);

-- Reason constraint
ALTER TABLE outreach_suppression
    ADD CONSTRAINT chk_suppression_reason
    CHECK (reason IN ('hard_bounce', 'unsubscribe', 'spam_complaint', 'manual'));


-- ============================================================
-- Outreach Events (audit log for tracking events)
-- ============================================================
CREATE TABLE outreach_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_id UUID NOT NULL REFERENCES outreach_emails(email_id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL,
        -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'signup'
    event_data JSONB DEFAULT '{}',
        -- Additional data: IP, user agent, clicked URL, bounce reason, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- Indexes
-- ============================================================

-- Campaign queries
CREATE INDEX idx_campaigns_status ON outreach_campaigns(status);
CREATE INDEX idx_campaigns_commodity ON outreach_campaigns(commodity_id);

-- Email scheduling and processing
CREATE INDEX idx_emails_campaign ON outreach_emails(campaign_id);
CREATE INDEX idx_emails_status ON outreach_emails(status);
CREATE INDEX idx_emails_scheduled ON outreach_emails(scheduled_at)
    WHERE status = 'pending';
CREATE INDEX idx_emails_contact ON outreach_emails(contact_email);
CREATE INDEX idx_emails_contact_campaign ON outreach_emails(contact_id, campaign_id);

-- Suppression lookups (critical path — checked before every send)
CREATE INDEX idx_suppression_lookup ON outreach_suppression(email);

-- Event queries
CREATE INDEX idx_events_email ON outreach_events(email_id);
CREATE INDEX idx_events_type ON outreach_events(event_type);
CREATE INDEX idx_events_created ON outreach_events(created_at);
```

---

## 12. API Endpoints

All endpoints are admin-only, protected by admin auth middleware.

### 12.1 Campaign Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/niche/outreach/campaigns` | Create a new campaign for a commodity |
| `GET` | `/admin/niche/outreach/campaigns` | List all campaigns (with pagination, status filter) |
| `GET` | `/admin/niche/outreach/campaigns/{id}` | Get campaign details with contact counts |
| `PATCH` | `/admin/niche/outreach/campaigns/{id}` | Update campaign config (draft only) |
| `POST` | `/admin/niche/outreach/campaigns/{id}/start` | Activate campaign (draft → active) |
| `POST` | `/admin/niche/outreach/campaigns/{id}/pause` | Pause campaign (active → paused) |
| `POST` | `/admin/niche/outreach/campaigns/{id}/resume` | Resume campaign (paused → active) |
| `DELETE` | `/admin/niche/outreach/campaigns/{id}` | Cancel and delete campaign (confirmation required) |

### 12.2 Campaign Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/niche/outreach/campaigns/{id}/stats` | Campaign metrics (open/click/bounce/conversion rates) |
| `GET` | `/admin/niche/outreach/campaigns/{id}/emails` | List individual emails with status (paginated) |
| `GET` | `/admin/niche/outreach/stats/overview` | Global outreach dashboard metrics |
| `GET` | `/admin/niche/outreach/stats/daily-volume` | Daily send volume over time |
| `GET` | `/admin/niche/outreach/stats/best-performers` | Top commodities by conversion rate |

### 12.3 Global Controls

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/niche/outreach/pause-all` | Global emergency stop |
| `POST` | `/admin/niche/outreach/resume-all` | Resume all previously-active campaigns |
| `GET` | `/admin/niche/outreach/config` | Get outreach configuration |
| `PATCH` | `/admin/niche/outreach/config` | Update outreach configuration |

### 12.4 Suppression Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/niche/outreach/suppression` | List suppressed emails (paginated, searchable) |
| `POST` | `/admin/niche/outreach/suppression` | Manually add email to suppression list |
| `DELETE` | `/admin/niche/outreach/suppression/{id}` | Remove from suppression (with reason logging) |

### 12.5 Tracking Endpoints (Public — No Auth)

These endpoints are hit by email clients and must not require authentication:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/outreach/track/open/{email_id}` | Tracking pixel — records open event, returns 1x1 PNG |
| `GET` | `/api/outreach/track/click/{email_id}` | Click tracker — records click, 302 redirects to `?url=` param |
| `GET` | `/api/outreach/unsubscribe/{email_id}` | One-click unsubscribe — adds to suppression, shows confirmation page |

### 12.6 Request/Response Examples

**Create Campaign:**
```json
// POST /admin/niche/outreach/campaigns
{
    "commodity_id": "550e8400-e29b-41d4-a716-446655440000",
    "commodity_name": "Iranian Saffron",
    "min_quality_score": 50,
    "config": {
        "send_time": "10:00",
        "send_days": ["tuesday", "wednesday", "thursday"],
        "batch_size": 50
    }
}

// Response: 201 Created
{
    "campaign_id": "660e8400-e29b-41d4-a716-446655440001",
    "commodity_name": "Iranian Saffron",
    "status": "draft",
    "total_contacts": 847,
    "contacts_buyer": 512,
    "contacts_seller": 335,
    "created_at": "2026-03-26T10:00:00Z"
}
```

**Campaign Stats:**
```json
// GET /admin/niche/outreach/campaigns/{id}/stats
{
    "campaign_id": "660e8400-e29b-41d4-a716-446655440001",
    "commodity_name": "Iranian Saffron",
    "status": "active",
    "started_at": "2026-03-26T10:00:00Z",
    "contacts": {
        "total": 847,
        "buyer": 512,
        "seller": 335
    },
    "emails": {
        "total_scheduled": 2541,
        "sent": 1200,
        "delivered": 1152,
        "opened": 345,
        "clicked": 92,
        "bounced": 48,
        "unsubscribed": 12,
        "failed": 0
    },
    "rates": {
        "delivery_rate": 96.0,
        "open_rate": 29.9,
        "click_rate": 7.9,
        "bounce_rate": 4.0,
        "unsubscribe_rate": 1.0
    },
    "conversions": {
        "signups": 38,
        "conversion_rate": 4.5
    },
    "by_sequence": {
        "email_1": { "sent": 847, "opened": 245, "clicked": 55 },
        "email_2": { "sent": 300, "opened": 78, "clicked": 28 },
        "email_3": { "sent": 53, "opened": 22, "clicked": 9 }
    }
}
```

---

## 13. Admin UI

The admin UI for outreach management is part of the Niche Commodity Finder admin interface. Detailed wireframes and interaction specifications are defined in [[NICHE_COMMODITY_FINDER_UI_SPEC]].

**Key admin pages:**

| Page | Purpose |
|------|---------|
| **Outreach Dashboard** | Global metrics, active campaigns, daily volume chart, bounce rate alerts |
| **Campaign List** | Filterable table of all campaigns with status, contacts, and conversion rate |
| **Campaign Detail** | Per-campaign metrics, email list, contact breakdown, drip progress visualization |
| **Campaign Create/Edit** | Commodity selection, quality score threshold, scheduling config, contact preview |
| **Suppression List** | Searchable list of suppressed emails with reason and source campaign |
| **Settings** | Global outreach config (daily limits, batch size, warmup mode, send times) |

All UI components follow the existing admin portal patterns (Vite + shadcn/ui). The outreach pages will be added under the admin portal's features directory at `admin-portal/src/features/niche/outreach/`.

---

## 14. Compliance

> **This section is critical.** Email outreach to contacts who did not opt in carries legal risk. Every requirement below is mandatory before first send.

### 14.1 CAN-SPAM Act (USA) — 7 Requirements

| # | Requirement | Implementation |
|---|-------------|----------------|
| 1 | Do not use false or misleading header information | From address is `outreach@breyus.com`, owned by Breyus |
| 2 | Do not use deceptive subject lines | All subject lines accurately describe content (commodity + value prop) |
| 3 | Identify the message as an ad | Footer states: "You received this email because your company was identified as a {commodity} trader through public trade records" |
| 4 | Tell recipients where you are located | Physical business address in every email footer |
| 5 | Tell recipients how to opt out | Prominent "Unsubscribe" link in footer, one-click |
| 6 | Honor opt-out requests promptly | Unsubscribe processed immediately (within seconds), CAN-SPAM allows up to 10 business days |
| 7 | Monitor what others are doing on your behalf | All sends go through our own infrastructure, no third-party senders in v1 |

### 14.2 India DPDP Act (Digital Personal Data Protection, 2023)

| Aspect | Applicability | Implementation |
|--------|--------------|----------------|
| **B2B exemption** | The DPDP Act primarily covers personal data of individuals. Business contact data obtained from public sources (government trade records, public company directories) has broader latitude for B2B communication | Document data source for every contact in `buyer_contacts` / `seller_contacts` |
| **Legitimate interest** | B2B outreach for relevant trade opportunities qualifies as legitimate interest | All emails are directly relevant to the contact's known commodity trading activity |
| **Right to erasure** | Contacts can request data deletion | Unsubscribe adds to suppression list. Future: full data deletion endpoint |
| **Data minimization** | Collect only what is needed | Only name, email, company, commodity — no personal data beyond business context |

### 14.3 Unsubscribe Mechanism

**Requirements:**
- One-click unsubscribe (no login required, no confirmation steps)
- Unique unsubscribe URL per email: `GET /api/outreach/unsubscribe/{email_id}`
- Processes immediately — contact added to global suppression list
- Shows a simple confirmation page: "You have been unsubscribed. You will not receive further emails from Breyus about {commodity_name}."
- `List-Unsubscribe` header in every email (RFC 8058 — allows mail clients to show native unsubscribe button):
  ```
  List-Unsubscribe: <https://breyus.com/api/outreach/unsubscribe/{email_id}>
  List-Unsubscribe-Post: List-Unsubscribe=One-Click
  ```

### 14.4 Sender Identification

Every email footer includes:
- Company name: Breyus Technologies Pvt. Ltd.
- Physical address: registered business address
- Contact email: `hello@breyus.com`

### 14.5 Subject Line Rules

- No deceptive subject lines (e.g., no "RE:" or "FW:" prefix on first-contact emails)
- No false urgency (e.g., no "URGENT" or "ACTION REQUIRED" — our urgency is real market data)
- Subject always references the specific commodity being discussed

### 14.6 Global Suppression List Protocol

**Before every email send, the system MUST:**
1. Check `outreach_suppression` table for the recipient email
2. If found → skip this send, mark email as `cancelled`
3. If not found → proceed with send

**Sources that add to suppression:**
- Hard bounce → automatic
- Unsubscribe click → automatic
- Spam complaint (via provider feedback loop) → automatic
- Admin manual addition → via admin UI

**Suppression is permanent by default.** Admin can remove a suppression entry, but this is logged in the audit trail (`outreach_events`).

### 14.7 Consent Tracking

| Consent Type | Applicability | Stored |
|-------------|--------------|--------|
| **Implied consent** | B2B public data — contact was identified through government trade records as trading the commodity | `buyer_contacts.source` / `seller_contacts.source` field documents the public data source |
| **Express consent** | Not required for B2B first-contact in most jurisdictions, but tracked if obtained | Future: consent flag in contact record |
| **Withdrawal of consent** | Via unsubscribe | `outreach_suppression` table |

---

## 15. Folder Structure & Implementation Phases

### 15.1 File Structure

```
AI_NEW/server/niche/outreach/
├── __init__.py
├── campaign_manager.py         # Campaign CRUD, state machine, contact loading
├── email_sender.py             # Send orchestration, batch processing, retry logic
├── template_engine.py          # Template rendering, variable substitution, fallbacks
├── tracking.py                 # Open/click/unsubscribe tracking endpoints
├── scheduler.py                # Cron job for processing pending emails
├── suppression.py              # Global suppression list management
├── analytics.py                # Campaign metrics aggregation
├── models/
│   ├── __init__.py
│   ├── campaign.py             # SQLAlchemy model for outreach_campaigns
│   ├── email.py                # SQLAlchemy model for outreach_emails
│   ├── suppression.py          # SQLAlchemy model for outreach_suppression
│   ├── event.py                # SQLAlchemy model for outreach_events
│   └── config.py               # SQLAlchemy model for outreach_config
└── templates/
    ├── buyer_intro.html        # Email 1 buyer template
    ├── buyer_intelligence.html # Email 2 buyer template
    ├── buyer_urgency.html      # Email 3 buyer template
    ├── seller_demand.html      # Email 1 seller template
    ├── seller_competitor.html  # Email 2 seller template
    ├── seller_final.html       # Email 3 seller template
    └── unsubscribe_confirm.html

backend/src/outreach/
├── outreach.module.ts          # NestJS module
├── outreach.controller.ts      # Tracking endpoints (open/click/unsubscribe)
└── outreach.service.ts         # Email dispatch via mail.service.ts

backend/src/mail/
└── mail.service.ts             # EXISTING — extend with outreach send method
└── templates/
    └── email.templates.ts      # EXISTING — add outreach template helpers

admin-portal/src/features/niche/outreach/
├── OutreachDashboard.tsx       # Global metrics page
├── CampaignList.tsx            # Campaign listing page
├── CampaignDetail.tsx          # Individual campaign view
├── CampaignCreate.tsx          # Campaign creation form
├── SuppressionList.tsx         # Suppression list management
└── OutreachSettings.tsx        # Configuration page
```

### 15.2 Implementation Phases

#### Phase 1: Schema + Campaign CRUD (Week 1-2)

- [ ] Create database tables (outreach_campaigns, outreach_emails, outreach_suppression, outreach_events, outreach_config)
- [ ] Insert default configuration values
- [ ] Implement campaign_manager.py (create, list, get, update, delete campaigns)
- [ ] Implement contact loading from buyer_contacts/seller_contacts with quality score filtering
- [ ] Campaign state machine with validation
- [ ] API endpoints: campaign CRUD + start/pause/resume
- [ ] Basic admin UI: campaign list and create pages

#### Phase 2: Email Sending + Templates (Week 3-4)

- [ ] Implement template_engine.py with variable substitution and fallback handling
- [ ] Create all 6 HTML email templates (3 buyer + 3 seller)
- [ ] Create plain text variants for all templates
- [ ] Implement email_sender.py with batch processing and rate limiting
- [ ] Extend backend `mail.service.ts` with outreach send method
- [ ] Implement scheduler.py (cron job every 15 minutes)
- [ ] Implement NestJS outreach controller for tracking endpoints
- [ ] Email 1 generation when campaign starts
- [ ] Email 2/3 scheduling after delivery of previous email
- [ ] Daily send limit enforcement

#### Phase 3: Tracking + Analytics (Week 5-6)

- [ ] Implement tracking pixel endpoint (open tracking)
- [ ] Implement click redirect endpoint (click tracking)
- [ ] Implement unsubscribe endpoint with confirmation page
- [ ] Bounce handling (hard bounce → suppression, soft bounce → retry)
- [ ] suppression.py (global suppression list with pre-send checks)
- [ ] analytics.py (per-campaign and global metrics aggregation)
- [ ] Campaign stats API endpoints
- [ ] Conversion attribution via UTM params

#### Phase 4: Admin UI + Polish (Week 7-8)

- [ ] Outreach dashboard page (global metrics, charts)
- [ ] Campaign detail page (per-email status, drip progress)
- [ ] Suppression list management page
- [ ] Outreach settings page (config management)
- [ ] Global pause/resume controls
- [ ] Per-contact skip and resend actions
- [ ] Domain warmup mode enforcement
- [ ] `List-Unsubscribe` header implementation
- [ ] End-to-end testing with real SMTP (staging environment)

---

## 16. Success Criteria & Risks

### 16.1 Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Email delivery rate** | >= 95% | `(sent - bounced) / sent` |
| **Open rate** | >= 20% | `opened / delivered` (Email 1 benchmark) |
| **Click rate** | >= 5% | `clicked / delivered` (across all emails) |
| **Bounce rate** | < 5% | `bounced / sent` (hard + soft combined) |
| **Unsubscribe rate** | < 2% | `unsubscribed / delivered` |
| **Overall conversion rate** | 5-15% | `signups / total_contacts` |
| **Spam complaint rate** | < 0.1% | Via provider feedback loop |
| **Time to first campaign** | < 30 minutes | From commodity approval to first email sent |
| **System uptime** | 99.5% | Scheduler cron reliability |

### 16.2 Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Emails land in spam** | High | High | Domain warmup, SPF/DKIM/DMARC, clean list hygiene, plain text emphasis, no spam trigger words |
| **High bounce rate damages domain reputation** | Medium | High | Quality score filtering (>= 45), email validation before first send, hard bounce auto-suppression, pause if bounce rate > 5% |
| **Legal action from cold email recipients** | Low | High | CAN-SPAM + DPDP compliance, clear unsubscribe, B2B public data sourcing documented, physical address in every email |
| **SMTP provider blocks account** | Medium | Medium | Stay within daily limits, domain warmup, monitor provider dashboard, have backup provider configured |
| **Low conversion rate (< 5%)** | Medium | Medium | A/B test subject lines (v2), improve personalization quality, review template copy, segment by quality score |
| **Contact data quality issues** | Medium | Medium | Quality score threshold, email format validation, deduplication across campaigns |
| **Tracking blocked by email clients** | High | Low | Accept that open rates are underreported (Apple Mail Privacy Protection, Outlook), focus on click rates as primary metric |
| **Scale limits with Gmail SMTP** | Certain | Low | Planned migration path to SendGrid/Mailgun when volume exceeds limits |

### 16.3 Monitoring & Alerts

| Alert | Condition | Action |
|-------|-----------|--------|
| **High bounce rate** | > 5% in any 24h period | Auto-pause all campaigns, notify admin |
| **Spam complaint** | Any spam complaint received | Immediate suppression, admin notification |
| **Daily limit approaching** | > 90% of daily send limit used | Warning in admin dashboard |
| **Scheduler failure** | Cron job fails to run for > 30 minutes | System health alert |
| **Delivery rate drop** | < 90% over 7-day rolling window | Admin notification, review required |

---

## 17. Document Control & Related

### 17.1 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-26 | System | Initial PRD — email-only v1 scope |

### 17.2 Related Documents

| Document | Relationship |
|----------|-------------|
| [[NICHE_COMMODITY_FINDER_PRD]] | Parent PRD — high-level system overview (Stage 1-4 + original Stage 5 outline) |
| [[PRD_1_Government_Data_Extraction]] | Stage 1 — provides `approved_commodities` table (commodity metadata for templates) |
| [[PRD_2_3_Contact_Discovery]] | Stage 2/3 — provides `buyer_contacts` and `seller_contacts` tables (input to outreach) |
| [[PRD_4_Market_Intelligence]] | Stage 4 — provides `predictions` table (used in Email 2 content for price forecasts) |
| [[NICHE_COMMODITY_FINDER_TECHNICAL_ARCHITECTURE]] | Technical architecture — system integration patterns |
| [[NICHE_COMMODITY_FINDER_UI_SPEC]] | UI wireframes — admin outreach pages |

### 17.3 Open Questions

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | Should we validate emails (MX record check) before first send, or rely on bounce handling? | Open | Recommend MX check — reduces bounce rate proactively |
| 2 | Should contacts in multiple commodity campaigns receive emails for all commodities, or only the first? | Decided | First campaign only — deduplicate across active campaigns |
| 3 | What physical address to use in email footer? | Open | Needs registered business address from legal |
| 4 | Should Email 2 content come from real Stage 4 predictions, or use static fallback copy for commodities without predictions? | Open | Recommend: use real predictions when available, static fallback otherwise |
| 5 | When to trigger migration from Gmail SMTP to SendGrid? | Decided | When total contacts across active campaigns exceeds 500 |

### 17.4 Approval

| Role | Name | Date | Status |
|------|------|------|--------|
| Product Owner | — | — | Pending |
| Technical Lead | — | — | Pending |
| Legal/Compliance | — | — | Pending (required before first send) |
