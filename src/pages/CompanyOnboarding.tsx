import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import { toast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import {
  Building2,
  MapPin,
  Globe,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { CompanyProfileData } from "@/lib/companyValidation";

const BUSINESS_TYPES = [
  "Technology & Software",
  "Financial Services & Fintech",
  "E-Commerce & Retail",
  "Healthcare & Life Sciences",
  "Marketing & Advertising",
  "Recruitment & Staffing",
  "Media & Entertainment",
  "Education & EdTech",
  "Professional Services & Consulting",
  "Telecommunications",
  "Other",
];

const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees",
];

const POPULAR_COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "Australia",
  "Singapore",
  "Ireland",
  "Switzerland",
  "Sweden",
  "Nigeria",
  "South Africa",
  "India",
  "Brazil",
  "United Arab Emirates",
  "Other",
];

export default function CompanyOnboarding() {
  const { companyUser, loading: authLoading, completeOnboarding, isAuthenticated, isOnboarded } = useCompanyAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Company Details
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companySize, setCompanySize] = useState("");

  // Step 2: Primary Contact Details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Load existing metadata from MongoDB company session
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const pendingEmail = localStorage.getItem("pending_company_email");
      if (!pendingEmail) {
        navigate("/company/auth?mode=signin");
      }
      return;
    }

    if (companyUser) {
      if (isOnboarded) {
        navigate("/company/dashboard");
        return;
      }

      const p = (companyUser.profile || {}) as Partial<CompanyProfileData>;
      if (p.companyName) setCompanyName(p.companyName);
      if (p.city) setCity(p.city);
      if (p.country) setCountry(p.country);
      if (p.businessType) setBusinessType(p.businessType);
      if (p.websiteUrl) setWebsiteUrl(p.websiteUrl);
      if (p.companySize) setCompanySize(p.companySize);
      if (p.firstName) setFirstName(p.firstName);
      if (p.lastName) setLastName(p.lastName);
      if (p.jobTitle) setJobTitle(p.jobTitle);
    }
  }, [companyUser, authLoading, isAuthenticated, isOnboarded, navigate]);

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast({ title: "Required", description: "Please enter your company name.", variant: "destructive" });
      return;
    }
    if (!city.trim()) {
      toast({ title: "Required", description: "Please enter your company city.", variant: "destructive" });
      return;
    }
    if (!country.trim()) {
      toast({ title: "Required", description: "Please select or enter your company country.", variant: "destructive" });
      return;
    }
    if (!businessType) {
      toast({ title: "Required", description: "Please select your business type.", variant: "destructive" });
      return;
    }
    if (!websiteUrl.trim()) {
      toast({ title: "Required", description: "Please enter your company website URL.", variant: "destructive" });
      return;
    }
    if (!companySize) {
      toast({ title: "Required", description: "Please select your company size.", variant: "destructive" });
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast({ title: "Required", description: "Please enter your first name.", variant: "destructive" });
      return;
    }
    if (!lastName.trim()) {
      toast({ title: "Required", description: "Please enter your last name.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const workEmail = companyUser?.email || localStorage.getItem("pending_company_email") || "";

    const profileData: CompanyProfileData = {
      companyName: companyName.trim(),
      city: city.trim(),
      country: country.trim(),
      businessType,
      websiteUrl: websiteUrl.trim().startsWith("http") ? websiteUrl.trim() : `https://${websiteUrl.trim()}`,
      companySize,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      workEmail,
      jobTitle: jobTitle.trim(),
      onboardingCompleted: true,
    };

    try {
      // Save directly into MongoDB via backend API
      await completeOnboarding(profileData);

      toast({
        title: "Company Profile Created! 🎉",
        description: `Welcome ${profileData.companyName}. Your partner employer portal is ready.`,
      });

      navigate("/company/dashboard");
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Error saving profile",
        description: error.message || "Something went wrong while saving your company profile to MongoDB.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const workEmailDisplay = companyUser?.email || localStorage.getItem("pending_company_email") || "Work Email";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Company Onboarding — FIND Employer Portal"
        description="Set up your company profile to start syndicating jobs across top remote job boards."
        path="/company/onboarding"
      />

      <div className="max-w-2xl mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Building2 className="h-4 w-4" /> FIND Partner Employer Setup
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Complete Your Company Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Set up your employer identity so candidates and syndication boards recognize your brand.
          </p>

          {/* Stepper Progress */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                step === 1
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-background/20 text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Company Information</span>
            </div>

            <div className="h-0.5 w-8 bg-border" />

            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                step === 2
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card border border-border text-muted-foreground"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-background/20 text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Primary Contact</span>
            </div>
          </div>
        </div>

        {/* STEP 1: COMPANY INFORMATION */}
        {step === 1 && (
          <Card className="border border-border shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Step 1: Company Details
              </CardTitle>
              <CardDescription>
                Provide the official details for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1Next} className="space-y-5">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="font-medium">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Acme Technologies Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                {/* Address: City & Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="font-medium">
                      Address: City <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="city"
                        placeholder="e.g. San Francisco"
                        className="pl-9"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="country" className="font-medium">
                      Address: Country <span className="text-destructive">*</span>
                    </Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {POPULAR_COUNTRIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Business Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="businessType" className="font-medium">
                    Business Type / Industry <span className="text-destructive">*</span>
                  </Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger id="businessType">
                      <SelectValue placeholder="Select Business Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((bt) => (
                        <SelectItem key={bt} value={bt}>
                          {bt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Website URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="websiteUrl" className="font-medium">
                    Website URL <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="websiteUrl"
                      type="url"
                      placeholder="https://acme.com"
                      className="pl-9"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Company Size */}
                <div className="space-y-1.5">
                  <Label htmlFor="companySize" className="font-medium">
                    Company Size <span className="text-destructive">*</span>
                  </Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger id="companySize">
                      <SelectValue placeholder="Select Company Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((sz) => (
                        <SelectItem key={sz} value={sz}>
                          {sz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" size="lg" className="w-full sm:w-auto px-8">
                    Continue to Step 2 <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: PRIMARY CONTACT DETAILS */}
        {step === 2 && (
          <Card className="border border-border shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Step 2: Primary Contact
              </CardTitle>
              <CardDescription>
                Who is the primary administrator or recruiter managing this company account?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFinalSave} className="space-y-5">
                {/* First & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="font-medium">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="e.g. Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="font-medium">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="e.g. Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Registered Work Email (Read-only) */}
                <div className="space-y-1.5">
                  <Label className="font-medium">Work Email Address</Label>
                  <Input value={workEmailDisplay} disabled className="bg-muted text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground">
                    Connected to your authenticated employer profile.
                  </p>
                </div>

                {/* Job Title / Role */}
                <div className="space-y-1.5">
                  <Label htmlFor="jobTitle" className="font-medium">
                    Job Title / Role (Optional)
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="jobTitle"
                      placeholder="e.g. Head of Talent Acquisition / VP Engineering"
                      className="pl-9"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border/80 text-sm space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Setup Summary
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{companyName}</span> ({businessType}) •{" "}
                    {city}, {country} • {companySize}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Step 1
                  </Button>

                  <Button type="submit" size="lg" className="w-full sm:w-auto px-8" disabled={saving}>
                    {saving ? (
                      "Saving Profile..."
                    ) : (
                      <span className="flex items-center">
                        <Sparkles className="mr-2 h-4 w-4" /> Save
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
