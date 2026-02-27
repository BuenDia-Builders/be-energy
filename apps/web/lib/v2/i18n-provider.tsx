"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, type Language } from "./i18n"

interface I18nV2ContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nV2Context = createContext<I18nV2ContextType | undefined>(undefined)

export function I18nV2Provider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const saved = localStorage.getItem("be-lang") as Language | null
    if (saved && saved in translations) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("be-lang", lang)
  }

  const t = (key: string): string => {
    return (translations[language] as Record<string, string>)[key] || key
  }

  return (
    <I18nV2Context.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nV2Context.Provider>
  )
}

export function useI18nV2() {
  const context = useContext(I18nV2Context)
  if (context === undefined) {
    throw new Error("useI18nV2 must be used within an I18nV2Provider")
  }
  return context
}
