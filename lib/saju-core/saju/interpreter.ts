/**
 * Extended Fortune Interpreter
 * 확장된 사주 해설 서비스
 */

import type { FortuneRequest, FortuneResponse } from '../models/fortuneTeller';
import { FortuneInterpreter, DatabaseResultRetriever, InterpretationBuilder } from './fortuneInterpreter';
import type { CalculationInput } from './fortuneCalculatorBase';
import { CalculatorFactory } from './calculatorFactory';

/**
 * 확장된 사주 해설 생성 클래스
 */
export class ExtendedFortuneInterpreter extends FortuneInterpreter {
  private readonly factory: CalculatorFactory;
  private readonly saju4Tables: readonly string[];

  /**
   * @param sData - 모든 테이블 데이터 (S, F, T 포함)
   */
  constructor(sData: Record<string, any>) {
    super(sData);

    // 팩토리 초기화
    this.factory = new CalculatorFactory(this.dbRetriever);

    // 사주4 기본 테이블 목록 (순서 중요)
    this.saju4Tables = [
      'S063', // 총평
      'S045', // 초년운
      'S046', // 중년운
      'S047', // 말년운
      'S048', // 타고난 성격
      'S049', // 사회성
      'S050', // 목표의식
      'S051', // 건강운
      'S052', // 직업운
      'S053', // 연애운
      'S054', // 섹스운
      'S055', // 궁합
      'S056', // 부부궁
      'S057', // 금전운
      'S058', // 가정운
      'S059', // 자식운
      'S060', // 학업운
      'S061', // 천생연분
      'S007', // 현재의 길흉사
      'S008', // 미래운세
      'S009', // 기타운세1
      'S010', // 기타운세2
      'F011', // 주역괘
      'T039', // 나에게 맞는 숫자운
    ];
  }

  /**
   * 포괄적인 해설 생성
   *
   * @param request - 사주 요청
   * @param fortuneResponse - 사주 계산 결과
   * @param tableList - 특정 테이블 목록 (없으면 기본 saju4 테이블들)
   * @returns 모든 해설 결과
   */
  getComprehensiveInterpretations(
    request: FortuneRequest,
    fortuneResponse: FortuneResponse,
    tableList?: readonly string[]
  ): Record<string, Record<string, string>> {
    const tables = tableList ?? this.saju4Tables;

    // 입력 데이터 구성
    const inputData = this.buildCalculationInput(request, fortuneResponse);

    // 각 테이블별 계산 수행
    const interpretations: Record<string, Record<string, string>> = {};

    for (const tableName of tables) {
      try {
        const calculator = this.factory.createCalculator(tableName);
        const result = calculator.calculate(inputData);

        // 결과 형식 통일
        const interpretationKey = `${tableName}_${this.getTableDescription(tableName)}`;
        interpretations[interpretationKey] = InterpretationBuilder.buildInterpretationItem(
          result.text,
          result.numerical ?? '',
          result.expression
        );
      } catch (error) {
        // 개별 테이블 오류 시 로그 기록하고 계속 진행
        console.warn(`Warning: Failed to calculate ${tableName}:`, error);
        interpretations[`${tableName}_ERROR`] = {
          text: `계산 오류: ${String(error)}`,
          numerical: '0',
          db_express: 'ERROR',
        };
      }
    }

    return interpretations;
  }

  /**
   * 카테고리별 해설 생성
   *
   * @param request - 사주 요청
   * @param fortuneResponse - 사주 계산 결과
   * @param category - 'basic' | 'love' | 'money' | 'health' | 'career' | 'family' | 'personality' | 'fortune' | 'daily' | 'special'
   * @returns 카테고리별 해설 결과
   */
  getCategoryInterpretations(
    request: FortuneRequest,
    fortuneResponse: FortuneResponse,
    category: string
  ): Record<string, Record<string, string>> {
    const categoryTables: Record<string, readonly string[]> = {
      basic: ['S063', 'S045', 'S046', 'S047'], // 기본 (총평, 초중말년운)
      love: ['S053', 'S054', 'S055', 'S056', 'S061'], // 연애관련
      money: ['S057'], // 재물운
      health: ['S051'], // 건강운
      career: ['S052'], // 직업운
      family: ['S058', 'S059'], // 가정, 자식운
      personality: ['S048', 'S049', 'S050'], // 성격, 사회성, 목표의식
      fortune: ['S007', 'S008', 'S009', 'S010'], // 길흉운
      daily: ['S087', 'S088', 'S089', 'S090', 'S091', 'S092'], // 오늘의 운세
      special: ['F011', 'T039'], // 특수 (주역, 숫자운)
    };

    const tables = categoryTables[category];
    if (!tables) {
      throw new Error(`Unknown category: ${category}`);
    }

    return this.getComprehensiveInterpretations(request, fortuneResponse, tables);
  }

  /**
   * 사주 데이터를 계산 입력으로 변환
   */
  private buildCalculationInput(request: FortuneRequest, fortuneResponse: FortuneResponse): CalculationInput {
    const pillars = fortuneResponse.sajuData.pillars;

    return {
      yearStem: pillars.년.천간,
      yearBranch: pillars.년.지지,
      monthStem: pillars.월.천간,
      monthBranch: pillars.월.지지,
      dayStem: pillars.일.천간,
      dayBranch: pillars.일.지지,
      hourStem: pillars.시.천간,
      hourBranch: pillars.시.지지,
      gender: request.gender,
      additionalData: {
        birth_date: request.birthDate,
        birth_time: request.birthTime,
        timezone: request.timezone,
        jumno: fortuneResponse.inputData['jumno'] ?? null,
      },
    };
  }

  /**
   * 테이블명에서 설명 추출
   */
  private getTableDescription(tableName: string): string {
    const descriptions = this.factory.getSupportedTables();
    return descriptions[tableName] ?? tableName;
  }

  // === Legacy 호환성 메서드 ===

  /**
   * 기존 saju4 해설 (하위 호환성)
   */
  override getSaju4Interpretations(
    request: FortuneRequest,
    fortuneResponse: FortuneResponse
  ): Record<string, Record<string, string>> {
    // 기존 방식으로 S063, S045만 계산
    const legacyResult = super.getSaju4Interpretations(request, fortuneResponse);

    // 확장된 방식으로 전체 계산 (옵션)
    // const comprehensiveResult = this.getComprehensiveInterpretations(request, fortuneResponse);

    return legacyResult;
  }

  // === 유틸리티 메서드 ===

  /**
   * 사용 가능한 카테고리 목록
   */
  getAvailableCategories(): readonly string[] {
    return ['basic', 'love', 'money', 'health', 'career', 'family', 'personality', 'fortune', 'daily', 'special'];
  }

  /**
   * 지원하는 테이블 목록과 설명
   */
  override getSupportedTables(): Record<string, string> {
    return this.factory.getSupportedTables();
  }

  /**
   * 단일 테이블 계산
   */
  calculateSingleTable(
    tableName: string,
    request: FortuneRequest,
    fortuneResponse: FortuneResponse
  ): Record<string, string> {
    const inputData = this.buildCalculationInput(request, fortuneResponse);

    const calculator = this.factory.createCalculator(tableName);
    const result = calculator.calculate(inputData);

    return InterpretationBuilder.buildInterpretationItem(result.text, result.numerical ?? '', result.expression);
  }
}

// === 편의 함수 ===

/**
 * 확장된 해석기 생성 편의 함수
 */
export function createExtendedInterpreter(sData: Record<string, any>): ExtendedFortuneInterpreter {
  return new ExtendedFortuneInterpreter(sData);
}

/**
 * 해설 요약 정보 생성
 */
export function getInterpretationSummary(interpretations: Record<string, any>): Record<string, any> {
  return {
    total_count: Object.keys(interpretations).length,
    categories: Object.keys(interpretations),
    has_errors: Object.keys(interpretations).some((key) => key.includes('ERROR')),
    timestamp: new Date().toISOString(),
  };
}
