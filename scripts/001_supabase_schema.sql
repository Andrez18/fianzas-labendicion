-- =============================================================
-- App de préstamos de supermercado — Esquema de base de datos
-- Pega TODO este código en: Supabase Dashboard > SQL Editor > New query
-- Luego presiona "Run".
-- =============================================================

-- -------------------------------------------------------------
-- 1) Extensiones
-- -------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 2) Tabla de CLIENTES
--    - identification_number: número asignado por el admin (único)
--    - se busca a los clientes por este número
-- -------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  identification_number text not null unique,
  name text not null,
  phone text,
  address_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice para acelerar la búsqueda por número de identificación
create index if not exists clients_identification_number_idx
  on public.clients (identification_number);

-- -------------------------------------------------------------
-- 3) Tabla de PRÉSTAMOS (cada cargo/deuda del cliente)
--    - amount: precio de lo prestado
--    - description: descripción del préstamo
--    - invoice_image_url: imagen de la factura (opcional)
--    El total de la deuda = suma de los amounts del cliente.
-- -------------------------------------------------------------
create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  description text,
  invoice_image_url text,
  created_at timestamptz not null default now()
);

-- Índice para traer rápido los préstamos de un cliente
create index if not exists loans_client_id_idx
  on public.loans (client_id);

-- -------------------------------------------------------------
-- 4) Vista opcional: clientes con su total de deuda calculado
-- -------------------------------------------------------------
create or replace view public.clients_with_total as
select
  c.id,
  c.identification_number,
  c.name,
  c.phone,
  c.address_description,
  c.created_at,
  coalesce(sum(l.amount), 0) as total_debt,
  count(l.id) as loan_count
from public.clients c
left join public.loans l on l.client_id = c.id
group by c.id;

-- -------------------------------------------------------------
-- 5) Trigger para mantener updated_at en clients
-- -------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

-- =============================================================
-- 6) SEGURIDAD (Row Level Security)
--    - Lectura PÚBLICA (búsqueda por número de identificación).
--    - Escritura SOLO para admins autenticados (usuarios logueados
--      con Supabase Auth).
-- =============================================================
alter table public.clients enable row level security;
alter table public.loans enable row level security;

-- ---- CLIENTES ----
-- Cualquiera puede LEER (búsqueda pública)
drop policy if exists "clients_public_select" on public.clients;
create policy "clients_public_select"
  on public.clients for select
  to anon, authenticated
  using (true);

-- Solo admins autenticados pueden INSERTAR
drop policy if exists "clients_admin_insert" on public.clients;
create policy "clients_admin_insert"
  on public.clients for insert
  to authenticated
  with check (true);

-- Solo admins autenticados pueden ACTUALIZAR
drop policy if exists "clients_admin_update" on public.clients;
create policy "clients_admin_update"
  on public.clients for update
  to authenticated
  using (true)
  with check (true);

-- Solo admins autenticados pueden ELIMINAR
drop policy if exists "clients_admin_delete" on public.clients;
create policy "clients_admin_delete"
  on public.clients for delete
  to authenticated
  using (true);

-- ---- PRÉSTAMOS ----
-- Cualquiera puede LEER (para mostrar la deuda en la búsqueda pública)
drop policy if exists "loans_public_select" on public.loans;
create policy "loans_public_select"
  on public.loans for select
  to anon, authenticated
  using (true);

-- Solo admins autenticados pueden INSERTAR
drop policy if exists "loans_admin_insert" on public.loans;
create policy "loans_admin_insert"
  on public.loans for insert
  to authenticated
  with check (true);

-- Solo admins autenticados pueden ACTUALIZAR
drop policy if exists "loans_admin_update" on public.loans;
create policy "loans_admin_update"
  on public.loans for update
  to authenticated
  using (true)
  with check (true);

-- Solo admins autenticados pueden ELIMINAR
drop policy if exists "loans_admin_delete" on public.loans;
create policy "loans_admin_delete"
  on public.loans for delete
  to authenticated
  using (true);

-- =============================================================
-- 7) STORAGE: bucket para las imágenes de facturas
-- =============================================================
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do nothing;

-- Lectura pública de las imágenes de factura
drop policy if exists "invoices_public_read" on storage.objects;
create policy "invoices_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'invoices');

-- Solo admins autenticados pueden subir facturas
drop policy if exists "invoices_admin_insert" on storage.objects;
create policy "invoices_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'invoices');

-- Solo admins autenticados pueden borrar facturas
drop policy if exists "invoices_admin_delete" on storage.objects;
create policy "invoices_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'invoices');

-- =============================================================
-- LISTO.
-- Para crear cuentas de ADMIN (varios admins):
--   Supabase Dashboard > Authentication > Users > "Add user"
--   (crea cada admin con correo y contraseña).
-- =============================================================
