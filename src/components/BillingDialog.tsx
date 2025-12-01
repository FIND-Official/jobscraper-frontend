import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BillingDialog = ({ open, onOpenChange }: BillingDialogProps) => {
  const { subscriptionTier, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const isPro = subscriptionTier === "pro";

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

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
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
          <DialogTitle className="text-2xl">Subscription & Billing</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">
                  {isPro ? "Pro Plan" : "Free Plan"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isPro ? "$20/month" : "Limited features"}
                </p>
              </div>
              <Badge variant={isPro ? "default" : "secondary"} className="text-sm px-3 py-1">
                {isPro ? "Active" : "Current"}
              </Badge>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{isPro ? "Unlimited" : "50"} job exports per month</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>{isPro ? "All" : "2"} job boards</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isPro ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={!isPro ? "text-muted-foreground" : ""}>
                  Priority support
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isPro ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={!isPro ? "text-muted-foreground" : ""}>
                  Advanced AI parsing
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {isPro ? (
                <>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loading}
                    className="flex-1"
                    variant="outline"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={loading}
                    className="flex-1 bg-destructive hover:bg-destructive/90"
                  >
                    Cancel Plan
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Upgrade to Pro - $20/month
                </Button>
              )}
            </div>
          </Card>

          {!isPro && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Pro Benefits</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Unlimited job exports and saves</li>
                <li>• Access to all premium job boards</li>
                <li>• Advanced AI-powered job parsing</li>
                <li>• Priority email support</li>
                <li>• Early access to new features</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
