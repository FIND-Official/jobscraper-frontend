import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { scrapeRemoteOK } from "./scrapers/remoteok.ts";
import { scrapeWeWorkRemotely } from "./scrapers/weworkremotely.ts";
import { scrapeWorkingNomads } from "./scrapers/workingnomads.ts";
import type { Job } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANONYMOUS_LIMIT = 2;

type ScrapeRequest = {
  boards?: string[];
  searchQuery?: string;
  experienceLevel?: string;
  anonymousId?: string;
};

const normalizeSearchText = (value: string | null | undefined): string =>
  value?.toLowerCase().replace(/\s+/g, " ").trim() || "";

const getJobSearchText = (job: Job): string =>
  normalizeSearchText(
    [
      job.title,
      job.company,
      job.location,
      job.job_type,
      job.description,
      ...(job.tags || []),
    ]
      .filter(Boolean)
      .join(" "),
  );

const matchesExperienceLevel = (
  job: Job,
  experienceLevel?: string,
): boolean => {
  if (!experienceLevel || experienceLevel === "any") return true;

  const patterns: Record<string, RegExp[]> = {
    entry: [
      /\bentry[-\s]?level\b/i,
      /\bjunior\b/i,
      /\bjr\.?\b/i,
      /\bintern(ship)?\b/i,
      /\bgraduate\b/i,
      /\bnew grad\b/i,
      /\bearly career\b/i,
      /\bassociate\b/i,
      /\bapprentice(ship)?\b/i,
      /\b0\s*(?:-|to|\+)\s*2\s+years?\b/i,
    ],
    mid: [
      /\bmid[-\s]?level\b/i,
      /\bintermediate\b/i,
      /\b2\s*\+\s*years?\b/i,
      /\b3\s*\+\s*years?\b/i,
      /\b2\s*(?:-|to)\s*4\s+years?\b/i,
      /\b3\s*(?:-|to)\s*5\s+years?\b/i,
    ],
    senior: [
      /\bsenior\b/i,
      /\bsr\.?\b/i,
      /\blead\b/i,
      /\bstaff\b/i,
      /\bprincipal\b/i,
      /\barchitect\b/i,
      /\bdirector\b/i,
      /\bhead of\b/i,
      /\b5\s*\+\s*years?\b/i,
      /\b6\s*\+\s*years?\b/i,
      /\b7\s*\+\s*years?\b/i,
      /\b8\s*\+\s*years?\b/i,
    ],
  };

  const levelPatterns = patterns[experienceLevel];
  if (!levelPatterns) return true;

  const searchText = getJobSearchText(job);
  return levelPatterns.some((pattern) => pattern.test(searchText));
};

const filterJobs = (
  jobs: Job[],
  searchQuery?: string,
  experienceLevel?: string,
): Job[] => {
  const query = normalizeSearchText(searchQuery);

  return jobs.filter((job) => {
    const matchesQuery =
      !query ||
      query === "all jobs" ||
      query.split(" ").every((term) => getJobSearchText(job).includes(term));

    return matchesQuery && matchesExperienceLevel(job, experienceLevel);
  });
};

const getUserSubscriptionTier = async (
  supabaseClient: any,
  userId: string,
): Promise<"free" | "pro"> => {
  try {
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || profile?.subscription_tier !== "pro") return "free";
    if (!profile.subscription_expires_at) return "pro";

    const isActive = new Date(profile.subscription_expires_at).getTime() > Date.now();
    if (isActive) return "pro";

    await supabaseClient
      .from("profiles")
      .update({
        subscription_tier: "free",
        subscription_expires_at: null,
        subscription_cancel_at_period_end: false,
        subscription_cancelled_at: null,
      })
      .eq("id", userId);

    return "free";
  } catch {
    return "free";
  }
};

const scrapeBoard = (board: string): Promise<Job[]> => {
  switch (board) {
    case "We Work Remotely":
      return scrapeWeWorkRemotely();
    case "RemoteOK":
      return scrapeRemoteOK();
    case "Working Nomads":
      return scrapeWorkingNomads();
    case "Remote.com":
      return Promise.resolve([]);
    default:
      return Promise.resolve([]);
  }
};

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

    const {
      boards = ["We Work Remotely"],
      searchQuery,
      experienceLevel,
      anonymousId,
    } = requestData;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const authHeader = req.headers.get("Authorization");

    let subscriptionTier: "free" | "pro" = "free";
    let isAuthenticated = false;
    let anonymousVisitor: any = null;
    let anonymousScrapeCount = 0;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      isAuthenticated = !!userData?.user;

      if (userData?.user?.id) {
        subscriptionTier = await getUserSubscriptionTier(
          supabaseClient,
          userData.user.id,
        );
      }
    }

    if (!isAuthenticated && anonymousId) {
      const { data: existingVisitor, error: findError } = await supabaseClient
        .from("anonymous_visitors")
        .select("*")
        .eq("id", anonymousId)
        .maybeSingle();

      if (findError) throw findError;
      anonymousVisitor = existingVisitor;

      if (!anonymousVisitor) {
        const { data: createdVisitor, error: createError } = await supabaseClient
          .from("anonymous_visitors")
          .insert({ id: anonymousId, scrape_count: 0 })
          .select()
          .single();

        if (createError) throw createError;
        anonymousVisitor = createdVisitor;
      }

      if (anonymousVisitor.scrape_count >= ANONYMOUS_LIMIT) {
        return new Response(
          JSON.stringify({
            success: false,
            code: "ANONYMOUS_LIMIT_REACHED",
            anonymousScrapeCount: anonymousVisitor.scrape_count,
            error: "Anonymous scrape limit reached. Please sign up.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          },
        );
      }
    }

    const maxBoards = subscriptionTier === "pro" ? 4 : 2;
    if (boards.length > maxBoards) {
      return new Response(
        JSON.stringify({
          success: false,
          code: "BOARD_LIMIT_EXCEEDED",
          error: `Maximum ${maxBoards} boards allowed.`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    const results = await Promise.all(boards.map(scrapeBoard));
    const scrapedJobs = results.flat();
    const matchingJobs = filterJobs(scrapedJobs, searchQuery, experienceLevel);

    const incrementAnonymousScrapeCount = async () => {
      if (!anonymousVisitor) return;

      const { data: updatedVisitor, error: updateError } = await supabaseClient
        .from("anonymous_visitors")
        .update({
          scrape_count: anonymousVisitor.scrape_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", anonymousVisitor.id)
        .select()
        .single();

      if (updateError) throw updateError;
      anonymousScrapeCount = updatedVisitor.scrape_count;
    };

    if (scrapedJobs.length === 0) {
      await incrementAnonymousScrapeCount();
      return new Response(
        JSON.stringify({
          success: true,
          jobs: [],
          count: 0,
          scrapedCount: 0,
          anonymousScrapeCount,
          message: "No jobs found",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const { error } = await supabaseClient.from("jobs").upsert(scrapedJobs, {
      onConflict: "title,company,source",
      ignoreDuplicates: false,
    });

    if (error) throw error;

    await incrementAnonymousScrapeCount();
    return new Response(
      JSON.stringify({
        success: true,
        count: matchingJobs.length,
        scrapedCount: scrapedJobs.length,
        jobs: matchingJobs,
        boards,
        searchQuery: searchQuery || null,
        experienceLevel: experienceLevel || null,
        anonymousScrapeCount,
        message: `Successfully scraped ${scrapedJobs.length} jobs`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
