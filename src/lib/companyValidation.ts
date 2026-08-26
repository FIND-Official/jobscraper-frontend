export const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.ca",
  "yahoo.fr",
  "yahoo.de",
  "yahoo.com.br",
  "yahoo.co.in",
  "yahoo.co.jp",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "hotmail.fr",
  "hotmail.de",
  "live.com",
  "live.co.uk",
  "msn.com",
  "passport.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "aim.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "zoho.com",
  "zohomail.com",
  "mail.com",
  "email.com",
  "usa.com",
  "gmx.com",
  "gmx.net",
  "gmx.de",
  "yandex.com",
  "yandex.ru",
  "ya.ru",
  "fastmail.com",
  "fastmail.fm",
  "tutanota.com",
  "tutamail.com",
  "tuta.io",
  "hey.com",
  "inbox.com",
  "mail.ru",
  "tempmail.com",
  "10minutemail.com",
  "throwawaymail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "trashmail.com",
]);

export interface CompanyProfileData {
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
  onboardingCompleted?: boolean;
}

export function validateCompanyEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = (email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmed || !emailRegex.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address." };
  }

  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Please enter a valid email address." };
  }

  const domain = parts[1];
  if (GENERIC_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: `Please use your official company/work email. Generic email providers (@${domain}) are not accepted for company accounts.`,
    };
  }

  return { isValid: true };
}
