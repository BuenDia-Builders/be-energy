import type React from "react"
import type { Metadata, Viewport } from "next"
import { IBM_Plex_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { WalletProvider } from "@/lib/wallet-context"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import { I18nProvider } from "@/lib/i18n-context"
import { Toaster } from "@/components/ui/sonner"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
})

export const metadata: Metadata = {
  title: "BeEnergy - Energía Verde Tokenizada",
  description: "Genera energía renovable y certifícala como activo digital trazable en blockchain Stellar",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#FFD500",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${ibmPlexSans.variable} font-sans antialiased`}>
        <ThemeProvider>
          <I18nProvider>
            <WalletProvider>
              <AuthProvider>{children}</AuthProvider>
            </WalletProvider>
          </I18nProvider>
        </ThemeProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
