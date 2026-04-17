/**
 * Integration test for all job board scrapers.
 * Run with: deno run --allow-net test-scrapers.ts
 *
 * Tests that each scraper:
 *   - Returns an array (even if empty)
 *   - Each job has the required fields: title, company, location, apply_url, source, posted_date
 *   - No job has an invalid apply_url
 */

import { scrapeWeWorkRemotely } from "./scrapers/weworkremotely.ts";
import { scrapeRemoteOK } from "./scrapers/remoteok.ts";
import { scrapeWorkingNomads } from "./scrapers/workingnomads.ts";
import { scrapeRemoteCom } from "./scrapers/remote-com.ts";
import { Job } from "./types.ts";

const REQUIRED_FIELDS: (keyof Job)[] = ["title", "company", "apply_url", "source", "posted_date"];

interface TestResult {
  board: string;
  passed: boolean;
  jobCount: number;
  errors: string[];
  sample: Partial<Job> | null;
}

function validateJobs(board: string, jobs: any[]): TestResult {
  const errors: string[] = [];

  if (!Array.isArray(jobs)) {
    return { board, passed: false, jobCount: 0, errors: ["Return value is not an array"], sample: null };
  }

  for (const [i, job] of jobs.entries()) {
    for (const field of REQUIRED_FIELDS) {
      if (!job[field]) {
        errors.push(`Job[${i}] missing required field: ${field}`);
      }
    }

    if (job.apply_url) {
      try {
        const url = new URL(job.apply_url);
        if (!["http:", "https:"].includes(url.protocol)) {
          errors.push(`Job[${i}] apply_url has invalid protocol: ${job.apply_url}`);
        }
      } catch {
        errors.push(`Job[${i}] apply_url is not a valid URL: ${job.apply_url}`);
      }
    }

    if (job.posted_date) {
      const d = new Date(job.posted_date);
      if (isNaN(d.getTime())) {
        errors.push(`Job[${i}] posted_date is not a valid date: ${job.posted_date}`);
      }
    }
  }

  const sample = jobs.length > 0 ? {
    title: jobs[0].title,
    company: jobs[0].company,
    location: jobs[0].location,
    job_type: jobs[0].job_type,
    posted_date: jobs[0].posted_date,
    apply_url: jobs[0].apply_url,
    tags: jobs[0].tags,
  } : null;

  return {
    board,
    passed: errors.length === 0,
    jobCount: jobs.length,
    errors,
    sample,
  };
}

async function runTest(board: string, scraper: () => Promise<Job[]>): Promise<TestResult> {
  console.log(`\n--- Testing: ${board} ---`);
  try {
    const jobs = await scraper();
    const result = validateJobs(board, jobs);
    return result;
  } catch (err) {
    return {
      board,
      passed: false,
      jobCount: 0,
      errors: [`Scraper threw an exception: ${err}`],
      sample: null,
    };
  }
}

const scrapers: [string, () => Promise<Job[]>][] = [
  ["We Work Remotely", scrapeWeWorkRemotely],
  ["RemoteOK", scrapeRemoteOK],
  ["Working Nomads", scrapeWorkingNomads],
  ["Remote.com", scrapeRemoteCom],
];

const results: TestResult[] = [];

for (const [board, scraper] of scrapers) {
  const result = await runTest(board, scraper);
  results.push(result);
}

console.log("\n\n========== TEST SUMMARY ==========");

let allPassed = true;

for (const r of results) {
  const status = r.passed && r.jobCount > 0 ? "✅ PASS" : r.passed && r.jobCount === 0 ? "⚠️  WARN (0 jobs)" : "❌ FAIL";
  if (!r.passed) allPassed = false;

  console.log(`\n${status}  ${r.board} — ${r.jobCount} jobs`);

  if (r.errors.length > 0) {
    console.log("  Errors:");
    for (const e of r.errors.slice(0, 5)) {
      console.log(`    - ${e}`);
    }
    if (r.errors.length > 5) {
      console.log(`    ... and ${r.errors.length - 5} more`);
    }
  }

  if (r.sample) {
    console.log("  Sample job:");
    console.log(`    title:       ${r.sample.title}`);
    console.log(`    company:     ${r.sample.company}`);
    console.log(`    location:    ${r.sample.location}`);
    console.log(`    job_type:    ${r.sample.job_type ?? "(not set)"}`);
    console.log(`    posted_date: ${r.sample.posted_date}`);
    console.log(`    apply_url:   ${r.sample.apply_url}`);
    console.log(`    tags:        ${(r.sample.tags ?? []).join(", ")}`);
  }
}

console.log("\n==================================");
console.log(allPassed ? "All scrapers passed validation." : "Some scrapers failed — see above.");
console.log("==================================\n");

if (!allPassed) Deno.exit(1);
