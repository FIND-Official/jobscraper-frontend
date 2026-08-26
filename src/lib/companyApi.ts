import { supabase } from "@/integrations/supabase/client";
import { CompanyProfileData } from "./companyValidation";

export interface CompanyUser {
  id: string;
  email: string;
  onboardingCompleted: boolean;
  profile: CompanyProfileData;
}

export interface CompanyAuthResponse {
  success: boolean;
  token?: string;
  company?: CompanyUser;
  error?: string;
}

export interface CompanyJobItem {
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
  createdAt?: string;
}

const TOKEN_STORAGE_KEY = "company_auth_token";
const COMPANY_STORAGE_KEY = "company_auth_user";

export function getCompanyToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getCachedCompanyUser(): CompanyUser | null {
  try {
    const raw = localStorage.getItem(COMPANY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCompanySession(token: string, company: CompanyUser) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(company));
    // Also update legacy key for backward compatibility
    localStorage.setItem("company_profile_current", JSON.stringify(company.profile));
  } catch (e) {
    console.error("Failed to save company session to storage", e);
  }
}

export function clearCompanySession() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(COMPANY_STORAGE_KEY);
    localStorage.removeItem("company_profile_current");
    localStorage.removeItem("pending_company_email");
  } catch (e) {
    console.error("Failed to clear company session from storage", e);
  }
}

// Generic backend dispatcher supporting both standalone backend and edge function backend
async function callCompanyBackend(action: string, payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const customBackendUrl = import.meta.env.VITE_COMPANY_API_URL;
  const token = getCompanyToken();

  if (customBackendUrl) {
    const res = await fetch(`${customBackendUrl.replace(/\/$/, "")}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...payload, action, token }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Server responded with status ${res.status}`);
    }
    return data;
  }

  // Use Supabase Edge Function running MongoDB backend
  const { data, error } = await supabase.functions.invoke("company-api", {
    body: {
      action,
      token,
      ...payload,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (error) {
    throw new Error(error.message || "Failed to communicate with company backend API.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function companySignUp(email: string, password: string): Promise<CompanyAuthResponse> {
  const data = await callCompanyBackend("signup", { email, password });
  if (data.token && data.company) {
    saveCompanySession(data.token as string, data.company as CompanyUser);
  }
  return data as unknown as CompanyAuthResponse;
}

export async function companySignIn(email: string, password: string): Promise<CompanyAuthResponse> {
  const data = await callCompanyBackend("signin", { email, password });
  if (data.token && data.company) {
    saveCompanySession(data.token as string, data.company as CompanyUser);
  }
  return data as unknown as CompanyAuthResponse;
}

export async function getCompanyProfile(): Promise<CompanyUser | null> {
  const token = getCompanyToken();
  if (!token) return null;

  try {
    const data = await callCompanyBackend("get-profile", { token });
    if (data.company) {
      saveCompanySession(token, data.company as CompanyUser);
      return data.company as CompanyUser;
    }
    return null;
  } catch (err) {
    console.error("[COMPANY-API] Failed to fetch company profile from MongoDB:", err);
    return getCachedCompanyUser();
  }
}

export async function completeCompanyOnboarding(
  profile: CompanyProfileData
): Promise<CompanyUser> {
  const token = getCompanyToken();
  const data = await callCompanyBackend("complete-onboarding", { profile: profile as unknown as Record<string, unknown>, token });
  if (data.company) {
    if (token) saveCompanySession(token, data.company as CompanyUser);
    return data.company as CompanyUser;
  }
  throw new Error("Invalid response from company onboarding API.");
}

export async function updateCompanyProfile(
  profile: CompanyProfileData
): Promise<CompanyUser> {
  const token = getCompanyToken();
  const data = await callCompanyBackend("update-profile", { profile: profile as unknown as Record<string, unknown>, token });
  if (data.company) {
    if (token) saveCompanySession(token, data.company as CompanyUser);
    return data.company as CompanyUser;
  }
  throw new Error("Invalid response from company profile API.");
}

export async function getCompanyJobs(): Promise<CompanyJobItem[]> {
  const token = getCompanyToken();
  const data = await callCompanyBackend("get-jobs", { token });
  return (data.jobs as CompanyJobItem[]) || [];
}

export async function createCompanyJob(jobData: {
  title: string;
  type: string;
  location: string;
  salary?: string;
  applyUrl: string;
  description: string;
  syndicatedBoards: string[];
}): Promise<CompanyJobItem> {
  const token = getCompanyToken();
  const data = await callCompanyBackend("create-job", { ...jobData, token });
  return data.job as CompanyJobItem;
}
