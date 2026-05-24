import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const isActivePro = (profile: any) => {
  if (profile?.subscription_tier !== "pro") return false;
  if (!profile.subscription_expires_at) return true;

  return new Date(profile.subscription_expires_at).getTime() > Date.now();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("subscription_tier, subscription_expires_at, subscription_cancel_at_period_end")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile || !isActivePro(profile)) {
      throw new Error("No active Pro plan found");
    }

    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        subscription_cancel_at_period_end: true,
        subscription_cancelled_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) throw new Error(`Unable to schedule downgrade: ${updateError.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        tier: "pro",
        subscription_end: profile.subscription_expires_at,
        cancel_at_period_end: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
