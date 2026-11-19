export type AccountRole = "admin" | "company" | "candidate";
export type CandidateVisibility = "private" | "companies_only" | "public";
export type JobStatus = "draft" | "published" | "paused" | "closed" | "archived";
export type CandidateCurrentStatus = "employed" | "unemployed" | "student" | "freelance" | "other";
export type CandidateAvailability = "immediate" | "two_weeks" | "one_month" | "three_months" | "negotiable";
export type LanguageProficiency = "basic" | "conversational" | "professional" | "native";
export type EducationLevel =
  | "none"
  | "primary"
  | "secondary"
  | "high_school"
  | "bac_plus_2"
  | "bachelor"
  | "master"
  | "doctorate";
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

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          account_role: AccountRole;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          locale: string;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          account_role?: AccountRole;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          locale?: string;
        }
      >;
      company_memberships: Table<
        {
          company_id: string;
          profile_id: string;
          role: "owner" | "admin" | "recruiter" | "viewer";
          status: "active" | "invited" | "suspended";
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          company_id: string;
          profile_id: string;
          role?: "owner" | "admin" | "recruiter" | "viewer";
          status?: "active" | "invited" | "suspended";
          invited_by?: string | null;
        }
      >;
      candidates: Table<
        {
          profile_id: string;
          candidate_code: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          photo_url: string | null;
          headline: string | null;
          summary: string | null;
          address: string | null;
          city: string | null;
          country_code: string;
          birth_date: string | null;
          nationality: string | null;
          current_status: CandidateCurrentStatus | null;
          availability: CandidateAvailability | null;
          visibility: CandidateVisibility;
          years_experience: number | null;
          desired_salary_min: number | null;
          desired_salary_max: number | null;
          salary_currency: string;
          search_document: string;
          created_at: string;
          updated_at: string;
        },
        {
          profile_id: string;
          candidate_code?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          photo_url?: string | null;
          headline?: string | null;
          summary?: string | null;
          address?: string | null;
          city?: string | null;
          country_code?: string;
          birth_date?: string | null;
          nationality?: string | null;
          current_status?: CandidateCurrentStatus | null;
          availability?: CandidateAvailability | null;
          visibility?: CandidateVisibility;
          years_experience?: number | null;
          desired_salary_min?: number | null;
          desired_salary_max?: number | null;
          salary_currency?: string;
        }
      >;
      companies: Table<
        {
          id: string;
          company_code: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          website_url: string | null;
          industry: string | null;
          company_size: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          country_code: string;
          logo_path: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          company_code?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          website_url?: string | null;
          industry?: string | null;
          company_size?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country_code?: string;
          logo_path?: string | null;
          is_verified?: boolean;
        }
      >;
      jobs: Table<
        {
          id: string;
          reference_code: string;
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
          minimum_education_level: EducationLevel | null;
          status: JobStatus;
          published_at: string | null;
          closes_at: string | null;
          search_document: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          reference_code?: string;
          company_id: string;
          created_by: string;
          title: string;
          slug: string;
          summary?: string | null;
          domain?: string | null;
          description: string;
          requirements?: string | null;
          benefits?: string | null;
          city?: string | null;
          country_code?: string;
          employment_type: "full_time" | "part_time" | "contract" | "internship" | "temporary";
          workplace_type?: "onsite" | "hybrid" | "remote";
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string;
          experience_level?: "internship" | "junior" | "mid" | "senior" | "executive" | null;
          experience_min_years?: number | null;
          minimum_education_level?: EducationLevel | null;
          status?: JobStatus;
          published_at?: string | null;
          closes_at?: string | null;
        }
      >;
      applications: Table<
        {
          id: string;
          job_id: string;
          candidate_id: string;
          resume_id: string | null;
          status: ApplicationStatus;
          cover_letter: string | null;
          interview_at: string | null;
          submitted_at: string;
          updated_at: string;
        },
        {
          id?: string;
          job_id: string;
          candidate_id: string;
          resume_id?: string | null;
          status?: ApplicationStatus;
          cover_letter?: string | null;
          interview_at?: string | null;
          submitted_at?: string;
        }
      >;
      resumes: Table<
        {
          id: string;
          candidate_id: string;
          title: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          candidate_id: string;
          title: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          is_default?: boolean;
          updated_at?: string;
        }
      >;
      notifications: Table<
        {
          id: string;
          recipient_id: string;
          type: string;
          title: string;
          body: string | null;
          payload: unknown;
          read_at: string | null;
          created_at: string;
        },
        {
          id?: string;
          recipient_id: string;
          type: string;
          title: string;
          body?: string | null;
          payload?: unknown;
          read_at?: string | null;
        }
      >;
      saved_jobs: Table<
        {
          candidate_id: string;
          job_id: string;
          saved_at: string;
        },
        {
          candidate_id: string;
          job_id: string;
          saved_at?: string;
        }
      >;
      skills: Table<
        { id: string; name: string; category: string | null; created_at: string },
        { id?: string; name: string; category?: string | null }
      >;
      candidate_skills: Table<
        {
          candidate_id: string;
          skill_id: string;
          proficiency: number | null;
          years_experience: number | null;
          created_at: string;
        },
        {
          candidate_id: string;
          skill_id: string;
          proficiency?: number | null;
          years_experience?: number | null;
        }
      >;
      job_skills: Table<
        { job_id: string; skill_id: string; is_required: boolean },
        { job_id: string; skill_id: string; is_required?: boolean }
      >;
      experiences: Table<
        {
          id: string;
          candidate_id: string;
          employer: string;
          job_title: string;
          city: string | null;
          country_code: string | null;
          start_date: string | null;
          end_date: string | null;
          is_current: boolean;
          description: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          candidate_id: string;
          employer: string;
          job_title: string;
          city?: string | null;
          country_code?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_current?: boolean;
          description?: string | null;
        }
      >;
      candidate_languages: Table<
        {
          id: string;
          candidate_id: string;
          language: string;
          proficiency: LanguageProficiency;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          candidate_id: string;
          language: string;
          proficiency: LanguageProficiency;
        }
      >;
      education: Table<
        {
          id: string;
          candidate_id: string;
          institution: string;
          qualification: string | null;
          field_of_study: string | null;
          city: string | null;
          country_code: string | null;
          start_date: string | null;
          end_date: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          candidate_id: string;
          institution: string;
          qualification?: string | null;
          field_of_study?: string | null;
          city?: string | null;
          country_code?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      company_recruitment_stats: {
        Args: { p_company_id: string };
        Returns: Array<{
          total_jobs: number;
          open_jobs: number;
          total_applications: number;
          interviews: number;
          hires: number;
        }>;
      };
      company_application_monthly_activity: {
        Args: { p_company_id: string };
        Returns: Array<{ month_start: string; application_count: number }>;
      };
      create_company: {
        Args: { p_name: string; p_slug: string };
        Returns: string;
      };
      is_applicant_for_job: {
        Args: { p_job_id: string };
        Returns: boolean;
      };
      replace_candidate_skills: {
        Args: { p_skill_ids: string[] };
        Returns: undefined;
      };
      replace_candidate_skills_with_proficiency: {
        Args: { p_proficiency_by_skill: Record<string, number>; p_skill_ids: string[] };
        Returns: undefined;
      };
      set_candidate_default_resume: {
        Args: { p_resume_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      account_role: AccountRole;
      candidate_visibility: CandidateVisibility;
      job_status: JobStatus;
      application_status: ApplicationStatus;
      company_membership_role: "owner" | "admin" | "recruiter" | "viewer";
      membership_status: "active" | "invited" | "suspended";
    };
    CompositeTypes: Record<string, never>;
  };
};
