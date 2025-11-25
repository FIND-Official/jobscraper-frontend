import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Job {
  title: string;
  company: string;
  location: string;
  job_type: string;
  description: string;
  apply_url: string;
  source: string;
  posted_date: string | null;
  tags: string[];
}

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
        const company = parts[0]?.trim() || "Unknown Company";
        const title = parts[1]?.trim() || fullTitle;
        
        jobs.push({
          title,
          company,
          location: "Remote",
          job_type: categoryMatch?.[1] || "Full-time",
          description: descMatch?.[1] || "",
          apply_url: linkMatch[1],
          source: "We Work Remotely",
          posted_date: pubDateMatch?.[1] || null,
          tags: categoryMatch?.[1] ? [categoryMatch[1]] : [],
        });
      }
    }
    
    console.log(`[SCRAPER] We Work Remotely: Found ${jobs.length} jobs`);
    return jobs.slice(0, 50); // Limit to 50 jobs
  } catch (error) {
    console.error("[SCRAPER] We Work Remotely error:", error);
    return [];
  }
}

async function scrapeRemoteOK(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching RemoteOK...");
  try {
    const response = await fetch("https://remoteok.com/api");
    const data = await response.json();
    
    const jobs: Job[] = [];
    
    for (const item of data.slice(1, 51)) { // Skip first item (metadata) and limit to 50
      if (item.position && item.company) {
        jobs.push({
          title: item.position,
          company: item.company,
          location: "Remote",
          job_type: item.position_type || "Full-time",
          description: item.description || "",
          apply_url: item.apply_url || `https://remoteok.com/remote-jobs/${item.id}`,
          source: "RemoteOK",
          posted_date: item.date ? new Date(item.date).toISOString() : null,
          tags: item.tags || [],
        });
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
  console.log("[SCRAPER] Fetching Remote.com...");
  try {
    // Remote.com doesn't have a public API, so we'll return empty for now
    // In production, you'd need to implement proper scraping or use their API if available
    console.log("[SCRAPER] Remote.com: API not publicly available");
    return [];
  } catch (error) {
    console.error("[SCRAPER] Remote.com error:", error);
    return [];
  }
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

    // Scrape all sources in parallel
    const [wwrJobs, remoteOKJobs, remoteComJobs] = await Promise.all([
      scrapeWeWorkRemotely(),
      scrapeRemoteOK(),
      scrapeRemoteCom(),
    ]);

    const allJobs = [...wwrJobs, ...remoteOKJobs, ...remoteComJobs];
    console.log(`[SCRAPER] Total jobs scraped: ${allJobs.length}`);

    // Insert jobs into database (using upsert to avoid duplicates)
    const { data, error } = await supabaseClient
      .from("jobs")
      .upsert(allJobs, {
        onConflict: "title,company,source",
        ignoreDuplicates: true,
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
  } catch (error) {
    console.error("[SCRAPER] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});