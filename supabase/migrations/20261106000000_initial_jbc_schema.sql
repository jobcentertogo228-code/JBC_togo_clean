-- JOB-CENTER (JBC_Togo): initial Supabase/PostgreSQL schema.
-- Company access is tenant-scoped through company_memberships; profile role is not
-- used as a substitute for checking membership in a specific company.

create type public.account_role as enum ('admin', 'company', 'candidate');
create type public.candidate_visibility as enum ('private', 'companies_only', 'public');
create type public.company_membership_role as enum ('owner', 'admin', 'recruiter', 'viewer');
create type public.membership_status as enum ('active', 'invited', 'suspended');
create type public.job_status as enum ('draft', 'published', 'paused', 'closed', 'archived');
create type public.employment_type as enum ('full_time', 'part_time', 'contract', 'internship', 'temporary');
create type public.workplace_type as enum ('onsite', 'hybrid', 'remote');
create type public.application_status as enum (
  'submitted',
  'under_review',
  'shortlisted',
  'interview',
  'accepted',
  'rejected',
  'withdrawn'
);
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  account_role public.account_role not null default 'candidate',
  full_name text not null default '' check (char_length(full_name) <= 120),
  phone text check (phone is null or char_length(phone) <= 40),
  avatar_url text,
  locale text not null default 'fr-TG' check (char_length(locale) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidates (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 120),
  photo_url text,
  headline text check (headline is null or char_length(headline) <= 160),
  summary text check (summary is null or char_length(summary) <= 10000),
  city text check (city is null or char_length(city) <= 120),
  country_code char(2) not null default 'TG',
  visibility public.candidate_visibility not null default 'companies_only',
  years_experience numeric(4, 1) check (years_experience is null or years_experience between 0 and 80),
  desired_salary_min numeric(12, 2) check (desired_salary_min is null or desired_salary_min >= 0),
  desired_salary_max numeric(12, 2) check (desired_salary_max is null or desired_salary_max >= 0),
  salary_currency char(3) not null default 'XOF',
  search_document tsvector generated always as (
    to_tsvector('simple'::regconfig, coalesce(headline, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(city, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (desired_salary_min is null or desired_salary_max is null or desired_salary_min <= desired_salary_max)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 10000),
  website_url text,
  industry text check (industry is null or char_length(industry) <= 120),
  company_size text check (company_size is null or company_size in ('1-10', '11-50', '51-200', '201-500', '501+')),
  city text check (city is null or char_length(city) <= 120),
  country_code char(2) not null default 'TG',
  logo_path text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_memberships (
  company_id uuid not null references public.companies (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.company_membership_role not null default 'recruiter',
  status public.membership_status not null default 'active',
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, profile_id)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary text check (summary is null or char_length(summary) <= 1000),
  description text not null check (char_length(description) between 20 and 30000),
  requirements text,
  benefits text,
  city text check (city is null or char_length(city) <= 120),
  country_code char(2) not null default 'TG',
  employment_type public.employment_type not null,
  workplace_type public.workplace_type not null default 'onsite',
  salary_min numeric(12, 2) check (salary_min is null or salary_min >= 0),
  salary_max numeric(12, 2) check (salary_max is null or salary_max >= 0),
  salary_currency char(3) not null default 'XOF',
  status public.job_status not null default 'draft',
  published_at timestamptz,
  closes_at timestamptz,
  search_document tsvector generated always as (
    to_tsvector(
      'simple'::regconfig,
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, '') || ' ' || coalesce(city, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (salary_min is null or salary_max is null or salary_min <= salary_max),
  check (closes_at is null or published_at is null or closes_at > published_at),
  check (status <> 'published'::public.job_status or published_at is not null)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  category text check (category is null or char_length(category) <= 80),
  created_at timestamptz not null default now()
);

create table public.candidate_skills (
  candidate_id uuid not null references public.candidates (profile_id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  proficiency smallint check (proficiency is null or proficiency between 1 and 5),
  years_experience numeric(4, 1) check (years_experience is null or years_experience between 0 and 80),
  created_at timestamptz not null default now(),
  primary key (candidate_id, skill_id)
);

create table public.job_skills (
  job_id uuid not null references public.jobs (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete restrict,
  is_required boolean not null default true,
  primary key (job_id, skill_id)
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (profile_id) on delete cascade,
  institution text not null check (char_length(institution) between 1 and 180),
  qualification text check (qualification is null or char_length(qualification) <= 180),
  field_of_study text check (field_of_study is null or char_length(field_of_study) <= 180),
  city text,
  country_code char(2),
  start_date date,
  end_date date,
  description text check (description is null or char_length(description) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date is null or end_date is null or end_date >= start_date)
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (profile_id) on delete cascade,
  employer text not null check (char_length(employer) between 1 and 180),
  job_title text not null check (char_length(job_title) between 1 and 180),
  city text,
  country_code char(2),
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text check (description is null or char_length(description) <= 8000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (start_date is null or end_date is null or end_date >= start_date),
  check (not is_current or end_date is null)
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (profile_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  storage_path text not null unique,
  mime_type text not null check (mime_type in (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, candidate_id)
);

create unique index resumes_one_default_per_candidate_idx
  on public.resumes (candidate_id) where is_default;

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  candidate_id uuid not null references public.candidates (profile_id) on delete cascade,
  resume_id uuid,
  status public.application_status not null default 'submitted',
  cover_letter text check (cover_letter is null or char_length(cover_letter) <= 10000),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id),
  foreign key (resume_id, candidate_id)
    references public.resumes (id, candidate_id)
    on delete no action deferrable initially deferred
);

create table public.application_status_history (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  old_status public.application_status,
  new_status public.application_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (char_length(type) between 1 and 80),
  title text not null check (char_length(title) between 1 and 180),
  body text check (body is null or char_length(body) <= 2000),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete restrict,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  provider text not null default 'manual' check (char_length(provider) between 1 and 40),
  provider_customer_id text,
  provider_subscription_id text,
  plan_code text not null check (char_length(plan_code) between 1 and 60),
  status public.subscription_status not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    current_period_start is null
    or current_period_end is null
    or current_period_end > current_period_start
  )
);

create index candidates_visibility_idx on public.candidates (visibility);
create index candidates_search_document_idx on public.candidates using gin (search_document);
create index companies_owner_id_idx on public.companies (owner_id);
create index company_memberships_profile_status_idx on public.company_memberships (profile_id, status);
create index company_memberships_company_role_status_idx on public.company_memberships (company_id, role, status);
create index jobs_company_status_created_idx on public.jobs (company_id, status, created_at desc);
create index jobs_publication_idx on public.jobs (published_at desc) where status = 'published';
create index jobs_location_type_idx on public.jobs (country_code, city, employment_type, workplace_type);
create index jobs_search_document_idx on public.jobs using gin (search_document);
create index candidate_skills_skill_id_idx on public.candidate_skills (skill_id);
create index job_skills_skill_id_idx on public.job_skills (skill_id);
create index education_candidate_start_idx on public.education (candidate_id, start_date desc);
create index experiences_candidate_start_idx on public.experiences (candidate_id, start_date desc);
create index resumes_candidate_created_idx on public.resumes (candidate_id, created_at desc);
create index applications_candidate_submitted_idx on public.applications (candidate_id, submitted_at desc);
create index applications_job_status_submitted_idx on public.applications (job_id, status, submitted_at desc);
create index application_status_history_application_changed_idx
  on public.application_status_history (application_id, changed_at desc);
create index notifications_unread_recipient_idx
  on public.notifications (recipient_id, created_at desc) where read_at is null;
create index messages_application_created_idx on public.messages (application_id, created_at);
create index subscriptions_company_status_idx on public.subscriptions (company_id, status);
create index subscriptions_provider_customer_idx on public.subscriptions (provider, provider_customer_id);
create unique index subscriptions_provider_subscription_unique_idx
  on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;

create unique index skills_name_unique_lower_idx on public.skills (lower(name));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_account_role public.account_role;
begin
  v_account_role := case
    when new.raw_user_meta_data ->> 'account_role' = 'company'
      or (
        nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'company_name'), '') is not null
        and nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'company_slug'), '') is not null
      )
      then 'company'::public.account_role
    else 'candidate'::public.account_role
  end;

  insert into public.profiles (id, account_role, full_name)
  values (
    new.id,
    v_account_role,
    pg_catalog.left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120)
  );

  raise log 'Created profile for auth user %, role %', new.id, v_account_role;
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.account_role = 'admin'::public.account_role
  );
$$;

create or replace function public.is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = p_company_id
      and cm.profile_id = (select auth.uid())
      and cm.status = 'active'::public.membership_status
  );
$$;

create or replace function public.is_company_manager(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = p_company_id
      and cm.profile_id = (select auth.uid())
      and cm.status = 'active'::public.membership_status
      and cm.role in ('owner'::public.company_membership_role, 'admin'::public.company_membership_role)
  );
$$;

create or replace function public.is_company_recruiter(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships cm
    where cm.company_id = p_company_id
      and cm.profile_id = (select auth.uid())
      and cm.status = 'active'::public.membership_status
      and cm.role in (
        'owner'::public.company_membership_role,
        'admin'::public.company_membership_role,
        'recruiter'::public.company_membership_role
      )
  );
$$;

create or replace function public.can_view_candidate(p_candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_candidate_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1
      from public.candidates c
      where c.profile_id = p_candidate_id
        and (
          c.visibility = 'public'::public.candidate_visibility
          or (
            c.visibility = 'companies_only'::public.candidate_visibility
            and exists (
              select 1
              from public.company_memberships cm
              where cm.profile_id = (select auth.uid())
                and cm.status = 'active'::public.membership_status
            )
          )
        )
    );
$$;

create or replace function public.can_read_resume(p_resume_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.resumes r
    where r.id = p_resume_id
      and (
        r.candidate_id = (select auth.uid())
        or public.is_admin()
        or exists (
          select 1
          from public.applications a
          join public.jobs j on j.id = a.job_id
          where a.resume_id = r.id
            and public.is_company_member(j.company_id)
        )
      )
  );
$$;

create or replace function public.can_read_resume_object(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (storage.foldername(p_object_name))[1] = (select auth.uid())::text
    or public.is_admin()
    or exists (
      select 1
      from public.resumes r
      join public.applications a on a.resume_id = r.id
      join public.jobs j on j.id = a.job_id
      where r.storage_path = p_object_name
        and public.is_company_member(j.company_id)
    );
$$;

create or replace function public.can_view_application(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.id = p_application_id
      and (
        a.candidate_id = (select auth.uid())
        or public.is_admin()
        or public.is_company_member(j.company_id)
      )
  );
$$;

create or replace function public.can_send_application_message(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.id = p_application_id
      and (
        a.candidate_id = (select auth.uid())
        or public.is_admin()
        or public.is_company_recruiter(j.company_id)
      )
  );
$$;

create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.account_role is distinct from old.account_role
     and pg_catalog.current_setting('jbc.allow_account_role_change', true) is distinct from 'on'
     and current_user not in ('postgres', 'service_role')
     and not public.is_admin() then
    raise exception 'Changing account_role is not permitted';
  end if;
  return new;
end;
$$;

create or replace function public.guard_company_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.owner_id is distinct from old.owner_id
    or new.is_verified is distinct from old.is_verified
  ) and current_user not in ('postgres', 'service_role') and not public.is_admin() then
    raise exception 'Changing company ownership or verification requires a platform administrator';
  end if;
  return new;
end;
$$;

create or replace function public.guard_company_membership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  select c.owner_id into v_owner_id
  from public.companies c
  where c.id = new.company_id;

  if new.role = 'owner'::public.company_membership_role
     and new.profile_id is distinct from v_owner_id then
    raise exception 'The owner membership must match companies.owner_id';
  end if;

  if tg_op = 'UPDATE' then
    if new.company_id is distinct from old.company_id
       or new.profile_id is distinct from old.profile_id then
      raise exception 'Company membership identity is immutable';
    end if;

    if old.role = 'owner'::public.company_membership_role
       and new.role is distinct from old.role
       and current_user not in ('postgres', 'service_role')
       and not public.is_admin() then
      raise exception 'Company ownership cannot be changed through membership editing';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.guard_job_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.company_id is distinct from old.company_id
     or new.created_by is distinct from old.created_by then
    raise exception 'Job ownership is immutable';
  end if;
  return new;
end;
$$;

create or replace function public.guard_application_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  if new.job_id is distinct from old.job_id
     or new.candidate_id is distinct from old.candidate_id
     or new.resume_id is distinct from old.resume_id
     or new.cover_letter is distinct from old.cover_letter
     or new.submitted_at is distinct from old.submitted_at then
    raise exception 'Application details are immutable after submission';
  end if;

  if new.status is distinct from old.status and not public.is_admin() then
    if old.candidate_id = (select auth.uid()) then
      if new.status <> 'withdrawn'::public.application_status
         or old.status in (
           'accepted'::public.application_status,
           'rejected'::public.application_status,
           'withdrawn'::public.application_status
         ) then
        raise exception 'Candidate may only withdraw an active application';
      end if;
    else
      select j.company_id into v_company_id
      from public.jobs j where j.id = old.job_id;
      if not public.is_company_recruiter(v_company_id) then
        raise exception 'Only the recruiting company may change application status';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.record_application_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_status_history (application_id, old_status, new_status, changed_by)
    values (new.id, null, new.status, (select auth.uid()));
  elsif new.status is distinct from old.status then
    insert into public.application_status_history (application_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end;
$$;

create or replace function public.create_company(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid := pg_catalog.gen_random_uuid();
  v_name text := pg_catalog.btrim(p_name);
  v_slug text := pg_catalog.lower(pg_catalog.btrim(p_slug));
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if v_name is null or pg_catalog.char_length(v_name) not between 2 and 180 then
    raise exception 'Company name must contain between 2 and 180 characters' using errcode = '22023';
  end if;
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Invalid company slug' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles p where p.id = v_user_id) then
    raise exception 'Profile not found';
  end if;

  insert into public.companies (id, owner_id, name, slug)
  values (v_company_id, v_user_id, v_name, v_slug);

  insert into public.company_memberships (company_id, profile_id, role, status)
  values (v_company_id, v_user_id, 'owner', 'active');

  perform pg_catalog.set_config('jbc.allow_account_role_change', 'on', true);
  update public.profiles
  set account_role = 'company'
  where id = v_user_id and account_role <> 'admin';

  return v_company_id;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger candidates_set_updated_at
  before update on public.candidates
  for each row execute function public.set_updated_at();
create trigger companies_guard_owner
  before update on public.companies
  for each row execute function public.guard_company_owner_change();
create trigger companies_set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();
create trigger company_memberships_guard
  before insert or update on public.company_memberships
  for each row execute function public.guard_company_membership();
create trigger company_memberships_set_updated_at
  before update on public.company_memberships
  for each row execute function public.set_updated_at();
create trigger jobs_guard_update
  before update on public.jobs
  for each row execute function public.guard_job_update();
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger education_set_updated_at
  before update on public.education
  for each row execute function public.set_updated_at();
create trigger experiences_set_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();
create trigger applications_guard_update
  before update on public.applications
  for each row execute function public.guard_application_update();
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();
create trigger applications_record_status
  after insert or update on public.applications
  for each row execute function public.record_application_status();
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.candidates enable row level security;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.jobs enable row level security;
alter table public.skills enable row level security;
alter table public.candidate_skills enable row level security;
alter table public.job_skills enable row level security;
alter table public.education enable row level security;
alter table public.experiences enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.subscriptions enable row level security;

create policy profiles_select_visible
  on public.profiles for select to anon, authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update_self_or_admin
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy candidates_select_visible
  on public.candidates for select to anon, authenticated
  using (public.can_view_candidate(profile_id));
create policy candidates_insert_self
  on public.candidates for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy candidates_update_self_or_admin
  on public.candidates for update to authenticated
  using (profile_id = (select auth.uid()) or public.is_admin())
  with check (profile_id = (select auth.uid()) or public.is_admin());
create policy candidates_delete_self_or_admin
  on public.candidates for delete to authenticated
  using (profile_id = (select auth.uid()) or public.is_admin());

create policy companies_public_read
  on public.companies for select to anon, authenticated
  using (true);
create policy companies_update_manager
  on public.companies for update to authenticated
  using (public.is_company_manager(id) or public.is_admin())
  with check (public.is_company_manager(id) or public.is_admin());

create policy company_memberships_read_scoped
  on public.company_memberships for select to authenticated
  using (
    profile_id = (select auth.uid())
    or public.is_company_member(company_id)
    or public.is_admin()
  );
create policy company_memberships_insert_scoped
  on public.company_memberships for insert to authenticated
  with check (
    (
      profile_id = (select auth.uid())
      and role = 'owner'::public.company_membership_role
      and exists (
        select 1 from public.companies c
        where c.id = company_id and c.owner_id = (select auth.uid())
      )
    )
    or public.is_admin()
  );
create policy company_memberships_update_manager
  on public.company_memberships for update to authenticated
  using (public.is_company_manager(company_id) or public.is_admin())
  with check (
    (public.is_company_manager(company_id) and role <> 'owner'::public.company_membership_role)
    or public.is_admin()
  );
create policy company_memberships_delete_scoped
  on public.company_memberships for delete to authenticated
  using (
    (public.is_company_manager(company_id) and role <> 'owner'::public.company_membership_role)
    or (profile_id = (select auth.uid()) and role <> 'owner'::public.company_membership_role)
    or public.is_admin()
  );

create policy jobs_read_published_or_tenant
  on public.jobs for select to anon, authenticated
  using (
    (
      status = 'published'::public.job_status
      and (closes_at is null or closes_at > now())
    )
    or public.is_company_member(company_id)
    or public.is_admin()
  );
create policy jobs_insert_recruiter
  on public.jobs for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (public.is_company_recruiter(company_id) or public.is_admin())
  );
create policy jobs_update_recruiter
  on public.jobs for update to authenticated
  using (public.is_company_recruiter(company_id) or public.is_admin())
  with check (public.is_company_recruiter(company_id) or public.is_admin());

create policy skills_read
  on public.skills for select to anon, authenticated using (true);
create policy skills_manage_admin
  on public.skills for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy candidate_skills_read_visible
  on public.candidate_skills for select to anon, authenticated
  using (public.can_view_candidate(candidate_id));
create policy candidate_skills_insert_self
  on public.candidate_skills for insert to authenticated
  with check (candidate_id = (select auth.uid()));
create policy candidate_skills_update_self
  on public.candidate_skills for update to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin())
  with check (candidate_id = (select auth.uid()) or public.is_admin());
create policy candidate_skills_delete_self
  on public.candidate_skills for delete to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin());

create policy job_skills_read_published_or_tenant
  on public.job_skills for select to anon, authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id
        and (
          j.status = 'published'::public.job_status
          or public.is_company_member(j.company_id)
          or public.is_admin()
        )
    )
  );
create policy job_skills_insert_recruiter
  on public.job_skills for insert to authenticated
  with check (
    exists (
      select 1 from public.jobs j
      where j.id = job_id
        and (public.is_company_recruiter(j.company_id) or public.is_admin())
    )
  );
create policy job_skills_update_recruiter
  on public.job_skills for update to authenticated
  using (
    exists (select 1 from public.jobs j where j.id = job_id and (public.is_company_recruiter(j.company_id) or public.is_admin()))
  )
  with check (
    exists (select 1 from public.jobs j where j.id = job_id and (public.is_company_recruiter(j.company_id) or public.is_admin()))
  );
create policy job_skills_delete_recruiter
  on public.job_skills for delete to authenticated
  using (
    exists (select 1 from public.jobs j where j.id = job_id and (public.is_company_recruiter(j.company_id) or public.is_admin()))
  );

create policy education_read_visible
  on public.education for select to anon, authenticated
  using (public.can_view_candidate(candidate_id));
create policy education_insert_self
  on public.education for insert to authenticated
  with check (candidate_id = (select auth.uid()));
create policy education_update_self
  on public.education for update to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin())
  with check (candidate_id = (select auth.uid()) or public.is_admin());
create policy education_delete_self
  on public.education for delete to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin());

create policy experiences_read_visible
  on public.experiences for select to anon, authenticated
  using (public.can_view_candidate(candidate_id));
create policy experiences_insert_self
  on public.experiences for insert to authenticated
  with check (candidate_id = (select auth.uid()));
create policy experiences_update_self
  on public.experiences for update to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin())
  with check (candidate_id = (select auth.uid()) or public.is_admin());
create policy experiences_delete_self
  on public.experiences for delete to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin());

create policy resumes_read_owner_or_applicant_company
  on public.resumes for select to authenticated
  using (public.can_read_resume(id));
create policy resumes_insert_owner
  on public.resumes for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and storage_path like (select auth.uid())::text || '/%'
  );
create policy resumes_update_owner
  on public.resumes for update to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin())
  with check (
    (candidate_id = (select auth.uid()) and storage_path like (select auth.uid())::text || '/%')
    or public.is_admin()
  );
create policy resumes_delete_owner
  on public.resumes for delete to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin());

create policy applications_read_participants
  on public.applications for select to authenticated
  using (
    candidate_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_company_member(j.company_id)
    )
  );
create policy applications_insert_candidate
  on public.applications for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and exists (
      select 1 from public.jobs j
      where j.id = job_id
        and j.status = 'published'::public.job_status
        and (j.closes_at is null or j.closes_at > now())
    )
  );
create policy applications_update_participants
  on public.applications for update to authenticated
  using (
    candidate_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_company_recruiter(j.company_id)
    )
  )
  with check (
    candidate_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_company_recruiter(j.company_id)
    )
  );

create policy application_history_read_participants
  on public.application_status_history for select to authenticated
  using (public.can_view_application(application_id));

create policy notifications_read_recipient
  on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()) or public.is_admin());
create policy notifications_update_recipient
  on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid()) or public.is_admin())
  with check (recipient_id = (select auth.uid()) or public.is_admin());

create policy messages_read_application_participants
  on public.messages for select to authenticated
  using (public.can_view_application(application_id));
create policy messages_insert_application_participant
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.can_send_application_message(application_id)
  );

create policy subscriptions_read_company_managers
  on public.subscriptions for select to authenticated
  using (public.is_company_manager(company_id) or public.is_admin());
create policy subscriptions_manage_admin
  on public.subscriptions for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Supabase Storage bucket for private candidate CVs. Object paths must begin with
-- the candidate's auth UUID; companies can read a CV only after an application.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-resumes',
  'candidate-resumes',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy candidate_resume_objects_read
  on storage.objects for select to authenticated
  using (
    bucket_id = 'candidate-resumes'
    and public.can_read_resume_object(name)
  );
create policy candidate_resume_objects_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'candidate-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy candidate_resume_objects_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'candidate-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'candidate-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy candidate_resume_objects_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'candidate-resumes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Grant SQL privileges; RLS policies above remain the row-level authorization boundary.
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.candidates, public.companies, public.jobs, public.skills,
  public.candidate_skills, public.job_skills, public.education, public.experiences
  to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant insert, update, delete on public.candidates, public.candidate_skills, public.education, public.experiences
  to authenticated;
grant select, update on public.companies to authenticated;
grant select, insert, update, delete on public.company_memberships to authenticated;
grant insert, update on public.jobs to authenticated;
grant insert, update, delete on public.job_skills to authenticated;
grant insert, update, delete on public.skills to authenticated;
grant select, insert, update, delete on public.resumes to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select on public.application_status_history to authenticated;
grant select, update on public.notifications to authenticated;
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select, insert on public.messages to authenticated;
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to authenticated;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.guard_profile_role_change() from public, anon, authenticated;
revoke all on function public.guard_company_owner_change() from public, anon, authenticated;
revoke all on function public.guard_company_membership() from public, anon, authenticated;
revoke all on function public.guard_job_update() from public, anon, authenticated;
revoke all on function public.guard_application_update() from public, anon, authenticated;
revoke all on function public.record_application_status() from public, anon, authenticated;
revoke all on function public.create_company(text, text) from public, anon;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.is_company_member(uuid) from public, anon, authenticated;
revoke all on function public.is_company_manager(uuid) from public, anon, authenticated;
revoke all on function public.is_company_recruiter(uuid) from public, anon, authenticated;
revoke all on function public.can_view_candidate(uuid) from public, anon, authenticated;
revoke all on function public.can_read_resume(uuid) from public, anon, authenticated;
revoke all on function public.can_read_resume_object(text) from public, anon, authenticated;
revoke all on function public.can_view_application(uuid) from public, anon, authenticated;
revoke all on function public.can_send_application_message(uuid) from public, anon, authenticated;

grant execute on function public.create_company(text, text) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_company_member(uuid) to anon, authenticated;
grant execute on function public.is_company_manager(uuid) to authenticated;
grant execute on function public.is_company_recruiter(uuid) to authenticated;
grant execute on function public.can_view_candidate(uuid) to anon, authenticated;
grant execute on function public.can_read_resume(uuid) to authenticated;
grant execute on function public.can_read_resume_object(text) to authenticated;
grant execute on function public.can_view_application(uuid) to authenticated;
grant execute on function public.can_send_application_message(uuid) to authenticated;
