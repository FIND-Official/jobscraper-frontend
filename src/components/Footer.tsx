import { Link } from "react-router-dom";
import { useState } from "react";
import { ContactDialog } from "./ContactDialog";
import { Twitter, Linkedin } from "lucide-react";

export const Footer = () => {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <footer className="bg-black text-white border-t border-gray-800 mt-0 py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col items-center justify-between gap-6 md:flex-row md:items-start">
            <div className="flex w-full flex-col items-center justify-between gap-6 md:flex-row md:items-start">

              <div className="text-sm text-gray-400 text-center md:text-left">
                <div className="font-semibold text-foreground mb-1">
                  JobScraper
                </div>
                <div>© 2026 JobScraper. All rights reserved.</div>
              </div>
              
{/* Social Media Icons */}
<div className="flex items-center gap-4">
  <a
    href="https://x.com/_findservices"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Twitter"
    className="text-muted-foreground hover:text-primary transition-colors"
  >
    <Twitter className="h-5 w-5" />
  </a>

  <a
    href="https://www.linkedin.com/company/find-services/"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="LinkedIn"
    className="text-muted-foreground hover:text-primary transition-colors"
  >
    <Linkedin className="h-5 w-5" />
  </a>
</div>

              <div className="hidden md:block h-10 w-px bg-border" />

              <div className="flex flex-wrap justify-center gap-x-4 gap-y-3 text-sm md:flex-nowrap md:justify-start lg:gap-x-6">
                <a
                  href="https://www.trustpilot.com/review/wefind.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-muted-foreground hover:text-primary transition-colors"
                >
                  Leave a Review
                </a>

                <a
                  href="https://forms.gle/tEWwQv6YcmtmTKqB9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-muted-foreground hover:text-primary transition-colors"
                >
                  Partner with us
                </a>

                <button
                  onClick={() => setShowContact(true)}
                  className="whitespace-nowrap text-muted-foreground hover:text-primary transition-colors"
                >
                  Help
                </button>

                <a
                  href="https://find.canny.io/improve-jobscraper"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-muted-foreground hover:text-primary transition-colors"
                >
                  Feedback
                </a>

                <Link
                  to="/privacy"
                  className="whitespace-nowrap text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy
                </Link>

                <Link
                  to="/terms"
                  className="whitespace-nowrap text-muted-foreground hover:text-primary transition-colors"
                >
                  Term
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

