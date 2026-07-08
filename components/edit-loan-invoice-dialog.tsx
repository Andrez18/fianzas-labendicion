"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { updateLoanInvoice } from "@/app/actions"
import type { Loan } from "@/lib/types"
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
import { InvoiceUploadField } from "@/components/invoice-upload-field"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"

function extractStoragePath(url: string): string | null {
  const marker = "/invoices/"
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
}

export function EditLoanInvoiceDialog({ loan }: { loan: Loan }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [removed, setRemoved] = useState(false)
  const router = useRouter()

  const resetState = () => {
    setFile(null)
    setRemoved(false)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      let newUrl = loan.invoice_image_url ?? ""

      if (file) {
        const ext = file.name.split(".").pop() || "jpg"
        const path = `${loan.client_id}/${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage.from("invoices").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        })
        if (uploadError) throw new Error(`No se pudo subir la factura: ${uploadError.message}`)
        const { data: publicUrl } = supabase.storage.from("invoices").getPublicUrl(path)
        newUrl = publicUrl.publicUrl
      } else if (removed) {
        newUrl = ""
      } else {
        // No hubo cambios, no hace falta llamar al servidor.
        setOpen(false)
        return
      }

      const formData = new FormData()
      formData.set("id", loan.id)
      formData.set("client_id", loan.client_id)
      formData.set("invoice_image_url", newUrl)
      const result = await updateLoanInvoice(formData)
      if (!result.success) throw new Error(result.error ?? "No se pudo actualizar la factura")

      // Limpieza best-effort: borra la imagen anterior del storage si se
      // reemplazó o se quitó (si falla, no es grave, solo queda un archivo huérfano).
      if (loan.invoice_image_url && (file || removed)) {
        const oldPath = extractStoragePath(loan.invoice_image_url)
        if (oldPath) {
          await supabase.storage.from("invoices").remove([oldPath])
        }
      }

      toast.success("Factura actualizada")
      setOpen(false)
      resetState()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar la factura")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetState()
      }}
    >
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <Camera className="size-4" />
            {loan.invoice_image_url ? "Cambiar factura" : "Agregar factura"}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{loan.invoice_image_url ? "Cambiar foto de factura" : "Agregar foto de factura"}</DialogTitle>
          <DialogDescription>Toma una foto o elige una imagen de la galería.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <InvoiceUploadField
            existingUrl={removed ? null : loan.invoice_image_url}
            onFileSelected={(f) => {
              setFile(f)
              setRemoved(false)
            }}
            onRemove={() => {
              setFile(null)
              setRemoved(true)
            }}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
