/**
 * JSON Data Loader for Saju calculations.
 * 사주 계산을 위한 JSON 데이터 로더
 */

import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

/**
 * Get the default data path, handling both ESM and CJS environments.
 */
function getDefaultDataPath(): string {
  const possiblePaths = [
    join(process.cwd(), 'lib', 'saju-core', 'data'),
    join(process.cwd(), 'data'),
    join(process.cwd(), 'dist', 'data'),
    join(process.cwd(), 'dist', 'esm', 'data'),
    join(process.cwd(), 'dist', 'cjs', 'data'),
    join(__dirname, '..', 'data'),
    join(__dirname, '..', '..', 'data'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return join(process.cwd(), 'lib', 'saju-core', 'data');
}

/**
 * Manages loading and caching of JSON data files for Saju calculations.
 */
export class SajuDataLoader {
  private readonly dataPath: string;
  private cache = new Map<string, unknown>();

  constructor(dataPath?: string) {
    if (dataPath) {
      this.dataPath = dataPath;
    } else {
      // Default to the package data directory
      this.dataPath = getDefaultDataPath();
    }
  }

  /**
   * Load and cache mansedata.json (large file).
   */
  loadMansedata(): Record<string, unknown> {
    return this.loadWithCache('mansedata');
  }

  /**
   * Load and cache s_tables.json.
   */
  loadSTables(): Record<string, unknown> {
    return this.loadWithCache('s_tables');
  }

  /**
   * Load and cache etc_tables.json.
   */
  loadEtcTables(): Record<string, unknown> {
    return this.loadWithCache('etc_tables');
  }

  /**
   * Load and cache f_tables.json.
   */
  loadFTables(): Record<string, unknown> {
    return this.loadWithCache('f_tables');
  }

  /**
   * Load and cache g_tables.json.
   */
  loadGTables(): Record<string, unknown> {
    return this.loadWithCache('g_tables');
  }

  /**
   * Load and cache j_tables.json.
   */
  loadJTables(): Record<string, unknown> {
    return this.loadWithCache('j_tables');
  }

  /**
   * Load and cache n_tables.json.
   */
  loadNTables(): Record<string, unknown> {
    return this.loadWithCache('n_tables');
  }

  /**
   * Load and cache t_tables.json.
   */
  loadTTables(): Record<string, unknown> {
    return this.loadWithCache('t_tables');
  }

  /**
   * Load and cache y_tables.json.
   */
  loadYTables(): Record<string, unknown> {
    return this.loadWithCache('y_tables');
  }

  /**
   * Load and cache solar_term_entry.json.
   */
  loadSolarTermEntry(): Record<string, unknown> {
    return this.loadWithCache('solar_term_entry');
  }

  /**
   * Load and cache yukhyo_data.json.
   */
  loadYukhyoData(): Record<string, unknown> {
    return this.loadWithCache('yukhyo_data');
  }

  /**
   * Load and merge all fortune lookup tables used by interpreters.
   */
  loadFortuneTables(): Record<string, unknown> {
    const cacheKey = 'fortune_tables';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as Record<string, unknown>;
    }

    const merged = {
      ...this.loadSTables(),
      ...this.loadFTables(),
      ...this.loadGTables(),
      ...this.loadJTables(),
      ...this.loadNTables(),
      ...this.loadTTables(),
      ...this.loadYTables(),
    };

    this.cache.set(cacheKey, merged);
    return merged;
  }

  /**
   * Generic loader for any table file.
   *
   * @param tableName - Name of the table file (without .json extension)
   * @returns Dictionary containing table data
   */
  loadTable(tableName: string): Record<string, unknown> {
    // Use cached methods if available
    const methodMap: Record<string, () => Record<string, unknown>> = {
      mansedata: () => this.loadMansedata(),
      s_tables: () => this.loadSTables(),
      etc_tables: () => this.loadEtcTables(),
      f_tables: () => this.loadFTables(),
      g_tables: () => this.loadGTables(),
      j_tables: () => this.loadJTables(),
      n_tables: () => this.loadNTables(),
      t_tables: () => this.loadTTables(),
      y_tables: () => this.loadYTables(),
      fortune_tables: () => this.loadFortuneTables(),
      solar_term_entry: () => this.loadSolarTermEntry(),
      yukhyo_data: () => this.loadYukhyoData(),
    };

    if (tableName in methodMap) {
      return methodMap[tableName]!();
    }

    // Fallback for other tables
    return this.loadWithCache(tableName);
  }

  /**
   * Load JSON file with caching.
   */
  private loadWithCache(tableName: string): Record<string, unknown> {
    if (this.cache.has(tableName)) {
      return this.cache.get(tableName) as Record<string, unknown>;
    }

    const filePath = join(this.dataPath, `${tableName}.json`);
    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as Record<string, unknown>;
      this.cache.set(tableName, data);
      return data;
    } catch (error) {
      console.warn(`Failed to load ${tableName}.json:`, error);
      return {};
    }
  }

  /**
   * Clear all cached data.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size.
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance for shared data loading (serverless-safe via globalThis)
const globalForDataLoader = globalThis as unknown as {
  dataLoader: SajuDataLoader | undefined;
};

/**
 * Get or create the singleton data loader instance.
 * Uses globalThis pattern for serverless safety (like Prisma).
 */
export function getDataLoader(): SajuDataLoader {
  if (!globalForDataLoader.dataLoader) {
    globalForDataLoader.dataLoader = new SajuDataLoader();
  }
  return globalForDataLoader.dataLoader;
}

/**
 * Reset the singleton instance (mainly for testing).
 */
export function resetDataLoader(): void {
  globalForDataLoader.dataLoader = undefined;
}

/**
 * Legacy-style DataLoader exposing getData(tableName).
 * Provided for backward compatibility.
 */
export class DataLoader {
  private readonly loader: SajuDataLoader;

  constructor() {
    this.loader = getDataLoader();
  }

  getData(tableName: string): Record<string, unknown> {
    switch (tableName) {
      case 's_tables':
        return this.loader.loadSTables();
      case 'f_tables':
        return this.loader.loadFTables();
      case 't_tables':
        return this.loader.loadTTables();
      case 'j_tables':
        return this.loader.loadJTables();
      case 'mansedata':
        return this.loader.loadMansedata();
      case 'fortune_tables':
        return this.loader.loadFortuneTables();
      default:
        return this.loader.loadTable(tableName);
    }
  }
}
