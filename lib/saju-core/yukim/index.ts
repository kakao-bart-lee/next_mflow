/**
 * Yukim (역학) Module
 * Korean Yi Ching divination methods
 */

export {
  calculateYukimJungdan,
  timeToBranch,
  rotateBranches,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  BRANCH_ORDER,
  BRANCH_INDEX,
  VISIT_MAP,
  WHAT_MAP as JUNGDAN_WHAT_MAP,
  type YukimJungdanResult,
} from './j045';

export {
  calculateYukimJidu,
  WHAT_MAP as JIDU_WHAT_MAP,
  TEMP_GUK_MAP,
  JINHA_MAP,
  BASE_CODES,
  type YukimJiduResult,
} from './j052';
