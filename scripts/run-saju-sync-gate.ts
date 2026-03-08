import { mkdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import {
  assertSajuSyncPreconditions,
  formatSajuSyncPreconditionStatus,
} from "./saju-sync-preconditions"

type VitestAssertionResult = {
  status?: string
}

type VitestSuiteResult = {
  name?: string
  assertionResults?: VitestAssertionResult[]
}

type VitestJsonReport = {
  testResults?: VitestSuiteResult[]
}

const SYNC_TEST_FILES = [
  "__tests__/lib/integrations/saju-core-adapter.boundary.test.ts",
  "__tests__/lib/integrations/saju-core-adapter.test.ts",
  "__tests__/lib/integrations/saju-core-adapter.parity.test.ts",
  "__tests__/lib/integrations/saju-core-compatibility.parity.test.ts",
  "__tests__/lib/integrations/saju-core-contract-drift.test.ts",
  "__tests__/lib/integrations/saju-core-legacy-gcodes.parity.test.ts",
  "__tests__/api/saju-interpret.test.ts",
  "__tests__/api/saju-compatibility.test.ts",
  "__tests__/lib/use-cases/analyze-saju.test.ts",
] as const

const SKIP_SENSITIVE_SUITES = new Set([
  "saju-core-adapter.parity.test.ts",
  "saju-core-compatibility.parity.test.ts",
  "saju-core-contract-drift.test.ts",
])

function countSkippedParityTests(report: VitestJsonReport): number {
  return (report.testResults ?? []).reduce((count, suite) => {
    const suiteName = suite.name ?? ""
    const isSkipSensitiveSuite = [...SKIP_SENSITIVE_SUITES].some((fileName) =>
      suiteName.endsWith(fileName),
    )

    if (!isSkipSensitiveSuite) {
      return count
    }

    const skippedInSuite = (suite.assertionResults ?? []).filter(
      (assertion) => assertion.status === "skipped",
    ).length

    return count + skippedInSuite
  }, 0)
}

function main(): void {
  const preconditions = assertSajuSyncPreconditions(["facade-dist", "gunghap-dist"])
  console.log(`[saju-sync] preconditions ok: ${formatSajuSyncPreconditionStatus(preconditions)}`)

  const outputDir = path.resolve(process.cwd(), ".tmp")
  mkdirSync(outputDir, { recursive: true })
  const outputFile = path.resolve(outputDir, "vitest-saju-sync.json")

  const vitestArgs = [
    "exec",
    "vitest",
    "run",
    ...SYNC_TEST_FILES,
    "--reporter=json",
    `--outputFile=${outputFile}`,
  ]

  const result = spawnSync("pnpm", vitestArgs, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  })

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1)
  }

  const report = JSON.parse(readFileSync(outputFile, "utf8")) as VitestJsonReport
  const skippedParityTests = countSkippedParityTests(report)

  console.log(`[saju-sync] skipped parity/drift tests: ${skippedParityTests}`)

  if (skippedParityTests !== 0) {
    throw new Error(
      `Saju sync gate requires skipped parity/drift tests = 0, received ${skippedParityTests}`,
    )
  }
}

main()
