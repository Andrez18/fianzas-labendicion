export type Client = {
  id: string
  identification_number: string
  name: string
  phone: string | null
  address_description: string | null
  created_at: string
}

export type ClientWithTotal = Client & {
  total_debt: number
  loan_count: number
  updated_at: string
}

export type Loan = {
  id: string
  client_id: string
  amount: number
  description: string | null
  invoice_image_url: string | null
  created_at: string
}

export type Payment = {
  id: string
  client_id: string
  amount: number
  note: string | null
  created_at: string
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Fecha y hora completas (no solo la fecha) para dejar registro exacto de
 * cuándo ocurrió cada cosa: creación de clientes, préstamos y abonos.
 * Ej: "6 jul 2026, 2:48 p. m."
 */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
