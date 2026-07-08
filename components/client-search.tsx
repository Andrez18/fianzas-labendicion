"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { type ClientWithTotal, type Loan, formatCurrency, formatDateTime } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, User, Phone, MapPin, FileText, ImageIcon, Loader2 } from "lucide-react"

export function ClientSearch() {
  const [idNumber, setIdNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [client, setClient] = useState<ClientWithTotal | null>(null)
  const [loans, setLoans] = useState<Loan[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const term = idNumber.trim()
    if (!term) return

    setLoading(true)
    setSearched(true)
    setClient(null)
    setLoans([])

    const supabase = createClient()
    const { data: clientData } = await supabase
      .from("clients_with_total")
      .select("*")
      .eq("identification_number", term)
      .maybeSingle()

    if (clientData) {
      setClient(clientData as ClientWithTotal)
      const { data: loanData } = await supabase
        .from("loans")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false })
      setLoans((loanData as Loan[]) ?? [])
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <Input
          inputMode="numeric"
          placeholder="Número de identificación"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="h-12 text-base"
          aria-label="Número de identificación"
        />
        <Button type="submit" className="h-12 sm:w-40" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Buscar
        </Button>
      </form>

      {searched && !loading && !client && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <User className="size-8 text-muted-foreground" />
            <p className="font-medium">No se encontró ningún cliente</p>
            <p className="text-sm text-muted-foreground">
              Verifica el número de identificación o comunícate con el supermercado.
            </p>
          </CardContent>
        </Card>
      )}

      {client && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-secondary">
                    <User className="size-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{client.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">ID: {client.identification_number}</p>
                  </div>
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
                  Este cliente no tiene préstamos registrados.
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {loans.map((loan) => (
                  <Card key={loan.id}>
                    <CardContent className="flex items-start justify-between gap-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                          <FileText className="size-4" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium leading-tight">
                            {loan.description || "Préstamo"}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(loan.created_at)}</p>
                          {loan.invoice_image_url && (
                            <a
                              href={loan.invoice_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-foreground underline underline-offset-2"
                            >
                              <ImageIcon className="size-3" />
                              Ver factura
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="whitespace-nowrap text-sm font-semibold">{formatCurrency(Number(loan.amount))}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
