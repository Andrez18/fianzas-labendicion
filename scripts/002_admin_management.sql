-- =============================================================
-- Gestión de administradores
-- Pega TODO este código en: Supabase Dashboard > SQL Editor > New query
-- Luego presiona "Run".
--
-- Qué hace:
--  1) Crea la tabla public.admins (quién es administrador).
--  2) El PRIMER usuario que se registre en /auth/sign-up se vuelve
--     admin automáticamente (bootstrap). Cualquier registro
--     posterior en esa página NO otorga acceso de admin.
--  3) A partir de ahí, solo un admin ya existente puede crear
--     nuevos admins (desde el panel, usando la service role key).
--  4) Las políticas de clients/loans/storage ahora exigen ser
--     miembro de public.admins, no solo estar autenticado.
-- =============================================================

-- -------------------------------------------------------------
-- 1) Tabla de ADMINISTRADORES
-- -------------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Un admin puede ver su propia fila y la lista completa de otros admins.
-- (Se usan DOS políticas: una simple sin subconsulta que ancla el
-- caso base "veo mi propia fila", y otra que usa esa base para
-- resolver "¿eres admin?" sin caer en recursión infinita.)
drop policy if exists "admins_select" on public.admins;
drop policy if exists "admins_select_own" on public.admins;
create policy "admins_select_own"
  on public.admins for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "admins_select_all" on public.admins;
create policy "admins_select_all"
  on public.admins for select
  to authenticated
  using (public.is_admin());

-- Solo un admin ya existente puede insertar otro admin
-- (el bootstrap del primer admin lo hace el trigger de abajo,
-- que corre con privilegios elevados y evita este chequeo).
drop policy if exists "admins_insert" on public.admins;
create policy "admins_insert"
  on public.admins for insert
  to authenticated
  with check (public.is_admin());

-- -------------------------------------------------------------
-- 2) Función pública para saber si YA existe algún admin
--    (se usa en /auth/sign-up para bloquear el registro público
--    una vez que el primer admin ya fue creado).
-- -------------------------------------------------------------
create or replace function public.admin_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::integer from public.admins;
$$;

grant execute on function public.admin_count() to anon, authenticated;

-- Función security definer para chequear "¿es admin?" sin causar
-- recursión de RLS al consultar la propia tabla admins desde sus
-- propias políticas (ni desde las de clients/loans/storage).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

grant execute on function public.is_admin() to authenticated;

-- -------------------------------------------------------------
-- 3) Trigger: cuando se crea un usuario en auth.users, si TODAVÍA
--    no existe ningún admin, ese usuario se vuelve el primer admin.
--    Si ya existe un admin, no pasa nada (el usuario nuevo queda
--    sin acceso de admin).
-- -------------------------------------------------------------
create or replace function public.handle_new_user_bootstrap_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.admins) = 0 then
    insert into public.admins (id, email, created_by)
    values (new.id, new.email, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_bootstrap_admin on auth.users;
create trigger on_auth_user_created_bootstrap_admin
  after insert on auth.users
  for each row
  execute function public.handle_new_user_bootstrap_admin();

-- =============================================================
-- 4) Actualizar políticas de clients/loans/storage: ya no basta
--    con "authenticated", ahora se exige ser miembro de admins.
-- =============================================================

-- ---- CLIENTES ----
drop policy if exists "clients_admin_insert" on public.clients;
create policy "clients_admin_insert"
  on public.clients for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "clients_admin_update" on public.clients;
create policy "clients_admin_update"
  on public.clients for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "clients_admin_delete" on public.clients;
create policy "clients_admin_delete"
  on public.clients for delete
  to authenticated
  using (public.is_admin());

-- ---- PRÉSTAMOS ----
drop policy if exists "loans_admin_insert" on public.loans;
create policy "loans_admin_insert"
  on public.loans for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "loans_admin_update" on public.loans;
create policy "loans_admin_update"
  on public.loans for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "loans_admin_delete" on public.loans;
create policy "loans_admin_delete"
  on public.loans for delete
  to authenticated
  using (public.is_admin());

-- ---- STORAGE (facturas) ----
drop policy if exists "invoices_admin_insert" on storage.objects;
create policy "invoices_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'invoices'
    and public.is_admin()
  );

drop policy if exists "invoices_admin_delete" on storage.objects;
create policy "invoices_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'invoices'
    and public.is_admin()
  );

-- =============================================================
-- LISTO.
-- Si ya tenías un admin creado ANTES de correr este script,
-- corre esto una sola vez para que quede reconocido como admin
-- (reemplaza el correo por el tuyo):
--
--   insert into public.admins (id, email, created_by)
--   select id, email, id from auth.users
--   where email = 'tu-correo@ejemplo.com'
--   on conflict (id) do nothing;
-- =============================================================
