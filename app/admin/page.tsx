import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { type ClientWithTotal, formatCurrency } from "@/lib/types"
import { AdminHeader } from "@/components/admin-header"
import { AddClientDialog } from "@/components/add-client-dialog"
import { AdminClientList } from "@/components/admin-client-list"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Wallet } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data } = await supabase
    .from("clients_with_total")
    .select("*")
    .order("created_at", { ascending: false })

  const clients = (data as ClientWithTotal[]) ?? []
  const totalOutstanding = clients.reduce((sum, c) => sum + Number(c.total_debt), 0)

  return (
    <div className="flex min-h-svh flex-col bg-muted">
      <AdminHeader email={user.email ?? ""} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex size-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wallet className="size-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total por cobrar</p>
                <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Clientes registrados</h2>
          <AddClientDialog />
        </div>

        <AdminClientList clients={clients} />
      </main>
    </div>
  )
}
