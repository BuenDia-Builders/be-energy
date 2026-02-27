"use client"

import { useState } from "react"
import { useI18nV2 } from "@/lib/v2/i18n-provider"
import type { Language } from "@/lib/v2/i18n"

const languages: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "pt", label: "PT" },
]

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useI18nV2()
  const [open, setOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        style={{
          color: "var(--v2-text-secondary)",
          border: "1px solid var(--v2-border)",
          background: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--v2-text-muted)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--v2-border)"
        }}
      >
        <GlobeIcon />
        {language.toUpperCase()}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden"
            style={{
              background: "var(--v2-bg-card)",
              border: "1px solid var(--v2-border)",
              boxShadow: "var(--v2-shadow-md)",
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code)
                  setOpen(false)
                }}
                className="w-full px-4 py-2 text-sm text-left transition-colors flex items-center gap-2"
                style={{
                  color: language === lang.code ? "var(--v2-accent)" : "var(--v2-text-secondary)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--v2-bg-card-hover)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                {language === lang.code && <CheckIcon />}
                <span className={language === lang.code ? "font-medium" : ""}>
                  {lang.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
      }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}
