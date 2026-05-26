## Goal

Produce a single, well-structured documentation artifact that:
1. Defines a verification & curation protocol for jobs ingested from public APIs and RSS feeds.
2. Presents a taxonomy diagram of the aggregator (sources → ingestion → processing → user-facing features).
3. Refers to the product strictly as "the aggregator" (never "JobScraper").

Deliverable: `/mnt/documents/Aggregator_Documentation.md` (plus an embedded Mermaid taxonomy diagram saved as `/mnt/documents/Aggregator_Taxonomy.mmd` so it renders as a viewable artifact).

---

## Document structure

**1. Overview**
- One-paragraph description of the aggregator (remote job listings consolidated from multiple public sources, deduplicated, filterable, with alerts/exports).
- Scope of this document.

**2. Data Sources & Trust Model**
- Inventory of current ingestion sources (We Work Remotely RSS, RemoteOK public API, Working Nomads exposed_jobs API, Remote.com placeholder).
- Trust tiering (Tier A: official APIs with structured data; Tier B: RSS feeds; Tier C: HTML-scraped or partner-submitted).
- Per-source confidence weight that feeds into the scoring pipeline.

**3. Verification & Curation Protocol** (the core new contribution)

A multi-stage pipeline applied at ingest time and on a recurring schedule:

- **Stage 1 — Schema validation**: required fields (title, company, apply_url, source), URL sanitization, HTML sanitization on descriptions, length caps. Reject rows that fail.
- **Stage 2 — Normalization**: lowercase tag normalization, location canonicalization ("Remote", "Worldwide", country codes), experience-level inference from title/description regex, posted_date parsing.
- **Stage 3 — Deduplication**: composite key on (normalized title + company + source) for upserts; cross-source duplicate clustering via apply_url hostname + slug similarity; merge metadata, keep earliest posted_date, surface "N duplicates merged" badge.
- **Stage 4 — Authenticity checks**:
  - Apply-URL liveness probe (HEAD request, follow redirects, expect 2xx; flag 404/410 as `link_dead`).
  - Domain reputation check against an allowlist of known employer/ATS domains (Greenhouse, Lever, Workable, Ashby, company root domains). Unknown domains get `unverified_domain` flag.
  - Suspicious-pattern heuristics (wire-transfer keywords, crypto-only payment, "training fee", Telegram/WhatsApp-only contact, mismatched company vs. domain) → `suspected_scam` flag.
- **Stage 5 — Quality scoring** (0–100): weighted blend of source trust tier, description length/structure, salary present, company presence in known-employer set, freshness, link liveness. Jobs below a threshold are hidden by default but kept in DB for audit.
- **Stage 6 — Freshness & decay**: jobs >30 days flagged "stale"; jobs failing liveness twice in 7 days marked `expired` and excluded from default lists/alerts.
- **Stage 7 — Human-in-the-loop curation**:
  - User report button ("Report this listing") with reasons (expired, scam, duplicate, wrong category).
  - Threshold-based auto-hide (e.g., 3 distinct user reports).
  - Admin review queue (future `moderation_queue` table) with approve / reject / blacklist-domain actions.
  - Blacklisted companies/domains feed back into Stage 4.
- **Stage 8 — Audit log**: every verification decision (flag, score, hide, restore) written to a `verification_events` table for traceability.

Each stage is documented with: inputs, checks performed, outputs/flags, where it runs (edge function, scheduled cron, on-demand), and failure handling.

**4. Scheduling**
- Hourly ingest (per source rate limits).
- 6-hourly global re-verification of recent jobs (liveness + decay).
- Daily aggregate quality report.

**5. Data Model Additions Required**
Brief schema sketch for new columns/tables: `quality_score`, `verification_flags[]`, `last_verified_at`, `link_status`, plus `job_reports` and `verification_events`. (Documentation only — no code changes in this task.)

**6. Roles & Trust Boundaries**
- Anonymous users: read verified jobs only.
- Authenticated free/pro users: same + report listings + save.
- Admin (future role via `user_roles` table): access moderation queue.

**7. Risks & Mitigations**
- Source API/RSS changes → contract tests per scraper, alerting.
- Scraper blocking → rotate UA, respect robots, backoff.
- False positives in scam detection → human review queue, allowlist overrides.
- Liveness probe cost → batch + cache + only re-probe on schedule.

**8. Taxonomy Diagram**
A Mermaid `graph TD` diagram showing the full taxonomy:

```text
Aggregator
├── Ingestion Layer
│   ├── Public APIs (RemoteOK, Working Nomads)
│   ├── RSS Feeds (We Work Remotely)
│   └── Partner / Future Sources
├── Verification Pipeline (Stages 1–8)
├── Storage (jobs, saved_jobs, verification_events, job_reports)
├── Access Layer
│   ├── Anonymous (limited scrapes)
│   ├── Free tier (2 boards, alerts, exports cap)
│   └── Pro tier (4 boards, unlimited exports, AI parsing)
├── User-Facing Features
│   ├── Search & filters
│   ├── Saved jobs & CSV export
│   ├── Notification preferences + Mailchimp alerts
│   └── Onboarding tour, saved searches, board tooltips
└── Operations
    ├── Scheduled cron (scrape + alerts)
    ├── Subscription/billing (Stripe, Paystack)
    └── Audit & moderation
```

The Mermaid version will render as a proper taxonomy tree artifact.

**9. Glossary**
Key terms: verification flag, quality score, trust tier, stale, expired, moderation queue.

---

## Implementation steps (when build mode is enabled)

1. Write `/mnt/documents/Aggregator_Taxonomy.mmd` with the Mermaid taxonomy.
2. Write `/mnt/documents/Aggregator_Documentation.md` with all sections above, embedding the Mermaid block and linking to the `.mmd` artifact.
3. Emit two artifact tags so the user can preview/download both files.

No application code, database, or edge function changes are part of this task — documentation only. All product references in the file will use "the aggregator".
