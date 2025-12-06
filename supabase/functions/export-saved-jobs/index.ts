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
  
  const stringValue = String(value).trim();
  
  // Remove HTML tags
  const noHtml = stringValue.replace(/<[^>]*>/g, '');
  
  // Prefix dangerous characters to prevent formula injection
  if (/^[=+\-@]/.test(noHtml)) {
    return `'${noHtml.replace(/"/g, '""')}`;
  }
  
  // Escape double quotes by doubling them and normalize newlines
  return noHtml.replace(/"/g, '""').replace(/\r?\n/g, ' ');
};

// Parse job description into structured sections
const parseJobDescription = (description: string | null): {
  overview: string;
  responsibilities: string;
  qualifications: string;
  benefits: string;
} => {
  if (!description) {
    return { overview: '', responsibilities: '', qualifications: '', benefits: '' };
  }

  const text = description.replace(/<[^>]*>/g, '').trim();
  
  // Common section headers
  const responsibilityHeaders = /(?:responsibilities|what you['']ll do|duties|role|your role)/i;
  const qualificationHeaders = /(?:qualifications|requirements|what we['']re looking for|skills|experience required|who you are)/i;
  const benefitsHeaders = /(?:benefits|perks|what we offer|compensation|why join)/i;

  let overview = '';
  let responsibilities = '';
  let qualifications = '';
  let benefits = '';

  // Split by common section patterns
  const sections = text.split(/\n{2,}|\r\n{2,}/);
  let currentSection = 'overview';

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    if (responsibilityHeaders.test(trimmed)) {
      currentSection = 'responsibilities';
      const content = trimmed.replace(responsibilityHeaders, '').trim();
      if (content) responsibilities += content + ' ';
      continue;
    }
    if (qualificationHeaders.test(trimmed)) {
      currentSection = 'qualifications';
      const content = trimmed.replace(qualificationHeaders, '').trim();
      if (content) qualifications += content + ' ';
      continue;
    }
    if (benefitsHeaders.test(trimmed)) {
      currentSection = 'benefits';
      const content = trimmed.replace(benefitsHeaders, '').trim();
      if (content) benefits += content + ' ';
      continue;
    }

    switch (currentSection) {
      case 'responsibilities':
        responsibilities += trimmed + ' ';
        break;
      case 'qualifications':
        qualifications += trimmed + ' ';
        break;
      case 'benefits':
        benefits += trimmed + ' ';
        break;
      default:
        overview += trimmed + ' ';
    }
  }

  return {
    overview: overview.trim() || 'Not specified',
    responsibilities: responsibilities.trim() || 'Not specified',
    qualifications: qualifications.trim() || 'Not specified',
    benefits: benefits.trim() || 'Not specified',
  };
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

    // Fetch saved jobs with full job details
    const { data: savedJobs, error: jobsError } = await supabaseClient
      .from("saved_jobs")
      .select(`
        id,
        jobs (
          title,
          company,
          location,
          job_type,
          description,
          apply_url,
          tags
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

    // Generate CSV with enhanced columns
    const csvRows = [
      ['"Type"', '"Title"', '"Company"', '"Location"', '"Description"', '"Responsibilities"', '"Qualifications"', '"Benefits"', '"Link"'].join(',')
    ];

    for (const job of savedJobs) {
      const jobData = job.jobs as any;
      if (jobData) {
        const parsed = parseJobDescription(jobData.description);
        
        const row = [
          `"${sanitizeCSVValue(jobData.job_type || 'Not specified')}"`,
          `"${sanitizeCSVValue(jobData.title)}"`,
          `"${sanitizeCSVValue(jobData.company)}"`,
          `"${sanitizeCSVValue(jobData.location || 'Remote')}"`,
          `"${sanitizeCSVValue(parsed.overview)}"`,
          `"${sanitizeCSVValue(parsed.responsibilities)}"`,
          `"${sanitizeCSVValue(parsed.qualifications)}"`,
          `"${sanitizeCSVValue(parsed.benefits)}"`,
          `"${sanitizeCSVValue(jobData.apply_url)}"`
        ];
        csvRows.push(row.join(','));
      }
    }

    const csv = csvRows.join('\n');
    logStep("CSV generated successfully with enhanced columns");

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
