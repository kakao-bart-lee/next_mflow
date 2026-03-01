import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { BirthInfoSchema } from "@/lib/schemas/birth-info";

// GET /api/user/birth-info — 저장된 생년월일 조회
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { birthInfo: true },
  });

  return NextResponse.json({ birthInfo: user?.birthInfo ?? null });
}

// PUT /api/user/birth-info — 생년월일 저장/업데이트
export async function PUT(req: NextRequest) {
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

  const parsed = BirthInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력 정보가 올바르지 않습니다", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { birthInfo: parsed.data as object },
    select: { birthInfo: true },
  });

  return NextResponse.json({ birthInfo: user.birthInfo });
}
