"use client"

import { useState } from "react"
import { type Loan, formatCurrency, formatDateTime } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { ImageLightbox } from "@/components/image-lightbox"
import { FileText } from "lucide-react"

export function ClientLoanCard({ loan }: { loan: Loan }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 py-4">
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
          </div>
        </div>
        <p className="whitespace-nowrap text-sm font-semibold">{formatCurrency(Number(loan.amount))}</p>
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
