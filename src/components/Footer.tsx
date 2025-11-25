import { useState } from "react";
import { ContactDialog } from "./ContactDialog";

export const Footer = () => {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <div className="font-semibold text-foreground mb-1">JobScraper</div>
              <div>© 2025 JobScraper. All rights reserved.</div>
            </div>
            
            <div className="flex gap-6 text-sm">
              <a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">
                Pricing
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
              <a href="#privacy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy
              </a>
              <a href="#terms" className="text-muted-foreground hover:text-primary transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>

      <ContactDialog open={showContact} onOpenChange={setShowContact} />
    </>
  );
};