create or replace function public.replace_candidate_skills(p_skill_ids uuid[])
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

  if coalesce(pg_catalog.cardinality(p_skill_ids), 0) > 30 then
    raise exception 'A maximum of 30 skills may be selected' using errcode = '22023';
  end if;

  insert into public.candidates (profile_id)
  values (v_candidate_id)
  on conflict (profile_id) do nothing;

  delete from public.candidate_skills
  where candidate_id = v_candidate_id;

  insert into public.candidate_skills (candidate_id, skill_id)
  select v_candidate_id, selected.skill_id
  from (
    select distinct unnest(coalesce(p_skill_ids, array[]::uuid[])) as skill_id
  ) selected;
end;
$$;

revoke all on function public.replace_candidate_skills(uuid[]) from public, anon, authenticated;
grant execute on function public.replace_candidate_skills(uuid[]) to authenticated;
