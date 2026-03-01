import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { FortuneTellerService } from "@/lib/saju-core/facade";
import { BirthInfoSchema } from "@/lib/schemas/birth-info";
import { interpretSaju, type InterpretationType } from "@/lib/use-cases/interpret-saju";

const InterpretRequestSchema = z.object({
  type: z.enum(["daily", "weekly"]),
  birthInfo: BirthInfoSchema,
  /** 주간 운세일 때 시작 날짜 (YYYY-MM-DD) */
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).superRefine((data, ctx) => {
  if (data.type === "weekly" && !data.weekStartDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "주간 운세 요청 시 weekStartDate는 필수입니다",
      path: ["weekStartDate"],
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

  const { type, birthInfo, weekStartDate } = parsed.data;

  // 사주 계산
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

  // LLM 해석 생성
  const result = await interpretSaju(
    type,
    sajuData,
    weekStartDate,
    session.user.id
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status }
    );
  }

  return NextResponse.json({ type, data: result.data });
}
