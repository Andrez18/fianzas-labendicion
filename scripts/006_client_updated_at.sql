-- =============================================================
-- Exponer updated_at en la vista clients_with_total
-- Pega esto en: Supabase Dashboard > SQL Editor > New query > Run
--
-- Por qué: para mostrar fecha Y hora de "cliente desde" y "última
-- actualización" en el panel de admin (trazabilidad / auditoría).
-- =============================================================

create or replace view public.clients_with_total as
select
  c.id,
  c.identification_number,
  c.name,
  c.phone,
  c.address_description,
  c.created_at,
  c.updated_at,
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
