import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Cleanup = () => {
  const [status, setStatus] = useState("Ready");
  const [cleaned, setCleaned] = useState(0);
  const [total, setTotal] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const runCleanup = async () => {
    setIsRunning(true);
    setStatus("Fetching jobs...");

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, description");

    if (error) {
      setStatus(`Error: ${error.message}`);
      setIsRunning(false);
      return;
    }

    setTotal(jobs?.length || 0);
    setStatus(`Cleaning ${jobs?.length} jobs...`);

    let updated = 0;

    for (const job of jobs || []) {
      let cleaned = job.description || "";

      // ✅ 1. Remove images only
      cleaned = cleaned.replace(/<img[^>]*>/gi, "");

      // ✅ 2. Preserve structure BEFORE removing tags
      cleaned = cleaned.replace(/<\/p>/gi, "\n\n");
      cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");
      cleaned = cleaned.replace(/<\/li>/gi, "\n");
      cleaned = cleaned.replace(/<li>/gi, "• ");

      // ✅ 3. Fix broken URLs
      cleaned = cleaned.replace(/https?:\/{1,}/g, "https://");
      cleaned = cleaned.replace(/https:\s+/g, "https://");
      cleaned = cleaned.replace(/http:\s+/g, "http://");

      // ✅ 4. Remove ALL HTML tags AFTER structure is preserved
      cleaned = cleaned.replace(/<[^>]*>/g, "");

      // ✅ 5. Decode HTML entities
      cleaned = cleaned
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");

      // ✅ 6. Clean spacing but KEEP line breaks
      cleaned = cleaned
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();

      // ✅ Update database
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ description: cleaned })
        .eq("id", job.id);

      if (!updateError) {
        updated++;
        setCleaned(updated);
        setStatus(`Cleaned ${updated} of ${jobs?.length} jobs...`);
      }
    }

    setStatus(`✅ COMPLETE! Cleaned ${updated} jobs. Refresh the page!`);
    setIsRunning(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Database Cleanup Tool</h1>

      <p className="mb-4 text-muted-foreground">
        This will clean job descriptions and preserve formatting (paragraphs,
        bullets, links).
      </p>

      <div className="bg-yellow-100 border border-yellow-400 p-4 mb-4 rounded">
        <strong>⚠️ Run this ONLY ONCE after fixing backend!</strong>
      </div>

      <div className="mb-4">
        <p>
          Status: <strong>{status}</strong>
        </p>
        {total > 0 && (
          <p>
            Progress: {cleaned} / {total}
          </p>
        )}
      </div>

      <Button onClick={runCleanup} disabled={isRunning}>
        {isRunning ? "Running..." : "Start Cleanup"}
      </Button>
    </div>
  );
};

export default Cleanup;
