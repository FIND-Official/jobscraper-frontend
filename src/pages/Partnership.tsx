import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ContactDialog } from "@/components/ContactDialog";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Globe,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Search,
  Briefcase,
  BarChart3,
  ArrowRight,
  MapPin,
  Clock,
  Building2,
  Mail,
} from "lucide-react";

const Partnership = () => {
  const [contactOpen, setContactOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Partner with Us — FIND JobScraper"
        description="Partner with FIND to showcase your job openings to thousands of qualified remote candidates across multiple trusted job boards."
        path="/partnership"
      />
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-32 scroll-smooth">
        {/* ============ HERO ============ */}
        <section className="max-w-4xl mx-auto text-center pt-16 md:pt-24">
          <Badge
            variant="outline"
            className="mb-6 px-4 py-1.5 text-sm text-primary border-primary/40"
          >
            For Employers & Recruiters
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Reach Top Remote Talent{" "}
            <span className="text-primary">Faster</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Partner with FIND to showcase your job openings to thousands of
            qualified candidates actively seeking remote opportunities across
            multiple trusted job boards.
          </p>
          <div className="flex items-center justify-center">
            {/* Commented out per coordinator requirements:
            <Button size="lg" className="px-8 w-full sm:w-auto" asChild>
              <Link to="/company/auth?mode=signup">
                Partner with us
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            */}
            <Button
              size="lg"
              variant="outline"
              className="px-8 w-full sm:w-auto"
              asChild
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          {/* Hero product preview — mock job card */}
          <div className="mt-16 max-w-2xl mx-auto">
            <Card className="text-left shadow-[var(--shadow-glow)] border-border/60">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Posted 2 hours ago
                      </span>
                    </div>
                    <div className="text-xl font-semibold">
                      Senior Frontend Engineer
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Acme Inc.
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        Remote
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        Full-time
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-0">
                    We Work Remotely
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  We're looking for a passionate frontend engineer to help
                  build the next generation of remote collaboration tools...
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["React", "TypeScript", "Tailwind", "Remote"].map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span>128 applicants</span>
                  </div>
                  <Button size="sm" disabled>
                    Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ============ TRUSTED BY STRIP (Commented out placeholder social proof) ============ */}
        {/*
        <section className="mt-20">
          <p className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-6">
            Trusted by hiring teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground">
            {["Acme Inc.", "Globex", "Initech", "Umbrella Corp", "Stark Labs"].map(
              (company) => (
                <span
                  key={company}
                  className="text-lg font-semibold opacity-60 hover:opacity-100 transition-opacity"
                >
                  {company}
                </span>
              ),
            )}
          </div>
        </section>
        */}

        {/* ============ VALUE PROPOSITION (Commented out per coordinator feedback) ============ */}
        {/*
        <section className="mt-24 md:mt-32">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Jobs. Our Audience.
            </h2>
            <p className="text-lg text-muted-foreground">
              We aggregate remote job listings from the most trusted boards and
              deliver them to a highly engaged audience of job seekers — so
              your openings get the visibility they deserve.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: "10k+", label: "Active job seekers" },
              { icon: Globe, value: "4+", label: "Trusted job boards" },
              { icon: TrendingUp, value: "50k+", label: "Jobs aggregated" },
              { icon: Zap, value: "Daily", label: "Fresh listings" },
            ].map((stat) => (
              <Card key={stat.label} className="text-center hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        */}

        {/* ============ WHY PARTNER / EMPLOYER BENEFITS (Commented out per coordinator feedback) ============ */}
        {/*
        <section className="mt-24 md:mt-32 -mx-4 sm:-mx-6 lg:-mx-8 bg-card border-y border-border py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center mb-12 px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Partner with FIND
            </h2>
            <p className="text-lg text-muted-foreground">
              We make it effortless to get your roles in front of the right
              people — without the noise of traditional job boards.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8">
            {[
              {
                icon: Search,
                title: "Qualified Candidates",
                description:
                  "Reach job seekers who are actively searching for remote roles and have already filtered for the skills you need.",
              },
              {
                icon: Globe,
                title: "Global Reach",
                description:
                  "Your openings are seen by a diverse, international talent pool across multiple time zones and regions.",
              },
              {
                icon: TrendingUp,
                title: "Higher Visibility",
                description:
                  "Stand out from the crowd with dedicated placement across our aggregated boards and search results.",
              },
              {
                icon: Zap,
                title: "Fast Turnaround",
                description:
                  "Get your roles live quickly and start receiving applications from qualified candidates in record time.",
              },
              {
                icon: Shield,
                title: "Trusted Platform",
                description:
                  "Partner with a platform that job seekers trust to surface only legitimate, high-quality remote opportunities.",
              },
              {
                icon: BarChart3,
                title: "Actionable Insights",
                description:
                  "Understand how your listings perform and refine your hiring strategy with clear, data-driven feedback.",
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="bg-background hover:border-primary transition-colors"
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
        */}

        {/* ============ HOW IT WORKS ============ */}
        <section id="how-it-works" className="mt-24 md:mt-32 scroll-mt-28">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Getting started is simple. Follow these four steps to begin
              reaching top remote talent today.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Mail,
                title: "Reach Out",
                description:
                  "Fill out our short partner form and tell us about your company and hiring needs.",
              },
              {
                step: "02",
                icon: Building2,
                title: "Get Onboarded",
                description:
                  "Our team reviews your application and sets up your employer profile and job feed.",
              },
              {
                step: "03",
                icon: Briefcase,
                title: "Post Your Jobs",
                description:
                  "Submit your openings and they get distributed across our trusted job boards.",
              },
              {
                step: "04",
                icon: TrendingUp,
                title: "Hire Faster",
                description:
                  "Receive applications from qualified candidates and fill your roles with confidence.",
              },
            ].map((step) => (
              <Card key={step.step} className="text-center hover:border-primary transition-colors">
                <CardContent className="pt-8">
                  <div
                    className="text-4xl font-bold text-primary/30 mb-4"
                    aria-hidden="true"
                  >
                    {step.step}
                  </div>
                  <div
                    className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                    aria-hidden="true"
                  >
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ============ WHY COMPANIES CHOOSE FIND (Commented out per coordinator feedback) ============ */}
        {/*
        <section className="mt-24 md:mt-32">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Companies Choose FIND
            </h2>
            <p className="text-lg text-muted-foreground">
              Join a growing community of employers who trust FIND to connect
              them with exceptional remote talent.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-6">
                  Everything you need to hire
                </h3>
                <ul className="space-y-4">
                  {[
                    "Access to a curated pool of active remote job seekers",
                    "Simple, streamlined posting process with no hidden fees",
                    "Multi-board distribution for maximum exposure",
                    "Dedicated support from our partner success team",
                    "Flexible plans that scale with your hiring needs",
                  ].map((benefit) => (
                    <li
                      key={benefit}
                      className="flex items-start gap-3 text-foreground"
                    >
                      <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/20">
              <CardContent className="p-8">
                <figure className="h-full flex flex-col justify-between">
                  <div>
                    <Quote
                      className="h-8 w-8 text-primary/40 mb-4"
                      aria-hidden="true"
                    />
                    <blockquote className="text-lg leading-relaxed mb-6">
                      "FIND completely changed how we hire. We went from posting
                      on one board to reaching candidates across four trusted
                      platforms — and our time-to-hire dropped by half."
                    </blockquote>
                  </div>
                  <figcaption>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">Sarah Mitchell</div>
                        <div className="text-sm text-muted-foreground">
                          Head of Talent, Acme Inc.
                        </div>
                      </div>
                      <div
                        className="ml-auto flex gap-0.5"
                        aria-label="Rated 5 out of 5 stars"
                      >
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 text-primary fill-primary"
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                  </figcaption>
                </figure>
              </CardContent>
            </Card>
          </div>
        </section>
        */}

        {/* ============ TRUSTED BOARDS (banded) (Commented out per coordinator feedback) ============ */}
        {/*
        <section className="mt-24 md:mt-32 -mx-4 sm:-mx-6 lg:-mx-8 bg-card border-y border-border py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center mb-12 px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Hiring Reach Across Trusted Boards
            </h2>
            <p className="text-lg text-muted-foreground">
              Your jobs are distributed across the platforms remote candidates
              already trust and visit every day.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 sm:px-6 lg:px-8">
            {[
              { icon: Briefcase, name: "We Work Remotely" },
              { icon: Globe, name: "RemoteOK" },
              { icon: Search, name: "Remote.com" },
              { icon: Users, name: "Working Nomads" },
            ].map((board) => (
              <Card
                key={board.name}
                className="bg-background text-center hover:border-primary transition-colors"
              >
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <board.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="font-semibold">{board.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        */}

        {/* ============ FAQ ============ */}
        <section className="mt-24 md:mt-32 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about partnering with FIND.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="cost">
              <AccordionTrigger>How much does it cost to partner with FIND?</AccordionTrigger>
              <AccordionContent>
                We offer flexible partnership plans designed to fit companies
                of all sizes — from single job postings to high-volume hiring.
                Reach out through our partner form and our team will share the
                option that best matches your budget and hiring needs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="posting">
              <AccordionTrigger>How do I post my job openings?</AccordionTrigger>
              <AccordionContent>
                Once your employer profile is set up, you can submit your job
                openings through our simple posting process. Your listings are
                then distributed across our trusted job boards automatically.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="reach">
              <AccordionTrigger>What kind of candidates will I reach?</AccordionTrigger>
              <AccordionContent>
                You'll reach a diverse, international pool of job seekers who
                are actively searching for remote opportunities. Our audience
                spans multiple industries, skill levels, and time zones.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="timeline">
              <AccordionTrigger>How quickly will my jobs go live?</AccordionTrigger>
              <AccordionContent>
                Most partner listings go live within 24 hours of submission.
                Our streamlined process ensures your openings reach candidates
                as quickly as possible.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="support">
              <AccordionTrigger>Do you offer support for partners?</AccordionTrigger>
              <AccordionContent>
                Yes. Our partner success team is dedicated to helping you get
                the most out of your partnership, from onboarding to ongoing
                optimization of your job listings.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Still have questions */}
          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-4">
              Still have questions about partnering with FIND?
            </p>
            <Button variant="outline" onClick={() => setContactOpen(true)}>
              Contact our team
            </Button>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="mt-24 md:mt-32">
          <Card className="text-center border-primary/30 bg-gradient-to-br from-background to-muted">
            <CardContent className="p-12 md:p-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to Hire Top Remote Talent?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join the growing community of employers who trust FIND to
                connect them with exceptional remote candidates. Get started
                today.
              </p>
              <div className="flex items-center justify-center">
                <Button size="lg" className="px-10 w-full sm:w-auto" asChild>
                  <Link to="/company/auth?mode=signup">
                    Partner with us
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
      <BackToTop />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
};

export default Partnership;