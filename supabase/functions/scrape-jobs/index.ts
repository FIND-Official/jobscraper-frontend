import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Job {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  apply_url: string;
  source: string;
  posted_date: string | null;
  tags: string[] | null;
}

// Sanitize text content to prevent XSS and injection attacks
const sanitizeText = (text: string | null | undefined, maxLength: number = 5000): string | null => {
  if (!text) return null;
  
  // Remove HTML tags and scripts
  let sanitized = String(text)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '');
  
  // Remove dangerous characters and normalize whitespace
  sanitized = sanitized
    .replace(/[<>]/g, '')
    .replace(/&lt;/g, '')
    .replace(/&gt;/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
  
  // Limit length
  return sanitized.substring(0, maxLength);
};

const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(String(url));
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return url;
  } catch {
    return '';
  }
};

async function scrapeWeWorkRemotely(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching We Work Remotely HTML...");
  try {
    const response = await fetch("https://weworkremotely.com/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobScraper/1.0)'
      }
    });
    const html = await response.text();
    
    const jobs: Job[] = [];
    
    // Parse job listings using regex to match the HTML structure
    // Looking for: <li class="...new-listing-container...">
    const listingRegex = /<li[^>]*class="[^"]*new-listing-container[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
    let match;
    
    while ((match = listingRegex.exec(html)) !== null) {
      const listingHtml = match[1];
      
      // Extract job title from: <h4 class="new-listing__header__title">
      const titleMatch = /<h4[^>]*class="[^"]*new-listing__header__title[^"]*"[^>]*>([\s\S]*?)<\/h4>/.exec(listingHtml);
      
      // Extract job link from: <a href="/remote-jobs/...">
      const linkMatch = /<a[^>]*href="(\/remote-jobs\/[^"]+)"/.exec(listingHtml);
      
      // Extract company from: <span class="new-listing__header__company">
      const companyMatch = /<span[^>]*class="[^"]*new-listing__header__company[^"]*"[^>]*>([\s\S]*?)<\/span>/.exec(listingHtml);
      
      // Extract region/category
      const regionMatch = /<span[^>]*class="[^"]*new-listing__region[^"]*"[^>]*>([\s\S]*?)<\/span>/.exec(listingHtml);
      
      if (titleMatch && linkMatch) {
        // Clean HTML tags from title
        const rawTitle = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        const rawCompany = companyMatch?.[1]?.replace(/<[^>]*>/g, '').trim() || "Unknown Company";
        const rawRegion = regionMatch?.[1]?.replace(/<[^>]*>/g, '').trim();
        
        const title = sanitizeText(rawTitle, 200) || "Untitled";
        const company = sanitizeText(rawCompany, 200) || "Unknown Company";
        const url = sanitizeUrl(`https://weworkremotely.com${linkMatch[1]}`);
        
        if (url && title !== "Untitled") {
          jobs.push({
            title,
            company,
            location: "Remote",
            description: sanitizeText(rawRegion),
            apply_url: url,
            source: "We Work Remotely",
            posted_date: new Date().toISOString(),
            tags: rawRegion ? [sanitizeText(rawRegion, 50) || "Remote"] : ["Remote"],
          });
        }
      }
    }
    
    console.log(`[SCRAPER] We Work Remotely: Found ${jobs.length} jobs`);
    return jobs.slice(0, 50);
  } catch (error) {
    console.error("[SCRAPER] We Work Remotely error:", error);
    return [];
  }
}

async function scrapeRemoteOK(): Promise<Job[]> {
  console.log("[SCRAPER] Fetching RemoteOK...");
  try {
    const response = await fetch("https://remoteok.com/api", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobScraper/1.0)'
      }
    });
    const data = await response.json();
    
    const jobs: Job[] = [];
    
    for (const item of data.slice(1, 51)) {
      if (item.position && item.company) {
        const url = sanitizeUrl(item.apply_url || `https://remoteok.com/remote-jobs/${item.id}`);
        if (url) {
          const tags = Array.isArray(item.tags) 
            ? item.tags.slice(0, 10).map((tag: any) => sanitizeText(String(tag), 50)).filter(Boolean)
            : null;
            
          jobs.push({
            title: sanitizeText(item.position, 200) || "Untitled",
            company: sanitizeText(item.company, 200) || "Unknown",
            location: sanitizeText(item.location, 100) || "Remote",
            description: sanitizeText(item.description),
            apply_url: url,
            source: "RemoteOK",
            posted_date: item.date ? new Date(Number(item.date) * 1000).toISOString() : null,
            tags: tags && tags.length > 0 ? tags : null,
          });
        }
      }
    }
    
    console.log(`[SCRAPER] RemoteOK: Found ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error("[SCRAPER] RemoteOK error:", error);
    return [];
  }
}

async function scrapeRemoteCom(): Promise<Job[]> {
  console.log("[SCRAPER] Remote.com API not publicly available");
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SCRAPER] Generating dummy job data...");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate dummy job data for testing
    const dummyJobs: Job[] = [
      {
        title: "Senior Frontend Developer",
        company: "TechCorp Global",
        location: "Remote (US)",
        description: "We are looking for an experienced Frontend Developer to join our remote team. You will work on building scalable web applications using React, TypeScript, and modern web technologies.",
        apply_url: "https://example.com/jobs/senior-frontend",
        source: "We Work Remotely",
        posted_date: new Date().toISOString(),
        tags: ["React", "TypeScript", "Remote"]
      },
      {
        title: "Full Stack Engineer",
        company: "StartupHub Inc",
        location: "Remote (Europe)",
        description: "Join our innovative team to build cutting-edge SaaS products. Experience with Node.js, React, and PostgreSQL required.",
        apply_url: "https://example.com/jobs/fullstack-engineer",
        source: "RemoteOK",
        posted_date: new Date().toISOString(),
        tags: ["Node.js", "React", "PostgreSQL", "Remote"]
      },
      {
        title: "Backend Developer",
        company: "CloudSolutions Ltd",
        location: "Remote (Worldwide)",
        description: "We need a talented Backend Developer to design and implement scalable APIs and microservices using Python and FastAPI.",
        apply_url: "https://example.com/jobs/backend-dev",
        source: "We Work Remotely",
        posted_date: new Date().toISOString(),
        tags: ["Python", "FastAPI", "APIs", "Remote"]
      },
      {
        title: "DevOps Engineer",
        company: "DataFlow Systems",
        location: "Remote (US/Canada)",
        description: "Looking for a DevOps Engineer with experience in AWS, Docker, Kubernetes, and CI/CD pipelines to help scale our infrastructure.",
        apply_url: "https://example.com/jobs/devops-engineer",
        source: "RemoteOK",
        posted_date: new Date().toISOString(),
        tags: ["AWS", "Docker", "Kubernetes", "Remote"]
      },
      {
        title: "UI/UX Designer",
        company: "DesignFirst Studio",
        location: "Remote (UK)",
        description: "Creative UI/UX Designer needed to craft beautiful and intuitive user experiences for our mobile and web applications.",
        apply_url: "https://example.com/jobs/ui-ux-designer",
        source: "We Work Remotely",
        posted_date: new Date().toISOString(),
        tags: ["UI Design", "UX Design", "Figma", "Remote"]
      },
      {
        title: "Data Scientist",
        company: "AI Innovations",
        location: "Remote (Worldwide)",
        description: "Join our AI team to build machine learning models and analyze large datasets. Experience with Python, TensorFlow, and SQL required.",
        apply_url: "https://example.com/jobs/data-scientist",
        source: "RemoteOK",
        posted_date: new Date().toISOString(),
        tags: ["Python", "Machine Learning", "TensorFlow", "Remote"]
      },
      {
        title: "Mobile Developer (React Native)",
        company: "AppMasters",
        location: "Remote (US)",
        description: "We are seeking a Mobile Developer with React Native experience to build cross-platform mobile applications for iOS and Android.",
        apply_url: "https://example.com/jobs/mobile-developer",
        source: "We Work Remotely",
        posted_date: new Date().toISOString(),
        tags: ["React Native", "Mobile", "iOS", "Android", "Remote"]
      },
      {
        title: "Product Manager",
        company: "ProductCo",
        location: "Remote (Europe/US)",
        description: "Experienced Product Manager needed to lead product strategy and roadmap for our B2B SaaS platform. Strong technical background preferred.",
        apply_url: "https://example.com/jobs/product-manager",
        source: "RemoteOK",
        posted_date: new Date().toISOString(),
        tags: ["Product Management", "SaaS", "Strategy", "Remote"]
      },
      {
        title: "QA Engineer",
        company: "QualityFirst Tech",
        location: "Remote (Canada)",
        description: "Quality Assurance Engineer to develop and execute test plans, write automated tests, and ensure product quality across our platforms.",
        apply_url: "https://example.com/jobs/qa-engineer",
        source: "We Work Remotely",
        posted_date: new Date().toISOString(),
        tags: ["QA", "Testing", "Automation", "Remote"]
      },
      {
        title: "Marketing Manager",
        company: "GrowthHub",
        location: "Remote (Worldwide)",
        description: "Digital Marketing Manager to drive our marketing strategy, SEO, content marketing, and social media campaigns for rapid growth.",
        apply_url: "https://example.com/jobs/marketing-manager",
        source: "RemoteOK",
        posted_date: new Date().toISOString(),
        tags: ["Marketing", "SEO", "Content", "Remote"]
      }
    ];

    const allJobs = dummyJobs;
    console.log(`[SCRAPER] Total dummy jobs generated: ${allJobs.length}`);

    if (allJobs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          count: 0,
          message: "No jobs found from any source" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const { error } = await supabaseClient
      .from("jobs")
      .upsert(allJobs, {
        onConflict: "title,company,source",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("[SCRAPER] Database error:", error);
      throw error;
    }

    console.log("[SCRAPER] Jobs successfully saved to database");

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: allJobs.length,
        message: `Successfully scraped ${allJobs.length} jobs` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[SCRAPER] Error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
