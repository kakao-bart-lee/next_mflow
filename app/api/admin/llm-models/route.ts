import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth/admin"
import { prisma } from "@/lib/db/prisma"

const CreateModelSchema = z.object({
  modelId: z.string().min(1),
  displayName: z.string().min(1),
  provider: z.string().default("openai"),
  inputPricePer1M: z.number().min(0),
  outputPricePer1M: z.number().min(0),
})

const UpdateModelSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1).optional(),
  provider: z.string().optional(),
  inputPricePer1M: z.number().min(0).optional(),
  outputPricePer1M: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

const DeleteModelSchema = z.object({
  id: z.string().min(1),
})

// GET — 전체 모델 목록
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const models = await prisma.llmModel.findMany({
      orderBy: [{ provider: "asc" }, { displayName: "asc" }],
    })

    return NextResponse.json({ models })
  } catch (err) {
    console.error("[llm-models] GET 오류:", err)
    return NextResponse.json(
      { error: "모델 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// POST — 모델 추가
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다" },
      { status: 400 }
    )
  }

  const parsed = CreateModelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  try {
    const model = await prisma.llmModel.create({
      data: parsed.data,
    })

    return NextResponse.json({ model }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "모델 생성 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// PUT — 모델 수정
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다" },
      { status: 400 }
    )
  }

  const parsed = UpdateModelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const { id, ...data } = parsed.data

  try {
    const model = await prisma.llmModel.update({
      where: { id },
      data,
    })

    return NextResponse.json({ model })
  } catch {
    return NextResponse.json(
      { error: "모델 수정 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// DELETE — 비활성화 (실제 삭제하지 않음)
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다" },
      { status: 400 }
    )
  }

  const parsed = DeleteModelSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  try {
    const model = await prisma.llmModel.update({
      where: { id: parsed.data.id },
      data: { isActive: false },
    })

    return NextResponse.json({ model })
  } catch {
    return NextResponse.json(
      { error: "모델 비활성화 중 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
