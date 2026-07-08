import Link from "next/link"
import { Store, ShieldCheck, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="size-6" />
          </div>
          <h1 className="text-xl font-semibold text-balance">Préstamos <b>La bendición</b></h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Inicia sesión para consultar tu deuda o para administrar el sistema.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            render={
              <Link href="/auth/login?as=cliente">
                <User className="size-4" />
                Ingresar como cliente
              </Link>
            }
          />
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            render={
              <Link href="/auth/login?as=admin">
                <ShieldCheck className="size-4" />
                Ingresar como administrador
              </Link>
            }
          />
        </div>
      </div>
    </div>
  )
}
