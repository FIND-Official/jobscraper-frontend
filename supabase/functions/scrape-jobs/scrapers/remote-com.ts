import { Job } from "../types.ts";
import { sanitizeText, sanitizeUrl } from "../utils.ts";

export async function scrapeRemoteCom(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching Remote.com...");
  try {
    const response = await fetch("https://remote.com/jobs", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      console.log(`[SCRAPER] Remote.com responded with status: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Remote.com is a Next.js app — extract the embedded JSON payload
    const nextDataMatch = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/.exec(html);

    if (!nextDataMatch?.[1]) {
      console.log("[SCRAPER] Remote.com: __NEXT_DATA__ not found in page");
      return [];
    }

    let nextData: any;
    try {
      nextData = JSON.parse(nextDataMatch[1]);
    } catch {
      console.log("[SCRAPER] Remote.com: Failed to parse __NEXT_DATA__ JSON");
      return [];
    }

    const pageProps = nextData?.props?.pageProps;

    // Remote.com may nest jobs under different keys depending on the page version
    const rawJobs: any[] =
      pageProps?.jobs ||
      pageProps?.positions ||
      pageProps?.data?.jobs ||
      pageProps?.initialData?.jobs ||
      pageProps?.listingsData?.jobs ||
      [];

    if (!Array.isArray(rawJobs) || rawJobs.length === 0) {
      console.log("[SCRAPER] Remote.com: No jobs found in __NEXT_DATA__. Available keys:", Object.keys(pageProps || {}));
      return [];
    }

    const jobs: Job[] = [];

    for (const item of rawJobs.slice(0, 50)) {
      const title = item.title || item.name || item.position;
      const companyRaw = item.company?.name || item.company || item.employer_name || item.employer;
      const rawUrl = item.url || item.apply_url || item.application_url || item.link;

      if (!title || !companyRaw) continue;

      const slug = item.slug || item.id;
      const applyUrl = sanitizeUrl(rawUrl || (slug ? `https://remote.com/jobs/${slug}` : ''));
      if (!applyUrl) continue;

      const salary = [item.salary_min, item.salary_max]
        .filter(Boolean)
        .map((v: any) => String(v))
        .join(' - ');

      const tags: string[] = Array.isArray(item.tags)
        ? item.tags.slice(0, 10).map((t: any) => sanitizeText(String(t), 50) || '').filter(Boolean)
        : [];

      jobs.push({
        title: sanitizeText(title, 200) || "Untitled",
        company: sanitizeText(String(companyRaw), 200) || "Unknown",
        location: sanitizeText(item.location || item.region || "Remote", 100),
        description: sanitizeText(
          [item.description, item.summary, salary ? `Salary: ${salary}` : null]
            .filter(Boolean)
            .join('\n\n')
        ),
        apply_url: applyUrl,
        source: "Remote.com",
        posted_date: item.published_at || item.created_at
          ? new Date(item.published_at || item.created_at).toISOString()
          : new Date().toISOString(),
        tags: tags.length > 0 ? tags : ["Remote"],
        job_type: sanitizeText(item.job_type || item.employment_type || item.type, 50),
      });
    }

    console.log(`[SCRAPER] Remote.com: Found ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error("[SCRAPER] Remote.com error:", error);
    return [];
  }
}
