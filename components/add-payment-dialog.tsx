"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createPaymentRecord } from "@/app/actions"
import { formatCurrency } from "@/lib/types"
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
import { HandCoins, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AddPaymentDialog({ clientId, currentDebt }: { clientId: string; currentDebt: number }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amountInput, setAmountInput] = useState("")
  const router = useRouter()

  const amount = Number(amountInput)
  const hasValidAmount = amountInput.trim() !== "" && !Number.isNaN(amount) && amount > 0

  const { remaining, change } = useMemo(() => {
    if (!hasValidAmount) return { remaining: currentDebt, change: 0 }
    const diff = currentDebt - amount
    return {
      remaining: diff > 0 ? diff : 0,
      change: diff < 0 ? Math.abs(diff) : 0,
    }
  }, [amount, hasValidAmount, currentDebt])

  const resetForm = () => setAmountInput("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createPaymentRecord(formData)
    setLoading(false)

    if (result.success) {
      toast.success("Abono registrado")
      setOpen(false)
      resetForm()
      router.refresh()
    } else {
      toast.error(result.error ?? "No se pudo registrar el abono")
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
          <Button variant="secondary">
            <HandCoins className="size-4" />
            Registrar abono
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="client_id" value={clientId} />
          <DialogHeader>
            <DialogTitle>Registrar abono</DialogTitle>
            <DialogDescription>
              Deuda actual: <span className="font-medium text-foreground">{formatCurrency(currentDebt)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="payment-amount">¿Con cuánto va a pagar? *</Label>
              <Input
                id="payment-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="Ej. 50000"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
            </div>

            <div
              className={`flex items-center justify-between rounded-lg p-4 text-sm ${
                change > 0 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-muted"
              }`}
            >
              {change > 0 ? (
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">Vuelto a entregar</p>
                  <p className="text-xl font-bold">{formatCurrency(change)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Deuda restante</p>
                  <p className="text-xl font-bold">{formatCurrency(remaining)}</p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="payment-note">Nota (opcional)</Label>
              <Textarea id="payment-note" name="note" placeholder="Ej. Abono en efectivo" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !hasValidAmount}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Guardar abono
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
