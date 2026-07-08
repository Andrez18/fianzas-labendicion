"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type ClientWithTotal, formatCurrency } from "@/lib/types"
import { deleteClientRecord } from "@/app/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, ChevronRight, User, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AdminClientList({ clients }: { clients: ClientWithTotal[] }) {
  const [filter, setFilter] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`¿Eliminar a ${name} y todos sus préstamos y abonos? Esta acción no se puede deshacer.`)) return
    setDeletingId(id)
    const formData = new FormData()
    formData.set("id", id)
    const result = await deleteClientRecord(formData)
    setDeletingId(null)
    if (result.success) {
      toast.success("Cliente eliminado")
      router.refresh()
    } else {
      toast.error(result.error ?? "No se pudo eliminar")
    }
  }

  const term = filter.trim().toLowerCase()
  const filtered = term
    ? clients.filter(
        (c) => c.identification_number.toLowerCase().includes(term) || c.name.toLowerCase().includes(term),
      )
    : clients

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por número de identificación o nombre"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {clients.length === 0
              ? "Aún no hay clientes. Agrega el primero con el botón de arriba."
              : "No se encontraron clientes con ese criterio."}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((client) => (
            <Card key={client.id} className="relative transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <Link href={`/admin/${client.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <User className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium leading-tight">{client.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {client.identification_number}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <Link href={`/admin/${client.id}`} className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(client.total_debt))}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {client.loan_count} {Number(client.loan_count) === 1 ? "préstamo" : "préstamos"}
                    </Badge>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, client.id, client.name)}
                    disabled={deletingId === client.id}
                    aria-label={`Eliminar a ${client.name}`}
                  >
                    {deletingId === client.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </Button>
                  <Link href={`/admin/${client.id}`}>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
