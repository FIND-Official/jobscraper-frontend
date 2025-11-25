import { useEffect, useState } from "react";
import { Bookmark, ExternalLink, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "./AuthDialog";
import { toast } from "@/hooks/use-toast";

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
  tags: string[];
}

export const JobList = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetchJobs();
    if (user) {
      fetchSavedJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("scraped_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setJobs(data || []);
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

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>;
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            Results <span className="text-primary">{jobs.length}</span>
          </h2>
          <Select value="relevance">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Sort by: Relevance</SelectItem>
              <SelectItem value="date">Sort by: Date</SelectItem>
              <SelectItem value="company">Sort by: Company</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground">No jobs found. Click "Scrape Jobs" to get started!</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{job.title}</h3>
                      <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                        {job.source}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="font-medium text-foreground">{job.company}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {job.job_type}
                      </span>
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

                  <div className="flex flex-col gap-2">
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
            ))
          )}
        </div>

        {jobs.length > 0 && (
          <div className="text-center pt-4">
            <Button variant="outline">Load More Results</Button>
          </div>
        )}
      </div>

      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
};

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";