import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JobSearch } from "@/components/JobSearch";
import { JobList } from "@/components/JobList";
import { SavedJobsSidebar } from "@/components/SavedJobsSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ScrapeSession {
  id: string;
  timestamp: string;
  searchQuery: string;
  boards: string[];
  jobCount: number;
}

const Index = () => {
  const { checkSubscription, user } = useAuth();
  const [scrapeSessions, setScrapeSessions] = useState<ScrapeSession[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle Stripe redirect with success param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true' && user) {
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      
      // Check subscription immediately and after a delay
      checkSubscription();
      setTimeout(() => checkSubscription(), 2000);
      setTimeout(() => checkSubscription(), 5000);
      
      toast({
        title: "Welcome to Pro!",
        description: "Your subscription is being activated. Features will be available shortly.",
      });
    }
    
    if (canceled === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      toast({
        title: "Checkout canceled",
        description: "No charges were made.",
        variant: "destructive",
      });
    }
  }, [user, checkSubscription]);

  const handleScrapeComplete = useCallback((result: ScrapeSession) => {
    setScrapeSessions(prev => [result, ...prev].slice(0, 10));
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
