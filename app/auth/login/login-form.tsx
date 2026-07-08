"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { clientLogin } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store, ShieldCheck, User } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

type Role = "cliente" | "admin"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole: Role = searchParams.get("as") === "admin" ? "admin" : "cliente"
  const [role, setRole] = useState<Role>(initialRole)

  // Estado del formulario de administrador
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Estado del formulario de cliente
  const [idNumber, setIdNumber] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const switchRole = (nextRole: Role) => {
    setRole(nextRole)
    setError(null)
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/admin")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set("identification_number", idNumber)
      const result = await clientLogin(formData)
      if (!result.success) throw new Error(result.error ?? "No se pudo iniciar sesión")

      router.push("/cuenta")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="size-6" />
          </div>
          <h1 className="text-xl font-semibold text-balance">Préstamos Supermercado</h1>
          <p className="text-sm text-muted-foreground text-pretty">Gestión de préstamos del supermercado</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border bg-background p-1">
          <button
            type="button"
            onClick={() => switchRole("cliente")}
            className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
              role === "cliente"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="size-4" />
            Cliente
          </button>
          <button
            type="button"
            onClick={() => switchRole("admin")}
            className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors ${
              role === "admin" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="size-4" />
            Administrador
          </button>
        </div>

        {role === "cliente" ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Consulta tu deuda</CardTitle>
              <CardDescription>Ingresa tu número de identificación para iniciar sesión</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClientLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="idNumber">Número de identificación</Label>
                    <Input
                      id="idNumber"
                      inputMode="numeric"
                      placeholder="Ej. 1023456789"
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Ingresando..." : "Iniciar sesión"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
              <CardDescription>Ingresa tus credenciales de administrador</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ejemplo.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Ingresando..." : "Iniciar sesión"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-4 text-center text-sm">
          <Link href="/" className="text-muted-foreground underline underline-offset-4">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
