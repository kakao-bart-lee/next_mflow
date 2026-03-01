import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";

const SKIP_AUTH =
  process.env.SKIP_AUTH === "true" ||
  process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

const DEV_USER = {
  id: "dev-user-local",
  email: "dev@localhost",
  name: "개발자",
};

async function buildNextAuth() {
  let adapter;
  if (!SKIP_AUTH) {
    const [{ PrismaAdapter }, { prisma }] = await Promise.all([
      import("@auth/prisma-adapter"),
      import("@/lib/db/prisma"),
    ]);
    adapter = PrismaAdapter(prisma);
  }

  const providers: Provider[] = SKIP_AUTH
    ? [
        Credentials({
          id: "dev-login",
          name: "Development Login",
          credentials: {},
          async authorize() {
            return DEV_USER;
          },
        }),
      ]
    : [
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      ];

  return NextAuth({
    ...(adapter ? { adapter } : {}),
    providers,
    pages: { signIn: "/login" },
    session: { strategy: SKIP_AUTH ? "jwt" : "database" },
    events: {
      async createUser({ user }) {
        if (!user.id) return;
        try {
          const { addCredit } = await import("@/lib/credit-service");
          const initialCredits = Number(process.env.INITIAL_FREE_CREDITS ?? 10);
          await addCredit(user.id, initialCredits, "가입 축하 보너스");
        } catch (err) {
          console.error("초기 크레딧 지급 실패:", err);
        }
      },
    },
    callbacks: {
      session({ session, user, token }) {
        if (session.user) {
          session.user.id = user?.id ?? token?.sub ?? DEV_USER.id;
          // isAdmin 정보를 세션에 포함
          if (user && "isAdmin" in user) {
            (session.user as typeof session.user & { isAdmin: boolean }).isAdmin =
              Boolean(user.isAdmin);
          }
        }
        return session;
      },
      jwt({ token, user }) {
        if (user) token.sub = user.id;
        return token;
      },
    },
  });
}

const nextAuthResult = buildNextAuth();

async function auth() {
  if (SKIP_AUTH) {
    await ensureDevUser();
    return {
      user: { ...DEV_USER, image: null },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }
  const { auth: nextAuth } = await nextAuthResult;
  return nextAuth();
}

async function ensureDevUser() {
  try {
    const { prisma } = await import("@/lib/db/prisma");
    await prisma.user.upsert({
      where: { id: DEV_USER.id },
      update: {},
      create: DEV_USER,
    });
  } catch {
    // DB 미연결 시 무시
  }
}

const handlers = {
  GET: async (req: Parameters<Awaited<ReturnType<typeof buildNextAuth>>["handlers"]["GET"]>[0]) => {
    const { handlers: h } = await nextAuthResult;
    return h.GET(req);
  },
  POST: async (req: Parameters<Awaited<ReturnType<typeof buildNextAuth>>["handlers"]["POST"]>[0]) => {
    const { handlers: h } = await nextAuthResult;
    return h.POST(req);
  },
};

async function signIn(
  ...args: Parameters<Awaited<ReturnType<typeof buildNextAuth>>["signIn"]>
) {
  const { signIn: si } = await nextAuthResult;
  return si(...args);
}

async function signOut(
  ...args: Parameters<Awaited<ReturnType<typeof buildNextAuth>>["signOut"]>
) {
  const { signOut: so } = await nextAuthResult;
  return so(...args);
}

export { handlers, auth, signIn, signOut };
export type { Session } from "next-auth";
