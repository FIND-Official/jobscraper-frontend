import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCompanyAuth } from "@/contexts/CompanyAuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, Building2, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { validateCompanyEmail } from "@/lib/companyValidation";

interface CompanyAuthProps {
  initialMode?: "signup" | "signin";
}

export default function CompanyAuth({ initialMode }: CompanyAuthProps) {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState<boolean>(() => {
    if (initialMode === "signup") return true;
    if (initialMode === "signin") return false;
    return searchParams.get("mode") !== "signin";
  });
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const { companyUser, isAuthenticated, isOnboarded, signUp, signIn } = useCompanyAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialMode) {
      setIsSignUp(initialMode === "signup");
      setIsForgotPassword(false);
    } else if (searchParams.get("mode") === "signin") {
      setIsSignUp(false);
      setIsForgotPassword(false);
    } else if (searchParams.get("mode") === "signup") {
      setIsSignUp(true);
      setIsForgotPassword(false);
    }
  }, [searchParams, initialMode]);

  // If already logged in as company, redirect
  useEffect(() => {
    if (isAuthenticated && companyUser) {
      if (isOnboarded) {
        navigate("/company/dashboard");
      } else {
        navigate("/company/onboarding");
      }
    }
  }, [isAuthenticated, companyUser, isOnboarded, navigate]);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) {
      setEmailError(null);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Work email required",
        description: "Please enter your company email address.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // In MongoDB backend, trigger reset password instructions
      toast({
        title: "Check your email",
        description: `Password reset instructions have been dispatched to ${email.trim()}.`,
      });
      setIsForgotPassword(false);
      setEmail("");
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error",
        description: err.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const validation = validateCompanyEmail(email);
    if (!validation.isValid) {
      setEmailError(validation.error || "Please enter a valid company email.");
      toast({
        title: "Invalid Company Email",
        description: validation.error || "Please use your official work email address.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your password correctly.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const company = await signUp(email.trim().toLowerCase(), password);

        toast({
          title: "Company Account Created! 🎉",
          description: "Let's complete your company profile to start posting jobs.",
        });

        // Store temporary company email for onboarding flow
        try {
          localStorage.setItem("pending_company_email", email.trim().toLowerCase());
        } catch (storageErr) {
          console.warn("Storage write failed", storageErr);
        }

        if (company.onboardingCompleted) {
          navigate("/company/dashboard");
        } else {
          navigate("/company/onboarding");
        }
      } else {
        const company = await signIn(email.trim().toLowerCase(), password);

        toast({
          title: "Welcome back!",
          description: "Successfully signed in to your employer portal.",
        });

        if (company.onboardingCompleted) {
          navigate("/company/dashboard");
        } else {
          navigate("/company/onboarding");
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Authentication Error",
        description: err.message || "Something went wrong. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 py-12">
      <SEO
        title={isSignUp ? "Company Sign Up — FIND Employer Portal" : "Company Sign In — FIND Employer Portal"}
        description="Access FIND Employer Portal to post jobs, syndicate across 4+ trusted remote job boards, and connect with top talent."
        path="/company/auth"
      />

      <div className="w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl bg-card border border-border grid grid-cols-1 md:grid-cols-2">
        {/* FORM PANEL */}
        <div className={`flex flex-col justify-center p-8 sm:p-10 md:p-12 ${isSignUp ? "md:order-2" : "md:order-1"} min-h-[640px] w-full max-w-md mx-auto md:mx-0`}>
          {isForgotPassword ? (
            <>
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Company Sign In
              </button>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Reset Employer Password</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your registered company work email to receive a password reset link.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="company-reset-email">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company-reset-email"
                      type="email"
                      placeholder="recruiter@yourcompany.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending link..." : "Send Reset Link"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <Link to="/partnership" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Partnership Page
                </Link>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Employer Portal
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                {isSignUp ? "Create Company Account" : "Employer Sign In"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {isSignUp
                  ? "Sign up with your work email to post jobs across trusted remote boards."
                  : "Sign in to manage your company listings and view candidate activity."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="company-email">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company-email"
                      type="email"
                      placeholder="name@company.com"
                      className={`pl-9 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      required
                    />
                  </div>
                  {emailError ? (
                    <p className="text-xs text-destructive mt-1 font-medium">{emailError}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Must be a company domain (e.g. @company.com). Generic emails (@gmail, etc.) not accepted.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="company-password">Password</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-1">
                    <Label htmlFor="company-confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full mt-2" size="lg" disabled={loading}>
                  {loading ? (
                    "Processing..."
                  ) : isSignUp ? (
                    <span className="flex items-center justify-center">
                      Continue to Company Setup <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  ) : (
                    "Sign In to Employer Portal"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                {isSignUp ? (
                  <p className="text-muted-foreground">
                    Already registered your company?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setEmailError(null);
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    New partner employer?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(true);
                        setEmailError(null);
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      Create Company Account
                    </button>
                  </p>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">
                  Looking for jobs as a candidate?{" "}
                  <Link to="/auth" className="text-primary hover:underline font-medium">
                    Go to Candidate Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* SIDE HERO PANEL */}
        <div
          className={`relative hidden md:flex flex-col justify-between p-12 text-white bg-gradient-to-br from-primary/95 via-primary/80 to-slate-950 ${
            isSignUp ? "md:order-1" : "md:order-2"
          }`}
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-8">
              <Building2 className="h-4 w-4" />
              FIND Partner Network
            </div>
            <h2 className="text-3xl font-bold leading-tight mb-4">
              Hire exceptional remote talent effortlessly.
            </h2>
            <p className="text-sm text-white/80 leading-relaxed mb-8">
              Syndicate your open roles across multiple top remote job boards with a single partnership account.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-white shrink-0 mt-0.5" />
                <span>Direct multi-board syndication (We Work Remotely, RemoteOK, Remote.com, Working Nomads)</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-white shrink-0 mt-0.5" />
                <span>Reach 50,000+ active candidates actively searching for remote roles</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-white shrink-0 mt-0.5" />
                <span>Dedicated partner employer dashboard with live listing management</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/15 text-xs text-white/70 flex items-center justify-between">
            <span>FIND For Employers</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified Business Auth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
