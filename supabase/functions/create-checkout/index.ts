import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/*
 * Stripe checkout is intentionally disabled because the app currently uses
 * Paystack for payments. Keep this implementation commented so it can be
 * restored later without rebuilding it from scratch.
 *
 * import Stripe from "https://esm.sh/stripe@14.21.0";
 * import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
 *
 * const FALLBACK_PRO_PRICE_ID = "price_1SbLRwRv2gnIYYmyxt2g0ref";
 *
 * const logStep = (step: string, details?: Record<string, unknown>) => {
 *   const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
 *   console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
 *     let body: { priceId?: string } = {};
 *     try {
 *       body = await req.json();
 *     } catch {
 *       body = {};
 *     }
 *
 *     const priceId = body.priceId || Deno.env.get("STRIPE_PRO_PRICE_ID") || FALLBACK_PRO_PRICE_ID;
 *     if (!priceId) throw new Error("Price ID is required");
 *     logStep("Price ID resolved", { priceId });
 *
 *     const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
 *     const customers = await stripe.customers.list({ email: user.email, limit: 1 });
 *
 *     let customerId: string | undefined;
 *     if (customers.data.length > 0) {
 *       customerId = customers.data[0].id;
 *       logStep("Existing customer found", { customerId });
 *
 *       await supabaseClient
 *         .from("profiles")
 *         .update({ stripe_customer_id: customerId })
 *         .eq("id", user.id);
 *     }
 *
 *     const origin = req.headers.get("origin") || "http://localhost:5173";
 *     const session = await stripe.checkout.sessions.create({
 *       customer: customerId,
 *       customer_email: customerId ? undefined : user.email,
 *       client_reference_id: user.id,
 *       line_items: [{ price: priceId, quantity: 1 }],
 *       mode: "subscription",
 *       success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
 *       cancel_url: `${origin}/?canceled=true`,
 *       metadata: { user_id: user.id, plan: "pro" },
 *       subscription_data: { metadata: { user_id: user.id, plan: "pro" } },
 *     });
 *
 *     logStep("Checkout session created", { sessionId: session.id, url: session.url });
 *
 *     return new Response(JSON.stringify({ url: session.url }), {
 *       headers: { ...corsHeaders, "Content-Type": "application/json" },
 *       status: 200,
 *     });
 *   } catch (error) {
 *     const errorMessage = error instanceof Error ? error.message : String(error);
 *     logStep("ERROR in create-checkout", { message: errorMessage });
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
      error: "Card checkout is disabled. Use the Paystack payment flow instead.",
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 410,
    },
  );
});
