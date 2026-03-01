/**
 * Common utility functions for the saju-core-lib package.
 */

/**
 * Extract hanja (Chinese characters) from formatted string like '갑(甲)'.
 */
export function extractHanja(formattedStr: string): string {
  if (!formattedStr) {
    return formattedStr;
  }

  const match = /\(([^)]+)\)/.exec(formattedStr);
  return match !== null && match[1] !== undefined ? match[1] : formattedStr;
}

/**
 * Extract Korean character from formatted string like '갑(甲)'.
 */
export function extractKorean(formattedStr: string): string {
  if (!formattedStr) {
    return formattedStr;
  }

  if (formattedStr.includes('(')) {
    const parts = formattedStr.split('(');
    return parts[0] ?? '';
  }

  const match = /^([가-힣]+)/.exec(formattedStr);
  return match !== null && match[1] !== undefined ? match[1] : formattedStr;
}

/**
 * Normalize gender input to standard format ('M' or 'F').
 */
export function normalizeGender(gender: string): string {
  const genderLower = gender ? gender.toLowerCase() : '';

  if (['m', 'male', '남', '남자', '남성'].includes(genderLower)) {
    return 'M';
  } else if (['f', 'female', '여', '여자', '여성'].includes(genderLower)) {
    return 'F';
  }

  return gender ? gender.toUpperCase() : 'M';
}

/**
 * Format a pillar component for display, e.g., '갑(甲)'.
 */
export function formatPillarDisplay(korean: string, hanja: string): string {
  return `${korean}(${hanja})`;
}
