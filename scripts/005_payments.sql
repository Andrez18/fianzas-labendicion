-- =============================================================
-- Abonos (pagos parciales a la deuda)
-- Pega TODO este código en: Supabase Dashboard > SQL Editor > New query
-- Luego presiona "Run".
--
-- Qué hace:
--  1) Crea la tabla public.payments (abonos que un admin registra
--     cuando un cliente paga parte o toda su deuda).
--  2) Actualiza la vista clients_with_total para que el total
--     adeudado sea: suma de préstamos - suma de abonos (nunca
--     queda en negativo).
--  3) Agrega las políticas de seguridad (solo admins pueden
--     insertar/eliminar abonos; lectura pública igual que loans,
--     para poder mostrar el total ya descontado en la consulta
--     de clientes).
-- =============================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists payments_client_id_idx
  on public.payments (client_id);

alter table public.payments enable row level security;

-- Cualquiera puede LEER (se usa para calcular el total ya abonado
-- en la consulta pública / vista de cliente).
drop policy if exists "payments_public_select" on public.payments;
create policy "payments_public_select"
  on public.payments for select
  to anon, authenticated
  using (true);

-- Solo admins autenticados pueden registrar abonos
drop policy if exists "payments_admin_insert" on public.payments;
create policy "payments_admin_insert"
  on public.payments for insert
  to authenticated
  with check (public.is_admin());

-- Solo admins autenticados pueden eliminar abonos (para corregir errores)
drop policy if exists "payments_admin_delete" on public.payments;
create policy "payments_admin_delete"
  on public.payments for delete
  to authenticated
  using (public.is_admin());

-- -------------------------------------------------------------
-- Vista clients_with_total: ahora resta los abonos del total de
-- préstamos. Se usa GREATEST(..., 0) para que nunca se muestre una
-- deuda negativa aunque se haya abonado de más.
-- -------------------------------------------------------------
create or replace view public.clients_with_total as
select
  c.id,
  c.identification_number,
  c.name,
  c.phone,
  c.address_description,
  c.created_at,
  greatest(coalesce(l.total_loans, 0) - coalesce(p.total_payments, 0), 0) as total_debt,
  coalesce(l.loan_count, 0) as loan_count
from public.clients c
left join (
  select client_id, sum(amount) as total_loans, count(*) as loan_count
  from public.loans
  group by client_id
) l on l.client_id = c.id
left join (
  select client_id, sum(amount) as total_payments
  from public.payments
  group by client_id
) p on p.client_id = c.id;

-- =============================================================
-- LISTO.
-- =============================================================
