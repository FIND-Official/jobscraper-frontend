
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

// Map preference board IDs to actual source values in the database
const BOARD_ID_TO_SOURCE: Record<string, string> = {
  "weworkremotely": "We Work Remotely",
  "remoteok": "RemoteOK", 
  "workingnomads": "Working Nomads",
  "remotecom": "Remote.com",
};

function mapBoardIdsToSources(boardIds: string[]): string[] {
  return boardIds.map(id => BOARD_ID_TO_SOURCE[id] || id);
}

const EXPERIENCE_FILTERS: Record<string, string[]> = {
  junior: ["junior", "entry", "jr", "associate", "intern", "graduate"],
  mid: ["mid", "intermediate", "2-5 years", "3+ years", "mid-level"],
  senior: ["senior", "sr", "lead", "principal", "staff", "5+ years", "architect"],
};

function getFrequencyHours(frequency: string): number {
   switch (frequency) {
    case "daily": return 6;
    case "weekly": return 168;
    case "monthly": return 720;
    default: return 24;
  }
}

function escapeKeyword(value: string): string {
  return value.replace(/[%_]/g, "\\$&");
}

function applyPreferenceFilters(query: any, pref: NotificationPreference) {
  if (pref.search_keyword) {
    const keyword = escapeKeyword(pref.search_keyword.trim());
    query = query.or(
      `title.ilike.%${keyword}%,company.ilike.%${keyword}%,location.ilike.%${keyword}%,source.ilike.%${keyword}%`
    );
  }

  if (pref.experience_level) {
    const keywords = EXPERIENCE_FILTERS[pref.experience_level] || [];
    if (keywords.length > 0) {
      const clauses = keywords
        .map(k => `title.ilike.%${escapeKeyword(k)}%`)
        .join(",");
      query = query.or(clauses);
    }
  }

  if (pref.job_boards && pref.job_boards.length > 0) {
    const sourceNames = mapBoardIdsToSources(pref.job_boards);
    console.log(`[JOB-ALERTS] Filtering by sources: ${sourceNames.join(", ")}`);
    query = query.in("source", sourceNames);
  }

  return query;
}


function shouldSendAlert(preference: NotificationPreference, forceTest: boolean = false): boolean {
  if (forceTest) return true;
  if (!preference.enabled) return false;
  if (!preference.last_sent_at) return true;
  
  const lastSent = new Date(preference.last_sent_at);
  const now = new Date();
  const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
  const frequencyHours = getFrequencyHours(preference.frequency);
  
  console.log(`[JOB-ALERTS] User ${preference.user_id}: Last sent ${hoursSinceLastSent.toFixed(1)} hours ago, frequency is ${frequencyHours} hours`);
  
  return hoursSinceLastSent >= frequencyHours;
}

// Build email HTML content
function buildEmailHtml(jobs: Job[], keyword: string | null): string {
  const jobListHtml = jobs.slice(0, 10).map(job => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">
        <h3 style="margin: 0 0 5px 0; color: #333;">${job.title}</h3>
        <p style="margin: 0 0 5px 0; color: #666;">${job.company}${job.location ? ` • ${job.location}` : ''}</p>
        <p style="margin: 0; color: #999; font-size: 12px;">Source: ${job.source}</p>
        <a href="${job.apply_url}" style="display: inline-block; margin-top: 8px; color: #6366f1; text-decoration: none; font-size: 13px;">Apply Now →</a>
      </td>
    </tr>
  `).join('');

  const searchDesc = keyword ? `for "${keyword}"` : '';
  const appUrl = "https://ydvmulhmmragakuimuqm.lovableproject.com";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin: 0;">🔍 New Remote Jobs Alert</h1>
          <p style="color: #666; margin-top: 10px;">We found ${jobs.length} new job${jobs.length !== 1 ? 's' : ''} ${searchDesc}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden;">
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
      </div>
    </body>
    </html>
  `;
}

// Send job alert email using Mailchimp Marketing API (campaign)
async function sendJobAlertViaMailchimp(
  email: string,
  jobs: Job[],
  keyword: string | null,
  mailchimpApiKey: string,
  audienceId: string
): Promise<boolean> {
  try {
    const dataCenter = mailchimpApiKey.split("-").pop();
    if (!dataCenter) {
      console.error("[JOB-ALERTS] Invalid Mailchimp API key format");
      return false;
    }

    const baseUrl = `https://${dataCenter}.api.mailchimp.com/3.0`;
    const authHeader = "Basic " + btoa(`anystring:${mailchimpApiKey}`);
    const subscriberHash = md5(email);

    console.log(`[JOB-ALERTS] Preparing Mailchimp campaign for ${email} with ${jobs.length} jobs...`);

    // Step 1: Ensure user is subscribed to the audience
    const memberUrl = `${baseUrl}/lists/${audienceId}/members/${subscriberHash}`;
    const memberResponse = await fetch(memberUrl, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        merge_fields: {},
      }),
    });

    if (!memberResponse.ok) {
      const memberError = await memberResponse.json();
      console.error("[JOB-ALERTS] Failed to add/update member:", memberError);
      // Continue anyway - member might already exist
    } else {
      console.log(`[JOB-ALERTS] Member ${email} ensured in audience`);
    }

    // Step 2: Create a segment for this specific user
    const segmentName = `JobAlert_${subscriberHash}_${Date.now()}`;
    const segmentUrl = `${baseUrl}/lists/${audienceId}/segments`;
    
    const segmentResponse = await fetch(segmentUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: segmentName,
        static_segment: [email],
      }),
    });

    if (!segmentResponse.ok) {
      const segmentError = await segmentResponse.json();
      console.error("[JOB-ALERTS] Failed to create segment:", segmentError);
      return false;
    }

    const segmentData = await segmentResponse.json();
    const segmentId = segmentData.id;
    console.log(`[JOB-ALERTS] Created segment ${segmentId} for ${email}`);

    // Step 3: Get audience details for default from settings
    const audienceDetailsUrl = `${baseUrl}/lists/${audienceId}`;
    const audienceResponse = await fetch(audienceDetailsUrl, {
      headers: { "Authorization": authHeader },
    });
    
    let fromEmail = email; // fallback to user's email
    let fromName = "JobScraper Alerts";
    
    if (audienceResponse.ok) {
      const audienceData = await audienceResponse.json();
      if (audienceData.campaign_defaults?.from_email) {
        fromEmail = audienceData.campaign_defaults.from_email;
      }
      if (audienceData.campaign_defaults?.from_name) {
        fromName = audienceData.campaign_defaults.from_name;
      }
    }

    // Step 4: Create a campaign targeting this segment
    const searchDesc = keyword ? ` for "${keyword}"` : '';
    const campaignUrl = `${baseUrl}/campaigns`;
    
    const campaignResponse = await fetch(campaignUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "regular",
        recipients: {
          list_id: audienceId,
          segment_opts: {
            saved_segment_id: segmentId,
          },
        },
        settings: {
          subject_line: `🔍 ${jobs.length} New Remote Jobs${searchDesc}`,
          title: `Job Alert - ${new Date().toISOString().split('T')[0]}`,
          from_name: fromName,
          reply_to: fromEmail,
        },
      }),
    });

    if (!campaignResponse.ok) {
      const campaignError = await campaignResponse.json();
      console.error("[JOB-ALERTS] Failed to create campaign:", campaignError);
      return false;
    }

    const campaignData = await campaignResponse.json();
    const campaignId = campaignData.id;
    console.log(`[JOB-ALERTS] Created campaign ${campaignId}`);

    // Step 4: Set campaign content
    const contentUrl = `${baseUrl}/campaigns/${campaignId}/content`;
    const emailHtml = buildEmailHtml(jobs, keyword);
    
    const contentResponse = await fetch(contentUrl, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: emailHtml,
      }),
    });

    if (!contentResponse.ok) {
      const contentError = await contentResponse.json();
      console.error("[JOB-ALERTS] Failed to set campaign content:", contentError);
      return false;
    }

    console.log(`[JOB-ALERTS] Campaign content set`);

    // Step 5: Send the campaign
    const sendUrl = `${baseUrl}/campaigns/${campaignId}/actions/send`;
    
    const sendResponse = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!sendResponse.ok) {
      const sendError = await sendResponse.json();
      console.error("[JOB-ALERTS] Failed to send campaign:", sendError);
      return false;
    }

    console.log(`[JOB-ALERTS] Campaign sent successfully to ${email}`);

    // Step 6: Clean up - delete the temporary segment (async, don't wait)
    fetch(`${segmentUrl}/${segmentId}`, {
      method: "DELETE",
      headers: { "Authorization": authHeader },
    }).catch(() => {});

    return true;
  } catch (error) {
    console.error("[JOB-ALERTS] Mailchimp error:", error);
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
    
    // Check for test mode or specific user
    let testMode = false;
    let testUserId: string | null = null;
    
    try {
      const body = await req.json();
      testMode = body.test === true;
      testUserId = body.user_id || null;
      if (testMode) {
        console.log("[JOB-ALERTS] Running in TEST mode - will send regardless of schedule");
      }
      if (testUserId) {
        console.log(`[JOB-ALERTS] Filtering to user: ${testUserId}`);
      }
    } catch {
      // No body or invalid JSON, that's fine
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailchimpApiKey = Deno.env.get("MAILCHIMP_API_KEY");
    
    if (!mailchimpApiKey) {
      console.error("[JOB-ALERTS] MAILCHIMP_API_KEY not configured");
      throw new Error("MAILCHIMP_API_KEY not configured");
    }

    // Mailchimp audience ID - this should be your existing audience
    const audienceId = "0b7157eb3f";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all enabled notification preferences
    let prefsQuery = supabase
      .from("notification_preferences")
      .select("*")
      .eq("enabled", true);
    
    if (testUserId) {
      prefsQuery = prefsQuery.eq("user_id", testUserId);
    }

    const { data: preferences, error: prefError } = await prefsQuery;

    if (prefError) {
      console.error("[JOB-ALERTS] Error fetching preferences:", prefError);
      throw prefError;
    }

    console.log(`[JOB-ALERTS] Found ${preferences?.length || 0} enabled preferences`);

    let emailsSent = 0;
    let errors = 0;
    const details: string[] = [];

    for (const pref of (preferences || []) as NotificationPreference[]) {
      if (!shouldSendAlert(pref, testMode)) {
        const msg = `Skipping user ${pref.user_id} - not due yet`;
        console.log(`[JOB-ALERTS] ${msg}`);
        details.push(msg);
        continue;
      }

      // Get user email from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", pref.user_id)
        .single();

      if (profileError || !profile?.email) {
        const msg = `Could not find email for user ${pref.user_id}`;
        console.error(`[JOB-ALERTS] ${msg}`);
        details.push(msg);
        errors++;
        continue;
      }

      console.log(`[JOB-ALERTS] Processing alerts for ${profile.email}`);

      // Get jobs based on when we last sent (or all recent if never sent / test mode)
      const cutoffDate = new Date();
      if (testMode) {
        // In test mode, get jobs from last 30 days to ensure we have something to send
        cutoffDate.setDate(cutoffDate.getDate() - 30);
      } else if (pref.last_sent_at) {
        // Get jobs since the last alert was sent
        cutoffDate.setTime(new Date(pref.last_sent_at).getTime());
      } else {
        // Never sent before, get jobs from last week
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      }

      console.log(`[JOB-ALERTS] Looking for jobs since ${cutoffDate.toISOString()}`);

      function buildJobQuery(cutoff: string) {
        let query = supabase
          .from("jobs")
          .select("id, title, company, location, source, apply_url, scraped_at")
          .gt("scraped_at", cutoff)
          .order("scraped_at", { ascending: false });

        query = applyPreferenceFilters(query, pref);
        return query.limit(50);
      }

      const { data: jobs, error: jobsError } = await buildJobQuery(cutoffDate.toISOString());

      if (jobsError) {
        const msg = `Error fetching jobs for user ${pref.user_id}: ${jobsError.message}`;
        console.error(`[JOB-ALERTS] ${msg}`);
        details.push(msg);
        errors++;
        continue;
      }

      let filteredJobs = jobs || [];
      if (filteredJobs.length < 10) {
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() - 30);
        console.log(`[JOB-ALERTS] Only ${filteredJobs.length} jobs found; widening search to ${fallbackDate.toISOString()}`);
        const { data: fallbackJobs, error: fallbackError } = await buildJobQuery(fallbackDate.toISOString());

        if (fallbackError) {
          const msg = `Fallback fetch error for user ${pref.user_id}: ${fallbackError.message}`;
          console.error(`[JOB-ALERTS] ${msg}`);
          details.push(msg);
          errors++;
          continue;
        }

        filteredJobs = fallbackJobs || filteredJobs;
      }

      if (!filteredJobs || filteredJobs.length === 0) {
        const msg = `No new jobs for ${profile.email} since ${cutoffDate.toISOString()}`;
        console.log(`[JOB-ALERTS] ${msg}`);
        details.push(msg);
        
        // In test mode, don't update last_sent_at when there are no jobs
        if (!testMode) {
          await supabase
            .from("notification_preferences")
            .update({ last_sent_at: new Date().toISOString() })
            .eq("id", pref.id);
        }
        continue;
      }

      const jobsToSend = filteredJobs.slice(0, 10);
      console.log(`[JOB-ALERTS] Sending ${jobsToSend.length} jobs for ${profile.email}`);

      // Send email via Mailchimp
      const sent = await sendJobAlertViaMailchimp(
        profile.email,
        jobsToSend,
        pref.search_keyword,
        mailchimpApiKey,
        audienceId
      );

      if (sent) {
        emailsSent++;
        details.push(`Email sent to ${profile.email} with ${jobsToSend.length} jobs`);
        // Update last_sent_at
        await supabase
          .from("notification_preferences")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", pref.id);
      } else {
        errors++;
        details.push(`Failed to send email to ${profile.email}`);
      }
    }

    console.log(`[JOB-ALERTS] Completed: ${emailsSent} emails sent, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        errors,
        details,
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
