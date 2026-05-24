import { Job } from "../types.ts";
import { sanitizeDescriptionHtml, sanitizeText, sanitizeUrl } from "../utils.ts";

export async function scrapeRemoteOK(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching RemoteOK...");
  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobScraper/1.0)'
      }
    });
    const data = await response.json();

    const jobs: Job[] = [];

    for (const item of data.slice(1, 51)) {
      if (item.position && item.company) {
        const url = sanitizeUrl(item.apply_url || item.url || `https://remoteok.com/remote-jobs/${item.id}`);
        if (url) {
          const tags = Array.isArray(item.tags)
            ? item.tags.slice(0, 10).map((tag: any) => sanitizeText(String(tag), 50)).filter(Boolean)
            : null;

          const salary = [item.salary_min, item.salary_max]
            .filter(Boolean)
            .map((v: any) => String(v))
            .join(' - ');

          const description = [
            sanitizeDescriptionHtml(item.description),
            salary ? `Salary: ${salary}` : null,
          ].filter(Boolean).join('\n\n') || null;

          const parseDate = (raw: any): string => {
            if (!raw) return new Date().toISOString();
            // RemoteOK returns Unix epoch seconds (number or numeric string)
            const asUnix = Number(raw) * 1000;
            if (!isNaN(asUnix) && asUnix > 0) {
              const d = new Date(asUnix);
              if (!isNaN(d.getTime())) return d.toISOString();
            }
            // Fall back to ISO string parsing
            const d = new Date(raw);
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
          };

          jobs.push({
            title: sanitizeText(item.position, 200) || "Untitled",
            company: sanitizeText(item.company, 200) || "Unknown",
            location: sanitizeText(item.location, 100) || "Remote",
            description,
            apply_url: url,
            source: "RemoteOK",
            posted_date: parseDate(item.date),
            tags: tags && tags.length > 0 ? tags : ["Remote"],
            job_type: sanitizeText(item.job_type, 50),
          });
        }
      }
    }

    console.log(`[SCRAPER] RemoteOK: Found ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error("[SCRAPER] RemoteOK error:", error);
    return [];
  }
}
