import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Ocurrió un problema</CardTitle>
          <CardDescription>No pudimos completar el inicio de sesión. Intenta nuevamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" render={<Link href="/auth/login">Volver a iniciar sesión</Link>} />
        </CardContent>
      </Card>
    </main>
  )
}
