export default function OfflinePage() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center gap-2 bg-muted p-6 text-center">
      <h1 className="text-xl font-semibold">Sin conexión</h1>
      <p className="text-sm text-muted-foreground text-pretty">
        No hay conexión a internet. Conéctate para consultar la información más reciente.
      </p>
    </main>
  )
}
