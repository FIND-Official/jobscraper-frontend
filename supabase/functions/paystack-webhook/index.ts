import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUBSCRIPTION_DAYS = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, x-paystack-signature",
};

type PaystackEvent = {
  event?: string;
  data?: {
    id?: string | number;
    amount?: number;
    currency?: string;
    paid_at?: string | null;
    reference?: string;
    status?: string;
    customer?: {
      email?: string;
      customer_code?: string;
    };
    metadata?: {
      plan?: string;
      payment_type?: string;
    };
  };
};

type PaystackTransaction = {
  id: string;
  user_id: string;
  email: string | null;
  reference: string | null;
  plan: string | null;
  amount_ngn: number | null;
  currency: string | null;
  status: string | null;
};

type SupabaseAdminClient = any;

const encoder = new TextEncoder();

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const bytesToHex = (bytes: ArrayBuffer): string =>
  Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const timingSafeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
};

const hmacSha512Hex = async (secret: string, message: string): Promise<string> => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );

  const mac = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return bytesToHex(mac);
};

const verifyPaystackSignature = async (req: Request, rawBody: string, secret: string) => {
  const signature = req.headers.get("x-paystack-signature")?.trim().toLowerCase() ?? "";
  const computedSignature = await hmacSha512Hex(secret, rawBody);

  return Boolean(signature) && timingSafeEqual(signature, computedSignature);
};

const getPaystackTransactionStatus = (event: PaystackEvent): "failed" | "cancelled" | null => {
  const eventType = event.event || "";
  const status = String(event.data?.status || "").toLowerCase();

  if (eventType === "charge.failed" || status === "failed") return "failed";
  if (eventType === "charge.abandoned" || ["abandoned", "cancelled", "canceled"].includes(status)) {
    return "cancelled";
  }

  return null;
};

const getPaidAtIso = (paidAt: string | null | undefined, fallback: string) => {
  if (!paidAt) return fallback;

  const parsed = new Date(paidAt);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
};

const getNextSubscriptionEnd = (currentEnd: string | null | undefined) => {
  const now = new Date();
  const currentEndDate = currentEnd ? new Date(currentEnd) : null;
  const base =
    currentEndDate && !Number.isNaN(currentEndDate.getTime()) && currentEndDate > now
      ? currentEndDate
      : now;

  const nextEnd = new Date(base);
  nextEnd.setDate(nextEnd.getDate() + SUBSCRIPTION_DAYS);
  return nextEnd.toISOString();
};

const findProcessedWebhookLog = async (
  supabase: SupabaseAdminClient,
  eventType: string,
  reference: string | null,
  providerTransactionId: string | null,
) => {
  let query = supabase
    .from("payment_webhook_logs")
    .select("id, processed")
    .eq("provider", "paystack")
    .eq("event_type", eventType)
    .eq("processed", true)
    .limit(1);

  if (providerTransactionId) {
    query = query.eq("provider_transaction_id", providerTransactionId);
  } else if (reference) {
    query = query.eq("reference", reference);
  } else {
    return null;
  }

  const { data } = await query.maybeSingle();
  return data;
};

const insertWebhookLog = async (
  supabase: SupabaseAdminClient,
  event: PaystackEvent,
  eventType: string,
  reference: string | null,
  providerTransactionId: string | null,
) => {
  const { data, error } = await supabase
    .from("payment_webhook_logs")
    .insert({
      provider: "paystack",
      event_type: eventType,
      reference,
      provider_transaction_id: providerTransactionId,
      payload: event,
      processed: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[PAYSTACK-WEBHOOK] Failed to insert webhook log:", error.message);
    return null;
  }

  return data?.id as string | null;
};

const markWebhookLog = async (
  supabase: SupabaseAdminClient,
  logId: string | null,
  processed: boolean,
  error: string | null = null,
) => {
  if (!logId) return;

  await supabase
    .from("payment_webhook_logs")
    .update({ processed, error })
    .eq("id", logId);
};

const loadTransaction = async (
  supabase: SupabaseAdminClient,
  reference: string,
): Promise<PaystackTransaction | null> => {
  const { data, error } = await supabase
    .from("paystack_transactions")
    .select("id, user_id, email, reference, plan, amount_ngn, currency, status")
    .eq("reference", reference)
    .maybeSingle();

  if (error) throw new Error(`Unable to load Paystack transaction: ${error.message}`);
  return data as PaystackTransaction | null;
};

const validateSuccessfulPayment = (event: PaystackEvent, transaction: PaystackTransaction) => {
  const payment = event.data;
  if (!payment) throw new Error("Missing Paystack event data");

  if (payment.status && payment.status !== "success") {
    throw new Error(`Paystack payment is not successful: ${payment.status}`);
  }

  const expectedAmountKobo = Number(transaction.amount_ngn) * 100;
  const paidAmountKobo = Number(payment.amount);
  if (!Number.isFinite(expectedAmountKobo) || expectedAmountKobo <= 0) {
    throw new Error("Stored Paystack transaction amount is invalid");
  }
  if (paidAmountKobo !== expectedAmountKobo) {
    throw new Error("Paystack payment amount mismatch");
  }

  const storedCurrency = String(transaction.currency || "NGN").toUpperCase();
  const paidCurrency = String(payment.currency || "").toUpperCase();
  if (paidCurrency && paidCurrency !== storedCurrency) {
    throw new Error("Paystack payment currency mismatch");
  }

  const storedEmail = String(transaction.email || "").toLowerCase();
  const paidEmail = String(payment.customer?.email || "").toLowerCase();
  if (storedEmail && paidEmail && storedEmail !== paidEmail) {
    throw new Error("Paystack payment email mismatch");
  }
};

const activateSubscription = async (
  supabase: SupabaseAdminClient,
  transaction: PaystackTransaction,
  event: PaystackEvent,
) => {
  const email = transaction.email || event.data?.customer?.email;
  if (!email) throw new Error("Cannot activate subscription without an email");

  const { data: profile, error: profileSelectError } = await supabase
    .from("profiles")
    .select("subscription_expires_at")
    .eq("id", transaction.user_id)
    .maybeSingle();

  if (profileSelectError) throw new Error(`Unable to load profile: ${profileSelectError.message}`);

  const subscriptionEnd = getNextSubscriptionEnd(profile?.subscription_expires_at);

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: transaction.user_id,
        email,
        subscription_tier: "pro",
        subscription_expires_at: subscriptionEnd,
        subscription_cancel_at_period_end: false,
        subscription_cancelled_at: null,
      },
      { onConflict: "id" },
    );

  if (profileError) throw new Error(`Unable to activate subscription: ${profileError.message}`);
  return subscriptionEnd;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!paystackSecretKey) return jsonResponse({ error: "Missing PAYSTACK_SECRET_KEY" }, 500);
  if (!supabaseUrl || !serviceRoleKey) return jsonResponse({ error: "Missing Supabase env" }, 500);

  const rawBody = await req.text();
  const hasValidSignature = await verifyPaystackSignature(req, rawBody, paystackSecretKey);
  if (!hasValidSignature) {
    return jsonResponse({ error: "Invalid Paystack signature" }, 401);
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ received: true });
  }

  const eventType = event.event || "unknown";
  const reference = event.data?.reference || null;
  const providerTransactionId = event.data?.id ? String(event.data.id) : null;
  const nowIso = new Date().toISOString();
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  console.log("[PAYSTACK-WEBHOOK] Received event", {
    eventType,
    reference,
    providerTransactionId,
  });

  const existingProcessedLog = await findProcessedWebhookLog(
    supabase,
    eventType,
    reference,
    providerTransactionId,
  );

  if (existingProcessedLog?.processed) {
    return jsonResponse({ received: true, duplicate: true });
  }

  const logId = await insertWebhookLog(supabase, event, eventType, reference, providerTransactionId);

  if (!reference) {
    await markWebhookLog(supabase, logId, true);
    return jsonResponse({ received: true });
  }

  try {
    const transaction = await loadTransaction(supabase, reference);
    if (!transaction) throw new Error("Paystack reference was not initialized by this app");

    if (eventType === "charge.success") {
      if (transaction.status === "paid") {
        await markWebhookLog(supabase, logId, true);
        return jsonResponse({ received: true, alreadyPaid: true });
      }

      validateSuccessfulPayment(event, transaction);

      const { error: updateError } = await supabase
        .from("paystack_transactions")
        .update({
          status: "paid",
          paystack_transaction_id: providerTransactionId,
          paid_at: getPaidAtIso(event.data?.paid_at, nowIso),
          updated_at: nowIso,
        })
        .eq("reference", reference);

      if (updateError) throw new Error(`Unable to update transaction: ${updateError.message}`);

      const subscriptionEnd = await activateSubscription(supabase, transaction, event);
      await markWebhookLog(supabase, logId, true);

      return jsonResponse({
        received: true,
        subscriptionEnd,
      });
    }

    const nextStatus = getPaystackTransactionStatus(event);
    if (nextStatus) {
      const { error: statusError } = await supabase
        .from("paystack_transactions")
        .update({ status: nextStatus, updated_at: nowIso })
        .eq("reference", reference);

      if (statusError) throw new Error(`Unable to update transaction status: ${statusError.message}`);
    }

    await markWebhookLog(supabase, logId, true);
    return jsonResponse({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[PAYSTACK-WEBHOOK] Processing error:", message);
    await markWebhookLog(supabase, logId, false, message);

    return jsonResponse({ received: true, error: message });
  }
});
