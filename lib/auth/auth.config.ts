/**
 * Edge-safe NextAuth 베이스 설정.
 * Prisma/DB import 없음 → middleware에서 안전하게 사용 가능.
 */
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session } from "next-auth"

export const SKIP_AUTH =
  process.env.SKIP_AUTH === "true" ||
  process.env.NEXT_PUBLIC_SKIP_AUTH === "true"

export const DEV_USER = {
  id: "dev-user-local",
  email: "dev@localhost",
  name: "개발자",
}

const providers = SKIP_AUTH
  ? [
      Credentials({
        id: "dev-login",
        name: "Development Login",
        credentials: {},
        async authorize() {
          return DEV_USER
        },
      }),
    ]
  : [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    ]

/**
 * JWT callback 베이스 로직 (Edge-safe).
 * auth.ts에서 확장하여 DB 조회를 추가함.
 */
export function baseJwtCallback({
  token,
  user,
  trigger,
  session,
}: {
  token: JWT
  user?: { id?: string | null } | null
  trigger?: "signIn" | "signUp" | "update"
  session?: unknown
}) {
  // 최초 로그인 시 기본값 설정
  if (user) {
    token.sub = user.id ?? undefined
    token.isAdmin = token.isAdmin ?? false
    token.hasBirthInfo = token.hasBirthInfo ?? false
  }

  // unstable_update() 호출 시 클라이언트 데이터 반영
  if (trigger === "update" && session && typeof session === "object") {
    const update = session as { hasBirthInfo?: boolean; isAdmin?: boolean }
    if (typeof update.hasBirthInfo === "boolean") {
      token.hasBirthInfo = update.hasBirthInfo
    }
    if (typeof update.isAdmin === "boolean") {
      token.isAdmin = update.isAdmin
    }
  }

  return token
}

/**
 * Session callback — JWT 토큰 → 세션 객체 매핑.
 */
export function baseSessionCallback({
  session,
  token,
}: {
  session: Session
  token: JWT
}) {
  if (session.user) {
    session.user.id = token.sub ?? ""
    session.user.isAdmin = Boolean(token.isAdmin)
    session.user.hasBirthInfo = Boolean(token.hasBirthInfo)
  }
  return session
}

export default {
  providers,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    jwt: baseJwtCallback,
    session: baseSessionCallback,
  },
} satisfies NextAuthConfig
