import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { FortuneTellerService } from "@/lib/saju-core/facade";
import { BirthInfoSchema } from "@/lib/schemas/birth-info";
import { interpretSaju } from "@/lib/use-cases/interpret-saju";
import {
  getCachedFortune,
  cacheFortune,
  buildContextHash,
  type FortuneCacheKey,
} from "@/lib/services/fortune-cache";

const InterpretRequestSchema = z.object({
  type: z.enum(["daily", "weekly", "decision"]),
  birthInfo: BirthInfoSchema,
  /** 주간 운세일 때 시작 날짜 (YYYY-MM-DD) */
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  decisionContext: z
    .object({
      optionA: z.string(),
      optionB: z.string(),
      answers: z.record(z.string(), z.string()),
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.type === "weekly" && !data.weekStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "주간 운세 요청 시 weekStartDate는 필수입니다",
      path: ["weekStartDate"],
    });
  }

  if (data.type === "decision" && !data.decisionContext) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "결정 운세 요청 시 decisionContext는 필수입니다",
      path: ["decisionContext"],
    });
  }
});

const service = new FortuneTellerService();

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "로그인이 필요합니다" },
      { status: 401 }
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다" },
      { status: 400 }
    );
  }

  const parsed = InterpretRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력 정보가 올바르지 않습니다", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { type, birthInfo, weekStartDate, decisionContext } = parsed.data;
  const userId = session.user.id;
  const isMock = process.env.MOCK_LLM === "true";

  // ── 캐시 키 구성 ──
  const todayStr = new Date().toISOString().slice(0, 10);
  const dateKey =
    type === "daily"
      ? todayStr
      : type === "weekly"
        ? (weekStartDate ?? todayStr)
        : todayStr;
  const contextHash =
    type === "decision" && decisionContext
      ? buildContextHash(decisionContext.optionA, decisionContext.optionB)
      : undefined;

  const cacheKey: FortuneCacheKey = {
    userId,
    expertId: type,
    dateKey,
    contextHash,
  };

  // ── 캐시 조회 (MOCK_LLM이면 건너뜀 — 비용 없으므로) ──
  if (!isMock) {
    try {
      const cached = await getCachedFortune(cacheKey);
      if (cached) {
        return NextResponse.json({
          type,
          data: cached,
          cacheStatus: "hit" as const,
        });
      }
    } catch (err) {
      // 캐시 조회 실패는 무시하고 LLM으로 진행
      console.warn("Fortune cache lookup failed:", err);
    }
  }

  // ── 사주 계산 ──
  let sajuData: ReturnType<FortuneTellerService["calculateSaju"]>;
  try {
    const birthTime = birthInfo.isTimeUnknown
      ? "12:00"
      : (birthInfo.birthTime ?? "12:00");
    sajuData = service.calculateSaju({
      birthDate: birthInfo.birthDate,
      birthTime,
      gender: birthInfo.gender,
      timezone: birthInfo.timezone,
    });
  } catch {
    return NextResponse.json(
      { error: "사주 계산 중 오류가 발생했습니다", code: "CALCULATION_ERROR" },
      { status: 500 }
    );
  }

  // ── LLM 해석 생성 ──
  const result = await interpretSaju(
    type,
    sajuData,
    weekStartDate,
    userId,
    type === "decision" ? decisionContext : undefined
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status }
    );
  }

  // ── 캐시 저장 (MOCK_LLM이면 건너뜀) ──
  if (!isMock) {
    try {
      await cacheFortune(cacheKey, { type, birthDate: birthInfo.birthDate, weekStartDate, decisionContext }, result.data);
    } catch (err) {
      // 캐시 저장 실패는 무시 (결과는 이미 생성됨)
      console.warn("Fortune cache save failed:", err);
    }
  }

  const cacheStatus = isMock ? ("mock" as const) : ("miss" as const);
  return NextResponse.json({ type, data: result.data, cacheStatus });
}
