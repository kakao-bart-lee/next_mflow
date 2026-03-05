import {
  DEFAULT_MARKDOWN_PATH,
  DEFAULT_OUTPUT_PATH,
  buildApiCatalogFromMarkdownFile,
  writeApiCatalog,
} from "../lib/explore/api-catalog"

async function main(): Promise<void> {
  const document = await buildApiCatalogFromMarkdownFile(DEFAULT_MARKDOWN_PATH)
  await writeApiCatalog(document, DEFAULT_OUTPUT_PATH)
  console.log(`Wrote API catalog: ${DEFAULT_OUTPUT_PATH} (${document.apis.length} APIs)`)
}

main().catch((error) => {
  console.error("Failed to generate API catalog")
  console.error(error)
  process.exitCode = 1
})
