import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUBSCRIPTION_DAYS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

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

    const { reference } = await req.json();
    if (!reference || typeof reference !== "string") {
      throw new Error("Payment reference is required");
    }

    const { data: transaction, error: transactionError } = await supabaseClient
      .from("paystack_transactions")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (transactionError) throw transactionError;
    if (!transaction) throw new Error("Payment reference was not initialized");
    if (transaction.user_id !== user.id) throw new Error("Payment reference does not belong to this user");

    if (transaction.status === "paid") {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("subscription_expires_at")
        .eq("id", user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          success: true,
          tier: "pro",
          subscription_end: profile?.subscription_expires_at ?? null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      },
    );

    const verifyData = await verifyResponse.json();
    if (!verifyResponse.ok || verifyData?.status !== true) {
      throw new Error(verifyData?.message || "Unable to verify Paystack transaction");
    }

    const payment = verifyData?.data;
    const expectedAmountKobo = Number(transaction.amount_ngn) * 100;
    const paidAmountKobo = Number(payment?.amount);
    const paidEmail = String(payment?.customer?.email || "").toLowerCase();
    const userEmail = user.email.toLowerCase();

    if (payment?.status !== "success") throw new Error("Payment was not successful");
    if (payment?.reference !== reference) throw new Error("Payment reference mismatch");
    if (String(payment?.currency || "").toUpperCase() !== "NGN") throw new Error("Payment currency mismatch");
    if (paidAmountKobo !== expectedAmountKobo) throw new Error("Payment amount mismatch");
    if (paidEmail && paidEmail !== userEmail) throw new Error("Payment email mismatch");

    const subscriptionEnd = new Date();
    subscriptionEnd.setDate(subscriptionEnd.getDate() + SUBSCRIPTION_DAYS);
    const subscriptionEndIso = subscriptionEnd.toISOString();

    const { error: profileError } = await supabaseClient
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          subscription_tier: "pro",
          subscription_expires_at: subscriptionEndIso,
          subscription_cancel_at_period_end: false,
          subscription_cancelled_at: null,
        },
        { onConflict: "id" },
      );

    if (profileError) throw new Error(`Unable to activate subscription: ${profileError.message}`);

    const { error: updateError } = await supabaseClient
      .from("paystack_transactions")
      .update({
        status: "paid",
        paystack_transaction_id: payment?.id ? String(payment.id) : null,
        paid_at: payment?.paid_at || new Date().toISOString(),
      })
      .eq("reference", reference);

    if (updateError) throw new Error(`Unable to update payment record: ${updateError.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        tier: "pro",
        subscription_end: subscriptionEndIso,
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
