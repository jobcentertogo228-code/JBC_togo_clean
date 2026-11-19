drop policy applications_insert_candidate on public.applications;
create policy applications_insert_candidate
  on public.applications for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and resume_id is not null
    and exists (
      select 1
      from public.resumes r
      where r.id = applications.resume_id
        and r.candidate_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and j.status = 'published'::public.job_status
        and (j.closes_at is null or j.closes_at > now())
    )
  );

create policy candidates_select_applicants_for_company
  on public.candidates for select to authenticated
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.candidate_id = candidates.profile_id
        and public.is_company_member(j.company_id)
    )
  );

create or replace function public.notify_company_new_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_company_id uuid;
  job_title text;
  candidate_name text;
begin
  select
    j.company_id,
    j.title,
    coalesce(nullif(c.display_name, ''), 'Un candidat')
  into job_company_id, job_title, candidate_name
  from public.jobs j
  left join public.candidates c on c.profile_id = new.candidate_id
  where j.id = new.job_id;

  if not found then
    return new;
  end if;

  insert into public.notifications (recipient_id, type, title, body, payload)
  select
    cm.profile_id,
    'new_application',
    'Nouvelle candidature reçue',
    pg_catalog.format('%s a postulé à « %s ».', candidate_name, job_title),
    pg_catalog.jsonb_build_object('application_id', new.id, 'job_id', new.job_id)
  from public.company_memberships cm
  where cm.company_id = job_company_id
    and cm.status = 'active'::public.membership_status
    and cm.role in (
      'owner'::public.company_membership_role,
      'admin'::public.company_membership_role,
      'recruiter'::public.company_membership_role
    );

  return new;
end;
$$;

revoke all on function public.notify_company_new_application() from public, anon, authenticated;

create trigger applications_notify_company
  after insert on public.applications
  for each row execute function public.notify_company_new_application();
