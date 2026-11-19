export type AccountRole = "admin" | "company" | "candidate";
export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "shortlisted"
  | "interview"
  | "accepted"
  | "rejected"
  | "withdrawn";

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ProfileRow = {
  id: string;
  account_role: AccountRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
};

type CandidateRow = {
  profile_id: string;
  display_name: string | null;
  photo_url: string | null;
  headline: string | null;
  summary: string | null;
  city: string | null;
  country_code: string;
  visibility: "private" | "companies_only" | "public";
  years_experience: number | null;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  salary_currency: string;
  search_document: string;
  created_at: string;
  updated_at: string;
};

type JobRow = {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  slug: string;
  summary: string | null;
  domain: string | null;
  description: string;
  requirements: string | null;
  benefits: string | null;
  city: string | null;
  country_code: string;
  employment_type: "full_time" | "part_time" | "contract" | "internship" | "temporary";
  workplace_type: "onsite" | "hybrid" | "remote";
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  experience_level: "internship" | "junior" | "mid" | "senior" | "executive" | null;
  experience_min_years: number | null;
  minimum_education_level: string | null;
  status: "draft" | "published" | "paused" | "closed" | "archived";
  published_at: string | null;
  closes_at: string | null;
  search_document: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, {
        id: string;
        full_name?: string;
        phone?: string | null;
        avatar_url?: string | null;
        locale?: string;
      }>;
      candidates: Table<CandidateRow, {
        profile_id: string;
        display_name?: string | null;
        photo_url?: string | null;
        headline?: string | null;
        summary?: string | null;
        city?: string | null;
        country_code?: string;
        visibility?: CandidateRow["visibility"];
        years_experience?: number | null;
        desired_salary_min?: number | null;
        desired_salary_max?: number | null;
        salary_currency?: string;
      }>;
      companies: Table<{
        id: string;
        name: string;
        slug: string;
        logo_path: string | null;
      }, {
        id?: string;
        name: string;
        slug: string;
        logo_path?: string | null;
      }>;
      jobs: Table<JobRow, {
        company_id: string;
        created_by: string;
        title: string;
        slug: string;
        description: string;
        employment_type: JobRow["employment_type"];
        status?: JobRow["status"];
      }>;
      applications: Table<{
        id: string;
        job_id: string;
        candidate_id: string;
        resume_id: string | null;
        status: ApplicationStatus;
        cover_letter: string | null;
        interview_at: string | null;
        submitted_at: string;
        updated_at: string;
      }, {
        job_id: string;
        candidate_id: string;
        resume_id?: string | null;
        status?: ApplicationStatus;
      }>;
      resumes: Table<{
        id: string;
        candidate_id: string;
        title: string;
        storage_path: string;
        mime_type: string;
        size_bytes: number;
        is_default: boolean;
        created_at: string;
      }, {
        candidate_id: string;
        title: string;
        storage_path: string;
        mime_type: string;
        size_bytes: number;
        is_default?: boolean;
      }>;
      notifications: Table<{
        id: string;
        recipient_id: string;
        type: string;
        title: string;
        body: string | null;
        payload: unknown;
        read_at: string | null;
        created_at: string;
      }, {
        recipient_id: string;
        type: string;
        title: string;
        body?: string | null;
        payload?: unknown;
        read_at?: string | null;
      }>;
      saved_jobs: Table<{
        candidate_id: string;
        job_id: string;
        saved_at: string;
      }, {
        candidate_id: string;
        job_id: string;
        saved_at?: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      set_candidate_default_resume: {
        Args: { p_resume_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      account_role: AccountRole;
      application_status: ApplicationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
