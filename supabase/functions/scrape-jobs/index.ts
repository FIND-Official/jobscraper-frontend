import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Job {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  apply_url: string;
  source: string;
  posted_date: string | null;
  tags: string[] | null;
}

// Sanitize text content to prevent XSS and injection attacks
const sanitizeText = (text: string | null | undefined, maxLength: number = 5000): string | null => {
  if (!text) return null;
  
  // Remove HTML tags and scripts
  let sanitized = String(text)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '');
  
  // Remove dangerous characters and normalize whitespace
  sanitized = sanitized
    .replace(/[<>]/g, '')
    .replace(/&lt;/g, '')
    .replace(/&gt;/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
  
  // Limit length
  return sanitized.substring(0, maxLength);
};

const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(String(url));
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};

async function scrapeWeWorkRemotely(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching We Work Remotely RSS...");
  try {
    const response = await fetch("https://weworkremotely.com/remote-jobs.rss");
    const text = await response.text();
    
    const jobs: Job[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(text)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(itemContent);
      const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent);
      const descMatch = /<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(itemContent);
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/.exec(itemContent);
      const categoryMatch = /<category><!\[CDATA\[(.*?)\]\]><\/category>/.exec(itemContent);
      
      if (titleMatch && linkMatch) {
        const fullTitle = titleMatch[1];
        const parts = fullTitle.split(":");
        const company = sanitizeText(parts[0]?.trim(), 200) || "Unknown Company";
        const title = sanitizeText(parts[1]?.trim() || fullTitle, 200) || "Untitled";
        const url = sanitizeUrl(linkMatch[1]);
        
        if (url) {
          const category = sanitizeText(categoryMatch?.[1], 50);
          jobs.push({
            title,
            company,
            location: "Remote",
            description: sanitizeText(descMatch?.[1]),
            apply_url: url,
            source: "We Work Remotely",
            posted_date: pubDateMatch?.[1] ? new Date(pubDateMatch[1]).toISOString() : null,
            tags: category ? [category] : null,
          });
        }
      }
    }
    
    console.log(`[SCRAPER] We Work Remotely: Found ${jobs.length} jobs`);
    return jobs.slice(0, 50);
  } catch (error) {
    console.error("[SCRAPER] We Work Remotely error:", error);
    return [];
  }
}

async function scrapeRemoteOK(): Promise<Job[]> {
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
        const url = sanitizeUrl(item.apply_url || `https://remoteok.com/remote-jobs/${item.id}`);
        if (url) {
          const tags = Array.isArray(item.tags) 
            ? item.tags.slice(0, 10).map((tag: any) => sanitizeText(String(tag), 50)).filter(Boolean)
            : null;
            
          jobs.push({
            title: sanitizeText(item.position, 200) || "Untitled",
            company: sanitizeText(item.company, 200) || "Unknown",
            location: sanitizeText(item.location, 100) || "Remote",
            description: sanitizeText(item.description),
            apply_url: url,
            source: "RemoteOK",
            posted_date: item.date ? new Date(Number(item.date) * 1000).toISOString() : null,
            tags: tags && tags.length > 0 ? tags : null,
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

async function scrapeRemoteCom(): Promise<Job[]> {
  console.log("[SCRAPER] Remote.com API not publicly available");
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SCRAPER] Starting job scraping...");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const [wwrJobs, remoteOKJobs, remoteComJobs] = await Promise.all([
      scrapeWeWorkRemotely(),
      scrapeRemoteOK(),
      scrapeRemoteCom(),
    ]);

    const allJobs = [...wwrJobs, ...remoteOKJobs, ...remoteComJobs];
    console.log(`[SCRAPER] Total jobs scraped: ${allJobs.length}`);

    if (allJobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          count: 0,
          message: "No jobs found from any source" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const { error } = await supabaseClient
      .from("jobs")
      .upsert(allJobs, {
        onConflict: "title,company,source",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("[SCRAPER] Database error:", error);
      throw error;
    }

    console.log("[SCRAPER] Jobs successfully saved to database");

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: allJobs.length,
        message: `Successfully scraped ${allJobs.length} jobs` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[SCRAPER] Error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
