"use client"

import { useState } from "react"
import { useCooperativeApp } from "./app-context"
import { useWallet } from "@/lib/wallet-context"
import { Sun, Moon, Copy, Check, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

export function CooperativeHeader() {
  const { theme, setTheme, language, setLanguage, t } = useCooperativeApp()
  const { shortAddress } = useWallet()
  const [copied, setCopied] = useState(false)

  const displayAddress = shortAddress ?? "0x3f4a...8d2c"

  const handleCopy = () => {
    navigator.clipboard.writeText(displayAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3.5 bg-card/80 backdrop-blur border-b border-border">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-xl px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground truncate max-w-[110px]">
            {displayAddress}
          </span>
          <button
            onClick={handleCopy}
            aria-label={t("copyAddress")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#3DDC97]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-secondary rounded-xl p-1">
          {(["es", "en"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-lg transition-all",
                language === lang
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          aria-label={t("notifications")}
          className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            AG
          </div>
        </div>
      </div>
    </header>
  )
}
