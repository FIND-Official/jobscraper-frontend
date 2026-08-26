import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  CompanyUser,
  companySignUp,
  companySignIn,
  getCompanyProfile,
  completeCompanyOnboarding,
  updateCompanyProfile,
  clearCompanySession,
  getCompanyToken,
  getCachedCompanyUser,
} from "@/lib/companyApi";
import { CompanyProfileData } from "@/lib/companyValidation";

interface CompanyAuthContextType {
  companyUser: CompanyUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  signUp: (email: string, password: string) => Promise<CompanyUser>;
  signIn: (email: string, password: string) => Promise<CompanyUser>;
  signOut: () => void;
  completeOnboarding: (profile: CompanyProfileData) => Promise<CompanyUser>;
  updateProfile: (profile: CompanyProfileData) => Promise<CompanyUser>;
  refreshProfile: () => Promise<void>;
}

const CompanyAuthContext = createContext<CompanyAuthContextType | undefined>(undefined);

export const CompanyAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(() => getCachedCompanyUser());
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = getCompanyToken();
    if (!token) {
      setCompanyUser(null);
      setLoading(false);
      return;
    }

    try {
      const user = await getCompanyProfile();
      setCompanyUser(user);
    } catch (err) {
      console.error("[COMPANY-AUTH] Failed to refresh profile from MongoDB:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const signUp = async (email: string, password: string): Promise<CompanyUser> => {
    setLoading(true);
    try {
      const res = await companySignUp(email, password);
      if (!res.company) {
        throw new Error(res.error || "Failed to create company account.");
      }
      setCompanyUser(res.company);
      return res.company;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<CompanyUser> => {
    setLoading(true);
    try {
      const res = await companySignIn(email, password);
      if (!res.company) {
        throw new Error(res.error || "Failed to sign in.");
      }
      setCompanyUser(res.company);
      return res.company;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    clearCompanySession();
    setCompanyUser(null);
  };

  const completeOnboardingHandler = async (profile: CompanyProfileData): Promise<CompanyUser> => {
    setLoading(true);
    try {
      const updated = await completeCompanyOnboarding(profile);
      setCompanyUser(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const updateProfileHandler = async (profile: CompanyProfileData): Promise<CompanyUser> => {
    setLoading(true);
    try {
      const updated = await updateCompanyProfile(profile);
      setCompanyUser(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = Boolean(companyUser && getCompanyToken());
  const isOnboarded = Boolean(companyUser?.onboardingCompleted);

  return (
    <CompanyAuthContext.Provider
      value={{
        companyUser,
        loading,
        isAuthenticated,
        isOnboarded,
        signUp,
        signIn,
        signOut,
        completeOnboarding: completeOnboardingHandler,
        updateProfile: updateProfileHandler,
        refreshProfile,
      }}
    >
      {children}
    </CompanyAuthContext.Provider>
  );
};

export const useCompanyAuth = () => {
  const context = useContext(CompanyAuthContext);
  if (context === undefined) {
    throw new Error("useCompanyAuth must be used within a CompanyAuthProvider");
  }
  return context;
};
