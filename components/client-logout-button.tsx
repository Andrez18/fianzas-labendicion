"use client"

import { useTransition } from "react"
import { clientLogout } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"

export function ClientLogoutButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => clientLogout())}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      <span className="hidden sm:inline">Cerrar sesión</span>
    </Button>
  )
}
