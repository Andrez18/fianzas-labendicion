"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { type Payment, formatCurrency, formatDateTime } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { deletePaymentRecord } from "@/app/actions"
import { HandCoins, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function PaymentRow({ payment }: { payment: Payment }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este abono? El total adeudado se recalculará.")) return
    setDeleting(true)
    const formData = new FormData()
    formData.set("id", payment.id)
    formData.set("client_id", payment.client_id)
    const result = await deletePaymentRecord(formData)
    setDeleting(false)
    if (result.success) {
      toast.success("Abono eliminado")
      router.refresh()
    } else {
      toast.error(result.error ?? "No se pudo eliminar")
    }
  }

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <HandCoins className="size-4" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-tight">{payment.note || "Abono"}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(payment.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-500">
            -{formatCurrency(Number(payment.amount))}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Eliminar abono"
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
