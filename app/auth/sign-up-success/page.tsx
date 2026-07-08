import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpSuccessPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Revisa tu correo</CardTitle>
          <CardDescription>
            Te enviamos un enlace de confirmación. Confirma tu correo para activar tu cuenta de administrador y poder
            iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" render={<Link href="/auth/login">Ir a iniciar sesión</Link>} />
        </CardContent>
      </Card>
    </main>
  )
}
