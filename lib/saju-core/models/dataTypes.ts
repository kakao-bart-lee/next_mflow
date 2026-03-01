/**
 * Database and Data Structure Types
 * 데이터베이스 및 데이터 구조 타입 정의
 */

/**
 * Database record structure
 * 데이터베이스 레코드 구조
 */
export interface DbRecord {
  readonly DB_express: string;
  readonly DB_data?: string;
  readonly DB_numerical?: string;
  readonly DB_data_m?: string;
  readonly DB_data_w?: string;
  [key: string]: unknown;
}

/**
 * S-Tables data structure
 * S 테이블 데이터 구조
 */
export interface STablesData {
  readonly [tableName: string]: readonly DbRecord[];
}

/**
 * Pillar data from calculation
 * 사주 기둥 계산 결과 데이터
 */
export interface PillarData {
  readonly 천간: string;
  readonly 지지: string;
  readonly 십성_천간: string;
  readonly 십성_지지: string;
}

/**
 * Jijanggan calculation result
 * 지장간 계산 결과
 *
 * Note: This is an alias for PillarJijanggan from saju/jijanggan.ts
 * Import PillarJijanggan directly for better type safety
 */
export interface JijangganData {
  readonly stem1: string;
  readonly stem2: string;
  readonly stem3: string;
  readonly stem1_sipsin: string;
  readonly stem2_sipsin: string;
  readonly stem3_sipsin: string;
}

/**
 * Comprehensive sinsal data
 * 종합 신살 데이터
 */
export interface SinsalData {
  readonly 신살?: Record<string, string | null>;
  readonly 길신?: Record<string, string | null>;
  [key: string]: unknown;
}

/**
 * Fortune type response structure
 * 운세 타입 응답 구조
 */
export interface FortuneTypesResponse {
  readonly fortune_types: Record<string, string>;
  readonly combinations: Record<string, string[]>;
  readonly table_descriptions: Record<string, string>;
}
