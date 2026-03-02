import { describe, expect, it } from "vitest"
import samples from "@/__tests__/fixtures/ziwei-board-samples.json"
import { ZiweiBoardRequestSchema } from "@/lib/schemas/ziwei"
import { generateZiweiBoard } from "@/lib/ziwei/engine"

interface SampleCase {
  caseId: string
  payload: unknown
}

function toSnapshotShape(caseId: string, result: ReturnType<typeof generateZiweiBoard>) {
  return {
    caseId,
    meta: result.meta,
    assumptions: result.assumptions,
    input_tier: result.input_tier,
    quality_flags: result.quality_flags,
    shichen_candidates: result.shichen_candidates.map((item) => ({
      key: item.key,
      time_index: item.time_index,
      time_range: item.time_range,
    })),
    board: {
      solar_date: result.board.solar_date,
      lunar_date: result.board.lunar_date,
      chinese_date: result.board.chinese_date,
      time: result.board.time,
      time_range: result.board.time_range,
      sign: result.board.sign,
      zodiac: result.board.zodiac,
      soul: result.board.soul,
      body: result.board.body,
      five_elements_class: result.board.five_elements_class,
      soul_branch: result.board.earthly_branch_of_soul_palace,
      body_branch: result.board.earthly_branch_of_body_palace,
      palaces: result.board.palaces.map((palace) => ({
        index: palace.index,
        name: palace.name,
        heavenly_stem: palace.heavenly_stem,
        earthly_branch: palace.earthly_branch,
        major_star_names: palace.major_stars.map((star) => star.name),
        minor_star_names: palace.minor_stars.map((star) => star.name),
        adjective_star_count: palace.adjective_stars.length,
        decadal_range: palace.decadal.range,
      })),
    },
  }
}

describe("ziwei board snapshots", () => {
  it("20개 고정 샘플 케이스가 결정적으로 유지된다", () => {
    const typedSamples = samples as SampleCase[]
    expect(typedSamples).toHaveLength(20)

    const outputs = typedSamples.map((sample) => {
      const parsed = ZiweiBoardRequestSchema.parse(sample.payload)
      const result = generateZiweiBoard(parsed)
      return toSnapshotShape(sample.caseId, result)
    })

    expect(outputs).toMatchSnapshot()
  })
})
