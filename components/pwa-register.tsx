"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal for app functionality.
      })
    }

    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register)
      return () => window.removeEventListener("load", register)
    }
  }, [])

  return null
}
