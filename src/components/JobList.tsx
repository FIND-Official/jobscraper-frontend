import { useEffect, useState } from "react";
import {
  Bookmark,
  ExternalLink,
  MapPin,
  Briefcase,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CleanText from "@/components/CleanText";
import DOMPurify from "dompurify";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const DISMISSED_JOBS_KEY = "dismissed_jobs_anonymous";
const HAS_SCRAPED_KEY = "has_scraped_jobs";

export const JobList = ({
  scrapeSessions = [],
  onClearSessions,
  refreshTrigger,
}: JobListProps) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<DeduplicatedJob[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [exportedJobIds, setExportedJobIds] = useState<Set<string>>(new Set());
  const [dismissedJobIds, setDismissedJobIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedJob, setSelectedJob] = useState<DeduplicatedJob | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);
  const [urlFirstSeen, setUrlFirstSeen] = useState<Map<string, string>>(
    new Map(),
  );
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");
  const [hasScraped, setHasScraped] = useState(false);
  const jobsPerPage = 10;

  // HTML CLEANER FUNCTION - NO EXTRA FILES NEEDED

  useEffect(() => {
    const scraped = localStorage.getItem(HAS_SCRAPED_KEY);
    setHasScraped(scraped === "true");
  }, []);

  useEffect(() => {
    fetchDismissedJobs();
    if (user) {
      fetchSavedJobs();
      loadExportedJobs();
    }
  }, [user]);

  useEffect(() => {
    if (hasScraped || user) {
      fetchJobs();
    } else {
      setLoading(false);
    }
  }, [dismissedJobIds, hasScraped, user]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      localStorage.setItem(HAS_SCRAPED_KEY, "true");
      setHasScraped(true);
      fetchJobs();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("job-list-saved-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "saved_jobs",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSavedJobs();
        },
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
        (a, b) =>
          new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime(),
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
      (a, b) =>
        new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime(),
    );
  };

  const fetchDismissedJobs = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from("dismissed_jobs")
          .select("job_id")
          .eq("user_id", user.id);

        if (error) throw error;
        setDismissedJobIds(new Set(data.map((item) => item.job_id)));
      } catch (error) {
        console.error("Error fetching dismissed jobs:", error);
      }
    } else {
      const dismissed = localStorage.getItem(DISMISSED_JOBS_KEY);
      if (dismissed) {
        setDismissedJobIds(new Set(JSON.parse(dismissed)));
      }
    }
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

      const filteredData = (data || []).filter(
        (job) => !dismissedJobIds.has(job.id),
      );
      const deduplicated = deduplicateJobs(filteredData);
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
      setSavedJobIds(new Set(data.map((item) => item.job_id)));
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
      setSelectedJobs(new Set(currentJobs.map((job) => job.id)));
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

  const handleClearSelected = async () => {
    const count = selectedJobs.size;
    const jobIdsToDismiss = Array.from(selectedJobs);

    try {
      if (user) {
        const { error } = await supabase.from("dismissed_jobs").upsert(
          jobIdsToDismiss.map((jobId) => ({
            user_id: user.id,
            job_id: jobId,
          })),
          { onConflict: "user_id,job_id" },
        );

        if (error) throw error;
      } else {
        const existingDismissed = JSON.parse(
          localStorage.getItem(DISMISSED_JOBS_KEY) || "[]",
        );
        const updatedDismissed = [
          ...new Set([...existingDismissed, ...jobIdsToDismiss]),
        ];
        localStorage.setItem(
          DISMISSED_JOBS_KEY,
          JSON.stringify(updatedDismissed),
        );
      }

      const newDismissed = new Set([...dismissedJobIds, ...jobIdsToDismiss]);
      setDismissedJobIds(newDismissed);
      setJobs((prevJobs) =>
        prevJobs.filter((job) => !selectedJobs.has(job.id)),
      );
      setSelectedJobs(new Set());
      setSelectAll(false);

      toast({
        title: "Jobs dismissed",
        description: `${count} job(s) removed from results`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to dismiss jobs",
        variant: "destructive",
      });
    }
  };

  const isJobStale = (job: DeduplicatedJob) => {
    const url = job.apply_url.toLowerCase().trim();
    const firstSeen = urlFirstSeen.get(url);
    if (!firstSeen) return false;

    const daysSinceFirstSeen = differenceInDays(
      new Date(),
      new Date(firstSeen),
    );
    return daysSinceFirstSeen >= 30;
  };

  const handleJobClick = (job: DeduplicatedJob) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-8 w-20 shrink-0" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-14" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    );
  }

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
      );
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

  const totalDuplicatesMerged = jobs.reduce(
    (sum, job) => sum + job.duplicateCount,
    0,
  );

  if (!hasScraped && !user) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-semibold">
            Results <span className="text-primary">0</span>
          </h2>
        </div>
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">
            No jobs found. Click "Scrape Jobs" to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
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
                  "{session.searchQuery}" - {session.boards.join(", ")} (
                  {session.jobCount} jobs) •{" "}
                  {format(new Date(session.timestamp), "HH:mm")}
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
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-600"
              >
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
                  <span className="text-xs text-muted-foreground">
                    Select all
                  </span>
                </div>
                {selectedJobs.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelected}
                    className="h-8 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete ({selectedJobs.size})
                  </Button>
                )}
              </div>
            )}
          </div>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as "relevance" | "date")}
          >
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
              <p className="text-muted-foreground">
                No jobs found. Click "Scrape Jobs" to get started!
              </p>
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
                        <Badge
                          variant="secondary"
                          className="bg-primary/20 text-primary border-0"
                        >
                          {job.source}
                        </Badge>
                        {job.duplicateCount > 0 && (
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-600"
                          >
                            {job.duplicateCount} duplicate
                            {job.duplicateCount > 1 ? "s" : ""} merged
                          </Badge>
                        )}
                        {exported && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600 bg-green-50"
                          >
                            Exported
                          </Badge>
                        )}
                        {stale && (
                          <Badge
                            variant="outline"
                            className="text-yellow-600 border-yellow-600 bg-yellow-50"
                          >
                            Potentially old job
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="font-medium text-foreground">
                          {job.company}
                        </span>
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
                      {/* Description - CLEAN HTML */}
                      {job.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          <CleanText html={job.description} maxLength={200} />
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {job.tags?.slice(0, 5).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div
                      className="flex flex-col gap-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant={
                          savedJobIds.has(job.id) ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handleSave(job.id)}
                      >
                        <Bookmark
                          className={`h-4 w-4 ${savedJobIds.has(job.id) ? "fill-current" : ""}`}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(job.apply_url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
      />
    </>
  );
};
