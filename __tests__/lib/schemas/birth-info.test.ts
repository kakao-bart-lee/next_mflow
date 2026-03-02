import { describe, it, expect } from "vitest"
import { BirthInfoSchema } from "@/lib/schemas/birth-info"

const validBase = {
  birthDate: "1990-01-15",
  birthTime: "14:30",
  isTimeUnknown: false,
  timezone: "Asia/Seoul",
  gender: "M" as const,
}

describe("BirthInfoSchema", () => {
  describe("정상 케이스", () => {
    it("최소 필드로 파싱된다", () => {
      const result = BirthInfoSchema.safeParse(validBase)
      expect(result.success).toBe(true)
    })

    it("위치 정보 포함 파싱된다", () => {
      const result = BirthInfoSchema.safeParse({
        ...validBase,
        latitude: 37.5665,
        longitude: 126.978,
        locationName: "서울",
      })
      expect(result.success).toBe(true)
    })

    it("isTimeUnknown=true이면 birthTime=null 허용", () => {
      const result = BirthInfoSchema.safeParse({
        ...validBase,
        birthTime: null,
        isTimeUnknown: true,
      })
      expect(result.success).toBe(true)
    })

    it("성별 F도 허용된다", () => {
      const result = BirthInfoSchema.safeParse({ ...validBase, gender: "F" })
      expect(result.success).toBe(true)
    })

    it("위도 경계값 -90, 90이 허용된다", () => {
      expect(BirthInfoSchema.safeParse({ ...validBase, latitude: -90 }).success).toBe(true)
      expect(BirthInfoSchema.safeParse({ ...validBase, latitude: 90 }).success).toBe(true)
    })
  })

  describe("오류 케이스", () => {
    it("날짜 형식이 잘못되면 실패한다", () => {
      const result = BirthInfoSchema.safeParse({ ...validBase, birthDate: "90-01-15" })
      expect(result.success).toBe(false)
    })

    it("시간 형식이 잘못되면 실패한다", () => {
      const result = BirthInfoSchema.safeParse({ ...validBase, birthTime: "2:30" })
      expect(result.success).toBe(false)
    })

    it("시간 범위가 잘못되면 실패한다", () => {
      expect(BirthInfoSchema.safeParse({ ...validBase, birthTime: "24:00" }).success).toBe(false)
      expect(BirthInfoSchema.safeParse({ ...validBase, birthTime: "99:00" }).success).toBe(false)
      expect(BirthInfoSchema.safeParse({ ...validBase, birthTime: "12:99" }).success).toBe(false)
    })

    it("성별이 M/F 이외이면 실패한다", () => {
      const result = BirthInfoSchema.safeParse({ ...validBase, gender: "male" })
      expect(result.success).toBe(false)
    })

    it("위도 범위 초과 시 실패한다", () => {
      expect(BirthInfoSchema.safeParse({ ...validBase, latitude: 91 }).success).toBe(false)
      expect(BirthInfoSchema.safeParse({ ...validBase, latitude: -91 }).success).toBe(false)
    })

    it("경도 범위 초과 시 실패한다", () => {
      expect(BirthInfoSchema.safeParse({ ...validBase, longitude: 181 }).success).toBe(false)
    })

    it("isTimeUnknown=true인데 birthTime이 있으면 실패한다", () => {
      const result = BirthInfoSchema.safeParse({
        ...validBase,
        birthTime: "09:00",
        isTimeUnknown: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path.join("."))
        expect(paths).toContain("birthTime")
      }
    })

    it("isTimeUnknown=false인데 birthTime이 없으면 실패한다", () => {
      const result = BirthInfoSchema.safeParse({
        ...validBase,
        birthTime: null,
        isTimeUnknown: false,
      })
      expect(result.success).toBe(false)
    })

    it("timezone이 빈 문자열이면 실패한다", () => {
      const result = BirthInfoSchema.safeParse({ ...validBase, timezone: "" })
      expect(result.success).toBe(false)
    })

    it("timezone이 IANA 형식이 아니면 실패한다", () => {
      const result = BirthInfoSchema.safeParse({ ...validBase, timezone: "KST" })
      expect(result.success).toBe(false)
    })
  })
})
