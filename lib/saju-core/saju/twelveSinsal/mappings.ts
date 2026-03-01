/**
 * 12신살 매핑 데이터
 * Mapping data for 12 Spirit Killers
 */

import { SinsalType, SamsapGroup } from './types';

/** 삼합 그룹 매핑 */
export const SAMSAP_GROUP_VALUES: Readonly<Record<SamsapGroup, readonly string[]>> = {
  [SamsapGroup.SA_YU_CHUK]: ['사', '유', '축'],
  [SamsapGroup.SHIN_JA_JIN]: ['신', '자', '진'],
  [SamsapGroup.HAE_MYO_MI]: ['해', '묘', '미'],
  [SamsapGroup.IN_O_SUL]: ['인', '오', '술'],
};

/** 천을귀인 매핑 (일간 기준) */
export const CHENEUL_GWIIN_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['축', '미'],
  을: ['자', '신'],
  병: ['유', '해'],
  정: ['유', '해'],
  무: ['축', '미'],
  기: ['자', '신'],
  경: ['축', '미'],
  신: ['인', '오'],
  임: ['묘', '사'],
  계: ['묘', '사'],
};

/** 천주귀인 매핑 (일간 기준) */
export const CHENJU_GWIIN_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['사'],
  을: ['오'],
  병: ['사'],
  정: ['오'],
  무: ['신'],
  기: ['유'],
  경: ['해'],
  신: ['자'],
  임: ['인'],
  계: ['묘'],
};

/** 천관귀인 매핑 (일간 기준) */
export const CHENGUAN_GWIIN_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['미'],
  을: ['진'],
  병: ['사'],
  정: ['인'],
  무: ['묘'],
  기: ['유'],
  경: ['해'],
  신: ['신'],
  임: ['유'],
  계: ['오'],
};

/** 천복귀인 매핑 (일간 기준) */
export const CHENBOK_GWIIN_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['유'],
  을: ['신'],
  병: ['자'],
  정: ['해'],
  무: ['묘'],
  기: ['인'],
  경: ['오'],
  신: ['사'],
  임: ['오'],
  계: ['사'],
};

/** 태극귀인 매핑 (일간 기준) */
export const TAEGUK_GWIIN_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['자', '오'],
  을: ['자', '오'],
  병: ['묘', '유'],
  정: ['묘', '유'],
  무: ['진', '술', '축', '미'],
  기: ['진', '술', '축', '미'],
  경: ['인', '해'],
  신: ['인', '해'],
  임: ['사', '신'],
  계: ['사', '신'],
};

/** 월덕귀인 매핑 (월지 기준으로 해당 천간 찾기) */
export const WOLDUK_GWIIN_MAPPING: Readonly<Record<string, string>> = {
  해: '갑',
  묘: '갑',
  미: '갑',
  인: '병',
  오: '병',
  술: '병',
  사: '경',
  유: '경',
  축: '경',
  신: '임',
  자: '임',
  진: '임',
};

/** 문창성 매핑 (일간 기준) */
export const MUNCHANG_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['사'],
  을: ['오'],
  병: ['신'],
  정: ['유'],
  무: ['신'],
  기: ['유'],
  경: ['해'],
  신: ['자'],
  임: ['인'],
  계: ['묘'],
};

/** 문곡성 매핑 (일간 기준) */
export const MUNGOK_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['해'],
  을: ['자'],
  병: ['인'],
  정: ['묘'],
  무: ['인'],
  기: ['묘'],
  경: ['사'],
  신: ['오'],
  임: ['신'],
  계: ['유'],
};

/** 관귀학관 매핑 (일간 기준) */
export const GUANGUI_HAKGWAN_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['사'],
  을: ['사'],
  병: ['신'],
  정: ['신'],
  무: ['해'],
  기: ['해'],
  경: ['인'],
  신: ['인'],
  임: ['신'],
  계: ['신'],
};

/** 암록 매핑 (일간 기준) */
export const AMROK_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['해'],
  을: ['술'],
  병: ['신'],
  정: ['미'],
  무: ['신'],
  기: ['미'],
  경: ['사'],
  신: ['진'],
  임: ['인'],
  계: ['축'],
};

/** 금여록 매핑 (일간 기준) */
export const GUMROK_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['진'],
  을: ['사'],
  병: ['미'],
  정: ['신'],
  무: ['미'],
  기: ['신'],
  경: ['술'],
  신: ['해'],
  임: ['축'],
  계: ['인'],
};

/** 학당 매핑 (일간 기준) */
export const HAKDANG_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['해'],
  을: ['오'],
  병: ['인'],
  정: ['유'],
  무: ['인'],
  기: ['유'],
  경: ['사'],
  신: ['자'],
  임: ['신'],
  계: ['묘'],
};

/** 천의 매핑 (월지 기준) */
export const CHENE_MAPPING: Readonly<Record<string, string>> = {
  인: '축',
  묘: '인',
  진: '묘',
  사: '진',
  오: '사',
  미: '오',
  신: '미',
  유: '신',
  술: '유',
  해: '술',
  자: '해',
  축: '자',
};

/** 괴강살 매핑 (간지 조합) */
export const GUEGANGSAL_MAPPING = ['임진', '임술', '무술', '경진', '경술'] as const;

/** 백호살 매핑 (간지 조합) */
export const BEKHOSAL_MAPPING = ['갑진', '병술', '정축', '무진', '임술', '계축'] as const;

/** 원진살 매핑 (지지 상충 관계) */
export const WONJINSAL_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['자', '미'],
  ['축', '오'],
  ['인', '유'],
  ['묘', '신'],
  ['진', '해'],
  ['사', '술'],
];

/** 귀문관살 매핑 */
export const GUIMUNSAL_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['자', '유'],
  ['축', '오'],
  ['인', '미'],
  ['묘', '신'],
  ['진', '해'],
  ['사', '술'],
];

/** 홍염살 매핑 (일간 기준) */
export const HONGSAL_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['오'],
  을: ['신'],
  병: ['인'],
  정: ['미'],
  무: ['진'],
  기: ['진'],
  경: ['술'],
  신: ['유'],
  임: ['자'],
  계: ['신'],
};

/** 양인살 매핑 (일간 기준) */
export const YANGINSAL_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑: ['묘'],
  병: ['축'],
  무: ['오'],
  경: ['유'],
  임: ['자'],
};

/** 공망 매핑 (일주 기준) */
export const GONGMANG_MAPPING: Readonly<Record<string, readonly string[]>> = {
  갑자: ['술', '해'],
  을축: ['술', '해'],
  병인: ['술', '해'],
  정묘: ['술', '해'],
  무진: ['술', '해'],
  기사: ['술', '해'],
  경오: ['술', '해'],
  신미: ['술', '해'],
  임신: ['술', '해'],
  계유: ['술', '해'],
  갑술: ['신', '유'],
  을해: ['신', '유'],
  병자: ['신', '유'],
  정축: ['신', '유'],
  무인: ['신', '유'],
  기묘: ['신', '유'],
  경진: ['신', '유'],
  신사: ['신', '유'],
  임오: ['신', '유'],
  계미: ['신', '유'],
  갑신: ['오', '미'],
  을유: ['오', '미'],
  병술: ['오', '미'],
  정해: ['오', '미'],
  무자: ['오', '미'],
  기축: ['오', '미'],
  경인: ['오', '미'],
  신묘: ['오', '미'],
  임진: ['오', '미'],
  계사: ['오', '미'],
  갑오: ['진', '사'],
  을미: ['진', '사'],
  병신: ['진', '사'],
  정유: ['진', '사'],
  무술: ['진', '사'],
  기해: ['진', '사'],
  경자: ['진', '사'],
  신축: ['진', '사'],
  임인: ['진', '사'],
  계묘: ['진', '사'],
  갑진: ['인', '묘'],
  을사: ['인', '묘'],
  병오: ['인', '묘'],
  정미: ['인', '묘'],
  무신: ['인', '묘'],
  기유: ['인', '묘'],
  경술: ['인', '묘'],
  신해: ['인', '묘'],
  임자: ['인', '묘'],
  계축: ['인', '묘'],
  갑인: ['자', '축'],
  을묘: ['자', '축'],
  병진: ['자', '축'],
  정사: ['자', '축'],
  무오: ['자', '축'],
  기미: ['자', '축'],
  경신: ['자', '축'],
  신유: ['자', '축'],
  임술: ['자', '축'],
  계해: ['자', '축'],
};

/** 상문살 매핑 (일지 기준) */
export const SANGMUNSAL_MAPPING: Readonly<Record<string, string>> = {
  자: '인',
  축: '묘',
  인: '진',
  묘: '사',
  진: '오',
  사: '미',
  오: '신',
  미: '유',
  신: '술',
  유: '해',
  술: '자',
  해: '축',
};

/** 수옥살 매핑 (일지 기준) */
export const SUOKSAL_MAPPING: Readonly<Record<string, string>> = {
  자: '진',
  축: '사',
  인: '오',
  묘: '미',
  진: '신',
  사: '유',
  오: '술',
  미: '해',
  신: '자',
  유: '축',
  술: '인',
  해: '묘',
};

/** 급각살 매핑 (월지 기준) */
export const GEPGAKSAL_MAPPING: Readonly<Record<string, string>> = {
  인: '사',
  묘: '사',
  진: '사',
  사: '신',
  오: '신',
  미: '신',
  신: '해',
  유: '해',
  술: '해',
  해: '인',
  자: '인',
  축: '인',
};

/** 고신살 매핑 (년지와 월지 관계) */
export const GOSINSAL_MAPPING: Readonly<Record<string, string>> = {
  자: '사',
  축: '오',
  인: '미',
  묘: '신',
  진: '유',
  사: '술',
  오: '해',
  미: '자',
  신: '축',
  유: '인',
  술: '묘',
  해: '진',
};

/** 과숙살 매핑 (년지와 월지 관계) */
export const GUASUKSAL_MAPPING: Readonly<Record<string, string>> = {
  자: '사',
  축: '오',
  인: '미',
  묘: '신',
  진: '유',
  사: '술',
  오: '해',
  미: '자',
  신: '축',
  유: '인',
  술: '묘',
  해: '진',
};

/** 12신살 순서 (삼합 그룹별 매핑) */
export const SINSAL_MAPPING: Readonly<Record<SamsapGroup, readonly SinsalType[]>> = {
  [SamsapGroup.SA_YU_CHUK]: [
    SinsalType.GEOP,
    SinsalType.JAE,
    SinsalType.CHEON,
    SinsalType.JI,
    SinsalType.DOHWA,
    SinsalType.WOL,
    SinsalType.MANGSIN,
    SinsalType.JANGSEONG,
    SinsalType.BANAN,
    SinsalType.YEOKMA,
    SinsalType.YUKHAE,
    SinsalType.HWAGAE,
  ],
  [SamsapGroup.SHIN_JA_JIN]: [
    SinsalType.YEOKMA,
    SinsalType.YUKHAE,
    SinsalType.HWAGAE,
    SinsalType.GEOP,
    SinsalType.JAE,
    SinsalType.CHEON,
    SinsalType.JI,
    SinsalType.DOHWA,
    SinsalType.WOL,
    SinsalType.MANGSIN,
    SinsalType.JANGSEONG,
    SinsalType.BANAN,
  ],
  [SamsapGroup.HAE_MYO_MI]: [
    SinsalType.MANGSIN,
    SinsalType.JANGSEONG,
    SinsalType.BANAN,
    SinsalType.YEOKMA,
    SinsalType.YUKHAE,
    SinsalType.HWAGAE,
    SinsalType.GEOP,
    SinsalType.JAE,
    SinsalType.CHEON,
    SinsalType.JI,
    SinsalType.DOHWA,
    SinsalType.WOL,
  ],
  [SamsapGroup.IN_O_SUL]: [
    SinsalType.JI,
    SinsalType.DOHWA,
    SinsalType.WOL,
    SinsalType.MANGSIN,
    SinsalType.JANGSEONG,
    SinsalType.BANAN,
    SinsalType.YEOKMA,
    SinsalType.YUKHAE,
    SinsalType.HWAGAE,
    SinsalType.GEOP,
    SinsalType.JAE,
    SinsalType.CHEON,
  ],
};
