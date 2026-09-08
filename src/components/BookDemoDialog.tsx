import React, { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "cal-inline": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { calLink: string; namespace?: string },
        HTMLElement
      >;
    }
  }
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CalendarClock } from "lucide-react";

const CAL_LINK = "find-jobscraper/demo";

interface BookDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Book a Demo popup powered by the official @calcom/embed-react <Cal> inline
 * embed. The component handles loading the Cal.com embed script itself, so
 * no manual script management is needed.
 */
export const BookDemoDialog = ({ open, onOpenChange }: BookDemoDialogProps) => {
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getCalApi({ namespace: "book-a-demo" })
      .then((cal) => {
        if (cancelled) return;
        cal("ui", {
          theme: "light",
          styles: { branding: { brandColor: "#000000" } },
          hideEventTypeDetails: false,
          layout: "month_view",
        });
      })
      .catch((err) => {
        // Cal.com may fail to load behind ad blockers / offline — the popup
        // should still close gracefully rather than break the page.
        console.warn("Cal.com embed failed to initialise", err);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Book a Demo
          </DialogTitle>
          <DialogDescription>
            Pick a time that works for you and our team will walk you through
            how FIND can put your roles in front of top remote talent.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <Cal
            namespace="book-a-demo"
            calLink={CAL_LINK}
            style={{ width: "100%", height: "100%", minWidth: "320px", minHeight: "500px" }}
            config={{ layout: "month_view", theme: "light" }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
