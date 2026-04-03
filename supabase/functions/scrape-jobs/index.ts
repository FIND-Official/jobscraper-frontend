import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
  job_type?: string | null;
}

interface ScrapeRequest {
  boards?: string[];
  searchQuery?: string;
  experienceLevel?: string;
  benefits?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SCRAPER] ${step}${detailsStr}`);
};

// AGGRESSIVE HTML CLEANER - Removes ALL HTML tags
const cleanHTML = (text: string | null | undefined, maxLength: number = 5000): string | null => {
  if (!text) return null;

  let sanitized = String(text);

  // ✅ 1. Remove images only
  sanitized = sanitized.replace(/<img[^>]*>/gi, '');

  // ✅ 2. KEEP structure (convert instead of deleting)
  sanitized = sanitized.replace(/<\/p>/gi, '\n\n');
  sanitized = sanitized.replace(/<br\s*\/?>/gi, '\n');
  sanitized = sanitized.replace(/<\/li>/gi, '\n');
  sanitized = sanitized.replace(/<li>/gi, '• ');

  // ✅ 3. Remove ONLY unwanted tags (keep text)
  sanitized = sanitized.replace(/<\/?(div|span|section|ul)[^>]*>/gi, '');

  // ✅ 4. Remove attributes but KEEP content
  sanitized = sanitized.replace(/\b\w+="[^"]*"/g, '');

  // ✅ 5. Remove remaining tags BUT AFTER structure preserved
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // ✅ 6. Decode entities
  sanitized = sanitized
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // ✅ 7. Fix URLs
  sanitized = sanitized.replace(/https?:\/{1,}/g, 'https://');
  sanitized = sanitized.replace(/https:\s+/g, 'https://');
  sanitized = sanitized.replace(/http:\s+/g, 'http://');

  // ✅ 8. Clean spacing but KEEP line breaks
  sanitized = sanitized
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  return sanitized.substring(0, maxLength) || null;
};

const sanitizeText = (text: string | null | undefined, maxLength: number = 5000): string | null => {
  return cleanHTML(text, maxLength);
};

const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(String(url));
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};

async function scrapeWeWorkRemotely(): Promise<Job[]> {
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
        const url = sanitizeUrl(item.apply_url || item.url || `https://remoteok.com/remote-jobs/${item.id}`);
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
            posted_date: item.date ? new Date(Number(item.date) * 1000).toISOString() : new Date().toISOString(),
            tags: tags && tags.length > 0 ? tags : ["Remote"],
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

async function scrapeWorkingNomads(): Promise<Job[]> {
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

async function scrapeRemoteCom(): Promise<Job[]> {
  console.log("[SCRAPER] Remote.com - using placeholder (API not publicly available)");
  return [];
}

function filterJobs(jobs: Job[], searchQuery?: string, experienceLevel?: string): Job[] {
  let filtered = jobs;
  
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(job => 
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query) ||
      job.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  if (experienceLevel && experienceLevel !== 'any') {
    const levelKeywords: Record<string, string[]> = {
      'entry': ['entry', 'junior', 'jr', 'associate', 'intern', 'graduate'],
      'mid': ['mid', 'intermediate', '2-5 years', '3+ years'],
      'senior': ['senior', 'sr', 'lead', 'principal', 'staff', '5+ years', 'architect']
    };
    
    const keywords = levelKeywords[experienceLevel] || [];
    if (keywords.length > 0) {
      filtered = filtered.filter(job => {
        const text = `${job.title} ${job.description || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw));
      });
    }
  }
  
  return filtered;
}

async function getUserSubscriptionTier(userEmail: string, stripeKey: string): Promise<"free" | "pro"> {
  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length === 0) {
      return "free";
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    return subscriptions.data.length > 0 ? "pro" : "free";
  } catch (error) {
    logStep("Error checking subscription", { error: String(error) });
    return "free";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestData: ScrapeRequest = {};
    try {
      requestData = await req.json();
    } catch {
      requestData = { boards: ["We Work Remotely", "RemoteOK"] };
    }
    
    const { boards = ["We Work Remotely"], searchQuery, experienceLevel } = requestData;
    
    logStep("Starting scrape", { boards, searchQuery, experienceLevel });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    let subscriptionTier: "free" | "pro" = "free";
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      
      if (userData?.user?.email) {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          subscriptionTier = await getUserSubscriptionTier(userData.user.email, stripeKey);
        }
        logStep("User subscription tier", { email: userData.user.email, tier: subscriptionTier });
      }
    }

    const maxBoards = subscriptionTier === "pro" ? 4 : 2;
    if (boards.length > maxBoards) {
      logStep("Board limit exceeded", { requested: boards.length, max: maxBoards, tier: subscriptionTier });
      return new Response(
        JSON.stringify({ 
          error: `${subscriptionTier === "free" ? "Free" : "Pro"} plan users can select up to ${maxBoards} boards. ${subscriptionTier === "free" ? "Upgrade to Pro for up to 4 boards." : ""}`,
          code: "BOARD_LIMIT_EXCEEDED"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    const scrapePromises: Promise<Job[]>[] = [];
    
    for (const board of boards) {
      switch (board) {
        case "We Work Remotely":
          scrapePromises.push(scrapeWeWorkRemotely());
          break;
        case "RemoteOK":
          scrapePromises.push(scrapeRemoteOK());
          break;
        case "Working Nomads":
          scrapePromises.push(scrapeWorkingNomads());
          break;
        case "Remote.com":
          scrapePromises.push(scrapeRemoteCom());
          break;
        default:
          console.log(`[SCRAPER] Unknown board: ${board}`);
      }
    }
    
    const results = await Promise.all(scrapePromises);
    let allJobs = results.flat();
    
    console.log(`[SCRAPER] Total jobs scraped: ${allJobs.length}`);
    
    allJobs = filterJobs(allJobs, searchQuery, experienceLevel);
    console.log(`[SCRAPER] Jobs after filtering: ${allJobs.length}`);

    if (allJobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          count: 0,
          jobs: [],
          message: "No jobs found matching your criteria" 
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
        jobs: allJobs,
        boards: boards,
        searchQuery: searchQuery || null,
        message: `Successfully scraped ${allJobs.length} jobs from ${boards.length} board(s)` 
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