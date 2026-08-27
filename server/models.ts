export interface CompanyProfile {
  companyName: string;
  city: string;
  country: string;
  businessType: string;
  websiteUrl: string;
  companySize: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle?: string;
  onboardingCompleted: boolean;
}

export interface CompanyDocument {
  _id?: unknown;
  email: string;
  passwordHash: string;
  salt: string;
  onboardingCompleted: boolean;
  profile: CompanyProfile;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface CompanyJobDocument {
  _id?: unknown;
  companyId: string;
  companyEmail: string;
  title: string;
  type: string;
  location: string;
  salary?: string;
  applyUrl: string;
  description: string;
  postedDate?: string;
  syndicatedBoards: string[];
  status: "active" | "draft" | "closed";
  applicantsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
