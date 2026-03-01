/**
 * 12신살 타입 정의
 * Types and Enums for 12 Spirit Killers
 */

/** 12 Earthly Branches */
export const TWELVE_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;

/** 10 Heavenly Stems */
export const TEN_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;

/** 12신살 종류 */
export enum SinsalType {
  GEOP = '겁살(劫殺)',
  JAE = '재살(災殺)',
  CHEON = '천살(天殺)',
  JI = '지살(地殺)',
  DOHWA = '도화살(桃花殺)',
  WOL = '월살(月殺)',
  MANGSIN = '망신살(亡身殺)',
  JANGSEONG = '장성살(將星殺)',
  BANAN = '반안살(攀鞍殺)',
  YEOKMA = '역마살(驛馬殺)',
  YUKHAE = '육해살(六害殺)',
  HWAGAE = '화개살(華蓋殺)',
}

/** 길신 종류 */
export enum GilsinType {
  CHENEUL_GWIIN = '천을귀인(天乙貴人)',
  CHENJU_GWIIN = '천주귀인(天廚貴人)',
  CHENGUAN_GWIIN = '천관귀인(天官貴人)',
  CHENBOK_GWIIN = '천복귀인(天福貴人)',
  TAEGUK_GWIIN = '태극귀인(太極貴人)',
  WOLDUK_GWIIN = '월덕귀인(月德貴人)',
  MUNCHANG = '문창(文昌)',
  MUNGOK = '문곡(文曲)',
  GUANGUI_HAKGWAN = '관귀학관(官貴學館)',
  AMROK = '암록(暗祿)',
  GUMROK = '금여록(金與祿)',
  HAKDANG = '학당(學堂)',
  CHENE = '천의(天醫)',
  GUEGANGSAL = '괴강살(魁强殺)',
  BEKHOSAL = '백호살(白虎殺)',
  WONJINSAL = '원진살(怨嗔殺)',
  GUIMUNSAL = '귀문관살(鬼門關)',
  HONGSAL = '홍염살(紅艶殺)',
  YANGINSAL = '양인살(羊刃殺)',
  GONGMANGSAL = '공망살(空亡殺)',
  SANGMUNSAL = '상문살(喪門殺)',
  SUOKSAL = '수옥살(囚獄殺)',
  GEPGAKSAL = '급각살(急脚殺)',
  GOSINSAL = '상처살(喪妻殺)', // 남성용
  GUASUKSAL = '상부살(喪夫殺)', // 여성용
}

/** 삼합 그룹 */
export enum SamsapGroup {
  SA_YU_CHUK = 'SA_YU_CHUK', // 금국
  SHIN_JA_JIN = 'SHIN_JA_JIN', // 수국
  HAE_MYO_MI = 'HAE_MYO_MI', // 목국
  IN_O_SUL = 'IN_O_SUL', // 화국
}

/** 신살 계산 입력 데이터 */
export interface SinsalInput {
  year_h: string; // 년간
  month_h: string; // 월간
  day_h: string; // 일간
  hour_h: string; // 시간
  year_e: string; // 년지
  month_e: string; // 월지
  day_e: string; // 일지
  hour_e: string; // 시지
  gender?: string; // 성별
}

/** 신살 계산기 기본 인터페이스 */
export interface BaseSinsalCalculator {
  calculate(inputData: SinsalInput): Record<string, string | null>;
}
