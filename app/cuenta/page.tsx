import { redirect } from "next/navigation"
import { getClientSessionId } from "@/lib/client-session"
import { createClient } from "@/lib/supabase/server"
import { type ClientWithTotal, type Loan } from "@/lib/types"
import { ClientAccountView } from "@/components/client-account-view"

export default async function CuentaPage() {
  const clientId = await getClientSessionId()
  if (!clientId) redirect("/auth/login?as=cliente")

  const supabase = await createClient()

  const { data: clientData } = await supabase
    .from("clients_with_total")
    .select("*")
    .eq("id", clientId)
    .maybeSingle()

  if (!clientData) redirect("/auth/login?as=cliente")

  const { data: loanData } = await supabase
    .from("loans")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  return <ClientAccountView client={clientData as ClientWithTotal} loans={(loanData as Loan[]) ?? []} />
}
