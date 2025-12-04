import { useEffect, useState } from "react";
import { Bookmark, ExternalLink, MapPin, Briefcase, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "./AuthDialog";
import { JobDetailModal } from "./JobDetailModal";
import { toast } from "@/hooks/use-toast";
import { differenceInDays, format } from "date-fns";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  description: string;
  apply_url: string;
  source: string;
  posted_date: string | null;
  scraped_at: string;
  tags: string[];
}

interface DeduplicatedJob extends Job {
  duplicateCount: number;
  duplicateSources: string[];
}

interface ScrapeSession {
  id: string;
  timestamp: string;
  searchQuery: string;
  boards: string[];
  jobCount: number;
}

interface JobListProps {
  scrapeSessions?: ScrapeSession[];
  onClearSessions?: () => void;
  refreshTrigger?: number;
}

export const JobList = ({ scrapeSessions = [], onClearSessions, refreshTrigger }: JobListProps) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DeduplicatedJob[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [exportedJobIds, setExportedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedJob, setSelectedJob] = useState<DeduplicatedJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [urlFirstSeen, setUrlFirstSeen] = useState<Map<string, string>>(new Map());
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");
  const jobsPerPage = 10;

  useEffect(() => {
    fetchJobs();
    if (user) {
      fetchSavedJobs();
      loadExportedJobs();
    }
  }, [user]);

  // Refresh jobs when scrape completes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchJobs();
    }
  }, [refreshTrigger]);

  // Real-time subscription for saved jobs
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('job-list-saved-changes')
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

  const loadExportedJobs = () => {
    if (!user) return;
    const exported = localStorage.getItem(`exportedJobs_${user.id}`);
    if (exported) {
      setExportedJobIds(new Set(JSON.parse(exported)));
    }
  };

  const deduplicateJobs = (rawJobs: Job[]): DeduplicatedJob[] => {
    const urlMap = new Map<string, Job[]>();
    const firstSeenMap = new Map<string, string>();
    
    rawJobs.forEach((job) => {
      const url = job.apply_url.toLowerCase().trim();
      if (!urlMap.has(url)) {
        urlMap.set(url, []);
        firstSeenMap.set(url, job.scraped_at);
      } else {
        const existingDate = new Date(firstSeenMap.get(url)!);
        const newDate = new Date(job.scraped_at);
        if (newDate < existingDate) {
          firstSeenMap.set(url, job.scraped_at);
        }
      }
      urlMap.get(url)!.push(job);
    });

    setUrlFirstSeen(firstSeenMap);

    const deduplicated: DeduplicatedJob[] = [];
    urlMap.forEach((duplicates) => {
      const sortedDuplicates = duplicates.sort(
        (a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
      );
      const primaryJob = sortedDuplicates[0];
      const sources = [...new Set(duplicates.map((d) => d.source))];
      
      deduplicated.push({
        ...primaryJob,
        duplicateCount: duplicates.length - 1,
        duplicateSources: sources,
      });
    });

    return deduplicated.sort(
      (a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
    );
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("scraped_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      const deduplicated = deduplicateJobs(data || []);
      setJobs(deduplicated);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("job_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setSavedJobIds(new Set(data.map(item => item.job_id)));
    } catch (error) {
      console.error("Error fetching saved jobs:", error);
    }
  };

  const handleSave = async (jobId: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    try {
      if (savedJobIds.has(jobId)) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("job_id", jobId)
          .eq("user_id", user.id);

        if (error) throw error;

        const newSaved = new Set(savedJobIds);
        newSaved.delete(jobId);
        setSavedJobIds(newSaved);

        toast({
          title: "Job removed",
          description: "Job removed from saved list",
        });
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .insert({ job_id: jobId, user_id: user.id });

        if (error) throw error;

        setSavedJobIds(new Set([...savedJobIds, jobId]));

        toast({
          title: "Job saved!",
          description: "Job added to your saved list",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save job",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedJobs(new Set());
      setSelectAll(false);
    } else {
      setSelectedJobs(new Set(currentJobs.map(job => job.id)));
      setSelectAll(true);
    }
  };

  const handleToggleJob = (jobId: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
    setSelectAll(newSelected.size === currentJobs.length);
  };

  const handleClearSelected = () => {
    const count = selectedJobs.size;
    setSelectedJobs(new Set());
    setSelectAll(false);
    toast({
      title: "Selection cleared",
      description: `${count} job(s) deselected`,
    });
  };

  const isJobStale = (job: DeduplicatedJob) => {
    const url = job.apply_url.toLowerCase().trim();
    const firstSeen = urlFirstSeen.get(url);
    if (!firstSeen) return false;
    
    const daysSinceFirstSeen = differenceInDays(new Date(), new Date(firstSeen));
    return daysSinceFirstSeen >= 30;
  };

  const handleJobClick = (job: DeduplicatedJob) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>;
  }

  // Sort jobs based on selected option
  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
    }
    const aStale = isJobStale(a);
    const bStale = isJobStale(b);
    if (aStale !== bStale) return aStale ? 1 : -1;
    return new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime();
  });

  const totalPages = Math.ceil(sortedJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = sortedJobs.slice(startIndex, endIndex);

  const totalDuplicatesMerged = jobs.reduce((sum, job) => sum + job.duplicateCount, 0);

  return (
    <>
      <div className="space-y-8">
        {/* Scrape Sessions History */}
        {scrapeSessions.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Recent Scrapes</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearSessions}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear History
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {scrapeSessions.map((session) => (
                <Badge 
                  key={session.id} 
                  variant="secondary" 
                  className="text-xs py-1 px-2"
                >
                  "{session.searchQuery}" - {session.boards.join(', ')} ({session.jobCount} jobs) • {format(new Date(session.timestamp), 'HH:mm')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-2xl font-semibold">
              Results <span className="text-primary">{jobs.length}</span>
            </h2>
            {totalDuplicatesMerged > 0 && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {totalDuplicatesMerged} duplicates merged
              </Badge>
            )}
            {jobs.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-xs text-muted-foreground">Select all</span>
                </div>
                {selectedJobs.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelected}
                    className="h-8 text-xs text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear ({selectedJobs.size})
                  </Button>
                )}
              </div>
            )}
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "relevance" | "date")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Sort by: Relevance</SelectItem>
              <SelectItem value="date">Sort by: Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">No jobs found. Click "Scrape Jobs" to get started!</p>
            </div>
          ) : (
            currentJobs.map((job) => {
              const stale = isJobStale(job);
              const exported = exportedJobIds.has(job.id);
              
              return (
                <div
                  key={job.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all cursor-pointer"
                  onClick={() => handleJobClick(job)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div 
                      className="flex items-center gap-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedJobs.has(job.id)}
                        onCheckedChange={() => handleToggleJob(job.id)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                          {job.source}
                        </Badge>
                        {job.duplicateCount > 0 && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            {job.duplicateCount} duplicate{job.duplicateCount > 1 ? 's' : ''} merged
                          </Badge>
                        )}
                        {exported && (
                          <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                            Exported
                          </Badge>
                        )}
                        {stale && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">
                            Potentially old job
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="font-medium text-foreground">{job.company}</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location || "Remote"}
                        </span>
                        {job.job_type && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {job.job_type}
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {job.description.replace(/<[^>]*>/g, "").substring(0, 200)}...
                        </p>
                      )}

                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {job.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSave(job.id)}
                        className={savedJobIds.has(job.id) ? "text-primary" : ""}
                      >
                        <Bookmark
                          className="h-5 w-5"
                          fill={savedJobIds.has(job.id) ? "currentColor" : "none"}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        asChild
                      >
                        <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {jobs.length > jobsPerPage && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </Button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
      <JobDetailModal
        job={selectedJob}
        open={showJobDetail}
        onOpenChange={setShowJobDetail}
        isExported={selectedJob ? exportedJobIds.has(selectedJob.id) : false}
        isStale={selectedJob ? isJobStale(selectedJob) : false}
        duplicateCount={selectedJob?.duplicateCount}
      />
    </>
  );
};
