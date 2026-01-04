import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download, Trash2, CreditCard, Archive, ArchiveRestore, X, Bookmark } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { PricingDialog } from "./PricingDialog";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface ArchivedJob {
  id: string;
  job_id: string;
  archived_at: string;
  jobs: {
    title: string;
    company: string;
    location: string;
    apply_url: string;
  };
}

interface ExportedJobsMap {
  [key: string]: boolean;
}

interface GroupedJobs<T> {
  [key: string]: T[];
}

export const SavedJobsSidebar = () => {
  const { user, subscriptionTier } = useAuth();
  const isMobile = useIsMobile();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [archivedJobs, setArchivedJobs] = useState<ArchivedJob[]>([]);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectedArchivedJobs, setSelectedArchivedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [selectAllArchived, setSelectAllArchived] = useState(false);
  const [monthlyExportCount, setMonthlyExportCount] = useState(0);
  const [exportedJobIds, setExportedJobIds] = useState<ExportedJobsMap>({});
  const [activeTab, setActiveTab] = useState("saved");
  const [isOpen, setIsOpen] = useState(false);

  const FREE_EXPORT_LIMIT = 50;

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

  const fetchArchivedJobs = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("archived_jobs")
        .select("id, job_id, archived_at, jobs(title, company, location, apply_url)")
        .eq("user_id", user.id)
        .order("archived_at", { ascending: false });

      if (error) throw error;
      setArchivedJobs(data || []);
    } catch (error) {
      console.error("Error fetching archived jobs:", error);
    }
  };

  const fetchMonthlyExportCount = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("monthly_export_count, export_reset_date")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      
      // Check if we need to reset the counter (new month)
      const resetDate = new Date(data.export_reset_date);
      const now = new Date();
      
      if (now >= resetDate) {
        // Reset the counter for the new month
        const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await supabase
          .from("profiles")
          .update({
            monthly_export_count: 0,
            export_reset_date: nextResetDate.toISOString()
          })
          .eq("id", user.id);
        setMonthlyExportCount(0);
      } else {
        setMonthlyExportCount(data.monthly_export_count);
      }
    } catch (error) {
      console.error("Error fetching export count:", error);
    }
  };

  useEffect(() => {
    fetchMonthlyExportCount();
    const exported = localStorage.getItem(`exportedJobs_${user?.id}`);
    if (exported) {
      const ids = JSON.parse(exported) as string[];
      setExportedJobIds(ids.reduce((acc, id) => ({ ...acc, [id]: true }), {}));
    }
  }, [user]);

  useEffect(() => {
    fetchSavedJobs();
    fetchArchivedJobs();
  }, [user]);

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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'archived_jobs',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchArchivedJobs();
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

  const handleToggleArchived = (jobId: string) => {
    const newSelected = new Set(selectedArchivedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedArchivedJobs(newSelected);
    setSelectAllArchived(newSelected.size === archivedJobs.length);
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

  const handleSelectAllArchived = () => {
    if (selectAllArchived) {
      setSelectedArchivedJobs(new Set());
      setSelectAllArchived(false);
    } else {
      setSelectedArchivedJobs(new Set(archivedJobs.map(job => job.id)));
      setSelectAllArchived(true);
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

  const handleArchiveSelected = async () => {
    if (selectedJobs.size === 0 || !user) return;

    try {
      // Get the job_ids of selected saved jobs
      const jobsToArchive = savedJobs.filter(job => selectedJobs.has(job.id));
      
      // Insert into archived_jobs
      const { error: archiveError } = await supabase
        .from("archived_jobs")
        .upsert(
          jobsToArchive.map(job => ({
            user_id: user.id,
            job_id: job.job_id,
          })),
          { onConflict: 'user_id,job_id' }
        );

      if (archiveError) throw archiveError;

      // Remove from saved_jobs
      const { error: deleteError } = await supabase
        .from("saved_jobs")
        .delete()
        .in("id", Array.from(selectedJobs));

      if (deleteError) throw deleteError;
      
      setSelectedJobs(new Set());
      setSelectAll(false);
      
      toast({
        title: "Jobs archived",
        description: `${jobsToArchive.length} job(s) moved to archive`,
      });
      
      fetchSavedJobs();
      fetchArchivedJobs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive jobs",
        variant: "destructive",
      });
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedArchivedJobs.size === 0 || !user) return;

    try {
      const jobsToRestore = archivedJobs.filter(job => selectedArchivedJobs.has(job.id));
      
      // Insert back into saved_jobs
      const { error: saveError } = await supabase
        .from("saved_jobs")
        .upsert(
          jobsToRestore.map(job => ({
            user_id: user.id,
            job_id: job.job_id,
          })),
          { onConflict: 'user_id,job_id', ignoreDuplicates: true }
        );

      if (saveError) throw saveError;

      // Remove from archived_jobs
      const { error: deleteError } = await supabase
        .from("archived_jobs")
        .delete()
        .in("id", Array.from(selectedArchivedJobs));

      if (deleteError) throw deleteError;
      
      setSelectedArchivedJobs(new Set());
      setSelectAllArchived(false);
      
      toast({
        title: "Jobs restored",
        description: `${jobsToRestore.length} job(s) restored to saved list`,
      });
      
      fetchSavedJobs();
      fetchArchivedJobs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore jobs",
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

  const handleDeleteArchived = async (archivedJobId: string) => {
    try {
      const { error } = await supabase
        .from("archived_jobs")
        .delete()
        .eq("id", archivedJobId);

      if (error) throw error;
      
      setArchivedJobs(archivedJobs.filter(job => job.id !== archivedJobId));
      toast({
        title: "Job removed",
        description: "Job removed from archive",
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
    // Only export selected jobs
    if (selectedJobs.size === 0) {
      toast({
        title: "No jobs selected",
        description: "Please select jobs to export",
        variant: "destructive",
      });
      return;
    }

    const jobsToExportCount = selectedJobs.size;
    
    // Only check export limits for free users
    if (subscriptionTier === "free" && (monthlyExportCount + jobsToExportCount) > FREE_EXPORT_LIMIT) {
      const remaining = FREE_EXPORT_LIMIT - monthlyExportCount;
      toast({
        title: "Export limit reached",
        description: remaining > 0 
          ? `You can only export ${remaining} more job(s) this month. Upgrade to Pro for unlimited exports.`
          : "Free plan users can export 50 jobs per month. Upgrade to Pro for unlimited exports.",
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

      // Pass selected job IDs to the export function
      const selectedJobIdsArray = Array.from(selectedJobs);
      
      const { data, error } = await supabase.functions.invoke("export-saved-jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: { jobIds: selectedJobIdsArray },
      });

      if (error) {
        if (error.message?.includes("Pro subscription required") || error.message?.includes("403")) {
          setShowPricing(true);
          return;
        }
        throw error;
      }

      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saved-jobs-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      // Update monthly export count in database for free users
      if (subscriptionTier === "free" && user) {
        const newCount = monthlyExportCount + jobsToExportCount;
        setMonthlyExportCount(newCount);
        
        await supabase
          .from("profiles")
          .update({ monthly_export_count: newCount })
          .eq("id", user.id);
      }

      // Track exported job IDs
      const exportedIds = savedJobs
        .filter(job => selectedJobs.has(job.id))
        .map(job => job.job_id);
      const existingExported = JSON.parse(localStorage.getItem(`exportedJobs_${user?.id}`) || "[]");
      const updatedExported = [...new Set([...existingExported, ...exportedIds])];
      localStorage.setItem(`exportedJobs_${user?.id}`, JSON.stringify(updatedExported));
      setExportedJobIds(updatedExported.reduce((acc: ExportedJobsMap, id: string) => ({ ...acc, [id]: true }), {}));

      toast({
        title: "Export successful",
        description: `${jobsToExportCount} job(s) have been exported`,
      });
      
      // Clear selection after export
      setSelectedJobs(new Set());
      setSelectAll(false);
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export jobs",
        variant: "destructive",
      });
    }
  };

  const groupedSavedJobs = savedJobs.reduce<GroupedJobs<SavedJob>>((acc, job) => {
    const date = format(new Date(job.saved_at), "dd/MM/yyyy HH:mm");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(job);
    return acc;
  }, {});

  const groupedArchivedJobs = archivedJobs.reduce<GroupedJobs<ArchivedJob>>((acc, job) => {
    const date = format(new Date(job.archived_at), "dd/MM/yyyy HH:mm");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(job);
    return acc;
  }, {});

  const remainingExports = FREE_EXPORT_LIMIT - monthlyExportCount;
  const isPro = subscriptionTier === "pro";
  const hasSelectedJobs = selectedJobs.size > 0;

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Saved Jobs</h2>
        <div className="flex items-center gap-2">
          {user && !isPro && (
            <span className="text-xs text-muted-foreground">
              {remainingExports}/{FREE_EXPORT_LIMIT}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={!hasSelectedJobs}
            title={!hasSelectedJobs ? "Select jobs to export" : `Export ${selectedJobs.size} selected job(s)`}
          >
            <Download className="h-4 w-4 mr-1" />
            Export {hasSelectedJobs && `(${selectedJobs.size})`}
          </Button>
        </div>
      </div>


      {!user ? (
        <p className="text-sm text-muted-foreground">Sign in to save jobs</p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-3">
            <TabsTrigger value="saved" className="text-xs">
              Saved ({savedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">
              Archived ({archivedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="mt-0">
            {savedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved jobs yet</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-xs text-muted-foreground">Select all</span>
                  </div>
                  {selectedJobs.size > 0 && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleArchiveSelected}
                        className="h-7 text-xs"
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDeleteSelected}
                        className="h-7 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {Object.entries(groupedSavedJobs).map(([dateTime, jobs]) => (
                  <div key={dateTime} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {dateTime}
                    </p>
                    {jobs.map((savedJob) => (
                      <div key={savedJob.id} className="bg-secondary/50 rounded-lg p-2.5 space-y-1">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={selectedJobs.has(savedJob.id)}
                            onCheckedChange={() => handleToggle(savedJob.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-medium truncate">{savedJob.jobs.title}</h3>
                              {exportedJobIds[savedJob.job_id] && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                                  Exported
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{savedJob.jobs.company}</p>
                          </div>
                          <button
                            onClick={() => handleDelete(savedJob.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-0">
            {archivedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No archived jobs</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectAllArchived}
                      onCheckedChange={handleSelectAllArchived}
                    />
                    <span className="text-xs text-muted-foreground">Select all</span>
                  </div>
                  {selectedArchivedJobs.size > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRestoreSelected}
                      className="h-7 text-xs"
                    >
                      <ArchiveRestore className="h-3 w-3 mr-1" />
                      Restore ({selectedArchivedJobs.size})
                    </Button>
                  )}
                </div>

                {Object.entries(groupedArchivedJobs).map(([dateTime, jobs]) => (
                  <div key={dateTime} className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {dateTime}
                    </p>
                    {jobs.map((archivedJob) => (
                      <div key={archivedJob.id} className="bg-secondary/50 rounded-lg p-2.5 space-y-1">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={selectedArchivedJobs.has(archivedJob.id)}
                            onCheckedChange={() => handleToggleArchived(archivedJob.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium truncate">{archivedJob.jobs.title}</h3>
                            <p className="text-xs text-muted-foreground truncate">{archivedJob.jobs.company}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteArchived(archivedJob.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </>
  );

  // Mobile: Show as a drawer/sheet
  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg h-14 w-14"
              size="icon"
            >
              <Bookmark className="h-6 w-6" />
              {savedJobs.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {savedJobs.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96 p-4 overflow-y-auto">
            <SheetHeader className="sr-only">
              <SheetTitle>Saved Jobs</SheetTitle>
            </SheetHeader>
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <PricingDialog open={showPricing} onOpenChange={setShowPricing} />
      </>
    );
  }

  // Desktop: Show as fixed sidebar
  return (
    <>
      <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-card border-l border-border p-4 overflow-y-auto hidden lg:block">
        {sidebarContent}
      </div>

      <PricingDialog open={showPricing} onOpenChange={setShowPricing} />
    </>
  );
};
