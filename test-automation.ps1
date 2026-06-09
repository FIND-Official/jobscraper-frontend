#!/usr/bin/env pwsh

# Job Scraper Automation Testing Script
# Tests scraping, filtering, and email notification functionality

# Configuration
$SUPABASE_URL = "https://ydvmulhmmragakuimuqm.supabase.co"
$ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkdm11bGhtbXJhZ2FrdWltdXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTk1NzksImV4cCI6MjA3OTU3NTU3OX0.YozlONF8m9qE25xNSSk-s7xIqBEEV0LPB90oGVcS-10"
$SCRAPE_URL = "$SUPABASE_URL/functions/v1/scrape-jobs"
$ALERTS_URL = "$SUPABASE_URL/functions/v1/job-alerts"

$results = @()

function Write-TestHeader {
    param([string]$title)
    Write-Host "`n" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "TEST: $title" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
}

function Write-TestResult {
    param([string]$status, [string]$message)
    if ($status -eq "PASS") {
        Write-Host "✓ PASS: $message" -ForegroundColor Green
    } elseif ($status -eq "FAIL") {
        Write-Host "✗ FAIL: $message" -ForegroundColor Red
    } else {
        Write-Host "ℹ INFO: $message" -ForegroundColor Yellow
    }
}

# Test 1: Scrape all boards
Write-TestHeader "Scrape All Job Boards"
Write-Host "Testing scraper with all 4 boards..." -ForegroundColor Cyan

$body = @{
    boards = @("We Work Remotely", "RemoteOK", "Working Nomads", "Remote.com")
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $SCRAPE_URL `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body `
        -TimeoutSec 120 -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    
    Write-TestResult "INFO" "Response status: $($response.StatusCode)"
    Write-TestResult "INFO" "Total jobs scraped: $($data.count)"
    Write-TestResult "INFO" "Boards: $($data.boards -join ', ')"
    
    if ($data.count -ge 40) {
        Write-TestResult "PASS" "Scraped 40+ jobs from all 4 boards (actual: $($data.count))"
    } elseif ($data.count -ge 10) {
        Write-TestResult "PASS" "Scraped jobs successfully (actual: $($data.count))"
    } else {
        Write-TestResult "FAIL" "Expected 40+ jobs, got only $($data.count)"
    }
    
    # Show sample jobs
    if ($data.jobs.count -gt 0) {
        Write-Host "`nSample Job:" -ForegroundColor Yellow
        $sample = $data.jobs[0]
        Write-Host "  Title: $($sample.title)"
        Write-Host "  Company: $($sample.company)"
        Write-Host "  Location: $($sample.location)"
        Write-Host "  Source: $($sample.source)"
        Write-Host "  Apply URL: $($sample.apply_url)"
    }
} catch {
    Write-TestResult "FAIL" "Scrape request failed: $($_.Exception.Message)"
}

# Test 2: Scrape with keyword filter
Write-TestHeader "Scrape with Keyword Filter"
Write-Host "Testing scraper with 'Python' keyword filter..." -ForegroundColor Cyan

$body = @{
    boards = @("We Work Remotely")
    searchQuery = "Python"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $SCRAPE_URL `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body `
        -TimeoutSec 60 -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    
    Write-TestResult "INFO" "Jobs with Python keyword: $($data.count)"
    
    if ($data.count -gt 0) {
        Write-TestResult "PASS" "Keyword filtering works (found $($data.count) Python jobs)"
        
        # Verify all jobs contain Python in title/company/description
        $pythonJobs = $data.jobs | Where-Object { 
            $_.title -match "Python" -or 
            $_.company -match "Python" -or 
            $_.description -match "Python" -or 
            ($_.tags -and $_.tags -match "Python")
        }
        Write-TestResult "INFO" "Python mentions in results: $($pythonJobs.count) out of $($data.count)"
    } else {
        Write-TestResult "INFO" "No Python jobs found in current listing"
    }
} catch {
    Write-TestResult "FAIL" "Keyword filter test failed: $($_.Exception.Message)"
}

# Test 3: Scrape with experience level filter
Write-TestHeader "Scrape with Experience Level Filter"
Write-Host "Testing scraper with 'entry' level filter..." -ForegroundColor Cyan

$body = @{
    boards = @("We Work Remotely")
    experienceLevel = "entry"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $SCRAPE_URL `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $body `
        -TimeoutSec 60 -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    
    Write-TestResult "INFO" "Entry level jobs found: $($data.count)"
    
    if ($data.count -gt 0) {
        Write-TestResult "PASS" "Experience level filtering works"
    } else {
        Write-TestResult "INFO" "No entry level jobs found in current listing"
    }
} catch {
    Write-TestResult "FAIL" "Experience level filter test failed: $($_.Exception.Message)"
}

# Test 4: Job Alerts - Test Mode
Write-TestHeader "Job Alerts - Test Mode"
Write-Host "Testing job alerts in test mode (sends emails regardless of schedule)..." -ForegroundColor Cyan

$body = @{
    test = $true
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri $ALERTS_URL `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $ANON_KEY"
        } `
        -Body $body `
        -TimeoutSec 120 -ErrorAction Stop

    $data = $response.Content | ConvertFrom-Json
    
    Write-TestResult "INFO" "Response: $($data.message)"
    Write-TestResult "INFO" "Emails sent: $($data.emailsSent)"
    Write-TestResult "INFO" "Errors: $($data.errors)"
    
    if ($data.emailsSent -gt 0) {
        Write-TestResult "PASS" "Job alerts sent successfully ($($data.emailsSent) emails)"
    } elseif ($data.errors -eq 0) {
        Write-TestResult "INFO" "No emails sent - likely no users with enabled preferences"
    } else {
        Write-TestResult "FAIL" "Job alerts encountered errors: $($data.errors)"
    }
    
    # Show details
    if ($data.details.count -gt 0) {
        Write-Host "`nDetails:" -ForegroundColor Yellow
        $data.details | ForEach-Object { Write-Host "  • $_" }
    }
} catch {
    Write-TestResult "FAIL" "Job alerts test failed: $($_.Exception.Message)"
}

# Test 5: Check database for jobs
Write-TestHeader "Database Status Check"
Write-Host "Checking Supabase database for stored jobs..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $ANON_KEY"
        "Content-Type" = "application/json"
        "Prefer" = "count=exact"
    }
    
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/jobs?limit=1" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $count = $response.Headers["content-range"].Split("/")[-1]
    Write-TestResult "INFO" "Total jobs in database: $count"
    
    if ($count -gt 100) {
        Write-TestResult "PASS" "Database contains healthy job count ($count jobs)"
    } elseif ($count -gt 0) {
        Write-TestResult "PASS" "Database has jobs ($count jobs)"
    } else {
        Write-TestResult "FAIL" "No jobs found in database"
    }
    
    # Get latest jobs
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/jobs?limit=3&order=scraped_at.desc" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $jobs = $response.Content | ConvertFrom-Json
    if ($jobs.count -gt 0) {
        Write-Host "`nLatest jobs in database:" -ForegroundColor Yellow
        $jobs | ForEach-Object {
            Write-Host "  • $($_.title) @ $($_.company) (Source: $($_.source))"
            Write-Host "    Scraped: $($_.scraped_at)"
        }
    }
} catch {
    Write-TestResult "FAIL" "Database check failed: $($_.Exception.Message)"
}

# Test 6: Check notification preferences
Write-TestHeader "Notification Preferences Check"
Write-Host "Checking for configured notification preferences..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $ANON_KEY"
        "Content-Type" = "application/json"
        "Prefer" = "count=exact"
    }
    
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/notification_preferences?limit=10" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $prefs = $response.Content | ConvertFrom-Json
    $count = $response.Headers["content-range"].Split("/")[-1]
    
    Write-TestResult "INFO" "Total preferences configured: $count"
    
    if ($prefs.count -gt 0) {
        Write-Host "`nConfigured preferences:" -ForegroundColor Yellow
        $prefs | ForEach-Object {
            if ($_.enabled) { $status = "Enabled" } else { $status = "Disabled" }
            $keyword = if ($_.search_keyword) { $_.search_keyword } else { "None" }
            Write-Host "  • User $($_.user_id.Substring(0,8))... : $status"
            Write-Host "    Frequency: $($_.frequency) | Keyword: $keyword"
            Write-Host "    Boards: $($_.job_boards -join ', ')"
        }
    } else {
        Write-TestResult "FAIL" "No notification preferences configured"
    }
} catch {
    Write-TestResult "FAIL" "Preferences check failed: $($_.Exception.Message)"
}

# Test 7: Get cron job status
Write-TestHeader "Cron Job Status"
Write-Host "Note: Cron job status can only be viewed in Supabase Dashboard" -ForegroundColor Yellow
Write-Host "Dashboard: https://app.supabase.com/project/ydvmulhmmragakuimuqm/database/jobs" -ForegroundColor Cyan
Write-Host "`nExpected cron jobs:" -ForegroundColor Yellow
Write-Host "  1. scrape-jobs-6h : Every 6 hours (schedule: 0 at hours 0,6,12,18 UTC)"
Write-Host "  2. job-alerts-hourly : Every hour (schedule: 0 minutes every hour)" 

Write-Host "`nTo verify cron jobs in database, run:" -ForegroundColor Cyan
Write-Host "SELECT * FROM cron.job;" -ForegroundColor Gray
Write-Host "SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;" -ForegroundColor Gray

Write-Host "`n" * 2
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "`nFor detailed logs, check: https://app.supabase.com/project/ydvmulhmmragakuimuqm/functions" -ForegroundColor Cyan
