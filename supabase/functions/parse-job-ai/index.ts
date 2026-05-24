import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const isPro =
      profile?.subscription_tier === "pro" &&
      (!profile.subscription_expires_at ||
        new Date(profile.subscription_expires_at).getTime() > Date.now());

    if (!isPro) {
      if (profile?.subscription_tier === "pro") {
        await supabaseClient
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_expires_at: null,
            subscription_cancel_at_period_end: false,
            subscription_cancelled_at: null,
          })
          .eq("id", userData.user.id);
      }

      return new Response(JSON.stringify({ error: "Pro subscription required for AI parsing" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { description, title, company, location } = await req.json();
    console.log("[PARSE-JOB-AI] Parsing job:", title);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a job description parser. Extract structured information from job descriptions.
Return a JSON object with these fields:
- type: Job type (Full-time, Part-time, Contract, Freelance, Internship) or "Not specified"
- title: Cleaned job title
- location: Location or "Remote" or "Not specified"  
- description: Brief overview (2-3 sentences max)
- responsibilities: Array of key responsibilities (max 5 items)
- qualifications: Array of required qualifications (max 5 items)
- benefits: Array of benefits/perks (max 5 items)
- link: Keep the original apply URL

If any field cannot be determined, use "Not specified" for strings or empty array for arrays.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Parse this job posting:
Title: ${title}
Company: ${company}
Location: ${location}
Description: ${description}` 
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_job",
              description: "Parse job description into structured fields",
              parameters: {
                type: "object",
                properties: {
                  type: { type: "string", description: "Job type" },
                  title: { type: "string", description: "Job title" },
                  location: { type: "string", description: "Job location" },
                  description: { type: "string", description: "Brief job description" },
                  responsibilities: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Key responsibilities" 
                  },
                  qualifications: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Required qualifications" 
                  },
                  benefits: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Benefits and perks" 
                  },
                },
                required: ["type", "title", "location", "description", "responsibilities", "qualifications", "benefits"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "parse_job" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[PARSE-JOB-AI] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI parsing failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("[PARSE-JOB-AI] AI response received");

    let parsed;
    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        parsed = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback to content parsing
        const content = data.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.error("[PARSE-JOB-AI] Failed to parse AI response:", e);
    }

    if (!parsed) {
      parsed = {
        type: "Not specified",
        title: title,
        location: location || "Not specified",
        description: description?.substring(0, 200) || "Not specified",
        responsibilities: [],
        qualifications: [],
        benefits: [],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[PARSE-JOB-AI] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
