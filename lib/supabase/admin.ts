import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Cliente con la SERVICE ROLE KEY. Ignora las políticas de RLS y puede
 * crear usuarios de Supabase Auth directamente (auth.admin.createUser).
 *
 * NUNCA importar este archivo desde un componente cliente ("use client")
 * ni exponer SUPABASE_SERVICE_ROLE_KEY con el prefijo NEXT_PUBLIC_.
 * Solo se debe usar dentro de Server Actions o Route Handlers.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno. " +
        "Ve a Supabase Dashboard > Project Settings > API > service_role key.",
    )
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
