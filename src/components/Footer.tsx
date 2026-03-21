import { Link } from "react-router-dom";
import { useState } from "react";
import { ContactDialog } from "./ContactDialog";

export const Footer = () => {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <footer className="bg-black text-white border-t border-gray-800 mt-0 py-10">
        <div className="container mx-auto px-9">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">

              <div className="text-sm text-gray-400 text-center md:text-left">
                <div className="font-semibold text-foreground mb-1">
                  JobScraper
                </div>
                <div>© 2025 JobScraper. All rights reserved.</div>
              </div>

              <div className="hidden md:block h-10 w-px bg-border" />

              <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-3 text-sm">
                <a
                  href="https://www.trustpilot.com/review/wefind.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Leave a Review
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
                  Feedback
                </a>

                <Link
                  to="/privacy"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy
                </Link>

                <Link
                  to="/terms"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Terms
                </Link>
              </div>

            </div>
          </div>
        </div>
      </footer>

      <ContactDialog open={showContact} onOpenChange={setShowContact} />
    </>
  );
};

