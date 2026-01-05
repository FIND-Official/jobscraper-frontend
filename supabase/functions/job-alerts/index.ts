import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.190.0/encoding/hex.ts";

// Helper to convert Uint8Array to hex string
function toHex(bytes: Uint8Array): string {
  return new TextDecoder().decode(encode(bytes));
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPreference {
  id: string;
  user_id: string;
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  search_keyword: string | null;
  experience_level: string | null;
  job_boards: string[];
  last_sent_at: string | null;
}

interface Profile {
  email: string;
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  source: string;
  apply_url: string;
  scraped_at: string;
}

// MD5 hash function for Mailchimp subscriber hash
function md5(message: string): string {
  const msgBuffer = new TextEncoder().encode(message.toLowerCase());
  const hashBuffer = crypto.subtle.digestSync("MD5", msgBuffer);
  return toHex(new Uint8Array(hashBuffer));
}

function getFrequencyHours(frequency: string): number {
  switch (frequency) {
    case "daily": return 24;
    case "weekly": return 168;
    case "monthly": return 720;
    default: return 24;
  }
}

function shouldSendAlert(preference: NotificationPreference): boolean {
  if (!preference.enabled) return false;
  if (!preference.last_sent_at) return true;
  
  const lastSent = new Date(preference.last_sent_at);
  const now = new Date();
  const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
  const frequencyHours = getFrequencyHours(preference.frequency);
  
  return hoursSinceLastSent >= frequencyHours;
}

async function sendJobAlertEmail(
  email: string,
  jobs: Job[],
  keyword: string | null,
  apiKey: string,
  dataCenter: string
): Promise<boolean> {
  const audienceId = "0b7157eb3f";
  const subscriberHash = md5(email);
  
  // Create email content
  const jobListHtml = jobs.slice(0, 10).map(job => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">
        <h3 style="margin: 0 0 5px 0; color: #333;">${job.title}</h3>
        <p style="margin: 0 0 5px 0; color: #666;">${job.company}${job.location ? ` • ${job.location}` : ''}</p>
        <p style="margin: 0; color: #999; font-size: 12px;">Source: ${job.source}</p>
      </td>
    </tr>
  `).join('');

  const searchDesc = keyword ? `for "${keyword}"` : '';
  const appUrl = "https://ydvmulhmmragakuimuqm.lovableproject.com";
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; margin: 0;">🔍 New Remote Jobs Alert</h1>
        <p style="color: #666; margin-top: 10px;">We found ${jobs.length} new job${jobs.length !== 1 ? 's' : ''} ${searchDesc}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        ${jobListHtml}
      </table>
      
      ${jobs.length > 10 ? `<p style="text-align: center; color: #666; margin-top: 15px;">...and ${jobs.length - 10} more jobs</p>` : ''}
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="${appUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">View All Jobs</a>
      </div>
      
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          You're receiving this because you enabled job alerts on JobScraper.<br>
          <a href="${appUrl}/account" style="color: #6366f1;">Manage your notification preferences</a>
        </p>
      </div>
    </body>
    </html>
  `;

  // Send campaign via Mailchimp Transactional (Mandrill) or use automation
  // For simplicity, we'll use Mailchimp's campaign API to send to specific member
  
  // First, check if member exists and update their merge fields with job data
  const memberUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;
  
  try {
    // Update member with job alert info
    const updateResponse = await fetch(memberUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merge_fields: {
          JOBALERT: "true",
          JOBCOUNT: jobs.length.toString(),
          JOBKEYWD: keyword || "All Jobs",
        },
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error("[JOB-ALERTS] Failed to update member:", errorData);
      return false;
    }

    console.log(`[JOB-ALERTS] Updated member ${email} with job alert data`);
    
    // For actual email sending, we'll use Resend since Mailchimp campaigns require more setup
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "JobScraper <noreply@resend.dev>",
          to: [email],
          subject: `🔍 ${jobs.length} New Remote Jobs ${searchDesc}`,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json();
        console.error("[JOB-ALERTS] Resend email failed:", errorData);
        return false;
      }

      console.log(`[JOB-ALERTS] Email sent to ${email}`);
      return true;
    } else {
      console.log("[JOB-ALERTS] RESEND_API_KEY not configured, skipping email");
      return false;
    }
  } catch (error) {
    console.error("[JOB-ALERTS] Error sending email:", error);
    return false;
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[JOB-ALERTS] Starting job alerts processing...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    
    if (!mailchimpApiKey) {
      throw new Error("MAILCHIMP_API_KEY not configured");
    }

    const dataCenter = mailchimpApiKey.split("-").pop();
    if (!dataCenter) {
      throw new Error("Invalid Mailchimp API key format");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all enabled notification preferences that are due
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("enabled", true);

    if (prefError) {
      console.error("[JOB-ALERTS] Error fetching preferences:", prefError);
      throw prefError;
    }

    console.log(`[JOB-ALERTS] Found ${preferences?.length || 0} enabled preferences`);

    let emailsSent = 0;
    let errors = 0;

    for (const pref of (preferences || []) as NotificationPreference[]) {
      if (!shouldSendAlert(pref)) {
        console.log(`[JOB-ALERTS] Skipping user ${pref.user_id} - not due yet`);
        continue;
      }

      // Get user email from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", pref.user_id)
        .single();

      if (profileError || !profile) {
        console.error(`[JOB-ALERTS] Could not find profile for user ${pref.user_id}`);
        errors++;
        continue;
      }

      // Get recent jobs based on preferences
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - getFrequencyHours(pref.frequency));

      let jobsQuery = supabase
        .from("jobs")
        .select("id, title, company, location, source, apply_url, scraped_at")
        .gt("scraped_at", cutoffDate.toISOString())
        .order("scraped_at", { ascending: false })
        .limit(50);

      // Apply keyword filter if set
      if (pref.search_keyword) {
        jobsQuery = jobsQuery.or(`title.ilike.%${pref.search_keyword}%,company.ilike.%${pref.search_keyword}%,description.ilike.%${pref.search_keyword}%`);
      }

      // Apply source filter if specific boards are set
      if (pref.job_boards && pref.job_boards.length > 0) {
        jobsQuery = jobsQuery.in("source", pref.job_boards);
      }

      const { data: jobs, error: jobsError } = await jobsQuery;

      if (jobsError) {
        console.error(`[JOB-ALERTS] Error fetching jobs for user ${pref.user_id}:`, jobsError);
        errors++;
        continue;
      }

      if (!jobs || jobs.length === 0) {
        console.log(`[JOB-ALERTS] No new jobs for user ${pref.user_id}`);
        // Update last_sent_at anyway to avoid repeated checks
        await supabase
          .from("notification_preferences")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", pref.id);
        continue;
      }

      console.log(`[JOB-ALERTS] Found ${jobs.length} jobs for user ${pref.user_id}`);

      // Send email
      const sent = await sendJobAlertEmail(
        profile.email,
        jobs as Job[],
        pref.search_keyword,
        mailchimpApiKey,
        dataCenter
      );

      if (sent) {
        emailsSent++;
        // Update last_sent_at
        await supabase
          .from("notification_preferences")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", pref.id);
      } else {
        errors++;
      }
    }

    console.log(`[JOB-ALERTS] Completed: ${emailsSent} emails sent, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        errors,
        message: `Processed job alerts: ${emailsSent} sent, ${errors} errors`
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("[JOB-ALERTS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
