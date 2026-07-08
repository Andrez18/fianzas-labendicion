"use client"

import { useEffect, useState } from "react"
import { Download, Share, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isIosDevice() {
  if (typeof window === "undefined") return false
  const ua = window.navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua)
}

function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error - iOS Safari specific property
    window.navigator.standalone === true
  )
}

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIos, setIsIos] = useState(false)
  const [showIosSheet, setShowIosSheet] = useState(false)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem("pwa-install-dismissed") === "1") {
      setDismissed(true)
      return
    }

    if (isIosDevice()) {
      setIsIos(true)
      setVisible(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    const installedHandler = () => {
      setVisible(false)
      setDeferredPrompt(null)
    }
    window.addEventListener("appinstalled", installedHandler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
    }
  }, [])

  if (dismissed || !visible) return null

  const handleClick = async () => {
    if (isIos) {
      setShowIosSheet(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    localStorage.setItem("pwa-install-dismissed", "1")
  }

  return (
    <>
      {/* Botón flotante: solo visible en celulares (pantallas pequeñas) */}
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-1 md:hidden">
        <Button
          onClick={handleClick}
          className="h-11 rounded-full px-4 shadow-lg shadow-primary/30"
          size="lg"
        >
          <Download data-icon="inline-start" />
          Instalar app
        </Button>
        <Button
          onClick={handleDismiss}
          variant="secondary"
          size="icon-sm"
          className="rounded-full shadow-md"
          aria-label="Cerrar"
        >
          <X />
        </Button>
      </div>

      {/* Hoja de instrucciones para iOS (no soporta instalación automática) */}
      {showIosSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:hidden"
          onClick={() => setShowIosSheet(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-background p-5 pb-8 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
            <h3 className="mb-2 text-base font-semibold">Instalar la app</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Para instalar Préstamos en tu iPhone:
            </p>
            <ol className="mb-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  1
                </span>
                <span className="flex items-center gap-1">
                  Toca el botón compartir <Share className="inline size-4" /> en Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  2
                </span>
                <span>Selecciona "Agregar a pantalla de inicio".</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  3
                </span>
                <span>Confirma tocando "Agregar".</span>
              </li>
            </ol>
            <Button className="w-full" onClick={() => setShowIosSheet(false)}>
              Entendido
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
