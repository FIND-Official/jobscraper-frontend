import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/*
 * Stripe customer portal is intentionally disabled because the app currently
 * uses Paystack for payments. Keep this implementation commented so it can be
 * restored later if Stripe billing management comes back.
 *
 * import Stripe from "https://esm.sh/stripe@14.21.0";
 * import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
 *
 * const logStep = (step: string, details?: Record<string, unknown>) => {
 *   const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
 *   console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
 * };
 *
 * serve(async (req) => {
 *   if (req.method === "OPTIONS") {
 *     return new Response(null, { headers: corsHeaders });
 *   }
 *
 *   try {
 *     logStep("Function started");
 *
 *     const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
 *     if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
 *     logStep("Stripe key verified");
 *
 *     const supabaseClient = createClient(
 *       Deno.env.get("SUPABASE_URL") ?? "",
 *       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
 *       { auth: { persistSession: false } },
 *     );
 *
 *     const authHeader = req.headers.get("Authorization");
 *     if (!authHeader) throw new Error("No authorization header provided");
 *
 *     const token = authHeader.replace("Bearer ", "");
 *     const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
 *     if (userError) throw new Error(`Authentication error: ${userError.message}`);
 *
 *     const user = userData.user;
 *     if (!user?.email) throw new Error("User not authenticated or email not available");
 *     logStep("User authenticated", { userId: user.id, email: user.email });
 *
 *     const { data: profile } = await supabaseClient
 *       .from("profiles")
 *       .select("stripe_customer_id")
 *       .eq("id", user.id)
 *       .maybeSingle();
 *
 *     const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
 *     let customerId = profile?.stripe_customer_id || undefined;
 *
 *     if (!customerId) {
 *       const customers = await stripe.customers.list({ email: user.email, limit: 1 });
 *       if (customers.data.length === 0) {
 *         throw new Error("No Stripe customer found for this user");
 *       }
 *
 *       customerId = customers.data[0].id;
 *       await supabaseClient
 *         .from("profiles")
 *         .update({ stripe_customer_id: customerId })
 *         .eq("id", user.id);
 *     }
 *
 *     logStep("Found Stripe customer", { customerId });
 *
 *     const origin = req.headers.get("origin") || "http://localhost:5173";
 *     const portalSession = await stripe.billingPortal.sessions.create({
 *       customer: customerId,
 *       return_url: `${origin}/account`,
 *     });
 *
 *     logStep("Customer portal session created", {
 *       sessionId: portalSession.id,
 *       url: portalSession.url,
 *     });
 *
 *     return new Response(JSON.stringify({ url: portalSession.url }), {
 *       headers: { ...corsHeaders, "Content-Type": "application/json" },
 *       status: 200,
 *     });
 *   } catch (error) {
 *     const errorMessage = error instanceof Error ? error.message : String(error);
 *     logStep("ERROR in customer-portal", { message: errorMessage });
 *     return new Response(JSON.stringify({ error: errorMessage }), {
 *       headers: { ...corsHeaders, "Content-Type": "application/json" },
 *       status: 500,
 *     });
 *   }
 * });
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      error: "The billing portal is disabled. Paystack payments are managed through the app payment flow.",
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 410,
    },
  );
});
