export type Locale = "ko" | "en"

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
]

export const DEFAULT_LOCALE: Locale = "ko"
