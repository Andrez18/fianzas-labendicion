-- =============================================================
-- Fix DEFINITIVO: recursión infinita en políticas de public.admins
-- Pega esto en: Supabase Dashboard > SQL Editor > New query > Run
--
-- Por qué pasaba: cualquier política de RLS sobre "admins" que
-- consulte la propia tabla "admins" dentro de su condición hace que
-- Postgres detecte una recursión (código 42P17), sin importar si
-- hay otra política "más simple" combinada con OR.
--
-- Solución estándar: mover el chequeo "¿este usuario es admin?" a
-- una función SECURITY DEFINER. Esa función corre con privilegios
-- elevados y NO aplica RLS al consultar admins, así que rompe el
-- ciclo de recursión. Todas las políticas (de admins, clients,
-- loans y storage) usan esta función en vez de repetir la
-- subconsulta.
-- =============================================================

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

-- ---- ADMINS ----
drop policy if exists "admins_select" on public.admins;
drop policy if exists "admins_select_own" on public.admins;
drop policy if exists "admins_select_all" on public.admins;
create policy "admins_select_own"
  on public.admins for select
  to authenticated
  using (id = auth.uid());

create policy "admins_select_all"
  on public.admins for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins_insert" on public.admins;
create policy "admins_insert"
  on public.admins for insert
  to authenticated
  with check (public.is_admin());

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
  with check (bucket_id = 'invoices' and public.is_admin());

drop policy if exists "invoices_admin_delete" on storage.objects;
create policy "invoices_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'invoices' and public.is_admin());

-- =============================================================
-- LISTO. Esto sí debería quedar resuelto de manera definitiva.
-- =============================================================
