alter table public.jobs
  add column domain text check (domain is null or char_length(domain) <= 120),
  add column experience_level text check (
    experience_level is null
    or experience_level in ('internship', 'junior', 'mid', 'senior', 'executive')
  ),
  add column experience_min_years numeric(4, 1) check (
    experience_min_years is null
    or experience_min_years between 0 and 80
  );

create index jobs_domain_status_idx on public.jobs (domain, status);
create index jobs_experience_level_status_idx on public.jobs (experience_level, status);

create table public.saved_jobs (
  candidate_id uuid not null references public.candidates (profile_id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (candidate_id, job_id)
);

create index saved_jobs_job_id_idx on public.saved_jobs (job_id);
create index saved_jobs_candidate_saved_at_idx on public.saved_jobs (candidate_id, saved_at desc);

alter table public.saved_jobs enable row level security;

create policy saved_jobs_read_owner
  on public.saved_jobs for select to authenticated
  using (candidate_id = (select auth.uid()));

create policy saved_jobs_insert_owner_for_open_jobs
  on public.saved_jobs for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_role = 'candidate'::public.account_role
    )
    and exists (
      select 1
      from public.jobs j
      where j.id = job_id
        and j.status = 'published'::public.job_status
        and (j.closes_at is null or j.closes_at > now())
    )
  );

create policy saved_jobs_delete_owner
  on public.saved_jobs for delete to authenticated
  using (candidate_id = (select auth.uid()));

grant select, insert, delete on public.saved_jobs to authenticated;
