import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Search, Bookmark, Download, Sparkles } from "lucide-react";

interface OnboardingTourProps {
  onComplete: () => void;
}

const slides = [
  {
    title: "Welcome to JobScraper! 🎉",
    description: "Discover remote jobs from multiple job boards in one place. Let us show you how it works.",
    icon: Search,
  },
  {
    title: "Select Job Boards",
    description: "Choose from popular remote job boards like We Work Remotely, RemoteOK, and more. Free users can select up to 2 boards, Pro users get 4.",
    icon: Search,
  },
  {
    title: "Save Your Favorites",
    description: "Found a job you love? Click the bookmark icon to save it. All your saved jobs appear in the sidebar on the right.",
    icon: Bookmark,
  },
  {
    title: "Export to CSV",
    description: "Export your saved jobs to a CSV file for tracking in spreadsheets. Free users get 50 exports/month.",
    icon: Download,
  },
  {
    title: "Pro Features",
    description: "Upgrade to Pro for AI-powered job parsing, more job boards, unlimited exports, and priority support.",
    icon: Sparkles,
  },
];

export const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("onboardingCompleted", "true");
    onComplete();
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={handleComplete}
      />
      
      {/* Modal */}
      <div className="relative z-10 bg-card border border-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
              <CurrentIcon className="h-8 w-8" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              How It Works
            </p>
            <h2 className="text-2xl font-bold mb-3">
              {slides[currentSlide].title}
            </h2>
            <p className="text-muted-foreground">
              {slides[currentSlide].description}
            </p>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
            >
              {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
              {currentSlide < slides.length - 1 && (
                <ChevronRight className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>

          {/* Skip button */}
          <button
            onClick={handleComplete}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
        </div>
      </div>
    </div>
  );
};
