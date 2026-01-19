import { Twitter, Linkedin, LogIn } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "./AuthDialog";
import { ProfileDropdown } from "./ProfileDropdown";
import { PricingDialog } from "./PricingDialog";

export const Header = () => {
  const { user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
   <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      
      {/* Left section: logo + pricing */}
      <div className="flex items-center gap-4 sm:gap-6">
        <a
          href="https://find-jobscraper.vercel.app/"
          className="text-xl sm:text-2xl font-bold hover:opacity-80 transition-opacity"
        >
          Job<span className="text-primary">Scraper</span>
        </a>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPricingOpen(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          Pricing
        </Button>
      </div>

      {/* Right section: social + auth */}
      <div className="flex items-center gap-2 sm:gap-4">
        <a
          href="https://x.com/_findservices"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
        </a>
        <a
          href="https://www.linkedin.com/company/find-services/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
        </a>

        {user ? (
          <ProfileDropdown />
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAuthDialogOpen(true)}
            className="gap-2 px-3 sm:px-4 py-1 sm:py-2"
          >
            <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        )}
      </div>
    </div>

    {/* Dialogs */}
    <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
  </header>

  );
};
