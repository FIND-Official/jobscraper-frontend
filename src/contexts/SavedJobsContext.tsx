import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface SavedJob {
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

interface SavedJobsContextType {
  savedJobs: SavedJob[];
  savedJobIds: Set<string>;
  loading: boolean;
  refreshSavedJobs: () => Promise<void>;
  saveJob: (
    jobId: string,
    jobDetails?: {
      title: string;
      company: string;
      location: string;
      apply_url: string;
    },
  ) => Promise<void>;
  unsaveJob: (jobId: string) => Promise<void>;
  removeSavedJobById: (savedJobId: string) => Promise<void>;
  removeSavedJobsByIds: (savedJobIds: string[]) => Promise<void>;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);

export const SavedJobsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSavedJobs = useCallback(async (opts?: { showLoading?: boolean }) => {
    if (!user) {
      setSavedJobs([]);
      setLoading(false);
      return;
    }

    if (opts?.showLoading) setLoading(true);

    const { data, error } = await supabase
      .from("saved_jobs")
      .select("id, job_id, saved_at, jobs(title, company, location, apply_url)")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (!error && data) {
      setSavedJobs(data as SavedJob[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refreshSavedJobs({ showLoading: true });
  }, [refreshSavedJobs]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`saved-jobs-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "saved_jobs",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void refreshSavedJobs();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refreshSavedJobs]);

  const savedJobIds = useMemo(
    () => new Set(savedJobs.map((job) => job.job_id)),
    [savedJobs],
  );

  const saveJob = async (
    jobId: string,
    jobDetails?: {
      title: string;
      company: string;
      location: string;
      apply_url: string;
    },
  ) => {
    if (!user) return;
    if (savedJobIds.has(jobId)) return;

    const tempId = `temp-${jobId}`;
    const previous = savedJobs;

    if (jobDetails) {
      setSavedJobs((prev) => {
        if (prev.some((job) => job.job_id === jobId)) return prev;
        return [
          {
            id: tempId,
            job_id: jobId,
            saved_at: new Date().toISOString(),
            jobs: jobDetails,
          },
          ...prev,
        ];
      });
    }

    const { data, error } = await supabase
      .from("saved_jobs")
      .insert({ job_id: jobId, user_id: user.id })
      .select("id, job_id, saved_at, jobs(title, company, location, apply_url)")
      .single();

    if (error) {
      setSavedJobs(previous);
      throw error;
    }

    if (data) {
      setSavedJobs((prev) => [
        data as SavedJob,
        ...prev.filter((job) => job.job_id !== jobId),
      ]);
    }
  };

  const unsaveJob = async (jobId: string) => {
    if (!user) return;

    const previous = savedJobs;
    setSavedJobs((prev) => prev.filter((job) => job.job_id !== jobId));

    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", jobId)
      .eq("user_id", user.id);

    if (error) {
      setSavedJobs(previous);
      throw error;
    }
  };

  const removeSavedJobById = async (savedJobId: string) => {
    if (!user) return;

    const previous = savedJobs;
    setSavedJobs((prev) => prev.filter((job) => job.id !== savedJobId));

    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("id", savedJobId)
      .eq("user_id", user.id);

    if (error) {
      setSavedJobs(previous);
      throw error;
    }
  };

  const removeSavedJobsByIds = async (ids: string[]) => {
    if (!user || ids.length === 0) return;

    const idSet = new Set(ids);
    const previous = savedJobs;
    setSavedJobs((prev) => prev.filter((job) => !idSet.has(job.id)));

    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    if (error) {
      setSavedJobs(previous);
      throw error;
    }
  };

  return (
    <SavedJobsContext.Provider
      value={{
        savedJobs,
        savedJobIds,
        loading,
        refreshSavedJobs: () => refreshSavedJobs(),
        saveJob,
        unsaveJob,
        removeSavedJobById,
        removeSavedJobsByIds,
      }}
    >
      {children}
    </SavedJobsContext.Provider>
  );
};

export const useSavedJobs = () => {
  const context = useContext(SavedJobsContext);
  if (context === undefined) {
    throw new Error("useSavedJobs must be used within a SavedJobsProvider");
  }
  return context;
};
