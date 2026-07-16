import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {supabase} from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";



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

interface SavedJobsContextType {
    savedJobs: SavedJob[];
    savedJobIds : Set<string>;
    loading: boolean;
    refreshSavedJobs: () => Promise<void>;
    saveJob: (jobId: string) => Promise<void>;
    unsaveJob: (jobId: string) => Promise<void>;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);
export const SavedJobsProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
    const [loading, setLoading] = useState(true)

    const refreshSavedJobs = async () =>{
        if (!user) {
            setSavedJobs([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from("saved_jobs")
            .select("id, job_id, saved_at, jobs(title, company, location, apply_url)")
            .eq("user_id", user.id)
            .order("saved_at", { ascending: false });

        if (!error && data) setSavedJobs(data);
        setLoading(false);
    };

    useEffect(() => {
        refreshSavedJobs();
    }, [user?.id]);

    useEffect(() => {
        if (!user) return
        const channel = supabase
            .channel("saved-jobs")
            .on(
                "postgres_changes",
                {event: "*", schema: "public", table: "saved_jobs", filter: `user_id=eq.${user.id}`},
                () => {
                    refreshSavedJobs();
                }
            )
            .subscribe();
            return () => supabase.removeChannel(channel)
    }, [user?.id]);

    const savedJobIds = useMemo(
        () => new Set(savedJobs.map((job) => job.job_id)),
        [savedJobs]
    );

    const saveJob = async (jobId: string) => {
        if (!user) return;
        const { error } = await supabase
            .from("saved_jobs")
            .insert({ job_id: jobId, user_id: user.id });
        if (error) throw error;
        await refreshSavedJobs();
    };

    const unsaveJob = async (jobId: string) => {
        if (!user) return;
        const { error } = await supabase
            .from("saved_jobs")
            .delete()
            .eq("job_id", jobId)
            .eq("user_id", user.id);
        if (error) throw error;
        await refreshSavedJobs();
    };

    return (
        <SavedJobsContext.Provider value={{ savedJobs, savedJobIds, loading, refreshSavedJobs, saveJob, unsaveJob }}>
            {children}
        </SavedJobsContext.Provider>
    );
}

export const useSavedJobs = () => {
    const context = useContext(SavedJobsContext);
    if (context === undefined) {
        throw new Error("useSavedJobs must be used within a SavedJobsProvider");
    }
    return context;
};