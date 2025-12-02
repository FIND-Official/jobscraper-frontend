import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download, Trash2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { PricingDialog } from "./PricingDialog";
import { BillingDialog } from "./BillingDialog";
import { format } from "date-fns";

interface SavedJob {
  id: string;
  job_id: string;
  saved_at: string;
  jobs: {
    title: string;
    company: string;
    location: string;
    apply_url: string;
  };
}

interface GroupedJobs {
  [key: string]: SavedJob[];
}

export const SavedJobsSidebar = () => {
  const { user, subscriptionTier } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [exportCount, setExportCount] = useState(0);

  const fetchSavedJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id, job_id, saved_at, jobs(title, company, location, apply_url)")
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (error) throw error;
      setSavedJobs(data || []);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const count = parseInt(localStorage.getItem(`exportCount_${user?.id}`) || "0");
    setExportCount(count);
  }, [user]);

  useEffect(() => {
    fetchSavedJobs();
  }, [user]);

  // Real-time subscription for saved jobs
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('saved-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_jobs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchSavedJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleToggle = (jobId: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
    setSelectAll(newSelected.size === savedJobs.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedJobs(new Set());
      setSelectAll(false);
    } else {
      setSelectedJobs(new Set(savedJobs.map(job => job.id)));
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedJobs.size === 0) return;

    try {
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .in("id", Array.from(selectedJobs));

      if (error) throw error;
      
      setSavedJobs(savedJobs.filter(job => !selectedJobs.has(job.id)));
      setSelectedJobs(new Set());
      setSelectAll(false);
      
      toast({
        title: "Jobs removed",
        description: `${selectedJobs.size} job(s) removed from saved list`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove jobs",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (savedJobId: string) => {
    try {
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("id", savedJobId);

      if (error) throw error;
      
      setSavedJobs(savedJobs.filter(job => job.id !== savedJobId));
      toast({
        title: "Job removed",
        description: "Job removed from saved list",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove job",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    // Check export limits for free tier
    if (subscriptionTier === "free" && exportCount >= 50) {
      toast({
        title: "Export limit reached",
        description: "Free plan users can export 50 jobs per month. Upgrade to Pro for unlimited exports.",
        variant: "destructive",
      });
      setShowPricing(true);
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to export jobs",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("export-saved-jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        if (error.message?.includes("Pro subscription required") || error.message?.includes("403")) {
          setShowPricing(true);
          return;
        }
        throw error;
      }

      // Create blob and download
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saved-jobs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      // Increment export count for free tier
      if (subscriptionTier === "free") {
        const newCount = exportCount + savedJobs.length;
        setExportCount(newCount);
        localStorage.setItem(`exportCount_${user?.id}`, newCount.toString());
      }

      // Mark jobs as exported
      const exportedIds = savedJobs.map(job => job.job_id);
      const existingExported = JSON.parse(localStorage.getItem(`exportedJobs_${user?.id}`) || "[]");
      const updatedExported = [...new Set([...existingExported, ...exportedIds])];
      localStorage.setItem(`exportedJobs_${user?.id}`, JSON.stringify(updatedExported));

      toast({
        title: "Export successful",
        description: "Your saved jobs have been exported",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export jobs",
        variant: "destructive",
      });
    }
  };

  // Group jobs by date
  const groupedJobs = savedJobs.reduce<GroupedJobs>((acc, job) => {
    const date = format(new Date(job.saved_at), "dd/MM/yyyy HH:mm");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(job);
    return acc;
  }, {});

  return (
    <>
      <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-card border-l border-border p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Saved Jobs</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={savedJobs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBilling(true)}
            className="w-full mb-4"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </Button>
        )}

        {!user ? (
          <p className="text-sm text-muted-foreground">Sign in to save jobs</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : savedJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved jobs yet</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
              {selectedJobs.size > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDeleteSelected}
                  className="h-7 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete ({selectedJobs.size})
                </Button>
              )}
            </div>

            {Object.entries(groupedJobs).map(([dateTime, jobs]) => (
              <div key={dateTime} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {dateTime}
                </p>
                {jobs.map((savedJob) => (
                  <div key={savedJob.id} className="bg-secondary/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedJobs.has(savedJob.id)}
                        onCheckedChange={() => handleToggle(savedJob.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate">{savedJob.jobs.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">{savedJob.jobs.company}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(savedJob.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <PricingDialog open={showPricing} onOpenChange={setShowPricing} />
      <BillingDialog open={showBilling} onOpenChange={setShowBilling} />
    </>
  );
};