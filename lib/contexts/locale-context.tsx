"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { type Locale, DEFAULT_LOCALE } from "@/lib/i18n"
import { getMessages, type Messages } from "@/lib/i18n/messages"

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Messages
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const STORAGE_KEY = "saju_locale"

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Hydration-safe: read localStorage only after mount
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v === "en") {
        setLocaleState("en")
        document.documentElement.lang = "en"
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.lang = next
  }, [])

  const t = getMessages(locale)

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider")
  return ctx
}
