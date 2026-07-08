import crypto from "node:crypto"
import { cookies } from "next/headers"

/**
 * Sesión ligera para CLIENTES (usuarios finales) que inician sesión con su
 * número de identificación. No usa Supabase Auth: es una cookie firmada
 * (HMAC) que solo guarda el id del cliente y una fecha de expiración.
 *
 * Los administradores siguen usando Supabase Auth (ver lib/supabase/*).
 */

const COOKIE_NAME = "client_session"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 días

function getSecret(): string {
  // Reutilizamos la service role key como secreto de firma: solo vive en el
  // servidor y nunca se expone al navegador.
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error("Falta configurar SUPABASE_SERVICE_ROLE_KEY para poder firmar la sesión de clientes.")
  }
  return secret
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex")
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function createClientSession(clientId: string): Promise<void> {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000
  const payload = `${clientId}.${expires}`
  const signature = sign(payload)
  const token = `${payload}.${signature}`

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function getClientSessionId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [clientId, expiresRaw, signature] = parts

  let expectedSignature: string
  try {
    expectedSignature = sign(`${clientId}.${expiresRaw}`)
  } catch {
    return null
  }

  if (!safeEqual(signature, expectedSignature)) return null

  const expires = Number(expiresRaw)
  if (!expires || Number.isNaN(expires) || Date.now() > expires) return null

  return clientId
}

export async function clearClientSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
