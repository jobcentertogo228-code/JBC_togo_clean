-- Backfill Auth users created before the profile trigger was installed.
insert into public.profiles (id, account_role, full_name)
select
  u.id,
  case
    when u.raw_user_meta_data ->> 'account_role' = 'company'
      or (
        nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'company_name'), '') is not null
        and nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'company_slug'), '') is not null
      )
      then 'company'::public.account_role
    else 'candidate'::public.account_role
  end,
  pg_catalog.left(coalesce(u.raw_user_meta_data ->> 'full_name', ''), 120)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

grant select on public.profiles to authenticated;
