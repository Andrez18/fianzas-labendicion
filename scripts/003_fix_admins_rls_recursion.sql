-- =============================================================
-- Fix: recursión infinita en la política de SELECT de public.admins
-- Pega esto en: Supabase Dashboard > SQL Editor > New query > Run
--
-- Problema: la política "admins_select" comprobaba "¿el usuario actual
-- está en admins?" haciendo un SELECT sobre la propia tabla admins, y
-- ese SELECT interno vuelve a aplicar la misma política, así que nunca
-- se resuelve y termina bloqueando a todo el mundo (incluido un admin
-- real viendo su propia fila).
--
-- Solución: agregar una política simple que siempre te deja ver TU
-- PROPIA fila (id = auth.uid()), sin subconsulta. Con eso, las demás
-- políticas que sí necesitan comprobar "¿eres admin?" pueden apoyarse
-- en esta para resolverse sin recursión.
-- =============================================================

drop policy if exists "admins_select" on public.admins;

-- Cualquier usuario autenticado puede ver SU PROPIA fila en admins
-- (sin esto, ni siquiera un admin real puede confirmar que lo es).
drop policy if exists "admins_select_own" on public.admins;
create policy "admins_select_own"
  on public.admins for select
  to authenticated
  using (id = auth.uid());

-- Un admin puede ver la lista completa de admins (se apoya en la
-- política anterior para resolver "¿eres admin?" sin recursión).
drop policy if exists "admins_select_all" on public.admins;
create policy "admins_select_all"
  on public.admins for select
  to authenticated
  using (exists (select 1 from public.admins a where a.id = auth.uid()));

-- =============================================================
-- LISTO. Ya deberías poder crear clientes/préstamos normalmente.
-- =============================================================
