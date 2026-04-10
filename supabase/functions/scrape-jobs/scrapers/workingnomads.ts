import { Job } from "../types.ts";
import { sanitizeText, sanitizeUrl } from "../utils.ts";

export async function scrapeWorkingNomads(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching Working Nomads...");
  try {
    const response = await fetch("https://www.workingnomads.com/api/exposed_jobs/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobScraper/1.0)'
      }
    });
    const data = await response.json();

    const jobs: Job[] = [];

    for (const item of data.slice(0, 50)) {
      if (item.title && item.company_name) {
        const url = sanitizeUrl(item.url);
        if (url) {
          jobs.push({
            title: sanitizeText(item.title, 200) || "Untitled",
            company: sanitizeText(item.company_name, 200) || "Unknown",
            location: sanitizeText(item.location, 100) || "Remote",
            description: sanitizeText(item.description),
            apply_url: url,
            source: "Working Nomads",
            posted_date: item.pub_date ? new Date(item.pub_date).toISOString() : new Date().toISOString(),
            tags: item.category_name ? [sanitizeText(item.category_name, 50) || "Remote"] : ["Remote"],
            job_type: sanitizeText(item.job_type, 50),
          });
        }
      }
    }

    console.log(`[SCRAPER] Working Nomads: Found ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error("[SCRAPER] Working Nomads error:", error);
    return [];
  }
}
