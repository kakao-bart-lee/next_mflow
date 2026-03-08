import { createHash } from "node:crypto"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import type { BirthInfo } from "../lib/schemas/birth-info"
import type { FortuneRequest, FortuneResponse } from "../lib/saju-core"
import {
  SAJU_CORE_BASELINE_SHA,
  SAJU_CORE_BASELINE_SHORT_SHA,
  calculateSajuFromBirthInfo,
  getSajuFortuneFromBirthInfo,
} from "../lib/integrations/saju-core-adapter"
import {
  GunghapAnalyzer,
  CompatibilityType,
  type SajuData,
  type GunghapResult,
} from "../lib/saju-core/saju/gunghap"
import {
  buildLegacyAnimalCompatibilityInsight,
  buildLegacyBasicCompatibilityInsight,
  buildLegacyDetailedCompatibilityInsight,
  buildLegacySasangCompatibilityInsight,
  buildLegacyZodiacCompatibilityInsight,
  type SasangConstitution,
} from "../lib/saju-core/saju/legacyCompatibility"
import coreCasesJson from "../__tests__/fixtures/saju-core-parity-cases.json"
import compatibilityCasesJson from "../__tests__/fixtures/saju-compatibility-parity-cases.json"
import legacyCasesJson from "../__tests__/fixtures/saju-legacy-gcode-parity-cases.json"

type CoreCase = {
  id: string
  birthDate: string
  birthTime: string
  gender: "M" | "F"
  timezone: string
}

type CompatibilityCase = {
  id: string
  type: "love" | "marriage" | "business" | "friendship" | "general"
  personA: BirthInfo
  personB: BirthInfo
}

type InsightSummary = {
  sourceTable: string
  lookupKey: string
  score: number | null
  textLength: number
  textSha256: string
}

type LegacyCase = {
  id: string
  type: "love" | "marriage" | "business" | "friendship" | "general"
  personA: BirthInfo & { sasangConstitution?: SasangConstitution | null }
  personB: BirthInfo & { sasangConstitution?: SasangConstitution | null }
  expected: {
    g003: InsightSummary | null
    g012: InsightSummary | null
    g019: InsightSummary | null
    g026: InsightSummary | null
    g028: InsightSummary | null
  }
}

type UpstreamService = {
  calculateSaju: (request: FortuneRequest) => FortuneResponse
  getSajuFortune: (request: FortuneRequest, fortuneTypeOrProfileId: string) => FortuneResponse
}

type UpstreamGunghapAnalyzerType = {
  analyzeCompatibility: (
    first: SajuData,
    second: SajuData,
    type: CompatibilityType,
  ) => GunghapResult
}

type DiffFailure = {
  suite: "core-calculate" | "core-basic" | "compatibility" | "legacy"
  caseId: string
  expectedHash: string
  actualHash: string
}

const coreCases = coreCasesJson as CoreCase[]
const compatibilityCases = compatibilityCasesJson as CompatibilityCase[]
const legacyCases = legacyCasesJson as LegacyCase[]

const TYPE_MAP: Record<CompatibilityCase["type"], CompatibilityType> = {
  love: CompatibilityType.LOVE,
  marriage: CompatibilityType.MARRIAGE,
  business: CompatibilityType.BUSINESS,
  friendship: CompatibilityType.FRIENDSHIP,
  general: CompatibilityType.GENERAL,
}

const upstreamRoot = process.env.SAJU_CORE_LIB_PATH
  ? path.resolve(process.env.SAJU_CORE_LIB_PATH)
  : path.resolve(process.cwd(), "../saju-core-lib")
const upstreamFacadePath = path.resolve(upstreamRoot, "ts-src/facade.ts")
const upstreamGunghapPath = path.resolve(upstreamRoot, "ts-src/saju/gunghap.ts")
const upstreamDataLoaderPath = path.resolve(upstreamRoot, "ts-src/saju/dataLoader.ts")

function toFortuneRequest(value: CoreCase): FortuneRequest {
  return {
    birthDate: value.birthDate,
    birthTime: value.birthTime,
    gender: value.gender,
    timezone: value.timezone,
  }
}

function toRequestFromBirthInfo(value: BirthInfo): FortuneRequest {
  return {
    birthDate: value.birthDate,
    birthTime: value.isTimeUnknown ? "12:00" : (value.birthTime ?? "12:00"),
    gender: value.gender,
    timezone: value.timezone,
  }
}

function normalizeCoreFortune(result: FortuneResponse): unknown {
  const pillars = result.sajuData.pillars
  const normalizePillar = (pillar: (typeof pillars)[keyof typeof pillars]) => ({
    천간: pillar.천간,
    지지: pillar.지지,
    오행: pillar.오행,
    십이운성: pillar.십이운성,
    신살: [...pillar.신살].sort(),
    지장간: pillar.지장간.map((item) => ({ 간: item.간, 십신: item.십신 })),
  })

  return {
    basicInfo: result.sajuData.basicInfo,
    pillars: {
      년: normalizePillar(pillars.년),
      월: normalizePillar(pillars.월),
      일: normalizePillar(pillars.일),
      시: normalizePillar(pillars.시),
    },
    sipsin: result.sipsin ?? null,
    sinyakSingang: result.sinyakSingang ?? null,
    greatFortune: result.greatFortune ?? null,
    hyungchung: result.hyungchung ?? null,
  }
}

function toGunghapSajuData(fortune: FortuneResponse): SajuData {
  const p = fortune.sajuData.pillars
  return {
    four_pillars: {
      년주: { 천간: p.년.천간, 지지: p.년.지지 },
      월주: { 천간: p.월.천간, 지지: p.월.지지 },
      일주: { 천간: p.일.천간, 지지: p.일.지지 },
      시주: { 천간: p.시.천간, 지지: p.시.지지 },
    },
  }
}

function summarizeInsight(value: {
  sourceTable: string
  lookupKey: string
  text: string
  score?: number | null
} | null): InsightSummary | null {
  if (!value) {
    return null
  }

  return {
    sourceTable: value.sourceTable,
    lookupKey: value.lookupKey,
    score: value.score ?? null,
    textLength: value.text.length,
    textSha256: createHash("sha256").update(value.text, "utf8").digest("hex"),
  }
}

function toStableJson(value: unknown): string {
  return JSON.stringify(value)
}

function toHash(value: unknown): string {
  return createHash("sha256").update(toStableJson(value), "utf8").digest("hex")
}

async function loadUpstream(): Promise<{
  service: UpstreamService
  GunghapAnalyzerClass: new () => UpstreamGunghapAnalyzerType
}> {
  if (!existsSync(upstreamFacadePath) || !existsSync(upstreamGunghapPath) || !existsSync(upstreamDataLoaderPath)) {
    throw new Error(
      `upstream source path not found. expected: ${upstreamFacadePath}, ${upstreamGunghapPath}, ${upstreamDataLoaderPath}`,
    )
  }

  const facadeModule = (await import(pathToFileURL(upstreamFacadePath).href)) as {
    FortuneTellerService: new (dataLoader?: unknown) => UpstreamService
  }
  const gunghapModule = (await import(pathToFileURL(upstreamGunghapPath).href)) as {
    GunghapAnalyzer: new () => UpstreamGunghapAnalyzerType
  }
  const dataLoaderModule = (await import(pathToFileURL(upstreamDataLoaderPath).href)) as {
    SajuDataLoader: new (dataPath?: string) => unknown
  }
  const dataPath = path.resolve(upstreamRoot, "data")

  return {
    service: new facadeModule.FortuneTellerService(new dataLoaderModule.SajuDataLoader(dataPath)),
    GunghapAnalyzerClass: gunghapModule.GunghapAnalyzer,
  }
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString()
  const upstream = await loadUpstream()
  const failures: DiffFailure[] = []

  for (const testCase of coreCases) {
    const adapterResult = calculateSajuFromBirthInfo({
      ...testCase,
      isTimeUnknown: false,
    })
    const baselineResult = upstream.service.calculateSaju(toFortuneRequest(testCase))

    const normalizedAdapter = normalizeCoreFortune(adapterResult)
    const normalizedBaseline = normalizeCoreFortune(baselineResult)

    if (toStableJson(normalizedAdapter) !== toStableJson(normalizedBaseline)) {
      failures.push({
        suite: "core-calculate",
        caseId: testCase.id,
        expectedHash: toHash(normalizedBaseline),
        actualHash: toHash(normalizedAdapter),
      })
    }
  }

  for (const testCase of coreCases) {
    const adapterResult = getSajuFortuneFromBirthInfo(
      {
        ...testCase,
        isTimeUnknown: false,
      },
      "basic",
    )
    const baselineResult = upstream.service.getSajuFortune(toFortuneRequest(testCase), "basic")

    const normalizedAdapter = normalizeCoreFortune(adapterResult)
    const normalizedBaseline = normalizeCoreFortune(baselineResult)

    if (toStableJson(normalizedAdapter) !== toStableJson(normalizedBaseline)) {
      failures.push({
        suite: "core-basic",
        caseId: testCase.id,
        expectedHash: toHash(normalizedBaseline),
        actualHash: toHash(normalizedAdapter),
      })
    }
  }

  for (const testCase of compatibilityCases) {
    const nextA = calculateSajuFromBirthInfo(testCase.personA)
    const nextB = calculateSajuFromBirthInfo(testCase.personB)
    const nextAnalyzer = new GunghapAnalyzer()
    const nextResult = nextAnalyzer.analyzeCompatibility(
      toGunghapSajuData(nextA),
      toGunghapSajuData(nextB),
      TYPE_MAP[testCase.type],
    )

    const baselineA = upstream.service.calculateSaju(toRequestFromBirthInfo(testCase.personA))
    const baselineB = upstream.service.calculateSaju(toRequestFromBirthInfo(testCase.personB))
    const baselineAnalyzer = new upstream.GunghapAnalyzerClass()
    const baselineResult = baselineAnalyzer.analyzeCompatibility(
      toGunghapSajuData(baselineA),
      toGunghapSajuData(baselineB),
      TYPE_MAP[testCase.type],
    )

    if (toStableJson(nextResult) !== toStableJson(baselineResult)) {
      failures.push({
        suite: "compatibility",
        caseId: testCase.id,
        expectedHash: toHash(baselineResult),
        actualHash: toHash(nextResult),
      })
    }
  }

  for (const testCase of legacyCases) {
    const fortuneA = calculateSajuFromBirthInfo(testCase.personA)
    const fortuneB = calculateSajuFromBirthInfo(testCase.personB)
    const actual = {
      g003: summarizeInsight(buildLegacyBasicCompatibilityInsight(testCase.personA, fortuneA)),
      g012: summarizeInsight(buildLegacyDetailedCompatibilityInsight(fortuneA)),
      g019: summarizeInsight(buildLegacyZodiacCompatibilityInsight(testCase.personA)),
      g026: summarizeInsight(buildLegacyAnimalCompatibilityInsight(fortuneA, fortuneB)),
      g028: summarizeInsight(
        buildLegacySasangCompatibilityInsight(
          testCase.personA.sasangConstitution,
          testCase.personB.sasangConstitution,
        ),
      ),
    }

    if (toStableJson(actual) !== toStableJson(testCase.expected)) {
      failures.push({
        suite: "legacy",
        caseId: testCase.id,
        expectedHash: toHash(testCase.expected),
        actualHash: toHash(actual),
      })
    }
  }

  const outputDir = path.resolve(process.cwd(), "docs/generated")
  mkdirSync(outputDir, { recursive: true })

  const summary = {
    generatedAt: startedAt,
    baselineSha: SAJU_CORE_BASELINE_SHA,
    baselineShortSha: SAJU_CORE_BASELINE_SHORT_SHA,
    upstreamRoot,
    totals: {
      coreCalculateCases: coreCases.length,
      coreBasicCases: coreCases.length,
      compatibilityCases: compatibilityCases.length,
      legacyCases: legacyCases.length,
      failures: failures.length,
    },
    failures,
  }

  const jsonPath = path.resolve(outputDir, "saju-sync-diff-report.json")
  writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8")

  const lines = [
    "# Saju Sync Diff Report",
    "",
    `- Generated at: ${startedAt}`,
    `- Baseline: saju-core-lib@${SAJU_CORE_BASELINE_SHA} (${SAJU_CORE_BASELINE_SHORT_SHA})`,
    `- Upstream path: ${upstreamRoot}`,
    "",
    "## Summary",
    "",
    `- core-calculate: ${coreCases.length}`,
    `- core-basic: ${coreCases.length}`,
    `- compatibility: ${compatibilityCases.length}`,
    `- legacy: ${legacyCases.length}`,
    `- failures: ${failures.length}`,
    "",
  ]

  if (failures.length === 0) {
    lines.push("## Verdict", "", "No drift detected.")
  } else {
    lines.push("## Failures", "")
    for (const failure of failures) {
      lines.push(
        `- [${failure.suite}] ${failure.caseId} expected=${failure.expectedHash} actual=${failure.actualHash}`,
      )
    }
  }

  const markdownPath = path.resolve(outputDir, "saju-sync-diff-report.md")
  writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8")

  console.log(`Wrote JSON report: ${jsonPath}`)
  console.log(`Wrote Markdown report: ${markdownPath}`)

  if (failures.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error("Failed to generate saju sync diff report")
  console.error(error)
  process.exitCode = 1
})
