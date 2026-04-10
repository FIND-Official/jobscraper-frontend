export interface Job {
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  apply_url: string;
  source: string;
  posted_date: string | null;
  tags: string[] | null;
  job_type?: string | null;
}

export interface ScrapeRequest {
  boards?: string[];
  searchQuery?: string;
  experienceLevel?: string;
  benefits?: string;
}
