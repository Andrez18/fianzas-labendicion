"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createAdminUser } from "@/app/actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AddAdminDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createAdminUser(formData)
    setLoading(false)

    if (result.success) {
      toast.success("Administrador creado correctamente")
      setOpen(false)
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    } else {
      toast.error(result.error ?? "No se pudo crear el administrador")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <ShieldPlus className="size-4" />
            Nuevo administrador
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Crear administrador</DialogTitle>
            <DialogDescription>
              La cuenta queda activa de inmediato, sin necesidad de confirmar correo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico *</Label>
              <Input id="email" name="email" type="email" required placeholder="nuevo-admin@ejemplo.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input id="password" name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Crear administrador
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
