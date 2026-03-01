/**
 * Hyungchung Analysis Module (형충파해 분석)
 *
 * This module handles the calculation of conflicts (충), harmonies (합),
 * destructions (파), and harms (해) in Korean four-pillar astrology.
 *
 * 형충파해: Hyung-Chung-Pa-Hae
 * - 삼합 (Samhap): Three-way combinations
 * - 천간합 (Ganhap): Heavenly stem combinations
 * - 삼형살 (Samhyung): Three-way punishments
 * - 자형살 (Jahyung): Self-punishments
 * - 육충살 (Chungsal): Six clashes
 * - 육파살 (Pasal): Six destructions
 * - 육해살 (Haesal): Six harms
 */

/** 형충파해 계산 결과 */
export interface HyungchungResult {
  samhap?: string; // 삼합
  ganhap?: string[]; // 천간합
  samhyung?: string; // 삼형살
  jahyung?: string[]; // 자형살
  chungsal?: string[]; // 육충살
  pasal?: string[]; // 육파살
  haesal?: string[]; // 육해살
}

/**
 * 형충파해 계산 함수
 *
 * @param myYearH - 년간 (heavenly stem of year)
 * @param myMonthH - 월간 (heavenly stem of month)
 * @param myDayH - 일간 (heavenly stem of day)
 * @param myHourH - 시간 (heavenly stem of hour)
 * @param myYearE - 년지 (earthly branch of year)
 * @param myMonthE - 월지 (earthly branch of month)
 * @param myDayE - 일지 (earthly branch of day)
 * @param myHourE - 시지 (earthly branch of hour)
 * @returns 계산 결과
 */
export function calculateHyungchung(
  myYearH: string,
  myMonthH: string,
  myDayH: string,
  myHourH: string,
  myYearE: string,
  myMonthE: string,
  myDayE: string,
  myHourE: string
): HyungchungResult {
  // 천간과 지지 배열 초기화
  const myGan = [myYearH, myMonthH, myDayH, myHourH];
  const myJiji = [myYearE, myMonthE, myDayE, myHourE];

  // 천간 개수 계산 (최적화된 버전)
  const ganCounts: Record<string, number> = {
    甲: 0,
    乙: 0,
    丙: 0,
    丁: 0,
    戊: 0,
    己: 0,
    庚: 0,
    辛: 0,
    壬: 0,
    癸: 0,
  };

  for (const gan of myGan) {
    if (gan && gan in ganCounts && ganCounts[gan] !== undefined) {
      ganCounts[gan]++;
    }
  }

  // 지지 개수 계산 (최적화된 버전)
  const jijiCounts: Record<string, number> = {
    寅: 0,
    巳: 0,
    申: 0,
    丑: 0,
    戌: 0,
    未: 0,
    子: 0,
    卯: 0,
    辰: 0,
    午: 0,
    酉: 0,
    亥: 0,
  };

  const chkPositions: Record<string, number> = {};

  // 지지 이름 매핑 (한자 -> 변수명)
  const jijiNameMap: Record<string, string> = {
    寅: 'in',
    巳: 'sa',
    申: 'sin',
    丑: 'chuk',
    戌: 'sul',
    未: 'mi',
    子: 'ja',
    卯: 'myo',
    辰: 'jin',
    午: 'o',
    酉: 'u',
    亥: 'hae',
  };

  for (let i = 0; i < myJiji.length; i++) {
    const jiji = myJiji[i];
    if (jiji && jiji in jijiCounts && jijiCounts[jiji] !== undefined) {
      jijiCounts[jiji]++;
      const jijiName = jijiNameMap[jiji];
      if (jijiName) {
        chkPositions[jijiName] = i;
      }
    }
  }

  // 기존 변수명 유지 (하위 호환성)
  const myJijiIn = jijiCounts['寅'];
  const myJijiSa = jijiCounts['巳'];
  const myJijiSin = jijiCounts['申'];
  const myJijiChuk = jijiCounts['丑'];
  const myJijiSul = jijiCounts['戌'];
  const myJijiMi = jijiCounts['未'];
  const myJijiJa = jijiCounts['子'];
  const myJijiMyo = jijiCounts['卯'];
  const myJijiJin = jijiCounts['辰'];
  const myJijiO = jijiCounts['午'];
  const myJijiU = jijiCounts['酉'];
  const myJijiHae = jijiCounts['亥'];

  // 결과 딕셔너리
  const result: HyungchungResult = {};

  // 삼합 (三合) 계산
  let samhapTitle = '';
  if (myJijiHae && myJijiMyo && myJijiMi) {
    samhapTitle = '삼합(亥卯未)';
  } else if (myJijiIn && myJijiO && myJijiSul) {
    samhapTitle = '삼합(寅午戌)';
  } else if (myJijiSin && myJijiJa && myJijiJin) {
    samhapTitle = '삼합(申子辰)';
  } else if (myJijiSa && myJijiU && myJijiChuk) {
    samhapTitle = '삼합(巳酉丑)';
  }

  if (samhapTitle) {
    result.samhap = samhapTitle;
  }

  // 천간합 계산 (최적화된 버전)
  const ganhapPairs: Array<[readonly [string, string], string]> = [
    [['甲', '己'], '갑기합(甲己)'],
    [['乙', '庚'], '을경합(乙庚)'],
    [['丙', '辛'], '병신합(丙辛)'],
    [['丁', '壬'], '정임합(丁壬)'],
    [['戊', '癸'], '무계합(戊癸)'],
  ];

  const ganhapTitles: string[] = [];
  for (const [[gan1, gan2], title] of ganhapPairs) {
    const count1 = ganCounts[gan1];
    const count2 = ganCounts[gan2];
    if (count1 !== undefined && count2 !== undefined && count1 > 0 && count2 > 0) {
      ganhapTitles.push(title);
    }
  }

  if (ganhapTitles.length > 0) {
    result.ganhap = ganhapTitles;
  }

  // 삼형살 계산
  let samhyungTitle = '';
  if (myJijiIn && myJijiSa && myJijiSin) {
    samhyungTitle = '삼형살(寅巳申)';
  } else if (myJijiIn && myJijiSa && !myJijiSin) {
    samhyungTitle = '육형살(寅巳)';
  } else if (myJijiIn && !myJijiSa && myJijiSin) {
    samhyungTitle = '육형살(寅申)';
  } else if (!myJijiIn && myJijiSa && myJijiSin) {
    samhyungTitle = '육형살(巳申)';
  }

  if (myJijiChuk && myJijiSul && myJijiMi) {
    samhyungTitle = '삼형살(丑戌未)';
  } else if (myJijiChuk && myJijiSul && !myJijiMi) {
    samhyungTitle = '육형살(丑戌)';
  } else if (myJijiChuk && !myJijiSul && myJijiMi) {
    samhyungTitle = '육형살(丑未)';
  } else if (!myJijiChuk && myJijiSul && myJijiMi) {
    samhyungTitle = '육형살(戌未)';
  }

  if (myJijiJa && myJijiMyo) {
    samhyungTitle = '상형살(相形殺)(子卯)';
  }

  if (samhyungTitle) {
    result.samhyung = samhyungTitle;
  }

  // 자형살 계산 (최적화된 버전)
  const jahyungMap: Record<string, string> = {
    辰: '자형살(辰辰)',
    午: '자형살(午午)',
    酉: '자형살(酉酉)',
    亥: '자형살(亥亥)',
  };

  const jahyungTitles: string[] = [];
  for (const [jiji, title] of Object.entries(jahyungMap)) {
    const count = jijiCounts[jiji];
    if (count !== undefined && count > 1) {
      jahyungTitles.push(title);
    }
  }

  if (jahyungTitles.length > 0) {
    result.jahyung = jahyungTitles;
  }

  // 육충살, 육파살, 육해살 계산 (최적화된 버전)
  // 지지 쌍들과 해당하는 살 정의
  const salPairs: Record<string, Array<[readonly [string, string], string]>> = {
    chungsal: [
      [['子', '午'], '육충(子午)'],
      [['丑', '未'], '육충(丑未)'],
      [['寅', '申'], '육충(寅申)'],
      [['卯', '酉'], '육충(卯酉)'],
      [['辰', '戌'], '육충(辰戌)'],
      [['巳', '亥'], '육충(巳亥)'],
    ],
    pasal: [
      [['子', '酉'], '육파(子酉)'],
      [['丑', '辰'], '육파(丑辰)'],
      [['寅', '亥'], '육파(寅亥)'],
      [['卯', '午'], '육파(卯午)'],
      [['未', '戌'], '육파(未戌)'],
      [['巳', '申'], '육파(巳申)'],
    ],
    haesal: [
      [['子', '未'], '육해(子未)'],
      [['丑', '午'], '육해(丑午)'],
      [['寅', '巳'], '육해(寅巳)'],
      [['卯', '辰'], '육해(卯辰)'],
      [['申', '亥'], '육해(申亥)'],
      [['酉', '戌'], '육해(酉戌)'],
    ],
  };

  // 각 살들을 계산
  for (const [salType, pairs] of Object.entries(salPairs)) {
    const salTitles: string[] = [];
    for (const [[jiji1, jiji2], title] of pairs) {
      const count1 = jijiCounts[jiji1];
      const count2 = jijiCounts[jiji2];
      if (count1 !== undefined && count2 !== undefined && count1 > 0 && count2 > 0) {
        salTitles.push(title);
      }
    }

    if (salTitles.length > 0) {
      result[salType as keyof HyungchungResult] = salTitles as never;
    }
  }

  return result;
}

/**
 * Format hyungchung result as a readable string
 */
export function formatHyungchungResult(result: HyungchungResult): string {
  const lines: string[] = ['=== 형충파해 계산 결과 ==='];

  if (result.samhap) {
    lines.push(`삼합: ${result.samhap}`);
  }

  if (result.ganhap && result.ganhap.length > 0) {
    lines.push(`천간합: ${result.ganhap.join(', ')}`);
  }

  if (result.samhyung) {
    lines.push(`삼형살: ${result.samhyung}`);
  }

  if (result.jahyung && result.jahyung.length > 0) {
    lines.push(`자형살: ${result.jahyung.join(', ')}`);
  }

  if (result.chungsal && result.chungsal.length > 0) {
    lines.push(`육충살: ${result.chungsal.join(', ')}`);
  }

  if (result.pasal && result.pasal.length > 0) {
    lines.push(`육파살: ${result.pasal.join(', ')}`);
  }

  if (result.haesal && result.haesal.length > 0) {
    lines.push(`육해살: ${result.haesal.join(', ')}`);
  }

  if (lines.length === 1) {
    lines.push('형충파해 없음');
  }

  return lines.join('\n');
}
