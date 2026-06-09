# Job Scraper Automation - Testing Report

## System Overview

### Components
1. **Scrape Jobs Function** (`/supabase/functions/scrape-jobs/`)
   - Scrapes jobs from 4 boards: We Work Remotely, RemoteOK, Working Nomads, Remote.com
   - Stores jobs in database with deduplication on (title, company, source)
   - Filters by search query and experience level

2. **Job Alerts Function** (`/supabase/functions/job-alerts/`)
   - Processes notification preferences for enabled users
   - Retrieves jobs based on user preferences (keyword, experience level, job boards)
   - Sends emails via Mailchimp API
   - Updates last_sent_at timestamp

3. **Database Tables**
   - `jobs` - Stores job listings with unique constraint on (title, company, source)
   - `notification_preferences` - User alert settings with frequency (daily/weekly/monthly)
   - `profiles` - User information and email addresses

4. **Cron Jobs** (PostgreSQL pg_cron)
   - **Scrape Jobs**: Every 6 hours (0 */6 * * *)
     - Runs: 00:00, 06:00, 12:00, 18:00 UTC
     - Scrapes all 4 job boards
   - **Job Alerts**: Every hour (0 * * * *)
     - Checks user preferences
     - Respects frequency settings (daily = 6 hours, weekly = 168 hours, monthly = 720 hours)

---

## Test Cases

### Test 1: Scraper Function - All Boards
**Objective**: Verify scraper retrieves jobs from all boards and stores in database

**Expected Results**:
- [ ] We Work Remotely returns 10+ jobs
- [ ] RemoteOK returns 10+ jobs
- [ ] Working Nomads returns 10+ jobs
- [ ] Remote.com returns 10+ jobs
- [ ] Total: 40+ jobs returned
- [ ] Database contains all jobs without duplicates
- [ ] Jobs have required fields: title, company, location, apply_url, source, scraped_at

**Manual Test Command**:
```bash
curl -X POST https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/scrape-jobs \
  -H "Content-Type: application/json" \
  -d '{"boards": ["We Work Remotely", "RemoteOK", "Working Nomads", "Remote.com"]}'
```

---

### Test 2: Job Filtering by Keyword
**Objective**: Verify scraper filters jobs based on search query

**Expected Results**:
- [ ] Search for "Python" returns only Python-related jobs
- [ ] Search for "React" returns only React-related jobs
- [ ] Jobs match in title, company, description, or tags

**Manual Test Command**:
```bash
curl -X POST https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/scrape-jobs \
  -H "Content-Type: application/json" \
  -d '{"boards": ["We Work Remotely"], "searchQuery": "Python"}'
```

---

### Test 3: Experience Level Filtering
**Objective**: Verify jobs are filtered by experience level (entry, mid, senior)

**Expected Results**:
- [ ] Entry level search returns junior/intern positions
- [ ] Mid level search returns intermediate positions
- [ ] Senior level search returns senior/lead positions

**Manual Test Command**:
```bash
curl -X POST https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/scrape-jobs \
  -H "Content-Type: application/json" \
  -d '{"boards": ["We Work Remotely"], "experienceLevel": "junior"}'
```

---

### Test 4: Job Alerts - Test Mode
**Objective**: Verify job alerts function works without respecting frequency schedule

**Expected Results**:
- [ ] Function identifies all enabled notification preferences
- [ ] For each user with preferences, retrieves matching jobs
- [ ] Sends email with up to 10 jobs
- [ ] Email includes: job title, company, location, apply URL
- [ ] Updates last_sent_at timestamp
- [ ] Returns success response with count of emails sent

**Manual Test Command**:
```bash
curl -X POST https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/job-alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"test": true}'
```

---

### Test 5: Job Alerts - Specific User Test
**Objective**: Test alerts for a single user to verify preference filtering

**Expected Results**:
- [ ] Retrieves user's notification preferences
- [ ] Filters jobs by: search keyword, experience level, selected job boards
- [ ] Respects user's frequency setting
- [ ] Sends email only if enough time has passed since last send
- [ ] Email contains user's preferred job listings

**Manual Test Command**:
```bash
curl -X POST https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/job-alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"test": true, "user_id": "USER_ID_HERE"}'
```

---

### Test 6: Email Format & Delivery
**Objective**: Verify email format is clean and professional

**Expected Results**:
- [ ] Email subject includes job count and optional keyword: "🔍 10 New Remote Jobs for 'Python'"
- [ ] Email body is HTML formatted with professional styling
- [ ] Each job shows: Title, Company, Location, Source, Apply button
- [ ] Email includes call-to-action button to platform
- [ ] Email includes link to manage notification preferences
- [ ] Email is sent via Mailchimp without errors

---

### Test 7: Frequency Schedule Respect
**Objective**: Verify daily/weekly/monthly frequency settings are respected

**Expected Results**:
- [ ] Daily frequency: Alerts only sent if 6+ hours since last send
- [ ] Weekly frequency: Alerts only sent if 168+ hours (7 days) since last send
- [ ] Monthly frequency: Alerts only sent if 720+ hours (30 days) since last send
- [ ] Function returns "not due yet" message for users whose frequency hasn't elapsed

---

### Test 8: Fallback Job Retrieval
**Objective**: Verify system widens search if insufficient jobs available

**Expected Results**:
- [ ] If < 10 jobs found in recent period, search back 30 days
- [ ] Sends email with all available jobs (even if < 10)
- [ ] If no jobs found, skips user and updates last_sent_at
- [ ] Returns error details in response

---

### Test 9: Cron Job Execution Logs
**Objective**: Verify cron jobs are executing on schedule

**Expected Results**:
- [ ] Scrape jobs function executes every 6 hours
- [ ] Job alerts function executes every hour
- [ ] Check database logs for execution records
- [ ] No failed jobs or timeout errors

**Database Query**:
```sql
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

---

## Known Issues & Limitations

### Current Limitations
1. **Mailchimp Integration**: Requires valid Mailchimp API key and audience ID
   - Current: `MAILCHIMP_API_KEY` environment variable
   - Current Audience ID: `0b7157eb3f`

2. **Job Board Availability**: Depends on external scrapers (boards may change HTML structure)
   - We Work Remotely: ✓ Stable
   - RemoteOK: ✓ Stable
   - Working Nomads: ✓ Stable
   - Remote.com: ✓ Stable

3. **Subscription Tier Limits**: 
   - Free users: Max 2 job boards
   - Pro users: Max 4 job boards

4. **Database Size**: No cleanup job for old jobs (may grow large over time)

---

## Performance Metrics

### Database Indexes
- `jobs`: Unique constraint on (title, company, source)
- `saved_jobs`: Unique on (user_id, job_id)
- `dismissed_jobs`: Unique on (user_id, job_id)
- `notification_preferences`: Unique on user_id

### API Response Times (Expected)
- Scrape jobs: 30-120 seconds (depends on board response times)
- Job alerts: 5-30 seconds (depends on number of users)

---

## Troubleshooting

### If Scrapers Return 0 Jobs
1. Check if external websites are accessible
2. Verify CSS selectors in scraper files
3. Check browser console for any blocked requests
4. Review scraper logs in Supabase Edge Functions dashboard

### If Emails Not Sending
1. Verify `MAILCHIMP_API_KEY` is set in environment
2. Check Mailchimp audience ID exists
3. Verify email addresses in `profiles` table are valid
4. Review Mailchimp campaign logs

### If Cron Jobs Not Running
1. Verify `pg_cron` extension is enabled: `CREATE EXTENSION pg_cron;`
2. Check cron job status: `SELECT * FROM cron.job;`
3. Review cron logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC;`
4. Verify JWT token in cron job headers hasn't expired

---

## Success Criteria

✅ **System is working correctly when**:
1. Scraper runs automatically every 6 hours
2. Each scrape retrieves 10+ jobs from each board
3. Jobs are stored in database without duplicates
4. User preferences are respected (keyword, experience level, job boards)
5. Emails sent every hour to eligible users
6. Each email contains exactly 10 jobs (or fewer if unavailable)
7. Email format is professional and includes all required information
8. Users receive notifications based on their frequency setting
9. No errors in Supabase function logs
10. Mailchimp logs show successful campaign sends

