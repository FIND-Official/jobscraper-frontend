import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import { getCompanyJobs, createCompanyJob, CompanyJobItem } from "@/lib/companyApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import {
  Building2,
  Briefcase,
  Users,
  Globe,
  TrendingUp,
  Plus,
  LogOut,
  Settings,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  ShieldCheck,
  Radio,
  ChevronDown,
} from "lucide-react";
import { CompanyProfileData } from "@/lib/companyValidation";

interface PostedJob {
  id: string;
  title: string;
  type: string;
  location: string;
  salary?: string;
  applyUrl: string;
  description: string;
  postedDate: string;
  syndicatedBoards: string[];
  status: "active" | "draft" | "closed";
  applicantsCount: number;
}

export default function CompanyDashboard() {
  const { companyUser, signOut, updateProfile, loading: authLoading, isAuthenticated, refreshProfile } = useCompanyAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CompanyProfileData | null>(null);
  const [postJobOpen, setPostJobOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);

  // Post Job Form State
  const [jobTitle, setJobTitle] = useState("");
  const [jobType, setJobType] = useState("Full-time");
  const [jobLocation, setJobLocation] = useState("Remote (Worldwide)");
  const [jobSalary, setJobSalary] = useState("$80,000 - $120,000 USD");
  const [jobApplyUrl, setJobApplyUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [syndicateWWR, setSyndicateWWR] = useState(true);
  const [syndicateRemoteOK, setSyndicateRemoteOK] = useState(true);
  const [syndicateRemoteCom, setSyndicateRemoteCom] = useState(true);
  const [syndicateNomads, setSyndicateNomads] = useState(true);

  // Edit Profile Form State
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editBusinessType, setEditBusinessType] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editCompanySize, setEditCompanySize] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  const [jobs, setJobs] = useState<PostedJob[]>([
    {
      id: "job-default-1",
      title: "Senior Full Stack Engineer (React & Node.js)",
      type: "Full-time",
      location: "Remote (Global)",
      salary: "$110,000 - $150,000 USD",
      applyUrl: "https://careers.example.com/apply/1",
      description: "Looking for a seasoned Full Stack Engineer to lead architecture across web applications.",
      postedDate: "2 days ago",
      syndicatedBoards: ["We Work Remotely", "RemoteOK", "Remote.com", "Working Nomads"],
      status: "active",
      applicantsCount: 34,
    },
  ]);

  const loadJobsFromMongo = useCallback(async () => {
    try {
      setJobsLoading(true);
      const mongoJobs = await getCompanyJobs();
      if (mongoJobs && mongoJobs.length > 0) {
        setJobs(mongoJobs as PostedJob[]);
      }
    } catch (err) {
      console.error("[COMPANY-DASHBOARD] Failed to load jobs from MongoDB:", err);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  // Load Company Profile from MongoDB Session
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !companyUser) {
      navigate("/company/auth?mode=signin");
      return;
    }

    if (companyUser) {
      const p = (companyUser.profile || {}) as Partial<CompanyProfileData>;
      const mergedProfile: CompanyProfileData = {
        companyName: p.companyName || "Partner Employer",
        city: p.city || "Remote",
        country: p.country || "Global",
        businessType: p.businessType || "Technology & Software",
        websiteUrl: p.websiteUrl || "https://example.com",
        companySize: p.companySize || "11-50 employees",
        firstName: p.firstName || companyUser.email?.split("@")[0] || "Recruiter",
        lastName: p.lastName || "",
        workEmail: companyUser.email || p.workEmail || "",
        jobTitle: p.jobTitle || "Hiring Manager",
        onboardingCompleted: companyUser.onboardingCompleted ?? true,
      };

      setProfile(mergedProfile);
      populateEditFields(mergedProfile);
      loadJobsFromMongo();
    }
  }, [companyUser, authLoading, isAuthenticated, navigate, loadJobsFromMongo]);

  const populateEditFields = (p: CompanyProfileData) => {
    setEditCompanyName(p.companyName || "");
    setEditCity(p.city || "");
    setEditCountry(p.country || "");
    setEditBusinessType(p.businessType || "");
    setEditWebsiteUrl(p.websiteUrl || "");
    setEditCompanySize(p.companySize || "");
    setEditFirstName(p.firstName || "");
    setEditLastName(p.lastName || "");
  };

  const handleSignOut = async () => {
    signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out from the Employer Portal.",
    });
    navigate("/company/auth?mode=signin");
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      toast({ title: "Title required", description: "Please enter a job title.", variant: "destructive" });
      return;
    }

    const syndicatedBoards: string[] = [];
    if (syndicateWWR) syndicatedBoards.push("We Work Remotely");
    if (syndicateRemoteOK) syndicatedBoards.push("RemoteOK");
    if (syndicateRemoteCom) syndicatedBoards.push("Remote.com");
    if (syndicateNomads) syndicatedBoards.push("Working Nomads");

    try {
      // Save directly into MongoDB via backend API
      const created = await createCompanyJob({
        title: jobTitle.trim(),
        type: jobType,
        location: jobLocation.trim() || "Remote",
        salary: jobSalary.trim(),
        applyUrl: jobApplyUrl.trim() || (profile?.websiteUrl || "https://example.com"),
        description: jobDescription.trim(),
        syndicatedBoards,
      });

      setJobs((prev) => [created as PostedJob, ...prev]);

      toast({
        title: "Job Published Successfully! 🚀",
        description: `"${jobTitle.trim()}" is now saved in MongoDB and syndicated across ${syndicatedBoards.length} partner boards.`,
      });

      setJobTitle("");
      setJobDescription("");
      setJobApplyUrl("");
      setPostJobOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Failed to publish job",
        description: error.message || "An error occurred while saving the job to MongoDB.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyName.trim()) {
      toast({ title: "Name required", description: "Please enter your company name.", variant: "destructive" });
      return;
    }

    const updatedProfile: CompanyProfileData = {
      companyName: editCompanyName.trim(),
      city: editCity.trim(),
      country: editCountry.trim(),
      businessType: editBusinessType,
      websiteUrl: editWebsiteUrl.trim(),
      companySize: editCompanySize,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      workEmail: profile?.workEmail || companyUser?.email || "",
      onboardingCompleted: true,
    };

    try {
      // Persist directly to MongoDB via backend API
      const updated = await updateProfile(updatedProfile);
      setProfile(updated.profile);

      toast({
        title: "Profile Updated in MongoDB",
        description: "Your company details have been successfully saved to the database.",
      });

      setEditProfileOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update profile in MongoDB.",
        variant: "destructive",
      });
    }
  };

  const displayName = profile ? `${profile.firstName} ${profile.lastName}`.trim() || profile.companyName : "Employer";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO
        title="Company Dashboard — FIND Employer Portal"
        description="Manage your syndicated job postings, monitor candidate applications, and configure company hiring preferences."
        path="/company/dashboard"
      />

      {/* TOP EMPLOYER NAVIGATION */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold tracking-tight">
              Job<span className="text-primary">Scraper</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border">
              <Badge variant="secondary" className="bg-primary/15 text-primary border-0 font-semibold text-xs">
                Employer Portal
              </Badge>
              <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
                {profile?.companyName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/partnership" className="hidden md:inline-flex text-xs text-muted-foreground hover:text-foreground transition-colors mr-2">
              Partnership Benefits
            </Link>

            <Button size="sm" onClick={() => setPostJobOpen(true)} className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Post a Job</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.workEmail}</p>
                    <Badge variant="outline" className="w-fit text-[10px] mt-1 text-primary border-primary/30">
                      {profile?.companyName}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditProfileOpen(true)} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Edit Company Profile
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/partnership" className="cursor-pointer flex items-center">
                    <Globe className="mr-2 h-4 w-4" /> Partnership Overview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* WELCOME BANNER */}
        <div className="rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-border p-6 sm:p-8 mb-8 relative overflow-hidden shadow-sm">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Partner Employer
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {profile?.city}, {profile?.country}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              Welcome, {profile?.companyName || "Partner"} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Your remote openings are actively syndicated across our 4 partner job boards. Manage your listings and track applicant engagement below.
            </p>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Active Jobs
                </span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold">{jobs.filter((j) => j.status === "active").length}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-emerald-500 font-medium">● Live</span> syndicated postings
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Candidate Reach
                </span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold">50,000+</div>
              <p className="text-xs text-muted-foreground mt-1">Active remote talent network</p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Syndicated Boards
                </span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold">4 / 4</div>
              <p className="text-xs text-muted-foreground mt-1 text-emerald-500 font-medium">
                All partner networks active
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Applicants
                </span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-3xl font-bold">
                {jobs.reduce((acc, curr) => acc + curr.applicantsCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Direct referral clicks & apps</p>
            </CardContent>
          </Card>
        </div>

        {/* 2-COLUMN SECTION: JOBS LIST + SYNDICATION & PROFILE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: POSTED JOBS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Active Job Postings</h2>
                <p className="text-xs text-muted-foreground">
                  Roles published from your employer account
                </p>
              </div>
              <Button size="sm" onClick={() => setPostJobOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Post New Job
              </Button>
            </div>

            {jobs.length === 0 ? (
              <Card className="border border-dashed border-border py-12 text-center">
                <CardContent>
                  <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-1">No Active Listings Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                    Publish your first opening to instantly syndicate across We Work Remotely, RemoteOK, Remote.com, and Working Nomads.
                  </p>
                  <Button onClick={() => setPostJobOpen(true)}>Post Your First Role</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="border border-border hover:border-primary/50 transition-colors shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                              {job.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {job.location}
                            </Badge>
                            {job.salary && (
                              <span className="text-xs text-muted-foreground font-medium">{job.salary}</span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold">{job.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>

                          {/* Board distribution badges */}
                          <div className="pt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-muted-foreground mr-1">Syndicated on:</span>
                            {job.syndicatedBoards.map((b) => (
                              <span
                                key={b}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-muted text-foreground border border-border"
                              >
                                <Radio className="h-2.5 w-2.5 text-emerald-500 animate-pulse" /> {b}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border">
                          <div className="text-right">
                            <div className="text-base font-bold text-primary flex items-center sm:justify-end gap-1">
                              <Users className="h-4 w-4" /> {job.applicantsCount}
                            </div>
                            <span className="text-[11px] text-muted-foreground">Applicants</span>
                          </div>
                          {job.applyUrl && (
                            <Button variant="outline" size="sm" className="mt-2 text-xs" asChild>
                              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                                View <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT 1 COLUMN: PROFILE SUMMARY & SYNDICATION STATUS */}
          <div className="space-y-6">
            {/* COMPANY PROFILE CARD */}
            <Card className="border border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Company Profile
                  </CardTitle>
                  <CardDescription className="text-xs">Employer details</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditProfileOpen(true)} className="text-xs h-7 px-2">
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Organization</span>
                  <span className="font-semibold text-foreground text-sm">{profile?.companyName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Headquarters</span>
                  <span className="text-foreground">{profile?.city}, {profile?.country}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Industry</span>
                  <span className="text-foreground">{profile?.businessType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Company Size</span>
                  <span className="text-foreground">{profile?.companySize}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Website</span>
                  <a
                    href={profile?.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-medium truncate max-w-full"
                  >
                    {profile?.websiteUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
                <div className="pt-2 border-t border-border">
                  <span className="text-muted-foreground block text-[11px]">Primary Contact</span>
                  <span className="text-foreground font-medium">{profile?.firstName} {profile?.lastName}</span>
                  <span className="text-muted-foreground block text-[11px]">{profile?.workEmail}</span>
                </div>
              </CardContent>
            </Card>

            {/* SYNDICATION NETWORK STATUS */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> Partner Distribution Network
                </CardTitle>
                <CardDescription className="text-xs">Live aggregated platforms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { name: "We Work Remotely", tag: "Active", reach: "1.5M monthly visits" },
                  { name: "RemoteOK", tag: "Active", reach: "1.2M monthly visits" },
                  { name: "Remote.com", tag: "Active", reach: "900k monthly visits" },
                  { name: "Working Nomads", tag: "Active", reach: "400k monthly visits" },
                ].map((board) => (
                  <div key={board.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                    <div>
                      <span className="font-semibold block">{board.name}</span>
                      <span className="text-[10px] text-muted-foreground">{board.reach}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                      ● {board.tag}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* MODAL: POST A JOB */}
      <Dialog open={postJobOpen} onOpenChange={setPostJobOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Post a Remote Opening
            </DialogTitle>
            <DialogDescription>
              Submit role details. Your listing will syndicate directly to FIND's partner remote job boards.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePostJob} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="postJobTitle">Job Title *</Label>
              <Input
                id="postJobTitle"
                placeholder="e.g. Senior Frontend Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="postJobType">Employment Type</Label>
                <Select value={jobType} onValueChange={setJobType}>
                  <SelectTrigger id="postJobType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="postJobLocation">Location / Timezone</Label>
                <Input
                  id="postJobLocation"
                  placeholder="e.g. Remote (Worldwide)"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="postJobSalary">Salary / Compensation</Label>
                <Input
                  id="postJobSalary"
                  placeholder="e.g. $90k - $130k USD"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="postJobApplyUrl">Application URL or Email</Label>
                <Input
                  id="postJobApplyUrl"
                  placeholder="https://company.com/apply"
                  value={jobApplyUrl}
                  onChange={(e) => setJobApplyUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="postJobDescription">Job Description</Label>
              <Textarea
                id="postJobDescription"
                placeholder="Describe role responsibilities, key requirements, tech stack, and benefits..."
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Board syndication selectors */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Distribution Channels (Included in Partnership)
              </Label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syndicateWWR}
                    onChange={(e) => setSyndicateWWR(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>We Work Remotely</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syndicateRemoteOK}
                    onChange={(e) => setSyndicateRemoteOK(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>RemoteOK</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syndicateRemoteCom}
                    onChange={(e) => setSyndicateRemoteCom(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Remote.com</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syndicateNomads}
                    onChange={(e) => setSyndicateNomads(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Working Nomads</span>
                </label>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPostJobOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Publish Listing</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT COMPANY PROFILE */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Edit Company Details
            </DialogTitle>
            <DialogDescription>Update organizational information and recruiter details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-2 text-sm">
            <div className="space-y-1">
              <Label htmlFor="editCompanyName">Company Name</Label>
              <Input
                id="editCompanyName"
                value={editCompanyName}
                onChange={(e) => setEditCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editCity">City</Label>
                <Input id="editCity" value={editCity} onChange={(e) => setEditCity(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editCountry">Country</Label>
                <Input id="editCountry" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editBusinessType">Business Type</Label>
                <Input
                  id="editBusinessType"
                  value={editBusinessType}
                  onChange={(e) => setEditBusinessType(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editCompanySize">Company Size</Label>
                <Input
                  id="editCompanySize"
                  value={editCompanySize}
                  onChange={(e) => setEditCompanySize(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="editWebsiteUrl">Website URL</Label>
              <Input
                id="editWebsiteUrl"
                value={editWebsiteUrl}
                onChange={(e) => setEditWebsiteUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
