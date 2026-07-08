"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientRecord } from "@/app/actions"
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
import { Textarea } from "@/components/ui/textarea"
import { UserPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AddClientDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createClientRecord(formData)
    setLoading(false)

    if (result.success) {
      toast.success("Cliente registrado correctamente")
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.error ?? "No se pudo registrar el cliente")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="size-4" />
            Nuevo cliente
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar cliente</DialogTitle>
            <DialogDescription>Ingresa los datos del cliente. El número de identificación es único.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="identification_number">Número de identificación *</Label>
              <Input id="identification_number" name="identification_number" required placeholder="Ej. 1023456789" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input id="name" name="name" required placeholder="Ej. María González" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" placeholder="Ej. 300 123 4567" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address_description">Descripción de dirección</Label>
              <Textarea
                id="address_description"
                name="address_description"
                placeholder="Ej. Casa azul frente al parque, barrio Centro"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Registrar cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
