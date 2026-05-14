import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const ANONYMOUS_LIMIT = 2;
const logStep = (step, details)=>{
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SCRAPER] ${step}${detailsStr}`);
};
const sanitizeText = (text, maxLength = 5000)=>{
  if (!text) return null;
  let sanitized = String(text).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<[^>]*>/g, "");
  sanitized = sanitized.replace(/[<>]/g, "").replace(/&lt;/g, "").replace(/&gt;/g, "").replace(/javascript:/gi, "").replace(/on\w+=/gi, "").trim();
  return sanitized.substring(0, maxLength);
};
const sanitizeUrl = (url)=>{
  if (!url) return "";
  try {
    const parsedUrl = new URL(String(url));
    if (![
      "http:",
      "https:"
    ].includes(parsedUrl.protocol)) {
      return "";
    }
    return url;
  } catch  {
    return "";
  }
};
async function scrapeWeWorkRemotely() {
  try {
    const response = await fetch("https://weworkremotely.com/remote-jobs.rss", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobScraper/1.0)"
      }
    });
    const xml = await response.text();
    const jobs = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while((match = itemRegex.exec(xml)) !== null && jobs.length < 50){
      const itemXml = match[1];
      const titleMatch = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i.exec(itemXml);
      const linkMatch = /<link>(.*?)<\/link>/i.exec(itemXml);
      const descMatch = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i.exec(itemXml);
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemXml);
      const rawTitle = titleMatch?.[1] || titleMatch?.[2] || "";
      const link = linkMatch?.[1] || "";
      const description = descMatch?.[1] || descMatch?.[2] || "";
      const pubDate = pubDateMatch?.[1] || "";
      const titleParts = rawTitle.split(":");
      const company = titleParts.length > 1 ? titleParts[0].trim() : "Unknown Company";
      const title = titleParts.length > 1 ? titleParts.slice(1).join(":").trim() : rawTitle.trim();
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
            tags: [
              "Remote"
            ]
          });
        }
      }
    }
    return jobs;
  } catch (error) {
    console.error("[SCRAPER] We Work Remotely error:", error);
    return [];
  }
}
async function scrapeRemoteOK() {
  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobScraper/1.0)"
      }
    });
    const data = await response.json();
    const jobs = [];
    for (const item of data.slice(1, 51)){
      if (item.position && item.company) {
        const url = sanitizeUrl(item.apply_url || item.url || `https://remoteok.com/remote-jobs/${item.id}`);
        if (url) {
          const tags = Array.isArray(item.tags) ? item.tags.slice(0, 10).map((tag)=>sanitizeText(String(tag), 50)).filter(Boolean) : null;
          jobs.push({
            title: sanitizeText(item.position, 200) || "Untitled",
            company: sanitizeText(item.company, 200) || "Unknown",
            location: sanitizeText(item.location, 100) || "Remote",
            description: sanitizeText(item.description),
            apply_url: url,
            source: "RemoteOK",
            posted_date: item.date ? new Date(Number(item.date) * 1000).toISOString() : new Date().toISOString(),
            tags: tags && tags.length > 0 ? tags : [
              "Remote"
            ]
          });
        }
      }
    }
    return jobs;
  } catch (error) {
    console.error("[SCRAPER] RemoteOK error:", error);
    return [];
  }
}
async function scrapeWorkingNomads() {
  try {
    const response = await fetch("https://www.workingnomads.com/api/exposed_jobs/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; JobScraper/1.0)"
      }
    });
    const data = await response.json();
    const jobs = [];
    for (const item of data.slice(0, 50)){
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
            tags: item.category_name ? [
              sanitizeText(item.category_name, 50) || "Remote"
            ] : [
              "Remote"
            ],
            job_type: sanitizeText(item.job_type, 50)
          });
        }
      }
    }
    return jobs;
  } catch (error) {
    console.error("[SCRAPER] Working Nomads error:", error);
    return [];
  }
}
async function scrapeRemoteCom() {
  return [];
}
function filterJobs(jobs, searchQuery, experienceLevel) {
  let filtered = jobs;
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((job)=>job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query) || job.description?.toLowerCase().includes(query) || job.tags?.some((tag)=>tag.toLowerCase().includes(query)));
  }
  return filtered;
}
async function getUserSubscriptionTier(userEmail, stripeKey) {
  try {
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil"
    });
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });
    if (customers.data.length === 0) {
      return "free";
    }
    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1
    });
    return subscriptions.data.length > 0 ? "pro" : "free";
  } catch  {
    return "free";
  }
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    let requestData = {};
    try {
      requestData = await req.json();
    } catch  {
      requestData = {
        boards: [
          "We Work Remotely",
          "RemoteOK"
        ]
      };
    }
    const { boards = [
      "We Work Remotely"
    ], searchQuery, experienceLevel, anonymousId } = requestData;
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const authHeader = req.headers.get("Authorization");
    let subscriptionTier = "free";
    let isAuthenticated = false;
    let anonymousVisitor = null;
    let anonymousScrapeCount = 0;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      isAuthenticated = !!userData?.user;
      if (userData?.user?.email) {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          subscriptionTier = await getUserSubscriptionTier(userData.user.email, stripeKey);
        }
      }
    }
    // ANONYMOUS USERS
    if (!isAuthenticated && anonymousId) {
      const { data: existingVisitor, error: findError } = await supabaseClient.from("anonymous_visitors").select("*").eq("id", anonymousId).maybeSingle();
      if (findError) throw findError;
      anonymousVisitor = existingVisitor;
      // CREATE VISITOR
      if (!anonymousVisitor) {
        const { data: createdVisitor, error: createError } = await supabaseClient.from("anonymous_visitors").insert({
          id: anonymousId,
          scrape_count: 0
        }).select().single();
        if (createError) throw createError;
        anonymousVisitor = createdVisitor;
      }
      // LIMIT CHECK
      if (anonymousVisitor.scrape_count >= ANONYMOUS_LIMIT) {
        return new Response(JSON.stringify({
          success: false,
          code: "ANONYMOUS_LIMIT_REACHED",
          anonymousScrapeCount: anonymousVisitor.scrape_count,
          error: "Anonymous scrape limit reached. Please sign up."
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 403
        });
      }
    }
    const maxBoards = subscriptionTier === "pro" ? 4 : 2;
    if (boards.length > maxBoards) {
      return new Response(JSON.stringify({
        success: false,
        code: "BOARD_LIMIT_EXCEEDED",
        error: `Maximum ${maxBoards} boards allowed.`
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 403
      });
    }
    const scrapePromises = [];
    for (const board of boards){
      switch(board){
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
      }
    }
    const results = await Promise.all(scrapePromises);
    let allJobs = results.flat();
    allJobs = filterJobs(allJobs, searchQuery, experienceLevel);
    const incrementAnonymousScrapeCount = async ()=>{
      if (!anonymousVisitor) return;
      const newCount = anonymousVisitor.scrape_count + 1;
      const { data: updatedVisitor, error: updateError } = await supabaseClient.from("anonymous_visitors").update({
        scrape_count: newCount,
        updated_at: new Date().toISOString()
      }).eq("id", anonymousVisitor.id).select().single();
      if (updateError) throw updateError;
      anonymousScrapeCount = updatedVisitor.scrape_count;
    };
    // NO JOBS
    if (allJobs.length === 0) {
      await incrementAnonymousScrapeCount();
      return new Response(JSON.stringify({
        success: true,
        jobs: [],
        anonymousScrapeCount,
        message: "No jobs found"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    // SAVE JOBS
    const { error } = await supabaseClient.from("jobs").upsert(allJobs, {
      onConflict: "title,company,source",
      ignoreDuplicates: false
    });
    if (error) throw error;
    // INCREMENT AFTER SUCCESS
    await incrementAnonymousScrapeCount();
    return new Response(JSON.stringify({
      success: true,
      count: allJobs.length,
      jobs: allJobs,
      boards,
      searchQuery: searchQuery || null,
      anonymousScrapeCount,
      message: `Successfully scraped ${allJobs.length} jobs`
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || String(error)
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
