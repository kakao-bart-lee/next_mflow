import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

interface JournalBody {
  prompt: string;
  text: string;
  weekStart: string;
}

interface JournalEntryResponse {
  id: string;
  prompt: string;
  text: string;
  weekStart: string;
  createdAt: Date;
}

function isJsonObject(value: Prisma.JsonValue | null | undefined): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getJsonString(value: Prisma.JsonValue | null | undefined, key: string): string | null {
  if (!isJsonObject(value)) return null;
  const raw = value[key];
  return typeof raw === "string" ? raw : null;
}

function isValidWeekStart(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}

function toJournalEntry(item: {
  id: string;
  input: Prisma.JsonValue;
  result: Prisma.JsonValue;
  createdAt: Date;
}): JournalEntryResponse | null {
  const prompt = getJsonString(item.input, "prompt");
  const weekStart = getJsonString(item.input, "weekStart");
  const text = getJsonString(item.result, "text");

  if (!prompt || !weekStart || text === null) {
    return null;
  }

  return {
    id: item.id,
    prompt,
    text,
    weekStart,
    createdAt: item.createdAt,
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");

  if (weekStart !== null && !isValidWeekStart(weekStart)) {
    return NextResponse.json({ error: "weekStart 형식이 올바르지 않습니다" }, { status: 422 });
  }

  try {
    const analyses = await prisma.analysis.findMany({
      where: {
        userId,
        expertId: "journal",
        ...(weekStart
          ? {
              input: {
                path: ["weekStart"],
                equals: weekStart,
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        input: true,
        result: true,
        createdAt: true,
      },
    });

    const entries = analyses
      .map((item) => toJournalEntry(item))
      .filter((item): item is JournalEntryResponse => item !== null);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("저널 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "저널 목록을 불러오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 });
  }

  const { prompt, text, weekStart } = body as Partial<JournalBody>;
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "prompt가 필요합니다" }, { status: 422 });
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "text가 필요합니다" }, { status: 422 });
  }

  if (typeof weekStart !== "string" || !isValidWeekStart(weekStart)) {
    return NextResponse.json({ error: "weekStart 형식이 올바르지 않습니다" }, { status: 422 });
  }

  try {
    const saved = await prisma.$transaction(async (tx) => {
      const existing = await tx.analysis.findFirst({
        where: {
          userId,
          expertId: "journal",
          input: {
            path: ["weekStart"],
            equals: weekStart,
          },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (existing) {
        return tx.analysis.update({
          where: { id: existing.id },
          data: {
            input: { prompt: prompt.trim(), weekStart },
            result: { text: text.trim() },
          },
          select: {
            id: true,
            input: true,
            result: true,
            createdAt: true,
          },
        });
      }

      return tx.analysis.create({
        data: {
          userId,
          expertId: "journal",
          input: { prompt: prompt.trim(), weekStart },
          result: { text: text.trim() },
        },
        select: {
          id: true,
          input: true,
          result: true,
          createdAt: true,
        },
      });
    });

    const entry = toJournalEntry(saved);
    if (!entry) {
      return NextResponse.json(
        { error: "저널 저장 결과 형식이 올바르지 않습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("저널 저장 실패:", error);
    return NextResponse.json(
      { error: "저널 저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
