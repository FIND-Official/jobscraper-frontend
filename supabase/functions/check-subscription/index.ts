import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/*
 * Stripe subscription sync is intentionally disabled because Pro access is now
 * driven by Paystack verification/webhooks updating profiles.subscription_tier
 * and profiles.subscription_expires_at.
 *
 * import Stripe from "https://esm.sh/stripe@14.21.0";
 *
 * const getStripeCustomerId = async (
 *   stripe: Stripe,
 *   email: string,
 *   profileCustomerId?: string | null,
 * ) => {
 *   if (profileCustomerId) return profileCustomerId;
 *
 *   const customers = await stripe.customers.list({ email, limit: 1 });
 *   return customers.data[0]?.id ?? null;
 * };
 *
 * const syncActiveStripeSubscription = async (
 *   supabaseClient: any,
 *   user: { id: string; email: string },
 *   profileCustomerId?: string | null,
 * ) => {
 *   const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
 *   if (!stripeKey) return null;
 *
 *   const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
 *   const customerId = await getStripeCustomerId(stripe, user.email, profileCustomerId);
 *   if (!customerId) return null;
 *
 *   const subscriptions = await stripe.subscriptions.list({
 *     customer: customerId,
 *     status: "active",
 *     limit: 1,
 *   });
 *
 *   if (subscriptions.data.length === 0) return null;
 *
 *   const subscription = subscriptions.data[0];
 *   const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
 *
 *   await supabaseClient
 *     .from("profiles")
 *     .update({
 *       subscription_tier: "pro",
 *       subscription_expires_at: subscriptionEnd,
 *       stripe_customer_id: customerId,
 *       stripe_subscription_id: subscription.id,
 *     })
 *     .eq("id", user.id);
 *
 *   return subscriptionEnd;
 * };
 */

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

    if (!profile) {
      const { error: insertError } = await supabaseClient.from("profiles").insert({
        id: user.id,
        email: user.email,
        subscription_tier: "free",
      });
      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: "free",
          subscription_end: null,
          cancel_at_period_end: false,
        }),
        {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
        },
      );
    }

    const hasActivePro = isActivePro(profile);

    if (profile.subscription_tier === "pro" && !hasActivePro) {
      await supabaseClient
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_expires_at: null,
          subscription_cancel_at_period_end: false,
          subscription_cancelled_at: null,
        })
        .eq("id", user.id);
    }

    return new Response(
      JSON.stringify({
        subscribed: hasActivePro,
        tier: hasActivePro ? "pro" : "free",
        subscription_end: hasActivePro ? profile.subscription_expires_at : null,
        cancel_at_period_end: hasActivePro ? Boolean(profile.subscription_cancel_at_period_end) : false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
