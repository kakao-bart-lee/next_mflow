export type Locale = "ko" | "en" | "ja"

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
]

export const DEFAULT_LOCALE: Locale = "ko"
