import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PaystackPayment } from "@/components/PaystackPayment";
import { supabase } from "@/integrations/supabase/client";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PricingDialog = ({ open, onOpenChange }: PricingDialogProps) => {
  const {
    user,
    session,
    subscriptionTier,
    subscriptionEnd,
    subscriptionCancelAtPeriodEnd,
    checkSubscription,
  } = useAuth();
  const navigate = useNavigate();
  const [downgrading, setDowngrading] = useState(false);
  const isPro = subscriptionTier === "pro";

  // Check subscription when dialog opens so Paystack activations are reflected.
  useEffect(() => {
    if (open && user) {
      checkSubscription();
    }
  }, [open, user, checkSubscription]);

  const handleUpgrade = async () => {
    if (!user || !session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upgrade",
        variant: "destructive",
      });
      onOpenChange(false);
      navigate("/auth?mode=signup");
      return;
    }
  };

  const closeBeforePaystackOpen = async () => {
    onOpenChange(false);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
  };

  const handleDowngrade = async () => {
    if (!session?.access_token) {
      toast({
        title: "Sign in required",
        description: "Please sign in again to manage your plan.",
        variant: "destructive",
      });
      onOpenChange(false);
      navigate("/auth?mode=signup");
      return;
    }

    setDowngrading(true);

    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || "Unable to cancel your Pro plan.");
      }

      const endDate = data.subscription_end || subscriptionEnd;
      const readableEndDate = endDate ? new Date(endDate).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      }) : "the end of your current period";

      toast({
        title: "Pro plan cancelled",
        description: `You can still use Pro until ${readableEndDate}. After that, your account will change to Free.`,
      });

      await checkSubscription();
    } catch (error: any) {
      toast({
        title: "Could not cancel Pro",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDowngrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Free Plan Card */}
          <div className={`border rounded-lg p-6 space-y-4 ${!isPro ? 'border-primary border-2 relative' : 'border-border'}`}>
            {!isPro && (
              <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                Current Plan
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="text-3xl font-bold mt-2">$0<span className="text-base text-muted-foreground">/month</span></p>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>50 job exports per month</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>2 job boards</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Save unlimited jobs</span>
              </li>
            </ul>
            {isPro ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDowngrade}
                disabled={downgrading || subscriptionCancelAtPeriodEnd}
              >
                {subscriptionCancelAtPeriodEnd ? "Pro ending" : downgrading ? "Cancelling..." : "Cancel Pro"}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                disabled
              >
                Current Plan
              </Button>
            )}
          </div>

          {/* Pro Plan Card */}
          <div className={`border rounded-lg p-6 space-y-4 relative ${isPro ? 'border-primary border-2' : 'border-border'}`}>
            <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              {isPro ? "Current Plan" : "Recommended"}
            </div>
            <div>
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="text-3xl font-bold mt-2">$20<span className="text-base text-muted-foreground">/month</span></p>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Unlimited job exports and saves</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Access to all job boards (up to 4)</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Advanced AI-powered job parsing</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Priority email support</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Early access to new features</span>
              </li>
            </ul>
            {isPro ? (
              <Button
                variant="outline"
                className="w-full"
                disabled
              >
                Current Plan
              </Button>
            ) : user && session ? (
              <PaystackPayment
                email={user.email || ""}
                amount={20}
                planName="Pro"
                buttonText="Upgrade to Pro"
                className="w-full"
                onBeforeOpen={closeBeforePaystackOpen}
                onSuccess={async () => {
                  await checkSubscription();
                }}
              />
            ) : (
              <Button
                className="w-full"
                onClick={handleUpgrade}
              >
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};
