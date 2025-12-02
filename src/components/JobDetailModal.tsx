import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, MapPin, Briefcase, Building2, Calendar, Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  scraped_at: string;
  tags: string[];
}

interface ParsedJob {
  type: string;
  title: string;
  location: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
}

interface JobDetailModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isExported?: boolean;
  isStale?: boolean;
  duplicateCount?: number;
}

export const JobDetailModal = ({
  job,
  open,
  onOpenChange,
  isExported,
  isStale,
  duplicateCount,
}: JobDetailModalProps) => {
  const { subscriptionTier, session } = useAuth();
  const [isParsing, setIsParsing] = useState(false);
  const [parsedJob, setParsedJob] = useState<ParsedJob | null>(null);

  if (!job) return null;

  const cleanDescription = job.description?.replace(/<[^>]*>/g, "") || "";
  
  // Parse description sections (basic parsing for non-Pro users)
  const parseDescription = (desc: string) => {
    const sections = {
      overview: "",
      responsibilities: [] as string[],
      qualifications: [] as string[],
      benefits: [] as string[],
    };

    const lines = desc.split(/\n|(?:\. )/);
    let currentSection = "overview";

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const lowerLine = trimmed.toLowerCase();
      if (lowerLine.includes("responsibilit") || lowerLine.includes("duties") || lowerLine.includes("what you'll do")) {
        currentSection = "responsibilities";
      } else if (lowerLine.includes("qualif") || lowerLine.includes("requirement") || lowerLine.includes("what you need")) {
        currentSection = "qualifications";
      } else if (lowerLine.includes("benefit") || lowerLine.includes("perk") || lowerLine.includes("we offer")) {
        currentSection = "benefits";
      } else {
        if (currentSection === "overview") {
          sections.overview += trimmed + " ";
        } else {
          (sections[currentSection as keyof typeof sections] as string[]).push(trimmed);
        }
      }
    });

    return sections;
  };

  const handleAIParse = async () => {
    if (!session?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use AI parsing",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-job-ai", {
        body: {
          description: cleanDescription,
          title: job.title,
          company: job.company,
          location: job.location,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        if (error.message?.includes("403") || error.message?.includes("Pro subscription")) {
          toast({
            title: "Pro subscription required",
            description: "AI parsing is only available for Pro users",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setParsedJob(data);
      toast({
        title: "AI parsing complete",
        description: "Job details have been structured",
      });
    } catch (error: any) {
      console.error("AI parsing error:", error);
      toast({
        title: "Parsing failed",
        description: error.message || "Failed to parse job with AI",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  const baseSections = parseDescription(cleanDescription);
  
  // Use AI-parsed data if available
  const displaySections = parsedJob ? {
    overview: parsedJob.description,
    responsibilities: parsedJob.responsibilities,
    qualifications: parsedJob.qualifications,
    benefits: parsedJob.benefits,
  } : baseSections;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        setParsedJob(null);
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-2xl">{parsedJob?.title || job.title}</DialogTitle>
                <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                  {job.source}
                </Badge>
                {parsedJob && (
                  <Badge variant="outline" className="text-purple-600 border-purple-600 bg-purple-50">
                    AI Parsed
                  </Badge>
                )}
                {isExported && (
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                    Exported
                  </Badge>
                )}
                {isStale && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">
                    Potentially old job
                  </Badge>
                )}
                {duplicateCount && duplicateCount > 0 && (
                  <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50">
                    {duplicateCount} duplicates merged
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {parsedJob?.location || job.location || "Not specified"}
                </span>
                {(parsedJob?.type || job.job_type) && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {parsedJob?.type || job.job_type}
                  </span>
                )}
                {job.posted_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(job.posted_date), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* AI Parse Button - Only for Pro users */}
        {subscriptionTier === "pro" && !parsedJob && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIParse}
              disabled={isParsing}
              className="text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Parse with AI
                </>
              )}
            </Button>
          </div>
        )}

        <Separator className="my-4" />

        <div className="space-y-6">
          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Skills & Tags</h4>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {displaySections.overview && (
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-muted-foreground leading-relaxed">
                {displaySections.overview || "Not specified"}
              </p>
            </div>
          )}

          {/* Responsibilities */}
          {displaySections.responsibilities.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-2">Responsibilities</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {displaySections.responsibilities.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <h4 className="font-semibold mb-2">Responsibilities</h4>
              <p className="text-muted-foreground">Not specified</p>
            </div>
          )}

          {/* Qualifications */}
          {displaySections.qualifications.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-2">Qualifications</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {displaySections.qualifications.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <h4 className="font-semibold mb-2">Qualifications</h4>
              <p className="text-muted-foreground">Not specified</p>
            </div>
          )}

          {/* Benefits */}
          {displaySections.benefits.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-2">Benefits</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {displaySections.benefits.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <h4 className="font-semibold mb-2">Benefits</h4>
              <p className="text-muted-foreground">Not specified</p>
            </div>
          )}

          {/* Raw description if nothing was parsed */}
          {!displaySections.overview && 
           displaySections.responsibilities.length === 0 && 
           displaySections.qualifications.length === 0 && 
           displaySections.benefits.length === 0 && (
            <div>
              <h4 className="font-semibold mb-2">Full Description</h4>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {cleanDescription || "Not specified"}
              </p>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-end">
          <Button asChild>
            <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Apply Now
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
