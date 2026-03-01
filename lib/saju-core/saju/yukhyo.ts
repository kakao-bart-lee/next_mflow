/**
 * Yukhyo (Six Lines Divination) System
 * 육효(六爻) 점술 시스템 - 주역 기반 6개 효로 구성된 점술
 */

/** 육효의 한 줄(효)을 나타내는 인터페이스 */
export interface YukhyoLine {
  original_value: number; // 원래 랜덤값 (0-3)
  yin_yang: number; // 음양 값 (1: 양, 2: 음)
  changing: boolean; // 동효 여부
  image_type: string; // 이미지 타입
}

/** 괘 정보 인터페이스 */
export interface HexagramInfo {
  title: string;
  palace: string;
  jiji: string[];
  boksin: string[];
  sehyo: number;
  hapchung?: string;
}

/** 육효 점술 결과 */
export interface YukhyoResult {
  // 기본 정보
  hexagram_number: string; // 본괘 번호
  changed_hexagram_number: string; // 지괘 번호
  stick_values: number[]; // 6개 막대기 값
  lines: YukhyoLine[]; // 6개 효

  // 괘 정보
  title: string; // 괘명
  palace: string; // 궁 (震木宮, 離火宮 등)
  earthly_branches: string[]; // 지지 (子丑寅卯辰巳午未申酉戌亥)
  hidden_stems: string[]; // 복신
  world_line: number; // 세효 (응용 효)
  changing_lines: number[]; // 동효 위치들

  // 지괘 정보 (변화된 괘)
  changed_title: string; // 지괘명
  changed_palace: string; // 지괘 궁
  changed_earthly_branches: string[]; // 지괘 지지

  // 공망 (Empty Positions)
  empty_positions: string[]; // 공망 지지
  starting_empty: string; // 출공

  // 오행친 (Five Elements Relations)
  five_elements_relations: string[]; // 오행 친 관계 (兄弟父母子孫妻財官鬼)

  // 해석
  interpretation: string; // 괘 해석
}

type EmptyPatternData = readonly [string, string, string];

/**
 * 육효 점술 시스템
 */
export class YukhyoDivination {
  private readonly yukhyoData: Record<string, HexagramInfo>;
  private readonly heavenlyStems: readonly string[];
  private readonly earthlyBranches: readonly string[];
  private readonly emptyPatterns: ReadonlyMap<string, EmptyPatternData>;
  private readonly fiveElementsRelations: Record<string, Record<string, string>>;

  private emptyPositionsCacheDate: string | null = null;
  private emptyPositionsCache: string[] | null = null;

  constructor(yukhyoData?: Record<string, HexagramInfo>) {
    this.yukhyoData = yukhyoData ?? this.createDefaultYukhyoData();

    this.heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    this.earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

    // 공망 패턴
    this.emptyPatterns = new Map<string, EmptyPatternData>([
      ['甲子,乙丑,丙寅,丁卯,戊辰,己巳,庚午,辛未,壬申,癸酉', ['戌', '亥', '甲戌']],
      ['甲戌,乙亥,丙子,丁丑,戊寅,己卯,庚辰,辛巳,壬午,癸未', ['申', '酉', '甲申']],
      ['甲申,乙酉,丙戌,丁亥,戊子,己丑,庚寅,辛卯,壬辰,癸巳', ['午', '未', '甲午']],
      ['甲午,乙未,丙申,丁酉,戊戌,己亥,庚子,辛丑,壬寅,癸卯', ['辰', '巳', '甲辰']],
      ['甲辰,乙巳,丙午,丁未,戊申,己酉,庚戌,辛亥,壬子,癸丑', ['寅', '卯', '甲寅']],
      ['甲寅,乙卯,丙辰,丁巳,戊午,己未,庚申,辛酉,壬戌,癸亥', ['子', '丑', '甲子']],
    ]);

    // 오행친 관계 매핑
    this.fiveElementsRelations = {
      wood_palace: {
        '寅,卯': '兄',
        '巳,午': '孫',
        '申,酉': '官',
        '子,亥': '父',
        '辰,戌,丑,未': '財',
      },
      fire_palace: {
        '寅,卯': '父',
        '巳,午': '兄',
        '申,酉': '財',
        '子,亥': '官',
        '辰,戌,丑,未': '孫',
      },
      earth_palace: {
        '寅,卯': '官',
        '巳,午': '父',
        '申,酉': '孫',
        '子,亥': '財',
        '辰,戌,丑,未': '兄',
      },
      metal_palace: {
        '寅,卯': '財',
        '巳,午': '官',
        '申,酉': '兄',
        '子,亥': '孫',
        '辰,戌,丑,未': '父',
      },
      water_palace: {
        '寅,卯': '孫',
        '巳,午': '財',
        '申,酉': '父',
        '子,亥': '兄',
        '辰,戌,丑,未': '官',
      },
    };
  }

  private createDefaultYukhyoData(): Record<string, HexagramInfo> {
    return {
      '111111': {
        title: '乾為天',
        palace: '乾金宮',
        jiji: ['戌', '申', '午', '辰', '寅', '子'],
        boksin: ['', '子', '戌', '', '申', '午'],
        sehyo: 3,
        hapchung: '乾宮八純卦',
      },
      '222222': {
        title: '坤為地',
        palace: '坤土宮',
        jiji: ['未', '酉', '亥', '丑', '卯', '巳'],
        boksin: ['', '巳', '未', '', '酉', '亥'],
        sehyo: 4,
        hapchung: '坤宮八純卦',
      },
    };
  }

  /**
   * 육효 점술 시행
   */
  castDivination(useCurrentDate: boolean = true): YukhyoResult {
    // 1. 6개 막대기 던지기 (0-3 범위)
    const stickValues = Array.from({ length: 6 }, () => Math.floor(Math.random() * 4));

    // 2. 효 생성
    const lines: YukhyoLine[] = [];
    const changingLines: number[] = [];

    for (let i = 0; i < stickValues.length; i++) {
      const stickVal = stickValues[i]!; // Array는 6개로 초기화되었으므로 항상 존재
      let line: YukhyoLine;

      if (stickVal === 3) {
        // 老양 -> 음효로 변
        line = {
          original_value: stickVal,
          yin_yang: 1, // 원래는 양
          changing: true,
          image_type: 'bar1_noyang',
        };
        changingLines.push(i + 1);
      } else if (stickVal === 0) {
        // 老음 -> 양효로 변
        line = {
          original_value: stickVal,
          yin_yang: 2, // 원래는 음
          changing: true,
          image_type: 'bar0_noum',
        };
        changingLines.push(i + 1);
      } else if (stickVal === 1) {
        // 소양
        line = {
          original_value: stickVal,
          yin_yang: 1,
          changing: false,
          image_type: 'bar1',
        };
      } else {
        // stickVal === 2, 소음
        line = {
          original_value: stickVal,
          yin_yang: 2,
          changing: false,
          image_type: 'bar0',
        };
      }

      lines.push(line);
    }

    // 3. 본괘와 지괘 생성
    const originalHexagram = lines.map((line) => line.yin_yang).join('');

    // 동효가 있는 경우 지괘 생성
    const changedLines = lines.map((line) => {
      if (line.changing) {
        return line.yin_yang === 1 ? 2 : 1;
      }
      return line.yin_yang;
    });

    const changedHexagram = changedLines.join('');

    // 4. 현재 날짜의 간지 구하기 (공망 계산용)
    const emptyPositions = useCurrentDate ? this.calculateEmptyPositions() : ['戌', '亥'];

    // 5. 괘 정보 조회
    const originalInfo = this.yukhyoData[originalHexagram] ?? this.getDefaultHexagramInfo();
    const changedInfo = this.yukhyoData[changedHexagram] ?? this.getDefaultHexagramInfo();

    // 6. 오행친 계산
    const fiveElementsRelations = this.calculateFiveElementsRelations(
      originalInfo.palace,
      originalInfo.jiji,
      changingLines
    );

    // 7. 결과 생성
    return {
      hexagram_number: originalHexagram,
      changed_hexagram_number: changedHexagram,
      stick_values: stickValues,
      lines,
      title: originalInfo.title,
      palace: originalInfo.palace,
      earthly_branches: originalInfo.jiji,
      hidden_stems: originalInfo.boksin,
      world_line: originalInfo.sehyo,
      changing_lines: changingLines,
      changed_title: changedInfo.title,
      changed_palace: changedInfo.palace,
      changed_earthly_branches: changedInfo.jiji,
      empty_positions: emptyPositions,
      starting_empty: this.getStartingEmpty(emptyPositions),
      five_elements_relations: fiveElementsRelations,
      interpretation: this.generateInterpretation(originalInfo, changedInfo, changingLines),
    };
  }

  private calculateEmptyPositions(): string[] {
    const today = new Date();
    const todayKey = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

    if (this.emptyPositionsCacheDate === todayKey && this.emptyPositionsCache) {
      return this.emptyPositionsCache;
    }

    // 기본 계산 (간단한 근사치)
    const yearStemIdx = (today.getFullYear() - 1984) % 10;
    const yearBranchIdx = (today.getFullYear() - 1984) % 12;

    const dayStemIdx = (today.getDate() - 1) % 10;
    const dayBranchIdx = (today.getDate() - 1) % 12;

    const dayStem = this.heavenlyStems[dayStemIdx] ?? '甲';
    const dayBranch = this.earthlyBranches[dayBranchIdx] ?? '子';
    const dayCombination = dayStem + dayBranch;

    // 공망 패턴 찾기
    for (const [pattern, [empty1, empty2, _starting]] of this.emptyPatterns.entries()) {
      if (pattern.split(',').includes(dayCombination)) {
        this.emptyPositionsCacheDate = todayKey;
        this.emptyPositionsCache = [empty1, empty2];
        return this.emptyPositionsCache;
      }
    }

    this.emptyPositionsCacheDate = todayKey;
    this.emptyPositionsCache = ['戌', '亥'];
    return this.emptyPositionsCache; // 기본값
  }

  private getStartingEmpty(emptyPositions: string[]): string {
    if (emptyPositions.length >= 2) {
      return '甲' + emptyPositions[0];
    }
    return '甲戌';
  }

  private calculateFiveElementsRelations(
    palace: string,
    earthlyBranches: string[],
    _changingLines: number[]
  ): string[] {
    const relations: string[] = [];

    // 궁에 따른 관계 매핑 선택
    let relationMap: Record<string, string> | undefined;
    if (palace.includes('木宮')) {
      relationMap = this.fiveElementsRelations.wood_palace;
    } else if (palace.includes('火宮')) {
      relationMap = this.fiveElementsRelations.fire_palace;
    } else if (palace.includes('土宮')) {
      relationMap = this.fiveElementsRelations.earth_palace;
    } else if (palace.includes('金宮')) {
      relationMap = this.fiveElementsRelations.metal_palace;
    } else if (palace.includes('水宮')) {
      relationMap = this.fiveElementsRelations.water_palace;
    } else {
      relationMap = this.fiveElementsRelations.wood_palace; // 기본값
    }

    if (!relationMap) {
      relationMap = this.fiveElementsRelations.wood_palace;
    }

    // 각 효의 지지에 대해 오행친 계산
    for (const branch of earthlyBranches) {
      let relation = '兄'; // 기본값

      // relationMap은 위에서 반드시 할당되므로 타입 단언 사용
      for (const [branchGroup, rel] of Object.entries(relationMap!)) {
        if (branchGroup.split(',').includes(branch)) {
          relation = rel;
          break;
        }
      }

      relations.push(relation);
    }

    return relations;
  }

  private getDefaultHexagramInfo(): HexagramInfo {
    return {
      title: '未知卦',
      palace: '震木宮',
      jiji: ['子', '丑', '寅', '卯', '辰', '巳'],
      boksin: ['', '', '', '', '', ''],
      sehyo: 3,
      hapchung: '',
    };
  }

  private generateInterpretation(
    originalInfo: HexagramInfo,
    changedInfo: HexagramInfo,
    changingLines: number[]
  ): string {
    let interpretation = `본괘: ${originalInfo.title} (${originalInfo.palace})\n`;

    if (changingLines.length > 0) {
      interpretation += `지괘: ${changedInfo.title} (${changedInfo.palace})\n`;
      interpretation += `동효: ${changingLines.map((line) => `${line}효`).join(', ')}\n`;
    } else {
      interpretation += '동효 없음 (정괘)\n';
    }

    interpretation += `세효: ${originalInfo.sehyo}효\n`;
    interpretation += `합충: ${originalInfo.hapchung ?? ''}\n`;

    // 기본적인 해석 제공
    if (changingLines.length === 0) {
      interpretation += '\n[해석] 변화 없는 안정된 상태. 현상 유지.\n';
    } else if (changingLines.length === 1) {
      interpretation += '\n[해석] 한 가지 요소의 변화. 점진적 발전.\n';
    } else if (changingLines.length >= 4) {
      interpretation += '\n[해석] 큰 변화의 시기. 주의 깊은 행동 필요.\n';
    } else {
      interpretation += '\n[해석] 적당한 변화. 균형 잡힌 발전 가능.\n';
    }

    return interpretation;
  }

  /**
   * 괘 번호로 괘 정보 조회
   */
  getHexagramByNumber(hexagramNumber: string): HexagramInfo {
    return this.yukhyoData[hexagramNumber] ?? this.getDefaultHexagramInfo();
  }

  /**
   * 모든 괘 정보 반환
   */
  getAllHexagrams(): Record<string, HexagramInfo> {
    return this.yukhyoData;
  }

  /**
   * 결과를 텍스트로 포매팅
   */
  formatResult(result: YukhyoResult): string {
    let text = '=== 육효 점술 결과 ===\n\n';
    text += `막대기 값: ${result.stick_values.join(', ')}\n`;
    text += `본괘 번호: ${result.hexagram_number}\n`;
    text += `지괘 번호: ${result.changed_hexagram_number}\n\n`;

    text += '효 구성:\n';
    for (let i = 0; i < result.lines.length; i++) {
      const line = result.lines[i];
      if (!line) continue;
      const changeMark = line.changing ? ' (동효)' : '';
      const yinYangMark = line.yin_yang === 1 ? '━━━' : '━ ━';
      text += `${6 - i}효: ${yinYangMark}${changeMark}\n`;
    }

    text += `\n공망: ${result.empty_positions.join(', ')}\n`;
    text += `출공: ${result.starting_empty}\n\n`;

    text += result.interpretation;

    return text;
  }
}

/**
 * 육효 계산기 생성 팩토리 함수
 */
export function createYukhyoCalculator(yukhyoData?: Record<string, HexagramInfo>): YukhyoDivination {
  return new YukhyoDivination(yukhyoData);
}
