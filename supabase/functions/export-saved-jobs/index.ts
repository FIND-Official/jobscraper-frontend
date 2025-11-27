import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EXPORT-SAVED-JOBS] ${step}${detailsStr}`);
};

const sanitizeCSVValue = (value: string | null): string => {
  if (!value) return '';
  
  // Convert to string and trim
  const stringValue = String(value).trim();
  
  // Prefix dangerous characters to prevent formula injection
  if (/^[=+\-@]/.test(stringValue)) {
    return `'${stringValue.replace(/"/g, '""')}`;
  }
  
  // Escape double quotes by doubling them
  return stringValue.replace(/"/g, '""');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check subscription status via Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found - user not subscribed");
      return new Response(JSON.stringify({ error: "Pro subscription required to export jobs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({ error: "Pro subscription required to export jobs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Active subscription verified", { subscriptionId: subscriptions.data[0].id });

    // Fetch saved jobs for the user
    const { data: savedJobs, error: jobsError } = await supabaseClient
      .from("saved_jobs")
      .select(`
        id,
        jobs (
          title,
          company,
          location,
          apply_url
        )
      `)
      .eq("user_id", user.id);

    if (jobsError) throw new Error(`Error fetching saved jobs: ${jobsError.message}`);
    if (!savedJobs || savedJobs.length === 0) {
      return new Response(JSON.stringify({ error: "No saved jobs to export" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logStep("Fetched saved jobs", { count: savedJobs.length });

    // Generate CSV with proper sanitization
    const csvRows = [
      ['"Title"', '"Company"', '"Location"', '"Apply URL"'].join(',')
    ];

    for (const job of savedJobs) {
      const jobData = job.jobs as any;
      if (jobData) {
        const row = [
          `"${sanitizeCSVValue(jobData.title)}"`,
          `"${sanitizeCSVValue(jobData.company)}"`,
          `"${sanitizeCSVValue(jobData.location)}"`,
          `"${sanitizeCSVValue(jobData.apply_url)}"`
        ];
        csvRows.push(row.join(','));
      }
    }

    const csv = csvRows.join('\n');
    logStep("CSV generated successfully");

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="saved-jobs.csv"',
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in export-saved-jobs", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
