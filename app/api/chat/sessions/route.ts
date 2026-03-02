import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

interface CreateSessionBody {
  expertId: string;
  title?: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        expertId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({
      sessions: sessions.map((item) => ({
        id: item.id,
        expertId: item.expertId,
        title: item.title,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        messageCount: item._count.messages,
      })),
    });
  } catch (error) {
    console.error("채팅 세션 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "채팅 세션 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const { expertId, title } = body as Partial<CreateSessionBody>;
  if (typeof expertId !== "string" || expertId.trim().length === 0) {
    return NextResponse.json({ error: "expertId가 필요합니다" }, { status: 422 });
  }

  if (title !== undefined && typeof title !== "string") {
    return NextResponse.json({ error: "title 형식이 올바르지 않습니다" }, { status: 422 });
  }

  try {
    const created = await prisma.chatSession.create({
      data: {
        userId: session.user.id,
        expertId: expertId.trim(),
        title: title?.trim() ? title.trim() : null,
      },
      select: {
        id: true,
        expertId: true,
        title: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ session: created });
  } catch (error) {
    console.error("채팅 세션 생성 실패:", error);
    return NextResponse.json(
      { error: "채팅 세션 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
