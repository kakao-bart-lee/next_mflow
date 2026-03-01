/**
 * Fortune Interpretation Service (Refactored)
 * 사주 해설을 담당하는 서비스 - 리팩토링 버전
 */

import type { FortuneRequest, FortuneResponse } from '../models/fortuneTeller';
import { extractKorean } from '../utils';
import { TEN_STEMS, TWELVE_BRANCHES_FROM_JA, STEM_TO_ALPHA } from './constants';

/**
 * 성별 열거형
 */
export enum Gender {
  MALE = 'M',
  FEMALE = 'F',
}

/**
 * 표현식 계산 결과
 */
export interface ExpressionCalculationResult {
  readonly expression: string;
  readonly stemNumber: number;
  readonly branchNumber: number;
  readonly adjustedBranch: number;
}

/**
 * 천간-지지 추출 및 변환 유틸리티
 */
export class StemBranchExtractor {
  /**
   * '갑(甲)'에서 '갑' 추출
   */
  extractKorean(text: string): string {
    if (!text) {
      return '';
    }

    const match = /^([가-힣]+)/.exec(text);
    return match !== null && match[1] !== undefined ? match[1] : text;
  }

  /**
   * 천간 한글을 번호(1-10)로 변환
   */
  getStemNumber(stemKorean: string): number {
    const index = TEN_STEMS.indexOf(stemKorean as (typeof TEN_STEMS)[number]);
    return index >= 0 ? index + 1 : 1; // 기본값
  }

  /**
   * 지지 한글을 번호(1-12)로 변환
   */
  getBranchNumber(branchKorean: string): number {
    const index = TWELVE_BRANCHES_FROM_JA.indexOf(branchKorean as (typeof TWELVE_BRANCHES_FROM_JA)[number]);
    return index >= 0 ? index + 1 : 1; // 기본값
  }

  /**
   * 천간 한글을 알파벳으로 변환
   */
  stemToAlpha(stemKorean: string): string {
    return STEM_TO_ALPHA[stemKorean] ?? 'A';
  }
}

/**
 * S063 (총평) 계산 전용 클래스
 */
export class S063Calculator {
  constructor(private readonly extractor: StemBranchExtractor) {}

  /**
   * 성별에 따른 지지 조정
   */
  private applyGenderAdjustment(branchNum: number, gender: string): number {
    if (gender !== Gender.MALE) {
      return branchNum - 1;
    }
    return branchNum;
  }

  /**
   * 홀짝에 따른 지지 조정
   */
  private applyParityAdjustment(stemNum: number, branchNum: number): number {
    const stemParity = stemNum % 2; // 0=짝수, 1=홀수
    const branchParity = branchNum % 2;

    if (stemParity === 0) {
      // 천간이 짝수
      if (branchParity === 1) {
        // 지지가 홀수
        return branchNum - 1;
      }
    } else {
      // 천간이 홀수
      if (branchParity === 0) {
        // 지지가 짝수
        return branchNum - 1;
      }
    }

    return branchNum;
  }

  /**
   * 지지 번호를 1-12 범위로 정규화
   */
  private normalizeBranchRange(branchNum: number): number {
    let normalized = branchNum;
    while (normalized < 1) {
      normalized += 12;
    }
    while (normalized > 12) {
      normalized -= 12;
    }
    return normalized;
  }

  /**
   * S063 표현식 계산
   * PHP의 S063.php 로직을 단계별로 재현
   */
  calculate(request: FortuneRequest, yearStem: string, yearBranch: string): ExpressionCalculationResult {
    // 1. 한글 추출
    const stemKr = extractKorean(yearStem);
    const branchKr = extractKorean(yearBranch);

    // 2. 숫자 변환
    const stemNum = this.extractor.getStemNumber(stemKr);
    const branchNum = this.extractor.getBranchNumber(branchKr);

    // 3. 성별 조정
    let adjustedBranch = this.applyGenderAdjustment(branchNum, request.gender);

    // 4. 홀짝 조정
    adjustedBranch = this.applyParityAdjustment(stemNum, adjustedBranch);

    // 5. 범위 정규화
    adjustedBranch = this.normalizeBranchRange(adjustedBranch);

    // 6. DB 표현식 생성
    const alphaCode = this.extractor.stemToAlpha(stemKr);
    const expression = `${alphaCode}${adjustedBranch.toString().padStart(2, '0')}`;

    return {
      expression,
      stemNumber: stemNum,
      branchNumber: branchNum,
      adjustedBranch,
    };
  }
}

/**
 * 데이터베이스 조회 결과 추출기
 */
export class DatabaseResultRetriever {
  constructor(private readonly sData: Record<string, any>) {}

  /**
   * 데이터베이스 조회 결과 반환
   * @param table - 테이블명 (예: 'S063')
   * @param dbExpress - 검색 키 (예: 'A01')
   * @returns [text, numerical] 튜플
   */
  getResult(table: string, dbExpress: string): readonly [string, string] {
    if (!(table in this.sData)) {
      return ['', ''];
    }

    const tableData = this.sData[table];
    return this.extractFromTableData(tableData, dbExpress);
  }

  /**
   * 테이블 데이터에서 값 추출
   */
  private extractFromTableData(tableData: any, dbExpress: string): readonly [string, string] {
    if (typeof tableData === 'object' && tableData !== null) {
      if (Array.isArray(tableData)) {
        return this.extractFromListStructure(tableData, dbExpress);
      } else {
        return this.extractFromDictStructure(tableData, dbExpress);
      }
    }

    return ['', ''];
  }

  /**
   * 딕셔너리 구조에서 데이터 추출
   */
  private extractFromDictStructure(tableData: Record<string, any>, dbExpress: string): readonly [string, string] {
    if (dbExpress in tableData) {
      const record = tableData[dbExpress];
      const text = record?.data ?? '';
      const numerical = String(record?.numerical ?? '');
      return [text, numerical];
    }
    return ['', ''];
  }

  /**
   * 리스트 구조에서 데이터 추출
   */
  private extractFromListStructure(tableData: any[], dbExpress: string): readonly [string, string] {
    for (const record of tableData) {
      if (typeof record === 'object' && record !== null && record.DB_express === dbExpress) {
        const text = record.DB_data ?? '';
        const numerical = record.DB_numerical ?? '';
        return [text, numerical];
      }
    }
    return ['', ''];
  }
}

/**
 * 해설 결과 구성기
 */
export class InterpretationBuilder {
  /**
   * 개별 해설 아이템 구성
   */
  static buildInterpretationItem(text: string, numerical: string, dbExpress: string): Record<string, string> {
    return {
      text,
      numerical,
      db_express: dbExpress,
    };
  }

  /**
   * 해설 딕셔너리 구성
   */
  static buildInterpretationsDict(interpretations: Record<string, Record<string, string>>): Record<string, Record<string, string>> {
    return interpretations;
  }
}

/**
 * 사주 해설을 생성하는 클래스 (리팩토링 버전)
 */
export class FortuneInterpreter {
  protected readonly extractor: StemBranchExtractor;
  protected readonly s063Calculator: S063Calculator;
  protected readonly dbRetriever: DatabaseResultRetriever;
  protected readonly builder: InterpretationBuilder;

  /**
   * @param sData - S 테이블 데이터 (JSON에서 로드된 데이터)
   */
  constructor(sData: Record<string, any>) {
    this.extractor = new StemBranchExtractor();
    this.s063Calculator = new S063Calculator(this.extractor);
    this.dbRetriever = new DatabaseResultRetriever(sData);
    this.builder = new InterpretationBuilder();
  }

  /**
   * S063 (총평) DB 표현식 계산
   */
  calculateS063Expression(request: FortuneRequest, yearStem: string, yearBranch: string): string {
    const result = this.s063Calculator.calculate(request, yearStem, yearBranch);
    return result.expression;
  }

  /**
   * S045 (초년운) DB 표현식 계산
   */
  calculateS045Expression(yearBranch: string): string {
    const branchKr = extractKorean(yearBranch);
    const branchNum = this.extractor.getBranchNumber(branchKr);
    return branchNum.toString().padStart(2, '0');
  }

  /**
   * saju_4.php에 해당하는 해설 생성
   */
  getSaju4Interpretations(request: FortuneRequest, fortuneResponse: FortuneResponse): Record<string, Record<string, string>> {
    // 년주 천간과 지지 추출
    const yearStem = fortuneResponse.sajuData.pillars.년.천간;
    const yearBranch = fortuneResponse.sajuData.pillars.년.지지;

    // DB 표현식 계산
    const s063Express = this.calculateS063Expression(request, yearStem, yearBranch);
    const s045Express = this.calculateS045Expression(yearBranch);

    // 데이터 조회 및 결과 구성
    const [s063Text, s063Numerical] = this.dbRetriever.getResult('S063', s063Express);
    const [s045Text, s045Numerical] = this.dbRetriever.getResult('S045', s045Express);

    return InterpretationBuilder.buildInterpretationsDict({
      S063_총평: InterpretationBuilder.buildInterpretationItem(s063Text, s063Numerical, s063Express),
      S045_초년운: InterpretationBuilder.buildInterpretationItem(s045Text, s045Numerical, s045Express),
    });
  }

  /**
   * 지원하는 테이블 목록 반환
   */
  getSupportedTables(): Record<string, string> {
    // 기본 구현 - 하위 클래스에서 오버라이드 가능
    return {};
  }

  // Legacy compatibility methods
  /**
   * 하위 호환성을 위한 메서드
   */
  protected extractKoreanLegacy(text: string): string {
    return extractKorean(text);
  }

  /**
   * 하위 호환성을 위한 메서드
   */
  protected getDbResult(table: string, dbExpress: string): readonly [string, string] {
    return this.dbRetriever.getResult(table, dbExpress);
  }
}
