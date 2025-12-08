import { useState } from "react";
import { Link } from "react-router-dom";
import { ContactDialog } from "./ContactDialog";
import { PricingDialog } from "./PricingDialog";

export const Footer = () => {
  const [showContact, setShowContact] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  return (
    <>
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 lg:pr-80">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <div className="font-semibold text-foreground mb-1">JobScraper</div>
              <div>© 2025 JobScraper. All rights reserved.</div>
            </div>
            
            <div className="flex gap-6 text-sm">
              <button
                onClick={() => setShowPricing(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Pricing
              </button>
              <a
                href="https://forms.gle/tEWwQv6YcmtmTKqB9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Partner with us
              </a>
              <button
                onClick={() => setShowContact(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Help
              </button>
              <a
                href="https://find.canny.io/help-us-improve"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Feedback
              </a>
              <Link to="/terms-and-privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link to="/terms-and-privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <ContactDialog open={showContact} onOpenChange={setShowContact} />
      <PricingDialog open={showPricing} onOpenChange={setShowPricing} />
    </>
  );
};
