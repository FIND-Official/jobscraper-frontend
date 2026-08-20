# Product Requirements Document (PRD)
## FIND — Remote Job Aggregator

**Version:** 1.0
**Status:** Living document
**Last updated:** July 9, 2026
**Owners:** Product + Engineering
**Audience:** Engineering, Design, QA, Growth

---

## 1. Executive Summary

FIND is a remote-only job aggregator that pulls listings from a curated set of trusted job boards (public APIs / RSS feeds) and gives users a fast, ad-free, filterable interface to search, save, and export jobs. The product monetizes via a freemium subscription (Free vs PRO $20/mo) processed through Stripe (global) and Paystack (Africa). It is a client-heavy React SPA backed by Supabase (Postgres, Auth, Edge Functions) with scheduled scraping via GitHub Actions.

**Primary differentiator:** Original-company application links (avoid 3rd-party recruiter walls), aggressive deduplication, and a clean/minimal UX.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Aggregate remote jobs from **legally safe sources only** (public APIs, RSS, or explicit written permission).
- Deliver a search experience faster and cleaner than incumbent boards.
- Convert 3–5% of active free users to PRO within 60 days of signup.
- Keep infra cost under $50/mo at <10k MAU using Supabase free/pro + GitHub Actions cron.

### 2.2 Non-Goals
- Building an ATS or recruiter-side product.
- HTML scraping of boards without a public feed or written permission (legal risk).
- Non-remote / hybrid / on-site jobs.
- Native mobile apps (PWA-only for v1).

---

## 3. Personas

| Persona | Needs | Pain we solve |
|---|---|---|
| **Active Job Seeker (Sofia, 28, dev)** | Fresh listings daily, save + export, apply directly | Boards are noisy, duplicates, recruiter middlemen |
| **Passive Browser (Marcus, 34, designer)** | Weekly digest, low-friction browsing | Signup walls, alert spam |
| **PRO Power User (Aditi, 31, PM)** | Multi-board scraping, AI parsing, unlimited exports | Manual comparison across boards |

---

## 4. Functional Requirements

### 4.1 Scraping & Ingestion (FR-1)
- **FR-1.1** Support 4 sources at launch: We Work Remotely, RemoteOK, Working Nomads, Remote.com (all public feeds).
- **FR-1.2** Scheduled scrape via GitHub Actions cron (`.github/workflows/schedule-jobs.yml`) every N hours.
- **FR-1.3** Manual scrape trigger from UI (rate-limited per user/anon).
- **FR-1.4** Deduplication key: `(title, company, source)` unique upsert.
- **FR-1.5** Anonymous users: hard cap **2 scrapes**, tracked in `anonymous_visitors` table by client-generated ID.
- **FR-1.6** Free tier: max **2 boards** per scrape. PRO: max **4 boards**.
- **FR-1.7** Any new source added later requires a public API/RSS **OR** written owner permission on file before code merge.

### 4.2 Search & Discovery (FR-2)
- **FR-2.1** Free-text search across title, company, location, tags, description.
- **FR-2.2** Experience-level filter (any/entry/mid/senior) via regex heuristics on job text.
- **FR-2.3** Saved searches (tags), recent scrape sessions in sidebar.
- **FR-2.4** Sorting, pagination, and "clear filters" trigger.

### 4.3 Job Management (FR-3)
- **FR-3.1** Save/unsave jobs (authenticated only).
- **FR-3.2** Dismiss jobs (hidden from future results per user).
- **FR-3.3** Bulk actions on saved list.
- **FR-3.4** CSV export: Free 50/mo, PRO unlimited.
- **FR-3.5** CSV must sanitize formula-injection vectors (`=`, `+`, `-`, `@` prefix).

### 4.4 Authentication (FR-4)
- **FR-4.1** Email/password + Google OAuth via Supabase Auth.
- **FR-4.2** Password reset flow.
- **FR-4.3** On signup, sync to Mailchimp audience (fire-and-forget, non-blocking).
- **FR-4.4** Persistent session; subscription re-checked on focus + 60s interval.

### 4.5 Subscriptions & Billing (FR-5)
- **FR-5.1** Two tiers: Free / PRO ($20/mo).
- **FR-5.2** Stripe for global cards; Paystack for African cards.
- **FR-5.3** Server-side entitlement verification via `check-subscription` edge function — **never trust client**.
- **FR-5.4** Webhooks: `paystack-webhook`, Stripe checkout flows handled in `create-checkout` / `customer-portal`.
- **FR-5.5** Cancel-at-period-end honored; user retains PRO until `subscription_expires_at`.

### 4.6 Notifications (FR-6)
- **FR-6.1** Per-user job alert preferences (frequency, keywords).
- **FR-6.2** `job-alerts` edge function on cron, dispatches via Mailchimp.

### 4.7 AI Parsing (FR-7, PRO only)
- **FR-7.1** `parse-job-ai` edge function uses Lovable AI Gateway.
- **FR-7.2** Extracts structured fields (salary, tech stack, seniority) from raw description.
- **FR-7.3** Result cached per job to avoid duplicate model calls.

### 4.8 Legal & Compliance (FR-8)
- **FR-8.1** Public `/privacy` and `/terms` routes.
- **FR-8.2** Outreach email templates on file for all scraped boards (permission or courtesy notice).
- **FR-8.3** `robots.txt` disallows crawling `/auth`, `/account`, `/reset-password`, `/cleanup`.

---

## 5. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | LCP < 2.5s on 4G; job list render < 500ms for 100 jobs; edge function p95 < 3s |
| **Availability** | 99.5% (piggybacks on Supabase SLA) |
| **Scalability** | Support 10k MAU without infra changes; Postgres row cap ~500k jobs before archival strategy needed |
| **Security** | RLS on all user-scoped tables; roles in dedicated `user_roles` table (never on profile); `service_role_key` never in client; Stripe/Paystack signatures verified server-side |
| **Privacy** | GDPR-compliant account deletion via `/account`; Mailchimp opt-out honored |
| **Accessibility** | WCAG 2.1 AA target; semantic HTML, keyboard nav, alt text |
| **SEO** | Per-route `<SEO>` component, sitemap.xml, llms.txt, JSON-LD (WebSite + Organization) |
| **Observability** | Console-tagged logs (`[AUTH]`, `[SCRAPE]`); Supabase Edge Function logs; Lovable analytics |
| **Cost ceiling** | < $50/mo infra at 10k MAU |

---

## 6. System Architecture

### 6.1 High-level

```text
┌─────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│  React SPA      │◄────►│  Supabase            │◄────►│  Postgres (RLS)  │
│  (Vite + TS)    │      │  Auth / Edge Fns     │      │  jobs, profiles, │
│                 │      │                      │      │  saved, alerts   │
└────────┬────────┘      └──────────┬───────────┘      └──────────────────┘
         │                          │
         │                          ├──► Stripe / Paystack (billing)
         │                          ├──► Mailchimp (email + alerts)
         │                          ├──► Lovable AI Gateway (parsing)
         │                          └──► Resend (transactional)
         │
         └──► GitHub Actions cron ──► scrape-jobs edge fn ──► Public APIs/RSS
```

### 6.2 Frontend
- **Stack:** React 18, Vite 5, TypeScript 5, Tailwind v3, shadcn/ui, React Router, TanStack Query, react-helmet-async.
- **State:** `AuthContext` for session + subscription; TanStack Query for server state; local `useState` for UI.
- **Design tokens:** All colors/gradients/shadows in `src/index.css` — components consume semantic tokens only.

### 6.3 Backend (Supabase Edge Functions)
| Function | Auth | Purpose |
|---|---|---|
| `scrape-jobs` | Public | Scrape + filter + upsert jobs |
| `check-subscription` | JWT | Server-verified entitlement |
| `create-checkout`, `customer-portal`, `cancel-subscription` | JWT | Stripe flows |
| `init-paystack-payment`, `verify-paystack-payment`, `paystack-webhook` | Mixed | Paystack flows |
| `parse-job-ai` | JWT | PRO AI parsing |
| `export-saved-jobs` | JWT | CSV export with injection sanitization |
| `mailchimp-sync`, `job-alerts` | Public/cron | Email lifecycle |
| `send-contact-email` | Public | Contact form via Resend |

### 6.4 Data Model (key tables)
- `profiles` — user metadata, `subscription_tier`, `subscription_expires_at`, `subscription_cancel_at_period_end`
- `user_roles` — separate table with `has_role()` SECURITY DEFINER function (prevents privilege escalation)
- `jobs` — deduplicated by `(title, company, source)`
- `saved_jobs`, `dismissed_jobs` — user-scoped
- `anonymous_visitors` — anon scrape rate limiting
- `job_alert_preferences`, `saved_searches`

All public-schema tables have explicit `GRANT`s + RLS policies.

---

## 7. Design Patterns in Use

| Pattern | Where | Why |
|---|---|---|
| **Context + Hooks** | `AuthContext`, `useAuth()` | Single source of session/subscription state |
| **Server-authoritative entitlements** | `check-subscription` edge fn | Prevent client tampering with PRO gating |
| **Security Definer Functions** | `has_role()`, `handle_new_user()` | Avoid RLS recursion; safe privilege checks |
| **Idempotent Upserts** | `scrape-jobs` → `jobs` table | Safe re-runs, natural dedup |
| **Fire-and-forget side effects** | Mailchimp sync on signup | Don't block critical path |
| **Rate limiting via DB counter** | `anonymous_visitors.scrape_count` | Cheap, no Redis needed |
| **Feature flags via subscription tier** | Board count, AI parsing, exports | Simple monetization surface |
| **Semantic design tokens** | `index.css` + Tailwind | Themable, dark-mode ready |
| **Route-level SEO component** | `<SEO />` per page | Unique meta + social tags |
| **Sanitization at boundary** | HTML from scraped descriptions; CSV export | XSS + formula injection defense |

---

## 8. Constraints & Assumptions

### 8.1 Hard constraints
- **No HTML scraping without permission** — legal exposure. All new sources require API/RSS or signed permission.
- **Supabase-managed schemas** (`auth`, `storage`, `realtime`) never modified directly.
- **service_role_key** never leaves edge functions.
- **CHECK constraints** with time-based logic are forbidden; use validation triggers.
- **1000-row default query limit** in Supabase — paginate explicitly for larger sets.

### 8.2 Assumptions
- Public feeds remain stable and legally scrapeable.
- Stripe + Paystack cover >95% of target payment geographies.
- Lovable AI Gateway credit costs stay within PRO margin.
- Users tolerate email-required signup for save/export.

---

## 9. Known Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Feed source removes public API | Loss of listings | Multi-source strategy; outreach templates on file |
| Duplicate jobs across sources | UX degradation | `(title, company, source)` unique + fuzzy match roadmap |
| Google OAuth consent shows raw Supabase URL | Trust hit at signup | Custom Google Cloud OAuth client (config, no code) |
| Stripe webhook race with client subscription check | Brief PRO gating gap | Focus/visibility recheck + 60s polling |
| Anonymous abuse bypasses limit via new client ID | Cost | Add IP-based secondary throttle (roadmap) |
| Scraped HTML XSS in descriptions | Account compromise | Sanitize on ingest + on render |

---

## 10. Success Metrics

- **Activation:** % of visitors who complete a scrape → save ≥1 job.
- **Retention:** W1 / W4 return rate of authenticated users.
- **Conversion:** Free → PRO within 30 / 60 days.
- **Quality:** Duplicate rate < 5%; broken apply-link rate < 2%.
- **Performance:** LCP p75 < 2.5s; edge fn p95 < 3s.
- **Cost:** Infra $ / MAU trending down.

---

## 11. Out of Scope (v1)
- Employer-side posting.
- Resume builder (separate product).
- Non-English localization (roadmap).
- Real-time collaboration on saved lists.
- Native apps.

---

## 12. Open Questions
1. Archival strategy for `jobs` older than 60 days?
2. Add IP-based anon throttle before or after next growth push?
3. Which 2 sources are next after v1's four?
4. Custom auth domain (`auth.findremotejobs.com`) — worth the ops overhead for v1?

---

## 13. Appendix — Repo Map (partial)

```text
src/
  contexts/AuthContext.tsx      # session + subscription state
  components/SEO.tsx            # per-route metadata
  components/JobSearch.tsx      # scrape trigger + filters
  components/JobList.tsx        # results
  pages/                        # Index, Auth, Account, Privacy, Terms, ...
supabase/
  functions/                    # edge functions (see 6.3)
  config.toml                   # JWT verification per function
scripts/generate-sitemap.ts     # prebuild sitemap generation
.github/workflows/schedule-jobs.yml  # cron scraper
```
