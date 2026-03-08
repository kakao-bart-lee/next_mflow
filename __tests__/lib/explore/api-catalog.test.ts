import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"

import { parseExploreApiInventory } from "@/lib/explore/api-catalog"

describe("parseExploreApiInventory", () => {
  it("explore API 인벤토리 문서에서 API 목록을 추출한다", () => {
    const markdownPath = path.join(process.cwd(), "docs", "explore-api-inventory.md")
    const markdown = readFileSync(markdownPath, "utf-8")

    const apis = parseExploreApiInventory(markdown)

    expect(apis.length).toBeGreaterThanOrEqual(13)
    expect(apis.some((api) => api.id === "API-1" && api.path === "/api/saju/analyze")).toBe(true)
    expect(apis.some((api) => api.id === "API-9" && api.path === "/api/astrology/vimshottari")).toBe(true)
    expect(apis.some((api) => api.id === "API-8b" && api.endpoint === "fetchHellenisticProfection")).toBe(true)
    expect(apis.some((api) => api.id === "API-13" && api.path === "/api/saju/interpret")).toBe(true)

    const vimshottari = apis.find((api) => api.id === "API-9")
    expect(vimshottari?.responseType).toBe("VimshottariResponse")
    expect(vimshottari?.fields.length).toBeGreaterThanOrEqual(4)
  })
})
