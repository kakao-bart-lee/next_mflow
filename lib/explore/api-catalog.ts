import { promises as fs } from "node:fs"
import path from "node:path"

export interface ApiCatalogField {
  field: string
  description: string
  dataNature: string
}

export interface ApiCatalogEntry {
  id: string
  endpoint: string
  method: string | null
  path: string | null
  responseType: string | null
  topic: string | null
  feature: string | null
  fields: ApiCatalogField[]
}

export interface ApiCatalogDocument {
  version: number
  generatedAt: string
  source: {
    markdownPath: string
  }
  apis: ApiCatalogEntry[]
}

export const DEFAULT_MARKDOWN_PATH = path.join(process.cwd(), "docs", "explore-api-inventory.md")
export const DEFAULT_OUTPUT_PATH = path.join(process.cwd(), "docs", "generated", "api-catalog.json")

const SECTION_HEADER_RE = /^###\s+API-([A-Za-z0-9-]+)\.\s+`([^`]+)`(?:\s*\([^)]*\))?(?:\s*→\s+`([^`]+)`)?/
const TOPIC_RE = /\*\*주제:\s*(.+?)\*\*/
const FEATURE_RE = /^\*\*특징\*\*:\s*(.+)$/

function splitTableRow(line: string): string[] {
  return line
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell, idx, arr) => !(idx === 0 && cell === "") && !(idx === arr.length - 1 && cell === ""))
}

function normalizeCell(value: string): string {
  return value.replace(/^`(.+)`$/, "$1").trim()
}

function extractFields(sectionLines: string[]): ApiCatalogField[] {
  const fields: ApiCatalogField[] = []

  const tableStart = sectionLines.findIndex((line) => line.trim().startsWith("|"))
  if (tableStart < 0) return fields

  for (let i = tableStart + 2; i < sectionLines.length; i += 1) {
    const raw = sectionLines[i]?.trim()
    if (!raw || !raw.startsWith("|")) break
    const cols = splitTableRow(raw)
    if (cols.length < 3) continue
    fields.push({
      field: normalizeCell(cols[0]),
      description: normalizeCell(cols[1]),
      dataNature: normalizeCell(cols[2]),
    })
  }

  return fields
}

export function parseExploreApiInventory(markdown: string): ApiCatalogEntry[] {
  const lines = markdown.split(/\r?\n/)
  const entries: ApiCatalogEntry[] = []

  for (let i = 0; i < lines.length; i += 1) {
    const headerMatch = lines[i].match(SECTION_HEADER_RE)
    if (!headerMatch) continue

    const [, rawId, endpoint, responseType] = headerMatch
    const endpointText = endpoint.trim()
    const methodPathMatch = endpointText.match(/^([A-Z]+)\s+(.+)$/)
    const method = methodPathMatch?.[1] ?? null
    const apiPath = methodPathMatch?.[2]?.trim() ?? null
    const sectionStart = i + 1
    let sectionEnd = lines.length
    for (let j = sectionStart; j < lines.length; j += 1) {
      if (lines[j].startsWith("### API-")) {
        sectionEnd = j
        break
      }
    }

    const sectionLines = lines.slice(sectionStart, sectionEnd)
    const sectionText = sectionLines.join("\n")

    const topic = sectionText.match(TOPIC_RE)?.[1]?.trim() ?? null
    const feature = sectionLines
      .map((line) => line.match(FEATURE_RE)?.[1]?.trim() ?? null)
      .find((value): value is string => Boolean(value)) ?? null

    entries.push({
      id: `API-${rawId}`,
      endpoint: endpointText,
      method,
      path: apiPath,
      responseType: responseType?.trim() ?? null,
      topic,
      feature,
      fields: extractFields(sectionLines),
    })

    i = sectionEnd - 1
  }

  return entries
}

export async function buildApiCatalogFromMarkdownFile(markdownPath = DEFAULT_MARKDOWN_PATH): Promise<ApiCatalogDocument> {
  const markdown = await fs.readFile(markdownPath, "utf-8")
  const apis = parseExploreApiInventory(markdown)

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: {
      markdownPath,
    },
    apis,
  }
}

export async function writeApiCatalog(
  document: ApiCatalogDocument,
  outputPath = DEFAULT_OUTPUT_PATH,
): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf-8")
}

export async function readApiCatalog(outputPath = DEFAULT_OUTPUT_PATH): Promise<ApiCatalogDocument> {
  const raw = await fs.readFile(outputPath, "utf-8")
  return JSON.parse(raw) as ApiCatalogDocument
}
