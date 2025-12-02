import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "./AuthDialog";

export const JobSearch = () => {
  const { user, subscriptionTier } = useAuth();
  const [scraping, setScraping] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(
    new Set(["We Work Remotely"])
  );
  const [scrapeCount, setScrapeCount] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    const count = parseInt(localStorage.getItem("anonymousScrapeCount") || "0");
    setScrapeCount(count);
  }, []);

  const jobBoards = [
    { id: "wwr", name: "We Work Remotely" },
    { id: "remoteok", name: "RemoteOK" },
    { id: "remote", name: "Remote.com" },
    { id: "workingnomads", name: "Working Nomads" },
  ];

  const toggleBoard = (boardName: string) => {
    const newSelected = new Set(selectedBoards);
    if (newSelected.has(boardName)) {
      newSelected.delete(boardName);
    } else {
      // Check board limit for free tier
      if (subscriptionTier === "free" && newSelected.size >= 2) {
        toast({
          title: "Board limit reached",
          description: "Free plan users can select up to 2 boards. Upgrade to Pro for unlimited boards.",
          variant: "destructive",
        });
        return;
      }
      newSelected.add(boardName);
    }
    setSelectedBoards(newSelected);
  };

  const handleScrape = async () => {
    // Check if user is authenticated
    if (!user) {
      // Anonymous user - check scrape limit
      if (scrapeCount >= 2) {
        toast({
          title: "Sign up required",
          description: "You've reached your limit. Sign up to continue scraping jobs!",
          variant: "destructive",
        });
        setShowAuthDialog(true);
        return;
      }
    }

    if (selectedBoards.size === 0) {
      toast({
        title: "Select job boards",
        description: "Please select at least one job board to scrape",
        variant: "destructive",
      });
      return;
    }

    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-jobs");
      
      if (error) throw error;
      
      // Increment anonymous scrape count
      if (!user) {
        const newCount = scrapeCount + 1;
        setScrapeCount(newCount);
        localStorage.setItem("anonymousScrapeCount", newCount.toString());
      }
      
      toast({
        title: "Jobs scraped!",
        description: `Found ${data?.count || 0} remote jobs`,
      });
      
      // Reload the page to show new jobs
      window.location.reload();
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
          Select job boards, use filters and scrape the latest remote opportunities at in one place.
        </p>
        {scrapeCount > 0 && scrapeCount < 2 && (
          <p className="text-xs text-muted-foreground mt-2">
            Anonymous scrapes remaining: {2 - scrapeCount}
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
                <Label htmlFor={board.id} className="cursor-pointer flex-1">
                  {board.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm mb-2 block">Search</Label>
            <Input placeholder="e.g., designer, developer..." className="bg-card" />
          </div>
          <div>
            <Label className="text-sm mb-2 block">Experience Level</Label>
            <Select>
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
          <div>
            <Label className="text-sm mb-2 block">Benefits</Label>
            <Select>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Any Benefits" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Benefits</SelectItem>
                <SelectItem value="health">Health Insurance</SelectItem>
                <SelectItem value="401k">401(k)</SelectItem>
                <SelectItem value="pto">Unlimited PTO</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleScrape}
          disabled={scraping}
          size="lg"
          className="w-full md:w-auto bg-primary hover:bg-primary/90"
        >
          <Search className="h-4 w-4 mr-2" />
          {scraping ? "Scraping..." : "Scrape Jobs"}
        </Button>
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
};