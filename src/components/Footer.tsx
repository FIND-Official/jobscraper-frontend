import { Link } from "react-router-dom";
import { useState } from "react";
import { ContactDialog } from "./ContactDialog";

export const Footer = () => {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 lg:pr-80">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <div className="font-semibold text-foreground mb-1">JobScraper</div>
              <div>© 2025 JobScraper. All rights reserved.</div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
              <a
                href="https://www.trustpilot.com/review/wefind.space"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Leave Us A Review
              </a>
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
                href="https://find.canny.io/improve-jobscraper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Give Feedback
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
    </>
  );
};
