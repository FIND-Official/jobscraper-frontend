import { Job } from "../types.ts";
import { sanitizeText, sanitizeUrl } from "../utils.ts";

export async function scrapeWeWorkRemotely(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching We Work Remotely...");
  try {
    const response = await fetch("https://weworkremotely.com/remote-jobs.rss", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobScraper/1.0)'
      }
    });
    const xml = await response.text();

    const jobs: Job[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && jobs.length < 50) {
      const itemXml = match[1];

      const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i.exec(itemXml);
      const linkMatch = /<link>(.*?)<\/link>/i.exec(itemXml);
      const descMatch = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i.exec(itemXml);
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemXml);

      const rawTitle = titleMatch?.[1] || titleMatch?.[2] || '';
      const link = linkMatch?.[1] || '';
      const description = descMatch?.[1] || descMatch?.[2] || '';
      const pubDate = pubDateMatch?.[1] || '';

      const titleParts = rawTitle.split(':');
      const company = titleParts.length > 1 ? titleParts[0].trim() : 'Unknown Company';
      const title = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : rawTitle.trim();

      if (title && link) {
        const url = sanitizeUrl(link);
        if (url) {
          jobs.push({
            title: sanitizeText(title, 200) || "Untitled",
            company: sanitizeText(company, 200) || "Unknown Company",
            location: "Remote",
            description: sanitizeText(description),
            apply_url: url,
            source: "We Work Remotely",
            posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            tags: ["Remote"],
          });
        }
      }
    }

    console.log(`[SCRAPER] We Work Remotely: Found ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error("[SCRAPER] We Work Remotely error:", error);
    return [];
  }
}
