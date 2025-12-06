import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PricingDialog = ({ open, onOpenChange }: PricingDialogProps) => {
  const { user, session, subscriptionTier, checkSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isPro = subscriptionTier === "pro";

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      await checkSubscription();
      toast({
        title: "Status updated",
        description: "Your subscription status has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh subscription status",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpgrade = async () => {
    if (!user || !session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upgrade",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
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
                <span>Browse all remote jobs</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Save unlimited jobs</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Filter by job board</span>
              </li>
            </ul>
            <Button
              variant="outline"
              className="w-full"
              disabled={!isPro || loading}
              onClick={isPro ? handleManageSubscription : undefined}
            >
              {!isPro ? "Current Plan" : "Downgrade"}
            </Button>
          </div>

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
                <span>Everything in Free</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Export saved jobs as CSV</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary mt-0.5" />
                <span>Priority support</span>
              </li>
            </ul>
            <Button
              className="w-full"
              onClick={isPro ? handleManageSubscription : handleUpgrade}
              disabled={loading}
            >
              {loading ? "Loading..." : isPro ? "Cancel Plan" : "Upgrade to Pro"}
            </Button>
          </div>
        </div>

        {isPro && (
          <p className="text-xs text-center text-muted-foreground mt-4">
            Just upgraded? Click the refresh button above to update your status.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
