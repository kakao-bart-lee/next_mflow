"use server"

import { signIn, signOut, unstableUpdate } from "@/lib/auth"

/**
 * Google OAuth 로그인.
 * middleware가 "/"에서 hasBirthInfo에 따라 /today 또는 /onboarding으로 분기 처리.
 */
export async function googleSignInAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | null
  await signIn("google", { redirectTo: callbackUrl || "/" })
}

/**
 * 개발 모드 자동 로그인.
 * SKIP_AUTH 모드에서는 middleware가 비활성화되므로 /today로 직접 이동.
 */
export async function devSignInAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | null
  await signIn("dev-login", { redirectTo: callbackUrl || "/today" })
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" })
}

/**
 * JWT 세션 갱신 — 온보딩 완료 후 hasBirthInfo 플래그 업데이트 등에 사용.
 */
export async function updateSessionAction(
  data: { hasBirthInfo?: boolean; isAdmin?: boolean }
) {
  await unstableUpdate(data)
}
