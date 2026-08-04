import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

const Partnership = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Partner with Us — FIND JobScraper"
        description="Partner with FIND to reach qualified candidates and grow your employer brand."
        path="/partnership"
      />
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-32">
        <section className="max-w-4xl mx-auto text-center pt-16 md:pt-24">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Reach Top Remote Talent
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Partner with FIND to showcase your job openings to thousands of
            qualified candidates actively seeking remote opportunities across
            multiple trusted job boards.
          </p>
          <Button size="lg" className="px-8" asChild>
            <a href="https://forms.gle/tEWwQv6YcmtmTKqB9" target="_blank" rel="noopener noreferrer">Post Your Jobs</a>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Partnership;