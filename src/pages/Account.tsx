import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, isWithinInterval } from "date-fns";
import { 
  Crown, 
  Search, 
  Bookmark, 
  BarChart3, 
  CalendarIcon, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { DateRange } from "react-day-picker";
import NotificationPreferences from "@/components/NotificationPreferences";
import { Link } from "react-router-dom";
import { PaystackPayment } from "@/components/PaystackPayment";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

interface JobBoardStats {
  [key: string]: number;
}

const Account = () => {
  const {
    user,
    session,
    subscriptionTier,
    subscriptionEnd,
    subscriptionCancelAtPeriodEnd,
    checkSubscription,
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [filteredSavedJobsCount, setFilteredSavedJobsCount] = useState(0);
  const [remainingScrapes, setRemainingScrapes] = useState(0);
  const [jobBoardStats, setJobBoardStats] = useState<JobBoardStats>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const FREE_SCRAPE_LIMIT = 50;
  const isPro = subscriptionTier === "pro";

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchAccountData();
  }, [user, navigate]);

  useEffect(() => {
    if (user && dateRange?.from && dateRange?.to) {
      fetchFilteredSavedJobs();
    }
  }, [dateRange, user]);

  const fetchAccountData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch total saved jobs count
      const { count: savedCount } = await supabase
        .from("saved_jobs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setSavedJobsCount(savedCount || 0);

      // Fetch monthly export count for remaining scrapes
      const { data: profileData } = await supabase
        .from("profiles")
        .select("monthly_export_count")
        .eq("id", user.id)
        .single();

      const usedExports = profileData?.monthly_export_count || 0;
      setRemainingScrapes(Math.max(0, FREE_SCRAPE_LIMIT - usedExports));

      // Fetch job board statistics from jobs table
      const { data: savedJobs } = await supabase
        .from("saved_jobs")
        .select("jobs(source)")
        .eq("user_id", user.id);

      const stats: JobBoardStats = {};
      savedJobs?.forEach((item) => {
        const source = (item.jobs as any)?.source;
        if (source) {
          stats[source] = (stats[source] || 0) + 1;
        }
      });
      setJobBoardStats(stats);

      // Fetch filtered saved jobs for the date range
      await fetchFilteredSavedJobs();
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredSavedJobs = async () => {
    if (!user || !dateRange?.from || !dateRange?.to) return;

    try {
      const { data } = await supabase
        .from("saved_jobs")
        .select("saved_at")
        .eq("user_id", user.id);

      const count = data?.filter((job) => {
        const savedDate = new Date(job.saved_at);
        return isWithinInterval(savedDate, {
          start: dateRange.from!,
          end: dateRange.to!,
        });
      }).length || 0;

      setFilteredSavedJobsCount(count);
    } catch (error) {
      console.error("Error fetching filtered saved jobs:", error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!session?.access_token) {
      toast({
        title: "Sign in required",
        description: "Please sign in again to manage your plan.",
        variant: "destructive",
      });
      return;
    }

    setCancellingSubscription(true);

    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || "Unable to cancel your Pro plan.");
      }

      const endDate = data.subscription_end || subscriptionEnd;
      const readableEndDate = endDate ? format(new Date(endDate), "MMMM d, yyyy") : "the end of your current period";

      toast({
        title: "Pro plan cancelled",
        description: `You can still use Pro until ${readableEndDate}. After that, your account will change to Free.`,
      });

      await checkSubscription();
      await fetchAccountData();
    } catch (error: any) {
      toast({
        title: "Could not cancel Pro",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingSubscription(false);
    }
  };

  if (!user) return null;

  const sortedStats = Object.entries(jobBoardStats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="My Account — FIND JobScraper"
        description="Manage your FIND JobScraper account, view subscription details, saved jobs, and statistics from job boards."
        path="/account"
      />
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-32 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Current Plan Card */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Crown className={`h-5 w-5 ${isPro ? "text-primary" : "text-muted-foreground"}`} />
                    Current Plan
                  </CardTitle>
                  <CardDescription>
                    Your subscription details
                  </CardDescription>
                </div>
                <Badge 
                  variant={isPro ? "default" : "secondary"}
                  className={isPro ? "bg-primary text-primary-foreground" : ""}
                >
                  {isPro ? "Pro" : "Free"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    {isPro && subscriptionEnd && (
                      <p className="text-sm text-muted-foreground">
                        {subscriptionCancelAtPeriodEnd
                          ? `Pro cancelled. You can use Pro until ${format(new Date(subscriptionEnd), "MMMM d, yyyy")}.`
                          : `Active until ${format(new Date(subscriptionEnd), "MMMM d, yyyy")}`}
                      </p>
                    )}
                    {!isPro && (
                      <p className="text-sm text-muted-foreground">
                        Upgrade to unlock all features
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isPro ? (
                      <Button 
                        variant="outline" 
                        onClick={handleCancelSubscription}
                        disabled={cancellingSubscription || subscriptionCancelAtPeriodEnd}
                      >
                        {subscriptionCancelAtPeriodEnd
                          ? "Pro ending"
                          : cancellingSubscription
                            ? "Cancelling..."
                            : "Cancel Pro"}
                      </Button>
                    ) : (
                      <PaystackPayment
                        email={user.email || ""}
                        amount={20}
                        planName="Pro"
                        buttonText="Upgrade to Pro"
                        onSuccess={async () => {
                          await checkSubscription();
                          await fetchAccountData();
                        }}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Remaining Scrapes - Free tier only */}
            {!isPro && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Remaining Exports
                  </CardTitle>
                  <CardDescription>
                    Monthly export limit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{remainingScrapes}</span>
                    <span className="text-muted-foreground">/ {FREE_SCRAPE_LIMIT}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Resets at the start of each month
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Saved Jobs with Date Filter */}
            <Card className={isPro ? "md:col-span-1" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  Saved Jobs
                </CardTitle>
                <CardDescription>
                  Jobs you've bookmarked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">{filteredSavedJobsCount}</span>
                  <span className="text-muted-foreground">in selected period</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Total all-time: {savedJobsCount} jobs
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Job Board Stats */}
            <Card className={isPro ? "md:col-span-1" : "md:col-span-2"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Job Board Stats
                </CardTitle>
                <CardDescription>
                  Which boards produced the most results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No saved jobs yet. Start saving jobs to see statistics!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sortedStats.map(([source, count], index) => {
                      const maxCount = sortedStats[0][1];
                      const percentage = (count / maxCount) * 100;
                      return (
                        <div key={source}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-2">
                              {index === 0 && <span className="text-primary">🏆</span>}
                              {source}
                            </span>
                            <span className="text-muted-foreground">{count} jobs</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Notification Preferences */}
            <div className="md:col-span-2">
              <NotificationPreferences />
            </div>
            {/* Legal Links */}
            <Card className="md:col-span-2">
              <CardHeader>
              <CardTitle className="text-lg">Legal</CardTitle>
               <CardDescription>
                  Review our policies and terms of service
                </CardDescription>
               </CardHeader>

              <CardContent className="flex gap-4">
               <Link to="/privacy">
               <Button variant="outline">
                Privacy Policy
               </Button>
              </Link>

               <Link to="/terms">
                 <Button variant="outline">
                  Terms of Service
                 </Button>
                 </Link>
              </CardContent>
              </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Account;
