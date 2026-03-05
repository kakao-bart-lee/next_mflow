import { NextResponse } from "next/server"
import {
  buildApiCatalogFromMarkdownFile,
  readApiCatalog,
  writeApiCatalog,
} from "@/lib/explore/api-catalog"

export async function GET() {
  try {
    const catalog = await readApiCatalog()
    return NextResponse.json(catalog)
  } catch {
    try {
      const catalog = await buildApiCatalogFromMarkdownFile()
      await writeApiCatalog(catalog)
      return NextResponse.json(catalog)
    } catch (error) {
      return NextResponse.json(
        {
          error: "API 카탈로그를 생성할 수 없습니다",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }
  }
}
