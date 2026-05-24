import { Job } from "../types.ts";
import { sanitizeDescriptionHtml, sanitizeText, sanitizeUrl } from "../utils.ts";

const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; JobScraper/1.0)',
};

const extractCdataOrText = (
  xml: string,
  tagName: string,
): string => {
  const match = new RegExp(
    `<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>|<${tagName}>([\\s\\S]*?)<\\/${tagName}>`,
    'i',
  ).exec(xml);

  return match?.[1] || match?.[2] || '';
};

const getJsonLdDescription = (html: string): string | null => {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim());
      const nodes = Array.isArray(data) ? data : [data];
      const posting = nodes.find((node) => node?.["@type"] === "JobPosting");
      if (typeof posting?.description === "string") return posting.description;
    } catch {
      // Ignore malformed or unrelated JSON-LD blocks.
    }
  }

  return null;
};

const getPageDescriptionHtml = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;

    const html = await response.text();
    const jsonLdDescription = getJsonLdDescription(html);
    if (jsonLdDescription) return jsonLdDescription;

    const contentMatch = /<div[^>]*class=["'][^"']*\bcontent\b[^"']*["'][^>]*>([\s\S]*?)(?:<div[^>]*class=["'][^"']*(?:company-card|listing-sidebar|main-footer|related)[^"']*["']|<footer\b|<\/main>)/i.exec(html);
    return contentMatch?.[1] || null;
  } catch (error) {
    console.warn("[SCRAPER] We Work Remotely detail fetch failed:", error);
    return null;
  }
};

const looksLikeStrippedDescription = (value: string): boolean => {
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return false;

  return /(?:^|[\s>])(?:p|ul|ol|li|h[1-6]|strong|b)(?=(?:\/?[a-z]|[A-Z0-9#]))|\/(?:p|ul|ol|li|h[1-6]|strong|b)(?=$|\s|[a-z<])|(?:div|span)\s+(?:class|id|style|data-[\w-]+)=|(?:pstrong|pb|pbr|brp|pulli|lili|libr|ulp|ulbr|divspan|spanstrong|\/spanspan|\/divdiv)/i.test(
    value,
  );
};

const textLength = (html: string | null): number =>
  html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length || 0;

export async function scrapeWeWorkRemotely(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching We Work Remotely...");
  try {
    const response = await fetch("https://weworkremotely.com/remote-jobs.rss", {
      headers,
    });
    const xml = await response.text();

    const jobs: Job[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && jobs.length < 50) {
      const itemXml = match[1];

      const linkMatch = /<link>(.*?)<\/link>/i.exec(itemXml);
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemXml);

      const rawTitle = extractCdataOrText(itemXml, 'title');
      const link = linkMatch?.[1] || '';
      const description = extractCdataOrText(itemXml, 'description');
      const pubDate = pubDateMatch?.[1] || '';

      const titleParts = rawTitle.split(':');
      const company = titleParts.length > 1 ? titleParts[0].trim() : 'Unknown Company';
      const title = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : rawTitle.trim();

      if (title && link) {
        const url = sanitizeUrl(link);
        if (url) {
          const feedDescription = sanitizeDescriptionHtml(description);
          const shouldFetchDetail =
            !feedDescription ||
            feedDescription.length < 1200 ||
            feedDescription.length >= 49000 ||
            looksLikeStrippedDescription(description);
          const pageDescription = shouldFetchDetail
            ? await getPageDescriptionHtml(url)
            : null;
          const pageDescriptionHtml = sanitizeDescriptionHtml(pageDescription);
          const feedTextLength = textLength(feedDescription);
          const pageTextLength = textLength(pageDescriptionHtml);
          const sanitizedDescription =
            pageDescriptionHtml &&
            (!feedDescription || pageTextLength >= feedTextLength * 0.8)
              ? pageDescriptionHtml
              : feedDescription || pageDescriptionHtml;

          jobs.push({
            title: sanitizeText(title, 200) || "Untitled",
            company: sanitizeText(company, 200) || "Unknown Company",
            location: "Remote",
            description: sanitizedDescription,
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
