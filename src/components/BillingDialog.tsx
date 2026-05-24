import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PaystackPayment } from "@/components/PaystackPayment";

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BillingDialog = ({ open, onOpenChange }: BillingDialogProps) => {
  const { user, subscriptionTier, subscriptionEnd, checkSubscription } = useAuth();
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

  const closeBeforePaystackOpen = async () => {
    onOpenChange(false);
    await new Promise((resolve) => window.setTimeout(resolve, 300));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Subscription & Billing</DialogTitle>
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

        <div className="space-y-6 py-4">
          <Card className={`p-6 border-2 ${isPro ? 'bg-gradient-to-br from-primary/10 to-primary/20 border-primary' : 'bg-gradient-to-br from-muted/30 to-muted/50 border-border'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">
                  {isPro ? "Pro Plan" : "Free Plan"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isPro ? "$20/month" : "Limited features"}
                </p>
                {isPro && subscriptionEnd && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Active until {format(new Date(subscriptionEnd), "MMMM d, yyyy")}
                  </p>
                )}
              </div>
              <Badge 
                variant={isPro ? "default" : "secondary"} 
                className={`text-sm px-3 py-1 ${isPro ? 'bg-primary text-primary-foreground' : ''}`}
              >
                {isPro ? "PRO" : "FREE"}
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
              <div className="flex items-center gap-2 text-sm">
                {isPro ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={!isPro ? "text-muted-foreground" : ""}>
                  Job archiving
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {isPro ? (
                <Button disabled className="w-full" variant="outline">
                  Plan active
                </Button>
              ) : user?.email ? (
                <PaystackPayment
                  email={user.email}
                  amount={20}
                  planName="Pro"
                  buttonText="Upgrade to Pro - $20/month"
                  className="w-full bg-primary hover:bg-primary/90"
                  onBeforeOpen={closeBeforePaystackOpen}
                  onSuccess={async () => {
                    await checkSubscription();
                  }}
                />
              ) : (
                <Button
                  disabled
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
                <li>• Job archiving for organization</li>
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
