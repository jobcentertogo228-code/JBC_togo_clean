create or replace function public.is_applicant_for_job(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications a
    where a.job_id = p_job_id
      and a.candidate_id = (select auth.uid())
  );
$$;

revoke all on function public.is_applicant_for_job(uuid) from public, anon, authenticated;
grant execute on function public.is_applicant_for_job(uuid) to anon, authenticated;

drop policy jobs_read_published_or_tenant on public.jobs;

create policy jobs_read_published_or_tenant
  on public.jobs for select to anon, authenticated
  using (
    public.is_applicant_for_job(id)
    or (
      status = 'published'::public.job_status
      and (closes_at is null or closes_at > now())
    )
    or public.is_company_member(company_id)
    or public.is_admin()
  );
