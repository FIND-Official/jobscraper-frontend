import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PricingDialog = ({ open, onOpenChange }: PricingDialogProps) => {
  const { user, session, subscriptionTier } = useAuth();
  const [loading, setLoading] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="border border-border rounded-lg p-6 space-y-4">
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
              disabled={subscriptionTier === "free"}
            >
              {subscriptionTier === "free" ? "Current Plan" : "Downgrade"}
            </Button>
          </div>

          <div className="border-2 border-primary rounded-lg p-6 space-y-4 relative">
            <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
              Recommended
            </div>
            <div>
              <h3 className="text-xl font-semibold">Pro</h3>
              <p className="text-3xl font-bold mt-2">$2.50<span className="text-base text-muted-foreground">/month</span></p>
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
              onClick={handleUpgrade}
              disabled={loading || subscriptionTier === "pro"}
            >
              {loading ? "Loading..." : subscriptionTier === "pro" ? "Current Plan" : "Upgrade to Pro"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};