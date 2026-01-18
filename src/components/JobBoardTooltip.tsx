import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface JobBoardInfo {
  id: string;
  name: string;
  description: string;
}

const jobBoardDescriptions: Record<string, string> = {
  "We Work Remotely": "Popular for tech, marketing, and admin roles. One of the largest remote job boards.",
  "RemoteOK": "Tech-focused board with strong developer and startup jobs. Fast-growing community.",
  "Remote.com": "Enterprise-focused remote jobs with verified companies. Great for experienced professionals.",
  "Working Nomads": "Curated remote jobs for digital nomads. Strong in design, marketing, and customer support.",
};

interface JobBoardTooltipProps {
  boardName: string;
}

export const JobBoardTooltip = ({ boardName }: JobBoardTooltipProps) => {
  const description = jobBoardDescriptions[boardName] || "Remote job board";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-center">
        <p className="text-xs">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
};
