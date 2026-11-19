create or replace function public.create_company(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_company_id uuid;
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
  if not exists (select 1 from public.profiles where id = v_user_id) then
    raise exception 'Profile not found';
  end if;

  select c.id
  into v_company_id
  from public.companies c
  where c.owner_id = v_user_id and c.slug = v_slug
  limit 1;

  if v_company_id is null then
    select c.id
    into v_company_id
    from public.companies c
    where c.slug = v_slug
    limit 1;

    if v_company_id is not null then
      raise exception 'Company slug is already used by another account' using errcode = '23505';
    end if;

    insert into public.companies (owner_id, name, slug)
    values (v_user_id, v_name, v_slug)
    returning id into v_company_id;
    raise log 'Created company % for profile %', v_company_id, v_user_id;
  else
    update public.companies
    set name = v_name
    where id = v_company_id;
  end if;

  insert into public.company_memberships (company_id, profile_id, role, status)
  values (v_company_id, v_user_id, 'owner', 'active')
  on conflict (company_id, profile_id)
  do update set role = 'owner', status = 'active', updated_at = pg_catalog.now();

  perform pg_catalog.set_config('jbc.allow_account_role_change', 'on', true);
  update public.profiles
  set account_role = 'company'
  where id = v_user_id and account_role <> 'admin';

  raise log 'Ensured active owner membership for profile % and company %', v_user_id, v_company_id;
  return v_company_id;
end;
$$;

revoke all on function public.create_company(text, text) from public, anon;
grant execute on function public.create_company(text, text) to authenticated;
