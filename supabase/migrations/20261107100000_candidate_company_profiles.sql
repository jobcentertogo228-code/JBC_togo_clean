create sequence public.candidate_code_seq;
create sequence public.company_code_seq;
create sequence public.job_reference_seq;

alter table public.candidates
  add column candidate_code text unique,
  add column first_name text check (first_name is null or char_length(first_name) <= 80),
  add column last_name text check (last_name is null or char_length(last_name) <= 80),
  add column address text check (address is null or char_length(address) <= 240),
  add column birth_date date check (birth_date is null or birth_date <= current_date),
  add column nationality text check (nationality is null or char_length(nationality) <= 80),
  add column current_status text check (
    current_status is null or current_status in ('employed', 'unemployed', 'student', 'freelance', 'other')
  ),
  add column availability text check (
    availability is null or availability in ('immediate', 'two_weeks', 'one_month', 'three_months', 'negotiable')
  );

alter table public.companies
  add column company_code text unique,
  add column email text check (email is null or char_length(email) <= 254),
  add column phone text check (phone is null or char_length(phone) <= 40),
  add column address text check (address is null or char_length(address) <= 240);

alter table public.jobs
  add column reference_code text unique;

with ordered_candidates as (
  select profile_id, row_number() over (order by created_at, profile_id) as row_number
  from public.candidates
)
update public.candidates c
set candidate_code = 'JBC-CAN-' || case
  when ordered_candidates.row_number < 1000000 then pg_catalog.lpad(ordered_candidates.row_number::text, 6, '0')
  else ordered_candidates.row_number::text
end
from ordered_candidates
where c.profile_id = ordered_candidates.profile_id;

select pg_catalog.setval(
  'public.candidate_code_seq',
  greatest((select count(*) from public.candidates), 1),
  (select count(*) > 0 from public.candidates)
);

with ordered_companies as (
  select id, row_number() over (order by created_at, id) as row_number
  from public.companies
)
update public.companies c
set company_code = 'JBC-ENT-' || case
  when ordered_companies.row_number < 1000000 then pg_catalog.lpad(ordered_companies.row_number::text, 6, '0')
  else ordered_companies.row_number::text
end
from ordered_companies
where c.id = ordered_companies.id;

select pg_catalog.setval(
  'public.company_code_seq',
  greatest((select count(*) from public.companies), 1),
  (select count(*) > 0 from public.companies)
);

with ordered_jobs as (
  select id, row_number() over (order by created_at, id) as row_number
  from public.jobs
)
update public.jobs j
set reference_code = 'JOB-' || case
  when ordered_jobs.row_number < 1000000 then pg_catalog.lpad(ordered_jobs.row_number::text, 6, '0')
  else ordered_jobs.row_number::text
end
from ordered_jobs
where j.id = ordered_jobs.id;

select pg_catalog.setval(
  'public.job_reference_seq',
  greatest((select count(*) from public.jobs), 1),
  (select count(*) > 0 from public.jobs)
);

create or replace function public.assign_business_reference()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_number bigint;
begin
  if tg_table_name = 'candidates' then
    v_number := nextval('public.candidate_code_seq');
    new.candidate_code := 'JBC-CAN-' ||
      case when v_number < 1000000 then pg_catalog.lpad(v_number::text, 6, '0') else v_number::text end;
  elsif tg_table_name = 'companies' then
    v_number := nextval('public.company_code_seq');
    new.company_code := 'JBC-ENT-' ||
      case when v_number < 1000000 then pg_catalog.lpad(v_number::text, 6, '0') else v_number::text end;
  elsif tg_table_name = 'jobs' then
    v_number := nextval('public.job_reference_seq');
    new.reference_code := 'JOB-' ||
      case when v_number < 1000000 then pg_catalog.lpad(v_number::text, 6, '0') else v_number::text end;
  end if;
  return new;
end;
$$;

create trigger candidates_assign_reference
  before insert on public.candidates
  for each row execute function public.assign_business_reference();
create trigger companies_assign_reference
  before insert on public.companies
  for each row execute function public.assign_business_reference();
create trigger jobs_assign_reference
  before insert on public.jobs
  for each row execute function public.assign_business_reference();

revoke all on function public.assign_business_reference() from public, anon, authenticated;

create table public.candidate_languages (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (profile_id) on delete cascade,
  language text not null check (char_length(language) between 2 and 80),
  proficiency text not null check (proficiency in ('basic', 'conversational', 'professional', 'native')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index candidate_languages_unique_language_idx
  on public.candidate_languages (candidate_id, lower(language));
create index candidate_languages_candidate_idx
  on public.candidate_languages (candidate_id, created_at);

create trigger candidate_languages_set_updated_at
  before update on public.candidate_languages
  for each row execute function public.set_updated_at();

alter table public.candidate_languages enable row level security;

create policy candidate_languages_read_visible
  on public.candidate_languages for select to anon, authenticated
  using (public.can_view_candidate(candidate_id));
create policy candidate_languages_insert_self
  on public.candidate_languages for insert to authenticated
  with check (candidate_id = (select auth.uid()));
create policy candidate_languages_update_self
  on public.candidate_languages for update to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin())
  with check (candidate_id = (select auth.uid()) or public.is_admin());
create policy candidate_languages_delete_self
  on public.candidate_languages for delete to authenticated
  using (candidate_id = (select auth.uid()) or public.is_admin());

grant select on public.candidate_languages to anon, authenticated;
grant insert, update, delete on public.candidate_languages to authenticated;

create or replace function public.guard_company_verification_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_verified is distinct from old.is_verified and not public.is_admin() then
    raise exception 'Only an administrator may change company verification status';
  end if;
  return new;
end;
$$;

create trigger companies_guard_verification
  before update on public.companies
  for each row execute function public.guard_company_verification_change();

revoke all on function public.guard_company_verification_change() from public, anon, authenticated;

alter table public.resumes
  add column updated_at timestamptz not null default now();

update public.resumes set updated_at = created_at;

create trigger resumes_set_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

update storage.buckets
set allowed_mime_types = array['application/pdf']
where id = 'candidate-resumes';

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
        or exists (
          select 1
          from public.candidates c
          where c.profile_id = r.candidate_id
            and c.visibility <> 'private'::public.candidate_visibility
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
    )
    or exists (
      select 1
      from public.resumes r
      join public.candidates c on c.profile_id = r.candidate_id
      where r.storage_path = p_object_name
        and c.visibility <> 'private'::public.candidate_visibility
        and exists (
          select 1
          from public.company_memberships cm
          where cm.profile_id = (select auth.uid())
            and cm.status = 'active'::public.membership_status
        )
    );
$$;

revoke all on function public.can_read_resume(uuid) from public, anon;
revoke all on function public.can_read_resume_object(text) from public, anon;
grant execute on function public.can_read_resume(uuid) to authenticated;
grant execute on function public.can_read_resume_object(text) to authenticated;

create policy jobs_delete_recruiter
  on public.jobs for delete to authenticated
  using (
    (status in ('draft'::public.job_status, 'archived'::public.job_status)
      and public.is_company_recruiter(company_id))
    or public.is_admin()
  );
grant delete on public.jobs to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('candidate-avatars', 'candidate-avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('company-logos', 'company-logos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

update public.candidates
set photo_url = pg_catalog.split_part(photo_url, '/storage/v1/object/public/candidate-avatars/', 2)
where photo_url like '%/storage/v1/object/public/candidate-avatars/%';

create policy candidate_avatars_read_visible
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'candidate-avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
      or exists (
        select 1
        from public.candidates c
        where c.photo_url = storage.objects.name
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
      )
    )
  );
create policy candidate_avatars_insert_owner
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'candidate-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy candidate_avatars_update_owner
  on storage.objects for update to authenticated
  using (
    bucket_id = 'candidate-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'candidate-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy candidate_avatars_delete_owner
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'candidate-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy company_logos_read_public
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'company-logos');
create policy company_logos_insert_owner
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy company_logos_update_owner
  on storage.objects for update to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy company_logos_delete_owner
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create function public.company_recruitment_stats(p_company_id uuid)
returns table (
  total_jobs bigint,
  open_jobs bigint,
  total_applications bigint,
  interviews bigint,
  hires bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(distinct j.id),
    count(distinct j.id) filter (
      where j.status = 'published'::public.job_status
        and (j.closes_at is null or j.closes_at > pg_catalog.now())
    ),
    count(a.id),
    count(a.id) filter (where a.status = 'interview'::public.application_status),
    count(a.id) filter (where a.status = 'accepted'::public.application_status)
  from public.jobs j
  left join public.applications a on a.job_id = j.id
  where j.company_id = p_company_id
    and public.is_company_member(p_company_id);
$$;

create function public.company_application_monthly_activity(p_company_id uuid)
returns table (
  month_start date,
  application_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with months as (
  select (
    pg_catalog.date_trunc('month', pg_catalog.now())::date
    - (month_offset * interval '1 month')
  )::date as month_start
  from pg_catalog.generate_series(0, 5) as offsets(month_offset)
  )
  select
    m.month_start,
    count(a.id)
  from months m
  left join public.jobs j
    on j.company_id = p_company_id
    and public.is_company_member(p_company_id)
  left join public.applications a
    on a.job_id = j.id
    and a.submitted_at >= m.month_start
    and a.submitted_at < (m.month_start + interval '1 month')
  group by m.month_start
  order by m.month_start;
$$;

revoke all on function public.company_recruitment_stats(uuid) from public, anon;
revoke all on function public.company_application_monthly_activity(uuid) from public, anon;
grant execute on function public.company_recruitment_stats(uuid) to authenticated;
grant execute on function public.company_application_monthly_activity(uuid) to authenticated;

create function public.replace_candidate_skills_with_proficiency(
  p_skill_ids uuid[],
  p_proficiency_by_skill jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate_id uuid := (select auth.uid());
  v_skill_id uuid;
  v_level text;
begin
  if v_candidate_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if coalesce(pg_catalog.cardinality(p_skill_ids), 0) > 30 then
    raise exception 'A maximum of 30 skills may be selected' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_proficiency_by_skill) is distinct from 'object' then
    raise exception 'Skill proficiency values must be an object' using errcode = '22023';
  end if;

  for v_skill_id in
    select distinct selected.skill_id
    from pg_catalog.unnest(coalesce(p_skill_ids, array[]::uuid[])) as selected(skill_id)
  loop
    v_level := p_proficiency_by_skill ->> v_skill_id::text;
    if v_level is null or v_level !~ '^[1-5]$' then
      raise exception 'Each selected skill must have a proficiency from 1 to 5' using errcode = '22023';
    end if;
  end loop;

  insert into public.candidates (profile_id)
  values (v_candidate_id)
  on conflict (profile_id) do nothing;

  delete from public.candidate_skills
  where candidate_id = v_candidate_id;

  insert into public.candidate_skills (candidate_id, skill_id, proficiency)
  select v_candidate_id, selected.skill_id, (p_proficiency_by_skill ->> selected.skill_id::text)::smallint
  from (
    select distinct unnest(coalesce(p_skill_ids, array[]::uuid[])) as skill_id
  ) selected;
end;
$$;

revoke all on function public.replace_candidate_skills_with_proficiency(uuid[], jsonb) from public, anon, authenticated;
grant execute on function public.replace_candidate_skills_with_proficiency(uuid[], jsonb) to authenticated;
