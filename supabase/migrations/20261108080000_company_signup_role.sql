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
  raise log 'Created company % for profile %', v_company_id, v_user_id;

  insert into public.company_memberships (company_id, profile_id, role, status)
  values (v_company_id, v_user_id, 'owner', 'active');
  raise log 'Created active owner membership for profile % and company %', v_user_id, v_company_id;

  perform pg_catalog.set_config('jbc.allow_account_role_change', 'on', true);
  update public.profiles
  set account_role = 'company'
  where id = v_user_id and account_role <> 'admin';
  raise log 'Set company profile role for profile %', v_user_id;

  return v_company_id;
end;
$$;
