/**
 * 12신살 유틸리티 함수들
 * Utility functions for 12 Spirit Killers
 */

import { TWELVE_BRANCHES, TEN_STEMS, SamsapGroup } from './types';
import { SAMSAP_GROUP_VALUES, SINSAL_MAPPING } from './mappings';

/** 지지가 속한 삼합 그룹을 반환 */
export function getSamsapGroup(branch: string): SamsapGroup | null {
  for (const [group, values] of Object.entries(SAMSAP_GROUP_VALUES)) {
    if (values.includes(branch)) {
      return group as SamsapGroup;
    }
  }
  return null;
}

/** 두 지지 사이의 신살을 계산 */
export function calculateSinsal(baseBranch: string, targetBranch: string): string | null {
  const baseGroup = getSamsapGroup(baseBranch);
  if (!baseGroup) {
    return null;
  }

  try {
    const targetIndex = TWELVE_BRANCHES.indexOf(targetBranch as (typeof TWELVE_BRANCHES)[number]);
    if (targetIndex === -1) {
      return null;
    }

    const sinsalList = SINSAL_MAPPING[baseGroup];
    return sinsalList[targetIndex] ?? null;
  } catch (error) {
    // Invalid branch combination - return null for invalid inputs
    console.debug('Invalid branch combination in calculateSinsal:', { baseBranch, targetBranch, error });
    return null;
  }
}

/** 12신살 계산 함수 */
export function calculate12Sinsal(
  myDayE: string,
  myMonthE: string,
  myYearE: string,
  myHourE: string
): Record<string, string | null> {
  return {
    월살: calculateSinsal(myDayE, myMonthE),
    년살: calculateSinsal(myDayE, myYearE),
    시살: calculateSinsal(myDayE, myHourE),
    일살: calculateSinsal(myYearE, myDayE),
  };
}

/** 12신살의 의미를 반환하는 함수 */
export function getSinsalMeanings(): Record<string, string> {
  return {
    '겁살(劫殺)': '재물을 잃거나 도난을 당할 수 있는 살',
    '재살(災殺)': '재앙이나 질병을 당할 수 있는 살',
    '천살(天殺)': '하늘의 재앙을 받을 수 있는 살',
    '지살(地殺)': '땅의 재앙을 받을 수 있는 살',
    '도화살(桃花殺)': '이성 관계로 인한 문제가 생길 수 있는 살',
    '월살(月殺)': '달의 재앙을 받을 수 있는 살',
    '망신살(亡身殺)': '몸을 잃거나 명예를 잃을 수 있는 살',
    '장성살(將星殺)': '장군의 별로 권위와 리더십을 나타내는 길신',
    '반안살(攀鞍殺)': '말 안장에 오르는 살로 승진과 출세를 의미',
    '역마살(驛馬殺)': '역마의 살로 이동과 변화를 나타냄',
    '육해살(六害殺)': '육해의 살로 해로움을 받을 수 있는 살',
    '화개살(華蓋殺)': '화개의 살로 예술성과 종교성을 나타냄',
    '천을귀인(天乙貴人)': '가장 길한 길신으로 귀인의 도움을 받고 화를 길로 바꾸는 힘',
    '천주귀인(天廚貴人)': '음식과 의식주에 복이 있고 생활이 풍족한 길신',
    '천관귀인(天官貴人)': '관직과 명예에 복이 있고 사회적 지위가 높아지는 길신',
    '천복귀인(天福貴人)': '복록과 장수에 복이 있고 평안한 삶을 누리는 길신',
    '상문살(喪門殺)': '죽음과 상(喪)을 나타내는 살로 슬픔과 이별을 의미',
    '수옥살(囚獄殺)': '감옥과 구속을 나타내는 살로 자유를 잃거나 속박당할 수 있음',
    '급각살(急脚殺)': '급하고 조급함을 나타내는 살로 성급한 행동으로 실패할 수 있음',
    '상처살(喪妻殺)': '남성의 아내를 잃을 수 있는 살로 부부간의 이별이나 갈등을 의미',
    '상부살(喪夫殺)': '여성의 남편을 잃을 수 있는 살로 부부간의 이별이나 갈등을 의미',
  };
}

/** 지지 입력값의 유효성을 검증 */
export function validateBranches(...branches: string[]): boolean {
  return branches.every((branch) => TWELVE_BRANCHES.includes(branch as (typeof TWELVE_BRANCHES)[number]));
}

/** 천간 입력값의 유효성을 검증 */
export function validateStems(...stems: string[]): boolean {
  return stems.every((stem) => TEN_STEMS.includes(stem as (typeof TEN_STEMS)[number]));
}

/** 사주 입력값 전체의 유효성을 검증 */
export function validateSajuInput(dayH: string, dayE: string, monthE: string, yearE: string, hourE: string): boolean {
  return validateStems(dayH) && validateBranches(dayE, monthE, yearE, hourE);
}
