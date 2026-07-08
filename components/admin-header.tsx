"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Store, LogOut, ShieldCheck } from "lucide-react"

export function AdminHeader({ email }: { email: string }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Panel de Administración</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href="/admin/admins">
                <ShieldCheck className="size-4" />
                <span className="hidden sm:inline">Administradores</span>
              </Link>
            }
          />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
