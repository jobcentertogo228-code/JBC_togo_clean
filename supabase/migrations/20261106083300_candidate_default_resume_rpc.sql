create or replace function public.set_candidate_default_resume(p_resume_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate_id uuid := (select auth.uid());
begin
  if v_candidate_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1
    from public.resumes r
    where r.id = p_resume_id
      and r.candidate_id = v_candidate_id
  ) then
    raise exception 'Resume not found' using errcode = 'P0002';
  end if;

  update public.resumes
  set is_default = false
  where candidate_id = v_candidate_id and is_default;

  update public.resumes
  set is_default = true
  where id = p_resume_id and candidate_id = v_candidate_id;
end;
$$;

revoke all on function public.set_candidate_default_resume(uuid) from public, anon, authenticated;
grant execute on function public.set_candidate_default_resume(uuid) to authenticated;
