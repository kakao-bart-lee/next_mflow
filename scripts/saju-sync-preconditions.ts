import { existsSync } from "node:fs"
import path from "node:path"

export type UpstreamArtifactKey =
  | "facade-dist"
  | "gunghap-dist"
  | "facade-src"
  | "gunghap-src"
  | "data-loader-src"

export type UpstreamArtifactStatus = {
  key: UpstreamArtifactKey
  label: string
  path: string
  exists: boolean
}

export type SajuSyncPreconditionStatus = {
  upstreamRoot: string
  checks: UpstreamArtifactStatus[]
  missing: UpstreamArtifactStatus[]
}

const ARTIFACT_LABELS: Record<UpstreamArtifactKey, string> = {
  "facade-dist": "upstream dist facade",
  "gunghap-dist": "upstream dist gunghap",
  "facade-src": "upstream ts-src facade",
  "gunghap-src": "upstream ts-src gunghap",
  "data-loader-src": "upstream ts-src data loader",
}

function resolveArtifactPath(upstreamRoot: string, key: UpstreamArtifactKey): string {
  switch (key) {
    case "facade-dist":
      return path.resolve(upstreamRoot, "dist/esm/facade.js")
    case "gunghap-dist":
      return path.resolve(upstreamRoot, "dist/esm/saju/gunghap.js")
    case "facade-src":
      return path.resolve(upstreamRoot, "ts-src/facade.ts")
    case "gunghap-src":
      return path.resolve(upstreamRoot, "ts-src/saju/gunghap.ts")
    case "data-loader-src":
      return path.resolve(upstreamRoot, "ts-src/saju/dataLoader.ts")
  }
}

export function resolveSajuCoreUpstreamRoot(cwd = process.cwd()): string {
  return process.env.SAJU_CORE_LIB_PATH
    ? path.resolve(process.env.SAJU_CORE_LIB_PATH)
    : path.resolve(cwd, "../saju-core-lib")
}

export function getSajuSyncPreconditionStatus(
  keys: UpstreamArtifactKey[],
  cwd = process.cwd(),
): SajuSyncPreconditionStatus {
  const upstreamRoot = resolveSajuCoreUpstreamRoot(cwd)
  const checks = keys.map((key) => {
    const artifactPath = resolveArtifactPath(upstreamRoot, key)
    return {
      key,
      label: ARTIFACT_LABELS[key],
      path: artifactPath,
      exists: existsSync(artifactPath),
    }
  })

  return {
    upstreamRoot,
    checks,
    missing: checks.filter((check) => !check.exists),
  }
}

export function formatSajuSyncPreconditionStatus(status: SajuSyncPreconditionStatus): string {
  return status.checks
    .map((check) => `${check.label}=${check.exists ? "ok" : "missing"}`)
    .join(", ")
}

export function getRequiredArtifactPath(
  status: SajuSyncPreconditionStatus,
  key: UpstreamArtifactKey,
): string {
  const match = status.checks.find((check) => check.key === key)
  if (!match) {
    throw new Error(`Unknown upstream artifact key: ${key}`)
  }
  return match.path
}

export function assertSajuSyncPreconditions(
  keys: UpstreamArtifactKey[],
  cwd = process.cwd(),
): SajuSyncPreconditionStatus {
  const status = getSajuSyncPreconditionStatus(keys, cwd)
  if (status.missing.length === 0) {
    return status
  }

  const missingLines = status.missing.map((check) => `- ${check.label}: ${check.path}`)
  throw new Error(
    [
      `Missing saju sync upstream artifacts under ${status.upstreamRoot}`,
      ...missingLines,
      "Set SAJU_CORE_LIB_PATH or build the pinned upstream before rerunning the sync gate.",
    ].join("\n"),
  )
}
