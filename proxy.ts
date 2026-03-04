import { NextResponse } from "next/server"
import NextAuth from "next-auth"
import authConfig, { SKIP_AUTH } from "@/lib/auth/auth.config"

const { auth } = NextAuth(authConfig)

/** 로그인 필수 보호 경로 */
const PROTECTED_ROUTES = [
  "/today",
  "/explore",
  "/week",
  "/decision",
  "/debate",
  "/profile",
]

export default auth((req) => {
  const { nextUrl } = req
  const path = nextUrl.pathname

  // 1. SKIP_AUTH → 전부 통과 (개발모드)
  if (SKIP_AUTH) {
    return NextResponse.next()
  }

  const session = req.auth
  const isLoggedIn = !!session?.user

  // 2. /today?demo=true → 통과 (데모)
  if (path === "/today" && nextUrl.searchParams.get("demo") === "true") {
    return NextResponse.next()
  }

  // 3. / 또는 /login + 로그인 → hasBirthInfo에 따라 /today 또는 /onboarding
  if ((path === "/" || path === "/login") && isLoggedIn) {
    const dest = session.user.hasBirthInfo ? "/today" : "/onboarding"
    return NextResponse.redirect(new URL(dest, nextUrl))
  }

  // 4. /onboarding + 미로그인 → /login
  if (path === "/onboarding" && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // 5. /onboarding + hasBirthInfo → /today (이미 온보딩 완료)
  if (path === "/onboarding" && isLoggedIn && session.user.hasBirthInfo) {
    return NextResponse.redirect(new URL("/today", nextUrl))
  }

  // 6. 보호 경로 + 미로그인 → /login?callbackUrl=
  const isProtected = PROTECTED_ROUTES.some(
    (r) => path === r || path.startsWith(r + "/")
  )
  if (isProtected && !isLoggedIn) {
    const url = new URL("/login", nextUrl)
    url.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(url)
  }

  // 7. /admin + 미로그인 → /login?callbackUrl=/admin
  if (path.startsWith("/admin") && !isLoggedIn) {
    return NextResponse.redirect(
      new URL("/login?callbackUrl=/admin", nextUrl)
    )
  }

  // 8. 나머지 → 통과
  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
}
