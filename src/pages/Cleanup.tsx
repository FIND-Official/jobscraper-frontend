import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const Cleanup = () => {
  const [status, setStatus] = useState("Ready");
  const [isRunning, setIsRunning] = useState(false);

  const refreshWeWorkRemotely = async () => {
    setIsRunning(true);
    setStatus("Refreshing We Work Remotely jobs from source...");

    const { data, error } = await supabase.functions.invoke("scrape-jobs", {
      body: { boards: ["We Work Remotely"] },
    });

    if (error) {
      setStatus(`Error: ${error.message}`);
      setIsRunning(false);
      return;
    }

    setStatus(`Complete. Refreshed ${data?.count || 0} We Work Remotely jobs.`);
    setIsRunning(false);
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <SEO
        title="Job Description Repair Tool — FIND JobScraper"
        description="Refresh and repair job descriptions for We Work Remotely jobs in FIND JobScraper."
        path="/cleanup"
      />
      <h1 className="mb-4 text-2xl font-bold">Job Description Repair</h1>

      <p className="mb-4 text-muted-foreground">
        The old cleanup tool stripped HTML from descriptions and could damage
        We Work Remotely jobs. This page now refreshes those jobs from the
        scraper instead.
      </p>

      <div className="mb-4 rounded border border-border bg-card p-4">
        Status: <strong>{status}</strong>
      </div>

      <Button onClick={refreshWeWorkRemotely} disabled={isRunning}>
        <RefreshCw className={`mr-2 h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
        {isRunning ? "Refreshing..." : "Refresh We Work Remotely"}
      </Button>
    </div>
  );
};

export default Cleanup;
