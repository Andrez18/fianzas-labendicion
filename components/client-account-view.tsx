import { Store, User, Phone, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type ClientWithTotal, type Loan, formatCurrency } from "@/lib/types"
import { ClientLogoutButton } from "@/components/client-logout-button"
import { ClientLoanCard } from "@/components/client-loan-card"

export function ClientAccountView({ client, loans }: { client: ClientWithTotal; loans: Loan[] }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Mi cuenta</h1>
              <p className="text-xs text-muted-foreground">{client.name}</p>
            </div>
          </div>
          <ClientLogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-secondary">
                  <User className="size-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">ID: {client.identification_number}</p>
                </div>
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
                    <MapPin className="size-4 shrink-0 mt-0.5" />
                    <span>{client.address_description}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-primary p-4 text-primary-foreground">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">Total adeudado</p>
                  <p className="text-2xl font-bold">{formatCurrency(Number(client.total_debt))}</p>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {client.loan_count} {Number(client.loan_count) === 1 ? "préstamo" : "préstamos"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="mb-3 px-1 text-sm font-medium text-muted-foreground">Detalle de préstamos</h3>
            {loans.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No tienes préstamos registrados.
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {loans.map((loan) => (
                  <ClientLoanCard key={loan.id} loan={loan} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
