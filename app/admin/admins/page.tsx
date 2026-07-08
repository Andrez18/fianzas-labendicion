import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { listAdmins } from "@/app/actions"
import { formatDateTime } from "@/lib/types"
import { AdminHeader } from "@/components/admin-header"
import { AddAdminDialog } from "@/components/add-admin-dialog"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"

export default async function AdminsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const admins = await listAdmins()

  return (
    <div className="flex min-h-svh flex-col bg-muted">
      <AdminHeader email={user.email ?? ""} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" />
          Volver al panel
        </Link>

        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Administradores</h2>
          <AddAdminDialog />
        </div>

        <div className="grid gap-3">
          {admins.map((admin) => (
            <Card key={admin.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{admin.email}</p>
                  <p className="text-xs text-muted-foreground">Admin desde {formatDateTime(admin.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
