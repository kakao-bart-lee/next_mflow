"use server"

import { signIn, signOut, unstableUpdate } from "@/lib/auth"

/**
 * Google OAuth 로그인.
 * middleware가 "/"에서 hasBirthInfo에 따라 /today 또는 /onboarding으로 분기 처리.
 */
export async function googleSignInAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | null
  await signIn("google", { redirectTo: callbackUrl || "/today" })
}

export async function twitterSignInAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | null
  await signIn("twitter", { redirectTo: callbackUrl || "/today" })
}

export async function kakaoSignInAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | null
  await signIn("kakao", { redirectTo: callbackUrl || "/today" })
}

export async function twitterSignInAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | null
  await signIn("twitter", { redirectTo: callbackUrl || "/" })
}

export async function kakaoSignInAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl") as string | null
  await signIn("kakao", { redirectTo: callbackUrl || "/" })
}

/**
 * 개발 모드 자동 로그인.
 * SKIP_AUTH 모드에서는 middleware가 비활성화되므로 /today로 직접 이동.
 */
export async function devSignInAction(formData: FormData) {
  const callbackUrl = (formData.get("callbackUrl") as string | null) || "/today"
  
  if (process.env.SKIP_AUTH === "true") {
    // 개발 모드에서는 NextAuth 루프를 피하기 위해 클라이언트 사이드 리다이렉트를 시도하거나 
    // 직접 호출을 최적화할 수 있지만, 일단은 signIn을 호출하되 redirect 옵션을 확인합니다.
  }
  
  await signIn("dev-login", { redirectTo: callbackUrl })
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
