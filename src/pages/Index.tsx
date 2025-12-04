import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JobSearch } from "@/components/JobSearch";
import { JobList } from "@/components/JobList";
import { SavedJobsSidebar } from "@/components/SavedJobsSidebar";

interface ScrapeSession {
  id: string;
  timestamp: string;
  searchQuery: string;
  boards: string[];
  jobCount: number;
}

const Index = () => {
  const [scrapeSessions, setScrapeSessions] = useState<ScrapeSession[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleScrapeComplete = useCallback((result: ScrapeSession) => {
    setScrapeSessions(prev => [result, ...prev].slice(0, 10)); // Keep last 10 sessions
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleClearSessions = useCallback(() => {
    setScrapeSessions([]);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-32 pr-4 lg:pr-80">
        <div className="max-w-5xl">
          <JobSearch onScrapeComplete={handleScrapeComplete} />
          
          <div className="mt-12">
            <JobList 
              scrapeSessions={scrapeSessions} 
              onClearSessions={handleClearSessions}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </main>

      <SavedJobsSidebar />
      <Footer />
    </div>
  );
};

export default Index;
