import { supabase } from "../integrations/supabase/client";

// Super aggressive HTML cleaner
const cleanText = (html: string): string => {
  if (!html) return "";
  
  // Create a temporary div (browser's native HTML parser)
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Get plain text - this removes ALL HTML
  let text = temp.textContent || temp.innerText || '';
  
  // Clean up extra spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

const cleanAllJobs = async () => {
  console.log("Starting database cleanup...");
  
  // Get all jobs
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, description");
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`Found ${jobs?.length} jobs`);
  
  let updated = 0;
  
  for (const job of jobs || []) {
    const cleaned = cleanText(job.description);
    
    // Update the database
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ description: cleaned })
      .eq("id", job.id);
    
    if (!updateError) {
      updated++;
      console.log(`✅ Cleaned job ${job.id}`);
    }
  }
  
  console.log(`✅ DONE! Cleaned ${updated} jobs`);
};

// Run it
cleanAllJobs();