"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { type Loan, formatCurrency, formatDateTime } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { deleteLoanRecord } from "@/app/actions"
import { ImageLightbox } from "@/components/image-lightbox"
import { EditLoanInvoiceDialog } from "@/components/edit-loan-invoice-dialog"
import { FileText, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function LoanRow({ loan }: { loan: Loan }) {
  const [deleting, setDeleting] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este préstamo? El total se recalculará.")) return
    setDeleting(true)
    const formData = new FormData()
    formData.set("id", loan.id)
    formData.set("client_id", loan.client_id)
    const result = await deleteLoanRecord(formData)
    setDeleting(false)
    if (result.success) {
      toast.success("Préstamo eliminado")
      router.refresh()
    } else {
      toast.error(result.error ?? "No se pudo eliminar")
    }
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-4">
        <div className="flex items-start gap-3">
          {loan.invoice_image_url ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="size-9 shrink-0 overflow-hidden rounded-md border bg-muted"
              aria-label="Ver factura"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={loan.invoice_image_url} alt="Factura" className="size-full object-cover" />
            </button>
          ) : (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <FileText className="size-4" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-tight">{loan.description || "Préstamo"}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(loan.created_at)}</p>
            <EditLoanInvoiceDialog loan={loan} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="whitespace-nowrap text-sm font-semibold">{formatCurrency(Number(loan.amount))}</p>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Eliminar préstamo"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </CardContent>

      {loan.invoice_image_url && (
        <ImageLightbox
          src={loan.invoice_image_url}
          alt={`Factura de ${loan.description || "préstamo"}`}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </Card>
  )
}
