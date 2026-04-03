import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CleanText from "@/components/CleanText";
import DOMPurify from "dompurify";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExternalLink,
  MapPin,
  Briefcase,
  Building2,
  Calendar,
  Sparkles,
  Loader2,
  Lock,
} from "lucide-react";
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

  // HTML CLEANER FUNCTION - NO EXTRA FILES NEEDED

  if (!job) return null;

  const isPro = subscriptionTier === "pro";

  const handleAIParse = async (): Promise<void> => {
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
          description: job.description,
          title: job.title,
          company: job.company,
          location: job.location,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        if (
          error.message?.includes("403") ||
          error.message?.includes("Pro subscription")
        ) {
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

      toast({
        title: "AI parsing complete",
        description: "Job details have been structured",
      });
    } catch (err) {
      const error = err as Error;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-2xl">{job.title}</DialogTitle>
                <Badge
                  variant="secondary"
                  className="bg-primary/20 text-primary border-0"
                >
                  {job.source}
                </Badge>
                {isExported && (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600 bg-green-50"
                  >
                    Exported
                  </Badge>
                )}
                {isStale && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="text-yellow-600 border-yellow-600 bg-yellow-50 cursor-help"
                      >
                        Potentially old job
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Jobs older than 14 days may be closed
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {duplicateCount && duplicateCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-600 bg-blue-50 cursor-help"
                      >
                        {duplicateCount} duplicates merged
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-[200px]">
                        This job was posted on multiple boards. We merged them
                        to avoid showing duplicates.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location || "Not specified"}
                </span>
                {job.job_type && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {job.job_type}
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

        {/* AI Parse Button */}
        <div className="flex justify-end">
          {isPro ? (
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
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="text-muted-foreground border-muted-foreground/30 cursor-not-allowed"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Parse with AI
                  <Badge
                    variant="secondary"
                    className="ml-2 text-[10px] px-1.5 py-0"
                  >
                    PRO
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Upgrade to Pro to use AI-powered job parsing
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

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

          {/* Description - CLEAN HTML */}
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              <CleanText html={job.description} />
            </div>
          </div>
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
