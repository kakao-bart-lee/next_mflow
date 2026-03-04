import { auth } from "@/lib/auth"
import { getBalance, getCreditHistory } from "@/lib/credit-service"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
  }

  const [balance, { logs: history }] = await Promise.all([
    getBalance(session.user.id),
    getCreditHistory(session.user.id),
  ])

  return NextResponse.json({ balance, history })
}
