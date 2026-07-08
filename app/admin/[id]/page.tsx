import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { type ClientWithTotal, type Loan, type Payment, formatCurrency, formatDateTime } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddLoanDialog } from "@/components/add-loan-dialog"
import { AddPaymentDialog } from "@/components/add-payment-dialog"
import { LoanRow } from "@/components/loan-row"
import { PaymentRow } from "@/components/payment-row"
import { EditClientDialog } from "@/components/edit-client-dialog"
import { ArrowLeft, Phone, MapPin, Store, Clock } from "lucide-react"

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: clientData } = await supabase.from("clients_with_total").select("*").eq("id", id).maybeSingle()

  if (!clientData) notFound()
  const client = clientData as ClientWithTotal

  const { data: loanData } = await supabase
    .from("loans")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
  const loans = (loanData as Loan[]) ?? []

  const { data: paymentData } = await supabase
    .from("payments")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
  const payments = (paymentData as Payment[]) ?? []

  return (
    <div className="flex min-h-svh flex-col bg-muted">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link href="/admin">
                <ArrowLeft className="size-4" />
                Volver
              </Link>
            }
          />
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Store className="size-4" />
            Préstamos
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">{client.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">ID: {client.identification_number}</p>
              </div>
              <EditClientDialog client={client} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2 text-sm">
              {client.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-4 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address_description && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>{client.address_description}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5 shrink-0" />
                <span>Cliente desde {formatDateTime(client.created_at)}</span>
              </div>
              {client.updated_at !== client.created_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" />
                  <span>Última actualización: {formatDateTime(client.updated_at)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary p-4 text-primary-foreground">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-80">Total adeudado</p>
                <p className="text-2xl font-bold">{formatCurrency(Number(client.total_debt))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Préstamos</h2>
          <div className="flex items-center gap-2">
            <AddPaymentDialog clientId={client.id} currentDebt={Number(client.total_debt)} />
            <AddLoanDialog clientId={client.id} />
          </div>
        </div>

        {loans.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Aún no hay préstamos. Agrega el primero con el botón de arriba.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {loans.map((loan) => (
              <LoanRow key={loan.id} loan={loan} />
            ))}
          </div>
        )}

        <div className="mb-4 mt-8 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Abonos</h2>
        </div>

        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Este cliente aún no ha hecho ningún abono.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {payments.map((payment) => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
