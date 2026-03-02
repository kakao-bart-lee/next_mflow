import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { ZiweiRuntimeOverlayRequestSchema } from "@/lib/schemas/ziwei"
import { analyzeZiweiRuntimeOverlay } from "@/lib/use-cases/analyze-ziwei"

export async function POST(req: NextRequest) {
  const session = await auth()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다" }, { status: 400 })
  }

  const parsed = ZiweiRuntimeOverlayRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력 정보가 올바르지 않습니다", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const result = analyzeZiweiRuntimeOverlay(parsed.data)
  if (!result.success) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status })
  }

  if (session?.user?.id) {
    try {
      await prisma.analysis.create({
        data: {
          userId: session.user.id,
          expertId: "ziwei-runtime-overlay",
          input: parsed.data as object,
          result: result.data as object,
        },
      })
    } catch (err) {
      console.warn("자미두수 runtime-overlay 결과 저장 실패:", err)
    }
  }

  return NextResponse.json(result.data)
}
