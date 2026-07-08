"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { getAdminBootstrapStatus, bootstrapFirstAdmin } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [bootstrapAvailable, setBootstrapAvailable] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    getAdminBootstrapStatus()
      .then((status) => setBootstrapAvailable(status.available))
      .catch(() => setBootstrapAvailable(false))
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.set("email", email)
      formData.set("password", password)
      const result = await bootstrapFirstAdmin(formData)
      if (!result.success) throw new Error(result.error ?? "Ocurrió un error al registrarse")

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      router.push("/admin")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error al registrarse")
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
          <h1 className="text-xl font-semibold text-balance">Registro de Administrador</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Crear cuenta</CardTitle>
            <CardDescription>Registra una nueva cuenta de administrador</CardDescription>
          </CardHeader>
          <CardContent>
            {bootstrapAvailable === null ? (
              <p className="text-sm text-muted-foreground">Verificando disponibilidad de registro...</p>
            ) : bootstrapAvailable === false ? (
              <div className="flex flex-col gap-4 text-center">
                <p className="text-sm text-muted-foreground text-pretty">
                  El registro público está deshabilitado porque ya existe un administrador. Pide a un administrador
                  existente que cree tu cuenta desde el panel.
                </p>
                <Button className="w-full" render={<Link href="/auth/login">Ir a iniciar sesión</Link>} />
              </div>
            ) : (
            <form onSubmit={handleSignUp}>
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
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password">Repetir contraseña</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Registrarse"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link href="/auth/login" className="underline underline-offset-4 text-foreground">
                  Inicia sesión
                </Link>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
