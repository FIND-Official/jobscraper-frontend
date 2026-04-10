import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

import { Job, ScrapeRequest } from "./types.ts";
import { logStep } from "./utils.ts";
import { scrapeWeWorkRemotely } from "./scrapers/weworkremotely.ts";
import { scrapeRemoteOK } from "./scrapers/remoteok.ts";
import { scrapeWorkingNomads } from "./scrapers/workingnomads.ts";
import { scrapeRemoteCom } from "./scrapers/remote-com.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
