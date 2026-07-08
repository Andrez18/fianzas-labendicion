"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { createLoanRecord } from "@/app/actions"
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
import { InvoiceUploadField } from "@/components/invoice-upload-field"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AddLoanDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadKey, setUploadKey] = useState(0)
  const router = useRouter()

  const resetForm = () => {
    setFile(null)
    setUploadKey((k) => k + 1)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      if (file) {
        const supabase = createClient()
        const ext = file.name.split(".").pop() || "jpg"
        const path = `${clientId}/${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage.from("invoices").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        })
        if (uploadError) throw new Error(`No se pudo subir la factura: ${uploadError.message}`)
        const { data: publicUrl } = supabase.storage.from("invoices").getPublicUrl(path)
        formData.set("invoice_image_url", publicUrl.publicUrl)
      }

      const result = await createLoanRecord(formData)
      if (result.success) {
        toast.success("Préstamo agregado y sumado al total")
        setOpen(false)
        resetForm()
        router.refresh()
      } else {
        toast.error(result.error ?? "No se pudo agregar el préstamo")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al agregar el préstamo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Agregar préstamo
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="client_id" value={clientId} />
          <DialogHeader>
            <DialogTitle>Agregar préstamo</DialogTitle>
            <DialogDescription>El monto se sumará automáticamente al total de la deuda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Precio / Monto *</Label>
              <Input id="amount" name="amount" type="number" min="0" step="0.01" required placeholder="Ej. 50000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Ej. Mercado quincenal, productos varios"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label>Foto de la factura (opcional)</Label>
              <InvoiceUploadField
                key={uploadKey}
                onFileSelected={setFile}
                onRemove={() => setFile(null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Guardar préstamo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
