"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClientSession, clearClientSession } from "@/lib/client-session"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type ActionResult = { success: boolean; error?: string }

/**
 * Login de CLIENTES (usuarios finales): se autentican únicamente con su
 * número de identificación (no tienen contraseña). Si existe un cliente con
 * ese número, se crea una sesión de cliente (cookie firmada).
 */
export async function clientLogin(formData: FormData): Promise<ActionResult> {
  const identification_number = String(formData.get("identification_number") || "").trim()

  if (!identification_number) {
    return { success: false, error: "Ingresa tu número de identificación." }
  }

  try {
    const supabase = await createClient()
    const { data: client, error } = await supabase
      .from("clients")
      .select("id")
      .eq("identification_number", identification_number)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    if (!client) {
      return {
        success: false,
        error: "No se encontró ningún cliente con ese número de identificación.",
      }
    }

    await createClientSession(client.id)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

export async function clientLogout(): Promise<void> {
  await clearClientSession()
  redirect("/")
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autorizado. Inicia sesión como administrador.")

  const { data: adminRow, error: adminCheckError } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()
  if (!adminRow) {
    throw new Error(
      `No autorizado. Tu cuenta no tiene permisos de administrador. [debug: user.id=${user.id} email=${user.email} dbError=${adminCheckError ? JSON.stringify(adminCheckError) : "ninguno"}]`,
    )
  }

  return { supabase, user }
}

/**
 * Le dice a la página de registro si el registro público sigue disponible.
 * Solo está disponible mientras NO exista ningún admin (bootstrap del primero).
 */
export async function getAdminBootstrapStatus(): Promise<{ available: boolean }> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("admin_count")
  if (error) return { available: true }
  return { available: (data ?? 0) === 0 }
}

export async function listAdmins(): Promise<{ id: string; email: string; created_at: string }[]> {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from("admins").select("id, email, created_at").order("created_at", { ascending: true })
  return data ?? []
}

/**
 * Crea el PRIMER admin del sistema (bootstrap). No envía correo de
 * confirmación: la cuenta queda activa de inmediato. Si ya existe un
 * admin, se rechaza (el registro público solo sirve una vez).
 */
export async function bootstrapFirstAdmin(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "").trim()

  if (!email || !password) {
    return { success: false, error: "El correo y la contraseña son obligatorios." }
  }

  try {
    const supabase = await createClient()
    const { data: count, error: countError } = await supabase.rpc("admin_count")
    if (countError) return { success: false, error: countError.message }
    if ((count ?? 0) > 0) {
      return { success: false, error: "Ya existe un administrador. Pide a un administrador existente que te cree una cuenta." }
    }

    const adminClient = createAdminClient()
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) return { success: false, error: createError.message }
    if (!created.user) return { success: false, error: "No se pudo crear el usuario." }

    // El trigger on_auth_user_created_bootstrap_admin ya lo inserta en public.admins
    // automáticamente porque la tabla estaba vacía.
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

export async function createAdminUser(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "").trim()

  if (!email || !password) {
    return { success: false, error: "El correo y la contraseña son obligatorios." }
  }
  if (password.length < 6) {
    return { success: false, error: "La contraseña debe tener al menos 6 caracteres." }
  }

  try {
    const { user: currentAdmin } = await requireAdmin()

    const adminClient = createAdminClient()
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError) return { success: false, error: createError.message }
    if (!created.user) return { success: false, error: "No se pudo crear el usuario." }

    const { error: insertError } = await adminClient.from("admins").insert({
      id: created.user.id,
      email: created.user.email,
      created_by: currentAdmin.id,
    })
    if (insertError) {
      // Si falla el insert, deshacemos la creación del usuario para no dejarlo huérfano.
      await adminClient.auth.admin.deleteUser(created.user.id)
      return { success: false, error: insertError.message }
    }

    revalidatePath("/admin/admins")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

export async function createClientRecord(formData: FormData): Promise<ActionResult> {
  const identification_number = String(formData.get("identification_number") || "").trim()
  const name = String(formData.get("name") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  const address_description = String(formData.get("address_description") || "").trim()

  if (!identification_number || !name) {
    return { success: false, error: "El número de identificación y el nombre son obligatorios." }
  }

  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from("clients").insert({
      identification_number,
      name,
      phone: phone || null,
      address_description: address_description || null,
    })
    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Ya existe un cliente con ese número de identificación." }
      }
      return { success: false, error: error.message }
    }
    revalidatePath("/admin")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

export async function updateClientRecord(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "")
  const name = String(formData.get("name") || "").trim()
  const phone = String(formData.get("phone") || "").trim()
  const address_description = String(formData.get("address_description") || "").trim()

  if (!id || !name) {
    return { success: false, error: "Datos incompletos." }
  }

  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from("clients")
      .update({
        name,
        phone: phone || null,
        address_description: address_description || null,
      })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin")
    revalidatePath(`/admin/${id}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

export async function deleteClientRecord(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "")
  if (!id) return { success: false, error: "Falta el identificador del cliente." }

  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from("clients").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/admin")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

export async function createLoanRecord(formData: FormData): Promise<ActionResult> {
  const client_id = String(formData.get("client_id") || "")
  const amountRaw = String(formData.get("amount") || "").trim()
  const description = String(formData.get("description") || "").trim()
  const invoice_image_url = String(formData.get("invoice_image_url") || "").trim()

  const amount = Number(amountRaw)
  if (!client_id) return { success: false, error: "Falta el cliente." }
  if (!amountRaw || Number.isNaN(amount) || amount < 0) {
    return { success: false, error: "Ingresa un monto válido." }
  }

  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from("loans").insert({
      client_id,
      amount,
      description: description || null,
      invoice_image_url: invoice_image_url || null,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath(`/admin/${client_id}`)
    revalidatePath("/admin")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

export async function deleteLoanRecord(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "")
  const client_id = String(formData.get("client_id") || "")
  if (!id) return { success: false, error: "Falta el identificador del préstamo." }

  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from("loans").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/admin/${client_id}`)
    revalidatePath("/admin")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

/**
 * Agrega, reemplaza o quita la foto de factura de un préstamo ya
 * existente (invoice_image_url puede llegar vacío para "quitar foto").
 */
export async function updateLoanInvoice(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "")
  const client_id = String(formData.get("client_id") || "")
  const invoice_image_url = String(formData.get("invoice_image_url") || "").trim()

  if (!id) return { success: false, error: "Falta el identificador del préstamo." }

  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from("loans")
      .update({ invoice_image_url: invoice_image_url || null })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/admin/${client_id}`)
    revalidatePath("/admin")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

/**
 * Registra un ABONO (pago parcial o total) a la deuda de un cliente.
 * El monto se resta del total en la vista clients_with_total. Si el
 * cliente pagó más de lo que debía, el "vuelto" ya se le calculó y
 * mostró al admin en el formulario antes de confirmar; aquí solo se
 * guarda el monto que efectivamente se recibió, para dejar registro.
 */
export async function createPaymentRecord(formData: FormData): Promise<ActionResult> {
  const client_id = String(formData.get("client_id") || "")
  const amountRaw = String(formData.get("amount") || "").trim()
  const note = String(formData.get("note") || "").trim()

  const amount = Number(amountRaw)
  if (!client_id) return { success: false, error: "Falta el cliente." }
  if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
    return { success: false, error: "Ingresa un monto de abono válido." }
  }

  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from("payments").insert({
      client_id,
      amount,
      note: note || null,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath(`/admin/${client_id}`)
    revalidatePath("/admin")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}

export async function deletePaymentRecord(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") || "")
  const client_id = String(formData.get("client_id") || "")
  if (!id) return { success: false, error: "Falta el identificador del abono." }

  try {
    const { supabase } = await requireAdmin()
    const { error } = await supabase.from("payments").delete().eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/admin/${client_id}`)
    revalidatePath("/admin")
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" }
  }
}
