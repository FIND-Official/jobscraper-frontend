import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

interface MailchimpSyncRequest {
  email: string;
  fullName?: string;
}

// MD5 hash function for Mailchimp subscriber hash
function md5(message: string): string {
  const msgBuffer = new TextEncoder().encode(message.toLowerCase());
  const hashBuffer = crypto.subtle.digestSync("MD5", msgBuffer);
  return toHex(new Uint8Array(hashBuffer));
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
    if (!apiKey) {
      console.error("[MAILCHIMP] API key not configured");
      throw new Error("Mailchimp API key not configured");
    }

    // Extract data center from API key (format: xxxxx-usX)
    const dataCenter = apiKey.split("-").pop();
    if (!dataCenter) {
      console.error("[MAILCHIMP] Invalid API key format");
      throw new Error("Invalid Mailchimp API key format");
    }

    const audienceId = "0b7157eb3f";
    const tagName = "jobscraper_users";

    const { email, fullName }: MailchimpSyncRequest = await req.json();

    if (!email) {
      console.error("[MAILCHIMP] Email is required");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[MAILCHIMP] Syncing user: ${email}`);

    // Create MD5 hash of lowercase email for subscriber hash
    const subscriberHash = md5(email);
    const baseUrl = `https://${dataCenter}.api.mailchimp.com/3.0`;

    // Split full name into first and last name
    const nameParts = (fullName || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Add/update member using PUT (upsert)
    const memberUrl = `${baseUrl}/lists/${audienceId}/members/${subscriberHash}`;
    
    const memberData = {
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
      },
    };

    console.log(`[MAILCHIMP] Adding/updating member at: ${memberUrl}`);

    const memberResponse = await fetch(memberUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
    });

    const memberResult = await memberResponse.json();

    if (!memberResponse.ok) {
      console.error("[MAILCHIMP] Failed to add member:", memberResult);
      throw new Error(memberResult.detail || "Failed to add member to Mailchimp");
    }

    console.log(`[MAILCHIMP] Member added/updated successfully: ${memberResult.id}`);

    // Add tag to the member
    const tagsUrl = `${baseUrl}/lists/${audienceId}/members/${subscriberHash}/tags`;
    
    const tagData = {
      tags: [
        {
          name: tagName,
          status: "active",
        },
      ],
    };

    console.log(`[MAILCHIMP] Adding tag "${tagName}" to member`);

    const tagResponse = await fetch(tagsUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tagData),
    });

    if (!tagResponse.ok) {
      const tagResult = await tagResponse.json();
      console.error("[MAILCHIMP] Failed to add tag:", tagResult);
      // Don't throw here - member was added successfully, tag is secondary
    } else {
      console.log(`[MAILCHIMP] Tag "${tagName}" added successfully`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "User synced to Mailchimp successfully",
        email: email,
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("[MAILCHIMP] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
