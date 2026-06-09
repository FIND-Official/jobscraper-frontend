# Quick Testing Guide - Job Scraper & Alerts

## System Status Summary

| Component | Status | Last Updated |
|-----------|--------|---------------|
| Scraper (6h schedule) | ✅ Implemented | 2026-01-07 |
| Job Alerts (hourly) | ✅ Implemented | 2026-01-07 |
| Email Templates | ✅ Implemented | 2026-01-07 |
| Database Schema | ✅ Implemented | 2026-01-05 |
| Cron Scheduling | ✅ Implemented | 2026-01-07 |

---

## Requirements Verification

### ✅ Requirement 1: Scrape Every 6 Hours
- **Cron Schedule**: `0 */6 * * *`
- **Time**: 00:00, 06:00, 12:00, 18:00 UTC
- **Function**: `scrape-jobs`
- **Expected Result**: 40+ jobs per cycle

### ✅ Requirement 2: Collect 10+ Jobs Per Board
- **Boards**: 4 (We Work Remotely, RemoteOK, Working Nomads, Remote.com)
- **Per Board**: 10-50 jobs typically
- **Total**: 40-200 jobs per cycle
- **Deduplication**: Automatic on (title, company, source)

### ✅ Requirement 3: User Preference Filtering
- **Filters Available**:
  - 🔍 Keyword search (title, company, location)
  - 📊 Experience level (junior, mid, senior)
  - 🏢 Job board selection (1-4 boards)
- **Logic**: `applyPreferenceFilters()` in job-alerts

### ✅ Requirement 4: Email with 10 Listings
- **Recipients**: All users with enabled preferences
- **Jobs Per Email**: Up to 10
- **Format**: HTML, professional styling
- **Delivery**: Via Mailchimp

### ✅ Requirement 5: Clear Email Format
- **Subject**: `🔍 10 New Remote Jobs for "Python"`
- **Includes**:
  - ✓ Job title
  - ✓ Company name
  - ✓ Location
  - ✓ Source (job board)
  - ✓ Apply link
  - ✓ Call-to-action button

---

## How to Test

### Test 1: Verify Scraping (30-120 seconds)
```bash
curl -X POST https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/scrape-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "boards": ["We Work Remotely", "RemoteOK", "Working Nomads", "Remote.com"]
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "count": 40,
  "boards": 4,
  "message": "Successfully scraped 40 jobs from 4 board(s)"
}
```

---

### Test 2: Send Test Email Alert (5-15 seconds)
```bash
curl -X POST https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/job-alerts \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Expected Response**:
```json
{
  "success": true,
  "emailsSent": 3,
  "errors": 0,
  "message": "Processed job alerts: 3 sent, 0 errors"
}
```

---

### Test 3: Test Single User Alert
```bash
curl -X POST https://ydvmulhmmragakuimuqm.supabase.co/functions/v1/job-alerts \
  -H "Content-Type: application/json" \
  -d '{
    "test": true,
    "user_id": "USER_ID_HERE"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "emailsSent": 1,
  "errors": 0,
  "details": ["Email sent to user@example.com with 10 jobs"]
}
```

---

### Test 4: Check Cron Job Status
```sql
-- In Supabase SQL Editor
SELECT jobname, schedule, next_run, last_run_result
FROM cron.job
WHERE jobname IN ('scrape-jobs-6h', 'job-alerts-hourly');

-- View recent execution logs
SELECT jobname, start_time, execution_time, status
FROM cron.job_run_details
WHERE jobname IN ('scrape-jobs-6h', 'job-alerts-hourly')
ORDER BY start_time DESC
LIMIT 10;
```

---

## Verification Checklist

Use this to verify the system is working end-to-end:

```
PRE-DEPLOYMENT
□ Environment variables set (MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID)
□ Database migrations applied
□ pg_cron extension enabled
□ Mailchimp account configured
□ Supabase functions deployed

SCRAPING VERIFICATION
□ Test 1: Scraper returns 40+ jobs
□ Test 2: Jobs contain all required fields (title, company, location, link)
□ Test 3: Verify no duplicate jobs in database
□ Test 4: Check jobs table has rows: SELECT COUNT(*) FROM jobs;

EMAIL VERIFICATION  
□ Test 5: Job alerts function runs without errors
□ Test 6: Mailchimp shows emails sent
□ Test 7: Email received in test inbox
□ Test 8: Email format is professional and readable
□ Test 9: Job details are accurate
□ Test 10: Apply links are clickable

SCHEDULING VERIFICATION
□ Test 11: Cron jobs show in cron.job table
□ Test 12: Check last_run_result = 'success'
□ Test 13: Verify scraper ran at 06:00, 12:00, 18:00 UTC
□ Test 14: Verify alerts ran every hour

USER PREFERENCE VERIFICATION
□ Test 15: Keyword filtering works (search "Python")
□ Test 16: Experience level filtering works (junior/mid/senior)
□ Test 17: Job board selection works
□ Test 18: Frequency settings respected (daily/weekly/monthly)

PRODUCTION READINESS
□ All tests passed
□ No errors in logs
□ Email delivery rate acceptable (>95%)
□ System documentation complete
□ Backup and recovery plan in place
```

---

## Troubleshooting

### If scraper returns 0 jobs:
1. Check external websites are accessible (curl we work remotely, etc.)
2. Review scraper CSS selector in `/supabase/functions/scrape-jobs/scrapers/`
3. Check Supabase function logs for specific errors
4. Verify internet connectivity in Supabase environment

### If emails not sending:
1. Verify `MAILCHIMP_API_KEY` is valid
2. Check `MAILCHIMP_AUDIENCE_ID` exists in Mailchimp
3. Verify email addresses in `profiles` table are correct
4. Check Mailchimp rejection reasons in campaign logs
5. Review job-alerts function logs in Supabase

### If cron jobs not running:
1. Confirm pg_cron extension is enabled
2. Check JWT token in cron headers hasn't expired
3. Verify supabase URL is correct
4. Review cron job run details for errors
5. Check cron.log in Supabase logs

---

## Current Files

| File | Purpose | Status |
|------|---------|--------|
| `supabase/functions/scrape-jobs/index.ts` | Main scraper logic | ✅ Complete |
| `supabase/functions/scrape-jobs/scrapers/*.ts` | Board-specific scrapers | ✅ Complete (4 boards) |
| `supabase/functions/job-alerts/index.ts` | Alert & email logic | ✅ Complete |
| `supabase/migrations/20260105185101_*.sql` | notification_preferences table | ✅ Applied |
| `supabase/migrations/20260107150925_*.sql` | Cron job scheduling | ✅ Applied |
| `TEST_AUTOMATION.md` | Detailed test cases | ✅ Complete |
| `SCRAPER_VERIFICATION_REPORT.md` | Full verification report | ✅ Complete |

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Jobs scraped per cycle | 40+ | Ready to test |
| Email send rate | 100% | Ready to test |
| Email delivery rate | 95%+ | Ready to test |
| Scraper uptime | 99% | Ready to test |
| Average scrape time | <120s | Ready to test |
| Average alert send time | <30s | Ready to test |

---

## Next Steps

1. ✅ **Review**: This verification report
2. 🔄 **Test**: Run all test commands above
3. 📊 **Monitor**: Check cron logs in Supabase
4. ✅ **Deploy**: Push to production when tests pass
5. 📈 **Monitor**: Track email delivery and engagement

**All requirements have been implemented and are ready for production testing.**
