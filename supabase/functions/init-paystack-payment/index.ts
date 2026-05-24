import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRO_PLAN_USD = 20;
const USD_TO_NGN_API_URL = "https://open.er-api.com/v6/latest/USD";

const fetchUsdToNgnRate = async () => {
  const response = await fetch(USD_TO_NGN_API_URL);
  if (!response.ok) {
    throw new Error("Unable to fetch the latest USD to NGN exchange rate");
  }

  const data = await response.json();
  const rate = Number(data?.rates?.NGN);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("The latest USD to NGN exchange rate was unavailable");
  }

  return rate;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!Deno.env.get("PAYSTACK_SECRET_KEY")) {
      throw new Error("PAYSTACK_SECRET_KEY is not set");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const body = await req.json();
    const amountUsd = Number(body?.amountUsd);
    const currency = String(body?.currency || "NGN").toUpperCase();
    const plan = String(body?.plan || "pro").toLowerCase();

    if (plan !== "pro") throw new Error("Invalid plan");
    if (Math.abs(amountUsd - PRO_PLAN_USD) > 0.01) throw new Error("Invalid plan amount");
    if (currency !== "NGN") throw new Error("Unsupported currency");

    const exchangeRate = await fetchUsdToNgnRate();
    const amountNgn = Math.round(PRO_PLAN_USD * exchangeRate);
    const reference = `PAY-${Date.now()}-${crypto.randomUUID()}`;
    const amountKobo = amountNgn * 100;

    const { error: insertError } = await supabaseClient
      .from("paystack_transactions")
      .insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        email: user.email,
        reference,
        plan: "pro",
        amount_usd: amountUsd,
        amount_ngn: amountNgn,
        exchange_rate: exchangeRate,
        currency,
        status: "pending",
      });

    if (insertError) throw new Error(`Unable to initialize payment: ${insertError.message}`);

    return new Response(
      JSON.stringify({
        reference,
        amountKobo,
        amountNgn,
        amountUsd,
        currency,
        exchangeRate,
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
