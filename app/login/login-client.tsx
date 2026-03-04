"use client"

import { useState, useEffect } from "react"
import { LoginV1 } from "@/components/auth/login-v1"
import { LoginV2 } from "@/components/auth/login-v2"

const STORAGE_KEY = "saju-login-version"

export interface EnabledProviders {
  google: boolean
  twitter: boolean
  kakao: boolean
}

interface LoginClientProps {
  skipAuth: boolean
  callbackUrl: string
  enabledProviders: EnabledProviders
}

export function LoginClient({ skipAuth, callbackUrl, enabledProviders }: LoginClientProps) {
  const [version, setVersion] = useState<"v1" | "v2">("v1")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as "v1" | "v2" | null
      if (saved === "v1" || saved === "v2") setVersion(saved)
    } catch {
      // ignore
    }
  }, [])

  function toggle() {
    const next = version === "v1" ? "v2" : "v1"
    setVersion(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative">
      {/* Version toggle chip */}
      <button
        onClick={toggle}
        className="fixed left-5 top-5 z-50 rounded-full border border-border/40 bg-card/80 px-3 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
        type="button"
      >
        {version === "v1" ? "V1 \u2192 V2" : "V2 \u2192 V1"}
      </button>

      {version === "v1" ? (
        <LoginV1 skipAuth={skipAuth} callbackUrl={callbackUrl} enabledProviders={enabledProviders} />
      ) : (
        <LoginV2 skipAuth={skipAuth} callbackUrl={callbackUrl} enabledProviders={enabledProviders} />
      )}
    </div>
  )
}
