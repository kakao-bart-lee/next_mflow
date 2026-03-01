"use client"

import { useLocale } from "@/lib/contexts/locale-context"

export function LocaleToggle() {
  const { locale, setLocale } = useLocale()

  return (
    <button
      onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-[11px] font-semibold tracking-tight text-foreground/70 shadow-sm shadow-black/[0.02] transition-colors hover:text-foreground"
      type="button"
      aria-label={locale === "ko" ? "Switch to English" : "한국어로 전환"}
    >
      {locale === "ko" ? "EN" : "한"}
    </button>
  )
}
