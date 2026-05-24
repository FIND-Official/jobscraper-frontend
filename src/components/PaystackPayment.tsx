import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PAYSTACK_SCRIPT_URL = "https://js.paystack.co/v1/inline.js";

interface PaystackPaymentProps {
  email: string;
  amount: number;
  planName: string;
  onSuccess: () => void | Promise<void>;
  onBeforeOpen?: () => void | Promise<void>;
  buttonText?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
}

type PaystackHandler = {
  openIframe: () => void;
};

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: Record<string, unknown>) => PaystackHandler;
    };
  }
}

const loadPaystackScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${PAYSTACK_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Paystack.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = PAYSTACK_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack."));
    document.body.appendChild(script);
  });

export function PaystackPayment({
  email,
  amount,
  planName,
  onSuccess,
  onBeforeOpen,
  buttonText = "Subscribe Now",
  className,
  variant,
  disabled,
}: PaystackPaymentProps) {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

    if (!session?.access_token) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upgrade.",
        variant: "destructive",
      });
      return;
    }

    if (!publicKey) {
      toast({
        title: "Payment unavailable",
        description: "Paystack is not configured for this app.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("init-paystack-payment", {
        body: {
          amountUsd: amount,
          currency: "NGN",
          plan: planName,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const reference = String(data?.reference || "");
      const amountKobo = Number(data?.amountKobo);
      const amountNgn = Number(data?.amountNgn);
      const exchangeRate = Number(data?.exchangeRate);

      if (
        !reference ||
        !Number.isFinite(amountKobo) ||
        amountKobo <= 0 ||
        !Number.isFinite(amountNgn) ||
        !Number.isFinite(exchangeRate)
      ) {
        throw new Error("Unable to initialize Paystack payment.");
      }

      await loadPaystackScript();

      if (!window.PaystackPop) {
        throw new Error("Paystack failed to load.");
      }

      await onBeforeOpen?.();

      const verifyPayment = async (paidReference: string) => {
        try {
          const { data: verification, error: verificationError } =
            await supabase.functions.invoke("verify-paystack-payment", {
              body: { reference: paidReference },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });

          if (verificationError) throw verificationError;
          if (!verification?.success) {
            throw new Error(verification?.error || "Payment verification failed.");
          }

          toast({
            title: "Payment successful",
            description: `Your ${planName} plan is now active.`,
          });

          await onSuccess();
        } catch (error: any) {
          toast({
            title: "Payment verification failed",
            description: error.message || "Please contact support if you were charged.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      const handler = window.PaystackPop.setup({
        key: publicKey,
        email,
        amount: amountKobo,
        currency: "NGN",
        ref: reference,
        metadata: {
          planName,
          amountUsd: amount,
          amountNgn,
          exchangeRate,
        },
        callback: (response: any) => {
          void verifyPayment(response?.reference || reference);
        },
        onClose: () => {
          toast({
            title: "Payment cancelled",
            description: "No payment was completed.",
            variant: "destructive",
          });
          setIsLoading(false);
        },
      });

      handler.openIframe();
    } catch (error: any) {
      toast({
        title: "Payment failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={disabled || isLoading} className={className} variant={variant}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}
