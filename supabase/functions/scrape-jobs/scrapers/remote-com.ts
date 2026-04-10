import { Job } from "../types.ts";
import { sanitizeText, sanitizeUrl } from "../utils.ts";

// RSC (React Server Component) payload line that contains job listings data.
// Remote.com uses Next.js App Router which embeds data as RSC flight protocol.
const JOBS_DATA_PATTERN = /^7:\["\$","\$L\d+",null,(\{.*"jobsData":\[.*\].*\})\]$/m;

function formatSalary(comp: any): string | null {
  if (!comp) return null;
  const symbol = comp.currency?.symbol?.replace('$$', '$') ?? '';
  const freq = comp.frequency ?? '';
  // Remote.com stores amounts in the currency's smallest unit (cents/pence)
  const fmt = (v: number) => (v / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (comp.minimum && comp.maximum) {
    return `${symbol}${fmt(comp.minimum)} - ${symbol}${fmt(comp.maximum)} ${freq}`.trim();
  }
  if (comp.minimum) return `${symbol}${fmt(comp.minimum)}+ ${freq}`.trim();
  if (comp.maximum) return `Up to ${symbol}${fmt(comp.maximum)} ${freq}`.trim();
  return null;
}

function formatLocation(hiringLocation: any): string {
  if (!hiringLocation) return "Remote";
  if (hiringLocation.type === "global") return "Remote (Worldwide)";
  const locs: string[] = (hiringLocation.includedLocations ?? [])
    .map((l: any) => l.value?.name)
    .filter(Boolean);
  return locs.length > 0 ? locs.join(", ") : "Remote";
}

export async function scrapeRemoteCom(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching Remote.com...");
  try {

    const response = await fetch("https://remote.com/jobs", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/x-component',
        'RSC': '1',
        'Next-Router-State-Tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
      }
    });

    if (!response.ok) {
      return [];
    }

    const text = await response.text();

    // Extract the line that contains jobsData
    const match = JOBS_DATA_PATTERN.exec(text);
    if (!match?.[1]) {
      return [];
    }

    let payload: any;
    try {
      payload = JSON.parse(match[1]);
    } catch {
      return [];
    }

    // jobsData is an array of categories, each with a `jobs` array
    const categories: any[] = payload.jobsData ?? [];
    const seen = new Set<string>();
    const jobs: Job[] = [];

    for (const category of categories) {
      for (const item of (category.jobs ?? [])) {
        if (!item.title || !item.companyProfile?.name) continue;
        if (seen.has(item.slug)) continue;
        seen.add(item.slug);

        const rawUrl = item.applyUrl || (item.slug ? `https://remote.com/jobs/position/${item.slug}` : '');
        const applyUrl = sanitizeUrl(rawUrl);
        if (!applyUrl) continue;

        const salary = formatSalary(item.compensation);
        const location = formatLocation(item.hiringLocation);

        const seniority: string[] = (item.seniority ?? [])
          .map((s: string) => s.replace(/_/g, ' '))
          .filter(Boolean);

        jobs.push({
          title: sanitizeText(item.title, 200) || "Untitled",
          company: sanitizeText(item.companyProfile.name, 200) || "Unknown",
          location: sanitizeText(location, 100),
          description: salary ? `Salary: ${salary}` : null,
          apply_url: applyUrl,
          source: "Remote.com",
          posted_date: item.publishedAt
            ? new Date(item.publishedAt).toISOString()
            : new Date().toISOString(),
          tags: seniority.length > 0 ? seniority : ["Remote"],
          job_type: sanitizeText(
            item.employmentType?.replace(/_/g, ' ') ?? null,
            50
          ),
        });

        if (jobs.length >= 50) break;
      }
      if (jobs.length >= 50) break;
    }

    return jobs;
  } catch (error) {
    return [];
  }
}
