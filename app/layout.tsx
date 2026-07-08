import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { PWARegister } from "@/components/pwa-register"
import { PwaInstallButton } from "@/components/pwa-install-button"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Préstamos La bendición",
  description: "Gestión y consulta de préstamos de clientes del supermercado la bendición",
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Préstamos",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#1f6feb",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`light ${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" />
        <PWARegister />
        <PwaInstallButton />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
