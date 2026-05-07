import {  LogIn } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ProfileDropdown } from "./ProfileDropdown";
import { PricingDialog } from "./PricingDialog";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { user } = useAuth();
  const [pricingOpen, setPricingOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left section */}
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="/"
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

        {/* Right section */}
         <div className="flex items-center">
          {user ? (
            <ProfileDropdown />
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
              className="gap-2 px-3 sm:px-4 py-1 sm:py-2"
            >
              <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>

      <PricingDialog open={pricingOpen} onOpenChange={setPricingOpen} />
    </header>
  );
};
