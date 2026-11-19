alter table public.applications
  add column interview_at timestamptz;

drop policy applications_insert_candidate on public.applications;
create policy applications_insert_candidate
  on public.applications for insert to authenticated
  with check (
    candidate_id = (select auth.uid())
    and resume_id is not null
    and interview_at is null
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

  if new.interview_at is distinct from old.interview_at then
    select j.company_id into v_company_id
    from public.jobs j where j.id = old.job_id;

    if not public.is_admin() and not public.is_company_recruiter(v_company_id) then
      raise exception 'Only the recruiting company may schedule interviews';
    end if;
    if new.interview_at is not null and new.status <> 'interview'::public.application_status then
      raise exception 'Interview date requires interview status';
    end if;
    if new.interview_at is not null and new.interview_at <= now() then
      raise exception 'Interview date must be in the future';
    end if;
  end if;

  if new.status = 'interview'::public.application_status
     and (new.status is distinct from old.status or new.interview_at is distinct from old.interview_at)
     and new.interview_at is null then
    raise exception 'Interview status requires a scheduled date';
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

create or replace function public.notify_candidates_new_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'published'::public.job_status
     or (tg_op = 'UPDATE' and old.status = 'published'::public.job_status) then
    return new;
  end if;

  insert into public.notifications (recipient_id, type, title, body, payload)
  select
    p.id,
    'new_job',
    'Nouvelle offre',
    pg_catalog.format(
      '%s%s est à découvrir sur JOB-CENTER.',
      new.title,
      case when new.city is not null then pg_catalog.format(' à %s', new.city) else '' end
    ),
    pg_catalog.jsonb_build_object('job_id', new.id, 'job_slug', new.slug)
  from public.profiles p
  where p.account_role = 'candidate'::public.account_role;

  return new;
end;
$$;

revoke all on function public.notify_candidates_new_job() from public, anon, authenticated;

drop trigger if exists jobs_notify_candidates_after_insert on public.jobs;
create trigger jobs_notify_candidates_after_insert
  after insert on public.jobs
  for each row execute function public.notify_candidates_new_job();

drop trigger if exists jobs_notify_candidates_after_publish on public.jobs;
create trigger jobs_notify_candidates_after_publish
  after update of status on public.jobs
  for each row
  when (old.status is distinct from new.status)
  execute function public.notify_candidates_new_job();

create or replace function public.notify_candidate_application_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job_title text;
  v_company_name text;
  v_type text;
  v_title text;
  v_body text;
begin
  if new.status = 'interview'::public.application_status
     and (
       new.status is distinct from old.status
       or new.interview_at is distinct from old.interview_at
     ) then
    v_type := 'interview_scheduled';
    v_title := 'Entretien programmé';
  elsif new.status = 'accepted'::public.application_status
        and new.status is distinct from old.status then
    v_type := 'application_accepted';
    v_title := 'Candidature acceptée';
  elsif new.status = 'rejected'::public.application_status
        and new.status is distinct from old.status then
    v_type := 'application_rejected';
    v_title := 'Candidature refusée';
  else
    return new;
  end if;

  select j.title, c.name
  into v_job_title, v_company_name
  from public.jobs j
  join public.companies c on c.id = j.company_id
  where j.id = new.job_id;

  if v_type = 'interview_scheduled' then
    v_body := pg_catalog.format(
      'Entretien pour « %s » avec %s le %s (heure du Togo).',
      v_job_title,
      v_company_name,
      pg_catalog.to_char(new.interview_at at time zone 'UTC', 'DD/MM/YYYY à HH24:MI')
    );
  elsif v_type = 'application_accepted' then
    v_body := pg_catalog.format('Votre candidature pour « %s » a été acceptée par %s.', v_job_title, v_company_name);
  else
    v_body := pg_catalog.format('Votre candidature pour « %s » n’a pas été retenue par %s.', v_job_title, v_company_name);
  end if;

  insert into public.notifications (recipient_id, type, title, body, payload)
  values (
    new.candidate_id,
    v_type,
    v_title,
    v_body,
    pg_catalog.jsonb_build_object('application_id', new.id, 'job_id', new.job_id)
  );

  return new;
end;
$$;

revoke all on function public.notify_candidate_application_status() from public, anon, authenticated;

drop trigger if exists applications_notify_candidate_status on public.applications;
create trigger applications_notify_candidate_status
  after update on public.applications
  for each row
  when (old.status is distinct from new.status or old.interview_at is distinct from new.interview_at)
  execute function public.notify_candidate_application_status();

alter table public.notifications replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end
$$;
