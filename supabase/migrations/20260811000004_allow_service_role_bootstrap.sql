-- =====================================================================
-- JhapaRide — Phase 6 fix
-- prevent_role_change blocked ANY role change unless the acting user was
-- already an admin — including calls made with the service_role key
-- (auth.uid() is null in that context), which made it impossible to ever
-- bootstrap the first admin account. Allow the change through when
-- there's no authenticated user in context (service-role/backend calls),
-- since that already requires the secret key. Regular users are
-- unaffected: their auth.uid() is their own id, never null.
-- =====================================================================

create or replace function public.prevent_role_change()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Role cannot be changed directly';
  end if;
  return new;
end;
$$;
