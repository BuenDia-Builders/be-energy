import type { Metadata, Viewport } from "next"
import { DM_Sans, Syne, JetBrains_Mono } from "next/font/google"
import { I18nV2Provider } from "@/lib/v2/i18n-provider"
import "./v2.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
})

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  title: "BeEnergy - Your neighborhood power plant",
  description: "Share solar energy with your neighbors. Track every kilowatt-hour. Get rewarded automatically.",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
}

export default function V2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`v2 ${dmSans.variable} ${syne.variable} ${jetbrainsMono.variable}`}>
      <I18nV2Provider>
        {children}
      </I18nV2Provider>
    </div>
  )
}
