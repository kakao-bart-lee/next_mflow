import NextAuth from "next-auth"
import authConfig, {
  SKIP_AUTH,
  DEV_USER,
  baseJwtCallback,
  baseSessionCallback,
} from "./auth.config"

async function buildNextAuth() {
  let adapter
  if (!SKIP_AUTH) {
    const [{ PrismaAdapter }, { prisma }] = await Promise.all([
      import("@auth/prisma-adapter"),
      import("@/lib/db/prisma"),
    ])
    adapter = PrismaAdapter(prisma)
  }

  return NextAuth({
    ...authConfig,
    ...(adapter ? { adapter } : {}),
    callbacks: {
      async jwt(params) {
        const token = baseJwtCallback(params)

        // 로그인 시 DB에서 실제 플래그 조회
        if (params.user) {
          if (SKIP_AUTH) {
            token.isAdmin = true
            token.hasBirthInfo = true
          } else {
            try {
              const { prisma } = await import("@/lib/db/prisma")
              const dbUser = await prisma.user.findUnique({
                where: { id: params.user.id! },
                select: { isAdmin: true, birthInfo: true },
              })
              if (dbUser) {
                token.isAdmin = dbUser.isAdmin
                token.hasBirthInfo = dbUser.birthInfo !== null
              }
            } catch {
              // DB 오류 시 base callback의 기본값 유지
            }
          }
        }

        return token
      },
      session: baseSessionCallback,
    },
    events: {
      async createUser({ user }) {
        if (!user.id) return
        try {
          const { addCredit } = await import("@/lib/credit-service")
          const initialCredits = Number(
            process.env.INITIAL_FREE_CREDITS ?? 10
          )
          await addCredit(user.id, initialCredits, "가입 축하 보너스")
        } catch (err) {
          console.error("초기 크레딧 지급 실패:", err)
        }
      },
    },
  })
}

const nextAuthResult = buildNextAuth()

async function auth() {
  if (SKIP_AUTH) {
    await ensureDevUser()
    return {
      user: {
        ...DEV_USER,
        image: null,
        isAdmin: true,
        hasBirthInfo: true,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }
  const { auth: nextAuth } = await nextAuthResult
  return nextAuth()
}

async function ensureDevUser() {
  try {
    const { prisma } = await import("@/lib/db/prisma")
    await prisma.user.upsert({
      where: { id: DEV_USER.id },
      update: {},
      create: DEV_USER,
    })
  } catch {
    // DB 미연결 시 무시
  }
}

const handlers = {
  GET: async (
    req: Parameters<
      Awaited<ReturnType<typeof buildNextAuth>>["handlers"]["GET"]
    >[0]
  ) => {
    const { handlers: h } = await nextAuthResult
    return h.GET(req)
  },
  POST: async (
    req: Parameters<
      Awaited<ReturnType<typeof buildNextAuth>>["handlers"]["POST"]
    >[0]
  ) => {
    const { handlers: h } = await nextAuthResult
    return h.POST(req)
  },
}

async function signIn(
  ...args: Parameters<Awaited<ReturnType<typeof buildNextAuth>>["signIn"]>
) {
  const { signIn: si } = await nextAuthResult
  return si(...args)
}

async function signOut(
  ...args: Parameters<Awaited<ReturnType<typeof buildNextAuth>>["signOut"]>
) {
  const { signOut: so } = await nextAuthResult
  return so(...args)
}

async function unstableUpdate(
  data: Record<string, unknown>
) {
  const { unstable_update: update } = await nextAuthResult
  return update(data)
}

export { handlers, auth, signIn, signOut, unstableUpdate }
export type { Session } from "next-auth"
