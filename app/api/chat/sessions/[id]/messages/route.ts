import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

interface CreateMessageBody {
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  if (parsed < 1) return 1;
  if (parsed > MAX_LIMIT) return MAX_LIMIT;
  return Math.floor(parsed);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseLimit(searchParams.get("limit"));
  const cursor = searchParams.get("cursor");

  try {
    const chatSession = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "채팅 세션을 찾을 수 없습니다" }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    const hasNext = messages.length > limit;
    const pagedMessages = hasNext ? messages.slice(0, limit) : messages;
    const nextCursor = hasNext ? pagedMessages[pagedMessages.length - 1]?.id : undefined;

    return NextResponse.json({
      messages: pagedMessages,
      ...(nextCursor ? { nextCursor } : {}),
    });
  } catch (error) {
    console.error("채팅 메시지 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "채팅 메시지 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const { role, content } = body as Partial<CreateMessageBody>;
  if (role !== "user" && role !== "assistant") {
    return NextResponse.json({ error: "role은 user 또는 assistant만 가능합니다" }, { status: 422 });
  }

  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "content가 필요합니다" }, { status: 422 });
  }

  try {
    const chatSession = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "채팅 세션을 찾을 수 없습니다" }, { status: 404 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        sessionId: id,
        role,
        content: content.trim(),
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("채팅 메시지 저장 실패:", error);
    return NextResponse.json(
      { error: "채팅 메시지 저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
