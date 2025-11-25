import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { PricingDialog } from "./PricingDialog";

interface SavedJob {
  id: string;
  job_id: string;
  jobs: {
    title: string;
    company: string;
    location: string;
    apply_url: string;
  };
}

export const SavedJobsSidebar = () => {
  const { user, subscriptionTier } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const fetchSavedJobs = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id, job_id, jobs(title, company, location, apply_url)")
        .eq("user_id", user.id);

      if (error) throw error;
      setSavedJobs(data || []);
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, [user]);

  const handleToggle = (jobId: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
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

  const handleExport = () => {
    if (subscriptionTier !== "pro") {
      setShowPricing(true);
      return;
    }

    const jobsToExport = savedJobs.filter(job => 
      selectedJobs.size === 0 || selectedJobs.has(job.id)
    );

    const csv = [
      ["Title", "Company", "Location", "Apply URL"],
      ...jobsToExport.map(job => [
        job.jobs.title,
        job.jobs.company,
        job.jobs.location,
        job.jobs.apply_url,
      ]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saved-jobs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${jobsToExport.length} jobs`,
    });
  };

  return (
    <>
      <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-card border-l border-border p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
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

        {!user ? (
          <p className="text-sm text-muted-foreground">Sign in to save jobs</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : savedJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No saved jobs yet</p>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((savedJob) => (
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
        )}
      </div>

      <PricingDialog open={showPricing} onOpenChange={setShowPricing} />
    </>
  );
};