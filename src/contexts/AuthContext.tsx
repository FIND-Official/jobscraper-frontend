import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscriptionTier: "free" | "pro";
  subscriptionEnd: string | null;
  subscriptionCancelAtPeriodEnd: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "pro">("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [subscriptionCancelAtPeriodEnd, setSubscriptionCancelAtPeriodEnd] = useState(false);

  const checkSubscription = useCallback(async () => {
    const currentSession = session || (await supabase.auth.getSession()).data.session;
    if (!currentSession) return;
    
    try {
      console.log("[AUTH] Checking subscription status...");
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        console.error("[AUTH] Subscription check error:", error);
        return;
      }
      
      console.log("[AUTH] Subscription response:", data);
      
      if (data?.tier) {
        setSubscriptionTier(data.tier);
        console.log("[AUTH] Updated subscription tier to:", data.tier);
      }
      setSubscriptionEnd(data?.subscription_end ?? null);
      setSubscriptionCancelAtPeriodEnd(Boolean(data?.cancel_at_period_end));
    } catch (error) {
      console.error("[AUTH] Error checking subscription:", error);
    }
  }, [session]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AUTH] Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          // Delay to avoid race conditions with Supabase
          setTimeout(() => checkSubscription(), 500);
        } else {
          setSubscriptionTier("free");
          setSubscriptionEnd(null);
          setSubscriptionCancelAtPeriodEnd(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        setTimeout(() => checkSubscription(), 500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription when window gains focus after payment or account updates.
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user) {
        console.log("[AUTH] Window focused, checking subscription...");
        checkSubscription();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user) {
        console.log("[AUTH] Tab visible, checking subscription...");
        checkSubscription();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, checkSubscription]);

  // Periodic subscription check every 60 seconds
  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      console.log("[AUTH] Periodic subscription check...");
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || "",
        },
      },
    });

    if (error) throw error;

    // Sync user to Mailchimp (fire and forget - don't block signup)
    if (data.user) {
      supabase.functions.invoke("mailchimp-sync", {
        body: {
          email: email,
          fullName: fullName || "",
        },
      }).then((result) => {
        if (result.error) {
          console.error("[AUTH] Mailchimp sync failed:", result.error);
        } else {
          console.log("[AUTH] Mailchimp sync successful");
        }
      }).catch((err) => {
        console.error("[AUTH] Mailchimp sync error:", err);
      });
    }

    toast({
      title: "Success",
      description: "Account created successfully!",
    });
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    toast({
      title: "Welcome back!",
      description: "Successfully signed in",
    });
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSubscriptionTier("free");
    setSubscriptionEnd(null);
    setSubscriptionCancelAtPeriodEnd(false);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        subscriptionTier,
        subscriptionEnd,
        subscriptionCancelAtPeriodEnd,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        checkSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
