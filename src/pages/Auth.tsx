import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, Google } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";


export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(
    () => searchParams.get("mode") === "signup",
  );
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const { signUp, signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setIsSignUp(true);
      setIsForgotPassword(false);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setIsForgotPassword(false);
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) await signUp(email, password, fullName);
      else await signIn(email, password);
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl shadow-2xl bg-background grid grid-cols-1 md:grid-cols-2">

        {/* FORM */}
        <div
          className={`flex flex-col justify-center p-8 sm:p-10 md:p-12 transition-all duration-700 ease-in-out
        ${isSignUp ? "md:order-2" : "md:order-1"} min-h-[700px] w-full max-w-md mx-auto md:mx-0`}
        >
          {isForgotPassword ? (
            <>
              <button
                onClick={() => setIsForgotPassword(false)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </button>

              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Reset password</h1>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Enter your email and we’ll send you a reset link.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <Field label="Email" icon={<Mail />}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-muted-foreground/30 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                </Field>

                <Button type="submit" disabled={loading} className="w-full h-12 rounded-lg">
                  {loading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">
                F I N D | JobScraper
              </p>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                {isSignUp ? "Create your account" : "Welcome back"}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                {isSignUp
                  ? "Start discovering better job opportunities."
                  : "Sign in to continue your job search."}
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-12 mb-4 flex items-center justify-center gap-2 rounded-lg border border-muted-foreground/30 hover:bg-muted transition"
              >
                {googleLoading ? (
                  "Connecting..."
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
                      <path d="M533.5 278.4c0-17.8-1.5-35-4.4-51.6H272v97.8h146.9c-6.4 34.5-25.3 63.7-54.1 83.2v69.2h87.3c51.1-47 80.4-116.3 80.4-198.6z" fill="#4285F4" />
                      <path d="M272 544.3c73.6 0 135.3-24.4 180.4-66.4l-87.3-69.2c-24.2 16.2-55.1 25.8-93.1 25.8-71.5 0-132-48.1-153.7-112.9H30.5v70.8C75.3 481.2 168.5 544.3 272 544.3z" fill="#34A853" />
                      <path d="M118.3 321.4c-11.5-34-11.5-70.6 0-104.6V146H30.5c-23.1 45.2-36.4 95.8-36.4 146.3s13.3 101.1 36.4 146.3l87.8-70.8z" fill="#FBBC05" />
                      <path d="M272 107.7c39.9-.6 77.9 14.1 106.9 40.9l80-80C404.3 24.6 342.6.3 272 0 168.5 0 75.3 63.1 30.5 146l87.8 70.8C140 155.8 200.5 107.7 272 107.7z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <div className="relative mb-6">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-background px-3 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignUp && (
                  <Field label="Full Name" icon={<User />}>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-muted-foreground/30 focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                  </Field>
                )}

                <Field label="Email" icon={<Mail />}>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="abc@email.com"
                    required
                    className="w-full rounded-lg border border-muted-foreground/30 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                </Field>

                <Field label="Password" icon={<Lock />}>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="*******"
                    minLength={6}
                    className="w-full rounded-lg border border-muted-foreground/30 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  />
                </Field>

                {!isSignUp && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-12 rounded-lg">
                  {loading ? "Processing..." : isSignUp ? "Create account" : "Sign in"}
                </Button>

                <div className="text-center text-sm mt-3">
                  {isSignUp ? (
                    <button onClick={() => setIsSignUp(false)} className="text-primary hover:underline">
                      Already have an account? Sign in
                    </button>
                  ) : (
                    <button onClick={() => setIsSignUp(true)} className="text-primary hover:underline">
                      New here? Create an account
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        {/* IMAGE */}
        <div
          className={`relative hidden md:block overflow-hidden transition-all duration-700 ease-in-out
        ${isSignUp ? "md:order-1" : "md:order-2"}
      `}
        >
          <img
            src="https://images.pexels.com/photos/4050216/pexels-photo-4050216.jpeg"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out
          ${isSignUp ? "opacity-0 translate-x-10" : "opacity-100 translate-x-0"}
        `}
          />
          <img
            src="https://images.pexels.com/photos/5668514/pexels-photo-5668514.jpeg"
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out
          ${isSignUp ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}
        `}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-background/90 via-background/40 to-transparent" />
        </div>
      </div>
    </div>

  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>

        {/* Add padding directly to the input using React.cloneElement */}
        {React.isValidElement(children) &&
          React.cloneElement(children, {
            className: `${children.props.className} pl-10`,
          })}
      </div>
    </div>
  );
}

