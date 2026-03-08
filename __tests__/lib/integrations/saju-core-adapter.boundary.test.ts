import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const scanRoots = [
  path.resolve(rootDir, "app"),
  path.resolve(rootDir, "lib"),
];
const allowedDirectFacadeConsumers = new Set([
  path.resolve(rootDir, "lib/integrations/saju-core-adapter.ts"),
]);
const skipDirPrefixes = [
  path.resolve(rootDir, "lib/saju-core"),
];
const sourceExtensions = new Set([".ts", ".tsx"]);

function collectSourceFiles(dir: string, output: string[]): void {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (skipDirPrefixes.some((prefix) => fullPath.startsWith(prefix))) {
        continue;
      }
      collectSourceFiles(fullPath, output);
      continue;
    }
    if (!sourceExtensions.has(path.extname(fullPath))) {
      continue;
    }
    output.push(fullPath);
  }
}

describe("saju-core adapter boundary", () => {
  it("runtime app/lib code does not instantiate FortuneTellerService directly", () => {
    const files: string[] = [];
    for (const scanRoot of scanRoots) {
      collectSourceFiles(scanRoot, files);
    }

    const offenders: Array<{ file: string; pattern: string }> = [];
    for (const file of files) {
      if (allowedDirectFacadeConsumers.has(file)) {
        continue;
      }
      const content = readFileSync(file, "utf8");
      if (content.includes('from "@/lib/saju-core/facade"')) {
        offenders.push({ file, pattern: 'from "@/lib/saju-core/facade"' });
      }
      if (content.includes("new FortuneTellerService(")) {
        offenders.push({ file, pattern: "new FortuneTellerService(" });
      }
    }

    expect(offenders).toEqual([]);
  });
});
