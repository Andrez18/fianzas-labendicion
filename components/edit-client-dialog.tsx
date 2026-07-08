"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ClientWithTotal } from "@/lib/types"
import { updateClientRecord, deleteClientRecord } from "@/app/actions"
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
import { Pencil, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function EditClientDialog({ client }: { client: ClientWithTotal }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("id", client.id)
    const result = await updateClientRecord(formData)
    setLoading(false)
    if (result.success) {
      toast.success("Cliente actualizado")
      setOpen(false)
      router.refresh()
    } else {
      toast.error(result.error ?? "No se pudo actualizar")
    }
  }

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este cliente y todos sus préstamos? Esta acción no se puede deshacer.")) return
    setDeleting(true)
    const formData = new FormData()
    formData.set("id", client.id)
    const result = await deleteClientRecord(formData)
    setDeleting(false)
    if (result.success) {
      toast.success("Cliente eliminado")
      router.push("/admin")
      router.refresh()
    } else {
      toast.error(result.error ?? "No se pudo eliminar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil className="size-4" />
            Editar
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>
              El número de identificación no se puede cambiar ({client.identification_number}).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre completo *</Label>
              <Input id="edit-name" name="name" required defaultValue={client.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input id="edit-phone" name="phone" defaultValue={client.phone ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Descripción de dirección</Label>
              <Textarea
                id="edit-address"
                name="address_description"
                defaultValue={client.address_description ?? ""}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" className="text-destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Eliminar cliente
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
