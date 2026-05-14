import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { JobBoardTooltip } from "./JobBoardTooltip";
import { SavedSearchTags } from "./SavedSearchTags";

interface ScrapeResult {
  id: string;
  timestamp: string;
  searchQuery: string;
  boards: string[];
  jobCount: number;
}

interface JobSearchProps {
  onScrapeComplete?: (result: ScrapeResult) => void;
}

const MAX_SAVED_SEARCHES = 5;
const ANONYMOUS_SCRAPE_LIMIT = 2;

const getAnonymousId = () => {
  let id = localStorage.getItem("anonymous_id");

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("anonymous_id", id);
  }

  return id;
};

export const JobSearch = ({ onScrapeComplete }: JobSearchProps) => {
  const { user, session, subscriptionTier } = useAuth();
  const [scraping, setScraping] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(
    new Set(["We Work Remotely"])
  );
  const [scrapeCount, setScrapeCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("any");
  const [savedSearches, setSavedSearches] = useState<string[]>([]);

  const isPro = subscriptionTier === "pro";
  const maxBoards = isPro ? 4 : 2;

  const jobBoards = [
    { id: "wwr", name: "We Work Remotely" },
    { id: "remoteok", name: "RemoteOK" },
    { id: "remote", name: "Remote.com" },
    { id: "workingnomads", name: "Working Nomads" },
  ];

  const navigate = useNavigate();

  const toggleBoard = (boardName: string) => {
    const newSelected = new Set(selectedBoards);
    if (newSelected.has(boardName)) {
      newSelected.delete(boardName);
    } else {
      if (newSelected.size >= maxBoards) {
        toast({
          title: "Board limit reached",
          description: isPro
            ? "Pro plan users can select up to 4 boards."
            : "Free plan users can select up to 2 boards. Upgrade to Pro for up to 4 boards.",
          variant: "destructive",
        });
        return;
      }
      newSelected.add(boardName);
    }
    setSelectedBoards(newSelected);
  };

  const saveSearch = (query: string) => {
    if (!query.trim()) return;

    const normalizedQuery = query.trim();
    if (savedSearches.includes(normalizedQuery)) return;

    const newSearches = [normalizedQuery, ...savedSearches].slice(0, MAX_SAVED_SEARCHES);
    setSavedSearches(newSearches);
  };

  const removeSearch = (search: string) => {
    const newSearches = savedSearches.filter((s) => s !== search);
    setSavedSearches(newSearches);
  };

  const selectSearch = (search: string) => {
    setSearchQuery(search);
  };

  const handleScrape = async () => {
    if (selectedBoards.size === 0) {
      toast({
        title: "Select job boards",
        description: "Please select at least one job board to scrape",
        variant: "destructive",
      });
      return;
    }

    // Save the search query if it's not empty
    if (searchQuery.trim()) {
      saveSearch(searchQuery.trim());
    }

    setScraping(true);
    try {
      const boardsArray = Array.from(selectedBoards);

      // Include auth header if user is logged in
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke("scrape-jobs", {
        headers,
        body: {
          anonymousId: getAnonymousId(),
          boards: boardsArray,
          searchQuery: searchQuery.trim() || undefined,
          experienceLevel: experienceLevel !== "any" ? experienceLevel : undefined,
        },
      });

      if (error) {
        const context = error.context ? await error.context.json().catch(() => null) : null;

        if (context?.code === "ANONYMOUS_LIMIT_REACHED") {
          toast({
            title: "Sign up required",
            description: context.error || "You've reached your anonymous scrape limit. Sign up to continue.",
            variant: "destructive",
          });

          navigate("/auth");

          setScrapeCount(context.anonymousScrapeCount ?? ANONYMOUS_SCRAPE_LIMIT);

          return;
        }

        if (context?.code === "BOARD_LIMIT_EXCEEDED") {
          toast({
            title: "Board limit exceeded",
            description: context.error,
            variant: "destructive",
          });
          return;
        }

        throw error;
      }

      console.log("Scrape data:", data);

      if (!user && data?.anonymousScrapeCount !== undefined) {
        setScrapeCount(data.anonymousScrapeCount);
      }

      const scrapeResult: ScrapeResult = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        searchQuery: searchQuery.trim() || "All Jobs",
        boards: boardsArray,
        jobCount: data?.count || 0,
      };

      toast({
        title: "Jobs scraped!",
        description: `Found ${data?.count || 0} remote jobs from ${boardsArray.length} board(s)`,
      });

      onScrapeComplete?.(scrapeResult);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to scrape jobs",
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Find Remote Jobs
        </h1>
        <p className="text-muted-foreground">
          Select job boards, use filters and scrape the latest remote opportunities in one place.
        </p>
        {!user && (
          <p className="text-xs text-muted-foreground mt-2">
            Anonymous scrapes remaining: {Math.max(0, ANONYMOUS_SCRAPE_LIMIT - scrapeCount)}
          </p>
        )}
        {user && (
          <p className="text-xs text-muted-foreground mt-2">
            {isPro ? "Pro: Up to 4 boards" : "Free: Up to 2 boards (Upgrade for more)"}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-3 block">Job Boards</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {jobBoards.map((board) => (
              <div
                key={board.id}
                className="flex items-center space-x-2 bg-card border border-border rounded-lg p-3 hover:border-primary transition-colors"
              >
                <Checkbox
                  id={board.id}
                  checked={selectedBoards.has(board.name)}
                  onCheckedChange={() => toggleBoard(board.name)}
                />
                <Label htmlFor={board.id} className="cursor-pointer flex-1 text-sm">
                  {board.name}
                </Label>
                <JobBoardTooltip boardName={board.name} />
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm mb-2 block">Search</Label>
            <Input
              placeholder="e.g., designer, developer..."
              className="bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleScrape();
                }
              }}
            />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Experience Level</Label>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Any Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Level</SelectItem>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SavedSearchTags
          savedSearches={savedSearches}
          onRemove={removeSearch}
          onSelect={selectSearch}
        />

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleScrape}
            disabled={scraping}
            size="lg"
            className="w-full md:w-1/4 bg-primary hover:bg-primary/90"
          >
            {scraping ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {scraping ? "Scraping jobs..." : "Scrape Jobs"}
          </Button>
          {scraping && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Fetching listings from {Array.from(selectedBoards).join(", ")}…
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
